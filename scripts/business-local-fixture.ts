import {mkdir, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {setupContentAdmin} from '../services/content-admin/setup';
import {createContentAdminServer} from '../services/content-admin/server';
const dataDir = path.resolve('artifacts/business-qa-20260921/cms');
await mkdir(dataDir, {recursive: true});
if (!existsSync(path.join(dataDir, 'content-admin.sqlite'))) {
  const password = randomBytes(24).toString('base64url');
  setupContentAdmin({dataDir, username: 'business-qa@example.test', password, publishedContentPath: path.resolve('content/published-content.json')});
  await writeFile(path.join(dataDir, 'test-login.json'), JSON.stringify({username: 'business-qa@example.test', password}), {mode: 0o600});
}
createContentAdminServer({dataDir, allowedOrigin: 'http://localhost:3151', secureCookies: false, publishedContentPath: path.join(dataDir, 'published-content.json'), publicUploadDir: path.join(dataDir, 'uploads')}).listen(3122, '127.0.0.1', () => console.log('Isolated business fixture listening on 3122'));
