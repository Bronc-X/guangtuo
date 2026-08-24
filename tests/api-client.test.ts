import {describe, expect, it, vi} from 'vitest';
import {createRemoteInquiry, getRemoteStatus} from '@/lib/api-client';
import type {InquiryInput} from '@/lib/contracts';

const input = {name: 'Lead', businessEmail: 'lead@example.com', company: 'Brand', market: 'EU', category: 'airless', sku: 'GT-1', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Serum', packagingPreference: 'Pump', certificationConstraints: '', notes: '', privacyConsent: true} satisfies InquiryInput;

describe('production API client', () => {
  it('submits with an idempotency key and returns a fragment-safe credential', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({id: 'job-1', status: 'queued', retryCount: 0, updatedAt: 1, accessToken: 'secret-token'}), {status: 202}));
    const result = await createRemoteInquiry('https://api.example.com/v1', input, fetcher);

    expect(result).toEqual({id: 'job-1', status: 'queued', accessToken: 'secret-token'});
    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/v1/inquiries', expect.objectContaining({method: 'POST', headers: expect.objectContaining({'Idempotency-Key': expect.any(String)})}));
  });

  it('uses a bearer token for status and fails closed on malformed responses', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({id: 'job-1', status: 'completed', retryCount: 0, updatedAt: 2}), {status: 200}));
    expect(await getRemoteStatus('https://api.example.com/v1', 'job-1', 'secret-token', fetcher)).toMatchObject({status: 'completed'});
    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/v1/inquiries/job-1/status', expect.objectContaining({headers: {Authorization: 'Bearer secret-token'}}));

    const malformed = vi.fn(async () => new Response('{}', {status: 200}));
    await expect(getRemoteStatus('https://api.example.com/v1', 'job-1', 'secret-token', malformed)).rejects.toThrow('Invalid API response');
  });
});
