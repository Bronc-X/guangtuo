import {mkdtemp, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, expect, it, vi} from 'vitest';
import {createTranslationPreparer} from '../../services/content-admin/translation';
import {contentStrings, targetLocales} from '../../src/lib/content-localization';
import {publishedContentSchema} from '../../src/lib/published-content-schema';
import {getPublishedHome, getPublishedPageOverride, getPublishedProductOverride, getPublishedFormatOverride, getPublishedCredentialOverride, listPublishedArticles, getPublishedArticleStaticParams} from '../../src/lib/published-content';

const roots: string[] = [];
afterEach(async () => {for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true});});
async function directory() {const root = await mkdtemp(path.join(tmpdir(), 'cms-translations-')); roots.push(root); return root;}
function snapshot() {
  return publishedContentSchema.parse({schemaVersion: 1, releaseId: 'translation-test', publishedAt: '2026-09-20T00:00:00.000Z',
    home: {heroTitle: '中文首页', heroBody: '中文介绍', heroImage: '/assets/home.png'},
    articles: [{id: 'article', slug: 'article', title: '中文文章', summary: '中文摘要', body: '中文正文', category: '中文分类', cover: '/assets/article.png', publishedAt: '2026-09-20T00:00:00.000Z'}],
    pageOverrides: [{pageId: 'about', heroTitle: '中文页面', heroBody: '中文介绍', profileTitle: '中文公司标题', profileBody: '中文公司正文', contactEmail: 'owner@example.com', videoId: 'Em685F3Ec2A', wechatQr: '/assets/qr.png'}],
    productOverrides: [{productId: 'product', name: '中文产品', description: '中文介绍', highlights: ['中文亮点'], applications: ['中文用途'], netWeight: '150 ml', packFormat: '中文包装', moqQuantity: 1000, moqUnit: 'bottles', image: '/assets/product.png'}],
    formatOverrides: [{formatId: 'format', name: '中文膜型', effects: '中文功效', specification: '中文规格', moq: '1000 件', packaging: '中文包装', image: '/assets/format.png'}],
    credentialOverrides: [{credentialId: 'credential', title: '中文证书', kind: '中文类型', number: 'CN123456', rightsholder: '中文权利人', image: '/assets/certificate.png', pdf: '/assets/certificate.pdf'}]
  });
}

it('translates every maintained text field in all five languages while retaining shared assets and identifiers', async () => {
  const source = snapshot();
  const translator = vi.fn(async (requests: {text: string; target: string}[]) => requests.map(({text, target}) => `${target} text ${text.length} ${(text.match(/\d+/g) ?? []).join(' ')}`));
  const prepare = createTranslationPreparer(await directory(), translator);
  const result = await prepare(source);
  for (const locale of targetLocales) {
    expect(Object.keys(result.translations![locale])).toHaveLength(contentStrings(source).length);
    expect(getPublishedHome(locale, result)?.heroTitle).toContain(`${locale} text`);
    expect(getPublishedPageOverride('about', result, locale)).toMatchObject({profileBody: expect.stringContaining(`${locale} text`), contactEmail: 'owner@example.com', wechatQr: '/assets/qr.png', videoId: 'Em685F3Ec2A'});
    expect(getPublishedProductOverride('product', result, locale)).toMatchObject({name: expect.stringContaining(`${locale} text`), image: '/assets/product.png', moqQuantity: 1000, moqUnit: 'bottles'});
    expect(getPublishedFormatOverride('format', result, locale)?.specification).toContain(`${locale} text`);
    expect(getPublishedCredentialOverride('credential', result, locale)).toMatchObject({title: expect.stringContaining(`${locale} text`), number: 'CN123456', pdf: '/assets/certificate.pdf'});
    expect(listPublishedArticles(locale, result)[0].body).toContain(`${locale} text`);
  }
  expect(getPublishedHome('zh', result)).toEqual(source.home);
  expect(getPublishedArticleStaticParams(result)).toHaveLength(6);
  translator.mockClear();
  await prepare({...source, home: {...source.home!, heroImage: '/assets/replaced.png'}});
  expect(translator).not.toHaveBeenCalled();
  await prepare({...source, home: {...source.home!, heroTitle: '修改后的标题'}});
  expect(translator.mock.calls[0][0]).toHaveLength(5);
  expect(translator.mock.calls[0][0].every(request => request.text === '修改后的标题')).toBe(true);
});

it('rejects empty, partial, untranslated and number-changing output', async () => {
  const source = snapshot();
  for (const mode of ['partial', 'empty', 'chinese', 'numbers']) {
    const prepare = createTranslationPreparer(await directory(), async requests => mode === 'partial' ? [] : requests.map(() => mode === 'empty' ? '' : mode === 'chinese' ? '未翻译' : 'no numbers'));
    await expect(prepare(source)).rejects.toThrow();
  }
});

it('rejects a missing locale when rendering a translated snapshot instead of silently showing stale content', async () => {
  const source = snapshot();
  source.translations = {en: {}, fr: {}, es: {}, ru: {}, ar: {}};
  expect(() => getPublishedHome('fr', source)).toThrow('Missing published translation');
});

it('reuses existing translations only when the complete Chinese source matches', async () => {
  const dictionary = JSON.parse(await readFile('content/maintained-translations.json', 'utf8')) as Record<string, Record<string, string>>;
  const text = Object.keys(dictionary).find(value => value.length < 60 && !/\d/.test(value) && targetLocales.every(locale => dictionary[value][locale]))!;
  const source = snapshot();
  source.home!.heroTitle = text;
  const translator = vi.fn(async (requests: {text: string; target: string}[]) => requests.map(({text: input, target}) => `${target} translated ${(input.match(/\d+/g) ?? []).join(' ')}`));
  const prepare = createTranslationPreparer(await directory(), translator);
  const first = await prepare(source);
  for (const locale of targetLocales) expect(first.translations![locale][text]).toBe(dictionary[text][locale]);
  expect(translator.mock.calls.flatMap(call => call[0]).some(request => request.text === text)).toBe(false);
  translator.mockClear();
  const modified = {...first, home: {...first.home!, heroTitle: `修改后：${text}`}};
  const next = await prepare(modified);
  expect(translator.mock.calls[0][0]).toHaveLength(5);
  for (const locale of targetLocales) expect(next.translations![locale][modified.home.heroTitle]).toContain(`${locale} translated`);
});
