import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

if (!process.env.BROWSE_BIN) throw new Error('Set BROWSE_BIN to the installed gstack browse executable.');
const origin = process.argv[2] ?? 'http://localhost:3100';
const output = resolve(process.argv[3] ?? 'output/locale-fixes-2026-09-08');
mkdirSync(output, {recursive: true});
const browse = (...args) => execFileSync(process.env.BROWSE_BIN, args, {encoding: 'utf8', timeout: 65000}).trim();
const js = expression => JSON.parse(browse('js', `JSON.stringify(${expression})`));
const results = [];
for (const viewport of ['1280x720', '375x812']) {
  browse('viewport', viewport);
  for (const slug of ['hydrogel-eye-mask-selection-guide', 'sample-confirmation-to-production']) {
    browse('goto', `${origin}/zh/insights/${slug}/?ref=locale-fix#details`);
    browse('wait', '--networkidle');
    for (const [target, index] of [['ar', 6], ['en', 1], ['zh', 2], ['fr', 3]]) {
      if (viewport === '375x812') browse('click', '.menu-button');
      browse('click', '.nav-language__trigger');
      const expected = target === 'fr' ? '/fr/insights/' : `/${target}/insights/${slug}/`;
      let navigationCompletedAfterClickTimeout = false;
      try {
        browse('click', `.nav-language__panel button:nth-child(${index})`);
      } catch (error) {
        // The clicked menu can disappear during a full-page language navigation.
        // Accept only an observed arrival at the exact destination, never a blind retry.
        if (js('location.pathname') !== expected) throw error;
        navigationCompletedAfterClickTimeout = true;
      }
      browse('wait', '--networkidle');
      const state = js(`({path:location.pathname,search:location.search,hash:location.hash,lang:document.documentElement.lang,dir:getComputedStyle(document.documentElement).direction,h1:document.querySelector('h1')?.textContent,notice:document.querySelector('.translation-notice:target')?.textContent})`);
      const passed = state.path === expected && state.lang === target && state.dir === (target === 'ar' ? 'rtl' : 'ltr') && state.search === '?ref=locale-fix' && (target === 'fr' ? Boolean(state.notice) : state.hash === '#details');
      results.push({viewport, slug, target, ...state, passed, navigationCompletedAfterClickTimeout});
      writeFileSync(resolve(output, 'article-switches.json'), JSON.stringify(results, null, 2) + '\n');
      if (!passed) throw new Error(JSON.stringify(results.at(-1)));
      if (slug === 'hydrogel-eye-mask-selection-guide' && (target === 'ar' || target === 'fr')) {
        browse('js', target === 'fr' ? 'document.querySelector(".translation-notice:target").scrollIntoView({behavior:"instant",block:"center"})' : 'window.scrollTo({top:0,behavior:"instant"})');
        browse('screenshot', '--viewport', resolve(output, `article-${target}-${viewport}.png`));
      }
    }
  }
}
console.log(JSON.stringify({checks: results.length, passed: results.filter(result => result.passed).length}));
