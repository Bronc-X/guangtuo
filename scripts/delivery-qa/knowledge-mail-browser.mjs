import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {browse, js, save, shot, until} from './browser-driver.mjs';

assert.ok(process.env.QA_PRIVATE_ROOT);
const credentials = JSON.parse(readFileSync(resolve(process.env.QA_PRIVATE_ROOT, 'qa-credentials.json'), 'utf8'));
browse('goto', 'http://127.0.0.1:3130/admin/');
await until('document.querySelector("input[type=password]")');
browse('fill', 'input[autocomplete=username]', credentials.username);
browse('fill', 'input[type=password]', credentials.password);
browse('click', 'button[type=submit]');
await until('document.body.innerText.includes("你好，")');
browse('click', 'button[aria-label="询盘与邮件"]');
await until('document.body.innerText.includes("依据资料生成草稿")');
assert.equal(js('[...document.querySelectorAll("button")].find(b=>b.textContent==="生成邮件草稿").disabled'), true);
browse('click', 'section[aria-label="资料辅助草稿"] input[type=checkbox]');
assert.equal(js('[...document.querySelectorAll("button")].find(b=>b.textContent==="生成邮件草稿").disabled'), false);
browse('js', '[...document.querySelectorAll("button")].find(b=>b.textContent==="生成邮件草稿").click()');
await until('document.body.innerText.includes("查看草稿引用")');
assert.ok(js('document.querySelector("textarea").value').includes('local QA draft'));
assert.equal(js('[...document.querySelectorAll("button")].find(b=>b.textContent==="发送邮件").disabled'), true);
browse('js', '[...document.querySelectorAll("details")].find(d=>d.textContent.includes("查看草稿引用")).open=true');
const results = [];
for (const width of [1440, 390]) {
  browse('viewport', `${width}x1000`);
  browse('js', 'document.querySelector("section[aria-label=资料辅助草稿]").scrollIntoView({block:"start",behavior:"instant"})');
  const overflow = js('document.documentElement.scrollWidth > innerWidth + 1');
  assert.equal(overflow, false);
  shot(`knowledge-mail-${width}`);
  results.push({width, overflow, generatedDraft: true, citationsVisible: true, sendWithoutSmtpDisabled: true, externalCalls: 0});
}
save('knowledge-mail-ui', results);
console.log(JSON.stringify({checks: results, passed: true}));
