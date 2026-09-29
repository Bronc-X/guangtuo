import {spawn} from 'node:child_process';
import {createWriteStream, existsSync} from 'node:fs';
import {chmod, cp, lstat, mkdir, readFile, readdir, rename, rmdir, stat, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {DeployRelease} from './publisher';

type Options = {projectDir: string; dataDir: string; siteRoot: string; buildCommand?: string[]; timeoutMs?: number};

export function createStaticDeployer(options: Options): DeployRelease {
  return async ({releaseId, snapshotPath, mediaDir}) => {
    if (!/^[a-zA-Z0-9._-]+$/.test(releaseId) || releaseId.includes('..')) throw new Error('Invalid release ID');
    const project = path.resolve(options.projectDir);
    const buildDir = path.resolve(options.dataDir, 'builds', releaseId);
    const siteRoot = path.resolve(options.siteRoot);
    const releaseDir = path.join(siteRoot, 'releases', releaseId);
    await mkdir(buildDir, {recursive: true, mode: 0o700});
    // Copy only the build inputs, never private runtime files, credentials or QA workspaces.
    for (const name of ['src', 'public', 'content', 'messages', 'docs/packaging-brochure-variants.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'postcss.config.mjs', 'package.json', 'pnpm-lock.yaml']) {
      const source = path.join(project, name);
      if (existsSync(source)) {
        const destination = path.join(buildDir, name);
        await mkdir(path.dirname(destination), {recursive: true});
        await cp(source, destination, {recursive: true});
      }
    }
    await symlink(path.join(project, 'node_modules'), path.join(buildDir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    await mkdir(path.join(buildDir, 'content'), {recursive: true});
    await cp(snapshotPath, path.join(buildDir, 'content', 'published-content.json'));
    if (existsSync(mediaDir)) await cp(mediaDir, path.join(buildDir, 'public', 'uploads', 'cms'), {recursive: true});
    const command = options.buildCommand ?? [process.execPath, path.join(project, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build', '--webpack'];
    const defaultTimeout = process.env.CMS_BUILD_SCOPE === '1' ? 20 * 60_000 : 15 * 60_000;
    await runBuild(command, buildDir, path.join(buildDir, 'build.log'), options.timeoutMs ?? defaultTimeout, releaseId);
    const output = path.join(buildDir, 'out');
    await normalizeExportSegments(output);
    for (const name of ['index.html', 'robots.txt', 'sitemap.xml']) {
      if (!(await stat(path.join(output, name))).isFile()) throw new Error(`Missing build output: ${name}`);
    }
    const receipt = {releaseId, builtAt: new Date().toISOString()};
    await writeFile(path.join(output, 'release.json'), JSON.stringify(receipt));
    await mkdir(path.dirname(releaseDir), {recursive: true, mode: 0o755});
    // dataDir and siteRoot can be on different filesystems; copy first, then atomically switch the link.
    await cp(output, releaseDir, {recursive: true, errorOnExist: true, force: false});
    await makePublic(releaseDir);
    const temporaryLink = path.join(siteRoot, `current-${releaseId}`);
    await symlink(releaseDir, temporaryLink, process.platform === 'win32' ? 'junction' : 'dir');
    const current = path.join(siteRoot, 'current');
    if (process.platform === 'win32' && existsSync(current)) {
      // Windows cannot replace a directory junction atomically. This branch is local preview only;
      // Alibaba Linux uses the atomic POSIX switch below. Preserve and restore the old junction on error.
      if (!(await lstat(current)).isSymbolicLink()) throw new Error('Refusing to replace a non-link live directory');
      const backupLink = path.join(siteRoot, `previous-${releaseId}`);
      await rename(current, backupLink);
      try { await rename(temporaryLink, current); }
      catch (error) { await rename(backupLink, current); throw error; }
      await rmdir(backupLink);
    } else {
      // POSIX rename is atomic: Nginx serves the old release until this succeeds. No reload is needed.
      await rename(temporaryLink, current);
    }
  };
}

async function makePublic(directory: string): Promise<void> {
  await chmod(directory, 0o755);
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Build output must not contain symlinks');
    if (entry.isDirectory()) await makePublic(target);
    else await chmod(target, 0o644);
  }
}

async function normalizeExportSegments(output: string, directory = output): Promise<void> {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) { await normalizeExportSegments(output, source); continue; }
    const parts = path.relative(output, source).split(path.sep);
    const segmentIndex = parts.findIndex((part) => part.startsWith('__next.'));
    if (segmentIndex < 0 || segmentIndex === parts.length - 1 || !entry.name.endsWith('.txt')) continue;
    // Next 16.3's exporter normalizes '/' but not Windows '\\'. The router requests dot-separated names.
    const destination = path.join(output, ...parts.slice(0, segmentIndex), parts.slice(segmentIndex).join('.'));
    if (existsSync(destination)) {
      if (!(await readFile(destination)).equals(await readFile(source))) throw new Error('Conflicting static segment output');
    } else { await cp(source, destination, {errorOnExist: true, force: false}); }
  }
}

async function runBuild(command: string[], cwd: string, logPath: string, timeoutMs: number, releaseId: string): Promise<void> {
  if (!command.length) throw new Error('Missing build command');
  // Pass only build-time public configuration. SMTP/AI/admin secrets are never inherited by build scripts.
  const env: NodeJS.ProcessEnv = {NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1'};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(PATH|SystemRoot|TEMP|TMP|USERPROFILE|HOME|LANG|NODE_OPTIONS)$/i.test(key) || key.startsWith('NEXT_PUBLIC_')) env[key] = value;
  }
  if (process.env.CMS_BUILD_NODE_OPTIONS) env.NODE_OPTIONS = process.env.CMS_BUILD_NODE_OPTIONS;
  const lowPriority = process.platform === 'linux' && process.env.CMS_BUILD_LOW_PRIORITY === '1';
  let executable = lowPriority && existsSync('/usr/bin/ionice') ? '/usr/bin/ionice' : command[0];
  let args = executable === '/usr/bin/ionice' ? ['-c', '3', '/usr/bin/nice', '-n', '10', ...command] : command.slice(1);
  const separateScope = process.platform === 'linux' && process.env.CMS_BUILD_SCOPE === '1';
  const scopeName = `showkibiotech-build-${releaseId}.scope`;
  if (separateScope) {
    const uid = process.getuid?.();
    if (uid === undefined || !existsSync('/usr/bin/systemd-run')) throw new Error('CMS build scope is unavailable');
    env.XDG_RUNTIME_DIR = `/run/user/${uid}`;
    env.DBUS_SESSION_BUS_ADDRESS = `unix:path=${env.XDG_RUNTIME_DIR}/bus`;
    const scopeProperties = ['MemoryHigh=1200M', 'MemoryMax=1500M', 'MemorySwapMax=2048M', 'CPUWeight=10', 'IOWeight=10'];
    if (process.env.CMS_BUILD_IO_READ_LIMIT) scopeProperties.push(`IOReadBandwidthMax=${process.env.CMS_BUILD_IO_READ_LIMIT}`);
    if (process.env.CMS_BUILD_IO_READ_IOPS) scopeProperties.push(`IOReadIOPSMax=${process.env.CMS_BUILD_IO_READ_IOPS}`);
    if (process.env.CMS_BUILD_IO_WRITE_LIMIT) scopeProperties.push(`IOWriteBandwidthMax=${process.env.CMS_BUILD_IO_WRITE_LIMIT}`);
    if (process.env.CMS_BUILD_IO_WRITE_IOPS) scopeProperties.push(`IOWriteIOPSMax=${process.env.CMS_BUILD_IO_WRITE_IOPS}`);
    args = ['--user', '--scope', '--collect', '--quiet', `--unit=${scopeName}`, ...scopeProperties.map((property) => `--property=${property}`), '--', executable, ...args];
    executable = '/usr/bin/systemd-run';
  }
  await new Promise<void>((resolve, reject) => {
    const log = createWriteStream(logPath, {mode: 0o600});
    const child = spawn(executable, args, {cwd, env, shell: false, windowsHide: true});
    const timer = setTimeout(() => {
      if (separateScope) {
        const stopper = spawn('/usr/bin/systemctl', ['--user', 'stop', scopeName], {env, stdio: 'ignore', windowsHide: true});
        stopper.unref();
      }
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.pipe(log, {end: false});
    child.stderr.pipe(log, {end: false});
    log.once('error', (error) => { child.kill(); reject(error); });
    child.once('error', (error) => { clearTimeout(timer); log.end(); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      log.end(() => code === 0 ? resolve() : reject(new Error(`Static build failed (${code ?? 'timeout'}); inspect private build.log`)));
    });
  });
}

export async function readLiveRelease(siteRoot: string): Promise<string | null> {
  try { return (JSON.parse(await readFile(path.join(siteRoot, 'current', 'release.json'), 'utf8')) as {releaseId: string}).releaseId; }
  catch { return null; }
}
