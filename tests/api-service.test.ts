import {describe, expect, it} from 'vitest';
import {createInquiryApi, type InquiryRepository} from '@/server/api-service';
import type {InquiryInput} from '@/lib/contracts';

const validInquiry: InquiryInput = {
  name: 'Project lead', businessEmail: 'buyer@example.com', company: 'Example', market: 'EU',
  category: 'airless', sku: 'GT-AIRLESS-030', configuration: '', quantity: '10000', budget: 'Review',
  launchDate: '2027 Q1', productGoal: 'serum packaging', packagingPreference: 'airless pump',
  certificationConstraints: '', notes: '', privacyConsent: true
};

function memoryRepository(): InquiryRepository {
  const records = new Map<string, Awaited<ReturnType<InquiryRepository['get']>>>();
  const idempotency = new Map<string, string>();
  return {
    async create(record) { records.set(record.id, record); },
    async get(id) { return records.get(id); },
    async findByIdempotency(keyHash) { return idempotency.get(keyHash); },
    async bindIdempotency(keyHash, id) { idempotency.set(keyHash, id); },
    async update(record) { records.set(record.id, record); }
  };
}

describe('inquiry API service', () => {
  it('creates an asynchronous inquiry and never returns stored personal data', async () => {
    const api = createInquiryApi({repository: memoryRepository(), now: () => 1_700_000_000_000});
    const response = await api.create({body: validInquiry, idempotencyKey: 'create-123456789', origin: 'https://site.example'});

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({status: 'queued'});
    expect(response.body).toHaveProperty('accessToken');
    expect(JSON.stringify(response.body)).not.toContain('buyer@example.com');
  });

  it('returns the same public job for a duplicate idempotency key without issuing another token', async () => {
    const api = createInquiryApi({repository: memoryRepository(), now: () => 1_700_000_000_000});
    const first = await api.create({body: validInquiry, idempotencyKey: 'create-123456789', origin: 'https://site.example'});
    const duplicate = await api.create({body: validInquiry, idempotencyKey: 'create-123456789', origin: 'https://site.example'});

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.id).toBe(first.body.id);
    expect(duplicate.body).not.toHaveProperty('accessToken');
  });

  it('requires the matching bearer token to read status', async () => {
    const api = createInquiryApi({repository: memoryRepository(), now: () => 1_700_000_000_000});
    const created = await api.create({body: validInquiry, idempotencyKey: 'create-123456789', origin: 'https://site.example'});

    expect((await api.status(created.body.id as string, 'wrong-token')).status).toBe(404);
    expect((await api.status(created.body.id as string, created.body.accessToken as string)).status).toBe(200);
  });

  it('rejects invalid payloads without reflecting validation details or personal data', async () => {
    const api = createInquiryApi({repository: memoryRepository(), now: () => 1_700_000_000_000});
    const response = await api.create({body: {...validInquiry, businessEmail: 'secret-invalid'}, idempotencyKey: 'create-123456789', origin: 'https://site.example'});

    expect(response).toEqual({status: 400, body: {code: 'INVALID_REQUEST'}});
  });
});
