import {DatabaseSync} from 'node:sqlite';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, expect, it, vi} from 'vitest';
import {createBusinessService} from '../../services/business/service';
import {createBusinessConnectors, parseChatwoot, parseLeadCsv, parseTikHubComments} from '../../services/business/connectors';
import {commercialHtml} from '../../services/business/documents';
import {commercialFields, commercialTotals} from '../../src/lib/business-contracts';
import {createInquiryService} from '../../services/content-admin/inquiries';
import {setupContentAdmin} from '../../services/content-admin/setup';
import {createContentAdminServer} from '../../services/content-admin/server';

const cleanups: Array<() => void | Promise<void>> = [];
afterEach(async () => {while (cleanups.length) await cleanups.pop()!();});
function fixture(connectors = createBusinessConnectors({})) {const db = new DatabaseSync(':memory:'); cleanups.push(() => db.close()); return {db, service: createBusinessService(db, {connectors})};}

it('imports website inquiries idempotently and retains manual follow-up changes', async () => {
  const {db, service} = fixture(); const inquiries = createInquiryService({database: db, dataDir: tmpdir()}); cleanups.push(() => inquiries.stopNotifications());
  const created = await inquiries.create({name: '测试买家', contact: 'wechat-test', company: 'Test', market: 'France', category: '眼膜', quantity: '2000', productGoal: 'First\n\nThird', privacyConsent: true}, 'business-inquiry-1234', 'zh');
  expect(service.syncWebsite()).toEqual({received: 1, added: 1, skipped: 0}); const lead = service.list()[0];
  expect(lead).toMatchObject({source: 'website', externalId: created.id, platform: '独立站', kind: 'inbound'}); expect(lead.requirements).toContain('First\n\nThird');
  service.update(lead.id, {...lead, owner: 'Alice', notes: 'Already called', stage: 'contacted'});
  service.syncWebsite(); expect(service.list()).toHaveLength(1); expect(service.get(lead.id).notes).toBe('Already called');
});

it('rejects stale edits, unsafe source links, invalid dates and incomplete names', () => {
  const {service} = fixture(); const lead = service.create({name: 'Account'});
  service.update(lead.id, {...lead, notes: 'new'}); expect(() => service.update(lead.id, {...lead, notes: 'stale'})).toThrow('已被更新');
  expect(() => service.create({name: ''})).toThrow(); expect(() => service.create({name: 'X', sourceUrl: 'javascript:alert(1)'})).toThrow(); expect(() => service.create({name: 'X', nextDate: '2026-02-31'})).toThrow();
});

it('parses quoted multiline CSV, deduplicates external ids and rejects the entire invalid batch', () => {
  const {service} = fixture(); const csv = 'externalId,name,requirements\na,"A, Inc","one\n\nthree ""quote"""\nb,Second,Needs';
  expect(parseLeadCsv(csv)[0].requirements).toBe('one\n\nthree "quote"'); expect(service.importCsv({csv}).added).toBe(2); expect(service.importCsv({csv}).skipped).toBe(2);
  expect(() => service.importCsv({csv: 'externalId,name\nc,valid\nd,'})).toThrow(); expect(service.list()).toHaveLength(2);
  expect(() => parseLeadCsv('externalId,name\na,"unclosed')).toThrow('未闭合');
});

it('calculates money precisely and distinguishes pending prices from explicit zero', () => {
  const fields = commercialFields.parse({title: 'Quote', items: [{name: 'Mask', quantity: 3, unitPrice: '0.10'}], discount: '0.01', shipping: '0.05', taxPercent: 10});
  expect(commercialTotals(fields)).toMatchObject({subtotal: 30, discount: 1, tax: 3, shipping: 5, total: 37, incomplete: false});
  expect(commercialTotals({...fields, items: [{...fields.items[0], unitPrice: ''}]}).incomplete).toBe(true);
  expect(commercialTotals({...fields, items: [{...fields.items[0], unitPrice: '0'}]}).incomplete).toBe(false);
  expect(commercialFields.safeParse({...fields, items: [{name: 'X', quantity: 1.1, unitPrice: '-2'}]}).success).toBe(false);
});

it('links proposals, quotes and contracts, locks snapshots and invalidates review on edits', () => {
  const {service} = fixture(); const lead = service.create({name: 'Buyer', requirements: 'Two lines\nDetails'});
  const proposal = service.createDocument({opportunityId: lead.id, kind: 'proposal'});
  expect(proposal.body).toContain('Two lines\nDetails'); expect(proposal.items[0].unitPrice).toBe(''); expect(() => service.reviewDocument(proposal.id, {version: 1})).toThrow('请先补全');
  const saved = service.updateDocument(proposal.id, {...proposal, seller: 'Seller Ltd', buyer: 'Buyer Ltd', items: [{name: 'Mask', quantity: 2000, unitPrice: '0.25', unit: '件', specification: 'Custom'}], validUntil: '2026-12-01', delivery: 'Agreed delivery', payment: 'Agreed payment', terms: 'Agreed terms'});
  const reviewed = service.reviewDocument(saved.id, {version: saved.version}); expect(reviewed.status).toBe('reviewed');
  const quote = service.createDocument({opportunityId: lead.id, kind: 'quote', fromDocumentId: proposal.id});
  const contract = service.createDocument({opportunityId: lead.id, kind: 'contract', fromDocumentId: quote.id});
  expect(contract.items).toEqual(saved.items); expect(contract.status).toBe('draft');
  service.update(lead.id, {...lead, requirements: 'Changed later'}); expect(service.getDocument(contract.id).body).toContain('Two lines');
  expect(service.updateDocument(reviewed.id, {...reviewed, body: 'Edited'}).status).toBe('draft'); expect(() => service.updateDocument(reviewed.id, reviewed)).toThrow('已被更新');
  expect(() => service.updateDocument(contract.id, {...contract, discount: '9999'})).toThrow('折扣不能超过');
  const other = service.create({name: 'Other'}); expect(() => service.createDocument({opportunityId: other.id, kind: 'quote', fromDocumentId: quote.id})).toThrow('客户不一致');
});

it('exports escaped printable drafts with line breaks and no invented prices', () => {
  const {service} = fixture(); const lead = service.create({name: '<script>alert(1)</script>', requirements: 'One\n\nThree'});
  const doc = service.createDocument({opportunityId: lead.id, kind: 'contract'}), html = commercialHtml(doc);
  expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>'); expect(html).toContain('One\n\nThree'); expect(html).toContain('金额尚未填写完整'); expect(html).toContain('草稿 · 待人工复核');
});

it('whitelists Chatwoot contact fields and excludes private agent notes and tokens', () => {
  const leads = parseChatwoot({data: {payload: [{id: 12, meta: {sender: {name: 'Customer', email: 'test@example.test', access_token: 'secret'}, channel: 'Channel::Instagram', assignee: {access_token: 'secret'}}, messages: [{message_type: 0, private: false, content: 'Need eye mask'}, {message_type: 0, private: true, content: 'INTERNAL'}, {message_type: 1, content: 'outbound'}]}]}});
  expect(leads[0]).toMatchObject({platform: 'Instagram', requirements: 'Need eye mask', kind: 'inbound'}); expect(JSON.stringify(leads)).not.toMatch(/secret|INTERNAL|outbound/);
});

it('marks TikHub comments as public leads without inventing contacts and fails on changed response shapes', () => {
  const items = parseTikHubComments({code: 200, data: {status_code: 0, comments: [{cid: '123', text: 'How to customize?', user: {unique_id: 'brand', nickname: 'Brand'}}]}}, '1234567890123');
  expect(items[0]).toMatchObject({kind: 'public', contact: '', sourceUrl: 'https://www.tiktok.com/@brand'});
  expect(() => parseTikHubComments({code: 200, data: {status_code: 1}}, '123')).toThrow(); expect(() => parseChatwoot({data: {}})).toThrow();
});

it('never calls disabled providers and persists bounded usage including uncertain failures', async () => {
  const fetcher = vi.fn(); const {service} = fixture(createBusinessConnectors({}, fetcher));
  await expect(service.syncTikHub({videoId: '1234567890123', confirmed: true})).rejects.toThrow('尚未启用'); expect(fetcher).not.toHaveBeenCalled();
  const connectors = {...createBusinessConnectors({}), tikhubReady: true, requestLimit: 1, tikhub: vi.fn(async () => {throw new Error('token=secret');})};
  const second = fixture(connectors); await expect(second.service.syncTikHub({videoId: '1234567890123', confirmed: true})).rejects.toThrow('读取失败');
  const reopened = createBusinessService(second.db, {connectors}); await expect(reopened.syncTikHub({videoId: '1234567890123', confirmed: true})).rejects.toThrow('上限'); expect(connectors.tikhub).toHaveBeenCalledTimes(1);
});

it('sends credentials only to configured endpoints and blocks redirects', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({data: {payload: []}})));
  const connectors = createBusinessConnectors({BUSINESS_CHATWOOT_URL: 'https://inbox.example.test', BUSINESS_CHATWOOT_ACCOUNT_ID: '3', BUSINESS_CHATWOOT_TOKEN: 'private-test'}, fetcher);
  await connectors.chatwoot(2); expect(fetcher.mock.calls[0]).toEqual([expect.stringContaining('/api/v1/accounts/3/conversations?status=all&assignee_type=all&page=2'), expect.objectContaining({redirect: 'error', headers: {api_access_token: 'private-test'}})]);
});

it('protects business APIs and exports with session, origin and CSRF checks', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'showki-business-api-')), origin = 'http://localhost:3000', username = 'business@example.test', password = 'isolated-business-test-password';
  setupContentAdmin({dataDir: dir, username, password}); const server = createContentAdminServer({dataDir: dir, allowedOrigin: origin, secureCookies: false, publishedContentPath: path.join(dir, 'published.json'), publicUploadDir: path.join(dir, 'uploads')});
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port'); const base = `http://127.0.0.1:${address.port}`;
  cleanups.push(async () => {await new Promise<void>((resolve, reject) => {server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();}); await rm(dir, {recursive: true, force: true});});
  expect((await fetch(base + '/api/cms/business/opportunities')).status).toBe(401);
  const login = await fetch(base + '/api/cms/auth/login', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify({username, password})});
  const cookie = login.headers.get('set-cookie')!.split(';')[0], auth = await login.json();
  const headers = {Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': auth.csrfToken};
  expect((await fetch(base + '/api/cms/business/opportunities', {method: 'POST', headers: {...headers, 'X-CSRF-Token': ''}, body: '{}'})).status).toBe(403);
  const create = await fetch(base + '/api/cms/business/opportunities', {method: 'POST', headers, body: JSON.stringify({name: 'Local test'})}); expect(create.status).toBe(201); const lead = await create.json();
  const response = await fetch(base + '/api/cms/business/documents', {method: 'POST', headers, body: JSON.stringify({opportunityId: lead.id, kind: 'quote'})}); expect(response.status).toBe(201); const doc = await response.json();
  const exportUrl = base + `/api/cms/business/documents/${doc.id}/export`; expect((await fetch(exportUrl)).status).toBe(401);
  const exported = await fetch(exportUrl, {headers}); expect(exported.status).toBe(200); expect(exported.headers.get('cache-control')).toBe('no-store'); expect(await exported.text()).toContain('待人工复核');
});
