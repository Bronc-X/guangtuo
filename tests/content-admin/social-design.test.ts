import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach,expect,it,vi} from 'vitest';
import {openContentAdminDatabase} from '../../services/content-admin/database';
import {createSocialResearch,parseYoutubeSearch} from '../../services/marketing/social-research';
import {factoryPackage} from '../../services/studio/factory-package';
import {createFactoryFiles} from '../../services/studio/factory-files';
import {createStudioGateway} from '../../services/studio/gateway';
import type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';
import type {SocialPost} from '../../src/lib/social-research-contracts';
import {execFileSync} from 'node:child_process';

const cleanup:(()=>Promise<void>)[]=[];
afterEach(async()=>{while(cleanup.length)await cleanup.pop()!();});
const post:SocialPost={id:'abcdefghijk',title:'Hydrogel eye patches',author:'Author',url:'https://www.youtube.com/watch?v=abcdefghijk',excerpt:'Product overview',published:'2 days ago',views:'500 views',image:'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg'};
async function fixture(search=vi.fn().mockResolvedValue([post])){
  const dir=await mkdtemp(path.join(tmpdir(),'social-design-')),db=openContentAdminDatabase(dir);
  const provider={configured:true,textModel:'test',imageModel:'test',image:vi.fn(),text:vi.fn().mockResolvedValue({keywords:[{word:'眼膜材质',angle:'比较使用场景',sourceIds:[post.id]}]})};
  const service=createSocialResearch(db,provider,search);
  cleanup.push(async()=>{await service.waitForIdle();service.stop();db.close();await rm(dir,{recursive:true,force:true});});
  return {service,provider,db,dir};
}
it('extracts public results without executing scripts or inventing metrics',()=>{
  const video={videoRenderer:{videoId:post.id,title:{runs:[{text:'A "quoted" } title'}]},ownerText:{runs:[{text:'author'}]}}};
  const html=`<script>var ytInitialData = ${JSON.stringify({contents:[video,video,{videoRenderer:{videoId:'../../secret',title:{simpleText:'bad'}}}]})}; evil();</script>`;
  const rows=parseYoutubeSearch(html);expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({title:'A "quoted" } title',views:'',published:'',url:post.url});
  expect(()=>parseYoutubeSearch('<html>Consent required</html>')).toThrow('无法读取');
  expect(parseYoutubeSearch('var ytInitialData = {"contents":[]};')).toEqual([]);
});
it('persists free search and only calls AI on explicit analysis; deduplicates charged analysis',async()=>{
  const {service,provider,db}=await fixture();
  const job=service.create({query:'eye patch',kind:'article',language:'en'},'tester');
  expect(job.state).toBe('searching');await service.waitForIdle();expect(service.get(job.id).state).toBe('found');expect(provider.text).not.toHaveBeenCalled();
  service.analyze(job.id,'tester');expect(service.get(job.id).state).toBe('analyzing');await service.waitForIdle();
  service.analyze(job.id,'tester');expect(provider.text).toHaveBeenCalledTimes(1);
  const restarted=createSocialResearch(db,provider);expect(restarted.get(job.id).keywords[0].sourceIds).toEqual([post.id]);restarted.stop();
});
it('rejects invented citations and keeps fetched content after AI failure',async()=>{
  const {service,provider}=await fixture();const job=service.create({query:'eye patch',kind:'marketing',language:'zh'},'tester');await service.waitForIdle();
  provider.text.mockResolvedValue({keywords:[{word:'Fake',angle:'Fake result',sourceIds:['not-in-search']}]});
  service.analyze(job.id,'tester');await service.waitForIdle();expect(service.get(job.id)).toMatchObject({state:'failed',posts:[post],keywords:[]});
  provider.text.mockRejectedValue(new Error('secret-token'));service.analyze(job.id,'tester');await service.waitForIdle();expect(service.get(job.id).error).not.toContain('secret-token');
});
it('records empty results and blocks simultaneous searches without losing the running record',async()=>{
  let release!:(value:SocialPost[])=>void;
  const {service}=await fixture(vi.fn().mockImplementation(()=>new Promise(resolve=>{release=resolve;})));
  const job=service.create({query:'eye patch',kind:'article',language:'en'},'tester');
  expect(()=>service.create({query:'other',kind:'article',language:'en'},'tester')).toThrow('正在进行');
  release([]);await service.waitForIdle();expect(service.get(job.id).state).toBe('empty');expect(()=>service.analyze(job.id,'tester')).toThrow('先搜索');
});
it('exports a valid factory ZIP with readable files, escapes customer text and omits contact fields',async()=>{
  const {dir}=await fixture();
  const record={id:'a6d71c4b-4252-4dc0-bda0-15d1dd666822',createdAt:'2026-09-22T00:00:00Z',input:{name:'PRIVATE CUSTOMER',contact:'PRIVATE CONTACT',businessEmail:'private@example.com',design:{kind:'existing',sku:'GT-AIRLESS-030',specifications:{capacity:'30ml'},assemblyState:'closed'},notes:'<script>bad()</script>',quantity:'1000'}} as unknown as StoredInquiry;
  const bytes=await factoryPackage(record,Buffer.from('saved-preview'),createStudioGateway({}),path.resolve('public'));
  const file=path.join(dir,'package.zip');await writeFile(file,bytes);
  // Python is an independent ZIP reader; verifies CRC, paths, and actual decompression.
  const output=execFileSync('python',['-c','import zipfile,sys,json; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({"names":z.namelist(),"html":z.read("design.html").decode(),"data":json.loads(z.read("design.json"))}))',file],{encoding:'utf8'});
  const result=JSON.parse(output);expect(result.names).toContain('preview.png');expect(result.names).toContain('manifest.json');expect(result.html).toContain('&lt;script&gt;');expect(output).not.toContain('PRIVATE');expect(output).not.toContain('private@example.com');expect(result.data.missing.join(' ')).toContain('CAD');
});
it('stores factory attachments privately, isolates designs and includes originals in the ZIP',async()=>{
  const {db,dir}=await fixture(),service=createFactoryFiles(db,dir);
  const file=await service.upload('design-a','print-spec.txt',Buffer.from('factory original'));
  expect(service.list('design-a')).toHaveLength(1);expect(service.list('design-b')).toEqual([]);
  await expect(service.read('design-b',file.id)).rejects.toThrow('不存在');
  await expect(service.upload('design-a','../escape.txt',Buffer.from('bad'))).rejects.toThrow('文件名');
  await expect(service.upload('design-a','run.exe',Buffer.from('bad'))).rejects.toThrow('格式');
  const record={id:'design-a',createdAt:'2026-09-22',input:{design:{kind:'generated',sku:'CUSTOM',specifications:{},assemblyState:'closed'}}} as unknown as StoredInquiry;
  const zip=await factoryPackage(record,null,createStudioGateway({}),dir,[await service.read('design-a',file.id)]);
  const target=path.join(dir,'attachments.zip');await writeFile(target,zip);
  const content=execFileSync('python',['-c',`import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(z.read('attachment-${file.id}.txt').decode())`,target],{encoding:'utf8'});
  expect(content.trim()).toBe('factory original');await service.remove('design-a',file.id);expect(service.list('design-a')).toEqual([]);
});
