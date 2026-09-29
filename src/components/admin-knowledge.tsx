'use client';

import {useEffect, useState} from 'react';
import type {createAdminApi} from '@/lib/admin-api';
import type {KnowledgeDocument, KnowledgeHit} from '@/lib/knowledge-contracts';
import styles from './admin-business.module.css';

type Api = ReturnType<typeof createAdminApi>;
const languages = {zh: '中文', en: 'English', fr: 'Français', es: 'Español', ru: 'Русский', ar: 'العربية'};
const stateNames = {draft: '待审核', active: '已启用', archived: '已归档'};
const parseNames = {ready: '已解析', needs_ocr: '需要文字识别', failed: '解析失败'};
const tags = (value: string) => [...new Set(value.split(/[,，\s]+/).filter(Boolean))];

export function AdminKnowledgePicker({api, disabled = false, onUse}: {api: Api; disabled?: boolean; onUse: (text: string) => void}) {
  const [query, setQuery] = useState(''), [hits, setHits] = useState<KnowledgeHit[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [searched, setSearched] = useState(false);
  return <details className={styles.preview}><summary>从公司资料库引用已审核资料</summary>

    <div className={styles.toolbar}><label className={styles.field}>资料关键词<input value={query} maxLength={2000} onChange={e => setQuery(e.target.value)}/></label>
      <button type="button" disabled={disabled || busy || !query.trim()} onClick={() => {setBusy(true); setError(''); void api.searchKnowledge({query, mode: 'bm25', audience: 'customer', limit: 6}).then(result => {setHits(result.items); setSearched(true);}).catch(cause => setError(cause instanceof Error ? cause.message : '检索失败，请重试')).finally(() => setBusy(false));}}>{busy ? '检索中…' : '检索资料'}</button></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {searched && !hits.length && <p>没有匹配资料。请先在“栏目内容 → 数据库”上传并审核启用，或更换关键词。</p>}
    {hits.map(hit => <section key={hit.chunkId}><h3>{hit.title} · {hit.location}</h3><p>{hit.text}</p><button type="button" disabled={disabled} onClick={() => onUse(`${hit.text}\n（资料：${hit.title} · ${hit.location}）`)}>引用这段资料</button></section>)}
  </details>;
}

export function AdminKnowledge({api, onDirty, onBusy}: {api: Api; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void}) {
  const [items, setItems] = useState<KnowledgeDocument[]>([]), [selected, setSelected] = useState<KnowledgeDocument>();
  const [title, setTitle] = useState(''), [locale, setLocale] = useState<KnowledgeDocument['locale']>('zh'), [skus, setSkus] = useState('');
  const [text, setText] = useState(''), [file, setFile] = useState<File>(), [mode, setMode] = useState<'text' | 'file'>('file');
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState('正在读取资料'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('');
  const [editTitle, setEditTitle] = useState(''), [editSkus, setEditSkus] = useState(''), [reviewed, setReviewed] = useState(false);
  const [visibility, setVisibility] = useState<KnowledgeDocument['visibility']>('internal');
  const [chunks, setChunks] = useState<Array<{location: string; text: string}>>([]);
  useEffect(() => {onDirty(dirty); return () => onDirty(false);}, [dirty, onDirty]);
  useEffect(() => {onBusy(Boolean(busy)); return () => onBusy(false);}, [busy, onBusy]);
  useEffect(() => {const listener = (e: BeforeUnloadEvent) => {if (dirty) e.preventDefault();}; window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);}, [dirty]);
  useEffect(() => {let cancelled = false; api.listKnowledge().then(result => {if (!cancelled) setItems(result.items);}).catch(cause => {if (!cancelled) setError(cause instanceof Error ? cause.message : '资料读取失败');}).finally(() => {if (!cancelled) setBusy('');}); return () => {cancelled = true;};}, [api]);
  const refresh = async () => setItems((await api.listKnowledge()).items);
  async function run(label: string, action: () => Promise<void>) {setBusy(label); setError(''); setNotice(''); try {await action();} catch (cause) {setError(cause instanceof Error ? cause.message : '操作失败，请重试');} finally {setBusy('');}}
  const mayLeave = () => !dirty || window.confirm('有未保存的资料修改，是否放弃？');
  function choose(doc: KnowledgeDocument) {setSelected(doc); setEditTitle(doc.title); setEditSkus(doc.skus.join(', ')); setVisibility(doc.visibility); setReviewed(false); setDirty(false);}
  async function open(doc: KnowledgeDocument) {const result = await api.knowledgeContents(doc.id); choose(result.document); setChunks(result.chunks);}
  async function update(status: KnowledgeDocument['status']) {
    if (!selected) return;
    const doc = await api.updateKnowledge(selected, {title: editTitle, skus: tags(editSkus), visibility, status, reviewed});
    choose(doc); await refresh(); setNotice(`资料已保存：${stateNames[doc.status]}。${doc.status === 'active' ? '现在可用于关键词检索。' : ''}`);
  }
  const shown = items.filter(doc => (!filter || doc.status === filter) && `${doc.title} ${doc.fileName} ${doc.skus.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const locked = Boolean(busy);
  return <div className={styles.workspace}>
    <header><p className={styles.eyebrow}>公司资料库</p><h1>数据库</h1></header>
    {error && <div role="alert" className={styles.error}>{error}</div>}{notice && <div role="status" className={styles.notice}>{notice}</div>}{busy && <p role="status">{busy}…</p>}
    <section className={styles.panel}><div className={styles.toolbar}><h2>资料目录 · {items.length}</h2><button disabled={locked} onClick={() => void run('刷新目录', refresh)}>刷新目录</button><button disabled={locked} onClick={() => {if (mayLeave()) {setSelected(undefined); setDirty(Boolean(title || text || file));}}}>新增资料</button></div>
      <div className={styles.filters}><label className={styles.field}>搜索标题、文件或产品编号<input value={query} onChange={e => setQuery(e.target.value)}/></label><label className={styles.field}>状态<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">全部状态</option>{Object.entries(stateNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label></div>
      <div className={styles.tableWrap}><table><thead><tr><th>资料</th><th>状态与用途</th><th>解析结果</th><th>操作</th></tr></thead><tbody>{shown.map(doc => <tr key={doc.id}><td><strong>{doc.title}</strong><small>{doc.fileName} · {languages[doc.locale]}</small></td><td>{stateNames[doc.status]}<small>{doc.visibility === 'customer' ? '允许对客使用' : '仅内部使用'}</small></td><td>{parseNames[doc.parseState]}<small>{doc.chunkCount} 段</small></td><td><button disabled={locked} onClick={() => {if (mayLeave()) void run('打开资料', () => open(doc));}}>查看与维护</button></td></tr>)}</tbody></table></div>
      {!locked && !shown.length && <p className={styles.empty}>没有符合条件的资料，可在下方新增。</p>}
    </section>
    {!selected ? <section className={styles.panel}><h2>新增资料</h2><form onSubmit={e => {e.preventDefault(); void run('保存并解析资料', async () => {
      const metadata = {title, locale, skus: tags(skus)};
      try {const doc = mode === 'file' ? await api.uploadKnowledge(file!, metadata) : await api.createKnowledgeText({...metadata, text}); setTitle(''); setText(''); setFile(undefined); setSkus(''); setDirty(false); await open(doc); setNotice('资料已保存，请核对解析内容后启用。');} finally {await refresh();}
    });}}><fieldset disabled={locked} className={styles.form}>
      <label className={styles.field}>资料标题<input required maxLength={200} value={title} onChange={e => {setTitle(e.target.value); setDirty(true);}}/></label>
      <div className={styles.twoColumns}><label className={styles.field}>资料语言<select value={locale} onChange={e => {setLocale(e.target.value as typeof locale); setDirty(true);}}>{Object.entries(languages).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label><label className={styles.field}>关联产品编号（逗号分隔）<input value={skus} onChange={e => {setSkus(e.target.value); setDirty(true);}}/></label></div>
      <label className={styles.field}>添加方式<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="file">上传文件</option><option value="text">填写文本</option></select></label>
      {mode === 'file' ? <label className={styles.field}>资料文件（不超过 8 MB）<input type="file" accept=".pdf,.docx,.xlsx,.csv,.txt,.md" onChange={e => {const next = e.target.files?.[0]; if (next && next.size > 8 * 1024 * 1024) {setError('文件不能超过 8 MB'); e.target.value = ''; setFile(undefined); return;} setFile(next); setDirty(true); if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, ''));}}/></label> : <label className={styles.field}>资料正文<textarea required rows={10} maxLength={500000} value={text} onChange={e => {setText(e.target.value); setDirty(true);}}/></label>}
      <p>支持 PDF、Word（DOCX）、Excel（XLSX）、CSV、TXT 和 Markdown。扫描件请先识别为文字再上传。</p><button className={styles.primary} disabled={!title.trim() || (mode === 'file' ? !file : !text.trim())}>保存并解析</button>
    </fieldset></form></section> : <section className={styles.panel}><h2>维护资料 · 版本 {selected.version}</h2><fieldset className={styles.form} disabled={locked}>
      <label className={styles.field}>资料标题<input required maxLength={200} value={editTitle} onChange={e => {setEditTitle(e.target.value); setReviewed(false); setDirty(true);}}/></label><label className={styles.field}>关联产品编号<input value={editSkus} onChange={e => {setEditSkus(e.target.value); setReviewed(false); setDirty(true);}}/></label>
      <label className={styles.field}>使用范围<select value={visibility} onChange={e => {setVisibility(e.target.value as typeof visibility); setReviewed(false); setDirty(true);}}><option value="internal">仅内部使用</option><option value="customer">允许对客使用</option></select></label>
      {visibility === 'customer' && <label className={styles.check}><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)}/>已核对内容，允许网站顾问及业务文案引用</label>}
      {selected.parseState !== 'ready' && <p role="alert" className={styles.error}>{parseNames[selected.parseState]}。原文件已保留，请下载检查并重新上传可读取的版本。</p>}
      {selected.warnings.map((warning, i) => <p key={i}>{warning}</p>)}
      <div className={styles.toolbar}><button disabled={!editTitle.trim() || (selected.status === 'active' && visibility === 'customer' && !reviewed)} onClick={() => void run('保存资料', () => update(selected.status))}>保存修改</button><button className={styles.primary} disabled={!editTitle.trim() || selected.parseState !== 'ready' || (visibility === 'customer' && !reviewed)} onClick={() => void run('启用资料', () => update('active'))}>审核并启用</button><button disabled={selected.status === 'archived'} onClick={() => void run('归档资料', () => update('archived'))}>归档</button><a href={api.resolveUrl(`/api/cms/knowledge/documents/${selected.id}/file`)}>下载原件</a></div>
    </fieldset><details className={styles.preview} open><summary>解析内容 · {chunks.length} 段</summary>{chunks.map((chunk, i) => <section key={i}><h3>{chunk.location}</h3><p>{chunk.text}</p></section>)}{!chunks.length && <p>没有可读取的文字。</p>}</details></section>}
    <AdminKnowledgePicker api={api} disabled={locked} onUse={value => {if (!mayLeave()) return; setSelected(undefined); setMode('text'); setTitle('引用资料整理'); setText(value); setDirty(true);}}/>
  </div>;
}
