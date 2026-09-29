import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {browse, js, output, save, shot, until} from './browser-driver.mjs';

const site = 'http://127.0.0.1:3120';
const results = [];
for (const locale of ['zh', 'en', 'fr', 'es', 'ru', 'ar']) {
  for (const width of [1440, 390]) {
    browse('viewport', `${width}x${width === 390 ? 844 : 1000}`);
    browse('goto', `${site}/${locale}/studio/`);
    await until('document.querySelectorAll("button[role=tab]").length === 2');
    browse('click', 'button[role=tab]:nth-child(2)');
    await until('document.body.innerText.includes("STUDIO_NOT_CONFIGURED")');
    const state = js('({alert: [...document.querySelectorAll("[role=alert]")].some(e=>e.textContent.includes("STUDIO_NOT_CONFIGURED")), disabled: [...document.querySelectorAll("button")].filter(e=>/conceptButton|generateButton/.test(e.className)).map(e=>e.disabled), overflow: document.documentElement.scrollWidth > innerWidth + 1})');
    assert.equal(state.alert, true);
    assert.deepEqual(state.disabled, [true, true]);
    assert.equal(state.overflow, false);
    if (locale === 'zh') {
      browse('js', 'document.querySelector("[role=alert]").scrollIntoView({block:"center",behavior:"instant"})');
      shot(`studio-unconfigured-${width}`);
    }
    results.push({test: 'generation-service-error', locale, width, ...state, passed: true});
  }
}

browse('viewport', '1440x1000');
browse('goto', `${site}/admin/`);
await until('document.querySelector("input[type=password]") || document.body.innerText.includes("你好，")');
if (js('Boolean(document.querySelector("input[type=password]"))')) {
  const root = process.env.DELIVERY_QA_ROOT;
  assert.ok(root, 'Specify the isolated empty, SMTP-disabled QA root');
  const credentials = JSON.parse(readFileSync(resolve(root, 'private/qa-credentials.json'), 'utf8'));
  browse('fill', 'input[autocomplete=username]', credentials.username);
  browse('fill', 'input[type=password]', credentials.password);
  browse('click', 'button[type=submit]');
}
await until('document.body.innerText.includes("你好，")');
browse('click', 'button[aria-label="询盘与邮件"]');
await until('document.body.innerText.includes("SMTP_NOT_CONFIGURED")');
assert.equal(js('document.body.innerText.includes("还没有询盘")'), true);
browse('screenshot', resolve(output, 'smtp-unconfigured-empty.png'), '--clip', '244,110,1196,606');
results.push({test: 'smtp-error-on-empty-list', passed: true});

browse('goto', `${site}/zh/inquiry/?qa=inquiry-offline`);
const fields = {name: 'Connectivity QA', businessEmail: 'connectivity@example.test', company: '隔离连接检查', market: 'France', quantity: '1000', budget: '待核实', launchDate: '2027', productGoal: 'Hydrogel eye care', packagingPreference: 'Jar', notes: '隔离测试，不发送外部邮件'};
for (const [key, value] of Object.entries(fields)) browse('fill', `[name="${key}"]`, value);
browse('click', 'input[name=privacyConsent]');
const priorDemoJobs = js('Object.keys(sessionStorage).filter(key=>key.startsWith("gt-job:"))');
browse('network', '--clear');
browse('click', 'button[type=submit]');
await until('document.querySelector(".error-summary")?.innerText.includes("暂时无法提交")');
assert.ok(browse('network').split('\n').some(line => /POST .*\/api\/inquiries → 503/.test(line)), 'The inquiry API must actually reject this request');
assert.equal(js('location.pathname'), '/zh/inquiry/');
assert.equal(js('document.querySelector("input[name=name]").value'), fields.name);
assert.deepEqual(js('Object.keys(sessionStorage).filter(key=>key.startsWith("gt-job:"))'), priorDemoJobs);
assert.equal(js('document.querySelector("button[type=submit]").disabled'), false);
browse('js', 'document.querySelector(".error-summary").scrollIntoView({block:"center",behavior:"instant"})');
shot('inquiry-service-unavailable');
results.push({test: 'inquiry-503-shows-error-keeps-input-no-demo-success', passed: true});
save('service-errors', results);
console.log(JSON.stringify({checks: results.length, passed: results.every(result => result.passed)}));
