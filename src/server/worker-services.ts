import {z} from 'zod';
import {buildEmailDraft} from '@/lib/ai-mail';
import {proposalSectionKeys, type EmailDraft, type ProposalSections} from '@/lib/contracts';
import type {InquiryRecord, InquiryRepository} from '@/server/api-service';

const proposalSectionsSchema = z.object(Object.fromEntries(proposalSectionKeys.map((key) => [key, z.string().trim().min(1).max(4000)])) as Record<(typeof proposalSectionKeys)[number], z.ZodString>);

export async function processAiJob(inquiryId: string, dependencies: {
  repository: InquiryRepository;
  generate(input: InquiryRecord['input']): Promise<unknown>;
  now?: () => number;
}): Promise<void> {
  const now = dependencies.now ?? Date.now;
  const record = await dependencies.repository.get(inquiryId);
  if (!record || record.status !== 'queued') throw new Error('Inquiry job is not queued');
  await dependencies.repository.update({...record, status: 'processing', updatedAt: now()});
  try {
    const generated = proposalSectionsSchema.parse(await dependencies.generate(record.input)) as ProposalSections;
    const locale = record.locale ?? 'en';
    const proposal = {id: record.id, status: 'completed' as const, locale, sections: generated};
    const email = buildEmailDraft(proposal, record.input, locale);
    await dependencies.repository.update({...record, status: 'completed', proposal, email, updatedAt: now()});
  } catch {
    await dependencies.repository.update({...record, status: 'retryable_error', updatedAt: now()});
  }
}

export async function processApprovedEmail(
  record: InquiryRecord,
  dependencies: {send(message: {to: string; subject: string; body: string}): Promise<void>}
): Promise<InquiryRecord> {
  if (!record.email || record.email.status !== 'approved') throw new Error('Email is not approved');
  const message = {to: record.email.to, subject: record.email.subject, body: record.email.body};
  await dependencies.send(message);
  const email: EmailDraft = {...record.email, status: 'sent'};
  return {...record, email};
}
