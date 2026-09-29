import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

export const output = resolve(process.env.DELIVERY_QA_OUTPUT ?? 'output/delivery-qa-20260908');
mkdirSync(output, {recursive: true});
export function browse(...args) {
  if (!process.env.BROWSE_BIN) throw new Error('Set BROWSE_BIN to the installed browse executable.');
  return execFileSync(process.env.BROWSE_BIN, args, {encoding: 'utf8', timeout: 60000}).trim();
}
export function js(expression) {
  return JSON.parse(browse('js', `JSON.stringify(${expression})`));
}
export function save(name, value) {
  writeFileSync(resolve(output, `${name}.json`), JSON.stringify(value, null, 2) + '\n');
}
export function shot(name) {
  return browse('screenshot', '--viewport', resolve(output, `${name}.png`));
}
export async function until(expression, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (js(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Browser condition did not settle: ${expression}`);
}
