'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {products} from '@/data/catalog';
import {getRemoteStatus} from '@/lib/api-client';
import type {EmailDraft, InquiryInput, JobStatus, Proposal} from '@/lib/contracts';
import {localizedPath, type Locale} from '@/lib/routing';

type StoredJob = {createdAt: number; inquiry: InquiryInput; proposal: Proposal; email: EmailDraft};

const statusCopy: Record<Locale, {
  eyebrow: string;
  labels: Record<JobStatus, string>;
  preview: string;
  waiting: string;
  products: string;
  contact: string;
}> = {
  en: {
    eyebrow: 'ENQUIRY STATUS', labels: {queued: 'Enquiry saved', processing: 'Organising enquiry', completed: 'Enquiry is ready', retryable_error: 'The enquiry was not saved. Please try again', failed: 'This enquiry could not be found'},
    preview: 'Preview mode: this submission does not send an email.', waiting: 'AWAITING ADVISOR', products: 'Continue browsing', contact: 'Contact an advisor'
  },
  zh: {
    eyebrow: '询盘状态', labels: {queued: '正在保存您的选择', processing: '正在整理询盘信息', completed: '询盘信息已准备完成', retryable_error: '暂时未能保存成功，请稍后重试', failed: '暂时无法找到这份询盘信息'},
    preview: '预览模式：本次提交不会发送邮件。', waiting: '等待顾问联系', products: '继续查看产品', contact: '联系产品顾问'
  },
  fr: {
    eyebrow: 'STATUT DE LA DEMANDE', labels: {queued: 'Demande enregistrée', processing: 'Organisation de la demande', completed: 'La demande est prête', retryable_error: 'La demande n’a pas été enregistrée. Réessayez', failed: 'Cette demande est introuvable'},
    preview: 'Mode aperçu : aucun e-mail n’est envoyé.', waiting: 'EN ATTENTE DU CONSEILLER', products: 'Continuer la visite', contact: 'Contacter un conseiller'
  },
  es: {
    eyebrow: 'ESTADO DE LA CONSULTA', labels: {queued: 'Consulta guardada', processing: 'Organizando la consulta', completed: 'La consulta está lista', retryable_error: 'No se guardó la consulta. Inténtalo de nuevo', failed: 'No se encontró esta consulta'},
    preview: 'Modo de vista previa: este envío no manda ningún correo.', waiting: 'EN ESPERA DEL ASESOR', products: 'Seguir explorando', contact: 'Contactar a un asesor'
  }
};

export function JobStatusView({locale}: {locale: Locale}) {
  const copy = statusCopy[locale];
  const [job, setJob] = useState<StoredJob | null>(null);
  const [status, setStatus] = useState<JobStatus>('queued');

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const jobId = fragment.get('job');
    // The local job identifier only exists in the hydrated URL fragment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!jobId) { setStatus('failed'); return; }
    if (fragment.get('mode') === 'remote') {
      const token = sessionStorage.getItem(`gt-access:${jobId}`);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token || !apiBaseUrl) { setStatus('failed'); return; }
      let stopped = false;
      const startedAt = Date.now();
      const poll = async () => {
        try {
          const remote = await getRemoteStatus(apiBaseUrl, jobId, token);
          if (stopped) return;
          setStatus(remote.status);
          if (remote.status === 'completed' || remote.status === 'failed') return;
          if (Date.now() - startedAt >= 55_000) { setStatus('retryable_error'); return; }
          window.setTimeout(poll, 2500);
        } catch {
          if (!stopped) setStatus('retryable_error');
        }
      };
      void poll();
      return () => { stopped = true; };
    }
    const stored = sessionStorage.getItem(`gt-job:${jobId}`);
    if (!stored) { setStatus('failed'); return; }
    try { setJob(JSON.parse(stored) as StoredJob); } catch { setStatus('failed'); return; }
    const processing = window.setTimeout(() => setStatus('processing'), 700);
    const completed = window.setTimeout(() => setStatus('completed'), 1800);
    return () => { window.clearTimeout(processing); window.clearTimeout(completed); };
  }, []);

  const selectedProduct = job ? products.find((product) => product.sku === job.inquiry.sku) : undefined;

  return (
    <div className="status-panel">
      <div className={`status-orbit status-orbit--${status}`}><span>{status === 'completed' ? '✓' : status === 'failed' ? '!' : ''}</span></div>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2>{copy.labels[status]}</h2>
      <p>{copy.preview}</p>
      {job && status === 'completed' && <div className="status-result"><b>{selectedProduct?.name[locale] ?? job.inquiry.sku}</b><span>{job.inquiry.sku} · {copy.waiting}</span><p>{job.proposal.sections.needSummary}</p></div>}
      <div className="status-actions"><Link className="button button--primary" href={localizedPath(locale, 'products')}>{copy.products}</Link><Link className="button button--ghost" href={localizedPath(locale, 'contact')}>{copy.contact}</Link></div>
    </div>
  );
}
