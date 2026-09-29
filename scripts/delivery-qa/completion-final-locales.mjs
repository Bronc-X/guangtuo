import {browse, js, save, shot, until} from './browser-driver.mjs';
const results=[];
const routes=['','products','inquiry','studio','insights','insights/hydrogel-eye-mask-selection-guide'];
for(const width of [1440,390]) {
  browse('viewport',`${width}x${width===1440?1000:844}`);
  for(const locale of ['zh','en','fr','es','ru','ar']) {
    for(const page of routes) {
      browse('network','--clear');
      browse('goto',`http://127.0.0.1:3120/${locale}/${page?`${page}/`:''}`);
      await until('document.querySelector("main") && document.readyState==="complete" && document.fonts.status==="loaded"',30000);
      if(page==='studio') await until('document.querySelector("[data-viewer-ready=true]")',30000);
      const view=js('({width:innerWidth,documentWidth:document.documentElement.scrollWidth,dir:document.documentElement.dir,headings:document.querySelectorAll("h1").length,brokenImages:Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().width>0).map(i=>i.src)})');
      const failedRequests=browse('network').split('\n').filter(line=>/→ [45]\d\d/.test(line));
      results.push({locale,page,width,...view,failedRequests,passed:view.documentWidth<=width+1&&view.headings>0&&view.brokenImages.length===0&&failedRequests.length===0});
      if(width===1440&&page===''&&locale==='zh')shot('brief-home');
      if(width===1440&&page==='studio'&&locale==='zh'){browse('js','document.querySelector("[data-studio-viewer]").scrollIntoView({block:"center",behavior:"instant"})');shot('brief-studio');}
      if(width===1440&&page==='insights/hydrogel-eye-mask-selection-guide'&&locale==='fr')shot('brief-french-article');
      if(width===390&&page==='products'&&locale==='ar')shot('brief-arabic-mobile');
    }
    save('final-locales',results);
    console.log(`${locale} ${width}px: ${results.filter(x=>x.locale===locale&&x.width===width).length} pages checked`);
  }
}
save('final-locales',results);
const failed=results.filter(r=>!r.passed);
console.log(JSON.stringify({checked:results.length,failed},null,2));
if(failed.length)process.exitCode=1;
