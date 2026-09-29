import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const binary = process.env.BROWSE_BIN;
if (!binary) throw new Error('Set BROWSE_BIN to the installed gstack browse executable.');
const origin = process.argv[2] ?? 'http://localhost:3100';
const output = resolve(process.argv[3] ?? 'output/locale-audit-2026-09-08');
mkdirSync(output, {recursive: true});
const browse = (...args) => execFileSync(binary, args, {encoding: 'utf8', timeout: 65000}).trim();
const js = (expression) => JSON.parse(browse('js', `JSON.stringify(${expression})`));
const checks = [];
for (const locale of process.argv.includes('--interactions-only') ? [] : ['en', 'zh', 'ar']) {
  for (const path of ['', 'products', 'categories/specialty-patches', 'inquiry', 'insights', 'insights/hydrogel-eye-mask-selection-guide', 'insights/sample-confirmation-to-production', 'studio', 'ui-lab']) {
    browse('goto', `${origin}/${locale}/${path ? `${path}/` : ''}`);
    for (const viewport of ['1280x720', '375x812']) {
      browse('viewport', viewport);
      const metrics = js(`({path:location.pathname,lang:document.documentElement.lang,dir:getComputedStyle(document.documentElement).direction,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent,brokenVisibleImages:[...document.images].filter(image=>image.complete&&image.naturalWidth===0&&image.getBoundingClientRect().height>0&&image.getBoundingClientRect().top<innerHeight).map(image=>image.getAttribute('src'))})`);
      checks.push(metrics);
      if (!path && viewport === '375x812') browse('screenshot', '--viewport', resolve(output, `${locale}-home-mobile.png`));
    }
    console.log(`${locale}/${path || '(home)'}: desktop + mobile inspected`);
  }
}
if (checks.length) writeFileSync(resolve(output, 'browser-checks.json'), JSON.stringify(checks, null, 2) + '\n');

const validation = [];
for (const locale of ['en', 'zh', 'ar']) {
  browse('goto', `${origin}/${locale}/inquiry/`);
  browse('wait', '--networkidle');
  for (const name of ['name', 'company', 'market', 'quantity', 'budget', 'launchDate', 'packagingPreference', 'productGoal']) {
    // Whitespace passes HTML required validation and fails schema trim().min(1).
    browse('fill', `[name="${name}"]`, ' ');
  }
  browse('fill', '[name="businessEmail"]', 'locale-audit@example.com');
  browse('click', '[name="privacyConsent"]');
  browse('click', 'form button[type="submit"]');
  browse('wait', '.error-summary');
  const result = js(`({locale:${JSON.stringify(locale)},path:location.pathname,errors:[...document.querySelectorAll('.error-summary li')].map(e=>e.textContent),title:document.querySelector('.error-summary b')?.textContent})`);
  if (!result.errors.length || !result.path.endsWith('/inquiry/')) throw new Error('Expected local validation rejection');
  validation.push(result);
  writeFileSync(resolve(output, 'form-validation.json'), JSON.stringify(validation, null, 2) + '\n');
  browse('js', 'document.querySelector(".error-summary").scrollIntoView({behavior:"instant",block:"center"})');
  browse('screenshot', '--viewport', resolve(output, `${locale}-validation.png`));
  console.log(`${locale}: ${result.errors.length} local validation errors captured`);
}
writeFileSync(resolve(output, 'form-validation.json'), JSON.stringify(validation, null, 2) + '\n');

browse('goto', `${origin}/ar/products/`);
browse('viewport', '1280x720');
const measure = `({lang:document.documentElement.lang,dir:getComputedStyle(document.documentElement).direction,text:document.querySelector('main').textContent,brandX:document.querySelector('.brand').getBoundingClientRect().x,h1X:document.querySelector('h1').getBoundingClientRect().x,scrollWidth:document.documentElement.scrollWidth})`;
const baseline = js(measure);
browse('js', 'document.documentElement.dir="ltr"');
const ablated = js(measure);
browse('screenshot', '--viewport', resolve(output, 'ar-products-without-rtl.png'));
browse('js', 'document.documentElement.dir="rtl"');
const restored = js(measure);
writeFileSync(resolve(output, 'rtl-ablation.json'), JSON.stringify({baseline, ablated, restoredMetrics: restored, textUnchanged: baseline.text === ablated.text, restored: restored.dir === baseline.dir && restored.brandX === baseline.brandX}, null, 2) + '\n');
console.log('RTL ablation completed and direction restored.');
