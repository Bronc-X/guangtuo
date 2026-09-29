// Isolated UI fixture: no external AI, SMTP, GPU or customer data. Never ship this file.
import {randomBytes} from 'node:crypto';
import {mkdir, mkdtemp, readFile, stat, writeFile} from 'node:fs/promises';
import {createServer, request as proxyRequest} from 'node:http';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createContentAdminServer} from '../../services/content-admin/server';
import {setupContentAdmin} from '../../services/content-admin/setup';
import {createKnowledgeService} from '../../services/knowledge/service';
import {createInquiryService} from '../../services/content-admin/inquiries';

if (!process.env.QA_STATIC_ROOT) throw new Error('QA_STATIC_ROOT must point to a fresh isolated static build');
const staticRoot = path.resolve(process.env.QA_STATIC_ROOT);
await stat(path.join(staticRoot, 'admin', 'index.html'));
await mkdir('tmp', {recursive: true});
const root = await mkdtemp(path.resolve('tmp', 'knowledge-mail-qa-'));
const username = 'knowledge@qa.example.test'; const password = randomBytes(24).toString('base64url');
const publishedContentPath = path.join(root, 'published-content.json');
setupContentAdmin({dataDir: root, username, password, publishedContentPath});
await writeFile(path.join(root, 'qa-credentials.json'), JSON.stringify({username, password}), {mode: 0o600});
const db = new DatabaseSync(path.join(root, 'content-admin.sqlite'));
const knowledge = createKnowledgeService({database: db, dataDir: root});
const doc = await knowledge.ingest({title: '仅测试：50 ml 包装规格', fileName: 'qa-only.txt', locale: 'en', skus: ['GT-JAR-050'], bytes: Buffer.from('GT-JAR-050 has a 50 ml capacity. This is a local QA fixture, not customer evidence.')}, 'qa');
knowledge.update(doc.id, doc.version, {status: 'active', visibility: 'customer', reviewed: true}, 'qa');
await createInquiryService({database: db, dataDir: root}).create({name: 'Local QA', businessEmail: 'buyer@example.test', company: '隔离测试 · 非真实客户', market: 'France', category: 'eye', sku: 'GT-JAR-050', configuration: 'White', quantity: '1000', budget: 'Confirm', launchDate: '2027', productGoal: '50 ml jar', packagingPreference: 'Jar', certificationConstraints: '', notes: 'No external services', privacyConsent: true}, 'isolated-rag-ui-12345', 'en');
db.close();
const origin = 'http://127.0.0.1:3130';
const cms = createContentAdminServer({dataDir: root, publishedContentPath, publicUploadDir: path.join(root, 'media'), allowedOrigin: origin, secureCookies: false, generationProvider: {id: 'local-qa-mock-not-a-real-model', generate: async request => {
  const source = JSON.parse(request.input).evidence[0];
  return {title: '[LOCAL QA] Packaging inquiry', body: 'Thank you for your inquiry. The referenced GT-JAR-050 capacity is 50 ml. Please confirm your packaging requirements. This is a local QA draft; no external model was called.', citations: [{chunkId: source.chunkId, quote: source.text}]};
}}});
await new Promise<void>((resolve, reject) => { cms.once('error', reject); cms.listen(0, '127.0.0.1', resolve); });
const port = (cms.address() as {port: number}).port;
const types: Record<string, string> = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary'};
const web = createServer(async (request, response) => {
  if (request.url?.startsWith('/api/')) {
    const proxy = proxyRequest({hostname: '127.0.0.1', port, method: request.method, path: request.url, headers: request.headers}, reply => { response.writeHead(reply.statusCode ?? 502, reply.headers); reply.pipe(response); });
    proxy.on('error', () => { response.writeHead(502); response.end(); }); request.pipe(proxy); return;
  }
  try {
    let file = path.resolve(staticRoot, `.${decodeURIComponent(new URL(request.url ?? '/', origin).pathname)}`);
    if (!file.startsWith(staticRoot + path.sep) && file !== staticRoot) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'}); response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
web.once('error', error => { cms.close(); throw error; });
web.listen(3130, '127.0.0.1', () => console.log(JSON.stringify({origin, root, mock: true, smtpConfigured: false})));
