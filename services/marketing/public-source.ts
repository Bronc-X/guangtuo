import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import https from 'node:https';
import http from 'node:http';
import type {ContentAiSource} from '../../src/lib/content-ai-contracts';

export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0,168].includes(b)) || (a === 198 && [18,19].includes(b)));
  }
  // Only global IPv6 unicast; exclude mapped IPv4, local, link-local and multicast ranges.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:0:|db8:)/i.test(address) && !/^2002:/i.test(address);
}
export function publicUrl(input: string): URL {
  let url: URL;
  try {url = new URL(input);} catch {throw new Error('网址格式不正确');}
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.hash || (url.port && !['443', '80'].includes(url.port))) throw new Error('仅支持公开的 HTTP/HTTPS 网页');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('不支持内部地址');
  return url;
}
export async function fetchPublicBytes(input: string, maxBytes: number, timeoutMs = 20000): Promise<{bytes: Buffer; url: string; contentType: string}> {
  let url = publicUrl(input);
  const deadline = Date.now() + timeoutMs;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = await lookup(hostname, {all: true});
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('不支持内部或保留网络地址');
    const address = addresses[0];
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('抓取超时，请稍后重试');
    const result = await new Promise<{bytes: Buffer; contentType: string; redirect?: string}>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).get(url, {
        headers: {'User-Agent': 'ShowkiContentResearch/1.0', Accept: '*/*', 'Accept-Encoding': 'identity'},
        lookup: (_host, _options, callback) => callback(null, address.address, address.family), family: address.family
      }, response => {
        if ([301,302,303,307,308].includes(response.statusCode ?? 0) && response.headers.location) {response.resume(); resolve({bytes: Buffer.alloc(0), contentType: '', redirect: response.headers.location}); return;}
        if (response.statusCode !== 200) {response.resume(); reject(new Error(`来源返回 ${response.statusCode}，可粘贴文字或上传图片继续`)); return;}
        const chunks: Buffer[] = []; let length = 0;
        response.on('data', (chunk: Buffer) => {length += chunk.length; if (length > maxBytes) {request.destroy(new Error('来源文件过大')); return;} chunks.push(chunk);});
        response.on('error', () => reject(new Error('来源读取中断')));
        response.on('end', () => resolve({bytes: Buffer.concat(chunks), contentType: response.headers['content-type'] ?? ''}));
      });
      const timer = setTimeout(() => request.destroy(new Error('抓取超时，请稍后重试')), remaining);
      request.on('close', () => clearTimeout(timer));
      request.on('error', () => reject(new Error('无法读取公开来源，可粘贴文字或上传图片继续')));
    });
    if (!result.redirect) return {...result, url: url.href};
    url = publicUrl(new URL(result.redirect, url).href);
  }
  throw new Error('来源跳转次数过多，请使用原始文章网址');
}
function decode(value: string) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g, entity => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '})[entity]!).replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => {const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n); return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';});
}
export function parseSource(html: string, url: string): ContentAiSource {
  const clean = html.replace(/<(script|style|noscript|svg|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const main = clean.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1] ?? clean;
  const title = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g, '') ?? '').trim().slice(0,300);
  const text = decode(main.replace(/<(?:br|\/p|\/div|\/h[1-6]|\/li)\b[^>]*>/gi,'\n').replace(/<[^>]*>/g,' ')).replace(/[\t ]+/g,' ').replace(/ *\n */g,'\n').replace(/\n\s*\n+/g,'\n\n').trim().slice(0,20000);
  const images: string[] = [];
  for (const tag of html.matchAll(/<(?:img|meta)\b[^>]*>/gi)) {
    const attr: Record<string,string> = {};
    for (const match of tag[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) attr[match[1].toLowerCase()] = decode(match[2]);
    const source = /^<img/i.test(tag[0]) ? attr.src : ['og:image','twitter:image'].includes(attr.property ?? attr.name) ? attr.content : undefined;
    if (!source) continue;
    try {const image = publicUrl(new URL(source, url).href).href; if (!images.includes(image)) images.push(image);} catch { /* Non-HTTP image references cannot be imported. */ }
    if (images.length >= 12) break;
  }
  return {title, text, url, images};
}
export async function fetchSource(url: string) {
  const source = await fetchPublicBytes(url, 2_000_000);
  if (!/(text\/html|application\/xhtml\+xml)/i.test(source.contentType)) throw new Error('这个网址不是可读取的网页，请粘贴正文');
  const result = parseSource(source.bytes.toString('utf8'), source.url);
  if (result.text.length < 40) throw new Error('没有取得足够正文，可能需要登录或由脚本加载。请粘贴原文继续');
  return result;
}
