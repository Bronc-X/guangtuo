'use client';
import {useEffect,useState} from 'react';
import type {createAdminApi} from '@/lib/admin-api';
import type {SocialResearch,SocialPost} from '@/lib/social-research-contracts';
import {rememberWorkspace,workspaceParam} from '@/lib/content-ai-workflow';
import styles from './admin-ai-content.module.css';

export function AdminSocialResearch({api,kind,query,language,disabled,onUse,onImage,onRestoreQuery}:{
  api:ReturnType<typeof createAdminApi>;kind:'article'|'marketing';query:string;language:'zh'|'en';disabled:boolean;
  onRestoreQuery:(query:string)=>void;onUse:(topic:string,text:string,url:string)=>void;onImage:(url:string)=>Promise<void>;
}) {
  const [items,setItems]=useState<SocialResearch[]>([]),[item,setItem]=useState<SocialResearch>();
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const active=item?.state==='searching'||item?.state==='analyzing',key=`research_${kind}`;
  function select(value:SocialResearch){setItem(value);setItems(rows=>[value,...rows.filter(row=>row.id!==value.id)]);rememberWorkspace({[key]:value.id});}
  useEffect(()=>{let stopped=false;api.socialResearchList().then(result=>{if(stopped)return;const rows=result.items.filter(row=>row.kind===kind);setItems(rows);const selected=rows.find(row=>row.id===workspaceParam(key))??rows[0];if(selected){select(selected);if(workspaceParam(key)===selected.id)onRestoreQuery(selected.query);}}).catch(()=>{if(!stopped)setError('搜索记录读取失败，请刷新页面重试');}).finally(()=>{if(!stopped)setLoading(false);});return()=>{stopped=true;};},[api,kind,key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(!active||!item)return;let stopped=false,timer:ReturnType<typeof setTimeout>;
    async function poll(){try{const next=await api.socialResearchGet(item!.id);if(stopped)return;select(next);setError('');if(!['searching','analyzing'].includes(next.state))return;}catch{if(!stopped)setError('进度连接中断，正在重连');}if(!stopped)timer=setTimeout(()=>void poll(),2500);}
    void poll();return()=>{stopped=true;clearTimeout(timer);};
  },[api,active,item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(cause){setError(cause instanceof Error?cause.message:'操作失败，请重试');}finally{setBusy(false);}}
  const locked=disabled||busy||active||loading;
  function use(topic:string,posts:SocialPost[]){onUse(topic,posts.map(p=>`${p.title}\n${p.excerpt}\n来源：${p.url}\n作者：${p.author}\n发布时间：${p.published||'未提供'}；播放量：${p.views||'未提供'}`).join('\n\n'),posts[0]?.url??'');}
  return <section className={styles.research} aria-label="社媒热点">
    <div className={styles.researchToolbar}><div><strong>社媒热点</strong><small>YouTube 公开搜索 · 免费抓取</small></div><button disabled={locked||query.trim().length<2||query.trim().length>160} onClick={()=>void run(async()=>select(await api.socialResearchCreate({query,kind,language})))}>{item?.state==='searching'?'正在搜索…':'搜索主题 / 关键词'}</button></div>
    <small>基于搜索样本提取选题词，不代表平台热榜。其他平台待接入。</small>
    {items.length>0&&<label>搜索记录<select disabled={locked} value={item?.id??''} onChange={e=>void run(async()=>select(await api.socialResearchGet(e.target.value)))}>{items.map(row=><option key={row.id} value={row.id}>{row.query} · {new Date(row.createdAt).toLocaleString('zh-CN')}</option>)}</select></label>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {item?.error&&<p role="alert" className={styles.error}>{item.error}</p>}
    {active&&<p role="status">{item.state==='searching'?'正在读取公开搜索结果…':'正在提取热点词…'}</p>}
    {item?.state==='empty'&&<p role="status">没有找到视频，请更换关键词。</p>}
    {Boolean(item?.posts.length)&&<>
      <div className={styles.researchToolbar}><strong>{item!.posts.length} 条参考内容</strong><button disabled={locked||item?.state==='ready'} onClick={()=>void run(async()=>select(await api.socialResearchAnalyze(item!.id)))}>{item?.state==='ready'?'热点词已提取':'AI 提取热点词'}</button></div>
      {!item?.keywords.length&&<small>AI 提取按现有模型服务用量计费。</small>}
      <div className={styles.keywordGrid}>{item?.keywords.map(word=><button key={word.word} disabled={locked} onClick={()=>use(`${word.word}：${word.angle}`.slice(0,300),item.posts.filter(p=>word.sourceIds.includes(p.id)))}><strong>{word.word}</strong><span>{word.angle}</span><small>{word.sourceIds.length} 条来源 · 用作主题</small></button>)}</div>
      <details><summary>查看搜索结果与来源</summary><div className={styles.resultGrid}>{item?.posts.map(post=><article key={post.id}><a href={post.url} target="_blank" rel="noreferrer">{post.title}</a><small>{post.author} · {post.published||'日期未提供'} · {post.views||'播放量未提供'}</small>{post.excerpt&&<p>{post.excerpt}</p>}<div className={styles.resultActions}><button disabled={locked} onClick={()=>use(post.title.slice(0,300),[post])}>引用文字</button><a href={post.image} target="_blank" rel="noreferrer">查看封面</a><button disabled={locked} onClick={()=>void run(()=>onImage(post.image))}>封面作参考图</button></div></article>)}</div></details>
    </>}
  </section>;
}
