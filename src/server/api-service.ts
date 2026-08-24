import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {inquirySchema, type EmailDraft, type InquiryInput, type JobStatus, type Proposal} from '@/lib/contracts';
import {createAccessCredential, createInquiryJob, verifyAccessCredential, type AccessCredential} from '@/server/domain';

export type InquiryRecord = {
  id: string;
  input: InquiryInput;
  access: AccessCredential;
  status: JobStatus;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  locale?: 'en' | 'zh';
  proposal?: Proposal;
  email?: EmailDraft;
};

export type InquiryRepository = {
  create(record: InquiryRecord): Promise<void>;
  get(id: string): Promise<InquiryRecord | undefined>;
  findByIdempotency(keyHash: string): Promise<string | undefined>;
  bindIdempotency(keyHash: string, id: string): Promise<void>;
  update(record: InquiryRecord): Promise<void>;
};

type PublicResponse = {status: number; body: Record<string, unknown>};

function publicJob(record: InquiryRecord): Record<string, unknown> {
  return {id: record.id, status: record.status, retryCount: record.retryCount, updatedAt: record.updatedAt};
}

function keyHash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function createInquiryApi(dependencies: {repository: InquiryRepository; now?: () => number}) {
  const now = dependencies.now ?? Date.now;

  return {
    async create(request: {body: unknown; idempotencyKey: string; origin: string}): Promise<PublicResponse> {
      const parsed = inquirySchema.safeParse(request.body);
      if (!parsed.success || !/^[A-Za-z0-9._:-]{12,128}$/.test(request.idempotencyKey)) {
        return {status: 400, body: {code: 'INVALID_REQUEST'}};
      }

      const hashedKey = keyHash(request.idempotencyKey);
      const duplicateId = await dependencies.repository.findByIdempotency(hashedKey);
      if (duplicateId) {
        const duplicate = await dependencies.repository.get(duplicateId);
        return duplicate ? {status: 200, body: publicJob(duplicate)} : {status: 409, body: {code: 'REQUEST_CONFLICT'}};
      }

      const id = randomUUID();
      const accessToken = randomBytes(32).toString('base64url');
      const job = createInquiryJob(id, now());
      const record: InquiryRecord = {
        id,
        input: parsed.data,
        access: createAccessCredential(id, accessToken),
        status: job.status,
        retryCount: job.retryCount,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
      await dependencies.repository.create(record);
      await dependencies.repository.bindIdempotency(hashedKey, id);
      return {status: 202, body: {...publicJob(record), accessToken}};
    },

    async status(id: string, token: string): Promise<PublicResponse> {
      const record = await dependencies.repository.get(id);
      if (!record || !verifyAccessCredential(record.access, token)) {
        return {status: 404, body: {code: 'NOT_FOUND'}};
      }
      return {status: 200, body: publicJob(record)};
    }
  };
}
