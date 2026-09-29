'use client';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ContactMethods} from './contact-methods';
import {ChoiceField} from './choice-field';
import {createRemoteInquiry, resolveInquiryApiBaseUrl} from '@/lib/api-client';
import {inquirySchema, type InquiryInput} from '@/lib/contracts';
import type {Locale} from '@/lib/routing';

export function DownloadLeadGate({locale, sku, configuration, design, capturePreview, onClose, onComplete}: {locale: Locale; sku: string; configuration: string; design?: InquiryInput['design']; capturePreview?: () => Promise<Blob | null>; onClose: () => void; onComplete: () => void}) {
  const zh = locale === 'zh';
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const submission = useRef<{payload: string; key: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {const node = dialog.current; node?.showModal(); return () => node?.close();}, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const input = inquirySchema.safeParse({...values, sku, configuration, design, productGoal: 'Download packaging design for review', packagingPreference: sku, notes: '3D studio download request', privacyConsent: true});
    if (!input.success) {setError(zh ? '请填写姓名、联系方式和护理品类。' : 'Please fill in your name, contact and product category.'); return;}
    pending.current = true; setBusy(true); setError('');
    try {
      const base = resolveInquiryApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, process.env.NODE_ENV === 'production');
      if (!base) throw new Error('NOT_CONFIGURED');
      const payload = JSON.stringify(input.data);
      if (submission.current?.payload !== payload) submission.current = {payload, key: crypto.randomUUID()};
      const saved = await createRemoteInquiry(base, input.data, fetch, {idempotencyKey: submission.current.key, locale});
      if (capturePreview && design) {
        const preview = await capturePreview();
        if (!preview?.size) throw new Error('PREVIEW_EMPTY');
        const upload = await fetch(`${base.replace(/\/$/, '')}/inquiries/${saved.id}/preview`, {method: 'POST', headers: {'Content-Type': 'image/png', Authorization: `Bearer ${saved.accessToken}`}, body: preview, signal: AbortSignal.timeout(25_000)});
        if (!upload.ok) throw new Error('PREVIEW_SAVE_FAILED');
      }
      onComplete();
    } catch {setError(zh ? '资料或方案效果图尚未完整保存，文件尚未下载。请重试，或通过下方联系方式联系我们。' : 'Your details or design preview could not be fully saved. Please retry before downloading, or contact our team below.');}
    finally {pending.current = false; setBusy(false);}
  }
  return <dialog ref={dialog} className="download-lead-gate" onCancel={event => {event.preventDefault(); if (!busy) onClose();}} aria-labelledby="download-gate-title">
    <button className="dialog-close" type="button" disabled={busy} onClick={onClose} aria-label={zh ? '关闭' : 'Close'}>×</button>
    <p className="eyebrow">SHOWKI BIOTECH</p><h2 id="download-gate-title">{zh ? '留个联系方式，带走您的方案' : 'Your design is ready to take away'}</h2>
    <p>{zh ? '提交后即可下载。我们会根据这份包装方案与您沟通后续打样需求。' : 'Submit your details to download. Our team can follow up on samples for this design.'}</p>
    <form onSubmit={submit} className="brief-form">
      <label><span>{zh ? '姓名' : 'Name'}</span><input name="name" autoComplete="name" required maxLength={200} /></label>
      <label><span>{zh ? '联系方式' : 'Contact'}</span><input name="contact" required maxLength={254} placeholder={zh ? '微信号、WhatsApp 号码或邮箱' : 'WeChat, WhatsApp number or email'} /></label>
      <ChoiceField locale={locale} name="category" label={zh ? '护理品类' : 'Product category'} options={zh ? ['乳液', '面霜', '洁面', '精华', '水凝膜', '身体护理'] : ['Lotion', 'Cream', 'Cleanser', 'Serum', 'Hydrogel', 'Body care']} required />
      <p className="consent">{zh ? '提交即同意修齐保存联系方式与本次方案并跟进需求，资料保留 12 个月。' : 'By submitting, you agree to SHOWKI storing your contact and design for 12 months and following up on this request.'}</p>
      {error && <p role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={busy}>{busy ? (zh ? '正在提交…' : 'Submitting…') : (zh ? '提交并下载' : 'Submit & download')}</button>
    </form><ContactMethods locale={locale} />
  </dialog>;
}
