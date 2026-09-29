import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import type {ParsedDocument} from './parser';

export async function parseIsolated(fileName: string, bytes: Buffer): Promise<ParsedDocument> {
  if (bytes.length > 8 * 1024 * 1024) throw new Error('DOCUMENT_TOO_LARGE');
  const env: NodeJS.ProcessEnv = {NODE_ENV: 'production'};
  for (const name of ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'LANG']) if (process.env[name]) env[name] = process.env[name];
  return new Promise((resolve, reject) => {
    const child = fork(fileURLToPath(new URL('./parser-worker.ts', import.meta.url)), [], {env, execArgv: ['--max-old-space-size=256', '--import', 'tsx'], stdio: ['ignore', 'ignore', 'ignore', 'ipc']});
    let finished = false;
    const fail = (code: string) => { if (!finished) { finished = true; clearTimeout(timer); child.kill(); reject(new Error(code)); } };
    const timer = setTimeout(() => fail('DOCUMENT_PARSE_TIMEOUT'), 20_000);
    child.once('error', () => fail('DOCUMENT_PARSE_FAILED'));
    child.once('exit', () => fail('DOCUMENT_PARSE_FAILED'));
    child.once('message', (result: {parsed?: ParsedDocument; error?: string}) => {
      if (finished) return;
      if (result.error || !result.parsed) { fail(result.error ?? 'DOCUMENT_PARSE_FAILED'); return; }
      finished = true; clearTimeout(timer); child.kill(); resolve(result.parsed);
    });
    child.send({fileName, base64: bytes.toString('base64')}, error => { if (error) fail('DOCUMENT_PARSE_FAILED'); });
  });
}
