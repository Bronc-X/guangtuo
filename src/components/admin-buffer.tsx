'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import type {createAdminApi, MediaAsset} from '@/lib/admin-api';
import {AdminMediaField} from './admin-media-field';
import {bufferPlatforms, bufferStateNames, type BufferConnection, type BufferPlatform, type BufferSchedule} from '@/lib/buffer-contracts';
import {platformNames, type MarketingCampaign} from '@/lib/marketing-contracts';
import styles from './admin-buffer.module.css';

const dateLabel=(date?:string)=>date?new Date(date).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'按 Buffer 队列';
export function AdminBuffer({api,campaigns,unsaved,assets,onUpload,uploadBusy,onCampaign,onNavigate,onDirty,onBusy,requestedCampaignId}:{api:ReturnType<typeof createAdminApi>;campaigns:MarketingCampaign[];unsaved:boolean;assets:MediaAsset[];onUpload:(file:File)=>Promise<MediaAsset>;uploadBusy:boolean;onCampaign:(campaign:MarketingCampaign)=>void;onNavigate:(panel:'ai'|'template'|'delivery')=>void;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void;requestedCampaignId:string}) {
  const [connection,setConnection]=useState<BufferConnection>();
  const [jobs,setJobs]=useState<BufferSchedule[]>([]);
  const [key,setKey]=useState(''),[busy,setBusy]=useState('loading'),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [campaignId,setCampaignId]=useState(''),[platform,setPlatform]=useState<BufferPlatform>('linkedin'),[media,setMedia]=useState<'image'|'video'>('image');
  const [mode,setMode]=useState<'customScheduled'|'addToQueue'>('customScheduled'),[due,setDue]=useState(''),[aiGenerated,setAiGenerated]=useState(true);
  const [filter,setFilter]=useState('active'),[day,setDay]=useState('');
  const [channels,setChannels]=useState<Record<string,string>>({});
  const request=useRef<{fingerprint:string;id:string}|undefined>(undefined);
  const contentRequest=useRef<{fingerprint:string;id:string}|undefined>(undefined);
  const [source,setSource]=useState<'new'|'existing'>(campaigns.length?'existing':'new');
  const [title,setTitle]=useState(''),[text,setText]=useState(''),[imageId,setImageId]=useState<string|null>(null);
  const [target,setTarget]=useState('');
  const contentDirty=Boolean(title||text||imageId);
  const [lastRequested,setLastRequested]=useState(requestedCampaignId);
  if(requestedCampaignId!==lastRequested){setLastRequested(requestedCampaignId);if(requestedCampaignId){setCampaignId(requestedCampaignId);setSource('existing');}}
  const locked=Boolean(busy)||uploadBusy;
  const campaign=campaigns.find(c=>c.id===campaignId)??campaigns[0];
  const availableChannels=connection?.channels.filter(c=>c.service===platform&&!c.isDisconnected&&!c.isLocked&&!c.isQueuePaused)??[];
  const targetChannel=availableChannels.find(c=>c.id===target)??availableChannels[0];
  const readyCampaign=source==='existing'?campaign:undefined;
  useEffect(()=>{onDirty(contentDirty);return()=>onDirty(false);},[contentDirty,onDirty]);
  useEffect(()=>{onBusy(locked);return()=>onBusy(false);},[locked,onBusy]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(contentDirty)event.preventDefault();};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[contentDirty]);
  const renderingId=readyCampaign?.videoState==='rendering'?readyCampaign.id:undefined;
  const campaignChanged=useRef(onCampaign);useEffect(()=>{campaignChanged.current=onCampaign;},[onCampaign]);
  useEffect(()=>{if(!renderingId)return;let cancelled=false;const timer=setInterval(()=>{void api.marketingGet(renderingId).then(item=>{if(!cancelled)campaignChanged.current(item);}).catch(()=>{if(!cancelled)setError('视频进度读取失败，请刷新后继续。');});},2500);return()=>{cancelled=true;clearInterval(timer);};},[api,renderingId]);
  const update=(job:BufferSchedule)=>setJobs(items=>[job,...items.filter(item=>item.id!==job.id)]);
  async function run(name:string,fn:()=>Promise<void>){setBusy(name);setError('');setNotice('');try{await fn();}catch(cause){setError(cause instanceof Error?cause.message:'操作失败，请重试。');}finally{setBusy('');}}
  useEffect(()=>{let cancelled=false;Promise.all([api.bufferConnection(),api.bufferList()]).then(([status,list])=>{if(!cancelled){setConnection(status);setJobs(list.items);}}).catch(cause=>{if(!cancelled)setError(cause.message);}).finally(()=>{if(!cancelled)setBusy('');});return()=>{cancelled=true;};},[api]);
  const processing=jobs.some(job=>['submitting','cancelling','sending'].includes(job.state));
  useEffect(()=>{if(!processing)return;let cancelled=false;const timer=setInterval(()=>{void api.bufferList().then(result=>{if(!cancelled)setJobs(result.items);}).catch(()=>{if(!cancelled)setError('状态读取失败，请刷新排期记录。');});},3000);return()=>{cancelled=true;clearInterval(timer);};},[api,processing]);
  const visible=jobs.filter(job=>(filter==='all'||(filter==='draft'?job.state==='draft':filter==='done'?['sent','cancelled'].includes(job.state):!['sent','cancelled'].includes(job.state)))&&(!day||Boolean(job.dueAt&&new Date(Date.parse(job.dueAt)+8*3600_000).toISOString().startsWith(day)))).sort((a,b)=>(a.dueAt??a.createdAt).localeCompare(b.dueAt??b.createdAt));
  async function savePlan(submit:boolean) {
    if(!readyCampaign)return;
    const input={campaignId:readyCampaign.id,version:readyCampaign.version,platform,media,mode,aiGenerated,...(mode==='customScheduled'?{dueAt:new Date(`${due}:00+08:00`).toISOString()}:{})};
    const fingerprint=JSON.stringify(input);if(request.current?.fingerprint!==fingerprint)request.current={fingerprint,id:crypto.randomUUID()};
    const draft=await api.bufferDraft({...input,requestId:request.current.id});update(draft);setFilter('active');setDay('');
    if(targetChannel)setChannels(current=>({...current,[draft.id]:targetChannel.id}));
    if(submit&&targetChannel){update(await api.bufferSubmit(draft.id,targetChannel.id));setNotice('计划已提交，发布进度见下方记录。');}
    else setNotice('排期草稿已保存，尚未对外发布。');
  }
  const canPlan=!locked&&Boolean(readyCampaign)&&!unsaved&&(mode!=='customScheduled'||Boolean(due))&&(media!=='video'||readyCampaign?.videoState==='ready');
  return <div className={styles.workspace}>
    <section className={styles.connection}><div className={styles.heading}><div><span className={styles.kicker}>BUFFER</span><h2>媒体排期</h2></div><span className={connection?.connected?styles.connected:styles.pending}>{connection?.connected?(connection.channels.length?`已连接 · ${connection.channels.length} 个账号`:'待绑定社媒'):'待连接'}</span><a href="https://publish.buffer.com" target="_blank" rel="noreferrer">管理账号授权 ↗</a></div>
      <details open={!connection?.connected}><summary>连接账号与注册指引</summary><div className={styles.columns}><ol className={styles.guide}>
        <li><a href="https://buffer.com" target="_blank" rel="noreferrer">注册 Buffer</a>，选择 Free 免费方案并验证邮箱。</li>
        <li>在 Buffer 的 Channels 添加社媒账号，登录对应平台并授权。</li>
        <li>打开 <a href="https://publish.buffer.com/settings/api" target="_blank" rel="noreferrer">API 设置</a> → Personal Access → New Key。名称填写 SHOWKI，勾选 accountRead、postsRead、postsWrite，选择有效期后生成。</li>
        <li>点击 Copy key，将完整密钥粘贴到右侧，点击“连接 Buffer”。</li>
        <li>保存下方排期草稿，选择已绑定账号，确认后提交。</li>
      </ol><div className={styles.form}><label>Buffer API Key<input type="password" value={key} autoComplete="new-password" placeholder={connection?.connected?'输入新密钥可更新连接':'粘贴 Copy key 复制的完整密钥'} onChange={e=>setKey(e.target.value)} /></label>
        <button disabled={Boolean(busy)||key.trim().length<10} onClick={()=>void run('正在连接',async()=>{setConnection(await api.bufferConnect(key.trim()));setKey('');setNotice('Buffer 已连接，请检查下方账号。');})}>{connection?.connected?'更新连接':'连接 Buffer'}</button>
        <p>免费版：3 个社媒账号，每个账号 10 条待发布内容。<a href="https://buffer.com/pricing" target="_blank" rel="noreferrer">查看当前额度</a></p>
        <small>本站接入 LinkedIn、Facebook、Instagram、YouTube、TikTok。公众号、小红书、抖音需使用其他发布通道。</small>
      </div></div></details>
      {connection?.connected&&<><div className={styles.row}><label>Buffer 工作区<select disabled={Boolean(busy)} value={connection.organizationId} onChange={e=>void run('切换工作区',async()=>setConnection(await api.bufferRefresh(e.target.value)))}>{connection.organizations.map(org=><option value={org.id} key={org.id}>{org.name}</option>)}</select></label><button disabled={Boolean(busy)} onClick={()=>void run('刷新绑定账号',async()=>setConnection(await api.bufferRefresh()))}>刷新绑定账号</button></div><div className={styles.accounts}>{connection.channels.map(channel=><div key={channel.id}><strong>{channel.name}</strong><span>{channel.service} · {channel.isDisconnected?'授权已失效':channel.isLocked?'账号已锁定':channel.isQueuePaused?'队列已暂停':'可排期'}</span><small>{channel.timezone}</small></div>)}{!connection.channels.length&&<p>尚未绑定社媒账号。在 Buffer 添加后，点击“刷新绑定账号”。</p>}</div></>}
    </section>
    {error&&<p role="alert" className={styles.error}>{error}</p>}{notice&&<p role="status" className={styles.success}>{notice}</p>}{busy&&<p role="status">{busy==='loading'?'正在加载排期…':`${busy}…`}</p>}
    <section className={styles.compose}><h2>新建发布计划</h2><div className={styles.steps}><span>1 创建内容</span><span>2 选择账号</span><span>3 设置时间</span></div><div className={styles.columns}><div className={styles.form}>
      <h3 className={styles.stepTitle}>1 · 创建内容</h3>
      <div className={styles.choices}><button aria-pressed={source==='new'} disabled={locked} onClick={()=>setSource('new')}>＋ 新建图文</button><button aria-pressed={source==='existing'} disabled={locked||!campaigns.length} onClick={()=>setSource('existing')}>选择已有内容</button></div>
      {source==='new'?<div className={styles.form}>
        <label>计划标题<input maxLength={80} value={title} disabled={locked} onChange={e=>setTitle(e.target.value)} placeholder="例如：眼膜新品介绍" /></label>
        <label>发布文案<textarea rows={6} maxLength={4000} value={text} disabled={locked} onChange={e=>setText(e.target.value)} placeholder="直接输入准备发布的文案" /></label>
        <AdminMediaField label="发布图片" value={imageId} media={assets} disabled={locked} onUpload={onUpload} onChange={setImageId} currentLabel="上传或选择图片" />
        <button className={styles.primary} disabled={locked||unsaved||title.trim().length<2||text.trim().length<2||!imageId} onClick={()=>void run('保存图文',async()=>{const input={title:title.trim(),text:text.trim(),imageMediaId:imageId!};const fingerprint=JSON.stringify(input);if(contentRequest.current?.fingerprint!==fingerprint)contentRequest.current={fingerprint,id:crypto.randomUUID()};const saved=await api.marketingManual({...input,requestId:contentRequest.current.id});onCampaign(saved);setCampaignId(saved.id);setSource('existing');setTitle('');setText('');setImageId(null);setNotice('图文已保存，继续选择账号和发布时间。');})}>保存图文，继续排期</button>
      </div>:<><label>营销内容<select value={campaign?.id??''} disabled={locked} onChange={e=>setCampaignId(e.target.value)}><option value="" disabled>选择已保存的内容</option>{campaigns.map(item=><option key={item.id} value={item.id}>{item.copy.title}</option>)}</select></label><button disabled={locked||unsaved||!campaign} onClick={()=>{if(campaign){onCampaign(campaign);onNavigate('delivery');}}}>编辑文案与视频</button></>}
      <div className={styles.row}><button disabled={locked} onClick={()=>onNavigate('ai')}>用 AI 创作</button><button disabled={locked} onClick={()=>onNavigate('template')}>用免费模板</button></div>
      <h3 className={styles.stepTitle}>2 · 选择发布账号</h3>
      <div className={styles.columns}><label>发布平台<select value={platform} disabled={locked} onChange={e=>{const next=e.target.value as BufferPlatform;setPlatform(next);setTarget('');if(['youtube','tiktok'].includes(next))setMedia('video');}}>{bufferPlatforms.map(p=><option key={p} value={p}>{platformNames[p]}</option>)}</select></label><label>媒体格式<select value={media} disabled={locked} onChange={e=>setMedia(e.target.value as 'image'|'video')}><option value="image" disabled={['youtube','tiktok'].includes(platform)}>图片 + 文案</option><option value="video">视频 + 文案</option></select></label></div>
      <label>发布账号<select value={targetChannel?.id??''} disabled={locked||!availableChannels.length} onChange={e=>setTarget(e.target.value)}><option value="" disabled>{connection?.connected?'该平台暂无可用账号':'先连接 Buffer'}</option>{availableChannels.map(channel=><option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
      {connection?.connected&&!connection.channels.length&&<div className={styles.warning}>API 已连接，尚未读取到社媒账号。<button disabled={locked} onClick={()=>void run('刷新账号',async()=>setConnection(await api.bufferRefresh()))}>刷新绑定账号</button></div>}
      {media==='video'&&readyCampaign&&<div className={styles.form}>{readyCampaign.videoState==='rendering'?<p role="status">视频合成中，完成后可提交计划。</p>:readyCampaign.videoState!=='ready'?<><button disabled={locked||unsaved} onClick={()=>void run('开始合成视频',async()=>onCampaign(await api.marketingVideo(readyCampaign.id,readyCampaign.version)))}>用当前图片与字幕合成视频</button>{readyCampaign.videoError&&<p className={styles.error}>{readyCampaign.videoError}</p>}</>:<p className={styles.success}>视频已就绪</p>}</div>}
      <h3 className={styles.stepTitle}>3 · 设置发布时间</h3>
      <label>发布时间<select value={mode} disabled={locked} onChange={e=>setMode(e.target.value as typeof mode)}><option value="customScheduled">指定时间（北京时间 UTC+8）</option><option value="addToQueue">加入 Buffer 队列</option></select></label>
      {mode==='customScheduled'?<label>日期与时间<input type="datetime-local" value={due} disabled={locked} onChange={e=>setDue(e.target.value)} /></label>:<p>使用目标账号在 Buffer 中设置的发布时段和时区。</p>}
      <label className={styles.checkbox}><input type="checkbox" checked={aiGenerated} disabled={locked} onChange={e=>setAiGenerated(e.target.checked)} />内容包含 AI 生成素材</label>
      {unsaved&&<p className={styles.warning}>营销文案尚未保存，请先保存后再安排发布。</p>}
      {!readyCampaign&&<p>先完成第 1 步，保存图文。</p>}
      <div className={styles.row}><button disabled={!canPlan} onClick={()=>void run('保存排期草稿',()=>savePlan(false))}>仅保存排期草稿</button><button className={styles.primary} disabled={!canPlan||!targetChannel} onClick={()=>{if(!window.confirm(`确认将“${readyCampaign?.copy.title}”安排到 ${targetChannel?.name}？\n${mode==='customScheduled'?due.replace('T',' ')+'（北京时间）':'加入账号发布队列'}\n内容将公开发布。`))return;void run('提交发布计划',()=>savePlan(true));}}>确认并提交发布计划</button></div>
    </div><aside className={styles.preview}><span className={styles.kicker}>发布预览 · {platformNames[platform]}</span><h3>{source==='new'?(title||'计划标题'):campaign?.copy.title??'尚未选择内容'}</h3>{source==='new'?(imageId?<Image unoptimized width={640} height={480} src={api.resolveUrl(`/api/cms/media/${imageId}/file`)} alt={title||'发布图片'} />:<div className={styles.mediaTag}>上传图片后在这里预览</div>):campaign&&(media==='video'&&campaign.videoState==='ready'?<video controls src={api.resolveUrl(`/api/cms/marketing/campaigns/${campaign.id}/video`)} />:media==='image'?<Image unoptimized width={640} height={480} src={api.resolveUrl(`/api/cms/media/${campaign.brief.imageMediaId}/file`)} alt={campaign.copy.title} />:<span className={styles.mediaTag}>视频待合成</span>)}<p>{source==='new'?(text||'文案预览'):campaign?.copy.posts.find(post=>post.platform===platform)?.text}</p></aside></div></section>
    <section className={styles.records}><div className={styles.heading}><h2>排期记录</h2><button disabled={Boolean(busy)} onClick={()=>void run('刷新排期记录',async()=>setJobs((await api.bufferList()).items))}>刷新记录</button></div><div className={styles.row}><label>状态<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="active">进行中与待处理</option><option value="draft">草稿</option><option value="done">已发布 / 已取消</option><option value="all">全部记录</option></select></label><label>发布日期（北京时间）<input type="date" value={day} onChange={e=>setDay(e.target.value)} /></label>{day&&<button onClick={()=>setDay('')}>清除日期</button>}</div>
      {!visible.length&&<p className={styles.empty}>{jobs.length?'没有符合条件的排期。':'还没有排期。先选择营销内容，保存第一条草稿。'}</p>}
      {visible.map(job=>{const available=connection?.channels.filter(c=>c.service===job.platform&&!c.isDisconnected&&!c.isLocked&&!c.isQueuePaused)??[];const selectedChannel=channels[job.id]??available[0]?.id??'';const canSubmit=job.state==='draft'||(job.state==='failed'&&job.retryable);return <article className={styles.record} key={job.id}><div className={styles.recordTop}><div><strong>{job.title}</strong><p>{platformNames[job.platform]} · {job.media==='video'?'视频':'图片'} · {job.channelName??'未选择账号'}</p></div><span className={styles.badge} data-state={job.state}>{bufferStateNames[job.state]}</span></div><div className={styles.time}>{dateLabel(job.dueAt)}{job.dueAt?' · 北京时间':''}</div><p className={styles.message}>{job.message}</p><details><summary>查看已保存文案</summary><p className={styles.copy}>{job.text}</p></details><div className={styles.row}>
        {canSubmit&&<><label>发布账号<select disabled={Boolean(busy)||!available.length} value={selectedChannel} onChange={e=>setChannels(current=>({...current,[job.id]:e.target.value}))}><option value="" disabled>{connection?.connected?'该平台没有可用账号':'待连接 Buffer'}</option>{available.map(channel=><option value={channel.id} key={channel.id}>{channel.name}</option>)}</select></label><button className={styles.primary} disabled={Boolean(busy)||!selectedChannel} onClick={()=>{if(!window.confirm(`确认将“${job.title}”提交到 ${available.find(c=>c.id===selectedChannel)?.name}？\n${dateLabel(job.dueAt)}${job.dueAt?'（北京时间）':''}\n内容将公开发布；如平台要求审核或手机确认，会显示相应状态。`))return;void run('提交排期',async()=>update(await api.bufferSubmit(job.id,selectedChannel)));}}>{job.retryable?'重新提交':'确认并提交排期'}</button></>}
        {job.remoteId&&!['cancelled','sent'].includes(job.state)&&<button disabled={Boolean(busy)||['submitting','cancelling'].includes(job.state)} onClick={()=>void run('同步 Buffer 状态',async()=>update(await api.bufferSync(job.id)))}>同步发布状态</button>}
        {!['sent','cancelled','sending','submitting','cancelling'].includes(job.state)&&(canSubmit||job.remoteId)&&<button disabled={Boolean(busy)} onClick={()=>{if(!window.confirm('确认取消这条排期？'))return;void run('取消排期',async()=>update(await api.bufferCancel(job.id)));}}>取消排期</button>}
        {job.externalLink&&<a href={job.externalLink} target="_blank" rel="noreferrer">查看已发布内容 ↗</a>}{job.state==='unknown'&&<a href="https://publish.buffer.com" target="_blank" rel="noreferrer">去 Buffer 核查 ↗</a>}
      </div></article>;})}
    </section>
  </div>;
}
