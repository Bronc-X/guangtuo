import {createTranslationPreparer} from '../../services/content-admin/translation';
import {mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import type {Server} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

import {afterEach, describe, expect, it} from 'vitest';
import {PDFDocument, PDFName} from 'pdf-lib';

import {createContentAdminServer, type ContentAdminServerOptions} from '../../services/content-admin/server';
import {hashPassword, verifyPassword} from '../../services/content-admin/password';
import {setupContentAdmin} from '../../services/content-admin/setup';
import type {ArticleDto, HomeDto, MediaDto, PublishedContentSnapshot} from '../../src/lib/content-admin-contracts';
import type {KnowledgeDocument} from '../../src/lib/knowledge-contracts';

const allowedOrigin = 'http://localhost:3000';
const adminUsername = 'owner@guangtuo.test';
const adminPassword = 'a-long-local-test-password';
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

type RunningCms = {
  baseUrl: string;
  dataDir: string;
  publishedContentPath: string;
  publicUploadDir: string;
  server: Server;
};

type Auth = {cookie: string; csrfToken: string};

async function awaitRelease(cms: RunningCms, auth: Auth, response: Response, expected: 'live' | 'failed' = 'live') {
  expect(response.status, await response.clone().text()).toBe(202);
  const ticket = await json<{releaseId: string; status: string}>(response);
  expect(ticket).toMatchObject({releaseId: expect.any(String), status: 'building'});
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const releases = await json<{items: Array<{id: string; status: string; message?: string}>}>(
      await fetch(`${cms.baseUrl}/api/cms/releases`, {headers: adminHeaders(auth)})
    );
    const release = releases.items.find((item) => item.id === ticket.releaseId);
    if (release?.status === expected) return release;
    if (release?.status === 'failed' || release?.status === 'live') {
      throw new Error(`Expected ${expected} release, received ${release.status}: ${release.message ?? ''}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Release ${ticket.releaseId} did not finish`);
}

const cleanups: Array<() => Promise<void>> = [];

it('creates manual marketing content from the scheduling screen with authentication and CSRF', async()=>{
  const cms=await startCms();const auth=await login(cms),headers=adminHeaders(auth,{'Content-Type':'application/json'});
  const uploaded=await fetch(cms.baseUrl+'/api/cms/media',{method:'POST',headers:adminHeaders(auth,{'Content-Type':'image/png','X-File-Name':'manual.png'}),body:transparentPng});const image=await uploaded.json();
  const body=JSON.stringify({requestId:crypto.randomUUID(),title:'手写图文计划',text:'第一段\n\n第二段',imageMediaId:image.id});const url=cms.baseUrl+'/api/cms/marketing/campaigns/manual';
  expect((await fetch(url,{method:'POST',headers:{Origin:allowedOrigin,'Content-Type':'application/json'},body})).status).toBe(401);
  expect((await fetch(url,{method:'POST',headers:{Origin:allowedOrigin,Cookie:auth.cookie,'Content-Type':'application/json'},body})).status).toBe(403);
  const created=await fetch(url,{method:'POST',headers,body});expect(created.status).toBe(201);const campaign=await created.json();expect(campaign.copy.posts[0].text).toBe('第一段\n\n第二段');
  const repeated=await (await fetch(url,{method:'POST',headers,body})).json();expect(repeated.id).toBe(campaign.id);
  const draft=await fetch(cms.baseUrl+'/api/cms/buffer/schedules',{method:'POST',headers,body:JSON.stringify({requestId:crypto.randomUUID(),campaignId:campaign.id,version:1,platform:'linkedin',media:'image',mode:'addToQueue',aiGenerated:false})});expect(draft.status).toBe(201);expect(await draft.json()).toMatchObject({title:'手写图文计划',state:'draft',text:'第一段\n\n第二段'});
});

it('protects Buffer credentials and serves only token-scoped media with byte ranges', async () => {
  const cms=await startCms({bufferClient:()=>({organizations:async()=>[{id:'org',name:'QA'}],channels:async()=>[],create:async()=>{throw new Error('not called');},get:async()=>null,remove:async()=>{}})});
  expect((await fetch(cms.baseUrl+'/api/cms/buffer/connection')).status).toBe(401);
  const auth=await login(cms),headers=adminHeaders(auth,{'Content-Type':'application/json'});
  const body=JSON.stringify({key:'local-buffer-test-key'});
  expect((await fetch(cms.baseUrl+'/api/cms/buffer/connection',{method:'POST',headers:{Cookie:auth.cookie,Origin:allowedOrigin,'Content-Type':'application/json'},body})).status).toBe(403);
  const connection=await fetch(cms.baseUrl+'/api/cms/buffer/connection',{method:'POST',headers,body});expect(connection.status).toBe(200);expect(await connection.text()).not.toContain('local-buffer-test-key');
  const upload=await fetch(cms.baseUrl+'/api/cms/media',{method:'POST',headers:adminHeaders(auth,{'Content-Type':'image/png','X-File-Name':'buffer.png'}),body:transparentPng});const image=await upload.json();
  const campaign=await (await fetch(cms.baseUrl+'/api/cms/marketing/campaigns',{method:'POST',headers,body:JSON.stringify({topic:'Buffer QA',facts:'产品支持定制',language:'zh',imageMediaId:image.id,mode:'template'})})).json();
  const draft=await fetch(cms.baseUrl+'/api/cms/buffer/schedules',{method:'POST',headers,body:JSON.stringify({requestId:crypto.randomUUID(),campaignId:campaign.id,version:1,platform:'linkedin',media:'image',mode:'addToQueue',aiGenerated:false})});expect(draft.status).toBe(201);const job=await draft.json();expect(job.assetToken).toBeUndefined();
  const db=new DatabaseSync(path.join(cms.dataDir,'content-admin.sqlite'));
  const saved=JSON.parse((db.prepare('SELECT payload FROM buffer_schedules WHERE id=?').get(job.id) as {payload:string}).payload);db.close();
  const url=cms.baseUrl+`/api/marketing/buffer-media/${job.id}/${saved.assetToken}`;
  const bytes=await fetch(url,{headers:{Range:'bytes=0-3'}});expect(bytes.status).toBe(206);expect((await bytes.arrayBuffer()).byteLength).toBe(4);
  expect((await fetch(url,{method:'HEAD'})).status).toBe(200);
  expect((await fetch(url,{headers:{Range:'bytes=999999-'}})).status).toBe(416);
  expect((await fetch(url.replace(saved.assetToken,'0'.repeat(64)))).status).toBe(404);
  expect((await fetch(cms.baseUrl+`/api/cms/buffer/schedules/${job.id}/cancel`,{method:'POST',headers,body:'{}'})).status).toBe(200);
  expect((await fetch(url)).status).toBe(404);
});

it('protects content AI jobs with login and CSRF and returns asynchronous generation progress', async () => {
  const cms = await startCms({contentAiProvider: {configured: true, textModel:'test-text', imageModel:'test-image', text:async () => ({textPrompt:'根据已核实资料撰写原创文章，不添加未经核实的事实。',imagePrompt:'眼膜产品摄影，柔和光线，白色背景，简洁构图。'}), image:async () => transparentPng}});
  expect((await fetch(cms.baseUrl + '/api/cms/content-ai/jobs')).status).toBe(401);
  const auth = await login(cms), headers = adminHeaders(auth, {'Content-Type':'application/json'});
  const endpoint = cms.baseUrl + '/api/cms/content-ai/jobs';
  const body = JSON.stringify({kind:'article',topic:'定制流程',facts:'水凝胶眼膜支持包装定制'});
  expect((await fetch(endpoint, {method:'POST',headers:{Cookie:auth.cookie,Origin:allowedOrigin,'Content-Type':'application/json'},body})).status).toBe(403);
  const created = await fetch(endpoint,{method:'POST',headers,body}); expect(created.status).toBe(201);
  const job = await created.json();
  expect((await fetch(`${endpoint}/${job.id}/write`,{method:'POST',headers,body:JSON.stringify({version:1})})).status).toBe(422);
  const started = await fetch(`${endpoint}/${job.id}/plan`,{method:'POST',headers,body:JSON.stringify({version:1})}); expect(started.status).toBe(202);
  const result = await fetch(`${endpoint}/${job.id}`,{headers}); expect(result.headers.get('cache-control')).toContain('no-store'); expect(await result.json()).toMatchObject({state:'planned',prompts:{textPrompt:expect.any(String)}});
});

it('provides a private company-library workflow with reviewed free retrieval and original download', async () => {
  const cms = await startCms();
  const auth = await login(cms);
  const headers = adminHeaders(auth, {'Content-Type': 'application/json'});
  const response = await fetch(`${cms.baseUrl}/api/cms/knowledge/documents`, {method: 'POST', headers, body: JSON.stringify({title: '公司产品资料', locale: 'zh', skus: ['GT-EM-001'], text: '水凝胶眼膜支持包装定制。\n\n报价需确认。'})});
  expect(response.status).toBe(201);
  const document = await response.json();
  const base = `${cms.baseUrl}/api/cms/knowledge/documents/${document.id}`;
  expect((await fetch(base + '/contents')).status).toBe(401);
  const contents = await fetch(base + '/contents', {headers});
  expect(contents.headers.get('cache-control')).toContain('no-store');
  expect(await contents.json()).toMatchObject({document: {title: '公司产品资料'}, chunks: [{text: '水凝胶眼膜支持包装定制。\n\n报价需确认。'}]});
  const search = () => fetch(`${cms.baseUrl}/api/cms/knowledge/search`, {method: 'POST', headers, body: JSON.stringify({query: '水凝胶', audience: 'customer', mode: 'bm25'})}).then(res => res.json());
  expect((await search()).items).toHaveLength(0);
  const activated = await fetch(base, {method: 'PATCH', headers, body: JSON.stringify({version: document.version, status: 'active', visibility: 'customer', reviewed: true})});
  expect(activated.status).toBe(200);
  const active = await activated.json();
  expect((await search()).items[0].documentId).toBe(document.id);
  const original = await fetch(base + '/file', {headers});
  expect(await original.text()).toBe('水凝胶眼膜支持包装定制。\n\n报价需确认。');
  expect((await fetch(base, {method: 'PATCH', headers, body: JSON.stringify({version: active.version, status: 'archived'})})).status).toBe(200);
  expect((await search()).items).toHaveLength(0);
});

it('authenticates each administrator independently and rejects cross-account passwords', async () => {
  const cms = await startCms();
  const username = 'editor@guangtuo.test';
  const password = 'a-separate-local-test-password';
  const db = new DatabaseSync(path.join(cms.dataDir, 'content-admin.sqlite'));
  try {
    db.prepare('INSERT INTO admin_users (id, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('second-admin', username, 'Second editor', hashPassword(password), new Date().toISOString());
  } finally { db.close(); }
  const attempt = (name: string, secret: string) => fetch(`${cms.baseUrl}/api/cms/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
    body: JSON.stringify({username: name, password: secret})
  });
  expect((await attempt(username, adminPassword)).status).toBe(401);
  expect((await attempt('unknown@guangtuo.test', adminPassword)).status).toBe(401);
  const response = await attempt(username.toUpperCase(), password);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({authenticated: true, user: {username, name: 'Second editor'}});
  const cookie = response.headers.get('set-cookie')!.split(';', 1)[0];
  const session = await fetch(`${cms.baseUrl}/api/cms/session`, {headers: {Cookie: cookie}});
  expect(await session.json()).toMatchObject({authenticated: true, user: {username}});
  expect((await attempt(adminUsername, password)).status).toBe(401);
  await login(cms);
});

it('accepts a minimal WeChat lead and keeps its uploaded packaging preview private', async () => {
  const cms = await startCms();
  const response = await fetch(`${cms.baseUrl}/api/inquiries`, {method: 'POST', headers: {Origin: allowedOrigin, 'Content-Type': 'application/json', 'Idempotency-Key': 'minimal-contact-preview-123'}, body: JSON.stringify({name: 'QA preview', contact: 'wx_qa', category: '乳液', privacyConsent: true, design: {kind: 'existing', sku: 'SK-LOTION-150', specifications: {capacity: '150ml'}, assemblyState: 'closed'}})});
  expect(response.status).toBe(202);
  const created = await response.json() as {id: string; accessToken: string};
  const upload = (token: string) => fetch(`${cms.baseUrl}/api/inquiries/${created.id}/preview`, {method: 'POST', headers: {Origin: allowedOrigin, 'Content-Type': 'image/png', Authorization: `Bearer ${token}`}, body: transparentPng});
  expect((await upload('invalid')).status).toBe(404);
  expect((await upload(created.accessToken)).status).toBe(200);
  const previewUrl = `${cms.baseUrl}/api/cms/inquiries/${created.id}/preview`;
  expect((await fetch(previewUrl)).status).toBe(401);
  const auth = await login(cms);
  const preview = await fetch(previewUrl, {headers: adminHeaders(auth)});
  expect(preview.status).toBe(200);
  expect(preview.headers.get('cache-control')).toBe('no-store');
  const read = await fetch(`${cms.baseUrl}/api/cms/inquiries/${created.id}/read`, {method: 'POST', headers: adminHeaders(auth), body: '{}'});
  expect(await read.json()).toMatchObject({readAt: expect.any(Number), previewReady: true, input: {contact: 'wx_qa', businessEmail: ''}});
});

it('lets an owner publish company text, contacts and a matching QR from the about editor', async () => {
  const cms = await startCms();
  const auth = await login(cms);
  const listing = await (await fetch(`${cms.baseUrl}/api/cms/content/pages`, {headers: adminHeaders(auth)})).json() as {items: Array<{id: string; version: number; fields: Record<string, unknown>}>};
  const about = listing.items.find(item => item.id === 'about')!;
  expect(about.fields.contactWechat).toBe('13427620687');
  const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'wechat.png'}), body: transparentPng});
  expect(upload.status).toBe(201);
  const media = await upload.json() as MediaDto;
  const fields = {...about.fields, profileTitle: '公司介绍维护测试', profileBody: '更新后的公司正文。', contactWechat: 'showki_qa_wechat', wechatQrMediaId: media.id, videoId: 'Em685F3Ec2A'};
  const saved = await fetch(`${cms.baseUrl}/api/cms/content/pages/about`, {method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: about.version, fields})});
  expect(saved.status).toBe(200);
  const updated = await saved.json() as {version: number};
  const published = await fetch(`${cms.baseUrl}/api/cms/content/pages/about/publish`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: updated.version})});
  await awaitRelease(cms, auth, published);
  const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8'));
  const page = snapshot.pageOverrides.find((page: {pageId: string}) => page.pageId === 'about');
  expect(page).toMatchObject({profileTitle: fields.profileTitle, profileBody: fields.profileBody, contactWechat: fields.contactWechat, wechatQr: expect.stringContaining('/uploads/cms/')});
  expect((await stat(path.join(cms.publicUploadDir, path.basename(page.wechatQr)))).isFile()).toBe(true);
});

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

it('retains line breaks and font sizes through save, translation and publication for every content kind', async () => {
  const cms = await startCms();
  const auth = await login(cms);
  const headers = adminHeaders(auth, {'Content-Type': 'application/json'});
  const mutate = async (route: string, method: string, body: unknown) => {
    const response = await fetch(`${cms.baseUrl}${route}`, {method, headers, body: JSON.stringify(body)});
    expect(response.status, await response.clone().text()).toBeLessThan(300);
    return response.json();
  };
  const text = '第一行\n\n第三行';
  const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type':'image/png','X-File-Name':'font-test.png'}), body: transparentPng});
  const media = await upload.json() as MediaDto;
  const home = await mutate('/api/cms/home', 'PATCH', {version:0,heroTitle:text,heroBody:text,heroMediaId:media.id,textStyles:{heroTitle:32,heroBody:18}});
  await awaitRelease(cms, auth, await fetch(`${cms.baseUrl}/api/cms/home/publish`, {method: 'POST', headers, body: JSON.stringify({version:home.version})}));
  const article = await mutate('/api/cms/articles', 'POST', {title:text,summary:text,body:text,category:'公司动态',coverMediaId:media.id,textStyles:{title:34,summary:18,body:20}});
  await awaitRelease(cms, auth, await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {method: 'POST', headers, body: JSON.stringify({version:article.version})}));
  for(const [kind,field,snapshotKey] of [['pages','heroBody','pageOverrides'],['products','description','productOverrides'],['formats','effects','formatOverrides'],['credentials','title','credentialOverrides']] as const) {
    const listing = await (await fetch(`${cms.baseUrl}/api/cms/content/${kind}`, {headers})).json();
    const record = listing.items[0];
    const saved = await mutate(`/api/cms/content/${kind}/${record.id}`, 'PATCH', {version:record.version,fields:{...record.fields,[field]:text,textStyles:{[field]:22}}});
    await awaitRelease(cms, auth, await fetch(`${cms.baseUrl}/api/cms/content/${kind}/${record.id}/publish`, {method: 'POST', headers, body: JSON.stringify({version:saved.version})}));
    const snapshot = JSON.parse(await readFile(cms.publishedContentPath,'utf8'));
    expect(snapshot[snapshotKey].some((item: Record<string,unknown>) => item[field] === text && JSON.stringify(item.textStyles) === JSON.stringify({[field]:22}))).toBe(true);
  }
  const snapshot = JSON.parse(await readFile(cms.publishedContentPath,'utf8'));
  expect(snapshot.home).toMatchObject({heroTitle:text,textStyles:{heroTitle:32,heroBody:18}});
  expect(snapshot.articles[0]).toMatchObject({body:text,textStyles:{title:34,summary:18,body:20}});
  expect(Object.keys(snapshot.translations)).toHaveLength(5);
  const reset = await mutate('/api/cms/home', 'PATCH', {textStyles:{},version:home.version,heroTitle:text,heroBody:text,heroMediaId:media.id});
  expect(reset.textStyles).toEqual({});
});

async function startCms(overrides: Partial<ContentAdminServerOptions> = {}): Promise<RunningCms> {
  const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-test-'));
  const dataDir = path.join(root, 'private');
  const publishedContentPath = path.join(root, 'content', 'published-content.json');
  const publicUploadDir = path.join(root, 'public', 'uploads', 'cms');
  setupContentAdmin({dataDir, username: adminUsername, password: adminPassword, publishedContentPath});

  const options: ContentAdminServerOptions = {
    dataDir,
    prepareTranslations: createTranslationPreparer(dataDir, async requests => requests.map(({target, text}) => `${target} translated ${(text.match(/\d+(?:[.,]\d+)*/g) ?? []).join(' ')}`)),
    publishedContentPath,
    publicUploadDir,
    allowedOrigin,
    secureCookies: false,
    // Small static renderer stands in for the external Next/Nginx deployment adapter.
    deployRelease: async ({snapshotPath}) => {
      const content = JSON.parse(await readFile(snapshotPath, 'utf8'));
      await mkdir(path.join(root, 'live'), {recursive: true});
      await writeFile(path.join(root, 'live', 'index.html'), `<h1>${content.home?.heroTitle ?? 'Website'}</h1>`);
    },
    ...overrides
  };
  const server = createContentAdminServer(options);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('CMS test server did not bind to a TCP port');

  cleanups.push(async () => {
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(root, {recursive: true, force: true});
  });

  return {baseUrl: `http://127.0.0.1:${address.port}`, dataDir, publishedContentPath, publicUploadDir, server};
}

async function json<T = unknown>(response: Response): Promise<T> {
  return await response.json() as T;
}

async function login(cms: RunningCms): Promise<Auth> {
  const response = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
    body: JSON.stringify({username: adminUsername, password: adminPassword})
  });
  expect(response.status).toBe(200);
  const body = await json<{csrfToken: string}>(response);
  const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
  if (!cookie) throw new Error('Login did not set a session cookie');
  return {cookie, csrfToken: body.csrfToken as string};
}

function adminHeaders(auth?: Auth, extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra);
  headers.set('Origin', allowedOrigin);
  if (auth) {
    headers.set('Cookie', auth.cookie);
    headers.set('X-CSRF-Token', auth.csrfToken);
  }
  return headers;
}

describe('private knowledge and controlled generation', () => {
  it('runs approved-source mail generation, manual approval and one send through the real CMS API', async () => {
    const sent: string[] = [];
    const cms = await startCms({generationProvider: {id: 'loopback-test-only', generate: async request => {
      expect(request.input).not.toContain('buyer@example.test');
      const evidence = JSON.parse(request.input).evidence[0];
      return {title: 'Jar proposal', body: 'GT-JAR-050 holds 50 ml. Please confirm your requirements.', citations: [{chunkId: evidence.chunkId, quote: evidence.text}]};
    }}, mailSender: async mail => { sent.push(mail.to); return {messageId: 'local-only'}; }});
    const auth = await login(cms);
    const mutate = (route: string, body: unknown, method = 'POST') => fetch(cms.baseUrl + route, {method, headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(body)});
    const doc = await (await mutate('/api/cms/knowledge/documents', {title: 'Jar data', text: 'GT-JAR-050 holds 50 ml.', locale: 'en', skus: ['GT-JAR-050']})).json();
    await mutate(`/api/cms/knowledge/documents/${doc.id}`, {version: 1, status: 'active', visibility: 'customer', reviewed: true}, 'PATCH');
    const input = {name: 'QA', businessEmail: 'buyer@example.test', company: 'QA', market: 'France', category: 'eye', sku: 'GT-JAR-050', configuration: 'White', quantity: '1000', budget: 'Discuss', launchDate: '2027', productGoal: 'Jar', packagingPreference: 'Jar', certificationConstraints: '', notes: '', privacyConsent: true};
    const submission = await fetch(`${cms.baseUrl}/api/inquiries`, {method: 'POST', headers: {Origin: allowedOrigin, 'Content-Type': 'application/json', 'Idempotency-Key': 'cms-rag-mail-12345'}, body: JSON.stringify(input)});
    expect(submission.status).toBe(202); const created = await submission.json();
    const base = `/api/cms/inquiries/${created.id}`;
    expect((await mutate(`${base}/generate`, {version: 1, mode: 'bm25', confirmed: false})).status).toBe(400);
    const generated = await mutate(`${base}/generate`, {version: 1, mode: 'bm25', confirmed: true});
    expect(generated.status).toBe(200); const draft = await generated.json();
    expect(draft).toMatchObject({generator: 'rag', email: {status: 'pending_review', to: input.businessEmail}, grounding: {model: 'loopback-test-only'}});
    expect((await mutate(`${base}/send`, {})).status).toBe(409);
    expect((await mutate(`${base}/approve`, {version: draft.version, confirmed: true})).status).toBe(200);
    expect((await mutate(`${base}/send`, {})).status).toBe(200);
    expect((await mutate(`${base}/send`, {})).status).toBe(200);
    expect(sent).toEqual([input.businessEmail]);
    const brief = await (await mutate('/api/cms/studio/briefs', {query: 'GT-JAR-050', sku: 'GT-JAR-050', locale: 'en', mode: 'bm25', confirmed: true})).json();
    expect(brief.grounding.citations).toHaveLength(1);
    await mutate(`/api/cms/knowledge/documents/${doc.id}`, {version: 2, status: 'archived'}, 'PATCH');
    const concept = await mutate('/api/cms/studio/concept-images', {sku: 'GT-JAR-050', prompt: brief.body, briefId: brief.id, confirmed: true});
    expect(concept.status).toBe(409); expect(await concept.json()).toMatchObject({error: {code: 'RAG_SOURCES_STALE'}});
  });
  it('protects ingestion, retains parse failures, requires source review and reports missing providers', async () => {
    const cms = await startCms(); const auth = await login(cms);
    for (const route of ['/api/cms/knowledge', '/api/cms/ai/status', '/api/cms/studio/status']) {
      expect((await fetch(cms.baseUrl + route)).status).toBe(401);
    }
    const mutate = (route: string, body: unknown, method = 'POST') => fetch(cms.baseUrl + route, {method, headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(body)});
    const noCsrf = await fetch(`${cms.baseUrl}/api/cms/knowledge/documents`, {method: 'POST', headers: {Origin: allowedOrigin, Cookie: auth.cookie, 'Content-Type': 'application/json'}, body: '{}'});
    expect(noCsrf.status).toBe(403);
    const created = await mutate('/api/cms/knowledge/documents', {title: 'Jar data', text: 'GT-JAR-050 holds 50 ml.', locale: 'en', skus: ['GT-JAR-050']});
    expect(created.status).toBe(201);
    const doc = await created.json() as KnowledgeDocument;
    expect(doc).toMatchObject({parseState: 'ready', visibility: 'internal', status: 'draft'});
    expect((await (await mutate('/api/cms/knowledge/search', {query: 'GT-JAR-050'})).json()).items).toHaveLength(0);
    expect((await mutate(`/api/cms/knowledge/documents/${doc.id}`, {version: 1, status: 'active', visibility: 'customer'}, 'PATCH')).status).toBe(409);
    expect((await mutate(`/api/cms/knowledge/documents/${doc.id}`, {version: 1, status: 'active', visibility: 'customer', reviewed: true}, 'PATCH')).status).toBe(200);
    const search = await (await mutate('/api/cms/knowledge/search', {query: 'GT-JAR-050'})).json();
    expect(search.items[0]).toMatchObject({documentId: doc.id, version: 2});
    expect((await mutate('/api/cms/knowledge/search', {query: 'GT-JAR-050', mode: 'hybrid', confirmed: true})).status).toBe(503);
    const upload = await fetch(`${cms.baseUrl}/api/cms/knowledge/uploads?title=Bad&locale=en`, {method: 'POST', headers: adminHeaders(auth, {'X-File-Name': 'bad.pdf', 'Content-Type': 'application/octet-stream'}), body: 'not pdf'});
    expect(upload.status).toBe(422);
    expect(await upload.json()).toMatchObject({error: {code: 'DOCUMENT_PARSE_FAILED', current: {parseState: 'failed'}}});
    const brief = await mutate('/api/cms/studio/briefs', {query: 'Jar', sku: 'GT-JAR-050', locale: 'en', mode: 'bm25', confirmed: true});
    expect(brief.status).toBe(503);
    expect(await brief.json()).toMatchObject({error: {code: 'RAG_NOT_CONFIGURED'}});
  });
});

describe('single-user setup', () => {
  it('requires an explicit strong password and stores only its scrypt hash', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-setup-'));
    cleanups.push(() => rm(root, {recursive: true, force: true}));

    expect(() => setupContentAdmin({dataDir: root, username: adminUsername, password: ''}))
      .toThrow('CMS admin password is required');

    setupContentAdmin({dataDir: root, username: adminUsername, password: adminPassword});
    const db = new DatabaseSync(path.join(root, 'content-admin.sqlite'));
    const row = db.prepare('SELECT username, password_hash FROM admin_users').get() as {username: string; password_hash: string};
    db.close();

    expect(row.username).toBe(adminUsername);
    expect(row.password_hash).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(row.password_hash).not.toContain(adminPassword);
    expect(() => setupContentAdmin({dataDir: root, username: 'other@example.test', password: 'another-long-password'}))
      .toThrow('CMS admin is already configured');
  });

  it('verifies the stored password without synchronously blocking the request thread', async () => {
    const verification = verifyPassword(adminPassword, hashPassword(adminPassword));
    expect(verification).toBeInstanceOf(Promise);
    await expect(verification).resolves.toBe(true);
  });
});

describe('session, origin and CSRF boundaries', () => {
  it('uses exact credentialed CORS and protects every management collection', async () => {
    const cms = await startCms();

    const preflight = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'OPTIONS',
      headers: {Origin: allowedOrigin, 'Access-Control-Request-Method': 'PATCH'}
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(allowedOrigin);
    expect(preflight.headers.get('access-control-allow-credentials')).toBe('true');

    for (const route of ['/api/cms/home', '/api/cms/articles', '/api/cms/media', '/api/cms/releases']) {
      const response = await fetch(`${cms.baseUrl}${route}`, {headers: {Origin: allowedOrigin}});
      expect(response.status, route).toBe(401);
    }

    const wrongOrigin = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Origin: 'http://evil.example'},
      body: JSON.stringify({username: adminUsername, password: adminPassword})
    });
    expect(wrongOrigin.status).toBe(403);
    expect(wrongOrigin.headers.get('access-control-allow-origin')).toBeNull();

    const auth = await login(cms);
    const cookieHeader = (await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
      body: JSON.stringify({username: adminUsername, password: adminPassword})
    })).headers.get('set-cookie') ?? '';
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Strict');
    expect(cookieHeader).toContain('Path=/');
    expect(cookieHeader).toContain('Max-Age=28800');

    const sameOriginGetWithoutOrigin = await fetch(`${cms.baseUrl}/api/cms/home`, {headers: {Cookie: auth.cookie}});
    expect(sameOriginGetWithoutOrigin.status).toBe(200);
    expect(sameOriginGetWithoutOrigin.headers.get('access-control-allow-origin')).toBeNull();
    const foreignGet = await fetch(`${cms.baseUrl}/api/cms/home`, {
      headers: {Cookie: auth.cookie, Origin: 'http://evil.example'}
    });
    expect(foreignGet.status).toBe(403);

    const withoutCsrf = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH',
      headers: adminHeaders({cookie: auth.cookie, csrfToken: ''}, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 0, heroTitle: '标题', heroBody: '简介', heroMediaId: null})
    });
    expect(withoutCsrf.status).toBe(403);

    const wrongMutationOrigin = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH',
      headers: {Cookie: auth.cookie, 'X-CSRF-Token': auth.csrfToken, 'Content-Type': 'application/json', Origin: 'http://evil.example'},
      body: JSON.stringify({version: 0, heroTitle: '标题', heroBody: '简介', heroMediaId: null})
    });
    expect(wrongMutationOrigin.status).toBe(403);

    const logout = await fetch(`${cms.baseUrl}/api/cms/auth/logout`, {method: 'POST', headers: adminHeaders(auth)});
    expect(logout.status).toBe(204);
    const afterLogout = await fetch(`${cms.baseUrl}/api/cms/session`, {headers: adminHeaders(auth)});
    expect(afterLogout.status).toBe(200);
    expect(await json(afterLogout)).toEqual({authenticated: false});
  });

  it('refuses to start before the explicit administrator setup has run', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-unconfigured-'));
    cleanups.push(() => rm(root, {recursive: true, force: true}));
    expect(() => createContentAdminServer({
      dataDir: path.join(root, 'private'),
      publishedContentPath: path.join(root, 'missing.json'),
      publicUploadDir: path.join(root, 'public'),
      allowedOrigin,
      secureCookies: false
    })).toThrow('CMS administrator is not configured; run cms:setup first');
  });

  it('rate limits repeated password failures for the same account and client', async () => {
    const cms = await startCms();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
        body: JSON.stringify({username: adminUsername, password: 'definitely-the-wrong-password'})
      });
      expect(response.status).toBe(401);
    }
    const blocked = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
      body: JSON.stringify({username: adminUsername, password: adminPassword})
    });
    expect(blocked.status).toBe(429);
  });

  it('rate limits the client even when failed logins rotate usernames', async () => {
    const cms = await startCms();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
        body: JSON.stringify({username: `rotated-${attempt}@example.test`, password: 'definitely-the-wrong-password'})
      });
      expect(response.status).toBe(401);
    }
    const blocked = await fetch(`${cms.baseUrl}/api/cms/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Origin: allowedOrigin},
      body: JSON.stringify({username: adminUsername, password: adminPassword})
    });
    expect(blocked.status).toBe(429);
  });

  it('persists only the session hash and restores the session after a server restart', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const rawToken = auth.cookie.split('=', 2)[1];

    const db = new DatabaseSync(path.join(cms.dataDir, 'content-admin.sqlite'));
    const stored = db.prepare('SELECT token_hash, csrf_token FROM admin_sessions').get() as {token_hash: string; csrf_token: string};
    db.close();
    expect(stored.token_hash).not.toContain(rawToken);
    expect(stored.csrf_token).toBe(auth.csrfToken);

    await new Promise<void>((resolve) => cms.server.close(() => resolve()));
    const restarted = createContentAdminServer({
      dataDir: cms.dataDir,
      publishedContentPath: cms.publishedContentPath,
      publicUploadDir: cms.publicUploadDir,
      allowedOrigin,
      secureCookies: false
    });
    await new Promise<void>((resolve, reject) => {
      restarted.once('error', reject);
      restarted.listen(0, '127.0.0.1', resolve);
    });
    const address = restarted.address();
    if (!address || typeof address === 'string') throw new Error('Restarted CMS did not bind');
    cleanups.push(async () => {
      if (restarted.listening) await new Promise<void>((resolve) => restarted.close(() => resolve()));
    });

    const session = await fetch(`http://127.0.0.1:${address.port}/api/cms/session`, {
      headers: adminHeaders(auth)
    });
    expect(session.status).toBe(200);
    expect(await json(session)).toMatchObject({
      authenticated: true,
      user: {username: adminUsername},
      csrfToken: auth.csrfToken
    });
  });
});

describe('homepage drafts and releases', () => {
  it('keeps the live site and all published versions unchanged when a translation fails, then retries safely', async () => {
    let fail = false;
    let deployed = 0;
    const cms = await startCms({
      prepareTranslations: async snapshot => {
        if (fail) throw new Error('测试翻译服务不可用');
        return createTranslationPreparer(cms.dataDir, async requests => requests.map(({target}) => `${target} translated`))(snapshot);
      },
      deployRelease: async () => {deployed += 1;}
    });
    const auth = await login(cms);
    const save = (version: number, title: string) => fetch(`${cms.baseUrl}/api/cms/home`, {method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version, heroTitle: title, heroBody: '中文介绍', heroMediaId: null})});
    const publish = (version: number) => fetch(`${cms.baseUrl}/api/cms/home/publish`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version})});
    expect((await save(0, '原有标题')).status).toBe(200);
    await awaitRelease(cms, auth, await publish(1));
    const live = await readFile(cms.publishedContentPath, 'utf8');
    expect((await save(1, '修改后的标题')).status).toBe(200);
    fail = true;
    const failed = await awaitRelease(cms, auth, await publish(2), 'failed');
    expect(failed.message).toContain('测试翻译服务不可用');
    expect(await readFile(cms.publishedContentPath, 'utf8')).toBe(live);
    expect(deployed).toBe(1);
    const draft = await (await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)})).json();
    expect(draft).toMatchObject({status: 'draft', heroTitle: '修改后的标题', published: {heroTitle: '原有标题'}});
    fail = false;
    await awaitRelease(cms, auth, await publish(2));
    expect(deployed).toBe(2);
    const next = JSON.parse(await readFile(cms.publishedContentPath, 'utf8'));
    for (const locale of ['en', 'fr', 'es', 'ru', 'ar']) expect(next.translations[locale]['修改后的标题']).toBe(`${locale} translated`);
  });

  it('keeps the published homepage unchanged until a matching draft version is published', async () => {
    const cms = await startCms();
    const auth = await login(cms);

    const initial = await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)});
    expect(await json(initial)).toMatchObject({version: 0, status: 'draft', published: null});

    const firstDraft = {version: 0, heroTitle: '第一版首页标题', heroBody: '第一版首页简介', heroMediaId: null};
    const saved = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(firstDraft)
    });
    expect(saved.status).toBe(200);
    expect(await json(saved)).toMatchObject({...firstDraft, version: 1, status: 'draft', published: null});

    const stale = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(firstDraft)
    });
    expect(stale.status).toBe(409);
    expect(await json(stale)).toMatchObject({error: {code: 'VERSION_CONFLICT', current: {version: 1}}});

    const published = await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: 1})
    });
    await awaitRelease(cms, auth, published);
    expect(await json(await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)}))).toMatchObject({version: 1, status: 'published', published: {heroTitle: firstDraft.heroTitle}});

    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(snapshot).toMatchObject({schemaVersion: 1, home: {heroTitle: firstDraft.heroTitle}, articles: []});
    expect((await readdir(path.dirname(cms.publishedContentPath))).filter((name) => name.includes('.tmp-'))).toEqual([]);

    const second = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH',
      headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({...firstDraft, version: 1, heroTitle: '尚未发布的第二版'})
    });
    expect(await json(second)).toMatchObject({version: 2, heroTitle: '尚未发布的第二版', published: {heroTitle: firstDraft.heroTitle}});
    const unchangedSnapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(unchangedSnapshot.home?.heroTitle).toBe(firstDraft.heroTitle);

    const releases = await fetch(`${cms.baseUrl}/api/cms/releases`, {headers: adminHeaders(auth)});
    expect(await json(releases)).toMatchObject({items: [{kind: 'home', title: '首页', status: 'live'}]});

    const auditDatabase = new DatabaseSync(path.join(cms.dataDir, 'content-admin.sqlite'));
    const audit = auditDatabase.prepare('SELECT action, detail_json FROM audit_events ORDER BY created_at').all() as Array<{action: string; detail_json: string}>;
    auditDatabase.close();
    expect(audit.map((event) => event.action)).toEqual(expect.arrayContaining(['auth.login', 'home.save', 'home.publish']));
    expect(JSON.stringify(audit)).not.toContain(adminPassword);
    expect(JSON.stringify(audit)).not.toContain(auth.cookie);
    expect(JSON.stringify(audit)).not.toContain(auth.csrfToken);
  });

  it('does not advance the database published version when the live snapshot cannot be written', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-bad-publish-'));
    await writeFile(path.join(root, 'not-a-directory'), 'occupied');
    cleanups.push(() => rm(root, {recursive: true, force: true}));
    const cms = await startCms({publishedContentPath: path.join(root, 'not-a-directory', 'published-content.json')});
    const auth = await login(cms);

    await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 0, heroTitle: '不能上线', heroBody: '写入会失败', heroMediaId: null})
    });
    const failed = await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: 1})
    });
    await awaitRelease(cms, auth, failed, 'failed');

    const home = await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)});
    expect(await json(home)).toMatchObject({version: 1, status: 'draft', published: null});
    const releases = await fetch(`${cms.baseUrl}/api/cms/releases`, {headers: adminHeaders(auth)});
    expect(await json(releases)).toMatchObject({items: [{kind: 'home', status: 'failed'}]});
  });

  it('serializes a publish with a concurrent patch so the live snapshot and database stay consistent', async () => {
    let completeBuild!: () => void;
    let buildStarted!: () => void;
    const building = new Promise<void>((resolve) => { buildStarted = resolve; });
    const blocked = new Promise<void>((resolve) => { completeBuild = resolve; });
    const cms = await startCms({deployRelease: async () => { buildStarted(); await blocked; }});
    const auth = await login(cms);
    const initialDraft = {version: 0, heroTitle: '准备发布的版本', heroBody: '应成为线上版本', heroMediaId: null};
    await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(initialDraft)
    });

    const publishResponse = await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: 1})
    });
    expect(publishResponse.status).toBe(202);
    await building;
    expect((await fetch(`${cms.baseUrl}/api/health`)).status).toBe(200);

    const patchWhileBuilding = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 1, heroTitle: '并发保存的新草稿', heroBody: '不能污染刚发布的线上版本', heroMediaId: null})
    });
    expect(patchWhileBuilding.status).toBe(409);
    expect(await json(patchWhileBuilding)).toMatchObject({error: {code: 'PUBLISH_IN_PROGRESS'}});
    completeBuild();
    await awaitRelease(cms, auth, publishResponse);
    const patchResponse = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 1, heroTitle: '并发保存的新草稿', heroBody: '不能污染刚发布的线上版本', heroMediaId: null})
    });
    expect(patchResponse.status).toBe(200);

    const finalHome = await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)});
    expect(await json(finalHome)).toMatchObject({
      version: 2,
      heroTitle: '并发保存的新草稿',
      status: 'draft',
      published: {heroTitle: initialDraft.heroTitle}
    });
    const live = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(live.home?.heroTitle).toBe(initialDraft.heroTitle);
  });

  it('serializes simultaneous homepage and article publishes into one complete live snapshot', async () => {
    let completeBuild!: () => void;
    let buildStarted!: () => void;
    const building = new Promise<void>((resolve) => { buildStarted = resolve; });
    const blocked = new Promise<void>((resolve) => { completeBuild = resolve; });
    const cms = await startCms({deployRelease: async () => { buildStarted(); await blocked; }});
    const auth = await login(cms);
    const homeSave = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 0, heroTitle: '并发发布首页', heroBody: '首页和文章都必须留下', heroMediaId: null})
    });
    const home = await json<HomeDto>(homeSave);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'parallel.png'}), body: transparentPng
    });
    const media = await json<MediaDto>(upload);
    const articleCreate = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({
        title: '并发发布文章', summary: '不能被首页发布覆盖', body: '文章正文', category: '公司动态', coverMediaId: media.id
      })
    });
    const article = await json<ArticleDto>(articleCreate);

    const homePublish = await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: home.version})
    });
    expect(homePublish.status).toBe(202);
    await building;
    const concurrentArticle = await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: article.version})
    });
    expect(concurrentArticle.status).toBe(409);
    completeBuild();
    await awaitRelease(cms, auth, homePublish);
    const articlePublish = await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: article.version})
    });
    await awaitRelease(cms, auth, articlePublish);
    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(snapshot.home?.heroTitle).toBe('并发发布首页');
    expect(snapshot.articles).toMatchObject([{id: article.id, title: '并发发布文章'}]);
  });
});

describe('article CRUD', () => {
  it('creates, reads, updates, rejects a missing cover, and removes article drafts with optimistic versions', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const articleDraft = {
      title: '水凝胶眼膜选型', summary: '从使用部位到包装方式。', body: '第一段\n\n第二段',
      category: '产品与膜型', coverMediaId: null
    };

    const createdResponse = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(articleDraft)
    });
    expect(createdResponse.status).toBe(201);
    const created = await json<ArticleDto>(createdResponse);
    expect(created).toMatchObject({...articleDraft, version: 1, status: 'draft'});

    const list = await fetch(`${cms.baseUrl}/api/cms/articles`, {headers: adminHeaders(auth)});
    expect(await json(list)).toMatchObject({items: [{id: created.id, title: articleDraft.title}]});
    const item = await fetch(`${cms.baseUrl}/api/cms/articles/${created.id}`, {headers: adminHeaders(auth)});
    expect(await json(item)).toMatchObject({id: created.id, body: articleDraft.body});

    const updateBody = {...articleDraft, version: 1, title: '水凝胶眼膜选型完整指南'};
    const updated = await fetch(`${cms.baseUrl}/api/cms/articles/${created.id}`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(updateBody)
    });
    expect(await json(updated)).toMatchObject({id: created.id, title: updateBody.title, version: 2});

    const stale = await fetch(`${cms.baseUrl}/api/cms/articles/${created.id}`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify(updateBody)
    });
    expect(stale.status).toBe(409);
    expect(await json(stale)).toMatchObject({error: {code: 'VERSION_CONFLICT', current: {version: 2}}});

    const published = await fetch(`${cms.baseUrl}/api/cms/articles/${created.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: 2})
    });
    const failedRelease = await awaitRelease(cms, auth, published, 'failed');
    expect(failedRelease.message).toContain('发布内容未通过完整性检查');
    const stillDraft = await fetch(`${cms.baseUrl}/api/cms/articles/${created.id}`, {headers: adminHeaders(auth)});
    expect(await json(stillDraft)).toMatchObject({status: 'draft', published: null});

    const another = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({...articleDraft, title: '可删除草稿'})
    });
    const removable = await json<ArticleDto>(another);
    const removed = await fetch(`${cms.baseUrl}/api/cms/articles/${removable.id}`, {
      method: 'DELETE', headers: adminHeaders(auth, {'If-Match': String(removable.version)})
    });
    expect(removed.status).toBe(204);
    const missing = await fetch(`${cms.baseUrl}/api/cms/articles/${removable.id}`, {headers: adminHeaders(auth)});
    expect(missing.status).toBe(404);
  });
});

describe('media upload and publication', () => {
  it('accepts public inquiries but restricts review and sending to authenticated CSRF-protected operators', async () => {
    const cms = await startCms();
    const input = {name: 'Test buyer', businessEmail: 'qa@example.test', company: 'Brand', market: 'EU', category: 'eye', sku: 'GT-EYE-001', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Eye care', packagingPreference: 'Jar', certificationConstraints: '', notes: '', privacyConsent: true};
    const request = () => fetch(`${cms.baseUrl}/api/inquiries`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: allowedOrigin, 'Idempotency-Key': 'http-inquiry-12345', 'X-Inquiry-Locale': 'es'}, body: JSON.stringify(input)});
    const response = await request();
    expect(response.status).toBe(202);
    const badKey = await fetch(`${cms.baseUrl}/api/inquiries`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: allowedOrigin, 'Idempotency-Key': 'bad'}, body: JSON.stringify(input)});
    expect(badKey.status).toBe(400);
    const created = await json<{id: string; accessToken: string}>(response);
    expect(await json(await request())).toMatchObject(created);
    expect((await fetch(`${cms.baseUrl}/api/cms/inquiries`)).status).toBe(401);
    const status = await fetch(`${cms.baseUrl}/api/inquiries/${created.id}/status`, {headers: {Authorization: `Bearer ${created.accessToken}`}});
    expect(await json(status)).toMatchObject({status: 'completed', emailStatus: 'pending_review'});
    const auth = await login(cms);
    const list = await json<{items: Array<{id: string; version: number}>}>(await fetch(`${cms.baseUrl}/api/cms/inquiries`, {headers: adminHeaders(auth)}));
    expect(list.items[0]).toMatchObject({id: created.id, locale: 'es'});
    const forbidden = await fetch(`${cms.baseUrl}/api/cms/inquiries/${created.id}/approve`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: allowedOrigin, Cookie: auth.cookie}, body: JSON.stringify({version: list.items[0].version, confirmed: true})});
    expect(forbidden.status).toBe(403);
    const approve = await fetch(`${cms.baseUrl}/api/cms/inquiries/${created.id}/approve`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: list.items[0].version, confirmed: true})});
    expect(approve.status).toBe(200);
    const send = await fetch(`${cms.baseUrl}/api/cms/inquiries/${created.id}/send`, {method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: '{}'});
    expect(await json(send)).toMatchObject({email: {status: 'approved'}, delivery: {error: 'SMTP_NOT_CONFIGURED'}});
  });
  it('does not call a failed static deployment live and can retry the same draft', async () => {
    let shouldFail = false;
    const deployed: string[] = [];
    const cms = await startCms({deployRelease: async ({snapshotPath}) => {
      if (shouldFail) throw new Error('Build failed');
      deployed.push(await readFile(snapshotPath, 'utf8'));
    }});
    const auth = await login(cms);
    const save = (version: number, title: string) => fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version, heroTitle: title, heroBody: '简介', heroMediaId: null})
    });
    const publish = (version: number) => fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version})
    });
    await save(0, '线上第一版');
    await awaitRelease(cms, auth, await publish(1));
    const original = await readFile(cms.publishedContentPath, 'utf8');
    await save(1, '准备发布的第二版');
    shouldFail = true;
    await awaitRelease(cms, auth, await publish(2), 'failed');
    expect(await readFile(cms.publishedContentPath, 'utf8')).toBe(original);
    expect(deployed).toHaveLength(1);
    expect(await json(await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)}))).toMatchObject({status: 'draft', published: {heroTitle: '线上第一版'}});
    shouldFail = false;
    await awaitRelease(cms, auth, await publish(2));
    expect(deployed).toHaveLength(2);
    expect(JSON.parse(deployed[1]).home.heroTitle).toBe('准备发布的第二版');
  });
  it('uploads a private PDF attachment, rejects it as an image, and publishes it with a credential', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const pdf = await PDFDocument.create();
    pdf.addPage().drawText('Delivery acceptance certificate');
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/pdf', 'X-File-Name': 'certificate.pdf'}), body: Buffer.from(await pdf.save())
    });
    expect(upload.status).toBe(201);
    const media = await json<MediaDto>(upload);
    expect(media.mimeType).toBe('application/pdf');
    const privateFile = await fetch(`${cms.baseUrl}${media.url}`, {headers: adminHeaders(auth)});
    expect(privateFile.headers.get('content-disposition')).toContain('attachment');
    expect((await fetch(`${cms.baseUrl}${media.url}`)).status).toBe(401);
    const invalidImage = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 0, heroTitle: '标题', heroBody: '正文', heroMediaId: media.id})
    });
    expect(invalidImage.status).toBe(400);
    const list = await json<{items: Array<{id: string; version: number; fields: object}>}>(await fetch(`${cms.baseUrl}/api/cms/content/credentials`, {headers: adminHeaders(auth)}));
    const credential = list.items[0];
    const saved = await fetch(`${cms.baseUrl}/api/cms/content/credentials/${credential.id}`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({fields: {...credential.fields, pdfMediaId: media.id}, version: credential.version})
    });
    expect(saved.status).toBe(200);
    const draft = await json<{version: number}>(saved);
    const published = await fetch(`${cms.baseUrl}/api/cms/content/credentials/${credential.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: draft.version})
    });
    await awaitRelease(cms, auth, published);
    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8'));
    expect(snapshot.credentialOverrides[0].pdf).toBe(`/uploads/cms/${media.id}.pdf`);
    expect((await PDFDocument.load(await readFile(path.join(cms.publicUploadDir, `${media.id}.pdf`)))).getPageCount()).toBe(1);
  });

  it('rejects malformed PDFs and PDFs with active actions, even in compressed objects', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.catalog.set(PDFName.of('OpenAction'), pdf.context.obj({S: 'JavaScript', JS: 'app.alert(1)'}));
    for (const bytes of [Buffer.from('%PDF-1.7\ninvalid\n%%EOF'), Buffer.from(await pdf.save())]) {
      const response = await fetch(`${cms.baseUrl}/api/cms/media`, {
        method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/pdf', 'X-File-Name': 'unsafe.pdf'}), body: bytes
      });
      expect(response.status).toBe(415);
    }
  });
  it('rejects forged and oversized image bodies', async () => {
    const cms = await startCms({maxImageBytes: 64});
    const auth = await login(cms);

    const forged = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'fake.png'}), body: 'not an image'
    });
    expect(forged.status).toBe(415);

    const oversized = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'large.png'}), body: Buffer.alloc(65, 1)
    });
    expect(oversized.status).toBe(413);
  });

  it('enforces decoded dimensions before saving an image', async () => {
    const cms = await startCms({maxImagePixels: 0.5});
    const auth = await login(cms);
    const response = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'pixel.png'}), body: transparentPng
    });
    expect(response.status).toBe(422);
    expect(await json(response)).toMatchObject({error: {code: 'IMAGE_DIMENSIONS_EXCEEDED'}});
  });

  it('keeps uploaded bytes private until a referencing article is published', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST',
      headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': encodeURIComponent('封面.png')}),
      body: transparentPng
    });
    expect(upload.status).toBe(201);
    const media = await json<MediaDto>(upload);
    expect(media).toMatchObject({name: '封面.png', mimeType: 'image/png', width: 1, height: 1, url: expect.stringContaining(`/api/cms/media/${media.id}/file`)});
    expect((await readdir(path.join(cms.dataDir, 'draft-media'))).length).toBe(1);
    await expect(stat(cms.publicUploadDir)).rejects.toThrow();

    const file = await fetch(`${cms.baseUrl}/api/cms/media/${media.id}/file`, {headers: adminHeaders(auth)});
    expect(file.status).toBe(200);
    expect(file.headers.get('cache-control')).toContain('no-store');
    expect(Buffer.from(await file.arrayBuffer()).length).toBeGreaterThan(0);

    const article = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({title: '带封面的文章', summary: '摘要', body: '正文', category: '产品与膜型', coverMediaId: media.id})
    });
    const articleBody = await json<ArticleDto>(article);
    const publish = await fetch(`${cms.baseUrl}/api/cms/articles/${articleBody.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: articleBody.version})
    });
    await awaitRelease(cms, auth, publish);

    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(snapshot.articles[0].cover).toMatch(/^\/uploads\/cms\/[0-9a-f-]+\.png$/);
    await expect(stat(path.join(cms.publicUploadDir, path.basename(snapshot.articles[0].cover)))).resolves.toBeDefined();

    const auditDatabase = new DatabaseSync(path.join(cms.dataDir, 'content-admin.sqlite'));
    const audit = auditDatabase.prepare("SELECT action FROM audit_events WHERE action = 'media.upload'").all();
    auditDatabase.close();
    expect(audit).toHaveLength(1);
  });

  it('deletes unused files but keeps files that are referenced by content', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const upload = async (name: string) => {
      const response = await fetch(`${cms.baseUrl}/api/cms/media`, {
        method: 'POST',
        headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': name}),
        body: transparentPng
      });
      expect(response.status).toBe(201);
      return json<MediaDto>(response);
    };

    const unused = await upload('unused.png');
    const removed = await fetch(`${cms.baseUrl}/api/cms/media/${unused.id}`, {
      method: 'DELETE', headers: adminHeaders(auth)
    });
    expect(removed.status).toBe(204);
    const afterRemoval = await json<{items: MediaDto[]}>(await fetch(`${cms.baseUrl}/api/cms/media`, {headers: adminHeaders(auth)}));
    expect(afterRemoval.items.some((item) => item.id === unused.id)).toBe(false);

    const used = await upload('used.png');
    const article = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST',
      headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({title: '引用图片', summary: '摘要', body: '正文', category: '公司动态', coverMediaId: used.id})
    });
    expect(article.status).toBe(201);
    const blocked = await fetch(`${cms.baseUrl}/api/cms/media/${used.id}`, {
      method: 'DELETE', headers: adminHeaders(auth)
    });
    expect(blocked.status).toBe(409);
    expect(await json(blocked)).toMatchObject({error: {code: 'MEDIA_IN_USE'}});
    expect((await fetch(`${cms.baseUrl}${used.url}`, {headers: adminHeaders(auth)})).status).toBe(200);
  });

  it('publishes an uploaded homepage image as a same-origin public path', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'hero.png'}), body: transparentPng
    });
    const media = await json<MediaDto>(upload);
    const saved = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 0, heroTitle: '有真实图片的首页', heroBody: '图片发布前保持私有', heroMediaId: media.id})
    });
    const home = await json<HomeDto>(saved);
    const publish = await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: home.version})
    });
    await awaitRelease(cms, auth, publish);
    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(snapshot.home?.heroImage).toMatch(/^\/uploads\/cms\/[0-9a-f-]+\.png$/);
    await expect(stat(path.join(cms.publicUploadDir, path.basename(snapshot.home?.heroImage ?? '')))).resolves.toBeDefined();
  });

  it('does not expose draft media when article content fails publication validation', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'invalid-draft.png'}), body: transparentPng
    });
    const media = await json<MediaDto>(upload);
    const articleCreate = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({
        title: '不能发布的文章', summary: '正文包含 HTML', body: '<script>alert(1)</script>', category: '公司动态', coverMediaId: media.id
      })
    });
    const article = await json<ArticleDto>(articleCreate);
    const publish = await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: article.version})
    });
    await awaitRelease(cms, auth, publish, 'failed');
    await expect(stat(cms.publicUploadDir)).rejects.toThrow();
  });

  it('removes newly copied public media when the live snapshot write fails', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-media-publish-failure-'));
    await writeFile(path.join(root, 'occupied'), 'not a directory');
    cleanups.push(() => rm(root, {recursive: true, force: true}));
    const cms = await startCms({publishedContentPath: path.join(root, 'occupied', 'published-content.json')});
    const auth = await login(cms);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'rollback.png'}), body: transparentPng
    });
    const media = await json<MediaDto>(upload);
    const articleCreate = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({title: '写入失败文章', summary: '应回滚公开图片', body: '正文', category: '公司动态', coverMediaId: media.id})
    });
    const article = await json<ArticleDto>(articleCreate);
    const publish = await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: article.version})
    });
    await awaitRelease(cms, auth, publish, 'failed');
    expect(await readdir(cms.publicUploadDir).catch(() => [])).toEqual([]);
  });

  it('preserves an existing public media file when the live snapshot write fails', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-existing-media-failure-'));
    await writeFile(path.join(root, 'occupied'), 'not a directory');
    cleanups.push(() => rm(root, {recursive: true, force: true}));
    const cms = await startCms({publishedContentPath: path.join(root, 'occupied', 'published-content.json')});
    const auth = await login(cms);
    const upload = await fetch(`${cms.baseUrl}/api/cms/media`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'image/png', 'X-File-Name': 'existing.png'}), body: transparentPng
    });
    const media = await json<MediaDto>(upload);
    await mkdir(cms.publicUploadDir, {recursive: true});
    const existingFile = path.join(cms.publicUploadDir, `${media.id}.png`);
    const existingBytes = Buffer.from('already-public');
    await writeFile(existingFile, existingBytes);
    const articleCreate = await fetch(`${cms.baseUrl}/api/cms/articles`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({title: '复用公开图片', summary: '失败时不可误删', body: '正文', category: '公司动态', coverMediaId: media.id})
    });
    const article = await json<ArticleDto>(articleCreate);
    const publish = await fetch(`${cms.baseUrl}/api/cms/articles/${article.id}/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: article.version})
    });
    await awaitRelease(cms, auth, publish, 'failed');
    expect(await readFile(existingFile)).toEqual(existingBytes);
  });
});

describe('existing live snapshot migration', () => {
  it('imports a pre-existing published snapshot and preserves its articles on the next release', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'guangtuo-cms-seed-'));
    const dataDir = path.join(root, 'private');
    const publishedContentPath = path.join(root, 'content', 'published-content.json');
    const publicUploadDir = path.join(root, 'public', 'uploads', 'cms');
    await writeFile(path.join(root, 'placeholder'), '');
    await mkdir(path.dirname(publishedContentPath), {recursive: true});
    const seed = {
      schemaVersion: 1,
      releaseId: 'seed-release',
      publishedAt: '2026-08-01T00:00:00.000Z',
      home: {heroTitle: '已上线首页', heroBody: '已上线简介', heroImage: '/assets/seed-hero.png'},
      articles: [{
        id: '11111111-1111-4111-8111-111111111111', slug: 'seed-article', title: '种子文章', summary: '摘要',
        body: '正文', category: '公司动态', cover: '/assets/seed-cover.png', publishedAt: '2026-08-01T00:00:00.000Z'
      }]
    };
    await writeFile(publishedContentPath, `${JSON.stringify(seed)}\n`);
    setupContentAdmin({dataDir, username: adminUsername, password: adminPassword, publishedContentPath});
    const server = createContentAdminServer({dataDir, publishedContentPath, publicUploadDir, allowedOrigin, secureCookies: false, prepareTranslations: createTranslationPreparer(dataDir, async requests => requests.map(({target}) => `${target} translated`)), deployRelease: async ({snapshotPath}) => { await writeFile(path.join(root, 'deployed-snapshot.json'), await readFile(snapshotPath)); }});
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Seed CMS did not bind');
    const cms: RunningCms = {baseUrl: `http://127.0.0.1:${address.port}`, dataDir, publishedContentPath, publicUploadDir, server};
    cleanups.push(async () => {
      if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(root, {recursive: true, force: true});
    });
    const auth = await login(cms);

    const homeResponse = await fetch(`${cms.baseUrl}/api/cms/home`, {headers: adminHeaders(auth)});
    expect(await json(homeResponse)).toMatchObject({
      heroTitle: seed.home.heroTitle,
      heroImage: seed.home.heroImage,
      heroMediaId: null,
      status: 'published'
    });
    const articlesResponse = await fetch(`${cms.baseUrl}/api/cms/articles`, {headers: adminHeaders(auth)});
    expect(await json(articlesResponse)).toMatchObject({items: [{
      id: seed.articles[0].id,
      title: seed.articles[0].title,
      cover: seed.articles[0].cover,
      coverMediaId: null,
      status: 'published'
    }]});
    for (const collection of ['pages', 'products', 'formats', 'credentials']) {
      const response = await fetch(`${cms.baseUrl}/api/cms/content/${collection}`, {headers: adminHeaders(auth)});
      const records = await json<{items: Array<{status: string; published: object | null}>}>(response);
      expect(records.items.length).toBeGreaterThan(0);
      expect(records.items.every((item) => item.status === 'published' && item.published !== null)).toBe(true);
    }

    const saved = await fetch(`${cms.baseUrl}/api/cms/home`, {
      method: 'PATCH', headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: 1, heroTitle: '新首页', heroBody: seed.home.heroBody, heroMediaId: null})
    });
    const draft = await json<HomeDto>(saved);
    await awaitRelease(cms, auth, await fetch(`${cms.baseUrl}/api/cms/home/publish`, {
      method: 'POST', headers: adminHeaders(auth, {'Content-Type': 'application/json'}), body: JSON.stringify({version: draft.version})
    }));
    const nextSnapshot = JSON.parse(await readFile(publishedContentPath, 'utf8')) as PublishedContentSnapshot;
    expect(nextSnapshot.home).toMatchObject({heroTitle: '新首页', heroImage: seed.home.heroImage});
    expect(nextSnapshot.articles).toMatchObject([{id: seed.articles[0].id, title: seed.articles[0].title}]);
  });
});

describe('CMS dependency isolation', () => {
  it('imports the pure published schema without importing the watched live JSON module', async () => {
    const databaseSource = await readFile(path.resolve('services/content-admin/database.ts'), 'utf8');
    const publisherSource = await readFile(path.resolve('services/content-admin/publisher.ts'), 'utf8');
    for (const source of [databaseSource, publisherSource]) {
      expect(source).toContain("../../src/lib/published-content-schema");
      expect(source).not.toContain("../../src/lib/published-content'");
    }
  });
});

describe('maintainable website modules', () => {
  it('lists every seeded module and publishes a product edit to the public snapshot', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const expectedMinimums = new Map([
      ['pages', 6],
      ['products', 21],
      ['formats', 41],
      ['credentials', 4]
    ]);

    for (const [module, minimum] of expectedMinimums) {
      const response = await fetch(`${cms.baseUrl}/api/cms/content/${module}`, {headers: adminHeaders(auth)});
      expect(response.status, module).toBe(200);
      const body = await json<{items: Array<{id: string}>}>(response);
      expect(body.items.length, module).toBeGreaterThanOrEqual(minimum);
    }

    const listResponse = await fetch(`${cms.baseUrl}/api/cms/content/products`, {headers: adminHeaders(auth)});
    const product = (await json<{items: Array<{
      id: string;
      version: number;
      fields: Record<string, unknown> & {name: string};
    }>}>(listResponse)).items.find((item) => item.id === 'GT-FM-001');
    expect(product).toBeDefined();

    const updatedName = '胶原弹润水凝胶面膜';
    const savedResponse = await fetch(`${cms.baseUrl}/api/cms/content/products/${product!.id}`, {
      method: 'PATCH',
      headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: product!.version, fields: {...product!.fields, name: updatedName}})
    });
    expect(savedResponse.status).toBe(200);
    const saved = await json<{id: string; version: number; fields: {name: string}}>(savedResponse);
    expect(saved).toMatchObject({id: product!.id, version: product!.version + 1, fields: {name: updatedName}});

    const publishResponse = await fetch(`${cms.baseUrl}/api/cms/content/products/${saved.id}/publish`, {
      method: 'POST',
      headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
      body: JSON.stringify({version: saved.version})
    });
    await awaitRelease(cms, auth, publishResponse);

    const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as PublishedContentSnapshot & {
      productOverrides: Array<{productId: string; name: string}>;
    };
    expect(snapshot.productOverrides).toContainEqual(expect.objectContaining({productId: saved.id, name: updatedName}));
  });

  it('saves and publishes page, format and credential edits with version protection', async () => {
    const cms = await startCms();
    const auth = await login(cms);
    const cases = [
      {
        module: 'pages',
        field: 'heroTitle',
        value: '从需求到样品，把新品做得更具体',
        snapshotKey: 'pageOverrides',
        idKey: 'pageId'
      },
      {
        module: 'formats',
        field: 'name',
        value: '胶原水凝胶全脸膜型',
        snapshotKey: 'formatOverrides',
        idKey: 'formatId'
      },
      {
        module: 'credentials',
        field: 'title',
        value: '水凝胶眼膜外观设计专利',
        snapshotKey: 'credentialOverrides',
        idKey: 'credentialId'
      }
    ] as const;

    for (const testCase of cases) {
      const listResponse = await fetch(`${cms.baseUrl}/api/cms/content/${testCase.module}`, {
        headers: adminHeaders(auth)
      });
      const item = (await json<{items: Array<{
        id: string;
        version: number;
        fields: Record<string, unknown>;
      }>}>(listResponse)).items[0];
      expect(item, testCase.module).toBeDefined();

      const body = {
        version: item.version,
        fields: {...item.fields, [testCase.field]: testCase.value}
      };
      const savedResponse = await fetch(
        `${cms.baseUrl}/api/cms/content/${testCase.module}/${encodeURIComponent(item.id)}`,
        {
          method: 'PATCH',
          headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
          body: JSON.stringify(body)
        }
      );
      expect(savedResponse.status, testCase.module).toBe(200);
      const saved = await json<{
        id: string;
        version: number;
        status: string;
        fields: Record<string, unknown>;
        published: Record<string, unknown> | null;
      }>(savedResponse);
      expect(saved).toMatchObject({
        id: item.id,
        version: item.version + 1,
        status: 'draft',
        fields: {[testCase.field]: testCase.value},
        published: null
      });

      const staleResponse = await fetch(
        `${cms.baseUrl}/api/cms/content/${testCase.module}/${encodeURIComponent(item.id)}`,
        {
          method: 'PATCH',
          headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
          body: JSON.stringify(body)
        }
      );
      expect(staleResponse.status, testCase.module).toBe(409);

      const publishResponse = await fetch(
        `${cms.baseUrl}/api/cms/content/${testCase.module}/${encodeURIComponent(item.id)}/publish`,
        {
          method: 'POST',
          headers: adminHeaders(auth, {'Content-Type': 'application/json'}),
          body: JSON.stringify({version: saved.version})
        }
      );
      await awaitRelease(cms, auth, publishResponse);
      const publishedListing = await json<{items: Array<{id: string; status: string; published: Record<string, unknown> | null}>}>(
        await fetch(`${cms.baseUrl}/api/cms/content/${testCase.module}`, {headers: adminHeaders(auth)})
      );
      expect(publishedListing.items.find((record) => record.id === item.id)).toMatchObject({
        id: item.id,
        status: 'published',
        published: {[testCase.field]: testCase.value}
      });

      const snapshot = JSON.parse(await readFile(cms.publishedContentPath, 'utf8')) as Record<string, unknown>;
      expect(snapshot[testCase.snapshotKey]).toEqual(expect.arrayContaining([
        expect.objectContaining({[testCase.idKey]: item.id, [testCase.field]: testCase.value})
      ]));
    }

    const releases = await fetch(`${cms.baseUrl}/api/cms/releases`, {headers: adminHeaders(auth)});
    expect(await json(releases)).toMatchObject({
      items: expect.arrayContaining(cases.map((testCase) => expect.objectContaining({kind: testCase.module, status: 'live'})))
    });
  });
});
