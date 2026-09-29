import {readFileSync} from 'node:fs';
import {browse, until} from './browser-driver.mjs';

const {username, password} = JSON.parse(readFileSync('tmp/delivery-qa-20260908/qa-cms/browser-login.json', 'utf8'));
await until('!!document.querySelector("input[autocomplete=username]")');
browse('fill', 'input[autocomplete="username"]', username);
browse('fill', 'input[autocomplete="current-password"]', password);
browse('click', 'form button[type="submit"]');
await until('document.body.innerText.includes("图片与文件")');
console.log(browse('snapshot', '-i'));
