import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {managedContentSeeds} from '../src/data/content-admin-seeds';
import {brandDefaults} from '../src/data/brand-defaults';
import {products} from '../src/data/catalog';
import {hydrogelFormats} from '../src/data/hydrogel-formats';
import {publishedContentSchema} from '../src/lib/published-content-schema';
import {contentStrings, targetLocales, mapEditorialText} from '../src/lib/content-localization';
import {createTranslationPreparer} from '../services/content-admin/translation';
import {createStaticDeployer} from '../services/content-admin/static-deployer';

// This check uses a private copy, never the CMS database or the live website.
const directory = path.resolve('artifacts/cms-translation-check');
await mkdir(directory, {recursive: true});
const source = publishedContentSchema.parse(JSON.parse(await readFile('content/published-content.json', 'utf8')));
source.releaseId = `translation-check-${randomUUID()}`;
source.publishedAt = new Date().toISOString();
for (const seed of managedContentSeeds) {
  const fields = seed.fields as unknown as Record<string, string | number | null>;
  const text = (key: string) => String(fields[key] ?? '');
  const image = text('legacyImage');
  if (seed.kind === 'pages') source.pageOverrides.push({pageId: seed.id, heroTitle: text('heroTitle'), heroBody: text('heroBody'), ...(seed.id === 'about' ? brandDefaults : {})});
  else if (seed.kind === 'products') source.productOverrides.push({productId: seed.id, name: text('name'), description: text('description'), highlights: text('highlights').split('\n'), applications: text('applications').split('\n'), netWeight: text('netWeight'), packFormat: text('packFormat'), moqQuantity: Number(fields.moqQuantity), moqUnit: text('moqUnit') as 'pieces' | 'bottles', image});
  else if (seed.kind === 'formats') source.formatOverrides.push({formatId: seed.id, name: text('name'), effects: text('effects'), specification: text('specification'), moq: text('moq'), packaging: text('packaging'), image});
  else source.credentialOverrides.push({credentialId: seed.id, title: text('title'), kind: text('kind'), number: text('number'), rightsholder: text('rightsholder'), image});
}
// Existing overrides win, and repeated runs never change the source file.
for (const [collection, key] of [['pageOverrides', 'pageId'], ['productOverrides', 'productId'], ['formatOverrides', 'formatId'], ['credentialOverrides', 'credentialId']] as const) {
  const values = source[collection];
  const unique = new Map<string, typeof values[number]>();
  for (const value of values) {const id = (value as unknown as Record<string, string>)[key]; if (!unique.has(id)) unique.set(id, value);}
  Object.assign(source, {[collection]: [...unique.values()]});
}
const started = Date.now();
if (process.argv.includes('--changed')) {
  const changed = <T,>(record: T) => mapEditorialText(record, text => text.trim() ? `更新：${text}` : text);
  source.home = changed(source.home);
  source.articles = source.articles.map(changed);
  source.pageOverrides = source.pageOverrides.map(changed);
  source.productOverrides = source.productOverrides.map(changed);
  source.formatOverrides = source.formatOverrides.map(changed);
  source.credentialOverrides = source.credentialOverrides.map(changed);
}
console.log(`Checking ${contentStrings(source).length} unique texts across five target languages.`);
const translated = await createTranslationPreparer(directory)(publishedContentSchema.parse(source));
const snapshotPath = path.join(directory, 'snapshot.json');
await writeFile(snapshotPath, JSON.stringify(translated, null, 2));
console.log(`Real offline translations completed in ${Math.round((Date.now() - started) / 1000)} seconds.`);
if (process.argv.includes('--build')) {
  console.log('Building an isolated copy of all six language sites.');
  await createStaticDeployer({projectDir: process.cwd(), dataDir: directory, siteRoot: path.join(directory, 'site')})({releaseId: translated.releaseId, snapshotPath, mediaDir: path.resolve('public/uploads/cms')});
  const live = path.join(directory, 'site', 'current');
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  for (const locale of targetLocales) {
    const home = await readFile(path.join(live, locale, 'index.html'), 'utf8');
    if (translated.home && !home.includes(escape(translated.translations![locale][translated.home.heroTitle]))) throw new Error(`Homepage translation missing: ${locale}`);
    for (const article of translated.articles) {
      const html = await readFile(path.join(live, locale, 'insights', article.slug, 'index.html'), 'utf8');
      if (!html.includes(escape(translated.translations![locale][article.title]))) throw new Error(`Article translation missing: ${locale}`);
    }
    const about = await readFile(path.join(live, locale, 'about', 'index.html'), 'utf8');
    const profile = translated.pageOverrides.find(page => page.pageId === 'about')?.profileTitle;
    if (profile && !about.includes(escape(translated.translations![locale][profile]))) throw new Error(`Company profile translation missing: ${locale}`);
    const checkText = (html: string, text: string, location: string) => {
      if (text && !html.includes(escape(translated.translations![locale][text]))) throw new Error(`Maintained field missing: ${locale}/${location}`);
    };
    for (const page of translated.pageOverrides) {
      const route = page.pageId === 'process' ? 'how-it-works' : page.pageId === 'contact' ? 'about' : page.pageId;
      const html = await readFile(path.join(live, locale, route, 'index.html'), 'utf8');
      checkText(html, page.heroTitle, `${route}/heroTitle`);
      checkText(html, page.heroBody, `${route}/heroBody`);
    }
    for (const product of translated.productOverrides) {
      const slug = products.find(item => item.productId === product.productId)!.slug;
      const html = await readFile(path.join(live, locale, 'products', slug, 'index.html'), 'utf8');
      for (const value of [product.name, product.description, ...product.highlights, ...product.applications, product.netWeight, product.packFormat]) checkText(html, value, `products/${slug}`);
      if (!html.includes(product.image)) throw new Error(`Product image missing: ${slug}`);
    }
    for (const format of translated.formatOverrides) {
      const category = hydrogelFormats.find(item => item.id === format.formatId)!.category;
      const html = await readFile(path.join(live, locale, 'categories', category, 'index.html'), 'utf8');
      for (const value of [format.name, format.effects, format.specification, format.moq, format.packaging]) checkText(html, value, `formats/${format.formatId}`);
      if (!html.includes(format.image)) throw new Error(`Format image missing: ${format.formatId}`);
    }
    const patents = await readFile(path.join(live, locale, 'patents', 'index.html'), 'utf8');
    for (const credential of translated.credentialOverrides) {
      for (const value of [credential.title, credential.kind, credential.rightsholder]) checkText(patents, value, `credentials/${credential.credentialId}`);
      if (!patents.includes(escape(credential.number))) throw new Error(`Certificate number changed: ${credential.credentialId}`);
    }
  }
  console.log('Verified all maintained page, product, format, credential and article texts in the five translated sites.');
}
await writeFile(path.join(directory, 'result.json'), JSON.stringify({checkedAt: new Date().toISOString(), sourceLanguage: 'zh', targetLocales, uniqueTexts: contentStrings(translated).length, pages: translated.pageOverrides.length, products: translated.productOverrides.length, formats: translated.formatOverrides.length, credentials: translated.credentialOverrides.length, articles: translated.articles.length, actualEngine: 'Argos Translate 1.11 / CTranslate2 CPU int8', built: process.argv.includes('--build'), allEditorialFieldsChanged: process.argv.includes('--changed')}, null, 2));
