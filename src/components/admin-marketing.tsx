'use client';

import {useEffect, useState} from 'react';
import type {createAdminApi, MediaAsset} from '@/lib/admin-api';
import {platformNames, type MarketingCampaign, type MarketingCopy, type MarketingPlatform, type MarketingStatus, type MarketingTrend} from '@/lib/marketing-contracts';
import {AdminMediaField} from './admin-media-field';
import {AdminBuffer} from './admin-buffer';
import {AdminAiContent} from './admin-ai-content';
import {rememberWorkspace, workspaceParam} from '@/lib/content-ai-workflow';
import {AdminKnowledgePicker} from './admin-knowledge';
import styles from './admin-marketing.module.css';

export function AdminMarketing({api, media, onUpload, uploadBusy, onDirty, onBusy}: {api: ReturnType<typeof createAdminApi>; media: MediaAsset[]; uploadBusy: boolean; onUpload: (file: File) => Promise<MediaAsset>; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void}) {
  const [status, setStatus] = useState<MarketingStatus>();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [selected, setSelected] = useState<MarketingCampaign>();
  const [copy, setCopy] = useState<MarketingCopy>();
  const [dirty, setDirty] = useState(false);
  const [aiDirty, setAiDirty] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [bufferDirty,setBufferDirty]=useState(false),[bufferBusy,setBufferBusy]=useState(false);
  const [planContentId,setPlanContentId]=useState('');
  const [panel,setPanel] = useState<'ai'|'template'|'delivery'|'schedule'>('ai');
  function showPanel(value:'ai'|'template'|'delivery'|'schedule') {setPanel(value);rememberWorkspace({marketing_panel:value});}
  const [briefDirty, setBriefDirty] = useState(false);
  const [topic, setTopic] = useState('水凝胶眼膜');
  const [facts, setFacts] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [imageId, setImageId] = useState<string | null>(null);
  const [trends, setTrends] = useState<MarketingTrend[]>([]);
  const [trendSummary, setTrendSummary] = useState('');
  const [targets, setTargets] = useState<MarketingPlatform[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [busy, setBusy] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(false);
  const active = selected?.videoState === 'rendering' || selected?.receipts.some(r => r.state === 'submitting');
  useEffect(() => {onDirty(dirty || briefDirty || aiDirty || bufferDirty); return () => onDirty(false);}, [dirty, briefDirty, aiDirty, bufferDirty, onDirty]);
  useEffect(() => {onBusy(Boolean(busy) || uploadBusy || aiBusy || bufferBusy); return () => onBusy(false);}, [busy, uploadBusy, aiBusy, bufferBusy, onBusy]);
  useEffect(() => {const listener = (e: BeforeUnloadEvent) => {if (dirty || briefDirty) e.preventDefault();}; window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);}, [dirty, briefDirty]);
  const selectedId = selected?.id;
  function select(campaign: MarketingCampaign) {setSelected(campaign); setCopy(campaign.copy); setDirty(false); setTargets([]); setConfirm(false);rememberWorkspace({campaign:campaign.id});}
  function remember(campaign: MarketingCampaign) {setSelected(campaign); setCampaigns(items => [campaign, ...items.filter(item => item.id !== campaign.id)]);}
  async function run(name: string, action: () => Promise<void>) {setBusy(name); setError(''); setNotice(''); try {await action();} catch (cause) {setError(cause instanceof Error ? cause.message : '操作失败，请重试。');} finally {setBusy('');}}
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.marketingStatus(), api.marketingList()]).then(([next, records]) => {if(cancelled) return; setStatus(next); setCampaigns(records.items); const savedPanel=workspaceParam('marketing_panel');if(savedPanel==='template'||savedPanel==='delivery'||savedPanel==='schedule')setPanel(savedPanel);const recovered=records.items.find(item=>item.id===workspaceParam('campaign'))??records.items.find(item=>item.videoState==='rendering')??records.items[0];if(recovered) select(recovered);}).catch(cause => {if(!cancelled) setError(cause instanceof Error ? cause.message : '工作台加载失败。');}).finally(() => {if(!cancelled) setBusy('');});
    return () => {cancelled = true;};
  }, [api]);
  useEffect(() => {
    if(!selectedId || !active) return;
    let cancelled = false;
    const timer = setInterval(() => {void api.marketingGet(selectedId).then(campaign => {if(!cancelled) remember(campaign);}).catch(() => {if(!cancelled) setError('进度读取失败，可点击刷新任务重新检查。');});}, 2500);
    return () => {cancelled = true; clearInterval(timer);};
  }, [api, selectedId, active]);
  async function saveCopy() {if(!selected || !copy) return; const saved = await api.marketingSave(selected.id, selected.version, copy); remember(saved); setCopy(saved.copy); setDirty(false); setNotice('文案已保存；修改后需重新合成视频。');}
  const locked = Boolean(busy) || Boolean(active) || uploadBusy;
  const editingLocked = locked || Boolean(selected?.receipts.length);
  return <div className={styles.workspace}>
    <header><p className={styles.eyebrow}>营销工作台</p><h1>聚合营销</h1></header>
    <nav className={styles.tabs} aria-label="营销工作区">{([{id:'ai',label:'AI 图文创作',hint:'资料 → 提示词 → 图文'},{id:'template',label:'免费模板',hint:'用已知事实快速起稿'},{id:'delivery',label:'视频与发布',hint:'编辑草稿 → 制作 → 发送'},{id:'schedule',label:'媒体排期',hint:'Buffer'}] as const).map(tab=><button key={tab.id} aria-pressed={panel===tab.id} disabled={Boolean(busy)||aiBusy||uploadBusy||bufferBusy} onClick={()=>showPanel(tab.id)}><strong>{tab.label}{tab.id==='ai'&&aiDirty?' · 未保存':''}</strong></button>)}</nav>
    <div hidden={panel!=='schedule'}><AdminBuffer api={api} campaigns={campaigns} unsaved={dirty} assets={media} onUpload={onUpload} uploadBusy={uploadBusy} onCampaign={item=>{remember(item);select(item);}} onNavigate={showPanel} onDirty={setBufferDirty} onBusy={setBufferBusy} requestedCampaignId={planContentId} /></div>
    <div hidden={panel!=='ai'}><AdminAiContent kind="marketing" api={api} media={media} onUpload={onUpload} uploadBusy={uploadBusy} onDirty={setAiDirty} onBusy={setAiBusy} onAdopt={async id => {if (dirty && !window.confirm('现有文案有未保存修改，是否打开 AI 草稿？')) return; const campaign = await api.marketingGet(id); remember(campaign); select(campaign); showPanel('delivery'); setNotice('图文草稿已载入。可以继续编辑文案与字幕，然后合成视频。');}} /></div>
    {error && <div role="alert" className={styles.error}>{error}</div>}
    {notice && <div role="status" className={styles.notice}>{notice}</div>}
    {busy && <p role="status">{busy === 'loading' ? '正在读取工作台…' : `${busy}…`}</p>}
    <section hidden={panel!=='template'} className={styles.panel}><h2>免费模板 · 选题与产品资料</h2>
      <div className={styles.columns}><div className={styles.form}>
        <label>主题 / 搜索关键词<input value={topic} maxLength={300} disabled={locked} onChange={e => {setTopic(e.target.value); setBriefDirty(true);}} /></label>
        <label>文案语言<select value={language} onChange={e => setLanguage(e.target.value as 'zh' | 'en')}><option value="zh">中文</option><option value="en">English</option></select></label>
        <button disabled={locked || topic.trim().length < 2} onClick={() => void run('抓取新闻线索', async () => {const result = await api.marketingTrends(topic.slice(0,160), language); setTrends(result.items); setTrendSummary(`${result.source} · ${new Date(result.fetchedAt).toLocaleString('zh-CN')}`);})}>抓取近七天行业线索</button>
        <label>产品事实与卖点<textarea rows={6} value={facts} maxLength={3500} disabled={locked} onChange={e => {setFacts(e.target.value); setBriefDirty(true);}} placeholder="填写已经确认的产品名称、规格、用途与定制范围。模板会保留这些内容。" /></label>
        <AdminKnowledgePicker api={api} disabled={locked} onUse={value => {if (facts.length + value.length + 2 > 3500) {setError('产品事实超过 3500 字，请精简后引用。'); return;} setFacts(current => [current, value].filter(Boolean).join('\n\n')); setBriefDirty(true);}}/>
        <AdminMediaField label="视频产品图片" value={imageId} media={media} currentLabel="请选择产品图片" disabled={locked} onUpload={onUpload} onChange={value => {setImageId(value); setBriefDirty(true);}} />
        <button className={styles.primary} disabled={locked || !imageId || facts.trim().length < 2 || topic.trim().length < 2} onClick={() => {if (dirty && !window.confirm('有未保存的文案，是否放弃并生成新的内容？')) return; void run('生成模板文案', async () => {const campaign = await api.marketingCreate({topic, facts, language, imageMediaId: imageId!, mode: 'template'}); remember(campaign); select(campaign); setBriefDirty(false); showPanel('delivery'); setNotice('八个平台的模板文案已生成，可逐个平台修改。');});}}>生成八平台文案与分镜</button>
      </div><aside className={styles.trends}><h3>新闻线索</h3><small>{trendSummary || '输入行业或产品关键词，再抓取线索。'}</small>{trends.map((trend, i) => <article key={`${trend.url}-${i}`}><a href={trend.url} target="_blank" rel="noreferrer">{trend.title}</a><small>{trend.source} · {trend.publishedAt ? new Date(trend.publishedAt).toLocaleDateString('zh-CN') : '日期未提供'}</small><button disabled={locked} onClick={() => setTopic(trend.title.slice(0,300))}>用作主题</button></article>)}{trendSummary && !trends.length && <p>未找到相关新闻，可换个关键词，或直接填写主题。</p>}</aside></div>
    </section>
    <section hidden={panel!=='delivery'} className={styles.panel}><h2>文案与视频</h2><p>确认文案与字幕后合成视频。修改文案会使已有视频失效，需要重新合成。</p>
      <label className={styles.history}>历史内容<select value={selected?.id ?? ''} disabled={locked} onChange={e => {if(dirty && !window.confirm('有未保存的文案，确认切换吗？')) return; const item = campaigns.find(c => c.id === e.target.value); if(item) select(item);}}><option value="" disabled>先生成第一份文案</option>{campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.copy.title} · {new Date(campaign.createdAt).toLocaleDateString('zh-CN')}</option>)}</select></label>
      {selected && copy ? <><div className={styles.columns}><div className={styles.form}>
        <label>标题<input disabled={editingLocked} value={copy.title} maxLength={80} onChange={e => {setCopy({...copy, title: e.target.value}); setDirty(true);}} /></label>
        {copy.posts.map((post, index) => <details key={post.platform} open={index === 0}><summary>{platformNames[post.platform]}</summary><label><span className="sr-only">{platformNames[post.platform]}文案</span><textarea rows={7} maxLength={4000} disabled={editingLocked} value={post.text} onChange={e => {setCopy({...copy, posts: copy.posts.map((p,i) => i === index ? {...p, text: e.target.value} : p)}); setDirty(true);}} /></label></details>)}
      </div><div className={styles.form}><h3>视频字幕 · 每屏 6 秒</h3>{copy.scenes.map((scene, i) => <label key={i}>第 {i+1} 屏<textarea disabled={editingLocked} value={scene} maxLength={90} rows={3} onChange={e => {setCopy({...copy, scenes: copy.scenes.map((s,j) => j === i ? e.target.value : s)}); setDirty(true);}} /></label>)}
        <small>竖屏 720 × 1280，产品图片配字幕，无配音。输入的产品事实不自动翻译，请与所选语言保持一致。</small>
        {selected.videoState === 'rendering' && <p role="status">正在合成视频，完成后会自动显示…</p>}
        {selected.videoError && <p role="alert" className={styles.error}>{selected.videoError}</p>}
        {selected.videoState === 'ready' && <><video className={styles.video} controls src={api.resolveUrl(`/api/cms/marketing/campaigns/${selected.id}/video`)} /><a href={api.resolveUrl(`/api/cms/marketing/campaigns/${selected.id}/video`)} download="showki-product.mp4">下载视频</a></>}
      </div></div><div className={styles.actions}>
        <button disabled={editingLocked || !dirty} onClick={() => void run('保存文案', saveCopy)}>保存文案</button>
        <button disabled={locked || dirty || !status?.videoConfigured} onClick={() => void run('开始合成', async () => {remember(await api.marketingVideo(selected.id, selected.version));})}>合成免费视频</button>
        <button disabled={Boolean(busy)} onClick={() => {if (dirty && !window.confirm('刷新会载入已保存文案，是否放弃当前修改？')) return; void run('刷新任务', async () => {const latest = await api.marketingGet(selected.id); remember(latest); setCopy(latest.copy); setDirty(false);});}}>刷新任务</button>
        <button className={styles.primary} disabled={locked||dirty} onClick={()=>{setPlanContentId(selected.id);showPanel('schedule');}}>下一步：安排发布计划</button>
        {!dirty && <a href={api.resolveUrl(`/api/cms/marketing/campaigns/${selected.id}/export`)} download>导出全部文案与分镜</a>}
        <button disabled={dirty} onClick={() => {const text = copy.posts.map(p => `${platformNames[p.platform]}\n\n${p.text}`).join('\n\n----------------\n\n'); const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = 'showki-marketing.txt'; a.click(); URL.revokeObjectURL(url);}}>下载文案 TXT</button>
      </div>{dirty && <p>有未保存的修改。保存后才能合成和发送。</p>}{!status?.videoConfigured && <p>视频合成环境尚未就绪，可先编辑并导出文案。</p>}</> : <p>生成后可以分别编辑八个平台的文案，并预览产品短视频。</p>}
    </section>
    <details hidden={panel!=='delivery'} className={styles.panel}><summary className={styles.publishSummary}><strong>其他发布通道</strong><span>{status?.channels.filter(channel=>channel.ready).length??0} / 8 个平台已连接 · 展开设置</span></summary><button disabled={Boolean(busy)} onClick={() => void run('检查账号', async () => setStatus(await api.marketingStatus()))}>刷新账号连接</button>
      <div className={styles.channels}>{status?.channels.map(channel => <label key={channel.platform} className={styles.channel}><input type="checkbox" disabled={!channel.ready || locked || Boolean(selected?.receipts.some(r => r.platform === channel.platform))} checked={targets.includes(channel.platform)} onChange={e => setTargets(items => e.target.checked ? [...items, channel.platform] : items.filter(p => p !== channel.platform))} /><span><strong>{channel.name}</strong><small>{channel.message}</small></span></label>)}</div>
      <p>Buffer 自动发布请进入“媒体排期”。此处保留 Postiz 和国内发布器。公众号使用独立的文章发布权限，发送图文，不群发给订阅者。连接完成后勾选目标账号，再发送。</p>
      <label>视频可见性（YouTube / TikTok）<select value={visibility} onChange={e => setVisibility(e.target.value as 'public' | 'private')}><option value="public">公开</option><option value="private">仅自己可见</option></select></label>
      <button className={styles.primary} disabled={locked || dirty || selected?.videoState !== 'ready' || !targets.length} onClick={() => setConfirm(true)}>一键发送到选中平台</button>
      {confirm && selected && <div role="dialog" aria-modal="true" aria-label="确认营销发送" className={styles.confirm}><h3>发送“{selected.copy.title}”</h3><p>{targets.map(p => platformNames[p]).join('、')}。YouTube / TikTok：{visibility === 'public' ? '公开' : '仅自己可见'}。</p><button disabled={locked} onClick={() => setConfirm(false)}>继续编辑</button><button disabled={locked || dirty} onClick={() => void run('提交发送任务', async () => {remember(await api.marketingPublish(selected.id, selected.version, targets, visibility)); setConfirm(false);})}>确认发送</button></div>}
      {selected?.receipts.length ? <ul className={styles.receipts}>{selected.receipts.map(receipt => <li key={receipt.platform}><strong>{platformNames[receipt.platform]} · {({submitting:'提交中', submitted:'已提交，待平台处理',unknown:'结果待核查',failed:'失败'})[receipt.state]}</strong><p>{receipt.message}</p>{receipt.id && <small>回执：{receipt.id}</small>}</li>)}</ul> : <p>尚未发送任何内容。</p>}
    </details>
  </div>;
}
