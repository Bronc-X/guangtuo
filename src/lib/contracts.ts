import {z} from 'zod';
import type {Locale} from '@/lib/routing';

const shortText = z.string().trim().min(1).max(200);

export const inquirySchema = z.object({
  name: shortText,
  businessEmail: z.email().max(254),
  company: shortText,
  market: shortText,
  category: shortText,
  sku: shortText,
  configuration: z.string().trim().max(1200),
  quantity: shortText,
  budget: shortText,
  launchDate: shortText,
  productGoal: z.string().trim().min(1).max(500),
  packagingPreference: z.string().trim().min(1).max(500),
  certificationConstraints: z.string().trim().max(500),
  notes: z.string().trim().max(2000),
  privacyConsent: z.literal(true)
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const jobStatuses = ['queued', 'processing', 'completed', 'retryable_error', 'failed'] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const emailStatuses = ['pending_review', 'approved', 'queued', 'sent', 'retryable_error', 'failed'] as const;
export type EmailStatus = (typeof emailStatuses)[number];

export const proposalSectionKeys = [
  'needSummary',
  'recommendedConfiguration',
  'missingInformation',
  'commercialPlaceholders',
  'nextMaterials',
  'suggestedReply'
] as const;

export type ProposalSections = Record<(typeof proposalSectionKeys)[number], string>;

export type Proposal = {
  id: string;
  status: JobStatus;
  locale: Locale;
  sections: ProposalSections;
};

export type EmailDraft = {
  to: string;
  subject: string;
  body: string;
  status: EmailStatus;
};

export type InboundMailDecision = 'substantive_auto_reply' | 'safe_acknowledgement';
