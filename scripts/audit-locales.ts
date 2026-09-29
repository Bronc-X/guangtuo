import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import * as catalog from '../src/data/catalog';
import * as company from '../src/data/company-page-copy';
import * as hydrogel from '../src/data/hydrogel-formats';
import * as visuals from '../src/data/site-visuals';
import * as patents from '../src/data/patent-documents';
import * as mail from '../src/data/mail-agent';
import * as packaging from '../src/data/legacy-packaging-catalog';
import * as studio from '../src/lib/sku-3d-studio';
import * as studioDelivery from '../src/lib/studio-delivery';
import {getArticlePageCopy, pageLabels} from '../src/data/page-labels';
import {getSiteCopy, steps} from '../src/data/site-copy';
import {getPublishedHome, listPublishedArticles, publishedContent} from '../src/lib/published-content';

const targets = ['en', 'zh', 'fr', 'es', 'ru', 'ar'] as const;
type Finding = {path: string; locale: string; kind: string; value?: unknown; english?: unknown};
const findings: Finding[] = [];
const sharedTermsReviewed: Finding[] = [];
const counts = {en: 0, zh: 0, fr: 0, es: 0, ru: 0, ar: 0};
const sharedTerms = /^(?:[\d\s.,%+×x/()–—-]+|\d+(?:\.\d+)?\s*(?:g|ml|mm|cm)|OEM(?:\s*\/\s*ODM)?|ODM|PVC|PET|PP|PE|ISO(?:\s.*)?|GMPC|FDA|MSDS|INCI|MOQ|SKU|GUANGTUO(?: BIO)?|Guangtuo Bio|©.*)$/i;
const reviewedSharedLiterals = new Set(['PCR-PP', 'PETG', 'PET / AL / PE', 'PET / PE', 'Guangzhou Pinjue Biotechnology Co., Ltd.']);
function compare(values: Record<string, unknown>, path: string) {
  const english = values.en;
  if (typeof english === 'string') {
    for (const locale of targets) {
      counts[locale]++;
      const value = values[locale];
      if (typeof value !== 'string' || !value.trim()) {
        findings.push({path, locale, kind: 'missing-or-empty', value, english});
      } else if (locale !== 'en' && value === english) {
        // These are correctly spelled French/Spanish words or geographic names, not fallbacks.
        const reviewedLocaleTerm = (locale === 'fr' && ['Format', 'Formats', 'Production', 'Europe'].includes(value)) || (locale === 'es' && ['Asia', 'GUANGZHOU · CHINA'].includes(value));
        if (sharedTerms.test(value.trim()) || reviewedSharedLiterals.has(value) || reviewedLocaleTerm) {
          sharedTermsReviewed.push({path, locale, kind: 'shared-unit-code-or-legal-name', value});
        } else if (/[a-z]{3}/i.test(value)) {
          findings.push({path, locale, kind: 'same-as-English-review', value});
        }
      }
    }
  } else if (english && typeof english === 'object') {
    for (const key of Object.keys(english)) {
      compare(Object.fromEntries(targets.map(locale => [locale, (values[locale] as Record<string, unknown> | undefined)?.[key]])), `${path}.${key}`);
    }
    for (const locale of targets.filter(locale => locale !== 'en')) {
      if (values[locale] && typeof values[locale] === 'object') {
        for (const key of Object.keys(values[locale] as object)) {
          if (!(key in english)) findings.push({path: `${path}.${key}`, locale, kind: 'extra-key'});
        }
      }
    }
  }
}
function walk(value: unknown, path: string) {
  if (!value || typeof value !== 'object') return;
  if ('en' in value && ('zh' in value || 'ar' in value)) {
    compare(value as Record<string, unknown>, path);
    return;
  }
  for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
}
const modules = {catalog, company, hydrogel, visuals, patents, mail, packaging, studio, studioDelivery};
for (const [name, module] of Object.entries(modules)) walk(module, name);
compare(Object.fromEntries(targets.map(locale => [locale, getSiteCopy(locale)])), 'home');
compare(steps, 'steps');
compare(pageLabels, 'pageLabels');
compare(Object.fromEntries(targets.map(locale => [locale, getArticlePageCopy(locale)])), 'articleUI');
compare(Object.fromEntries(targets.map(locale => [locale, JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))])), 'messages');
const report = {
  generatedAt: new Date().toISOString(),
  scope: 'Exported public content data, homepage copy and complete next-intl message trees; identical English strings require review, not automatic classification as untranslated.',
  counts,
  findings,
  sharedTermsReviewed,
  byModule: Object.keys({...modules, home: 1, steps: 1, messages: 1}).map(module => ({module,
    findings: findings.filter(item => item.path.startsWith(`${module}.`)).length,
    arabicSameAsEnglish: findings.filter(item => item.path.startsWith(`${module}.`) && item.locale === 'ar' && item.kind === 'same-as-English-review').length
  })),
  routes: Object.fromEntries(targets.map(locale => [locale, {products: catalog.products.length, categories: catalog.categories.length, formats: hydrogel.hydrogelFormats.length, articles: listPublishedArticles(locale).length}])),
  cmsAblation: targets.map(locale => ({locale,
    baselineHomeOverride: Boolean(getPublishedHome(locale)),
    withoutCMSHomeOverride: Boolean(getPublishedHome(locale, {...publishedContent, home: null})),
    baselineArticles: listPublishedArticles(locale).length,
    withoutCMSArticles: listPublishedArticles(locale, {...publishedContent, articles: []}).length
  }))
};
const output = resolve(process.argv[2] ?? 'output/locale-audit-2026-09-08');
mkdirSync(output, {recursive: true});
writeFileSync(resolve(output, 'data-audit.json'), JSON.stringify(report, null, 2) + '\n');
const pages = ['', 'about', 'contact', 'customization', 'factory', 'how-it-works', 'inquiry', 'insights', 'patents', 'products', 'proposal', 'recommend', 'status', 'studio', 'ui-lab'];
const routes = targets.flatMap(locale => [...pages, ...catalog.categories.map(item => `categories/${item.slug}`), ...catalog.products.map(item => `products/${item.slug}`), ...listPublishedArticles(locale).map(item => `insights/${item.slug}`)].map(path => `/${locale}/${path ? `${path}/` : ''}`));
writeFileSync(resolve(output, 'routes.json'), JSON.stringify(routes, null, 2) + '\n');
console.log(JSON.stringify({...report, findings: findings.slice(0, 18)}, null, 2));
