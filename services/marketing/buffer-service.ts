import {randomBytes, randomUUID, createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import {bufferDraftSchema, type BufferConnection, type BufferSchedule} from '../../src/lib/buffer-contracts';
import {getMedia} from '../content-admin/database';
import {readDraftMedia} from '../content-admin/media';
import {MarketingError, type createMarketingService} from './service';
import {BufferApiError, createBufferClient, type BufferClient, type BufferPost} from './buffer-client';

type Stored = BufferSchedule & {assetToken: string; mime: string};
type Config = {key: string; connection: BufferConnection};
const empty = ():BufferConnection => ({connected:false,organizations:[],organizationId:'',channels:[]});
const activeStates = ['scheduled','sending','approval','manual'];
export function createBufferService(db:DatabaseSync, dataDir:string, publicOrigin:string, marketing:ReturnType<typeof createMarketingService>, dependencies:{client?:(key:string)=>BufferClient; now?:()=>number; timer?:boolean}={}) {
  const now=dependencies.now??Date.now, iso=()=>new Date(now()).toISOString();
  const directory=path.join(dataDir,'buffer-private');mkdirSync(directory,{recursive:true,mode:0o700});
  const configPath=path.join(directory,'connection.json');
  let config:Config|undefined=existsSync(configPath)?JSON.parse(readFileSync(configPath,'utf8')):undefined;
  const client=()=>{if(!config)throw new MarketingError(409,'请先连接 Buffer。');return (dependencies.client??createBufferClient)(config.key);};
  db.exec('CREATE TABLE IF NOT EXISTS buffer_schedules (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, payload TEXT NOT NULL)');
  const save=(job:Stored)=>{job.updatedAt=iso();db.prepare('INSERT INTO buffer_schedules(id,request_id,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(job.id,job.requestId,JSON.stringify(job));return job;};
  const all=():Stored[]=>(db.prepare('SELECT payload FROM buffer_schedules ORDER BY rowid DESC').all() as {payload:string}[]).map(row=>JSON.parse(row.payload));
  const dto=(job:Stored):BufferSchedule=>{const result={...job} as Partial<Stored>;delete result.assetToken;delete result.mime;return result as BufferSchedule;};
  const get=(id:string):Stored=>{if(!z.uuid().safeParse(id).success)throw new MarketingError(404,'排期不存在。');const row=db.prepare('SELECT payload FROM buffer_schedules WHERE id=?').get(id) as {payload:string}|undefined;if(!row)throw new MarketingError(404,'排期不存在。');return JSON.parse(row.payload);};
  const jobs=new Map<string,Promise<void>>(),checking=new Set<string>();let stopped=false;
  async function guard<T>(id:string,action:()=>Promise<T>) {if(checking.has(id)||jobs.has(id))throw new MarketingError(409,'排期正在处理。');checking.add(id);try{return await action();}finally{checking.delete(id);}}
  for(const job of all())if(['submitting','cancelling'].includes(job.state)){job.state='unknown';job.retryable=false;job.message='服务重启，操作结果待核查，请先查看 Buffer。';save(job);}
  function persistConfig(next:Config) {writeFileSync(`${configPath}.new`,JSON.stringify(next),{mode:0o600});renameSync(`${configPath}.new`,configPath);config=next;}
  function launch(id:string,action:()=>Promise<void>) {if(jobs.has(id))throw new MarketingError(409,'排期正在处理。');const task=action().finally(()=>jobs.delete(id));jobs.set(id,task);}
  function applyPost(job:Stored,post:BufferPost) {
    if(post.channelId!==job.channelId)throw new BufferApiError('Buffer 回执账号不匹配，请人工核查。',true);
    job.remoteId=post.id;job.retryable=false;job.sentAt=post.sentAt??undefined;
    job.externalLink=post.externalLink?.startsWith('https://')?post.externalLink:undefined;
    if(post.dueAt)job.dueAt=post.dueAt;
    job.state=post.status==='sent'?'sent':post.status==='error'?'failed':post.status==='needs_approval'||post.status==='draft'?'approval':post.schedulingType!=='automatic'?'manual':post.status;
    job.message=job.state==='failed'?'Buffer 发布失败，请在 Buffer 查看原因并处理。':job.state==='manual'?'此账号需要在 Buffer 手机端确认发布。':job.state==='approval'?'请在 Buffer 完成审核后发布。':job.state==='sent'?'平台已发布。':'Buffer 已接收排期。';
    const delay=Math.min(360,Math.max(5,5*2**Math.min(job.checks,7)))*60_000;
    job.nextCheckAt=activeStates.includes(job.state)&&job.checks<12?new Date(Math.max(now()+delay,Date.parse(job.dueAt??'')||0)).toISOString():undefined;
    if(activeStates.includes(job.state)&&job.checks>=12)job.message+=' 自动核查已暂停，请点击同步发布状态。';
  }
  async function sync(id:string) {
    const job=get(id);if(!job.remoteId)throw new MarketingError(409,'没有 Buffer 回执编号，请直接在 Buffer 核查。');
    if(!config || job.organizationId!==config.connection.organizationId)throw new MarketingError(409,'请连接此排期所属的 Buffer 工作区。');
    const remote=await client().get(job.remoteId);if(stopped)return;
    job.checks++;
    if(remote)applyPost(job,remote);
    else {job.state='cancelled';job.message='Buffer 中已无此排期。';job.nextCheckAt=undefined;}
    save(job);
  }
  const timer=dependencies.timer===false?undefined:setInterval(()=>{
    if(!config || stopped)return;
    const next=all().find(job=>job.remoteId&&activeStates.includes(job.state)&&job.organizationId===config?.connection.organizationId&&Date.parse(job.nextCheckAt??'')<=now()&&!jobs.has(job.id)&&!checking.has(job.id));
    if(next)launch(next.id,async()=>{try{await sync(next.id);}catch{if(!stopped){const job=get(next.id);job.nextCheckAt=new Date(now()+6*3600_000).toISOString();job.message='状态暂未同步，请检查 Buffer 连接或额度。';save(job);}}});
  },60_000);timer?.unref();
  return {
    status:()=>config?.connection??empty(), list:()=>all().map(dto), get:(id:string)=>dto(get(id)),
    async connect(input:unknown) {
      const {key}=z.strictObject({key:z.string().trim().min(10).max(2048).regex(/^[^\s]+$/)}).parse(input);
      if(jobs.size||checking.size)throw new MarketingError(409,'请等待正在处理的排期结束。');
      const api=(dependencies.client??createBufferClient)(key),organizations=await api.organizations();
      if(!organizations.length)throw new MarketingError(422,'Buffer 账号没有可用工作区。');
      const organizationId=organizations.some(o=>o.id===config?.connection.organizationId)?config!.connection.organizationId:organizations[0].id;
      const channels=await api.channels(organizationId);
      persistConfig({key,connection:{connected:true,organizations,organizationId,channels,checkedAt:iso()}});
      return config!.connection;
    },
    async refresh(organizationId?:string) {
      if(jobs.size||checking.size)throw new MarketingError(409,'请等待正在处理的排期结束。');
      const api=client();const organizations=await api.organizations();
      const selected=organizationId??config!.connection.organizationId;
      if(!organizations.some(o=>o.id===selected))throw new MarketingError(422,'工作区无权访问。');
      const channels=await api.channels(selected);
      persistConfig({key:config!.key,connection:{connected:true,organizations,organizationId:selected,channels,checkedAt:iso()}});return config!.connection;
    },
    async draft(input:unknown,actor:string) {
      const request=bufferDraftSchema.parse(input);
      const duplicate=all().find(job=>job.requestId===request.requestId);if(duplicate)return dto(duplicate);
      const campaign=marketing.get(request.campaignId);
      if(campaign.version!==request.version)throw new MarketingError(409,'文案已更新，请刷新后再保存排期。');
      if(request.media==='image'&&['youtube','tiktok'].includes(request.platform))throw new MarketingError(422,'YouTube / TikTok 排期请选择视频。');
      if(request.mode==='customScheduled'&&(!request.dueAt||Date.parse(request.dueAt)<now()+300_000||Date.parse(request.dueAt)>now()+90*86400_000))throw new MarketingError(422,'请选择 5 分钟后至 90 天内的发布时间。');
      const image=getMedia(db,campaign.brief.imageMediaId);if(!image)throw new MarketingError(422,'产品图片不存在。');
      const bytes=request.media==='video'?await marketing.video(campaign.id):await readDraftMedia(dataDir,image);
      const id=randomUUID();await writeFile(path.join(directory,`${id}.media`),bytes,{mode:0o600});
      const job:Stored={...request,id,title:campaign.copy.title,text:campaign.copy.posts.find(p=>p.platform===request.platform)!.text,createdAt:iso(),updatedAt:iso(),actor,state:'draft',message:'草稿已保存，尚未提交 Buffer。',checks:0,retryable:false,assetToken:randomBytes(32).toString('hex'),mime:request.media==='video'?'video/mp4':image.mime_type};
      return dto(save(job));
    },
    async submit(id:string,input:unknown) {
      return guard(id,async()=>{
      const {channelId}=z.strictObject({channelId:z.string().min(1).max(256),confirmed:z.literal(true)}).parse(input);
      let job=get(id);if(!['draft','failed'].includes(job.state)||(job.state==='failed'&&!job.retryable))throw new MarketingError(409,'此排期已提交或结果待核查，不能重复提交。');
      const api=client(),organizationId=config!.connection.organizationId;
      const channels=await api.channels(organizationId),channel=channels.find(c=>c.id===channelId&&c.service===job.platform);
      if(!channel||channel.isDisconnected||channel.isLocked||channel.isQueuePaused)throw new MarketingError(409,'目标账号未连接、被锁定或队列已暂停，请先在 Buffer 处理。');
      job=get(id);if(jobs.has(id)||!['draft','failed'].includes(job.state))throw new MarketingError(409,'排期正在处理或已提交。');
      if(job.mode==='customScheduled'&&Date.parse(job.dueAt??'')<now()+300_000)throw new MarketingError(422,'发布时间已过近，请取消草稿并重新设置时间。');
      if(!publicOrigin.startsWith('https://')&&!dependencies.client)throw new MarketingError(422,'媒体发布需要可公开访问的 HTTPS 网站。');
      const url=`${publicOrigin}/api/marketing/buffer-media/${job.id}/${job.assetToken}`;
      const metadata:Record<string,unknown>={};
      if(job.platform==='youtube')metadata.youtube={title:job.title,categoryId:'26',privacy:'public',madeForKids:false,isAiGenerated:job.aiGenerated};
      if(job.platform==='instagram')metadata.instagram={type:job.media==='video'?'reel':'post',shouldShareToFeed:true,isAiGenerated:job.aiGenerated};
      if(job.platform==='tiktok')metadata.tiktok={isAiGenerated:job.aiGenerated};
      const payload={channelId,text:job.text,schedulingType:'automatic',mode:job.mode,...(job.mode==='customScheduled'?{dueAt:job.dueAt}:{}),assets:[{[job.media]:{url}}],needsApproval:false,aiAssisted:job.aiGenerated,...(Object.keys(metadata).length?{metadata}:{})};
      job.channelId=channelId;job.channelName=channel.name;job.organizationId=organizationId;job.state='submitting';job.retryable=false;job.message='正在提交 Buffer。';save(job);
      launch(id,async()=>{try{const remote=await api.create(payload);if(!stopped){applyPost(job,remote);save(job);}}catch(error){if(!stopped){job.state=error instanceof BufferApiError&&!error.uncertain?'failed':'unknown';job.retryable=job.state==='failed';job.message=error instanceof BufferApiError?error.message:'Buffer 回执未确认，请在 Buffer 核查。';save(job);}}});
      return dto(job);
      });
    },
    async sync(id:string) {return guard(id,async()=>{await sync(id);return dto(get(id));});},
    async cancel(id:string) {
      return guard(id,async()=>{
      const job=get(id);if(jobs.has(id))throw new MarketingError(409,'排期正在处理。');
      if(job.state==='draft'||(job.state==='failed'&&job.retryable)){job.state='cancelled';job.message='草稿已取消。';return dto(save(job));}
      if(!job.remoteId||['sent','cancelled','sending'].includes(job.state))throw new MarketingError(409,'此状态不能取消，请先在 Buffer 核查。');
      if(job.organizationId!==config?.connection.organizationId)throw new MarketingError(409,'请连接此排期所属的 Buffer 工作区。');
      const api=client(),remote=await api.get(job.remoteId);
      if(!remote){job.state='cancelled';job.message='Buffer 中已无此排期。';return dto(save(job));}
      if(['sent','sending'].includes(remote.status)||!remote.allowedActions?.includes('deletePost')){applyPost(job,remote);save(job);throw new MarketingError(409,'此排期已经发布、正在发送或不允许取消。');}
      job.state='cancelling';job.message='正在取消 Buffer 排期。';save(job);
      launch(id,async()=>{try{await api.remove(job.remoteId!);if(!stopped){job.state='cancelled';job.message='Buffer 排期已取消。';job.nextCheckAt=undefined;save(job);}}catch(error){if(!stopped){job.state='unknown';job.message=error instanceof BufferApiError?error.message:'取消结果待核查。';save(job);}}});return dto(job);
      });
    },
    async asset(id:string,token:string) {
      const job=get(id);
      if(!/^[a-f0-9]{64}$/.test(token)||createHash('sha256').update(token).digest('hex')!==createHash('sha256').update(job.assetToken).digest('hex')||job.state==='cancelled'||(['sent','failed'].includes(job.state)&&now()-Date.parse(job.updatedAt)>7*86400_000))throw new MarketingError(404,'媒体不存在或已过期。');
      return {bytes:await readFile(path.join(directory,`${job.id}.media`)),mime:job.mime};
    },
    stop(){stopped=true;clearInterval(timer);},async waitForIdle(){await Promise.all(jobs.values());},
  };
}
