import {describe, expect, it, vi} from 'vitest';
import {processAiJob, processApprovedEmail} from '@/server/worker-services';
import type {InquiryRecord, InquiryRepository} from '@/server/api-service';

const input = {name: 'Lead', businessEmail: 'lead@example.com', company: 'Brand', market: 'EU', category: 'airless', sku: 'GT-1', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Serum', packagingPreference: 'Pump', certificationConstraints: '', notes: '', privacyConsent: true} as const;
const base: InquiryRecord = {id: 'inquiry-1', input, access: {inquiryId: 'inquiry-1', tokenHash: 'abc'}, status: 'queued', retryCount: 0, createdAt: 1, updatedAt: 1};

function repository(record: InquiryRecord) {
  let current = record;
  const value: InquiryRepository = {async create(next) { current = next; }, async get() { return current; }, async findByIdempotency() { return undefined; }, async bindIdempotency() {}, async update(next) { current = next; }};
  return {value, current: () => current};
}

const sections = {needSummary: 'Need', recommendedConfiguration: 'SKU', missingInformation: 'Missing', commercialPlaceholders: 'Confirmed manually', nextMaterials: 'Artwork', suggestedReply: 'Thank you'};

describe('AI worker', () => {
  it('validates six sections and stores an email as pending review', async () => {
    const store = repository(base);
    await processAiJob('inquiry-1', {repository: store.value, generate: async () => sections, now: () => 2});

    expect(store.current()).toMatchObject({status: 'completed', proposal: {sections}, email: {status: 'pending_review', to: 'lead@example.com'}});
  });

  it('marks malformed model output retryable without persisting raw output', async () => {
    const store = repository(base);
    await processAiJob('inquiry-1', {repository: store.value, generate: async () => ({needSummary: 'only one section'}), now: () => 2});

    expect(store.current()).toMatchObject({status: 'retryable_error'});
    expect(JSON.stringify(store.current())).not.toContain('only one section');
  });
});

describe('mail worker', () => {
  it('refuses to send an unapproved draft', async () => {
    const send = vi.fn(async () => undefined);
    await expect(processApprovedEmail({...base, email: {to: 'lead@example.com', subject: 'Draft', body: 'Body', status: 'pending_review'}}, {send})).rejects.toThrow('Email is not approved');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends only the approved recipient and returns sent status', async () => {
    const send = vi.fn(async () => undefined);
    const result = await processApprovedEmail({...base, email: {to: 'lead@example.com', subject: 'Approved', body: 'Body', status: 'approved'}}, {send});
    expect(send).toHaveBeenCalledWith({to: 'lead@example.com', subject: 'Approved', body: 'Body'});
    expect(result.email?.status).toBe('sent');
  });
});
