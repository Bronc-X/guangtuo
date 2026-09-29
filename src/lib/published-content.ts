import {mapEditorialText} from './content-localization';
import snapshotSource from '../../content/published-content.json';
import articleTranslationSource from '../../content/article-translations.json';
import {isLocale, locales, type Locale} from './routing';
import {
  parsePublishedContent,
  type PublishedContentSnapshot,
  type PublishedCredentialOverride,
  type PublishedFormatOverride,
  type PublishedHome,
  type PublishedPageOverride,
  type PublishedProductOverride
} from './published-content-schema';

export {parsePublishedContent, publishedContentSchema} from './published-content-schema';
export type {PublishedContentSnapshot, PublishedHome} from './published-content-schema';
export type PublishedArticle = PublishedContentSnapshot['articles'][number] & {paragraphs: string[]};

export const publishedContent = parsePublishedContent(snapshotSource);

type ArticleText = Pick<PublishedArticle, 'title' | 'summary' | 'body' | 'category'>;
const articleTranslations: Record<string, {source: ArticleText} & Partial<Record<Locale, ArticleText>>> = articleTranslationSource;

function articleText(article: PublishedContentSnapshot['articles'][number], locale: string): ArticleText | undefined {
  if (locale === 'zh') return article;
  if (!isLocale(locale)) return undefined;
  const translation = articleTranslations[article.slug];
  // A CMS edit must not leave a stale translation attached to the new source.
  if (!translation || (['title', 'summary', 'body', 'category'] as const).some(key => translation.source[key] !== article[key])) return undefined;
  return translation[locale];
}

export function localizeContent<T>(record: T, locale: string, snapshot: PublishedContentSnapshot = publishedContent): T {
  if (locale === 'zh' || !snapshot.translations || !isLocale(locale)) return record;
  return mapEditorialText(record, text => {
    if (!text.trim()) return text;
    const result = snapshot.translations?.[locale as Exclude<Locale, 'zh'>]?.[text];
    if (!result) throw new Error(`Missing published translation: ${locale}`);
    return result;
  });
}

export function getPublishedHome(locale: string, snapshot: PublishedContentSnapshot = publishedContent): PublishedHome | undefined {
  if (!snapshot.home || (locale !== 'zh' && !snapshot.translations)) return undefined;
  return localizeContent(snapshot.home, locale, snapshot);
}

export function getPublishedPageOverride(pageId: string, snapshot: PublishedContentSnapshot = publishedContent, locale: string = 'zh'): PublishedPageOverride | undefined {
  const record = snapshot.pageOverrides.find((item) => item.pageId === pageId);
  return record ? localizeContent(record, locale, snapshot) : undefined;
}

export function getPublishedProductOverride(productId: string, snapshot: PublishedContentSnapshot = publishedContent, locale: string = 'zh'): PublishedProductOverride | undefined {
  const record = snapshot.productOverrides.find((item) => item.productId === productId);
  return record ? localizeContent(record, locale, snapshot) : undefined;
}

export function getPublishedFormatOverride(formatId: string, snapshot: PublishedContentSnapshot = publishedContent, locale: string = 'zh'): PublishedFormatOverride | undefined {
  const record = snapshot.formatOverrides.find((item) => item.formatId === formatId);
  return record ? localizeContent(record, locale, snapshot) : undefined;
}

export function getPublishedCredentialOverride(credentialId: string, snapshot: PublishedContentSnapshot = publishedContent, locale: string = 'zh'): PublishedCredentialOverride | undefined {
  const record = snapshot.credentialOverrides.find((item) => item.credentialId === credentialId);
  return record ? localizeContent(record, locale, snapshot) : undefined;
}

export function listPublishedArticles(locale: string, snapshot: PublishedContentSnapshot = publishedContent): PublishedArticle[] {
  return [...snapshot.articles]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .flatMap((article) => {
      const text = snapshot.translations ? localizeContent(article, locale, snapshot) : articleText(article, locale);
      return text ? [{...article, ...text, paragraphs: splitArticleParagraphs(text.body)}] : [];
    });
}

export function getPublishedArticleBySlug(
  locale: string,
  slug: string,
  snapshot: PublishedContentSnapshot = publishedContent
): PublishedArticle | undefined {
  return listPublishedArticles(locale, snapshot).find((article) => article.slug === slug);
}

export function getPublishedArticleStaticParams(snapshot: PublishedContentSnapshot = publishedContent): Array<{locale: Locale; slug: string}> {
  return locales.flatMap(locale => listPublishedArticles(locale, snapshot).map(article => ({locale, slug: article.slug})));
}

export function getArticleLocaleAvailability(snapshot: PublishedContentSnapshot = publishedContent): Record<string, Locale[]> {
  const available: Record<string, Locale[]> = {};
  for (const {locale, slug} of getPublishedArticleStaticParams(snapshot)) {
    (available[slug] ??= []).push(locale);
  }
  return available;
}

function splitArticleParagraphs(body: string): string[] {
  return body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}
