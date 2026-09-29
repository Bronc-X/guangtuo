import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {save, output} from './browser-driver.mjs';

const root = resolve('tmp/delivery-qa-20260908');
const credentials = JSON.parse(readFileSync(resolve(root, 'qa-cms/browser-login.json'), 'utf8'));
const base = 'http://127.0.0.1:3111';
const origin = 'http://localhost:3110';
const snapshot = resolve(root, 'content/published-content.json');
const digest = () => createHash('sha256').update(readFileSync(snapshot)).digest('hex');
const original = digest();
const login = await fetch(`${base}/api/cms/auth/login`, {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify(credentials)});
assert.equal(login.status, 200);
const {csrfToken} = await login.json();
const headers = {Origin: origin, Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': csrfToken};
const results = [];
async function upload(name, bytes, type, expected, override = headers) {
  const response = await fetch(`${base}/api/cms/media`, {method: 'POST', headers: {...override, 'X-File-Name': encodeURIComponent(name), 'Content-Type': type}, body: bytes});
  const body = await response.json();
  assert.equal(response.status, expected, `${name}: ${JSON.stringify(body)}`);
  results.push({name, status: response.status, code: body.error?.code, bytes: body.size, id: body.id});
  return body;
}
const seed = {create: {width: 64, height: 64, channels: 3, background: '#205e47'}};
for (const [ext, type] of [['png','image/png'],['jpeg','image/jpeg'],['webp','image/webp']]) {
  const bytes = await sharp(seed)[ext]().toBuffer();
  writeFileSync(resolve(output, `qa-image.${ext}`), bytes);
  await upload(`验收 图片.${ext}`, bytes, type, 201);
}
const png = readFileSync(resolve(output, 'qa-image.png'));
await upload('fake.png', Buffer.from('<script>alert(1)</script>'), 'image/png', 415);
await upload('certificate.pdf', Buffer.from('%PDF-1.4\nQA fixture, not a production certificate'), 'application/pdf', 415);
writeFileSync(resolve(output, 'qa-document.pdf'), '%PDF-1.4\nQA fixture, not a production certificate');
await upload('oversized.png', Buffer.concat([png, Buffer.alloc(8 * 1024 * 1024)]), 'image/png', 413);
await upload('unauthenticated.png', png, 'image/png', 401, {Origin: origin});
await upload('wrong-origin.png', png, 'image/png', 403, {...headers, Origin: 'http://invalid.example.test'});
await upload('no-csrf.png', png, 'image/png', 403, {Origin: origin, Cookie: headers.Cookie});
assert.equal(digest(), original, 'Uploads must not modify the published snapshot');
const listing = await fetch(`${base}/api/cms/media`, {headers});
const media = (await listing.json()).items;
const preview = await fetch(`${base}${media[0].url}`, {headers});
assert.equal(preview.status, 200);
const anonymousPreview = await fetch(`${base}${media[0].url}`);
assert.equal(anonymousPreview.status, 401);
const logout = await fetch(`${base}/api/cms/auth/logout`, {method: 'POST', headers});
assert.equal(logout.status, 204);
const session = await fetch(`${base}/api/cms/session`, {headers});
assert.equal((await session.json()).authenticated, false);
save('cms-api', {results, previewStatus: preview.status, anonymousPreviewStatus: anonymousPreview.status, uploadDoesNotPublish: digest() === original, sessionRevoked: true});
console.log(JSON.stringify({results, uploadDoesNotPublish: true, preview: 200, anonymousPreview: 401, sessionRevoked: true}));
