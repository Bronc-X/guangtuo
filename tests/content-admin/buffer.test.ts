import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {afterEach, expect, it, vi} from 'vitest';
import {openContentAdminDatabase} from '../../services/content-admin/database';
import {createMarketingService} from '../../services/marketing/service';
import {createBufferService} from '../../services/marketing/buffer-service';
import {BufferApiError, createBufferClient, type BufferPost} from '../../services/marketing/buffer-client';
const cleanups:Array<()=>Promise<void>>=[];
afterEach(async()=>{while(cleanups.length)await cleanups.pop()!();});
async function fixture() {
  const dir=await mkdtemp(path.join(tmpdir(),'showki-buffer-')),db=openContentAdminDatabase(dir),imageId=randomUUID();
  await mkdir(path.join(dir,'draft-media'));await writeFile(path.join(dir,'draft-media','test.png'),'original-image');
  db.prepare('INSERT INTO media_assets(id,original_name,storage_key,mime_type,size_bytes,width,height,created_at) VALUES(?,?,?,?,?,?,?,?)').run(imageId,'test.png','test.png','image/png',14,1,1,new Date().toISOString());
  const marketing=createMarketingService(db,dir);const campaign=marketing.create({topic:'水凝胶眼膜',facts:'产品支持定制',language:'zh',mode:'template',imageMediaId:imageId});
  const now=Date.parse('2026-09-22T00:00:00Z');
  let remote:BufferPost|null={id:'remote-1',channelId:'linkedin-1',status:'scheduled',dueAt:'2026-09-23T01:00:00Z',schedulingType:'automatic',allowedActions:['deletePost']};
  const api={organizations:vi.fn(async()=>[{id:'org-1',name:'SHOWKI'}]),channels:vi.fn(async()=>[{id:'linkedin-1',name:'Company',service:'linkedin',timezone:'Asia/Shanghai',isDisconnected:false,isLocked:false,isQueuePaused:false}]),create:vi.fn(async()=>remote!),get:vi.fn(async()=>remote),remove:vi.fn(async()=>{remote=null;})};
  const options={client:()=>api,now:()=>now,timer:false};let service=createBufferService(db,dir,'https://site.example',marketing,options);
  cleanups.push(async()=>{await service.waitForIdle();service.stop();marketing.stop();db.close();await rm(dir,{recursive:true,force:true});});
  const input={requestId:randomUUID(),campaignId:campaign.id,version:1,platform:'linkedin',media:'image',mode:'customScheduled',dueAt:'2026-09-23T01:00:00Z',aiGenerated:true};
  return {service,api,input,dir,db,campaign,marketing,remote:(value:BufferPost)=>{remote=value;},restart:async()=>{await service.waitForIdle();service.stop();service=createBufferService(db,dir,'https://site.example',marketing,options);return service;}};
}
it('saves a durable idempotent draft without an account and freezes copy and media',async()=>{
  const f=await fixture(),draft=await f.service.draft(f.input,'admin');expect(f.service.status().connected).toBe(false);
  expect(await f.service.draft(f.input,'admin')).toEqual(draft);expect(f.service.list()).toHaveLength(1);
  await writeFile(path.join(f.dir,'draft-media','test.png'),'replacement');f.marketing.update(f.campaign.id,{version:1,copy:{...f.campaign.copy,title:'Changed'}});
  const recovered=await f.restart();expect(recovered.get(draft.id).title).toBe('水凝胶眼膜');
  const stored=JSON.parse((f.db.prepare('SELECT payload FROM buffer_schedules').get() as {payload:string}).payload);
  expect((await recovered.asset(draft.id,stored.assetToken)).bytes.toString()).toBe('original-image');
  await expect(recovered.asset(draft.id,'0'.repeat(64))).rejects.toThrow('不存在');
  expect(JSON.stringify(recovered.list())).not.toContain(stored.assetToken);
  await expect(recovered.submit(draft.id,{channelId:'linkedin-1',confirmed:true})).rejects.toThrow('连接');
});
it('validates connection before saving and never returns the credential',async()=>{
  const f=await fixture();f.api.organizations.mockRejectedValueOnce(new BufferApiError('invalid'));
  await expect(f.service.connect({key:'test-secret-token'})).rejects.toThrow('invalid');expect(f.service.status().connected).toBe(false);
  await f.service.connect({key:'test-secret-token'});expect(JSON.stringify(f.service.status())).not.toContain('test-secret-token');expect((await f.restart()).status().connected).toBe(true);
  expect(await readFile(path.join(f.dir,'buffer-private','connection.json'),'utf8')).toContain('test-secret-token');
});
it('rejects stale content, overdue schedules, non-video YouTube and disconnected channels',async()=>{
  const f=await fixture();await expect(f.service.draft({...f.input,version:2},'a')).rejects.toThrow('已更新');
  await expect(f.service.draft({...f.input,dueAt:'2026-09-21T00:00:00Z'},'a')).rejects.toThrow('5 分钟');
  await expect(f.service.draft({...f.input,platform:'youtube'},'a')).rejects.toThrow('视频');
  await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');
  f.api.channels.mockResolvedValueOnce([{...(await f.api.channels())[0],isQueuePaused:true}]);
  await expect(f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true})).rejects.toThrow('队列');expect(f.api.create).not.toHaveBeenCalled();
});
it('submits only once, supplies public snapshot media, and reconciles a real publication',async()=>{
  const f=await fixture();await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');
  await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();
  expect(f.service.get(draft.id)).toMatchObject({state:'scheduled',remoteId:'remote-1'});
  const payload=(f.api.create.mock.calls as unknown[][])[0][0] as {assets:[{image:{url:string}}];dueAt:string;schedulingType:string};
  expect(payload.dueAt).toBe(f.input.dueAt);expect(payload.schedulingType).toBe('automatic');expect(payload.assets[0].image.url).toMatch(/^https:\/\/site.example\/api\/marketing\/buffer-media\//);
  await expect(f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true})).rejects.toThrow('不能重复');expect(f.api.create).toHaveBeenCalledTimes(1);
  f.remote({id:'remote-1',channelId:'linkedin-1',status:'sent',schedulingType:'automatic',sentAt:'2026-09-23T01:00:00Z',externalLink:'https://linkedin.com/test'});
  expect(await f.service.sync(draft.id)).toMatchObject({state:'sent',externalLink:'https://linkedin.com/test'});
  await expect(f.service.cancel(draft.id)).rejects.toThrow('不能取消');expect(f.api.remove).not.toHaveBeenCalled();
});
it('marks unknown outcomes and does not replay after a restart',async()=>{
  const f=await fixture();await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');f.api.create.mockRejectedValueOnce(new BufferApiError('timeout',true));
  await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();expect(f.service.get(draft.id)).toMatchObject({state:'unknown',retryable:false});
  const restarted=await f.restart();await expect(restarted.submit(draft.id,{channelId:'linkedin-1',confirmed:true})).rejects.toThrow('不能重复');expect(f.api.create).toHaveBeenCalledTimes(1);
});
it('permits an explicit retry only after a definitive rejection',async()=>{
  const f=await fixture();await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');f.api.create.mockRejectedValueOnce(new BufferApiError('quota'));
  await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();expect(f.service.get(draft.id)).toMatchObject({state:'failed',retryable:true});
  await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();expect(f.service.get(draft.id).state).toBe('scheduled');
});
it('cancels unsent remote schedules and revokes the media URL',async()=>{
  const f=await fixture();await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();
  await f.service.cancel(draft.id);await f.service.waitForIdle();expect(f.api.remove).toHaveBeenCalledWith('remote-1');expect(f.service.get(draft.id).state).toBe('cancelled');
  const stored=JSON.parse((f.db.prepare('SELECT payload FROM buffer_schedules').get() as {payload:string}).payload);await expect(f.service.asset(draft.id,stored.assetToken)).rejects.toThrow('不存在');
});
it('does not label notification publishing or approval as automatic scheduled delivery',async()=>{
  const f=await fixture();await f.service.connect({key:'test-secret-token'});const draft=await f.service.draft(f.input,'a');f.remote({id:'remote-1',channelId:'linkedin-1',status:'scheduled',schedulingType:'notification'});
  await f.service.submit(draft.id,{channelId:'linkedin-1',confirmed:true});await f.service.waitForIdle();expect(f.service.get(draft.id).state).toBe('manual');
  f.remote({id:'remote-1',channelId:'linkedin-1',status:'needs_approval',schedulingType:'automatic'});expect((await f.service.sync(draft.id)).state).toBe('approval');
});
it('uses the official GraphQL endpoint and redacts provider errors',async()=>{
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({data:{createPost:{message:'unsafe-secret-provider-message'}}}),{status:200}));
  const client=createBufferClient('secret',fetcher as typeof fetch);await expect(client.create({})).rejects.toMatchObject({uncertain:false});
  expect((fetcher.mock.calls as unknown[][])[0][0]).toBe('https://api.buffer.com');
  const fail=createBufferClient('secret',vi.fn(async()=>new Response('down',{status:503})) as typeof fetch);await expect(fail.create({})).rejects.toMatchObject({uncertain:true});
  const partial=createBufferClient('secret',vi.fn(async()=>Response.json({errors:[{message:'secret'}],data:{}})) as typeof fetch);await expect(partial.create({})).rejects.toMatchObject({uncertain:true});
});
