'use client';
/* eslint-disable @next/next/no-img-element -- Private previews require the CMS session. */
import type {FactoryFile} from '@/lib/factory-file-contracts';
import {useEffect,useState} from 'react';
import type {createAdminApi} from '@/lib/admin-api';
import type {StoredInquiry} from '@/lib/inquiry-admin-contracts';
import {customerDesignInfo} from '@/lib/customer-design';
import {workspaceParam,rememberWorkspace} from '@/lib/content-ai-workflow';
import styles from './admin-customer-designs.module.css';

export function AdminCustomerDesigns({api}:{api:ReturnType<typeof createAdminApi>}) {
  const [items,setItems]=useState<StoredInquiry[]>([]),[selected,setSelected]=useState(''),[query,setQuery]=useState('');
  const [files,setFiles]=useState<FactoryFile[]>([]),[fileBusy,setFileBusy]=useState(false);
  const [kind,setKind]=useState('all'),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0),[downloading,setDownloading]=useState(false);
  useEffect(()=>{let stopped=false;api.listInquiries().then(result=>{if(stopped)return;const rows=result.items.filter(item=>item.input.design);setItems(rows);setSelected(current=>current||workspaceParam('design')||rows[0]?.id||'');setError('');}).catch(()=>{if(!stopped)setError('方案读取失败，请重试');}).finally(()=>{if(!stopped)setLoading(false);});return()=>{stopped=true;};},[api,attempt]);
  useEffect(()=>{if(!selected)return;let stopped=false;api.factoryFiles(selected).then(result=>{if(!stopped)setFiles(result.items);}).catch(()=>{if(!stopped)setError('附件读取失败，请刷新方案');});return()=>{stopped=true;};},[api,selected,attempt]);
  async function upload(file:File){if(file.size>20_000_000){setError('单个附件须在 20 MB 以内');return;}setFileBusy(true);setError('');try{const added=await api.factoryFileUpload(selected,file);setFiles(items=>[...items,added]);}catch(cause){setError(cause instanceof Error?cause.message:'附件上传失败');}finally{setFileBusy(false);}}
  async function remove(file:FactoryFile){if(!window.confirm(`删除附件“${file.name}”？`))return;setFileBusy(true);setError('');try{await api.factoryFileRemove(selected,file.id);setFiles(items=>items.filter(item=>item.id!==file.id));}catch(cause){setError(cause instanceof Error?cause.message:'附件删除失败');}finally{setFileBusy(false);}}
  const shown=items.filter(item=>(kind==='all'||item.input.design?.kind===kind)&&`${item.id} ${item.input.name} ${item.input.company} ${item.input.design?.sku}`.toLowerCase().includes(query.toLowerCase()));
  const record=items.find(item=>item.id===selected),design=record?.input.design,info=design?customerDesignInfo(design):undefined;
  async function download(){if(!record)return;setDownloading(true);setError('');try{const blob=await api.factoryPackage(record.id);const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`factory-design-${record.id}.zip`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(cause){setError(cause instanceof Error?cause.message:'资料包下载失败，请重试');}finally{setDownloading(false);}}
  return <section className={styles.page}>
    <header className={styles.heading}><div><h1>3D 设计</h1><span>客户方案 · {items.length} 份</span></div><button disabled={loading} onClick={()=>{setLoading(true);setAttempt(n=>n+1);}}>刷新方案</button></header>
    {error&&<p role="alert" className={styles.error}>{error}</p>}{loading&&<p role="status">正在读取客户方案…</p>}
    <div className={styles.filters}><label>搜索客户 / 公司 / 编号<input value={query} onChange={e=>setQuery(e.target.value)}/></label><label>方案类型<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">全部方案</option><option value="existing">产品配置方案</option><option value="generated">生成方案</option></select></label></div>
    <div className={styles.layout}><nav aria-label="客户设计方案" className={styles.list}>{shown.map(item=><button key={item.id} disabled={fileBusy||downloading} aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);setFiles([]);rememberWorkspace({design:item.id});}}><strong>{item.input.name} · {item.input.company||'未填写公司'}</strong><span>{customerDesignInfo(item.input.design!).name}</span><small>{new Date(item.createdAt).toLocaleString('zh-CN')} · {item.previewReady?'效果图已保存':'缺少效果图'}</small></button>)}{!loading&&!shown.length&&<p>{items.length?'没有符合条件的方案':'尚无客户提交的设计方案'}</p>}</nav>
      {record&&design&&info&&<article className={styles.detail}><div className={styles.detailHeading}><div><h2>{info.name}</h2><small>{record.id}</small></div><button className={styles.primary} disabled={downloading||fileBusy} onClick={()=>void download()}>{downloading?'正在打包…':'下载工厂资料包 ZIP'}</button></div>
        <div className={styles.preview}>{record.previewReady?<img src={api.resolveUrl(`/api/cms/inquiries/${record.id}/preview`)} alt="客户提交的设计效果图"/>:<p>客户尚未提交效果图</p>}</div>
        <div className={styles.blocks}><section><h3>客户与需求</h3><dl>{[['客户',record.input.name],['公司',record.input.company],['联系方式',record.input.contact||record.input.businessEmail],['数量',record.input.quantity],['期望交期',record.input.launchDate],['产品目标',record.input.productGoal],['包装要求',record.input.packagingPreference],['认证要求',record.input.certificationConstraints],['备注',record.input.notes]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section><h3>方案规格</h3><dl>{info.specifications.map(s=><div key={s.key}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}<div><dt>开合状态</dt><dd>{design.assemblyState==='open'?'打开':'闭合'}</dd></div></dl>{info.href&&<a href={info.href} target="_blank" rel="noreferrer">查看规格配置 ↗</a>}</section></div>
        <section className={styles.package}><h3>工厂资料包</h3><ul><li>效果图：{record.previewReady?'已保存':'待补充'}</li><li>客户需求、规格表、配置数据、文件校验清单</li><li>{design.kind==='existing'?'产品基础 GLB 模型（可用时附入）；颜色与 Logo 以效果图为准':'客户生成的 GLB 模型（可用时附入）'}</li></ul><h3>生产附件 · {files.length} 个</h3><label className={styles.upload}>上传 Logo / 印刷原稿 / CAD / 打样文件<input type="file" disabled={fileBusy||downloading} accept=".pdf,.png,.jpg,.jpeg,.webp,.ai,.psd,.svg,.dxf,.dwg,.step,.stp,.stl,.glb,.zip,.xlsx,.docx,.txt" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label><small>单个文件 ≤ 20 MB · 最多 20 个 · 总计 ≤ 100 MB</small>{fileBusy&&<p role="status">正在处理附件…</p>}<ul>{files.map(file=><li key={file.id}><a href={api.resolveUrl(`/api/cms/inquiries/${record.id}/factory-files/${file.id}`)}>{file.name}</a> · {(file.size/1024).toFixed(1)} KB <button disabled={fileBusy||downloading} onClick={()=>void remove(file)}>删除</button></li>)}</ul>{!files.length&&<p>尚未上传生产附件。</p>}</section>
      </article>}
    </div>
  </section>;
}
