import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import {commercialFields, commercialTotals, documentKinds, documentMissing, opportunityFields, type CommercialDocument, type Opportunity, type BusinessStatus, type ImportResult} from '../../src/lib/business-contracts';
import type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';
import {createBusinessConnectors, parseLeadCsv, type ImportedLead} from './connectors';

export class BusinessError extends Error {constructor(readonly status: number, message: string) {super(message);}}
const parse = <T>(schema: z.ZodType<T>, input: unknown) => {const result = schema.safeParse(input); if (!result.success) throw new BusinessError(422, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('；')); return result.data;};
const revision = z.number().int().positive();
const importRow = opportunityFields.extend({externalId: z.string().trim().min(1).max(500)});

export function createBusinessService(db: DatabaseSync, options: {connectors?: ReturnType<typeof createBusinessConnectors>; now?: () => Date} = {}) {
  const connectors = options.connectors ?? createBusinessConnectors(), now = options.now ?? (() => new Date());
  db.exec(`CREATE TABLE IF NOT EXISTS business_opportunities (id TEXT PRIMARY KEY, source TEXT NOT NULL, external_id TEXT NOT NULL, version INTEGER NOT NULL, record_json TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(source,external_id));
    CREATE TABLE IF NOT EXISTS commercial_documents (id TEXT PRIMARY KEY, opportunity_id TEXT NOT NULL REFERENCES business_opportunities(id), version INTEGER NOT NULL, record_json TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS business_connector_usage (day TEXT PRIMARY KEY, requests INTEGER NOT NULL);`);
  function get(id: string): Opportunity {
    const row = db.prepare('SELECT record_json FROM business_opportunities WHERE id=?').get(id) as {record_json: string} | undefined;
    if (!row) throw new BusinessError(404, '找不到这条商机'); return JSON.parse(row.record_json) as Opportunity;
  }
  function insert(input: unknown, source: Opportunity['source'], externalId: string) {
    const fields = parse(opportunityFields, input), stamp = now().toISOString();
    const item: Opportunity = {...fields, id: randomUUID(), version: 1, source, externalId, createdAt: stamp, updatedAt: stamp};
    db.prepare('INSERT INTO business_opportunities VALUES(?,?,?,?,?,?)').run(item.id, source, externalId, item.version, JSON.stringify(item), stamp);
    return item;
  }
  function importLeads(leads: ImportedLead[], source: Opportunity['source']): ImportResult {
    // Validate the entire batch before changing any rows; retries never overwrite follow-up edits.
    const valid = parse(z.array(importRow).max(1000), leads); let added = 0;
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const lead of valid) {
        if (db.prepare('SELECT id FROM business_opportunities WHERE source=? AND external_id=?').get(source, lead.externalId)) continue;
        insert(lead, source, lead.externalId); added++;
      }
      db.exec('COMMIT');
    } catch (error) {db.exec('ROLLBACK'); throw error;}
    return {added, skipped: leads.length - added, received: leads.length};
  }
  function getDocument(id: string): CommercialDocument {
    const row = db.prepare('SELECT record_json FROM commercial_documents WHERE id=?').get(id) as {record_json: string} | undefined;
    if (!row) throw new BusinessError(404, '找不到这份文件'); return JSON.parse(row.record_json) as CommercialDocument;
  }
  function checkVersion(current: {version: number}, version: number) {if (current.version !== version) throw new BusinessError(409, '内容已被更新，请重新打开后再编辑。当前输入尚未保存。');}
  function saveDocument(item: CommercialDocument, previousVersion: number) {
    const result = db.prepare('UPDATE commercial_documents SET version=?,record_json=?,updated_at=? WHERE id=? AND version=?').run(item.version, JSON.stringify(item), item.updatedAt, item.id, previousVersion);
    if (Number(result.changes) !== 1) throw new BusinessError(409, '文件已更新，请重新打开'); return item;
  }
  function status(): BusinessStatus {
    const used = db.prepare('SELECT requests FROM business_connector_usage WHERE day=?').get(now().toISOString().slice(0, 10)) as {requests: number} | undefined;
    return {chatwoot: {ready: connectors.chatwootReady, message: connectors.chatwootReady ? '已配置；可手动同步已授权收件箱，实际连接以同步结果为准' : '待接入：需配置 Chatwoot 地址、账号 ID 和访问令牌。自托管社区版免费，托管与部分渠道可能有成本。'}, tikhub: {ready: connectors.tikhubReady, message: connectors.tikhubReady ? '已配置；手动读取指定 TikTok 视频的首批公开评论，调用可能消耗额度' : '待配置：TikHub 密钥及调用开关。赠送额度有限，默认不调用。', remainingRequests: Math.max(0, connectors.requestLimit - (used?.requests ?? 0))}};
  }
  return {
    get, getDocument, status,
    list: () => (db.prepare('SELECT record_json FROM business_opportunities ORDER BY updated_at DESC').all() as {record_json: string}[]).map(row => JSON.parse(row.record_json) as Opportunity),
    create: (input: unknown) => insert(input, 'manual', randomUUID()),
    update(id: string, input: unknown) {
      const body = parse(opportunityFields.extend({version: revision}), input), previous = get(id); checkVersion(previous, body.version);
      const item = {...previous, ...body, version: previous.version + 1, updatedAt: now().toISOString()};
      const result = db.prepare('UPDATE business_opportunities SET version=?,record_json=?,updated_at=? WHERE id=? AND version=?').run(item.version, JSON.stringify(item), item.updatedAt, id, previous.version);
      if (Number(result.changes) !== 1) throw new BusinessError(409, '商机已更新，请重新打开'); return item;
    },
    syncWebsite() {
      const rows = db.prepare("SELECT i.id, i.record_json FROM inquiries i WHERE NOT EXISTS (SELECT 1 FROM business_opportunities b WHERE b.source='website' AND b.external_id=i.id) ORDER BY i.created_at LIMIT 1000").all() as {id: string; record_json: string}[];
      return importLeads(rows.map(row => {
        const inquiry = JSON.parse(row.record_json) as StoredInquiry, input = inquiry.input;
        const requirements = [input.productGoal, input.category && `产品：${input.category}`, input.sku && `SKU：${input.sku}`, input.quantity && `数量：${input.quantity}`, input.budget && `预算：${input.budget}`, input.launchDate && `上线：${input.launchDate}`, input.packagingPreference, input.certificationConstraints, input.notes].filter(Boolean).join('\n').slice(0, 12000);
        return {...opportunityFields.parse({name: input.name, company: input.company, contact: [input.businessEmail, input.contact].filter(Boolean).join(' / ').slice(0, 300), platform: '独立站', kind: 'inbound', market: input.market, requirements}), externalId: row.id};
      }), 'website');
    },
    importCsv(input: unknown) {
      const body = parse(z.object({csv: z.string().min(1).max(500000)}), input);
      try {return importLeads(parseLeadCsv(body.csv), 'import');} catch (error) {if (error instanceof BusinessError) throw error; throw new BusinessError(422, error instanceof z.ZodError ? 'CSV 字段格式不正确，请按模板填写平台、类型和阶段' : error instanceof Error ? error.message : 'CSV 导入失败');}
    },
    async syncChatwoot(input: unknown) {
      const {page} = parse(z.object({page: z.number().int().min(1).max(10000)}), input);
      if (!connectors.chatwootReady) throw new BusinessError(409, 'Chatwoot 尚未配置，请先接入已授权账号');
      try {return importLeads(await connectors.chatwoot(page), 'chatwoot');} catch {throw new BusinessError(502, 'Chatwoot 同步失败，请检查地址、账号权限和网络。原有线索未改变。');}
    },
    async syncTikHub(input: unknown) {
      const {videoId} = parse(z.object({videoId: z.string().regex(/^\d{10,25}$/), confirmed: z.literal(true)}), input);
      if (!connectors.tikhubReady) throw new BusinessError(409, 'TikHub 尚未启用，不会调用或扣费');
      const day = now().toISOString().slice(0, 10);
      db.prepare('INSERT OR IGNORE INTO business_connector_usage VALUES(?,0)').run(day);
      const reserved = db.prepare('UPDATE business_connector_usage SET requests=requests+1 WHERE day=? AND requests<?').run(day, connectors.requestLimit);
      if (Number(reserved.changes) !== 1) throw new BusinessError(429, '今日调用上限已用完，不再请求');
      // Failed/uncertain calls also count: a timeout may still have been billed upstream.
      try {return importLeads(await connectors.tikhub(videoId), 'tikhub');} catch {throw new BusinessError(502, 'TikHub 读取失败，请检查权限、额度或响应格式。本次尝试已计入每日上限。');}
    },
    listDocuments: () => (db.prepare('SELECT record_json FROM commercial_documents ORDER BY updated_at DESC').all() as {record_json: string}[]).map(row => JSON.parse(row.record_json) as CommercialDocument),
    createDocument(input: unknown) {
      const body = parse(z.object({opportunityId: z.uuid(), kind: z.enum(['proposal', 'quote', 'contract']), fromDocumentId: z.uuid().optional()}), input);
      const lead = get(body.opportunityId), stamp = now().toISOString(), id = randomUUID();
      const from = body.fromDocumentId ? getDocument(body.fromDocumentId) : undefined;
      if (from && from.opportunityId !== lead.id) throw new BusinessError(422, '来源文件与客户不一致');
      const fields = commercialFields.parse(from ?? {title: documentKinds[body.kind], buyer: lead.company || lead.name, contact: lead.contact, items: [{name: '待确认产品', quantity: 1, unit: '件', unitPrice: ''}], body: `客户需求\n${lead.requirements || '待补充'}\n\n建议推进步骤\n1. 确认产品规格、目标市场及数量。\n2. 确认打样内容、包装与验收方式。\n3. 确认价格、交期及付款安排。\n\n${body.kind === 'contract' ? '合同约定需由双方填写并确认。' : '产品配置与商务条件以双方后续确认为准。'}`});
      const doc: CommercialDocument = {...fields, title: documentKinds[body.kind], id, kind: body.kind, number: `SK-${body.kind.toUpperCase()}-${stamp.slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`, opportunityId: lead.id, opportunityVersion: from?.opportunityVersion ?? lead.version, version: 1, status: 'draft', createdAt: stamp, updatedAt: stamp};
      db.prepare('INSERT INTO commercial_documents VALUES(?,?,?,?,?)').run(id, lead.id, 1, JSON.stringify(doc), stamp); return doc;
    },
    updateDocument(id: string, input: unknown) {
      const fields = parse(commercialFields.extend({version: revision}), input), old = getDocument(id); checkVersion(old, fields.version);
      const totals = commercialTotals(fields);
      if (!totals.incomplete && totals.discount > totals.subtotal) throw new BusinessError(422, '折扣不能超过商品小计');
      return saveDocument({...old, ...fields, version: old.version + 1, status: 'draft', updatedAt: now().toISOString()}, old.version);
    },
    reviewDocument(id: string, input: unknown) {
      const body = parse(z.object({version: revision}), input), old = getDocument(id); checkVersion(old, body.version);
      const missing = documentMissing(old); if (missing.length) throw new BusinessError(422, `请先补全：${missing.join('、')}`);
      if (commercialTotals(old).discount > commercialTotals(old).subtotal) throw new BusinessError(422, '折扣不能超过商品小计');
      return saveDocument({...old, version: old.version + 1, status: 'reviewed', updatedAt: now().toISOString()}, old.version);
    }
  };
}
