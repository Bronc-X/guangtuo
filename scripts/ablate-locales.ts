import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

// Bundle controlled variants without modifying any application source or CMS data.
const output = resolve(process.argv[2] ?? 'output/locale-audit-2026-09-08');
const variantsDir = resolve(output, 'variants');
mkdirSync(variantsDir, {recursive: true});
const files = ['catalog', 'company-page-copy', 'company-extended-translations', 'hydrogel-formats', 'hydrogel-arabic', 'mail-agent', 'legacy-packaging-catalog'].map(name => resolve(`src/data/${name}.ts`));
const hashes = () => Object.fromEntries(files.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
const before = hashes();
const entry = `
  import * as catalog from './src/data/catalog';
  import * as company from './src/data/company-page-copy';
  import * as hydrogel from './src/data/hydrogel-formats';
  import * as mail from './src/data/mail-agent';
  import * as packaging from './src/data/legacy-packaging-catalog';
  export const data = {catalog, company, hydrogel, mail, packaging};
`;
function flatten(value: unknown, path = 'data', result: Record<string, {en: string; zh: string; ar: string}> = {}) {
  if (!value || typeof value !== 'object') return result;
  if ('en' in value && typeof value.en === 'string' && 'ar' in value) {
    result[path] = value as {en: string; zh: string; ar: string};
  } else {
    for (const [key, child] of Object.entries(value)) flatten(child, `${path}.${key}`, result);
  }
  return result;
}
const results = [];
let baseline: ReturnType<typeof flatten> = {};
for (const variant of ['baseline', 'without-english-fallback', 'without-company-extended-arabic']) {
  const transformations: Array<{file: string; rule: string; matches: number}> = [];
  const outfile = resolve(variantsDir, `${variant}.mjs`);
  await build({stdin: {contents: entry, resolveDir: process.cwd(), loader: 'ts'}, outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
    plugins: [{name: 'controlled-ablation', setup(builder) {
      builder.onLoad({filter: /src[\\/]data[\\/].*\.ts$/}, ({path}) => {
        let contents = readFileSync(path, 'utf8');
        function replace(pattern: RegExp, replacement: string, rule: string) {
          const matches = [...contents.matchAll(pattern)].length;
          if (matches) transformations.push({file: basename(path), rule, matches});
          contents = contents.replace(pattern, replacement);
        }
        if (variant === 'without-english-fallback') {
          replace(/ar = en/g, "ar = ''", 'Remove implicit Arabic default to English');
          replace(/ar = hydrogelArabic\[en\] \?\? en/g, "ar = hydrogelArabic[en] ?? ''", 'Remove hydrogel Arabic fallback while keeping translations');
          replace(/ar: catalogTranslations\.ar\[en\] \?\? en/g, "ar: catalogTranslations.ar[en] ?? ''", 'Remove catalog Arabic fallback');
          replace(/companyExtendedTranslations\[english\]\?\.\[locale\] \?\? english/g, "companyExtendedTranslations[english]?.[locale] ?? (locale === 'ar' ? '' : english)", 'Remove extended Arabic fallback');
          // Keep the translation lookup active when the implicit argument default is removed.
          replace(/ar: ar === en \? \((mailAgentTranslations|packagingTranslations)\[en\]\?\.ar \?\? en\) : ar/g, "ar: ar === '' ? ($1[en]?.ar ?? '') : ar", 'Preserve explicit translations, remove fallback');
          replace(/ar: ar === en \? getCompanyExtendedText\('ar', en\) : ar/g, "ar: ar === '' ? getCompanyExtendedText('ar', en) : ar", 'Preserve extended translation lookup');
        }
        if (variant === 'without-company-extended-arabic' && basename(path) === 'company-extended-translations.ts') {
          replace(/return companyExtendedTranslations\[english\]\?\.\[locale\] \?\? english;/g, "return locale === 'ar' ? english : (companyExtendedTranslations[english]?.[locale] ?? english);", 'Remove only Arabic extended dictionary lookup');
        }
        return {contents, loader: 'ts'};
      });
    }}]
  });
  const {data} = await import(pathToFileURL(outfile).href);
  const values = flatten(data);
  if (variant === 'baseline') baseline = values;
  const changed = Object.entries(values).filter(([path, value]) => value.ar !== baseline[path]?.ar).map(([path, value]) => ({path, baseline: baseline[path].ar, variant: value.ar}));
  const controlsUnchanged = Object.entries(values).every(([path, value]) => value.en === baseline[path]?.en && value.zh === baseline[path]?.zh);
  if (!controlsUnchanged) throw new Error(`${variant} changed the English/Chinese control data`);
  if (variant !== 'baseline' && !transformations.length) throw new Error(`No mutation applied for ${variant}`);
  results.push({variant, fields: Object.keys(values).length, emptyArabic: Object.values(values).filter(value => !value.ar?.trim()).length,
    changedArabic: changed.length, controlsUnchanged, transformations, changed});
}
const sourceUnchanged = JSON.stringify(before) === JSON.stringify(hashes());
if (!sourceUnchanged) throw new Error('Application source changed during the experiment');
writeFileSync(resolve(output, 'ablation.json'), JSON.stringify({generatedAt: new Date().toISOString(), sourceUnchanged, sourceHashes: before, results}, null, 2) + '\n');
console.log(JSON.stringify({sourceUnchanged, results: results.map(({changed, ...result}) => ({...result, examples: changed.slice(0, 3)}))}, null, 2));
