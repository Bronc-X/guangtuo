import {createHash, createHmac, randomBytes, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {writeFile, rename} from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import {buildEmailDraft, buildProposalDraft} from '../../src/lib/ai-mail';
import {inquirySchema, type EmailDraft} from '../../src/lib/contracts';
import {isLocale} from '../../src/lib/routing';
import type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';
export type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';
import {createAccessCredential, verifyAccessCredential} from '../../src/server/domain';
import type {Grounding} from '../../src/lib/knowledge-contracts';
import type {GroundedDraft} from '../knowledge/rag';

export type OutboundMail = {to: string; subject: string; body: string; messageId: string};
export type MailSender = (mail: OutboundMail) => Promise<{messageId: string}>;
const emailEdit = z.strictObject({subject: z.string().trim().min(1).max(200).refine((s) => !/[\r\n]/.test(s)), body: z.string().trim().min(1).max(20_000)});
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const emailDigest = (email: EmailDraft) => digest(JSON.stringify([email.to, email.subject, email.body]));

export function createInquiryService(options: {database: DatabaseSync; dataDir: string; sender?: MailSender; notificationRecipient?: string; adminUrl?: string; now?: () => number; validateGrounding?: (grounding: Grounding) => void}) {
  const db = options.database;
  const now = options.now ?? Date.now;
  db.exec(`CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY, idem_hash TEXT NOT NULL UNIQUE, input_hash TEXT NOT NULL, access_hash TEXT NOT NULL,
    version INTEGER NOT NULL, record_json TEXT NOT NULL, created_at INTEGER NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS inquiry_events (id TEXT PRIMARY KEY, inquiry_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, created_at INTEGER NOT NULL) STRICT;`);
  db.exec(`CREATE TABLE IF NOT EXISTS inquiry_notifications (inquiry_id TEXT PRIMARY KEY, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS inquiry_reads (inquiry_id TEXT PRIMARY KEY, read_at INTEGER NOT NULL) STRICT;`);
  db.prepare("UPDATE inquiry_notifications SET status = 'failed' WHERE status = 'sending'").run();
  const recipient = options.notificationRecipient ? z.email().parse(options.notificationRecipient) : undefined;
  const notificationConfigured = Boolean(recipient && options.sender);
  let notificationsStopped = false;
  const designDir = path.join(options.dataDir, 'inquiry-designs');
  mkdirSync(designDir, {recursive: true, mode: 0o700});
  const previewPath = (id: string) => path.join(designDir, `${z.uuid().parse(id)}.png`);
  const decorate = (record: StoredInquiry): StoredInquiry => {
    const notice = db.prepare('SELECT status FROM inquiry_notifications WHERE inquiry_id = ?').get(record.id) as {status: StoredInquiry['notificationStatus']} | undefined;
    const read = db.prepare('SELECT read_at FROM inquiry_reads WHERE inquiry_id = ?').get(record.id) as {read_at: number} | undefined;
    return {...record, readAt: read?.read_at, previewReady: existsSync(previewPath(record.id)), notificationStatus: notice ? (!notificationConfigured && notice.status === 'pending' ? 'unconfigured' : notice.status) : undefined};
  };
  mkdirSync(options.dataDir, {recursive: true, mode: 0o700});
  const keyPath = path.join(options.dataDir, 'inquiry-access.key');
  try { writeFileSync(keyPath, randomBytes(32), {flag: 'wx', mode: 0o600}); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  const key = readFileSync(keyPath);
  if (key.length !== 32) throw new Error('Invalid inquiry access key');
  const get = (id: string): StoredInquiry | null => {
    const row = db.prepare('SELECT record_json FROM inquiries WHERE id = ?').get(id) as {record_json: string} | undefined;
    return row ? decorate(JSON.parse(row.record_json) as StoredInquiry) : null;
  };
  const event = (id: string, action: string, actor: string) => db.prepare('INSERT INTO inquiry_events VALUES (?, ?, ?, ?, ?)').run(randomUUID(), id, action, actor, now());
  const save = (record: StoredInquiry, action: string, actor: string) => {
    const next = {...record, version: record.version + 1, updatedAt: now()};
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = db.prepare('UPDATE inquiries SET record_json = ?, version = ? WHERE id = ? AND version = ?').run(JSON.stringify(next), next.version, record.id, record.version);
      if (!result.changes) throw new Error('VERSION_CONFLICT');
      event(record.id, action, actor);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return next;
  };
  const requireRecord = (id: string, version?: number) => {
    const record = get(id);
    if (!record) throw new Error('INQUIRY_NOT_FOUND');
    if (version !== undefined && record.version !== version) throw new Error('VERSION_CONFLICT');
    return record;
  };
  const validateGrounding = (record: StoredInquiry) => {
    if (record.generator !== 'rag') return;
    if (!record.grounding || !options.validateGrounding) throw new Error('RAG_SOURCES_STALE');
    options.validateGrounding(record.grounding);
  };
  // A crash while SMTP is in flight has an unknown delivery outcome. Never resend automatically.
  const pending = db.prepare('SELECT record_json FROM inquiries').all() as Array<{record_json: string}>;
  for (const row of pending) {
    const record = JSON.parse(row.record_json) as StoredInquiry;
    if (record.email.status === 'queued') save({...record, email: {...record.email, status: 'retryable_error'}, delivery: {...record.delivery, error: 'DELIVERY_UNKNOWN_CHECK_PROVIDER'}}, 'send.interrupted', 'system');
  }
  return {
    configured: Boolean(options.sender),
    notificationConfigured,
    stopNotifications() { notificationsStopped = true; },
    get,
    list(): StoredInquiry[] {
      return (db.prepare('SELECT record_json FROM inquiries ORDER BY created_at DESC, id DESC LIMIT 200').all() as Array<{record_json: string}>).map((row) => decorate(JSON.parse(row.record_json) as StoredInquiry));
    },
    markRead(id: string) {
      requireRecord(id);
      db.prepare('INSERT INTO inquiry_reads VALUES (?, ?) ON CONFLICT(inquiry_id) DO NOTHING').run(id, now());
      return requireRecord(id);
    },
    async savePreview(id: string, bytes: Buffer) {
      if (!requireRecord(id).input.design) throw new Error('DESIGN_NOT_FOUND');
      if (existsSync(previewPath(id))) return {saved: true};
      if (bytes.length > 4 * 1024 * 1024) throw new Error('PREVIEW_TOO_LARGE');
      const image = sharp(bytes, {limitInputPixels: 16_000_000});
      const metadata = await image.metadata();
      if (metadata.format !== 'png') throw new Error('PREVIEW_INVALID');
      const safe = await image.resize({width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true}).png().toBuffer();
      const target = previewPath(id);
      const temporary = `${target}.${randomUUID()}.tmp`;
      await writeFile(temporary, safe, {mode: 0o600});
      await rename(temporary, target);
      return {saved: true};
    },
    readPreview(id: string) { requireRecord(id); return existsSync(previewPath(id)) ? readFileSync(previewPath(id)) : null; },
    retryNotification(id: string) {
      requireRecord(id);
      if (!notificationConfigured) throw new Error('SMTP_NOT_CONFIGURED');
      db.prepare("UPDATE inquiry_notifications SET status = 'pending', updated_at = ? WHERE inquiry_id = ? AND status = 'failed' AND attempts < 3").run(now(), id);
      return requireRecord(id);
    },
    async flushNotifications() {
      if (!notificationConfigured || !options.sender || !recipient) return;
      const pendingNotices = db.prepare("SELECT inquiry_id FROM inquiry_notifications WHERE status = 'pending' ORDER BY updated_at LIMIT 10").all() as Array<{inquiry_id: string}>;
      for (const row of pendingNotices) {
        if (notificationsStopped) return;
        const claimed = db.prepare("UPDATE inquiry_notifications SET status = 'sending', attempts = attempts + 1, updated_at = ? WHERE inquiry_id = ? AND status = 'pending'").run(now(), row.inquiry_id);
        if (!claimed.changes) continue;
        const record = requireRecord(row.inquiry_id);
        const design = record.input.design;
        try {
          await options.sender({to: recipient, subject: `修齐网站｜${design ? '新的包装方案与留资' : '新的客户留资'}｜${record.input.category.replace(/[\r\n]/g, ' ')}`,
            body: [`收到一条${design ? '包装方案' : '产品需求'}。`, `姓名：${record.input.name}`, `联系方式：${record.input.contact || record.input.businessEmail}`, `护理品类：${record.input.category}`, `公司：${record.input.company || '未填写'}`, `提交时间：${new Date(record.createdAt).toISOString()}`, design ? `包装：${design.sku}，方案参数已保存；效果图可在后台查看。` : '', `后台查看：${options.adminUrl ?? '/admin/'}#inquiries/${record.id}`, '请登录后台核对完整需求后联系客户。'].filter(Boolean).join('\n'), messageId: `<notice.${record.id}@showkibiotech.com>`});
          if (notificationsStopped) return;
          db.prepare("UPDATE inquiry_notifications SET status = 'sent', updated_at = ? WHERE inquiry_id = ?").run(now(), record.id);
        } catch {
          if (notificationsStopped) return;
          db.prepare("UPDATE inquiry_notifications SET status = 'failed', updated_at = ? WHERE inquiry_id = ?").run(now(), record.id);
        }
      }
    },
    async create(body: unknown, idempotencyKey: string, locale: string = 'en') {
      const input = inquirySchema.parse(body);
      if (!/^[A-Za-z0-9._:-]{12,128}$/.test(idempotencyKey) || !isLocale(locale)) throw new Error('INVALID_REQUEST');
      const idemHash = digest(idempotencyKey);
      const inputHash = digest(JSON.stringify({input, locale}));
      const existing = db.prepare('SELECT id, input_hash FROM inquiries WHERE idem_hash = ?').get(idemHash) as {id: string; input_hash: string} | undefined;
      if (existing && existing.input_hash !== inputHash) throw new Error('IDEMPOTENCY_CONFLICT');
      const id = existing?.id ?? randomUUID();
      const accessToken = createHmac('sha256', key).update(`${id}:${idempotencyKey}`).digest('base64url');
      if (!existing) {
        const proposal = {...buildProposalDraft(input, locale), id};
        const record: StoredInquiry = {id, version: 1, locale, input, proposal, email: buildEmailDraft(proposal, input, locale), generator: 'rules', delivery: {attempts: 0}, createdAt: now(), updatedAt: now()};
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare('INSERT INTO inquiries VALUES (?, ?, ?, ?, 1, ?, ?)').run(id, idemHash, inputHash, createAccessCredential(id, accessToken).tokenHash, JSON.stringify(record), record.createdAt);
          event(id, 'inquiry.created', 'customer');
          db.prepare("INSERT INTO inquiry_notifications VALUES (?, 'pending', 0, ?)").run(id, now());
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      }
      return {id, accessToken, status: 'completed' as const, retryCount: 0, updatedAt: requireRecord(id).updatedAt};
    },
    status(id: string, token: string) {
      const row = db.prepare('SELECT access_hash, record_json FROM inquiries WHERE id = ?').get(id) as {access_hash: string; record_json: string} | undefined;
      if (!row || !verifyAccessCredential({inquiryId: id, tokenHash: row.access_hash}, token)) return null;
      const record = JSON.parse(row.record_json) as StoredInquiry;
      return {id, status: 'completed', retryCount: 0, updatedAt: record.updatedAt, emailStatus: record.email.status};
    },
    applyGenerated(id: string, version: number, draft: GroundedDraft, actor: string) {
      const record = requireRecord(id, version);
      if (['sent', 'queued'].includes(record.email.status)) throw new Error('EMAIL_LOCKED');
      const next: StoredInquiry = {...record, generator: 'rag', grounding: draft.grounding, email: {...record.email, ...emailEdit.parse({subject: draft.title, body: draft.body}), status: 'pending_review'}, delivery: {attempts: 0}};
      validateGrounding(next);
      return save(next, 'draft.rag_generated', actor);
    },
    generateTemplate(id: string, version: number, actor: string) {
      const record = requireRecord(id, version);
      if (['sent', 'queued'].includes(record.email.status)) throw new Error('EMAIL_LOCKED');
      const email = buildEmailDraft(record.proposal, record.input, record.locale);
      return save({...record, email, generator: 'rules', grounding: undefined, delivery: {attempts: 0}}, 'draft.template_generated', actor);
    },
    edit(id: string, version: number, fields: unknown, actor: string) {
      const record = requireRecord(id, version);
      if (['sent', 'queued'].includes(record.email.status)) throw new Error('EMAIL_LOCKED');
      return save({...record, email: {...record.email, ...emailEdit.parse(fields), status: 'pending_review'}, delivery: {attempts: 0}}, 'draft.edited', actor);
    },
    approve(id: string, version: number, actor: string, confirmed: boolean) {
      const record = requireRecord(id, version);
      if (!confirmed || !actor) throw new Error('REVIEW_CONFIRMATION_REQUIRED');
      if (record.email.status !== 'pending_review') throw new Error('EMAIL_NOT_PENDING_REVIEW');
      validateGrounding(record);
      return save({...record, email: {...record.email, status: 'approved'}, delivery: {...record.delivery, approvedBy: actor, approvedDigest: emailDigest(record.email)}}, 'draft.approved', actor);
    },
    async send(id: string, actor: string) {
      let record = requireRecord(id);
      if (!record.input.businessEmail) throw new Error('EMAIL_RECIPIENT_REQUIRED');
      if (record.email.status === 'sent') return record;
      if (!['approved', 'retryable_error'].includes(record.email.status) || !record.delivery.approvedBy || record.delivery.approvedDigest !== emailDigest(record.email)) throw new Error('EMAIL_NOT_APPROVED');
      validateGrounding(record);
      if (!options.sender) return save({...record, delivery: {...record.delivery, error: 'SMTP_NOT_CONFIGURED'}}, 'send.unconfigured', actor);
      if (record.delivery.attempts >= 3) throw new Error('EMAIL_RETRY_LIMIT');
      record = save({...record, email: {...record.email, status: 'queued'}, delivery: {...record.delivery, attempts: record.delivery.attempts + 1, error: undefined}}, 'send.started', actor);
      try {
        const result = await options.sender({to: record.input.businessEmail, subject: record.email.subject, body: record.email.body, messageId: `<${id}.${record.delivery.approvedDigest?.slice(0, 16)}@showkibiotech.com>`});
        return save({...record, email: {...record.email, status: 'sent'}, delivery: {...record.delivery, messageId: result.messageId, sentAt: now()}}, 'send.accepted', actor);
      } catch {
        return save({...record, email: {...record.email, status: 'retryable_error'}, delivery: {...record.delivery, error: 'SMTP_SEND_FAILED'}}, 'send.failed', actor);
      }
    }
  };
}

export type InquiryService = ReturnType<typeof createInquiryService>;
