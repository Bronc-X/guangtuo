import {browse, js, save, shot, until} from './browser-driver.mjs';

const origin = process.argv[2] ?? 'http://localhost:3100';
browse('goto', `${origin}/zh/inquiry/`);
await until('!!document.querySelector(".brief-form")');
const fields={name:'交付测试',businessEmail:'delivery-qa@example.test',company:'QA Test Brand',market:'Test market',quantity:'5000',budget:'待确认',launchDate:'待确认',packagingPreference:'测试包装',productGoal:'测试眼膜需求',notes:'仅在隔离测试环境验证；不发送真实邮件。'};
for(const [key,value] of Object.entries(fields)) browse('fill', `.brief-form [name="${key}"]`, value);
browse('click','.brief-form [name="privacyConsent"]');
browse('network','--clear');
browse('click','.brief-form button[type="submit"]');
await until('location.pathname.endsWith("/status/") && document.querySelector(".status-result") !== null',20000);
const result=js('({path:location.pathname,fragment:location.hash,status:document.querySelector(".status-panel").innerText,storedLocally:[...Object.keys(sessionStorage)].some(k=>k.startsWith("gt-job:"))})');
save('inquiry-preview',{...result,network:browse('network'),actualEmailSent:false});
browse('js','document.querySelector(".status-panel").scrollIntoView({behavior:"instant",block:"center"})');
shot('inquiry-preview-no-email');
console.log(JSON.stringify(result));
