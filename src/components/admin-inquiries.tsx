'use client';

import {useEffect, useState, useRef, useCallback} from 'react';
import {AdminKnowledgePicker} from './admin-knowledge';
import {encodeStudioShare} from '@/lib/studio-delivery';
import type {StoredInquiry} from '@/lib/inquiry-admin-contracts';
import type {createAdminApi} from '@/lib/admin-api';
import styles from './admin-managed-content.module.css';
import layout from './admin-inquiries.module.css';

type Api = ReturnType<typeof createAdminApi>;
const statusNames = {pending_review: '待确认', approved: '已确认，未发送', queued: '发送中', sent: '发件服务已接收', retryable_error: '发送失败 / 待核查', failed: '发送失败'};

function SmtpConfigurationError() {
  return <p className={styles.error} role="alert">SMTP_NOT_CONFIGURED：尚未配置发件服务。询盘可以保存和审核，但不能发送邮件。请先配置专用发件邮箱。</p>;
}

export function AdminInquiries({api, onDirty, onBusy}: {api: Api; onDirty?: (value: boolean) => void; onBusy?: (value: boolean) => void}) {
  const [draftDirty, setDraftDirty] = useState(false), [editorBusy, setEditorBusy] = useState(false);
  const protectedRef = useRef(false);
  const trackDirty = useCallback((value: boolean) => {protectedRef.current = value; setDraftDirty(value);}, []);
  useEffect(() => {onDirty?.(draftDirty); return () => onDirty?.(false);}, [draftDirty, onDirty]);
  const [items, setItems] = useState<StoredInquiry[]>([]);
  const [selected, setSelected] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [ragConfigured, setRagConfigured] = useState(false);
  const [embeddingConfigured, setEmbeddingConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {onBusy?.(loading || editorBusy); return () => onBusy?.(false);}, [loading, editorBusy, onBusy]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const data = await api.listInquiries();
      setItems(data.items); setSmtpConfigured(data.smtpConfigured); setRagConfigured(data.ragConfigured); setEmbeddingConfigured(data.embeddingConfigured);
      setSelected((current) => data.items.some((item) => item.id === current) ? current : data.items[0]?.id ?? '');
    } catch (error) { setError(error instanceof Error ? error.message : '读取询盘失败'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    void api.listInquiries().then((data) => {
      if (!active) return;
      setItems(data.items); setSmtpConfigured(data.smtpConfigured); setRagConfigured(data.ragConfigured); setEmbeddingConfigured(data.embeddingConfigured); setSelected(data.items.find(item => window.location.hash === `#inquiries/${item.id}`)?.id ?? data.items[0]?.id ?? ''); setLoading(false);
    }).catch((error: unknown) => { if (active) { setError(error instanceof Error ? error.message : '读取询盘失败'); setLoading(false); } });
    return () => { active = false; };
  }, [api]);
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => { void api.listInquiries().then(data => { if (active && !protectedRef.current) setItems(data.items); }).catch(() => { if(active) setError('自动刷新失败，请点击刷新列表重试。'); }); }, 30000);
    return () => {active = false; clearInterval(timer);};
  }, [api]);
  const current = items.find((item) => item.id === selected);
  const visible = items.filter((item) => `${item.input.name} ${item.input.company} ${item.input.contact ?? item.input.businessEmail} ${item.input.sku}`.toLowerCase().includes(search.toLowerCase()));
  return <div className={styles.stack}>
    <header className={styles.heading}><div><p>客户询盘</p><h1>客户留资与包装方案</h1><span>未读 {items.filter(item => !item.readAt).length} 条 · 每 30 秒更新 · 最近 200 条</span></div><button type="button" onClick={() => void load()} disabled={loading || draftDirty || editorBusy}>刷新列表</button></header>
    {error && <div role="alert" className={styles.error}>{error}<button type="button" disabled={draftDirty || editorBusy} onClick={() => void load()}>重试</button></div>}
    {loading ? <p role="status">正在读取询盘…</p> : !items.length ? <>{!smtpConfigured && <SmtpConfigurationError />}<section className={styles.moduleState}><h2>还没有询盘</h2><p>客户通过网站提交后会出现在这里。没有客户邮件会自动发出。</p></section></> :
      <div className={styles.workbench}><aside className={styles.records}><div className={styles.search}><input aria-label="搜索询盘" placeholder="姓名、联系方式或产品" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className={styles.recordList}>{visible.map((item) => <button type="button" key={item.id} data-active={selected === item.id} disabled={editorBusy} onClick={() => {if (draftDirty && !window.confirm("邮件草稿尚未保存，是否放弃修改？")) return; setSelected(item.id);}}><strong>{!item.readAt ? '● 未读 · ' : ''}{item.input.company || item.input.name}</strong><small>{item.input.design ? '包装方案 · ' : ''}{item.input.category} · {item.input.contact || item.input.businessEmail}</small><span>{statusNames[item.email.status]}</span></button>)}{!visible.length && <p>没有匹配的询盘</p>}</div></aside>
      {current && <InquiryEditor key={`${current.id}:${current.version}`} record={current} smtpConfigured={smtpConfigured} ragConfigured={ragConfigured} embeddingConfigured={embeddingConfigured} api={api} onDirty={trackDirty} onBusy={setEditorBusy} onUpdated={(record) => setItems((all) => all.map((item) => item.id === record.id ? record : item))} />}</div>}
  </div>;
}

export function InquiryEditor({record, smtpConfigured, ragConfigured = false, embeddingConfigured = false, api, onUpdated, onDirty, onBusy}: {record: StoredInquiry; smtpConfigured: boolean; ragConfigured?: boolean; embeddingConfigured?: boolean; api: Api; onUpdated: (record: StoredInquiry) => void; onDirty?: (value: boolean) => void; onBusy?: (value: boolean) => void}) {
  const [subject, setSubject] = useState(record.email.subject);
  const [body, setBody] = useState(record.email.body);
  const [confirmed, setConfirmed] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [generationConfirmed, setGenerationConfirmed] = useState(false);
  const [retrievalMode, setRetrievalMode] = useState<'bm25' | 'hybrid'>('bm25');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const dirty = subject !== record.email.subject || body !== record.email.body;
  useEffect(() => {onDirty?.(dirty); return () => onDirty?.(false);}, [dirty, onDirty]);
  useEffect(() => {onBusy?.(Boolean(busy)); return () => onBusy?.(false);}, [busy, onBusy]);
  useEffect(() => {const listener = (e: BeforeUnloadEvent) => {if (dirty) e.preventDefault();}; window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);}, [dirty]);
  const locked = ['sent', 'queued'].includes(record.email.status);
  const canSend = Boolean(record.input.businessEmail) && smtpConfigured && !dirty && ['approved', 'retryable_error'].includes(record.email.status) && record.delivery.attempts < 3;
  let designLink: string | undefined;
  if (record.input.design?.kind === 'existing') {
    try { designLink = `/${record.locale}/studio/#${encodeStudioShare(record.input.design)}`; }
    catch { /* Older or unsupported packaging keeps its saved details and preview. */ }
  }
  async function perform(action: string, operation: () => Promise<StoredInquiry>) {
    setBusy(action); setError('');
    try { onUpdated(await operation()); }
    catch (error) { setError(error instanceof Error ? error.message : '操作失败，请刷新后重试'); }
    finally { setBusy(''); setSendingConfirmation(false); }
  }
  const fields = [['客户', record.input.name], ['联系方式', record.input.contact || record.input.businessEmail], ['护理品类', record.input.category], ['公司', record.input.company], ['市场', record.input.market], ['产品', record.input.sku], ['数量', record.input.quantity], ['预算', record.input.budget], ['上市时间', record.input.launchDate], ['产品目标', record.input.productGoal], ['包装偏好', record.input.packagingPreference], ['配置', record.input.configuration], ['合规要求', record.input.certificationConstraints], ['备注', record.input.notes], ['销售方式', record.input.salesChannel ?? ''], ['销售平台', record.input.salesPlatforms?.join(' · ') ?? ''], ['功效', record.input.efficacy ?? ''], ['颜色', record.input.productColor ?? ''], ['质地', record.input.texture ?? ''], ['其他要求', record.input.otherNeeds ?? ''], ['完整顾问对话', record.input.conversation?.map(message => `${message.role === 'user' ? '客户' : '顾问'}：${message.content}`).join('\n\n') ?? '']];
  return <section className={styles.editor}>
    <header className={styles.editorHeader}><div><p>{statusNames[record.email.status]}</p><h2>{record.input.company || record.input.name}</h2><span>{new Date(record.createdAt).toLocaleString('zh-CN')} · 版本 {record.version}</span></div></header>
    <div className={layout.content}>
      <div className={layout.actions}><button type="button" disabled={Boolean(record.readAt) || Boolean(busy)} onClick={() => void perform('read', () => api.markInquiryRead(record.id))}>{record.readAt ? '已读' : '标记已读'}</button></div>
      <p>通知状态：{record.notificationStatus ? {pending: '等待发送', sending: '正在发送', sent: '发信服务已接收', failed: '发送失败或结果待核查', unconfigured: '发信服务尚未配置，留资已保存'}[record.notificationStatus] : '历史记录'}</p>
      {record.notificationStatus === 'failed' && <button type="button" disabled={Boolean(busy)} onClick={() => {if(window.confirm('请先检查通知邮箱，确认未收到这条通知后再重试，避免重复。')) void perform('notify', () => api.retryInquiryNotification(record.id));}}>重试邮件通知</button>}
      {record.input.design && <section aria-label="客户包装方案"><h3>客户包装方案</h3>{designLink && <a href={designLink} target="_blank" rel="noopener noreferrer">复原包装配置（客户标志以效果图为准）</a>}<p>{record.input.design.sku} · {record.input.design.kind === 'existing' ? '现有包装定制' : '新造型'}</p>{record.previewReady ? <a href={api.resolveUrl(`/api/cms/inquiries/${record.id}/preview`)} target="_blank" rel="noopener noreferrer">查看 / 保存方案效果图</a> : <p>配置已保存，暂无效果图。</p>}<dl>{Object.entries(record.input.design.specifications).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>}
      {!smtpConfigured && <SmtpConfigurationError />}
      {record.delivery.error && <p className={styles.error} role="alert">{record.delivery.error === 'SMTP_NOT_CONFIGURED' ? '请先配置专用发件邮箱。' : '上次发送失败或结果未知。请先在发件服务核对是否已发出，再决定是否重试，避免重复发送。'} 尝试次数：{record.delivery.attempts}/3</p>}
      {record.email.status === 'sent' && <p className={styles.notice} role="status">发件服务已接收邮件；不代表客户已经阅读或进入收件箱。邮件标识：{record.delivery.messageId}</p>}
      <details><summary>查看客户提交的完整需求</summary><dl className={layout.details}>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></details>
      <details><summary>查看六部分初步整理（规则生成，需人工核实）</summary>{Object.entries(record.proposal.sections).map(([key, value], index) => <section key={key}><h3>{['客户需求', '建议配置', '待补充信息', '商务待确认项', '下一步资料', '回复参考'][index]}</h3><p>{value}</p></section>)}</details>
      <p className={layout.recipient}>联系方式：<strong>{record.input.contact || record.input.businessEmail}</strong></p>
      {!record.input.businessEmail && <p>客户未留邮箱，请使用其微信或 WhatsApp 联系。下方草稿可作为回复参考。</p>}
      {!locked && <section className={layout.generation} aria-label="免费模板草稿"><h3>免费回复模板</h3><button disabled={dirty || Boolean(busy)} onClick={() => {if (window.confirm('重新生成将替换当前已保存的草稿，是否继续？')) void perform('template', () => api.generateInquiryTemplate(record));}}>重新生成免费模板</button><AdminKnowledgePicker api={api} disabled={Boolean(busy)} onUse={value => {if (body.length + value.length + 2 > 20000) {setError('正文过长，请精简后引用'); return;} setBody(current => [current, value].filter(Boolean).join('\n\n')); setConfirmed(false);}}/></section>}
      {!locked && ragConfigured && <details className={layout.generation}><summary>可选：模型辅助草稿</summary><section aria-label="资料辅助草稿">
        <h3>依据资料生成草稿</h3>
        {!ragConfigured && <p className={styles.error} role="alert">RAG_NOT_CONFIGURED：尚未配置文本生成服务。仍可手动编辑和审核草稿。</p>}
        <label>检索方式 <select value={retrievalMode} disabled={Boolean(busy)} onChange={event => { setRetrievalMode(event.target.value as 'bm25' | 'hybrid'); setGenerationConfirmed(false); }}><option value="bm25">关键词（BM25）</option><option value="hybrid" disabled={!embeddingConfigured}>关键词 + 语义（混合检索）</option></select></label>
        <label className={layout.confirmCheck}><input type="checkbox" checked={generationConfirmed} disabled={Boolean(busy)} onChange={event => setGenerationConfirmed(event.target.checked)} />允许将产品需求和已审核资料片段交给外部服务处理，可能产生费用；生成成功后替换当前草稿，仍需人工审核。</label>
        {dirty && <p role="status">请先保存当前修改，再生成新草稿。</p>}
        <div className={layout.actions}><button type="button" disabled={!ragConfigured || !generationConfirmed || dirty || Boolean(busy)} onClick={() => void perform('generate', () => api.generateInquiryEmail(record, retrievalMode, generationConfirmed))}>{busy === 'generate' ? '正在检索资料并生成…' : '生成邮件草稿'}</button></div>
      </section></details>}
      {record.grounding && <details className={layout.citations}><summary>查看草稿引用（{record.grounding.citations.length} 条，需逐条核实）</summary><p>资料存在不代表结论准确；手动改写后仍需核对原文。检索：{record.grounding.mode}。</p>{record.grounding.citations.map((citation, index) => <section key={`${citation.chunkId}:${index}`}><h4>{citation.title} · {citation.location} · v{citation.version}</h4><blockquote>{citation.quote}</blockquote></section>)}</details>}
      <div className={styles.form}>
        <label><span>邮件主题</span><input value={subject} maxLength={200} disabled={locked || Boolean(busy)} onChange={(event) => setSubject(event.target.value)} /></label>
        <label><span>邮件正文</span><textarea rows={13} value={body} maxLength={20_000} disabled={locked || Boolean(busy)} onChange={(event) => setBody(event.target.value)} /></label>
      </div>
      {record.email.status === 'pending_review' && <label className={layout.confirmCheck}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />我已核对收件人、内容、报价/起订量/交期和合规表述，允许发送此版本。</label>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={layout.actions}>
        <button type="button" disabled={dirty || Boolean(busy)} onClick={() => {const url = URL.createObjectURL(new Blob([`收件人：${record.input.businessEmail || record.input.contact || '未提供'}\n主题：${record.email.subject}\n\n${record.email.body}`], {type: 'text/plain;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = '客户回复草稿.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);}}>下载回复草稿</button>
        <button type="button" disabled={locked || !dirty || Boolean(busy)} onClick={() => void perform('save', () => api.updateInquiryEmail(record, {subject, body}))}>{busy === 'save' ? '保存中…' : '保存邮件草稿'}</button>
        <button type="button" disabled={dirty || !confirmed || record.email.status !== 'pending_review' || Boolean(busy)} onClick={() => void perform('approve', () => api.approveInquiryEmail(record))}>{busy === 'approve' ? '确认中…' : '确认此版本'}</button>
        <button type="button" disabled={!canSend || Boolean(busy)} onClick={() => setSendingConfirmation(true)}>发送邮件</button>
      </div>
      {sendingConfirmation && <div className={styles.confirm} role="dialog" aria-modal="true" aria-label="发送确认"><p>将发送至 {record.input.businessEmail}。{record.delivery.attempts > 0 ? '这是一次重试，请确认此前未送达。' : ''}</p><button type="button" disabled={Boolean(busy)} onClick={() => setSendingConfirmation(false)}>取消</button><button type="button" disabled={Boolean(busy)} onClick={() => void perform('send', () => api.sendInquiryEmail(record.id))}>{busy === 'send' ? '发送中…' : '确认发送'}</button></div>}
    </div>
  </section>;
}
