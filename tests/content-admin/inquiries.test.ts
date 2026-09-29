import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach, expect, it} from 'vitest';
import * as inquiries from '../../services/content-admin/inquiries';

const cleanup: Array<() => Promise<void>> = [];

it('regenerates a free template with version checks and revokes prior approval', async () => {
  const {service} = await setup(async () => ({messageId: 'local-template-test'}));
  const {id} = await service.create(input, 'template-generation-test', 'zh');
  const original = service.get(id)!;
  const edited = service.edit(id, original.version, {subject: 'Edited', body: 'Manual response'}, 'admin');
  const approved = service.approve(id, edited.version, 'admin', true);
  const regenerated = service.generateTemplate(id, approved.version, 'admin');
  expect(regenerated).toMatchObject({generator: 'rules', email: {subject: original.email.subject, body: original.email.body, status: 'pending_review'}, delivery: {attempts: 0}});
  expect(regenerated.delivery.approvedBy).toBeUndefined();
  expect(() => service.generateTemplate(id, approved.version, 'admin')).toThrow('VERSION_CONFLICT');
  service.approve(id, regenerated.version, 'admin', true);
  const sent = await service.send(id, 'admin');
  expect(() => service.generateTemplate(id, sent.version, 'admin')).toThrow('EMAIL_LOCKED');
});
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn(); });
export const input = {name: 'QA Buyer', businessEmail: 'qa@example.test', company: 'QA', market: 'France', category: 'eye', sku: 'GT-EYE-001', configuration: 'White', quantity: '1000', budget: 'To discuss', launchDate: '2027', productGoal: 'Eye care', packagingPreference: 'Jar', certificationConstraints: '', notes: 'Private note', privacyConsent: true};

async function setup(sender?: inquiries.MailSender) {
  const root = await mkdtemp(path.join(tmpdir(), 'gt-inquiry-'));
  const db = new DatabaseSync(path.join(root, 'inquiries.sqlite'));
  cleanup.push(async () => { db.close(); await rm(root, {recursive: true, force: true}); });
  expect(inquiries).toHaveProperty('createInquiryService');
  return {root, db, service: inquiries.createInquiryService({database: db, dataDir: root, sender})};
}

it('persists a six-language inquiry with private access and repeatable idempotency', async () => {
  const {service, root, db} = await setup();
  const created = await service.create(input, 'qa-idempotency-key-123', 'fr');
  const repeated = await service.create(input, 'qa-idempotency-key-123', 'fr');
  expect(repeated.id).toBe(created.id);
  expect(repeated.accessToken).toBe(created.accessToken);
  expect(service.status(created.id, 'wrong')).toBeNull();
  expect(service.status(created.id, created.accessToken)).not.toHaveProperty('input');
  await expect(service.create({...input, notes: 'different'}, 'qa-idempotency-key-123', 'fr')).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  const reopened = inquiries.createInquiryService({database: db, dataDir: root});
  expect(reopened.list()[0]).toMatchObject({locale: 'fr', input, email: {status: 'pending_review'}});
  expect(reopened.list()[0].email.body).not.toContain(reopened.list()[0].proposal.sections.suggestedReply);
  expect(reopened.list()[0]).not.toHaveProperty('access');
  expect((await readFile(path.join(root, 'inquiries.sqlite'))).includes(Buffer.from(created.accessToken))).toBe(false);
});

it('requires explicit review, records failures, and retries only the approved immutable message', async () => {
  let fail = true;
  const delivered: inquiries.OutboundMail[] = [];
  const {service} = await setup(async (message) => {
    if (fail) throw new Error('SMTP password=secret must not escape');
    delivered.push(message);
    return {messageId: 'local-acceptance'};
  });
  const created = await service.create(input, 'qa-review-key-1234', 'zh');
  await expect(service.send(created.id, 'admin')).rejects.toThrow('EMAIL_NOT_APPROVED');
  const record = service.get(created.id)!;
  expect(() => service.approve(created.id, record.version, 'admin', false)).toThrow('REVIEW_CONFIRMATION_REQUIRED');
  service.approve(created.id, record.version, 'admin', true);
  await service.send(created.id, 'admin');
  expect(service.get(created.id)).toMatchObject({email: {status: 'retryable_error'}, delivery: {attempts: 1, error: 'SMTP_SEND_FAILED'}});
  expect(JSON.stringify(service.get(created.id))).not.toContain('password');
  fail = false;
  await service.send(created.id, 'admin');
  await service.send(created.id, 'admin');
  expect(delivered).toHaveLength(1);
  expect(delivered[0].to).toBe(input.businessEmail);
  expect(service.get(created.id)).toMatchObject({email: {status: 'sent'}, delivery: {attempts: 2, messageId: 'local-acceptance'}});
  expect(() => service.edit(created.id, service.get(created.id)!.version, {subject: 'new', body: 'new'}, 'admin')).toThrow('EMAIL_LOCKED');
});

it('retains the inquiry without credentials and revokes approval after a draft edit', async () => {
  const {service} = await setup();
  const created = await service.create(input, 'qa-unconfigured-123', 'ar');
  service.approve(created.id, service.get(created.id)!.version, 'admin', true);
  await service.send(created.id, 'admin');
  expect(service.get(created.id)).toMatchObject({delivery: {attempts: 0, error: 'SMTP_NOT_CONFIGURED'}, email: {status: 'approved'}});
  service.edit(created.id, service.get(created.id)!.version, {subject: 'Updated', body: 'Updated body'}, 'admin');
  await expect(service.send(created.id, 'admin')).rejects.toThrow('EMAIL_NOT_APPROVED');
});
