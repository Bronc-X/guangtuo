import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach, expect, it} from 'vitest';
import sharp from 'sharp';
import {inquirySchema} from '../../src/lib/contracts';
import {createInquiryService, type OutboundMail} from '../../services/content-admin/inquiries';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {for(const cleanup of cleanups.splice(0).reverse()) await cleanup();});
const lead = {name: 'Local QA', contact: '微信 wx_qa', category: '乳液', privacyConsent: true};
async function setup(fail = false) {
  const directory = await mkdtemp(path.join(tmpdir(), 'showki-notices-'));
  const database = new DatabaseSync(path.join(directory, 'test.sqlite'));
  cleanups.push(async () => {database.close(); await rm(directory, {recursive: true, force: true});});
  const sent: OutboundMail[] = [];
  const service = createInquiryService({database, dataDir: directory, notificationRecipient: 'owner@example.test', adminUrl: 'https://showki.example/admin/', sender: async mail => {if(fail) throw new Error('private SMTP error'); sent.push(mail); return {messageId: mail.messageId};}});
  return {directory, database, service, sent};
}
it('accepts exactly three customer fields and only treats email contacts as mail recipients', () => {
  for (const contact of ['wx_customer123', '+86 13400000000', 'buyer@example.test']) {
    const parsed = inquirySchema.parse({...lead, contact});
    expect(parsed.contact).toBe(contact);
    expect(parsed.businessEmail).toBe(contact.includes('@') ? contact : '');
    expect(parsed.company).toBe('');
  }
  for (const field of ['name', 'contact', 'category']) expect(inquirySchema.safeParse({...lead, [field]: ''}).success).toBe(false);
});
it('durably queues one owner notification per lead, keeps unread state and blocks sending email to WeChat', async () => {
  const {service, sent} = await setup();
  const created = await service.create(lead, 'notification-qa-123');
  await service.create(lead, 'notification-qa-123');
  expect(service.get(created.id)).toMatchObject({notificationStatus: 'pending'});
  expect(service.get(created.id)?.readAt).toBeUndefined();
  await Promise.all([service.flushNotifications(), service.flushNotifications()]);
  expect(sent).toHaveLength(1);
  expect(sent[0].to).toBe('owner@example.test');
  expect(sent[0].body).toContain('微信 wx_qa');
  expect(sent[0].body).toContain(`#inquiries/${created.id}`);
  expect(service.markRead(created.id).readAt).toBeGreaterThan(0);
  await expect(service.send(created.id, 'admin')).rejects.toThrow('EMAIL_RECIPIENT_REQUIRED');
});
it('retains a failed notification for deliberate retry without leaking SMTP details', async () => {
  const {service} = await setup(true);
  const created = await service.create(lead, 'notification-fail-123');
  await service.flushNotifications();
  expect(service.get(created.id)?.notificationStatus).toBe('failed');
  expect(JSON.stringify(service.get(created.id))).not.toContain('private SMTP');
  expect(service.retryNotification(created.id).notificationStatus).toBe('pending');
});
it('saves an authenticated design preview privately and restores its metadata after restart', async () => {
  const {service, database, directory} = await setup();
  const design = {kind: 'existing', sku: 'SK-LOTION-150', specifications: {capacity: '150ml', color: 'ivory'}, assemblyState: 'closed'};
  const created = await service.create({...lead, design}, 'design-preview-123');
  const png = await sharp({create: {width: 12, height: 12, channels: 3, background: 'pink'}}).png().toBuffer();
  await service.savePreview(created.id, png);
  expect(service.readPreview(created.id)?.subarray(1,4).toString()).toBe('PNG');
  const reopened = createInquiryService({database, dataDir: directory});
  expect(reopened.get(created.id)).toMatchObject({previewReady: true, notificationStatus: 'unconfigured', input: {design}});
  expect(reopened.status(created.id, 'not-the-token')).toBeNull();
  await expect(service.savePreview('../escape', png)).rejects.toThrow();
});
