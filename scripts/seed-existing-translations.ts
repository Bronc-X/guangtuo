import {readFile, writeFile} from 'node:fs/promises';
import {products, type LocalizedText} from '../src/data/catalog';
import {hydrogelFormats, localizeHydrogelMeasure} from '../src/data/hydrogel-formats';
import {patentDocuments} from '../src/data/patent-documents';
import {companyPageCopy, companyText} from '../src/data/company-page-copy';
import {targetLocales} from '../src/lib/content-localization';

// Explicit migration only: never infer that an old translation belongs to changed Chinese.
const dictionary: Record<string, Record<string, string>> = {};
function add(source: string, values: Partial<LocalizedText>) {
  if (!source.trim()) return;
  const entry = dictionary[source] ??= {};
  for (const locale of targetLocales) {
    const value = values[locale];
    if (typeof value === 'string' && value.trim() && !/[\u3400-\u9fff]/u.test(value)) entry[locale] ??= value;
  }
}
for (const product of products) {
  for (const value of [product.name, product.description, ...product.highlights, ...product.applications, ...product.specifications.map(spec => spec.value)]) add(value.zh, value);
}
for (const format of hydrogelFormats) {
  for (const value of [format.name, format.effects, format.packaging]) add(value.zh, value);
  for (const value of [format.specification, format.moq]) add(value, Object.fromEntries(targetLocales.map(locale => [locale, localizeHydrogelMeasure(value, locale)])));
}
for (const document of patentDocuments) for (const value of [document.title, document.kind, document.rightsholder]) add(value.zh, value);
for (const page of Object.values(companyPageCopy)) for (const value of [page.intro.title, page.intro.body]) add(companyText('zh', value), Object.fromEntries(targetLocales.map(locale => [locale, companyText(locale, value)])));
const articles = JSON.parse(await readFile('content/article-translations.json', 'utf8')) as Record<string, Record<string, Record<string, string>>>;
for (const entry of Object.values(articles)) for (const field of ['title', 'summary', 'body', 'category']) add(entry.source[field], Object.fromEntries(targetLocales.map(locale => [locale, entry[locale]?.[field]])));
await writeFile('content/maintained-translations.json', JSON.stringify(dictionary, null, 2) + '\n');
console.log(`Preserved ${Object.keys(dictionary).length} exact-source translation entries.`);
