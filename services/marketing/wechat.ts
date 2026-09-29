import {z} from 'zod';
import sharp from 'sharp';
import {escapeXml} from './video';

// Official Account articles use their own API; a WeChat Channels login is not interchangeable.
export function createWechatPublisher(env: Record<string, string | undefined>, fetcher: typeof fetch = fetch) {
  let token = ''; let expires = 0;
  const configured = Boolean(env.MARKETING_WECHAT_APP_ID && env.MARKETING_WECHAT_APP_SECRET);
  async function json(url: string, body?: object | FormData) {
    const response = await fetcher(url, {method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(30000), headers: body && !(body instanceof FormData) ? {'Content-Type': 'application/json'} : undefined, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined});
    if(!response.ok) throw new Error('公众号接口暂时不可用。');
    const value = await response.json() as Record<string, unknown>;
    if(value.errcode && value.errcode !== 0) throw new Error('公众号接口拒绝请求，请检查账号授权、接口权限和服务器 IP 白名单。');
    return value;
  }
  async function accessToken() {
    if(!configured) throw new Error('公众号尚未授权。');
    if(token && Date.now() < expires) return token;
    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.search = new URLSearchParams({grant_type:'client_credential', appid:env.MARKETING_WECHAT_APP_ID!, secret:env.MARKETING_WECHAT_APP_SECRET!}).toString();
    const result = z.object({access_token:z.string().min(1),expires_in:z.number().positive()}).parse(await json(url.href));
    token = result.access_token; expires = Date.now() + Math.max(0,result.expires_in - 120) * 1000; return token;
  }
  return {
    configured,
    async check() {await accessToken();},
    async send(title: string, text: string, cover: Buffer) {
      const current = await accessToken();
      const jpg = await sharp(cover).jpeg().toBuffer();
      const form = new FormData(); form.set('media', new Blob([new Uint8Array(jpg)],{type:'image/jpeg'}),'cover.jpg');
      const media = z.object({media_id:z.string().min(1)}).parse(await json(`https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(current)}&type=image`,form));
      const draft = z.object({media_id:z.string().min(1)}).parse(await json(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(current)}`,{articles:[{article_type:'news',title:title.slice(0,32),author:'SHOWKI BIOTECH',digest:text.slice(0,120),content:text.split(/\r?\n/).map(line=>`<p>${escapeXml(line)||'<br />'}</p>`).join(''),content_source_url:'https://showkibiotech.com',thumb_media_id:media.media_id,need_open_comment:0,only_fans_can_comment:0}]}));
      const receipt = z.object({publish_id:z.string().min(1)}).parse(await json(`https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${encodeURIComponent(current)}`,{media_id:draft.media_id}));
      return {id:receipt.publish_id,message:'公众号已接受文章发布任务；请在公众号后台核查结果。此操作不群发给订阅者。'};
    }
  };
}
