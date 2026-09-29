import {browse, js, save, shot, until} from './browser-driver.mjs';

const origin = process.argv[2] ?? 'http://localhost:3100';
const results = [];
for (const locale of ['zh','en','ar','fr','es','ru']) {
  for (const path of ['','products/','inquiry/','studio/']) {
    const navigation = browse('goto', `${origin}/${locale}/${path}`);
    await until(`document.documentElement.lang === ${JSON.stringify(locale)} && !!document.querySelector('main')`);
    for (const viewport of ['1280x720','375x812']) {
      browse('viewport', viewport);
      const result = js(`({locale:${JSON.stringify(locale)},path:location.pathname,title:document.title,h1:document.querySelector('h1')?.textContent,lang:document.documentElement.lang,direction:getComputedStyle(document.documentElement).direction,viewport:innerWidth,width:document.documentElement.scrollWidth,visibleBrokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().height>0&&i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0).map(i=>i.src),headings:[...document.querySelectorAll('main h2,main h3')].slice(0,25).map(e=>e.textContent)})`);
      results.push({...result,navigation});
    }
    if (locale === 'fr' && path === 'products/') shot('fr-products-mobile');
  }
  console.log(`${locale}: four routes, desktop and mobile checked`);
}
browse('viewport', '1280x720');
browse('goto', `${origin}/zh/insights/hydrogel-eye-mask-selection-guide/?qa=delivery#article`);
const switches=[];
for (const [index,locale] of [[5,'ar'],[0,'en'],[2,'fr']]) {
  browse('click', '.nav-language__trigger');
  browse('click', `.nav-language__panel button >> nth=${index}`);
  await until(`document.documentElement.lang === ${JSON.stringify(locale)}`);
  switches.push(js('({path:location.pathname,query:location.search,hash:location.hash,lang:document.documentElement.lang,dir:document.documentElement.dir,h1:document.querySelector("h1")?.textContent,text:document.querySelector("main")?.innerText.slice(0,500)})'));
}
shot('article-language-fallback');
save('six-locales', {results,switches});
console.log(JSON.stringify({checks:results.length,overflow:results.filter(r=>r.width>r.viewport),broken:results.filter(r=>r.visibleBrokenImages.length),switches}));
