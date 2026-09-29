import {randomBytes} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {createContentAdminServer} from '../../services/content-admin/server';
import {setupContentAdmin} from '../../services/content-admin/setup';

const root = path.resolve('tmp/delivery-qa-20260908');
const dataDir = path.join(root, 'qa-cms');
const publishedContentPath = path.join(root, 'content/published-content.json');
const username = 'delivery-qa@example.test';
const password = randomBytes(24).toString('base64url');
mkdirSync(dataDir, {recursive: true});
setupContentAdmin({dataDir, username, password, publishedContentPath});
writeFileSync(path.join(dataDir, 'browser-login.json'), JSON.stringify({username, password}), {mode: 0o600, flag: 'wx'});
const server = createContentAdminServer({
  dataDir, publishedContentPath,
  publicUploadDir: path.join(root, 'public/uploads/cms'),
  allowedOrigin: 'http://localhost:3110',
  secureCookies: false
});
server.listen(3111, '127.0.0.1', () => console.log('Isolated QA CMS ready on :3111. Credentials stay in ignored QA directory.'));
