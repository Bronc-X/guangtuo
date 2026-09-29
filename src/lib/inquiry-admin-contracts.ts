import type {EmailDraft, InquiryInput, Proposal} from './contracts';
import type {Locale} from './routing';
import type {Grounding} from './knowledge-contracts';

export type StoredInquiry = {
  id: string; version: number; locale: Locale; createdAt: number; updatedAt: number;
  input: InquiryInput; proposal: Proposal; email: EmailDraft; generator: 'rules' | 'rag'; grounding?: Grounding;
  delivery: {attempts: number; error?: string; approvedBy?: string; approvedDigest?: string; messageId?: string; sentAt?: number};
  readAt?: number;
  previewReady?: boolean;
  notificationStatus?: 'pending' | 'sending' | 'sent' | 'failed' | 'unconfigured';
};
