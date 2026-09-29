import {z} from 'zod';
import type {Locale} from '@/lib/routing';

const shortText = z.string().trim().min(1).max(200);

export const inquirySchema = z.object({
  name: shortText,
  contact: z.string().trim().min(1).max(254).optional(),
  businessEmail: z.union([z.email().max(254), z.literal('')]).default(''),
  company: z.string().trim().max(200).default(''),
  market: z.string().trim().max(200).default(''),
  category: shortText,
  sku: shortText.default('CUSTOM'),
  configuration: z.string().trim().max(1200).default(''),
  quantity: z.string().trim().max(200).default(''),
  budget: z.string().trim().max(200).default(''),
  launchDate: z.string().trim().max(200).default(''),
  productGoal: z.string().trim().max(500).default(''),
  packagingPreference: z.string().trim().max(500).default(''),
  certificationConstraints: z.string().trim().max(500).default(''),
  notes: z.string().trim().max(2000).default(''),
  design: z.object({
    kind: z.enum(['existing', 'generated']), sku: shortText,
    specifications: z.record(z.string().max(64), z.string().max(128)).refine(value => Object.keys(value).length <= 20),
    assemblyState: z.enum(['open', 'closed']),
    shareCode: z.string().max(4000).optional(), jobId: z.string().regex(/^[a-f0-9]{32}$/).optional()
  }).optional(),
  salesChannel: z.enum(['online', 'offline', 'both']).optional(),
  salesPlatforms: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  efficacy: z.string().trim().max(500).optional(),
  productColor: z.string().trim().max(200).optional(),
  texture: z.string().trim().max(200).optional(),
  otherNeeds: z.string().trim().max(2000).optional(),
  conversation: z.array(z.object({role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000)})).max(80).optional(),
  privacyConsent: z.literal(true)
}).superRefine((input, ctx) => {
  if (!input.contact && !input.businessEmail) ctx.addIssue({code: 'custom', path: ['contact'], message: 'Contact information is required'});
}).transform(input => ({...input, businessEmail: input.contact ? (z.email().safeParse(input.contact).success ? input.contact : '') : input.businessEmail}));

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
