'use client';
/* eslint-disable @next/next/no-img-element -- Private images use the CMS session cookie. */

import {useEffect, useState, type ReactNode} from 'react';
import type {createAdminApi, MediaAsset} from '@/lib/admin-api';
import type {ContentAiBrief, ContentAiJob, ContentAiPrompts, ContentAiSource, ContentAiStatus} from '@/lib/content-ai-contracts';
import {aiSteps, aiIsRunning, aiStepAvailable, suggestedAiStep, restoreAiJob, rememberWorkspace, workspaceParam, type AiStep} from '@/lib/content-ai-workflow';
import {platformNames} from '@/lib/marketing-contracts';
import {AdminSocialResearch} from './admin-social-research';
import {AdminMediaField} from './admin-media-field';
import {AdminKnowledgePicker} from './admin-knowledge';
import styles from './admin-ai-content.module.css';

const stateNames = {draft:'资料已保存', planning:'正在拟定提示词', planned:'提示词待确认', writing:'正在生成文案', written:'文案已生成', imaging:'正在生成图片', ready:'图文待确认', failed:'需要处理'};
const labels: Record<AiStep,string> = {brief:'整理资料', prompts:'确认提示词', copy:'编辑文案', image:'制作图片', review:'确认草稿'};
const initialBrief = (kind: 'article' | 'marketing'): ContentAiBrief => ({kind,topic:'',facts:'',sourceText:'',sourceUrl:'',referenceMediaId:null,language:'zh',imageStyle:'写实产品摄影，简洁背景，保留产品形状与包装结构'});
const emptyPrompts = {textPrompt:'',imagePrompt:''};

export function AdminAiContent({kind,api,media,onUpload,uploadBusy,onDirty,onBusy,onAdopt}: {
  kind:'article'|'marketing'; api:ReturnType<typeof createAdminApi>; media:MediaAsset[];
  onUpload:(file:File)=>Promise<MediaAsset>; uploadBusy:boolean;
  onDirty:(value:boolean)=>void; onBusy:(value:boolean)=>void; onAdopt:(id:string)=>Promise<void>;
}) {
  const [status,setStatus] = useState<ContentAiStatus>();
  const [jobs,setJobs] = useState<ContentAiJob[]>([]);
  const [job,setJob] = useState<ContentAiJob>();
  const [brief,setBrief] = useState(initialBrief(kind));
  const [prompts,setPrompts] = useState<ContentAiPrompts>(emptyPrompts);
  const [output,setOutput] = useState<ContentAiJob['output']>();
  const [source,setSource] = useState<ContentAiSource>();
  const [assets,setAssets] = useState(media);
  const [dirty,setDirty] = useState(false);
  const [busy,setBusy] = useState('');
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [loadAttempt,setLoadAttempt] = useState(0);
  const [openStep,setOpenStep] = useState<AiStep>('brief');
  const active = aiIsRunning(job);
  const locked = loading || Boolean(busy) || active || uploadBusy;
  const readonly = locked || Boolean(job?.adopted);
  const image = assets.find(asset=>asset.id===job?.imageMediaId);
  const reference = assets.find(asset=>asset.id===brief.referenceMediaId);
  const jobKey = `ai_${kind}`, stepKey = `step_${kind}`;
  function open(step:AiStep) {setOpenStep(step); rememberWorkspace({[stepKey]:step});}
  function select(next:ContentAiJob) {
    setJob(next); setBrief(next.brief); setPrompts(next.prompts??emptyPrompts); setOutput(next.output); setDirty(false);
    setJobs(items=>[next,...items.filter(item=>item.id!==next.id)]);
    rememberWorkspace({[jobKey]:next.id});
  }
  async function refreshAssets() {setAssets(await api.listMedia());}
  async function run(name:string,action:()=>Promise<void>) {setBusy(name);setError('');try {await action();} catch(cause) {setError(cause instanceof Error?cause.message:'操作未完成，请重试');} finally {setBusy('');}}
  function change<K extends keyof ContentAiBrief>(key:K,value:ContentAiBrief[K]) {setBrief(current=>({...current,[key]:value}));setDirty(true);}
  function newTask(reuse=false) {
    if (dirty && !window.confirm('当前修改尚未保存，是否放弃并新建？')) return;
    setJob(undefined); if (!reuse) {setBrief(initialBrief(kind));setSource(undefined);}
    setPrompts(emptyPrompts);setOutput(undefined);setDirty(reuse);setError('');
    rememberWorkspace({[jobKey]:'new'});open('brief');
  }
  useEffect(()=>{onDirty(dirty);return()=>onDirty(false);},[dirty,onDirty]);
  useEffect(()=>{onBusy(Boolean(busy)||uploadBusy);return()=>onBusy(false);},[busy,uploadBusy,onBusy]);
  useEffect(()=>{const listener=(e:BeforeUnloadEvent)=>{if(dirty)e.preventDefault();};window.addEventListener('beforeunload',listener);return()=>window.removeEventListener('beforeunload',listener);},[dirty]);
  useEffect(()=>{
    let cancelled=false;
    Promise.all([api.contentAiStatus(),api.contentAiList(),api.listMedia()]).then(([next,history,files])=>{
      if(cancelled)return;
      const items=history.items.filter(item=>item.brief.kind===kind);
      setStatus(next);setJobs(items);setAssets(files);
      const recovered=restoreAiJob(items,workspaceParam(jobKey));
      if(recovered) {
        select(recovered);
        const savedStep=workspaceParam(stepKey) as AiStep|null;
        open(aiIsRunning(recovered)?suggestedAiStep(recovered):savedStep&&aiSteps.includes(savedStep)&&aiStepAvailable(savedStep,recovered)?savedStep:suggestedAiStep(recovered));
      }
    }).catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:'工作台加载失败');}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[api,kind,loadAttempt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(!active||!job)return;
    let cancelled=false, timer:ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next=await api.contentAiGet(job!.id);
        if(cancelled)return;
        select(next);setError('');
        if(next.imageMediaId) {const files=await api.listMedia();if(!cancelled)setAssets(files);}
        if(!aiIsRunning(next))return;
      } catch {if(!cancelled)setError('暂时无法读取进度，正在重新连接。不会重复生成。');}
      if(!cancelled)timer=setTimeout(()=>void poll(),3000);
    }
    void poll();
    return()=>{cancelled=true;clearTimeout(timer);};
  },[api,active,job?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function step(action:'plan'|'write'|'image') {
    if(!job)return;
    if((action==='plan'&&(job.output||job.imageMediaId))||(action==='write'&&job.output)||(action==='image'&&job.imageMediaId)) {
      if(!window.confirm('重新生成会替换对应结果，并再次调用计费服务。是否继续？'))return;
    }
    await run('提交生成任务',async()=>{select(await api.contentAiStep(job.id,job.version,action));open(action==='plan'?'prompts':action==='write'?'copy':'image');});
  }
  const completed:Record<AiStep,boolean>={brief:Boolean(job),prompts:Boolean(job?.prompts),copy:Boolean(job?.output),image:Boolean(job?.imageMediaId),review:Boolean(job?.adopted)};
  function stage(stepId:AiStep,summary:string,children:ReactNode) {
    const available=aiStepAvailable(stepId,job), expanded=openStep===stepId;
    const processing=active&&suggestedAiStep(job)===stepId;
    const failed=job?.state==='failed'&&suggestedAiStep(job)===stepId;
    const id=`ai-${kind}-${stepId}`;
    return <section key={stepId} className={`${styles.stage} ${expanded?styles.expanded:''}`}>
      <h3><button type="button" aria-expanded={expanded} aria-controls={id} disabled={!available||loading} onClick={()=>open(stepId)} className={styles.stageHeader}>
        <span className={`${styles.number} ${completed[stepId]?styles.done:''}`}>{completed[stepId]?'✓':aiSteps.indexOf(stepId)+1}</span>
        <span className={styles.stageTitle}>{labels[stepId]}{summary&&<small>{summary}</small>}</span>
        <span className={failed?styles.failedBadge:styles.badge}>{processing?'进行中':failed?'待重试':completed[stepId]?'已完成':available?'待操作':'待前一步完成'}</span><span aria-hidden="true">{expanded?'−':'+'}</span>
      </button></h3>
      <div id={id} hidden={!expanded} className={styles.stageBody}>{children}</div>
    </section>;
  }
  return <section className={styles.panel} aria-label={kind==='article'?'AI 文章创作':'AI 内容二创'}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>内容创作工作台</p><h2>{kind==='article'?'AI 文章创作':'AI 内容二创'}</h2></div><span className={styles.connection}>{status?.configured?'AI 已连接':loading?'连接中…':'AI 待配置'}</span></header>
    <div className={styles.toolbar}><label>当前任务<select aria-label="AI 创作记录" value={job?.id??''} disabled={locked} onChange={e=>{if(dirty&&!window.confirm('当前修改未保存，是否切换？'))return;const item=jobs.find(value=>value.id===e.target.value);if(item)void run('读取任务',async()=>{const next=await api.contentAiGet(item.id);select(next);open(suggestedAiStep(next));await refreshAssets();});}}><option value="" disabled>新建内容</option>{jobs.map(item=><option key={item.id} value={item.id}>{item.brief.topic} · {item.adopted?'已转草稿':stateNames[item.state]}</option>)}</select></label><button disabled={locked} onClick={()=>newTask()}>＋ 新建任务</button>{job&&<button disabled={Boolean(busy)} onClick={()=>{if(dirty&&!window.confirm('当前修改未保存，刷新任务会放弃修改，是否继续？'))return;void run('读取最新进度',async()=>{select(await api.contentAiGet(job.id));await refreshAssets();});}}>刷新进度</button>}</div>
    {loading&&<div className={styles.status} role="status">正在恢复任务与进度…</div>}
    {error&&<div className={styles.error} role="alert">{error}{!status&&<button onClick={()=>{setLoading(true);setError('');setLoadAttempt(value=>value+1);}}>重新连接</button>}</div>}
    {job&&<div className={`${styles.status} ${active?styles.running:''}`} role="status"><span className={styles.statusDot}/><div><strong>{busy|| (job.adopted?'已保存为草稿':stateNames[job.state])}</strong><small>最近更新 {new Date(job.updatedAt).toLocaleString('zh-CN')}</small></div></div>}
    {job?.error&&<div className={styles.error} role="alert"><strong>本次生成未完成</strong><p>{job.error}</p><button disabled={locked} onClick={()=>open(suggestedAiStep(job))}>查看并重试这一步</button></div>}
    <div className={styles.pipeline}>
      {stage('brief',job?job.brief.topic:'',<>
        {job?<><div className={styles.briefSummary}><strong>{job.brief.topic}</strong><p className={styles.pre}>{job.brief.facts}</p><small>文案语言：{job.brief.language==='zh'?'中文':'English'} · {reference?'已选参考图':'直接生成新图'}</small></div>{job.brief.sourceText&&<details><summary>查看抓取的原文</summary><p className={styles.pre}>{job.brief.sourceText}</p></details>}<div className={styles.actions}><button disabled={locked} onClick={()=>newTask(true)}>以这份资料新建任务</button><button onClick={()=>open('prompts')}>查看提示词 →</button></div></>:<>
      <section className={styles.topicCard}><label>内容主题 / 关键词<input value={brief.topic} maxLength={300} disabled={locked} onChange={e => change('topic', e.target.value)} /></label>
        <AdminSocialResearch api={api} kind={kind} query={brief.topic} onRestoreQuery={query=>setBrief(current=>current.topic?current:{...current,topic:query})} language={brief.language} disabled={locked} onUse={(topic,text,url)=>{setBrief(current=>({...current,topic,sourceText:text,sourceUrl:url}));setDirty(true);}} onImage={async url=>{const result=await api.contentAiImportImage(url);await refreshAssets();change('referenceMediaId',result.mediaId);}} />
      </section>
      <div className={styles.columns}><section className={`${styles.form} ${styles.factsCard}`}><h4>产品资料</h4>
        <label>产品事实与写作要求<textarea rows={5} value={brief.facts} maxLength={8000} disabled={locked} onChange={e => change('facts', e.target.value)} placeholder="产品事实、目标读者、写作要求" /></label>
        <AdminKnowledgePicker api={api} disabled={locked} onUse={value => {if (brief.facts.length + value.length + 2 > 8000) {setError('资料超过 8000 字，请精简后引用'); return;} change('facts', [brief.facts,value].filter(Boolean).join('\n\n'));}} />
        <label>输出语言<select disabled={locked} value={brief.language} onChange={e => change('language', e.target.value as 'zh'|'en')}><option value="zh">中文</option><option value="en">English</option></select></label>
      </section><section className={`${styles.form} ${styles.sourceCard}`}><h4>参考内容</h4>
        <label>参考网页网址（选填）<input type="url" value={brief.sourceUrl} disabled={locked} onChange={e => change('sourceUrl', e.target.value)} /></label>
        <button disabled={locked || !brief.sourceUrl} onClick={() => void run('抓取网页', async () => {const result = await api.contentAiSource(brief.sourceUrl); setSource(result); setBrief(current => ({...current, sourceUrl:result.url, sourceText:result.text, topic:current.topic || result.title})); setDirty(true);})}>抓取文字与图片</button>
        <label>参考原文（可粘贴或修改）<textarea rows={6} maxLength={20000} value={brief.sourceText} disabled={locked} onChange={e => change('sourceText', e.target.value)} /></label>
        {source && <div><small>{source.images.length ? '发现参考图片，选择后用于图片二创：' : '未找到可用图片，可以直接上传。'}</small>{source.images.map((url,i) => <div className={styles.source} key={url}><a href={url} target="_blank" rel="noreferrer">查看图片 {i+1}</a><button disabled={locked} onClick={() => void run('导入参考图', async () => {const result = await api.contentAiImportImage(url); await refreshAssets(); change('referenceMediaId',result.mediaId);})}>选作参考图</button></div>)}</div>}
      </section></div>
      <section className={styles.imageCard}><h4>图片素材</h4><div className={styles.columns}><AdminMediaField label="AI 参考图片" value={brief.referenceMediaId} media={assets} currentLabel="不选参考图，直接生成新图" disabled={locked} onUpload={async file => {const asset = await onUpload(file); setAssets(items => [asset, ...items.filter(item => item.id !== asset.id)]); return asset;}} onChange={value => change('referenceMediaId',value)} /><label>图片风格与要求<textarea rows={3} maxLength={1000} value={brief.imageStyle} disabled={locked} onChange={e => change('imageStyle', e.target.value)} /></label></div></section>

        <div className={styles.actions}><button className={styles.primary} disabled={locked||!status?.configured||brief.topic.trim().length<2||brief.facts.trim().length<2} onClick={()=>void run('保存资料并生成提示词',async()=>{const created=await api.contentAiCreate(brief);select(created);open('prompts');select(await api.contentAiStep(created.id,created.version,'plan'));})}>{busy||'保存资料，生成提示词 →'}</button></div>
        </>}
      </>)}
      {stage('prompts',job?.prompts?'已生成文字与图片提示词':'',<>
        {job?.prompts?<><div className={styles.columns}><label>文字提示词<textarea rows={7} value={prompts.textPrompt} maxLength={14000} disabled={readonly} onChange={e=>{setPrompts({...prompts,textPrompt:e.target.value});setDirty(true);}}/></label><label>图片提示词<textarea rows={7} value={prompts.imagePrompt} maxLength={6000} disabled={readonly} onChange={e=>{setPrompts({...prompts,imagePrompt:e.target.value});setDirty(true);}}/></label></div><small>修改提示词会使对应旧结果失效，需要重新生成。</small></>:<p>{job?.state==='planning'?'正在分析资料并拟定提示词，请稍候。':'提示词尚未生成，可从这里继续。'}</p>}
        <div className={styles.actions}><button disabled={readonly||dirty||!job||!status?.configured} onClick={()=>void step('plan')}>{job?.prompts?'重新拟定提示词':'生成提示词'}</button>{job?.output?<button className={styles.primary} onClick={()=>open('copy')}>查看文案 →</button>:<button className={styles.primary} disabled={readonly||dirty||!job?.prompts} onClick={()=>void step('write')}>确认方向，生成文案 →</button>}</div>
      </>)}
      {stage('copy',job?.output?job.output.title:kind==='article'?'生成标题、摘要和正文':'生成八平台文案与视频字幕',<>
        {job?.state==='writing'&&<p className={styles.hint}>AI 正在写作。完成后可直接修改结果。</p>}
        {!output&&job?.state!=='writing'&&<p>提示词已就绪，开始生成第一版文案。</p>}
              {output && <div className={styles.form}><label>标题<input maxLength={'body' in output ? 120 : 80} disabled={readonly} value={output.title} onChange={e => {setOutput({...output,title:e.target.value}); setDirty(true);}} /></label>{'body' in output ? <><label>分类<input value={output.category} maxLength={60} disabled={readonly} onChange={e => {setOutput({...output,category:e.target.value}); setDirty(true);}} /></label><label>摘要<textarea rows={3} maxLength={300} disabled={readonly} value={output.summary} onChange={e => {setOutput({...output,summary:e.target.value}); setDirty(true);}} /></label><label>文章正文<textarea rows={16} maxLength={30000} disabled={readonly} value={output.body} onChange={e => {setOutput({...output,body:e.target.value}); setDirty(true);}} /></label></> : <>{output.posts.map((post,index) => <details key={post.platform} open={index === 0}><summary>{platformNames[post.platform]}</summary><textarea aria-label={platformNames[post.platform] + ' AI 文案'} rows={6} maxLength={4000} disabled={readonly} value={post.text} onChange={e => {setOutput({...output,posts:output.posts.map((value,i) => i === index ? {...value,text:e.target.value} : value)}); setDirty(true);}} /></details>)}{output.scenes.map((scene,index) => <label key={index}>视频分镜 {index+1}<textarea rows={2} maxLength={90} disabled={readonly} value={scene} onChange={e => {setOutput({...output,scenes:output.scenes.map((value,i) => i === index ? e.target.value : value)}); setDirty(true);}} /></label>)}</>}</div>}

        <div className={styles.actions}><button className={!output?styles.primary:undefined} disabled={readonly||dirty||!job?.prompts} onClick={()=>void step('write')}>{output?'重新生成文案':'生成文案'}</button>{output&&<button className={styles.primary} disabled={dirty} onClick={()=>open('image')}>文案已确认，制作图片 →</button>}</div>
      </>)}
      {stage('image',job?.imageMediaId?'图片已保存，可预览或重新生成':brief.referenceMediaId?'用参考图生成新构图':'根据图片提示词生成配图',<>
        <div className={styles.imageGrid}><div className={styles.form}><label>图片提示词<textarea rows={7} value={prompts.imagePrompt} maxLength={6000} disabled={readonly} onChange={e=>{setPrompts({...prompts,imagePrompt:e.target.value});setDirty(true);}}/></label>{reference&&<details><summary>查看原始参考图片</summary><img className={styles.reference} src={api.resolveUrl(reference.url)} alt="原始参考图片"/></details>}</div><div>{image?<figure><img className={styles.image} src={api.resolveUrl(image.url)} alt="AI 生成图片预览"/><figcaption>已保存到素材库 · <a href={api.resolveUrl(image.url)} target="_blank" rel="noreferrer">查看原图</a></figcaption></figure>:<div className={styles.imagePlaceholder}><span aria-hidden="true">▧</span><strong>{job?.state==='imaging'?'图片正在生成':'图片预览'}</strong></div>}</div></div>
        <div className={styles.actions}><button className={!image?styles.primary:undefined} disabled={readonly||dirty||!job?.prompts} onClick={()=>void step('image')}>{image?'重新生成图片':brief.referenceMediaId?'生成二创图片':'生成图片'}</button>{job?.imageMediaId&&<button className={styles.primary} disabled={dirty||!job.output} onClick={()=>open('review')}>{job.output?'图片已确认，检查草稿 →':'请先完成文案'}</button>}</div>
      </>)}
      {stage('review',job?.adopted?'已转为草稿，可继续编辑或制作视频':'检查图文，交给下一步编辑与发布',<>
        {output&&<div className={styles.review}><div>{image&&<img src={api.resolveUrl(image.url)} alt="草稿封面"/>}</div><div><h4>{output.title}</h4><p className={styles.pre}>{'summary' in output?output.summary:`八个平台文案 · ${output.scenes.length} 屏视频字幕`}</p></div></div>}
        <div className={styles.actions}><small>这一步保存草稿，不会对外发布。</small><button className={styles.primary} disabled={locked||dirty||!job?.output||!job?.imageMediaId} onClick={()=>void run('打开草稿',async()=>{if(!job)return;const result=job.adopted?job:await api.contentAiStep(job.id,job.version,'adopt');select(result);await onAdopt(result.adopted!.id);})}>{job?.adopted?'打开已保存草稿 →':kind==='article'?'保存并进入文章编辑 →':'保存并进入视频与发布 →'}</button></div>
      </>)}
    </div>
    {dirty&&<div className={styles.saveBar} role="status"><span>{job?'有未保存的修改，保存后可继续下一步。':'资料尚未保存。点击“保存资料，生成提示词”开始。'}</span>{job?.prompts&&<button className={styles.primary} disabled={readonly} onClick={()=>void run('保存修改',async()=>select(await api.contentAiSave(job.id,job.version,prompts,output)))}>保存修改</button>}</div>}
    <footer className={styles.footer}><span>仅点击生成时调用服务，按实际用量计费。</span></footer>
  </section>;
}
