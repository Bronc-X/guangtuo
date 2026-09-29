import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {createServer, request as httpRequest} from 'node:http';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {createStaticDeployer} from '../../services/content-admin/static-deployer';
import {createContentAdminServer} from '../../services/content-admin/server';
import {setupContentAdmin} from '../../services/content-admin/setup';

const root = path.resolve(process.env.DELIVERY_QA_ROOT ?? 'tmp/delivery-completion-20260908');
const dataDir = path.join(root, 'private');
const siteRoot = path.join(root, 'site');
const snapshotPath = path.join(dataDir, 'published-content.json');
await mkdir(dataDir, {recursive: true});
try { await stat(snapshotPath); } catch { await writeFile(snapshotPath, await readFile('content/published-content.json')); }
const username = 'delivery@qa.example.test';
const password = randomBytes(24).toString('base64url');
const credentialsPath = path.join(dataDir, 'qa-credentials.json');
try { await stat(credentialsPath); } catch {
  setupContentAdmin({dataDir, username, password, publishedContentPath: snapshotPath});
  await writeFile(credentialsPath, JSON.stringify({username, password}), {mode: 0o600});
}
process.env.NEXT_PUBLIC_API_BASE_URL = '/api';
process.env.NEXT_PUBLIC_CMS_API_URL = '';
const deployRelease = createStaticDeployer({projectDir: process.cwd(), dataDir, siteRoot});
const releaseId = `delivery-${Date.now()}`;
if (process.env.DELIVERY_QA_REUSE_BUILD !== '1') {
  process.stdout.write(`Building isolated release ${releaseId}\n`);
  await deployRelease({releaseId, snapshotPath, mediaDir: path.resolve('public/uploads/cms')});
}
const cms = createContentAdminServer({dataDir, publishedContentPath: snapshotPath, publicUploadDir: path.join(dataDir, 'public-media'), allowedOrigin: 'http://127.0.0.1:3120', secureCookies: false, deployRelease,
  mailSender: process.env.DELIVERY_QA_SMTP_DISABLED === '1' ? undefined : async (message) => {
    await writeFile(path.join(dataDir, `${message.messageId.replace(/[^a-zA-Z0-9-]/g, '_')}.mail.json`), JSON.stringify(message, null, 2));
    return {messageId: `local-qa-${Date.now()}`};
  }
});
await new Promise<void>((resolve) => cms.listen(3121, '127.0.0.1', resolve));
const types: Record<string, string> = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary'};
const web = createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    if (req.url === '/api/inquiries' && req.headers.referer?.includes('qa=inquiry-offline')) {
      res.writeHead(503, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: {code: 'INQUIRY_SERVICE_UNAVAILABLE', message: 'Isolated QA service unavailable'}}));
      return;
    }
    const proxy = httpRequest({hostname: '127.0.0.1', port: 3121, path: req.url, method: req.method, headers: req.headers}, (reply) => { res.writeHead(reply.statusCode ?? 502, reply.headers); reply.pipe(res); });
    proxy.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(proxy); return;
  }
  try {
    if (req.url?.startsWith('/models/') && req.headers.referer?.includes('qa=missing-model')) { res.writeHead(404); res.end('Isolated QA missing model'); return; }
    const base = process.env.DELIVERY_QA_STATIC_ROOT ? path.resolve(process.env.DELIVERY_QA_STATIC_ROOT) : path.join(siteRoot, 'current');
    let file = path.resolve(base, `.${decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)}`);
    if (!file.startsWith(base + path.sep) && file !== base) throw new Error('Traversal');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
    let bytes = await readFile(file);
    if (path.extname(file) === '.html' && req.url?.includes('qa=no-webgl')) {
      bytes = Buffer.from(bytes.toString().replace('<head>', `<head><script>const originalContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:originalContext.call(this,type,...args)}</script>`));
    }
    res.end(bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
web.listen(3120, '127.0.0.1', () => process.stdout.write('Isolated delivery QA ready: http://127.0.0.1:3120\n'));
