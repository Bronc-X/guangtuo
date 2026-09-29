'use client';

import {useId, useRef, useState} from 'react';
import type {MediaAsset} from '@/lib/admin-api';
import styles from './admin-media-field.module.css';

export function AdminMediaField({label, value, media, currentLabel = '保留当前图片', kind = 'image', disabled = false, onChange, onUpload}: {
  label: string; value: string | null; media: MediaAsset[]; currentLabel?: string;
  kind?: 'image' | 'pdf'; disabled?: boolean;
  onChange: (id: string | null) => void; onUpload: (file: File) => Promise<MediaAsset>;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    setError(''); setMessage('');
    const allowed = kind === 'pdf' ? ['application/pdf'] : ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError(kind === 'pdf' ? '请选择不超过 8 MB 的 PDF。' : '请选择不超过 8 MB 的 JPG、PNG 或 WebP 图片。'); return;
    }
    setUploading(true);
    try {
      const asset = await onUpload(file);
      onChange(asset.id);
      setMessage(`已选用 ${asset.name}，保存草稿后保留。`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '上传失败，请重试。'); }
    finally { setUploading(false); }
  }
  return <div className={styles.field} data-media-field>
    <label htmlFor={id}>{label}</label>
    <button type="button" disabled={disabled || uploading} onClick={() => input.current?.click()}>{uploading ? '上传中…' : kind === 'pdf' ? '上传 PDF 并选用' : '上传图片并选用'}</button>
    <input ref={input} type="file" hidden accept={kind === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'} aria-label={`上传${label}`} disabled={disabled || uploading} onChange={event => {void upload(event.target.files?.[0]); event.currentTarget.value = '';}} />
    <select id={id} value={value ?? ''} disabled={disabled || uploading} onChange={event => {onChange(event.target.value || null); setMessage(''); setError('');}}>
      <option value="">{currentLabel}</option>
      {media.filter(asset => kind === 'pdf' ? asset.mimeType === 'application/pdf' : asset.mimeType.startsWith('image/')).map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
    </select>
    <small>可以直接上传，也可从已有素材中选择。单个文件不超过 8 MB。</small>
    {uploading || message ? <small role="status">{uploading ? '正在上传，请稍候。' : message}</small> : null}
    {error ? <small className={styles.error} role="alert">{error}</small> : null}
  </div>;
}
