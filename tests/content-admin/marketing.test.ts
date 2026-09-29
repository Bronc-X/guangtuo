import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {openContentAdminDatabase} from '../../services/content-admin/database';
import {createMarketingService, templateCopy} from '../../services/marketing/service';
import {createMarketingPublishers} from '../../services/marketing/publishers';
import {parseTrendFeed} from '../../services/marketing/trends';
import {captionLines} from '../../services/marketing/video';
import type {MarketingBrief} from '../../src/lib/marketing-contracts';
const cleanups: Array<() => Promise<void>> = [];
afterEach(async()=>{while(cleanups.length) await cleanups.pop()!();});
async function fixture(publishers = createMarketingPublishers({})) {
  const dir = await mkdtemp(path.join(tmpdir(),'showki-marketing-')); const db = openContentAdminDatabase(dir);
  const id=randomUUID(); await mkdir(path.join(dir,'draft-media')); await writeFile(path.join(dir,'draft-media','test.png'),'fixture');
  db.prepare('INSERT INTO media_assets(id,original_name,storage_key,mime_type,size_bytes,width,height,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'test.png','test.png','image/png',7,1,1,new Date().toISOString());
  const service = createMarketingService(db,dir,{publishers,videoAvailable:()=>true,render:async (folder)=>{await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'video.mp4'),'test-video');}});
  cleanups.push(async()=>{await service.waitForIdle();service.stop();db.close();await rm(dir,{recursive:true,force:true});});
  const brief:MarketingBrief = {topic:'产品主题',facts:'第一行\n\n第三行',language:'zh',imageMediaId:id,mode:'template'};
  return {service,brief};
}
describe('marketing workspace',()=>{
  it('creates exact manual copy with media, preserves newlines and deduplicates a retried save',async()=>{
    const {service,brief}=await fixture();const input={requestId:randomUUID(),title:'新品发布计划',text:'第一行文案\n\n第三行内容',imageMediaId:brief.imageMediaId};
    const campaign=service.createManual(input);expect(campaign.brief.mode).toBe('manual');expect(campaign.copy.posts.every(post=>post.text===input.text)).toBe(true);
    expect(service.createManual(input).id).toBe(campaign.id);expect(service.list()).toHaveLength(1);
    expect(()=>service.createManual({...input,requestId:randomUUID(),imageMediaId:randomUUID()})).toThrow('图片');
    service.render(campaign.id,1);await service.waitForIdle();expect(service.get(campaign.id).videoState).toBe('ready');
  });
  it('generates all eight editable templates from supplied facts without an AI provider',async()=>{const {service,brief}=await fixture();const c=service.create(brief);expect(c.copy.posts).toHaveLength(8);expect(c.copy.posts.every(p=>p.text.includes(brief.facts))).toBe(true);expect((await service.status()).aiConfigured).toBe(false);expect(()=>service.create({...brief,mode:'ai'})).toThrow('免费模板');});
  it('retains saved text and rejects stale versions',async()=>{const {service,brief}=await fixture();const c=service.create(brief);const copy={...c.copy,scenes:['第一行\n\n第三行','第二屏','第三屏']};const updated=service.update(c.id,{version:1,copy});expect(service.get(c.id).copy.scenes[0]).toBe(copy.scenes[0]);expect(updated.version).toBe(2);expect(()=>service.update(c.id,{version:1,copy})).toThrow('内容已更新');});
  it('renders asynchronously and invalidates the video when copy changes',async()=>{const {service,brief}=await fixture();const c=service.create(brief);expect(service.render(c.id,1).videoState).toBe('rendering');await service.waitForIdle();expect(service.get(c.id).videoState).toBe('ready');expect((await service.video(c.id)).toString()).toBe('test-video');service.update(c.id,{version:1,copy:c.copy});await expect(service.video(c.id)).rejects.toThrow('尚未生成');});
  it('does not send to unconnected platforms or permit duplicate submission',async()=>{
    const send=vi.fn(async()=>({id:'receipt-1',message:'accepted'}));const publishers={channels:async()=>[{platform:'linkedin' as const,name:'LinkedIn',ready:true,message:'connected'}],send};
    const {service,brief}=await fixture(publishers);const c=service.create(brief);service.render(c.id,1);await service.waitForIdle();
    await expect(service.publish(c.id,{version:1,platforms:['linkedin','wechat'],confirmed:true,visibility:'public'})).rejects.toThrow('尚未连接');expect(send).not.toHaveBeenCalled();
    await service.publish(c.id,{version:1,platforms:['linkedin'],confirmed:true,visibility:'public'});await service.waitForIdle();expect(service.get(c.id).receipts[0]).toMatchObject({state:'submitted',id:'receipt-1'});
    await expect(service.publish(c.id,{version:1,platforms:['linkedin'],confirmed:true,visibility:'public'})).rejects.toThrow('已有发送记录');expect(send).toHaveBeenCalledTimes(1);
  });
  it('preserves unknown delivery instead of falsely reporting failure or silently retrying',async()=>{const {service,brief}=await fixture({channels:async()=>[{platform:'linkedin',name:'LinkedIn',ready:true,message:''}],send:async()=>{throw new Error('timeout');}});const c=service.create(brief);service.render(c.id,1);await service.waitForIdle();await service.publish(c.id,{version:1,platforms:['linkedin'],confirmed:true,visibility:'public'});await service.waitForIdle();expect(service.get(c.id).receipts[0].state).toBe('unknown');});
  it('parses current-news evidence as data and rejects unsafe links',()=>{const xml='<rss><item><title><![CDATA[Hydrogel &amp; skincare]]></title><link>https://example.com/news</link><pubDate>Mon, 21 Sep 2026 00:00:00 GMT</pubDate><source>Industry</source></item><item><title>bad</title><link>javascript:alert(1)</link></item></rss>';expect(parseTrendFeed(xml)).toEqual([{title:'Hydrogel & skincare',url:'https://example.com/news',source:'Industry',publishedAt:'2026-09-21T00:00:00.000Z'}]);});
  it('preserves subtitle blank lines and keeps manually entered facts intact',()=>{expect(captionLines('第一行\n\n第三行')).toEqual(['第一行','','第三行']);expect(templateCopy({topic:'Hydrogel',facts:'10 g / pair',imageMediaId:randomUUID(),language:'en',mode:'template'}).posts[0].text).toContain('10 g / pair');});
});
