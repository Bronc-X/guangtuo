import assert from 'node:assert/strict';
import {browse, js, save, shot, until} from './browser-driver.mjs';

const origin = process.argv[2] ?? 'http://localhost:3100';
browse('goto', `${origin}/zh/studio/`);
browse('viewport', '1280x900');
const results = [];
for (let index = 0; index < 5; index++) {
  browse('click', `main [role=radio]:nth-child(${index+1})`);
  await until('!!document.querySelector("main canvas") && !document.querySelector("[class*=modelLoader]")', 25000);
  const options = js('[...document.querySelectorAll("main select")].map(e => ({label:e.closest("label").textContent, first:e.options[0].value,last:e.options[e.options.length-1].value}))');
  for (let option = 0; option < options.length; option++) browse('select', `main select >> nth=${option}`, options[option].last);
  browse('click', 'main button[aria-label="石墨黑"]');
  const hasAssembly = js('!!document.querySelector("main [aria-label=部件开合演示]")');
  if (hasAssembly) browse('click', 'main [aria-label="部件开合演示"] button:text-is("打开")');
  const state = js('({name:document.querySelector("main [role=radio][aria-checked=true]").innerText,colorSelected:document.querySelector("main button[aria-label=石墨黑]").getAttribute("aria-pressed"),selected:[...document.querySelectorAll("main select")].map(e => e.value),assembly:document.querySelector("main [aria-label=部件开合演示] button[aria-pressed=true]")?.textContent,canvas:!!document.querySelector("main canvas"),productLink:document.querySelector("main a")?.getAttribute("href"),fileInputs:document.querySelectorAll("main input[type=file]").length,downloadButtons:[...document.querySelectorAll("main button,main a")].filter(e=>/导出|下载|分享/.test(e.textContent)).map(e=>e.textContent)})');
  assert.equal(state.colorSelected, 'true');
  assert.deepEqual(state.selected, options.map(e => e.last));
  results.push(state);
  if (index === 1 || index === 4) {
    browse('scroll', 'main canvas');
    shot(`studio-model-${index+1}`);
  }
}
browse('click', 'main [role=tab]:nth-child(2)');
await until('document.querySelector("main textarea") !== null');
const newShape = js('({text:document.querySelector("main").innerText, buttons:[...document.querySelectorAll("main button")].filter(e=>/查看方案图|查看可旋转/.test(e.textContent)).map(e=>({text:e.textContent,disabled:e.disabled})),fileInputs:document.querySelectorAll("main input[type=file]").length})');
browse('scroll', 'main textarea');
shot('studio-new-shape-unavailable');
browse('viewport', '375x812');
const mobile = js('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})');
shot('studio-mobile');
save('studio-checks', {models:results,newShape,mobile, realGenerationRun:false, mouseTouchRotationVerified:false, note:'Inspected model loading, parameter controls, colour and assembly; physical mouse/touch rotation was not automated.'});
console.log(JSON.stringify({models:results.length, canvases:results.every(e=>e.canvas), newShape:newShape.buttons, mobile, missingUpload:results.every(e=>e.fileInputs===0),missingExport:results.every(e=>e.downloadButtons.length===0)}));
browse('viewport', '1280x720');
