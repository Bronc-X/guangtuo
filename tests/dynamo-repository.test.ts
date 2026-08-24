import {describe, expect, it, vi} from 'vitest';
import {DynamoInquiryRepository} from '@/server/aws/dynamo-repository';
import type {InquiryRecord} from '@/server/api-service';

const record: InquiryRecord = {
  id: 'inquiry-1', input: {name: 'Lead', businessEmail: 'lead@example.com', company: 'Brand', market: 'EU', category: 'airless', sku: 'GT-1', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Serum', packagingPreference: 'Pump', certificationConstraints: '', notes: '', privacyConsent: true},
  access: {inquiryId: 'inquiry-1', tokenHash: 'abc'}, status: 'queued', retryCount: 0, createdAt: 1, updatedAt: 1
};

describe('DynamoDB inquiry repository', () => {
  it('stores the inquiry under a scoped key with a retention timestamp', async () => {
    const send = vi.fn(async (command: unknown) => { void command; return {}; });
    const repository = new DynamoInquiryRepository('table', {send}, () => 1_700_000_000_000);
    await repository.create(record);

    const input = (send.mock.calls[0]![0] as {input: {Item: Record<string, unknown>; ConditionExpression: string}}).input;
    expect(input.Item).toMatchObject({pk: 'INQUIRY#inquiry-1', sk: 'INQUIRY', id: 'inquiry-1'});
    expect(input.Item.expiresAt).toBe(Math.floor(1_700_000_000_000 / 1000) + 365 * 24 * 60 * 60);
    expect(input.ConditionExpression).toBe('attribute_not_exists(pk)');
  });

  it('uses a strongly consistent read for status access', async () => {
    const send = vi.fn(async (command: unknown) => { void command; return {Item: record}; });
    const repository = new DynamoInquiryRepository('table', {send});
    expect(await repository.get('inquiry-1')).toEqual(record);
    expect((send.mock.calls[0]![0] as {input: {ConsistentRead: boolean}}).input.ConsistentRead).toBe(true);
  });
});
