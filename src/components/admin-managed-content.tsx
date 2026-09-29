'use client';

/* eslint-disable @next/next/no-img-element */
import {Fragment, useEffect, useMemo, useRef, useState} from 'react';

import {
  AdminApiError,
  createAdminApi,
  type ManagedContent,
  type ManagedContentFieldsByKind,
  type ManagedContentKind,
  type MediaAsset
} from '@/lib/admin-api';

import {AdminFontSize} from './admin-font-size';
import {fontFields, fontStyle, setFontSize, type FontField} from '@/lib/cms-typography';
import {AdminMediaField} from './admin-media-field';

import styles from './admin-managed-content.module.css';

type AdminApi = ReturnType<typeof createAdminApi>;
type FieldValue = string | number | null;
type EditableFields = ManagedContentFieldsByKind[ManagedContentKind];

type FieldDefinition = {
  key: string;
  label: string;
  input: 'text' | 'textarea' | 'number' | 'unit' | 'media' | 'pdf';
  rows?: number;
  hint?: string;
};

const moduleCopy: Record<ManagedContentKind, {eyebrow: string; title: string; body: string; search: string}> = {
  pages: {eyebrow: '页面首屏', title: '网站页面', body: '选择页面，修改中文主标题与介绍。', search: '搜索页面'},
  products: {eyebrow: '成品目录', title: '产品', body: '维护产品名称、卖点、规格、起订量和主图。', search: '按名称或编号搜索'},
  formats: {eyebrow: '技术膜型', title: '膜型', body: '维护膜型名称、功效方向、规格、包装和主图。', search: '按名称或编号搜索'},
  credentials: {eyebrow: '证书原件', title: '专利资质', body: '维护证书名称、编号、权利人与原图。', search: '按名称或专利号搜索'}
};

const fieldDefinitions: Record<ManagedContentKind, FieldDefinition[]> = {
  pages: [
    {key: 'heroTitle', label: '主标题', input: 'textarea', rows: 3},
    {key: 'heroBody', label: '介绍', input: 'textarea', rows: 6}
  ],
  products: [
    {key: 'name', label: '产品名称', input: 'text'},
    {key: 'description', label: '产品介绍', input: 'textarea', rows: 5},
    {key: 'highlights', label: '产品亮点', input: 'textarea', rows: 4, hint: '一行填写一个亮点'},
    {key: 'applications', label: '功效与用途', input: 'textarea', rows: 4, hint: '一行填写一个方向'},
    {key: 'netWeight', label: '净含量', input: 'text'},
    {key: 'packFormat', label: '包装方式', input: 'text'},
    {key: 'moqQuantity', label: '参考起订量', input: 'number'},
    {key: 'moqUnit', label: '起订单位', input: 'unit'},
    {key: 'imageMediaId', label: '产品主图', input: 'media'}
  ],
  formats: [
    {key: 'name', label: '膜型名称', input: 'text'},
    {key: 'effects', label: '功效与肤感', input: 'textarea', rows: 4},
    {key: 'specification', label: '参考规格', input: 'text'},
    {key: 'moq', label: '参考起订量', input: 'text'},
    {key: 'packaging', label: '包装方式', input: 'text'},
    {key: 'imageMediaId', label: '膜型图片', input: 'media'}
  ],
  credentials: [
    {key: 'title', label: '证书名称', input: 'text'},
    {key: 'kind', label: '证书类型', input: 'text'},
    {key: 'number', label: '专利号', input: 'text'},
    {key: 'rightsholder', label: '证书记载权利人', input: 'text'},
    {key: 'imageMediaId', label: '证书原图', input: 'media'},
    {key: 'pdfMediaId', label: 'PDF 附件', input: 'pdf'}
  ]
};

const aboutFields: FieldDefinition[] = [
  {key: 'profileTitle', label: '公司介绍标题', input: 'text'},
  {key: 'profileBody', label: '公司介绍正文', input: 'textarea', rows: 8},
  {key: 'contactEmail', label: '公开邮箱', input: 'text'},
  {key: 'contactWhatsapp', label: 'WhatsApp（含国家区号）', input: 'text'},
  {key: 'whatsappQrMediaId', label: 'WhatsApp 二维码', input: 'media'},
  {key: 'contactWechat', label: '微信号', input: 'text'},
  {key: 'wechatQrMediaId', label: '微信二维码', input: 'media'},
  {key: 'contactTiktok', label: 'TikTok 账号（不含 @）', input: 'text'},
  {key: 'tiktokQrMediaId', label: 'TikTok 二维码', input: 'media'},
  {key: 'contactInstagram', label: 'Instagram 账号（不含 @）', input: 'text'},
  {key: 'contactFacebook', label: 'Facebook 联系信息', input: 'text'},
  {key: 'videoId', label: 'YouTube 视频编号', input: 'text', hint: '粘贴视频链接中 v= 后面的 11 位编号，例如 Em685F3Ec2A'},
  {key: 'videoSource', label: '视频来源网站', input: 'text', hint: '填写 https:// 开头的完整网址'},
  {key: 'videoSourceLabel', label: '视频来源名称', input: 'text'}
];

export function ManagedContentView({
  api,
  kind,
  media,
  onUpload,
  uploadBusy,
  recordIds,
  title,
  onDirty,
  onBusy,
  onPublished
}: {
  api: AdminApi;
  kind: ManagedContentKind;
  media: MediaAsset[];
  onUpload: (file: File) => Promise<MediaAsset>;
  uploadBusy: boolean;
  recordIds?: string;
  title?: string;
  onDirty?: (dirty: boolean) => void;
  onBusy?: (busy: boolean) => void;
  onPublished: () => Promise<void>;
}) {
  const copy = {...moduleCopy[kind], ...(title ? {title} : {})};
  const [records, setRecords] = useState<Array<ManagedContent>>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<'save' | 'publish' | ''>('');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    confirmButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setConfirming(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirming, busy]);

  useEffect(() => {onDirty?.(dirty); return () => onDirty?.(false);}, [dirty, onDirty]);
  useEffect(() => {onBusy?.(Boolean(busy)); return () => onBusy?.(false);}, [busy, onBusy]);

  const selected = records.find((record) => record.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => `${record.label} ${record.id} ${fieldSearchText(record.fields)}`.toLowerCase().includes(term));
  }, [query, records]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState('loading');
      setError('');
      try {
        const all = await api.listManagedContent(kind);
        const ids = recordIds?.split(',');
        const next = ids ? ids.flatMap(id => all.filter(record => record.id === id)) : all;
        if (cancelled) return;
        setRecords(next);
        const first = next[0];
        setSelectedId(first?.id ?? '');
        setDraft(first?.fields ?? null);
        setDirty(false);
        setState('ready');
      } catch (cause) {
        if (cancelled) return;
        setError(messageFrom(cause));
        setState('error');
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [api, kind, recordIds]);

  function choose(record: ManagedContent) {
    if (dirty && !window.confirm('当前修改尚未保存，确认切换到其他内容吗？')) return;
    setSelectedId(record.id);
    setDraft(record.fields);
    setDirty(false);
    setError('');
    setNotice('');
    setConfirming(false);
  }

  function changeField(key: string, value: FieldValue) {
    setDraft((current) => current ? ({...current, [key]: value} as EditableFields) : current);
    setDirty(true);
    setError('');
    setNotice('');
  }

  async function save(): Promise<ManagedContent | null> {
    if (!selected || !draft) return null;
    setBusy('save');
    setError('');
    try {
      const saved = await api.updateManagedContent(
        kind,
        selected.id,
        selected.version,
        draft as ManagedContentFieldsByKind[typeof kind]
      );
      setRecords((current) => replaceRecord(current, saved));
      setDraft(saved.fields);
      setDirty(false);
      setNotice('草稿已保存。');
      return saved;
    } catch (cause) {
      setError(messageFrom(cause));
      return null;
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!selected || !draft) return;
    setBusy('publish');
    setError('');
    try {
      let current = selected;
      if (dirty) {
        current = await api.updateManagedContent(
          kind,
          selected.id,
          selected.version,
          draft as ManagedContentFieldsByKind[typeof kind]
        );
        setRecords((items) => replaceRecord(items, current));
        setDraft(current.fields);
        setDirty(false);
      }
      const result = await api.publishManagedContent(kind, current.id, current.version);
      if (result.status === 'building') {
        setNotice('已开始发布，正在生成全部语言的网站页面。');
        await api.waitForRelease(result.releaseId);
      }
      const published = result.status === 'building'
        ? (await api.listManagedContent(kind)).find((item) => item.id === current.id)
        : result;
      if (!published) throw new Error('发布已完成，但无法读取最新内容，请刷新后台。');
      setRecords((items) => replaceRecord(items, published));
      setDraft(published.fields);
      setDirty(false);
      setConfirming(false);
      setNotice('已发布到网站。');
      try {
        await onPublished();
      } catch {
        setNotice('已发布到网站，但发布记录暂未刷新。请稍后刷新后台查看。');
      }
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setBusy('');
    }
  }

  if (state === 'loading') return <ModuleState title={`正在读取${copy.title}`} body="请稍候。" />;
  if (state === 'error') return <ModuleState title={`${copy.title}读取失败`} body={error} />;
  if (!records.length) return <ModuleState title={`还没有${copy.title}`} body="初始化内容后即可在这里维护。" />;

  return (
    <div className={styles.stack}>
      <header className={styles.heading}>
        <div><p>{copy.eyebrow}</p><h1>{copy.title}</h1></div>
        <strong>{records.length} 项</strong>
      </header>

      <div className={styles.workbench}>
        <aside className={styles.records} aria-label={`${copy.title}列表`}>
          <label className={styles.search}><span className="sr-only">{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
          <div className={styles.recordList}>
            {filtered.map((record) => (
              <button key={record.id} disabled={uploadBusy || Boolean(busy)} type="button" data-active={record.id === selectedId} onClick={() => choose(record)}>
                <span data-status={record.status}>{record.status === 'published' ? '已发布' : '草稿'}</span>
                <strong>{record.label}</strong>
                <small>{record.id}</small>
              </button>
            ))}
            {!filtered.length ? <p className={styles.noResults}>没有符合条件的内容。</p> : null}
          </div>
        </aside>

        {selected && draft ? (
          <section className={styles.editor}>
            <header className={styles.editorHeader}>
              <div><p>{selected.id}</p><h2>{selected.label}</h2><span>{dirty ? '有未保存的修改' : `最近保存 ${formatDate(selected.updatedAt)}`}</span></div>
              <div>
                <button className={styles.saveButton} type="button" disabled={uploadBusy || Boolean(busy) || !dirty} onClick={() => void save()}>{busy === 'save' ? '保存中…' : '保存草稿'}</button>
                <button className={styles.publishButton} type="button" disabled={uploadBusy || Boolean(busy)} onClick={() => setConfirming(true)}>发布</button>
              </div>
            </header>

            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            {notice ? <div className={styles.notice} role="status">{notice}</div> : null}

            <div className={styles.editorBody}>
              <div className={styles.form}>


                {[...fieldDefinitions[kind], ...(kind === 'pages' && selected.id === 'about' ? aboutFields : [])].map((field) => (
                  <Fragment key={`${selected.id}-${field.key}`}><ManagedField
                    definition={field}
                    value={readField(draft, field.key)}
                    currentImage={field.key.endsWith('QrMediaId') ? 'existing' : selected.image}
                    media={media}
                    onUpload={onUpload}
                    disabled={uploadBusy || Boolean(busy)}
                    onChange={(value) => changeField(field.key, value)}
                  />{fontFields.includes(field.key as FontField) && <AdminFontSize label={field.label} value={draft.textStyles?.[field.key as FontField]} disabled={uploadBusy || Boolean(busy)} onChange={size=>{setDraft(current=>current ? {...current,textStyles:setFontSize(current.textStyles,field.key,size)} : current);setDirty(true);}} />}</Fragment>
                ))}
              </div>
              <aside className={styles.textPreview} aria-label="文字预览"><h3>文字预览</h3><small>回车换行和空行会保留，实际折行随屏幕宽度变化。</small>{[...fieldDefinitions[kind], ...(kind === 'pages' && selected.id === 'about' ? aboutFields : [])].filter(field => field.input === 'textarea' || field.input === 'text').map(field => <section key={field.key}><small>{field.label}</small><p className="cms-text" style={fontStyle(draft.textStyles, field.key)}>{String(readField(draft, field.key) || '尚未填写')}</p></section>)}</aside>
              {'imageMediaId' in draft ? (
                <aside className={styles.imagePreview}>
                  <p>当前图片</p>
                  {previewImage(api, selected, draft, media) ? <img src={previewImage(api, selected, draft, media)} alt={selected.label} /> : <div>尚未选择图片</div>}
                  <small>直接上传后会自动选中，保存草稿后保留。</small>
                </aside>
              ) : null}
            </div>

            {confirming ? (
              <div className={styles.confirmBackdrop}>
                <div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="managed-publish-title">
                  <div><p>发布确认</p><h3 id="managed-publish-title">发布“{selected.label}”？</h3><span>将保存并发布至全部语言。</span>{error ? <p className={styles.confirmError} role="alert">{error}</p> : null}</div>
                  <div><button type="button" disabled={uploadBusy || Boolean(busy)} onClick={() => setConfirming(false)}>继续修改</button><button ref={confirmButtonRef} type="button" disabled={uploadBusy || Boolean(busy)} onClick={() => void publish()}>{busy === 'publish' ? '正在翻译并发布全部语言…' : '确认发布'}</button></div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ManagedField({definition, value, currentImage, media, onChange, onUpload, disabled}: {
  definition: FieldDefinition;
  value: FieldValue;
  currentImage: string;
  media: MediaAsset[];
  onChange: (value: FieldValue) => void;
  onUpload: (file: File) => Promise<MediaAsset>;
  disabled: boolean;
}) {
  if (definition.input === 'pdf' || definition.input === 'media') {
    return <AdminMediaField label={definition.label} value={typeof value === 'string' ? value : null} media={media} kind={definition.input === 'pdf' ? 'pdf' : 'image'} disabled={disabled} currentLabel={definition.input === 'pdf' ? '无附件（清空可移除）' : currentImage ? '保留当前图片' : '请选择图片'} onUpload={onUpload} onChange={onChange} />;
  }
  if (definition.input === 'unit') {
    return <label><span>{definition.label}</span><select value={String(value ?? 'pieces')} onChange={(event) => onChange(event.target.value)}><option value="pieces">片 / 件</option><option value="bottles">瓶</option></select></label>;
  }
  if (definition.input === 'number') {
    return <label><span>{definition.label}</span><input type="number" min="1" step="1" value={typeof value === 'number' ? value : ''} placeholder="待确认" onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} /></label>;
  }
  if (definition.input === 'textarea' || (definition.input === 'text' && fontFields.includes(definition.key as FontField) && definition.key !== 'number')) {
    return <label><span>{definition.label}</span><textarea rows={definition.rows ?? 4} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />{definition.hint ? <small>{definition.hint}</small> : null}</label>;
  }
  return <label><span>{definition.label}</span><input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ModuleState({title, body}: {title: string; body: string}) {
  return <section className={styles.moduleState} role="status"><span>GT</span><h1>{title}</h1><p>{body}</p></section>;
}

function readField(fields: EditableFields, key: string): FieldValue {
  const value = (fields as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' || value === null ? value : '';
}

function fieldSearchText(fields: EditableFields): string {
  return Object.values(fields).filter((value) => typeof value === 'string' || typeof value === 'number').join(' ');
}

function replaceRecord(records: ManagedContent[], next: ManagedContent): ManagedContent[] {
  return records.map((record) => record.id === next.id ? next : record);
}

function previewImage(api: AdminApi, selected: ManagedContent, draft: EditableFields, media: MediaAsset[]): string {
  if (!('imageMediaId' in draft) || !draft.imageMediaId) return selected.image;
  const asset = media.find((item) => item.id === draft.imageMediaId);
  return asset ? api.resolveUrl(asset.url) : selected.image;
}

function messageFrom(error: unknown): string {
  if (error instanceof AdminApiError && error.status === 409) return '这项内容已在其他页面更新。请刷新后台后再修改。';
  return error instanceof Error ? error.message : '操作失败，请稍后重试。';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(date);
}
