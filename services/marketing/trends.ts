import type {MarketingTrend} from '../../src/lib/marketing-contracts';

function decode(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}
export function parseTrendFeed(xml: string): MarketingTrend[] {
  const field = (item: string, tag: string) => decode(item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 30).flatMap(match => {
    const title = field(match[1], 'title'); const url = field(match[1], 'link'); const date = Date.parse(field(match[1], 'pubDate'));
    if (!title || !/^https:\/\//.test(url)) return [];
    return [{title, url, source: field(match[1], 'source') || 'Google News', publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : ''}];
  });
}
export async function fetchTrends(query: string, language: 'zh' | 'en', fetcher: typeof fetch = fetch) {
  const url = new URL('https://news.google.com/rss/search');
  url.search = new URLSearchParams({q: `${query} when:7d`, hl: language === 'zh' ? 'zh-CN' : 'en-US', gl: language === 'zh' ? 'CN' : 'US', ceid: language === 'zh' ? 'CN:zh-Hans' : 'US:en'}).toString();
  const response = await fetcher(url, {signal: AbortSignal.timeout(15000), redirect: 'error'});
  if (!response.ok) throw new Error('趋势来源暂时不可用，请稍后重试。');
  const reader = response.body?.getReader(); if (!reader) throw new Error('趋势来源返回空响应。');
  let text = ''; const decoder = new TextDecoder();
  for (;;) {const item = await reader.read(); if (item.done) break; text += decoder.decode(item.value, {stream: true}); if(text.length > 2_000_000) {await reader.cancel(); throw new Error('趋势数据过大，请缩小关键词范围。');}}
  return {items: parseTrendFeed(text), fetchedAt: new Date().toISOString(), source: 'Google News · 近七天新闻线索（非平台热榜）'};
}
