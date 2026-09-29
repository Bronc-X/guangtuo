import {browse, js, save, shot, until} from './browser-driver.mjs';
browse('viewport','1440x1000');
browse('goto','http://127.0.0.1:3120/zh/studio/');
const models=[];
await until('document.querySelector("[data-viewer-ready=true]")');
for(let index=1;index<=5;index++) {
  browse('click',`button[role=radio]:nth-child(${index})`);
  await until('document.querySelector("[data-viewer-ready=true]")');
  const name=js('document.querySelector("button[role=radio][aria-checked=true]").innerText');
  const ready=js('!Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="下载 PNG 效果图").disabled');
  const missing=js('Boolean(document.querySelector("[role=alert]"))');
  browse('js','document.querySelector("[data-studio-viewer]").scrollIntoView({block:"center",behavior:"instant"})');
  shot(`model-${index}`);
  models.push({name,ready,missing,passed:ready&&!missing});
}
save('five-models',models);
console.log(JSON.stringify(models));
if(models.some(m=>!m.passed))process.exitCode=1;
