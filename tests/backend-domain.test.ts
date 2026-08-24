import {describe, expect, it} from 'vitest';
import {
  approveEmail,
  createAccessCredential,
  createInquiryJob,
  registerIdempotencyKey,
  retryJob,
  transitionJob,
  verifyAccessCredential
} from '@/server/domain';

describe('public inquiry access', () => {
  it('stores only a token hash and verifies the matching token', () => {
    const credential = createAccessCredential('inquiry-123', 'fixed-test-token');

    expect(credential.tokenHash).not.toContain('fixed-test-token');
    expect(verifyAccessCredential(credential, 'fixed-test-token')).toBe(true);
    expect(verifyAccessCredential(credential, 'wrong-token')).toBe(false);
  });
});

describe('inquiry job lifecycle', () => {
  it('allows only explicit state transitions', () => {
    const queued = createInquiryJob('inquiry-123', 1_700_000_000_000);
    const processing = transitionJob(queued, 'processing', 1_700_000_001_000);
    const completed = transitionJob(processing, 'completed', 1_700_000_002_000);

    expect(completed.status).toBe('completed');
    expect(() => transitionJob(completed, 'processing', 1_700_000_003_000)).toThrow('Invalid job transition');
  });

  it('permits one retry only from retryable_error', () => {
    const queued = createInquiryJob('inquiry-123', 1_700_000_000_000);
    const processing = transitionJob(queued, 'processing', 1_700_000_001_000);
    const errored = transitionJob(processing, 'retryable_error', 1_700_000_002_000);
    const retried = retryJob(errored, 1_700_000_003_000);

    expect(retried).toMatchObject({status: 'queued', retryCount: 1});
    expect(() => retryJob(retried, 1_700_000_004_000)).toThrow('Job is not retryable');
  });
});

describe('email approval gate', () => {
  it('requires an authorised reviewer and blocks high-risk drafts', () => {
    const safeDraft = {status: 'pending_review' as const, body: 'Thank you. We will review your request.'};
    expect(approveEmail(safeDraft, {reviewerId: 'sales-1', authorised: true})).toMatchObject({status: 'approved'});
    expect(() => approveEmail(safeDraft, {reviewerId: 'sales-2', authorised: false})).toThrow('Reviewer is not authorised');

    const riskyDraft = {status: 'pending_review' as const, body: 'The price is USD 1 and delivery is tomorrow.'};
    expect(() => approveEmail(riskyDraft, {reviewerId: 'sales-1', authorised: true})).toThrow('Draft requires commercial review');
  });
});

describe('idempotency registration', () => {
  it('returns the original inquiry for an unexpired duplicate key', () => {
    const first = registerIdempotencyKey(undefined, 'idem-1234567890', 'inquiry-1', 1000);
    const duplicate = registerIdempotencyKey(first.record, 'idem-1234567890', 'inquiry-2', 2000);

    expect(first.duplicate).toBe(false);
    expect(duplicate).toEqual({duplicate: true, inquiryId: 'inquiry-1', record: first.record});
  });

  it('rejects malformed keys', () => {
    expect(() => registerIdempotencyKey(undefined, 'short', 'inquiry-1', 1000)).toThrow('Invalid idempotency key');
  });
});
