import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import {marketingManualSchema, marketingBriefSchema, marketingCopySchema, marketingPlatforms, marketingPublishSchema, platformNames, type MarketingBrief, type MarketingCampaign, type MarketingCopy} from '../../src/lib/marketing-contracts';
import {getMedia} from '../content-admin/database';
import {readDraftMedia} from '../content-admin/media';
import {createMarketingPublishers} from './publishers';
import {renderMarketingVideo, videoAvailable} from './video';

export class MarketingError extends Error {constructor(readonly status: number, message: string) {super(message);}}
export function templateCopy(brief: MarketingBrief): MarketingCopy {
  const zh = brief.language === 'zh';
  const contact = zh ? '欢迎联系 SHOWKI BIOTECH，沟通产品样品与定制需求。' : 'Contact SHOWKI BIOTECH to discuss samples and customization.';
  const intros = zh ? {wechat: '产品资料', xiaohongshu: '产品笔记', douyin: '本期产品介绍', linkedin: '产品开发简报', facebook: '产品动态', instagram: '本期产品', youtube: '视频内容简介', tiktok: '产品看点'} : {wechat: 'Product notes', xiaohongshu: 'Product journal', douyin: 'Product introduction', linkedin: 'Product development brief', facebook: 'Product update', instagram: 'Product spotlight', youtube: 'In this video', tiktok: 'Product highlights'};
  return {title: brief.topic.slice(0, 80), posts: marketingPlatforms.map(platform => ({platform, text: [brief.topic, `${intros[platform]}\n${brief.facts}`, contact, ['douyin', 'tiktok', 'instagram', 'xiaohongshu'].includes(platform) ? '#SHOWKI #Hydrogel #Skincare' : 'https://showkibiotech.com'].join('\n\n')})), scenes: [brief.topic.slice(0, 90), brief.facts.slice(0, 90), contact]};
}
export function createMarketingService(database: DatabaseSync, dataDir: string, dependencies: {publishers?: ReturnType<typeof createMarketingPublishers>; render?: typeof renderMarketingVideo; videoAvailable?: () => boolean} = {}) {
  database.exec('CREATE TABLE IF NOT EXISTS marketing_campaigns (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
  const publishers = dependencies.publishers ?? createMarketingPublishers();
  const render = dependencies.render ?? renderMarketingVideo;
  const available = dependencies.videoAvailable ?? videoAvailable;
  const save = (campaign: MarketingCampaign) => {database.prepare('INSERT INTO marketing_campaigns(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(campaign.id, JSON.stringify(campaign)); return campaign;};
  const list = (): MarketingCampaign[] => (database.prepare('SELECT payload FROM marketing_campaigns ORDER BY rowid DESC').all() as {payload: string}[]).map(row => JSON.parse(row.payload));
  function get(id: string): MarketingCampaign {
    if (!z.uuid().safeParse(id).success) throw new MarketingError(404, '营销内容不存在。');
    const row = database.prepare('SELECT payload FROM marketing_campaigns WHERE id=?').get(id) as {payload: string} | undefined;
    if(!row) throw new MarketingError(404, '营销内容不存在。');
    return JSON.parse(row.payload);
  }
  for (const campaign of list()) {
    let interrupted = false;
    if(campaign.videoState === 'rendering') {campaign.videoState = 'failed'; campaign.videoError = '服务重启中断了合成，请重试。'; interrupted = true;}
    for (const receipt of campaign.receipts) if(receipt.state === 'submitting') {receipt.state = 'unknown'; receipt.message = '服务中断，发送结果未知；请到平台核查。'; interrupted = true;}
    if(interrupted) save(campaign);
  }
  const directory = (id: string) => path.join(dataDir, 'marketing', get(id).id);
  let activeJob: Promise<void> | undefined; let stopped = false;
  function versioned(id: string, version: number) {const campaign = get(id); if(campaign.version !== version) throw new MarketingError(409, '内容已更新，请重新载入。'); if(campaign.videoState === 'rendering' || campaign.receipts.some(r => r.state === 'submitting')) throw new MarketingError(409, '任务正在执行，请稍候。'); return campaign;}
  return {
    list, get,
    createManual(input: unknown) {
      const data=marketingManualSchema.parse(input),existing=list().find(item=>item.sourceRequestId===data.requestId);
      if(existing)return existing;
      if(!getMedia(database,data.imageMediaId)?.mime_type.startsWith('image/'))throw new MarketingError(422,'请上传或选择一张图片。');
      const now=new Date().toISOString();
      return save({id:randomUUID(),sourceRequestId:data.requestId,version:1,brief:{topic:data.title,facts:data.text.slice(0,3500),language:'zh',imageMediaId:data.imageMediaId,mode:'manual'},copy:{title:data.title,posts:marketingPlatforms.map(platform=>({platform,text:data.text})),scenes:[data.title,data.text.slice(0,90),'SHOWKI BIOTECH']},createdAt:now,updatedAt:now,videoState:'idle',receipts:[]});
    },
    createFromAi(input: unknown, generated: unknown) {
      const brief = marketingBriefSchema.parse(input), copy = marketingCopySchema.parse(generated);
      if (!getMedia(database, brief.imageMediaId)?.mime_type.startsWith('image/')) throw new MarketingError(422, '生成图片不存在');
      const now = new Date().toISOString();
      return save({id: randomUUID(), version: 1, brief, copy, createdAt: now, updatedAt: now, videoState: 'idle', receipts: []});
    },
    async status() {return {aiConfigured: false, videoConfigured: available(), channels: await publishers.channels()};},
    create(input: unknown) {
      const brief = marketingBriefSchema.parse(input);
      if(brief.mode !== 'template') throw new MarketingError(400, '目前采用免费模板，不调用模型服务。');
      const image = getMedia(database, brief.imageMediaId);
      if(!image?.mime_type.startsWith('image/')) throw new MarketingError(400, '请选择有效的产品图片。');
      const now = new Date().toISOString();
      return save({id: randomUUID(), version: 1, brief, copy: templateCopy(brief), createdAt: now, updatedAt: now, videoState: 'idle', receipts: []});
    },
    update(id: string, input: unknown) {
      const data = z.strictObject({version: z.number().int().positive(), copy: marketingCopySchema}).parse(input);
      const campaign = versioned(id, data.version);
      if(campaign.receipts.length) throw new MarketingError(409, '已有发送记录，请新建营销内容以保留原始记录。');
      return save({...campaign, copy: data.copy, videoState: 'idle', version: campaign.version + 1, updatedAt: new Date().toISOString()});
    },
    render(id: string, version: number) {
      const campaign = versioned(id, version);
      if(activeJob) throw new MarketingError(409, '已有营销任务正在执行，请稍候。');
      if(!available()) throw new MarketingError(503, '尚未安装 FFmpeg，暂不能合成视频。');
      campaign.videoState = 'rendering'; campaign.videoError = undefined; save(campaign);
      activeJob = (async () => {
        try {
          const image = getMedia(database, campaign.brief.imageMediaId);
          if(!image) throw new Error('图片已不存在，请重新选择。');
          await render(directory(id), await readDraftMedia(dataDir, image), campaign.copy.scenes);
          if(!stopped) save({...get(id), videoState: 'ready'});
        } catch (cause) {if(!stopped) save({...get(id), videoState: 'failed', videoError: cause instanceof Error ? cause.message : '合成失败，请重试。'});}
        finally {activeJob = undefined;}
      })();
      return campaign;
    },
    async video(id: string) {if(get(id).videoState !== 'ready') throw new MarketingError(409, '视频尚未生成完成。'); return readFile(path.join(directory(id), 'video.mp4'));},
    async publish(id: string, input: unknown) {
      const request = marketingPublishSchema.parse(input); let campaign = versioned(id, request.version);
      if(activeJob) throw new MarketingError(409, '已有营销任务正在执行，请稍候。');
      if(campaign.videoState !== 'ready') throw new MarketingError(409, '请先完成视频合成。');
      const targets = [...new Set(request.platforms)]; const channels = await publishers.channels();
      if(request.visibility === 'private' && targets.some(platform => !['youtube','tiktok'].includes(platform))) throw new MarketingError(400, '仅自己可见只适用于 YouTube / TikTok，请单独选择这些平台。');
      const media = getMedia(database, campaign.brief.imageMediaId);
      if(!media) throw new MarketingError(400, '产品图片不存在，请重新选择。');
      const cover = await readDraftMedia(dataDir, media);
      // Awaited preflight may overlap another request; recheck before recording any sends.
      if(activeJob) throw new MarketingError(409, '已有营销任务正在执行，请稍候。');
      campaign = versioned(id, request.version);
      for (const platform of targets) {
        if(!channels.find(item => item.platform === platform)?.ready) throw new MarketingError(409, `${platformNames[platform]} 尚未连接，未发送任何内容。`);
        if(campaign.receipts.some(r => r.platform === platform)) throw new MarketingError(409, `${platformNames[platform]} 已有发送记录，请先核查，避免重复发送。`);
      }
      campaign.receipts.push(...targets.map(platform => ({platform, state: 'submitting' as const, message: '正在提交…', at: new Date().toISOString()}))); save(campaign);
      activeJob = (async () => {
        for(const platform of targets) {
          let result;
          try {const receipt = await publishers.send({platform, title: campaign.copy.title, text: campaign.copy.posts.find(item => item.platform === platform)!.text, video: path.join(directory(id), 'video.mp4'), cover, visibility: request.visibility}); result = {platform, state: 'submitted' as const, ...receipt, at: new Date().toISOString()};}
          catch {result = {platform, state: 'unknown' as const, message: '未取得完成回执，请到发布服务或平台核查后再处理。', at: new Date().toISOString()};}
          if(stopped) return;
          const latest = get(id); latest.receipts = latest.receipts.map(r => r.platform === platform ? result : r); save(latest);
        }
      })().finally(() => {activeJob = undefined;});
      return campaign;
    },
    stop() {stopped = true;},
    async waitForIdle() {await activeJob;}
  };
}
