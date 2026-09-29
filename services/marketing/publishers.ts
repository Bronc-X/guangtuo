import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {z} from 'zod';
import {trustedBaseUrl} from '../integrations/http';
import {createWechatPublisher} from './wechat';
import {marketingPlatforms, platformNames, type MarketingChannel, type MarketingPlatform} from '../../src/lib/marketing-contracts';

const integrationSchema = z.array(z.object({id: z.string(), name: z.string(), identifier: z.string(), disabled: z.boolean().optional()}));
const aliases: Record<string, MarketingPlatform> = {'linkedin': 'linkedin', 'linkedin-page': 'linkedin', facebook: 'facebook', instagram: 'instagram', 'instagram-standalone': 'instagram', youtube: 'youtube', tiktok: 'tiktok'};
export function createMarketingPublishers(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch) {
  const wechat = createWechatPublisher(env, fetcher);
  const configured = Boolean(env.MARKETING_POSTIZ_URL && env.MARKETING_POSTIZ_API_KEY);
  const base = configured ? trustedBaseUrl(env.MARKETING_POSTIZ_URL!, 'MARKETING') : '';
  async function postiz(route: string, body?: object | FormData) {
    if (!configured) throw new Error('尚未连接 Postiz，请先完成账号授权。');
    const response = await fetcher(`${base}${route}`, {method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(60000), headers: {Authorization: env.MARKETING_POSTIZ_API_KEY!, ...(body && !(body instanceof FormData) ? {'Content-Type': 'application/json'} : {})}, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined});
    if (!response.ok) throw new Error(`发布服务返回 ${response.status}，请核查平台账号或服务配置。`);
    return await response.json() as unknown;
  }
  async function integrations() {return configured ? integrationSchema.parse(await postiz('/integrations')) : [];}
  function account(platform: MarketingPlatform) {return platform === 'douyin' ? env.MARKETING_DOUYIN_ACCOUNT : platform === 'xiaohongshu' ? env.MARKETING_XIAOHONGSHU_ACCOUNT : undefined;}
  return {
    async channels(): Promise<MarketingChannel[]> {
      let wechatReady = false;
      if(wechat.configured) {try {await wechat.check(); wechatReady = true;} catch {wechatReady = false;}}
      let accounts: z.infer<typeof integrationSchema> = []; let connectionError = '';
      try {accounts = await integrations();} catch {connectionError = '发布服务连接失败，请检查配置或授权。';}
      return marketingPlatforms.map(platform => {
        if(platform === 'wechat') return {platform, name: platformNames[platform], ready: wechatReady, message: wechatReady ? '凭据验证通过；还需账号具备文章发布接口权限' : wechat.configured ? '公众号验证失败，请检查凭据和 IP 白名单' : '待配置公众号 AppID / AppSecret 与接口权限'};
        const match = accounts.find(item => !item.disabled && aliases[item.identifier] === platform);
        const domestic = Boolean(env.MARKETING_SAU_BIN && account(platform));
        return {platform, name: match ? `${platformNames[platform]} · ${match.name}` : platformNames[platform], ready: Boolean(match) || domestic, integrationId: match?.id,
          message: match ? '已连接，可提交发布' : domestic ? '已配置本机发布器，发送前检查登录状态' : ['xiaohongshu','douyin'].includes(platform) ? '待配置国内发布器并登录账号；可先导出素材' : connectionError || '待连接 Postiz 并授权账号'};
      });
    },
    async send(input: {platform: MarketingPlatform; title: string; text: string; video: string; cover: Buffer; visibility: 'public' | 'private'}) {
      if(input.platform === 'wechat') return wechat.send(input.title, input.text, input.cover);
      if(input.visibility === 'private' && !['youtube','tiktok'].includes(input.platform)) throw new Error('仅自己可见只适用于 YouTube / TikTok，请单独选择这些平台。');
      const domesticAccount = account(input.platform);
      if (domesticAccount && env.MARKETING_SAU_BIN) {
        if (input.visibility !== 'public') throw new Error('国内发布器仅支持公开发布，请调整可见性。');
        const command = input.platform === 'douyin' ? 'douyin' : 'xiaohongshu';
        const run = (args: string[]) => new Promise<void>((resolve, reject) => {
          const child = spawn(env.MARKETING_SAU_BIN!, args, {cwd: env.MARKETING_SAU_CWD, shell: false, windowsHide: true, stdio: 'ignore'});
          const timeout = setTimeout(() => child.kill(), 180_000);
          child.once('error', () => {clearTimeout(timeout); reject(new Error('无法启动国内发布器。'));});
          child.once('close', code => {clearTimeout(timeout); if(code === 0) resolve(); else reject(new Error('发布器未完成，请检查平台登录与任务记录。'));});
        });
        await run([command, 'check', '--account', domesticAccount]);
        await run([command, 'upload-video', '--account', domesticAccount, '--file', input.video, '--title', input.title.slice(0, 20), '--desc', input.text]);
        return {id: '', message: '发布器执行结束，请到平台确认最终结果。'};
      }
      const list = await integrations();
      const target = list.find(item => !item.disabled && aliases[item.identifier] === input.platform);
      if (!target) throw new Error('此平台尚未授权，未提交发布。');
      const bytes = await readFile(input.video);
      const form = new FormData(); form.set('file', new Blob([new Uint8Array(bytes)], {type: 'video/mp4'}), 'showki-product.mp4');
      const uploaded = z.object({id: z.string().min(1), path: z.string().url()}).parse(await postiz('/upload', form));
      const settings: Record<string, unknown> = {__type: target.identifier};
      if (input.platform === 'youtube') Object.assign(settings, {title: input.title.slice(0, 100), type: input.visibility});
      if (input.platform === 'instagram') settings.post_type = 'post';
      if (input.platform === 'tiktok') Object.assign(settings, {title: input.title, privacy_level: input.visibility === 'private' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE', duet: false, stitch: false, comment: true, autoAddMusic: 'no', brand_content_toggle: false, brand_organic_toggle: true, content_posting_method: 'DIRECT_POST', video_made_with_ai: false});
      const result = z.array(z.object({postId: z.string().min(1), integration: z.string()})).parse(await postiz('/posts', {type: 'now', date: new Date().toISOString(), shortLink: false, tags: [], posts: [{integration: {id: target.id}, value: [{content: input.text, image: [uploaded]}], settings}]}));
      const receipt = result.find(item => item.integration === target.id);
      if (!receipt) throw new Error('未收到有效发布回执，请在 Postiz 核查，勿重复发送。');
      return {id: receipt.postId, message: 'Postiz 已接受任务；最终结果请在 Postiz 或平台核对。'};
    }
  };
}
