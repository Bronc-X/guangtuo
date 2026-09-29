import {describe, expect, it} from 'vitest';
import {categories, products} from '@/data/catalog';
import {hydrogelFormats, hydrogelMaterialFamilies, localizeHydrogelMeasure} from '@/data/hydrogel-formats';
import {getArticleLocaleAvailability, getPublishedArticleStaticParams, listPublishedArticles, publishedContent} from '@/lib/published-content';
import {replacePathLocale} from '@/lib/routing';
import {inquirySchema} from '@/lib/contracts';
import {inquiryValidationMessage} from '@/lib/inquiry-validation-copy';
import {companyPageCopy} from '@/data/company-page-copy';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {UiConceptLab} from '@/components/ui-concept-lab';
import {legacyPackagingProducts} from '@/data/legacy-packaging-catalog';
import {getArticlePageCopy} from '@/data/page-labels';

describe('public Chinese, English and Arabic content completeness', () => {
  it.each(['fr', 'es', 'ru'] as const)('translates format, material and product copy in %s', (locale) => {
    for (const item of [...hydrogelFormats.flatMap((format) => [format.name, format.effects, format.packaging]), ...hydrogelMaterialFamilies.flatMap((family) => [family.name, family.description]), ...products.flatMap((product) => [product.name, product.description])]) {
      expect(item[locale], item.en).not.toBe(item.en);
    }
    for (const item of legacyPackagingProducts) expect(item.name[locale], item.name.en).not.toBe(item.name.en);
    for (const [key, value] of Object.entries(getArticlePageCopy(locale))) {
      if (key !== 'author') expect(value, `article UI ${key}`).not.toBe(getArticlePageCopy('en')[key as keyof ReturnType<typeof getArticlePageCopy>]);
    }
  });
  it('provides Arabic product names, labels, descriptions and selling points', () => {
    for (const text of [
      ...categories.map(category => category.name),
      ...products.flatMap(product => [product.name, product.eyebrow, product.description, ...product.highlights, ...product.applications])
    ]) expect(text.ar, text.en).toMatch(/\p{Script=Arabic}/u);
  });

  it('keeps extended company translations active', () => {
    for (const page of Object.values(companyPageCopy)) {
      expect(page.seoTitle.ar).toMatch(/\p{Script=Arabic}/u);
      expect(page.seoDescription.ar).toMatch(/\p{Script=Arabic}/u);
    }
  });

  it('renders the Arabic concept lab without its English copy or Chinese avatar', () => {
    const markup = renderToStaticMarkup(createElement(UiConceptLab, {locale: 'ar'}));
    expect(markup).toContain('تجربة واحدة');
    expect(markup).toContain('اختر تصميم الواجهة');
    expect(markup).not.toMatch(/One experience for advice|DRAG TO ROTATE|LIVE PREVIEW|>顾</);
  });

  it('provides Arabic for every technical format and material family', () => {
    for (const text of [
      ...hydrogelFormats.flatMap(format => [format.name, format.effects, format.packaging]),
      ...hydrogelMaterialFamilies.flatMap(family => [family.name, family.description])
    ]) expect(text.ar, text.en).toMatch(/\p{Script=Arabic}/u);
  });

  it('localizes both singular and plural patch units while preserving quantities', () => {
    expect(localizeHydrogelMeasure('18 g / patch', 'zh')).toBe('18 g / 片');
    expect(localizeHydrogelMeasure('29 g × 4 patches / box', 'ar')).toBe('29 g × 4 لصقات / علبة');
    expect(localizeHydrogelMeasure('18 g / patch', 'en')).toBe('18 g / patch');
  });

  it('makes each current article readable and statically generated in all three languages', () => {
    const source = listPublishedArticles('zh');
    const params = getPublishedArticleStaticParams();
    for (const locale of ['zh', 'en', 'fr', 'es', 'ru', 'ar']) {
      const articles = listPublishedArticles(locale);
      expect(articles.map(article => article.slug)).toEqual(source.map(article => article.slug));
      for (const article of articles) {
        expect(params).toContainEqual({locale, slug: article.slug});
        expect(article.paragraphs.length).toBeGreaterThan(1);
        if (locale === 'ar') expect(article.body).toMatch(/\p{Script=Arabic}/u);
        if (locale !== 'zh') expect(article.body).not.toMatch(/\p{Script=Han}/u);
      }
    }
  });

  it('preserves translated article URLs but routes unavailable translations to a localized notice', () => {
    const available = getArticleLocaleAvailability();
    const path = '/zh/insights/hydrogel-eye-mask-selection-guide/?ref=header#details';
    expect(replacePathLocale(path, 'ar', available)).toBe('/ar/insights/hydrogel-eye-mask-selection-guide/?ref=header#details');
    expect(replacePathLocale(path, 'fr', available)).toBe('/fr/insights/hydrogel-eye-mask-selection-guide/?ref=header#details');
    expect(replacePathLocale('/zh/insights/new-article/', 'en', available)).toBe('/en/insights/#translation-unavailable');
  });

  it('does not attach old translations to an edited CMS article or resurrect an unpublished one', () => {
    const edited = {...publishedContent, articles: publishedContent.articles.map(article => ({...article, body: `${article.body}\n\n新的说明。`}))};
    expect(listPublishedArticles('zh', edited)).toHaveLength(2);
    expect(listPublishedArticles('en', edited)).toEqual([]);
    expect(listPublishedArticles('ar', edited)).toEqual([]);
    expect(getArticleLocaleAvailability({...publishedContent, articles: []})).toEqual({});
  });

  it.each(['zh', 'en', 'ar'] as const)('localizes required, email, consent and length errors in %s', (locale) => {
    const labels = {zh: {name: '您的姓名'}, en: {name: 'Name'}, ar: {name: 'الاسم'}}[locale];
    const nameResult = inquirySchema.safeParse({name: ' ', contact: 'wx_test', category: 'lotion', privacyConsent: true});
    expect(nameResult.success).toBe(false);
    if (!nameResult.success) {
      const message = inquiryValidationMessage(nameResult.error.issues[0], locale, labels);
      expect(message).toContain(labels.name);
      expect(message).not.toMatch(/Too small|expected string|>=/);
    }
    for (const data of [{businessEmail: 'invalid', privacyConsent: true, name: 'a'}, {businessEmail: 'test@example.com', privacyConsent: false, name: 'a'}, {businessEmail: 'test@example.com', privacyConsent: true, name: 'a'.repeat(201)}]) {
      const result = inquirySchema.safeParse({...data, category: 'lotion'});
      expect(result.success).toBe(false);
      if (!result.success) for (const issue of result.error.issues) {
        const message = inquiryValidationMessage(issue, locale, labels);
        expect(message).not.toMatch(/businessEmail|privacyConsent|Too big|Invalid/);
        if (locale === 'ar') expect(message).toMatch(/\p{Script=Arabic}/u);
        if (locale === 'zh') expect(message).toMatch(/\p{Script=Han}/u);
        if (issue.code === 'too_big') expect(message).toContain('200');
      }
    }
  });
});
