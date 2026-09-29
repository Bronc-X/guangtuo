import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp, mkdir, readFile, readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {createStaticDeployer} from '../services/content-admin/static-deployer';

const run = promisify(execFile);
const releaseId = `showkibiotech-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
const destination = path.resolve('deliverables', releaseId);
const dataDir = path.resolve('tmp', releaseId);
const siteRoot = path.join(dataDir, 'site');
const runtime = path.join(dataDir, 'runtime');
await mkdir(destination, {recursive: true});
await mkdir(dataDir, {recursive: true});
process.env.NEXT_PUBLIC_API_BASE_URL = '/api';
process.env.NEXT_PUBLIC_CMS_API_URL = '';
process.env.NEXT_PUBLIC_STUDIO_API_URL = '';
process.env.NEXT_PUBLIC_SITE_URL = 'https://showkibiotech.com';
const snapshotSource = process.env.CMS_PACKAGE_SNAPSHOT_PATH ?? 'content/published-content.json';
const snapshot = JSON.parse(await readFile(snapshotSource, 'utf8'));
const keepContentRelease = process.env.CMS_PACKAGE_KEEP_CONTENT_RELEASE === '1';
if (!keepContentRelease) snapshot.releaseId = releaseId;
const snapshotPath = path.join(dataDir, 'release-content.json');
await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
console.log(`Building ${releaseId} from customer content, excluding QA data`);
await createStaticDeployer({projectDir: process.cwd(), dataDir, siteRoot})({releaseId, snapshotPath, mediaDir: path.resolve('public/uploads/cms')});
const staticRoot = path.join(siteRoot, 'releases', releaseId);
if (keepContentRelease) await writeFile(path.join(staticRoot, 'release.json'), JSON.stringify({releaseId: snapshot.releaseId, builtAt: new Date().toISOString()}));
const inputs = ['src', 'public', 'content', 'messages', 'services/content-admin', 'services/marketing', 'services/business', 'services/translation', 'scripts/setup-translation.mjs', 'docs/cms-multilingual-maintenance.md', 'docs/packaging-brochure-variants.json', 'services/knowledge', 'services/integrations', 'services/studio', 'services/hunyuan3d/studio_api.py', 'services/hunyuan3d/README.md', 'services/hunyuan3d/run-studio-api.ps1', 'scripts/cms-setup.ts', 'docs/knowledge-mail-studio-api.md', 'deploy/aliyun', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'postcss.config.mjs'];
await mkdir(runtime, {recursive: true});
for (const name of inputs) {
  try { await stat(name); } catch { continue; }
  await mkdir(path.dirname(path.join(runtime, name)), {recursive: true});
  await cp(name, path.join(runtime, name), {recursive: true});
}
await cp(snapshotPath, path.join(runtime, 'content', 'published-content.json'));
await mkdir(path.join(destination, 'font-licenses'), {recursive: true});
for (const family of ['manrope', 'noto-sans-sc', 'cormorant-garamond']) {
  await cp(path.join('node_modules', '@fontsource-variable', family, 'LICENSE'), path.join(destination, 'font-licenses', `${family}.txt`));
}
const staticArchive = path.join(destination, `${releaseId}-static.tar.gz`);
const runtimeArchive = path.join(destination, `${releaseId}-runtime.tar.gz`);
await run('tar', ['-czf', staticArchive, '-C', staticRoot, '.'], {windowsHide: true});
await run('tar', ['-czf', runtimeArchive, '-C', runtime, '.'], {windowsHide: true});
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {withFileTypes: true});
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const pages = (await files(staticRoot)).filter((name) => name.endsWith('.html'));
const manifest = {releaseId, contentReleaseId: snapshot.releaseId, generatedAt: new Date().toISOString(), pageCount: pages.length, locales: ['en', 'zh', 'fr', 'es', 'ru', 'ar'], publicApiBase: '/api', cmsSameOrigin: true, generationEnabled: false, productionDeployed: false,
  archives: await Promise.all([staticArchive, runtimeArchive].map(async (file) => ({file: path.basename(file), bytes: (await stat(file)).size, sha256: createHash('sha256').update(await readFile(file)).digest('hex')}))) };
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
await cp('deploy/aliyun/README.md', path.join(destination, 'DEPLOY.md'));
await writeFile(path.join(dataDir, 'build-location.json'), JSON.stringify({staticRoot, runtime, destination, releaseId}, null, 2));
console.log(JSON.stringify({destination, ...manifest}, null, 2));
