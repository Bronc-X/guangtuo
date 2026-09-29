import {z} from 'zod';
import {trustedBaseUrl} from '../integrations/http';
import {opportunityFields, type OpportunityFields} from '../../src/lib/business-contracts';

export type ImportedLead = OpportunityFields & {externalId: string};
const object = z.record(z.string(), z.unknown());
const record = (value: unknown) => object.parse(value);
const string = (value: unknown) => typeof value === 'string' ? value : '';
const idString = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : string(value);

// Persist only these contact fields; upstream inbox responses also contain operator tokens.
export function parseChatwoot(value: unknown): ImportedLead[] {
  const payload = z.array(object).parse(record(record(value).data).payload);
  return payload.flatMap(item => {
    const meta = record(item.meta), sender = record(meta.sender);
    const id = idString(item.id); if (!id) throw new Error('INVALID_RESPONSE');
    const messages = z.array(object).parse(item.messages ?? []);
    const incoming = messages.filter(message => message.private !== true && message.message_type === 0).map(message => string(message.content)).filter(Boolean);
    const channel = string(meta.channel).toLowerCase();
    const platform = channel.includes('facebook') ? 'Facebook' : channel.includes('instagram') ? 'Instagram' : channel.includes('web') ? '独立站' : '其他';
    return [{...opportunityFields.parse({name: string(sender.name) || '未命名客户', contact: [string(sender.email), string(sender.phone_number)].filter(Boolean).join(' / '), kind: 'inbound', platform, requirements: incoming.join('\n').slice(0, 12000), notes: `聚合收件箱渠道：${string(meta.channel)}；会话 ${id}`}), externalId: id}];
  });
}

export function parseTikHubComments(value: unknown, videoId: string): ImportedLead[] {
  const envelope = record(value);
  if (envelope.code !== 200) throw new Error('INVALID_RESPONSE');
  const data = record(envelope.data);
  if (data.status_code !== undefined && data.status_code !== 0) throw new Error('INVALID_RESPONSE');
  const comments = z.array(object).parse(data.comments);
  return comments.map(item => {
    const user = record(item.user), id = idString(item.cid), handle = string(user.unique_id) || string(user.uniqueId);
    if (!id) throw new Error('INVALID_RESPONSE');
    return {...opportunityFields.parse({name: string(user.nickname) || handle || '公开账号', platform: 'TikTok', kind: 'public', sourceUrl: handle ? `https://www.tiktok.com/@${encodeURIComponent(handle)}` : '', requirements: string(item.text).slice(0, 12000), notes: `公开评论，需求尚未确认；视频 ID：${videoId}`}), externalId: `${videoId}:${id}`};
  });
}

async function getJson(url: string, headers: Record<string, string>, fetcher: typeof fetch): Promise<unknown> {
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 20000);
  try {
    const response = await fetcher(url, {headers, signal: abort.signal, redirect: 'error'});
    if (!response.ok) {await response.body?.cancel(); throw new Error(`HTTP_${response.status}`);}
    const reader = response.body?.getReader(); if (!reader) throw new Error('EMPTY_RESPONSE');
    const chunks: Uint8Array[] = []; let length = 0;
    for (;;) {const next = await reader.read(); if (next.done) break; length += next.value.length; if (length > 2000000) {await reader.cancel(); throw new Error('RESPONSE_TOO_LARGE');} chunks.push(next.value);}
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally {clearTimeout(timer);}
}

export function createBusinessConnectors(env: Record<string, string | undefined> = process.env, fetcher = fetch) {
  const chatwootReady = Boolean(env.BUSINESS_CHATWOOT_URL && env.BUSINESS_CHATWOOT_TOKEN && /^\d+$/.test(env.BUSINESS_CHATWOOT_ACCOUNT_ID ?? ''));
  const tikhubReady = Boolean(env.BUSINESS_TIKHUB_TOKEN && env.BUSINESS_TIKHUB_ENABLED === 'true');
  const requestLimit = Math.min(50, Math.max(0, Number.parseInt(env.BUSINESS_TIKHUB_DAILY_LIMIT ?? '5') || 0));
  return {
    chatwootReady, tikhubReady, requestLimit,
    async chatwoot(page: number) {
      if (!chatwootReady) throw new Error('NOT_CONFIGURED');
      const base = trustedBaseUrl(env.BUSINESS_CHATWOOT_URL!, 'CHATWOOT');
      const leads = parseChatwoot(await getJson(`${base}/api/v1/accounts/${env.BUSINESS_CHATWOOT_ACCOUNT_ID}/conversations?status=all&assignee_type=all&page=${page}`, {api_access_token: env.BUSINESS_CHATWOOT_TOKEN!}, fetcher));
      return leads.map(item => ({...item, externalId: `${base}:${env.BUSINESS_CHATWOOT_ACCOUNT_ID}:${item.externalId}`}));
    },
    async tikhub(videoId: string) {
      if (!tikhubReady) throw new Error('NOT_CONFIGURED');
      return parseTikHubComments(await getJson(`https://api.tikhub.io/api/v1/tiktok/web/fetch_post_comment?aweme_id=${encodeURIComponent(videoId)}&cursor=0&count=20`, {Authorization: `Bearer ${env.BUSINESS_TIKHUB_TOKEN}`}, fetcher), videoId);
    }
  };
}

// RFC 4180-style CSV; a quoted cell can contain commas, doubled quotes and newlines.
export function parseLeadCsv(csv: string): ImportedLead[] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false, closed = false;
  const endCell = () => {row.push(cell); cell = ''; closed = false;};
  const source = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {if (c === '"') {if (source[i + 1] === '"') {cell += '"'; i++;} else {quoted = false; closed = true;}} else cell += c;}
    else if (c === ',') endCell();
    else if (c === '\n') {endCell(); rows.push(row); row = [];}
    else if (c === '"' && cell === '' && !closed) quoted = true;
    else {if (closed || c === '"') throw new Error('CSV 引号格式不正确'); cell += c;}
  }
  if (quoted) throw new Error('CSV 引号未闭合');
  if (cell || row.length || closed) {endCell(); rows.push(row);}
  const headers = rows.shift()?.map(value => value.trim());
  if (!headers?.includes('externalId') || !headers.includes('name') || new Set(headers).size !== headers.length) throw new Error('CSV 需要唯一的 externalId、name 列');
  if (rows.length > 200) throw new Error('每次最多导入 200 条');
  return rows.filter(row => row.some(Boolean)).map(row => {
    if (row.length !== headers.length) throw new Error('CSV 列数不一致');
    const item = Object.fromEntries(headers.map((header, i) => [header, row[i]]));
    return {...opportunityFields.parse(item), externalId: z.string().trim().min(1).max(500).parse(item.externalId)};
  });
}
