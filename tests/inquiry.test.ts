import {describe, expect, it} from 'vitest';
import {inquirySchema, jobStatuses, proposalSectionKeys} from '@/lib/contracts';

const validInquiry = {
  name: 'Ada',
  businessEmail: 'ada@example.com',
  company: 'Example Labs',
  market: 'EU',
  category: 'airless',
  sku: 'GT-AIRLESS-030',
  configuration: 'capacity=30ml',
  quantity: '5000',
  budget: 'To be confirmed',
  launchDate: '2027-Q1',
  productGoal: 'Premium serum packaging',
  packagingPreference: 'Airless pump',
  certificationConstraints: 'EU market',
  notes: 'Need samples first',
  privacyConsent: true
};

describe('inquiry and proposal contracts', () => {
  it('accepts the fifteen-field inquiry boundary', () => {
    expect(Object.keys(validInquiry)).toHaveLength(15);
    expect(inquirySchema.safeParse(validInquiry).success).toBe(true);
  });

  it('rejects invalid email and missing privacy consent', () => {
    expect(inquirySchema.safeParse({...validInquiry, businessEmail: 'bad', privacyConsent: false}).success).toBe(false);
  });

  it('locks the public states and six-section proposal shape', () => {
    expect(jobStatuses).toEqual(['queued', 'processing', 'completed', 'retryable_error', 'failed']);
    expect(proposalSectionKeys).toHaveLength(6);
  });
});
