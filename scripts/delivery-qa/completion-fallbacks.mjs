import assert from 'node:assert/strict';
import {browse, js, save, shot, until} from './browser-driver.mjs';
const results=[];
browse('viewport','390x844');
browse('network','--clear');
browse('goto','http://127.0.0.1:3120/zh/studio/');
await until('[...document.querySelectorAll("button")].some(button=>button.textContent.includes("下载 PNG 效果图") && !button.disabled)',30000);
assert.equal(js('document.body.innerText.includes("暂时无法显示 3D")'),false);
const baselineModelRequests=browse('network').split('\n').filter(line=>/\/models\/.*\.glb.*→ 200/.test(line));
assert.ok(baselineModelRequests.length,'Normal model must load before fault injection');
for(const scenario of ['no-webgl','missing-model']) {
  browse('viewport','390x844');
  browse('network','--clear');
  browse('goto',`http://127.0.0.1:3120/zh/studio/?qa=${scenario}`);
  await until('document.body.innerText.includes("暂时无法显示 3D")',30000);
  const failedModelRequests=browse('network').split('\n').filter(line=>/\/models\/.*\.glb.*→ 404/.test(line));
  if(scenario==='missing-model') assert.ok(failedModelRequests.length,'Missing-model scenario must actually receive a GLB 404');
  const webglDisabled=scenario==='no-webgl' ? js('document.createElement("canvas").getContext("webgl2") === null') : null;
  if(scenario==='no-webgl') assert.equal(webglDisabled,true);
  browse('js','document.querySelector("[role=alert]").scrollIntoView({behavior:"instant",block:"center"})');
  const overflow=js('document.documentElement.scrollWidth > innerWidth + 1');
  assert.equal(overflow,false);
  shot(`fallback-${scenario}-mobile`);
  results.push({scenario,fallback:true,overflow,webglDisabled,baselineModelRequests,failedModelRequests});
}
save('fallbacks',results);
console.log(JSON.stringify(results));
