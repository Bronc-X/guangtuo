import {createHash, timingSafeEqual} from 'node:crypto';
import type {EmailStatus, JobStatus} from '@/lib/contracts';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const commercialRisk = /price|pricing|discount|moq|lead[ -]?time|deliver(?:y|ed)|payment|bank|contract|refund|legal|certif|claim|价格|报价|折扣|起订|交期|付款|银行|合同|退款|法律|认证|功效/i;

export type AccessCredential = {
  inquiryId: string;
  tokenHash: string;
};

export type InquiryJob = {
  inquiryId: string;
  status: JobStatus;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
};

export type IdempotencyRecord = {
  keyHash: string;
  inquiryId: string;
  expiresAt: number;
};

const transitions: Record<JobStatus, readonly JobStatus[]> = {
  queued: ['processing', 'failed'],
  processing: ['completed', 'retryable_error', 'failed'],
  completed: [],
  retryable_error: ['queued', 'failed'],
  failed: []
};

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function createAccessCredential(inquiryId: string, token: string): AccessCredential {
  if (token.length < 12) throw new Error('Access token is too short');
  return {inquiryId, tokenHash: hash(`${inquiryId}:${token}`)};
}

export function verifyAccessCredential(credential: AccessCredential, token: string): boolean {
  const candidate = Buffer.from(hash(`${credential.inquiryId}:${token}`), 'hex');
  const expected = Buffer.from(credential.tokenHash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createInquiryJob(inquiryId: string, now = Date.now()): InquiryJob {
  return {inquiryId, status: 'queued', retryCount: 0, createdAt: now, updatedAt: now};
}

export function transitionJob(job: InquiryJob, nextStatus: JobStatus, now = Date.now()): InquiryJob {
  if (!transitions[job.status].includes(nextStatus)) throw new Error('Invalid job transition');
  return {...job, status: nextStatus, updatedAt: now};
}

export function retryJob(job: InquiryJob, now = Date.now()): InquiryJob {
  if (job.status !== 'retryable_error') throw new Error('Job is not retryable');
  if (job.retryCount >= 2) return transitionJob(job, 'failed', now);
  return {...transitionJob(job, 'queued', now), retryCount: job.retryCount + 1};
}

export function approveEmail(
  draft: {status: EmailStatus; body: string},
  reviewer: {reviewerId: string; authorised: boolean}
): {status: 'approved'; approvedBy: string} {
  if (!reviewer.authorised) throw new Error('Reviewer is not authorised');
  if (draft.status !== 'pending_review') throw new Error('Draft is not pending review');
  if (commercialRisk.test(draft.body)) throw new Error('Draft requires commercial review');
  return {status: 'approved', approvedBy: reviewer.reviewerId};
}

export function registerIdempotencyKey(
  existing: IdempotencyRecord | undefined,
  key: string,
  inquiryId: string,
  now = Date.now()
): {duplicate: boolean; inquiryId: string; record: IdempotencyRecord} {
  if (!/^[A-Za-z0-9._:-]{12,128}$/.test(key)) throw new Error('Invalid idempotency key');
  const keyHash = hash(key);
  if (existing && existing.keyHash === keyHash && existing.expiresAt > now) {
    return {duplicate: true, inquiryId: existing.inquiryId, record: existing};
  }
  const record = {keyHash, inquiryId, expiresAt: now + IDEMPOTENCY_TTL_MS};
  return {duplicate: false, inquiryId, record};
}
