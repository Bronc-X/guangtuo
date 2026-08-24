import {describe, expect, it, vi} from 'vitest';
import {createLambdaHandler} from '@/server/lambda-handler';
import type {InquiryRepository} from '@/server/api-service';

function repository(): InquiryRepository {
  const records = new Map<string, Awaited<ReturnType<InquiryRepository['get']>>>();
  const keys = new Map<string, string>();
  return {async create(value) { records.set(value.id, value); }, async get(id) { return records.get(id); }, async findByIdempotency(key) { return keys.get(key); }, async bindIdempotency(key, id) { keys.set(key, id); }, async update(value) { records.set(value.id, value); }};
}

const body = {name: 'Lead', businessEmail: 'lead@example.com', company: 'Brand', market: 'EU', category: 'airless', sku: 'GT-1', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Serum', packagingPreference: 'Pump', certificationConstraints: '', notes: '', privacyConsent: true};

describe('API Gateway Lambda handler', () => {
  it('queues a valid inquiry and emits restrictive CORS headers', async () => {
    const enqueue = vi.fn(async () => undefined);
    const handler = createLambdaHandler({repository: repository(), enqueue, allowedOrigin: 'https://site.example', now: () => 1000});
    const response = await handler({httpMethod: 'POST', path: '/v1/inquiries', headers: {origin: 'https://site.example', 'idempotency-key': 'create-123456789'}, body: JSON.stringify(body)});

    expect(response.statusCode).toBe(202);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('https://site.example');
    expect(enqueue).toHaveBeenCalledWith(expect.objectContaining({inquiryId: expect.any(String)}));
  });

  it('rejects an unapproved origin before parsing the request', async () => {
    const enqueue = vi.fn(async () => undefined);
    const handler = createLambdaHandler({repository: repository(), enqueue, allowedOrigin: 'https://site.example'});
    const response = await handler({httpMethod: 'POST', path: '/v1/inquiries', headers: {origin: 'https://evil.example'}, body: '{not-json'});

    expect(response.statusCode).toBe(403);
    expect(enqueue).not.toHaveBeenCalled();
    expect(response.headers).not.toHaveProperty('Access-Control-Allow-Origin');
  });
});
