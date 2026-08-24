import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

import {STUDIO_WORKFLOW_COPY} from '@/lib/sku-3d-studio';

const publicRoots = [
  'src/app',
  'src/components',
  'src/data/site-copy.ts',
  'src/data/company-page-copy.ts',
  'src/data/catalog.ts',
  'src/data/mail-agent.ts',
  'src/lib/ai-mail.ts'
];

const bannedPublicPhrases = [
  '已有 SKU 可以直接调规格',
  'GPT Image 2 →',
  '本机显卡',
  '用于带入包装类型和规格选项',
  '确定性配置链路',
  '参数化资产 + PBR',
  '审核 GLB',
  '当前输出',
  '处理方式',
  '尚未配置 OpenAI API Key',
  '网关（8091）',
  '完整的定制服务'
];

const discourteousPublicPhrases = [
  '这款包装，\n多少钱？',
  '先说清三件事',
  '告诉我们装什么',
  '准备做多少？',
  '好。准备装什么产品？',
  '首批大概需要多少？',
  '信息够了',
  '先留下联系方式',
  '喜欢哪款，就从哪款开始',
  '问问价格',
  '下一款，准备做什么？'
];

const productManagerPhrases = [
  'product record',
  'working file',
  'commercial starting point',
  'evidence before claims',
  'keep open items visible',
  '产品档案',
  '工作档案',
  '商务起点',
  '先核对，再表达',
  '待确认内容继续跟进',
  '产品研发档案'
];

function sourceFiles(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => sourceFiles(join(path, name)));
}

describe('customer-facing marketing copy', () => {
  it('keeps internal implementation language out of public UI copy', () => {
    const source = publicRoots
      .flatMap((path) => sourceFiles(join(process.cwd(), path)))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    for (const phrase of bannedPublicPhrases) expect(source).not.toContain(phrase);
  });

  it('keeps commands and interrogation-style language out of customer conversations', () => {
    const source = publicRoots
      .flatMap((path) => sourceFiles(join(process.cwd(), path)))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    for (const phrase of discourteousPublicPhrases) expect(source).not.toContain(phrase);
  });

  it('keeps the studio introduction customer-facing', () => {
    const copy = Object.values(STUDIO_WORKFLOW_COPY)
      .flatMap((locale) => Object.values(locale))
      .join(' ');

    expect(copy).toContain('选一款现有包装');
    expect(copy).not.toMatch(/SKU|GPT|GPU|显卡|参数化|PBR|GLB|Hunyuan|本机|服务|任务|队列|接口/i);
  });

  it('does not speak to customers like an internal product specification', () => {
    const source = publicRoots
      .flatMap((path) => sourceFiles(join(process.cwd(), path)))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, 'utf8').toLowerCase())
      .join('\n');

    for (const phrase of productManagerPhrases) expect(source).not.toContain(phrase.toLowerCase());
  });
});
