import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {afterEach, expect, it, vi} from 'vitest';
import {openContentAdminDatabase} from '../../services/content-admin/database';
import {createMarketingService} from '../../services/marketing/service';
import {createContentAiService} from '../../services/marketing/content-ai';
import {parseSource, publicAddress, fetchPublicBytes} from '../../services/marketing/public-source';
import {marketingPlatforms} from '../../src/lib/marketing-contracts';
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {while (cleanup.length) await cleanup.pop()!();});
const prompts = {textPrompt:'根据已核实产品事实撰写一篇原创文章', imagePrompt:'白色背景上的产品摄影，柔和光线，独立构图'};
const article = {title:'水凝胶产品开发', summary:'产品开发的基本流程', body:'第一段\n\n第二段', category:'产品知识'};
async function fixture(kind: 'article' | 'marketing' = 'article') {
  const dir = await mkdtemp(path.join(tmpdir(),'content-ai-')), db = openContentAdminDatabase(dir);
  const marketing = createMarketingService(db,dir);
  const bytes = await sharp({create:{width:64,height:64,channels:3,background:'#eeddee'}}).png().toBuffer();
  const provider = {configured:true,textModel:'fixture-text',imageModel:'fixture-image',text:vi.fn().mockResolvedValueOnce(prompts).mockResolvedValue(article),image:vi.fn().mockResolvedValue(bytes)};
  const service = createContentAiService(db,dir,marketing,provider);
  cleanup.push(async () => {await service.waitForIdle(); service.stop(); marketing.stop(); db.close(); await rm(dir,{recursive:true,force:true});});
  const job = service.create({kind,topic:'产品科普',facts:'支持水凝胶眼膜定制'},'tester');
  async function step(action: 'plan' | 'write' | 'image') {service.start(job.id,service.get(job.id).version,action,'tester'); await service.waitForIdle(); return service.get(job.id);}
  return {service, db, marketing, provider, job, step};
}
it('requires prompts first and adopts exactly one unpublished article with a real stored cover',async () => {
  const {service,db,job,step} = await fixture();
  expect(() => service.start(job.id,1,'write','tester')).toThrow('提示词');
  await step('plan'); await step('write'); const done = await step('image'); expect(done.state).toBe('ready');
  const adopted = service.adopt(job.id,done.version,'tester'); expect(service.adopt(job.id,1,'tester').adopted).toEqual(adopted.adopted);
  const row = db.prepare('SELECT draft_json,published_json FROM content_documents WHERE id=?').get(adopted.adopted!.id) as {draft_json:string;published_json:null};
  expect(row.published_json).toBeNull(); expect(JSON.parse(row.draft_json)).toMatchObject({...article,coverMediaId:done.imageMediaId});
  expect(() => service.update(job.id,{version:adopted.version,prompts})).toThrow('已转为草稿');
});
it('invalidates only the output whose prompt changed and rejects stale revisions',async () => {
  const {service,job,step} = await fixture(); await step('plan'); await step('write'); const done = await step('image');
  const changed = service.update(job.id,{version:done.version,prompts:{...prompts,imagePrompt:prompts.imagePrompt+'，粉色调'}});
  expect(changed.output).toEqual(article); expect(changed.imageMediaId).toBeUndefined();
  expect(() => service.adopt(job.id,changed.version,'tester')).toThrow('文案和图片');
  expect(() => service.update(job.id,{version:done.version,prompts})).toThrow('已更新');
});
it('keeps copy after an image failure and never retries a charged request automatically',async () => {
  const {service,provider,job,step} = await fixture(); await step('plan'); await step('write');
  provider.image.mockRejectedValue(new Error('Bearer sk-secret')); const failed = await step('image');
  expect(failed.state).toBe('failed'); expect(failed.output).toEqual(article); expect(failed.error).not.toContain('sk-secret'); expect(provider.image).toHaveBeenCalledTimes(1); expect(service.list()).toHaveLength(1);
  expect(service.get(job.id).adopted).toBeUndefined();
});
it('feeds AI copy and generated image into the existing eight-platform video campaign',async () => {
  const {service,provider,marketing,job,step} = await fixture('marketing'); await step('plan');
  provider.text.mockResolvedValue({title:'产品更新',posts:marketingPlatforms.map(platform => ({platform,text:'原创的产品更新内容'})),scenes:['产品主题','产品资料','联系我们']});
  await step('write'); const done = await step('image'); const adopted = service.adopt(job.id,done.version,'tester');
  const campaign = marketing.get(adopted.adopted!.id); expect(campaign.brief.mode).toBe('ai'); expect(campaign.copy.posts).toHaveLength(8); expect(campaign.receipts).toEqual([]); expect(campaign.videoState).toBe('idle');
});
it('extracts source material and blocks local network fetches',async () => {
  const result = parseSource('<title>Example &amp; details</title><script>bad</script><article><p>First</p><p>Second</p><img src="/a.png"></article>','https://example.com/story');
  expect(result.title).toBe('Example & details'); expect(result.text).toContain('First\nSecond'); expect(result.text).not.toContain('bad'); expect(result.images).toEqual(['https://example.com/a.png']);
  for (const address of ['127.0.0.1','10.1.2.3','169.254.169.254','::1','::ffff:127.0.0.1','fe80::1']) expect(publicAddress(address)).toBe(false);
  expect(publicAddress('8.8.8.8')).toBe(true); await expect(fetchPublicBytes('http://127.0.0.1/',1000)).rejects.toThrow('内部');
});
