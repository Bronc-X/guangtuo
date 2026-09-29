import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, expect, it} from 'vitest';
import * as deployment from '../../services/content-admin/static-deployer';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true}); });

it('builds in isolation, serves a verified release, and leaves it untouched after build failure', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'gt-static-deploy-'));
  roots.push(root);
  const projectDir = path.join(root, 'project');
  await mkdir(path.join(projectDir, 'content'), {recursive: true});
  await mkdir(path.join(projectDir, 'node_modules'));
  await writeFile(path.join(projectDir, 'content', 'published-content.json'), '{"old":true}');
  const snapshotPath = path.join(root, 'candidate.json');
  await writeFile(snapshotPath, '{"releaseId":"r1"}');
  const script = path.join(root, 'build.cjs');
  await writeFile(script, `const fs=require('node:fs');fs.mkdirSync('out');fs.writeFileSync('out/index.html',fs.readFileSync('content/published-content.json'));for(const f of ['robots.txt','sitemap.xml'])fs.writeFileSync('out/'+f,'ok');fs.mkdirSync('out/en/__next.$d$locale',{recursive:true});fs.writeFileSync('out/en/__next.$d$locale/__PAGE__.txt','segment-data');`);
  expect(deployment).toHaveProperty('createStaticDeployer');
  const deploy = deployment.createStaticDeployer({projectDir, dataDir: path.join(root, 'data'), siteRoot: path.join(root, 'site'), buildCommand: [process.execPath, script]});
  await deploy({releaseId: 'r1', snapshotPath, mediaDir: path.join(root, 'media')});
  const current = path.join(root, 'site', 'current');
  expect(await readFile(path.join(current, 'index.html'), 'utf8')).toContain('r1');
  expect(await readFile(path.join(current, 'en', '__next.$d$locale.__PAGE__.txt'), 'utf8')).toBe('segment-data');
  expect(await readFile(path.join(projectDir, 'content', 'published-content.json'), 'utf8')).toBe('{"old":true}');
  await writeFile(script, 'process.exit(12)');
  await expect(deploy({releaseId: 'r2', snapshotPath, mediaDir: path.join(root, 'media')})).rejects.toThrow();
  expect(await readFile(path.join(current, 'index.html'), 'utf8')).toContain('r1');
  expect(JSON.parse(await readFile(path.join(current, 'release.json'), 'utf8')).releaseId).toBe('r1');
  await writeFile(script, `const fs=require('node:fs');fs.mkdirSync('out');for(const f of ['index.html','robots.txt','sitemap.xml'])fs.writeFileSync('out/'+f,'retry-success');`);
  await deploy({releaseId: 'r3', snapshotPath, mediaDir: path.join(root, 'media')});
  expect(await readFile(path.join(current, 'index.html'), 'utf8')).toBe('retry-success');
});
