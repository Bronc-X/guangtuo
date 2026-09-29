import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('published content integration', () => {
  it('provides a validated build snapshot and one public content boundary', () => {
    expect(existsSync(join(process.cwd(), 'content/published-content.json'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/lib/published-content.ts'))).toBe(true);
  });

  it('exposes parsing and locale-safe public selectors', async () => {
    const publishedContent = await import('@/lib/published-content');

    expect(typeof publishedContent.parsePublishedContent).toBe('function');
    expect(typeof publishedContent.getPublishedHome).toBe('function');
    expect(typeof publishedContent.listPublishedArticles).toBe('function');
    expect(typeof publishedContent.getPublishedArticleBySlug).toBe('function');
    expect(typeof publishedContent.getPublishedArticleStaticParams).toBe('function');
  });

  it('strictly validates the build snapshot and rejects markup in article bodies', async () => {
    const {parsePublishedContent} = await import('@/lib/published-content') as {
      parsePublishedContent: (input: unknown) => PublishedContentFixture;
    };
    const parsed = parsePublishedContent(validSnapshot);

    expect(parsed.releaseId).toBe('release-test');
    expect(parsed.articles[0].body).toContain('第一段');
    expect(() => parsePublishedContent({...validSnapshot, unexpected: true})).toThrow();
    expect(() => parsePublishedContent({
      ...validSnapshot,
      articles: [{...validSnapshot.articles[0], body: '<p>不允许的 HTML</p>'}]
    })).toThrow(/plain text/i);
    expect(() => parsePublishedContent({
      ...validSnapshot,
      articles: [{...validSnapshot.articles[0], cover: 'https://cdn.example.com/cover.jpg'}]
    })).toThrow();
  });

  it('rejects traversal and encoded separators in same-origin image paths', async () => {
    const {parsePublishedContent} = await import('@/lib/published-content') as {
      parsePublishedContent: (input: unknown) => PublishedContentFixture;
    };
    const unsafePaths = [
      '/assets/../private.png',
      '/assets/folder\\private.png',
      '/assets/folder%2Fprivate.png',
      '/uploads/cms/folder%5cprivate.png',
      '/uploads/cms/%2E%2E/private.png'
    ];

    for (const heroImage of unsafePaths) {
      expect(() => parsePublishedContent({
        ...validSnapshot,
        home: {...validSnapshot.home!, heroImage}
      }), heroImage).toThrow();
    }
  });

  it('publishes snapshot content only on the Chinese locale without fallback', async () => {
    const publishedContent = await import('@/lib/published-content') as unknown as PublishedContentApi;
    const parsed = publishedContent.parsePublishedContent(validSnapshot);

    expect(publishedContent.getPublishedHome('zh', parsed)?.heroTitle).toBe('测试首页标题');
    expect(publishedContent.getPublishedHome('en', parsed)).toBeUndefined();
    expect(publishedContent.listPublishedArticles('zh', parsed).map((article) => article.slug)).toEqual([
      'second-article',
      'first-article'
    ]);
    expect(publishedContent.listPublishedArticles('en', parsed)).toEqual([]);
    expect(publishedContent.getPublishedArticleBySlug('zh', 'first-article', parsed)?.title).toBe('第一篇文章');
    expect(publishedContent.getPublishedArticleBySlug('en', 'first-article', parsed)).toBeUndefined();
    expect(publishedContent.getPublishedArticleStaticParams(parsed)).toEqual([
      {locale: 'zh', slug: 'second-article'},
      {locale: 'zh', slug: 'first-article'}
    ]);
  });

  it('ships an initial snapshot that can be parsed by the same strict contract', async () => {
    const {parsePublishedContent} = await import('@/lib/published-content') as {
      parsePublishedContent: (input: unknown) => PublishedContentFixture;
    };
    const seed = JSON.parse(readFileSync(join(process.cwd(), 'content/published-content.json'), 'utf8')) as unknown;
    const parsed = parsePublishedContent(seed);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.home?.heroTitle.trim()).toBeTruthy();
    expect(parsed.articles.length).toBeGreaterThan(0);
  });

  it('provides localized article index and detail routes', () => {
    expect(existsSync(join(process.cwd(), 'src/app/[locale]/insights/page.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/app/[locale]/insights/[slug]/page.tsx'))).toBe(true);
  });

  it('renders published articles as static, escaped plain-text pages', async () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/app/[locale]/insights/page.tsx'), 'utf8');
    const detailSource = readFileSync(join(process.cwd(), 'src/app/[locale]/insights/[slug]/page.tsx'), 'utf8');
    const detailModule = await import('@/app/[locale]/insights/[slug]/page') as {
      generateStaticParams?: () => Array<{locale: string; slug: string}>;
    };

    expect(indexSource).toContain('listPublishedArticles');
    expect(indexSource).toContain("localizedPath(locale, `insights/${article.slug}`)");
    expect(detailSource).toContain('export const dynamicParams = false');
    expect(detailSource).toContain('getPublishedArticleStaticParams');
    expect(detailSource).toContain('getPublishedArticleBySlug');
    expect(detailSource).toContain('className="cms-text">{article.body}');
    expect(detailSource).not.toContain('dangerouslySetInnerHTML');
    expect(typeof detailModule.generateStaticParams).toBe('function');
    expect(detailModule.generateStaticParams?.()).toEqual([
      {locale: 'en', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'en', slug: 'sample-confirmation-to-production'},
      {locale: 'zh', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'zh', slug: 'sample-confirmation-to-production'},
      {locale: 'fr', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'fr', slug: 'sample-confirmation-to-production'},
      {locale: 'es', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'es', slug: 'sample-confirmation-to-production'},
      {locale: 'ru', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'ru', slug: 'sample-confirmation-to-production'},
      {locale: 'ar', slug: 'hydrogel-eye-mask-selection-guide'},
      {locale: 'ar', slug: 'sample-confirmation-to-production'}
    ]);
  });

  it('connects the Chinese homepage hero and latest articles to the published snapshot', () => {
    const homeSource = readFileSync(join(process.cwd(), 'src/app/[locale]/page.tsx'), 'utf8');

    expect(homeSource).toContain('getPublishedHome(locale)');
    expect(homeSource).toContain("listPublishedArticles(locale).slice(0, 3)");
    expect(homeSource).toContain('publishedHome?.heroTitle');
    expect(homeSource).toContain('publishedHome?.heroBody');
    expect(homeSource).toContain('publishedHome?.heroImage');
    expect(homeSource).toContain('image={heroImage}');
    expect(homeSource).toContain("localizedPath(locale, `insights/${article.slug}`)");
  });
});

type PublishedContentFixture = {
  schemaVersion: 1;
  releaseId: string;
  publishedAt: string;
  home: {heroTitle: string; heroBody: string; heroImage: string} | null;
  articles: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    category: string;
    cover: string;
    publishedAt: string;
  }>;
};

type PublishedArticleFixture = PublishedContentFixture['articles'][number] & {paragraphs: string[]};

type PublishedContentApi = {
  parsePublishedContent: (input: unknown) => PublishedContentFixture;
  getPublishedHome: (locale: string, snapshot?: PublishedContentFixture) => PublishedContentFixture['home'] | undefined;
  listPublishedArticles: (locale: string, snapshot?: PublishedContentFixture) => PublishedArticleFixture[];
  getPublishedArticleBySlug: (locale: string, slug: string, snapshot?: PublishedContentFixture) => PublishedArticleFixture | undefined;
  getPublishedArticleStaticParams: (snapshot?: PublishedContentFixture) => Array<{locale: string; slug: string}>;
};

const validSnapshot: PublishedContentFixture = {
  schemaVersion: 1,
  releaseId: 'release-test',
  publishedAt: '2026-08-29T08:00:00.000Z',
  home: {
    heroTitle: '测试首页标题',
    heroBody: '测试首页简介。',
    heroImage: '/assets/hydrogel/eye-mask-hero.jpg'
  },
  articles: [
    {
      id: 'article-1',
      slug: 'first-article',
      title: '第一篇文章',
      summary: '第一篇文章摘要。',
      body: '第一段。\n\n第二段。',
      category: '产品与膜型',
      cover: '/assets/editorial/sample-review.png',
      publishedAt: '2026-08-27T08:00:00.000Z'
    },
    {
      id: 'article-2',
      slug: 'second-article',
      title: '第二篇文章',
      summary: '第二篇文章摘要。',
      body: '只有一段。',
      category: '制造与品控',
      cover: '/uploads/cms/article-2.webp',
      publishedAt: '2026-08-28T08:00:00.000Z'
    }
  ]
};
