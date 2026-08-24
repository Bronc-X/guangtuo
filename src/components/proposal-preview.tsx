'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {products} from '@/data/catalog';
import {buildEmailDraft, buildProposalDraft} from '@/lib/ai-mail';
import {inquirySchema, type EmailDraft, type InquiryInput, type Proposal} from '@/lib/contracts';
import {localizedPath, type Locale} from '@/lib/routing';

function getSampleProduct() {
  const product = products.find((item) => item.sku === 'GT-FM-001-V01');
  if (!product) throw new Error('The proposal sample product is missing from the catalogue');
  return product;
}

const sampleProduct = getSampleProduct();

const previewCopy: Record<Locale, {
  contact: string;
  company: string;
  market: string;
  pending: string;
  goal: string;
  preference: string;
  labels: string[];
  status: string;
  to: string;
  subject: string;
  note: string;
  cta: string;
}> = {
  en: {
    contact: 'Product contact', company: 'Example brand', market: 'EU', pending: 'Not decided yet', goal: 'A collagen face mask for a new retail skincare launch', preference: 'A cooling hydrogel feel with retail-ready packaging',
    labels: ['What you want to make', 'The closest product', 'Choices still to make', 'Samples and pricing', 'Useful files to share', 'A suggested reply'],
    status: 'YOUR MASK SUMMARY', to: 'To', subject: 'Subject', note: 'Use this summary to continue with a product advisor and ask for the right sample.', cta: 'Ask for samples / pricing'
  },
  zh: {
    contact: '产品联系人', company: '示例品牌', market: '欧盟', pending: '暂未确定', goal: '一款用于零售护肤新品的胶原面膜', preference: '希望有清凉水凝胶触感与零售包装',
    labels: ['想做的产品', '最接近的现有款', '还可以继续选择的细节', '样品与报价', '可以提供的资料', '建议回复'],
    status: '您的面膜摘要', to: '收件人', subject: '主题', note: '可以带着这份摘要继续联系产品顾问，并申请合适的样品。', cta: '申请样品 / 报价'
  },
  fr: {
    contact: 'Contact produit', company: 'Marque exemple', market: 'Union européenne', pending: 'Pas encore décidé', goal: 'Un masque visage au collagène pour un nouveau lancement retail', preference: 'Une sensation hydrogel fraîche avec un emballage prêt pour la vente',
    labels: ['Ce que vous souhaitez créer', 'Le produit le plus proche', 'Les choix encore possibles', 'Échantillons et tarifs', 'Fichiers utiles à partager', 'Réponse suggérée'],
    status: 'RÉSUMÉ DE VOTRE MASQUE', to: 'Destinataire', subject: 'Objet', note: 'Utilisez ce résumé pour poursuivre avec un conseiller et demander le bon échantillon.', cta: 'Demander des échantillons / un devis'
  },
  es: {
    contact: 'Contacto de producto', company: 'Marca de ejemplo', market: 'Unión Europea', pending: 'Aún no decidido', goal: 'Una mascarilla facial con colágeno para un nuevo lanzamiento retail', preference: 'Una sensación fresca de hidrogel con empaque listo para la venta',
    labels: ['Lo que quiere crear', 'El producto más cercano', 'Elecciones aún posibles', 'Muestras y precios', 'Archivos útiles para compartir', 'Respuesta sugerida'],
    status: 'RESUMEN DE SU MASCARILLA', to: 'Para', subject: 'Asunto', note: 'Use este resumen para continuar con un asesor y solicitar la muestra adecuada.', cta: 'Solicitar muestras / precios'
  }
};

function createSample(locale: Locale): InquiryInput {
  const copy = previewCopy[locale];
  return {
    name: copy.contact,
    businessEmail: 'buyer@example.com',
    company: copy.company,
    market: copy.market,
    category: sampleProduct.category,
    sku: sampleProduct.sku,
    configuration: '',
    quantity: copy.pending,
    budget: copy.pending,
    launchDate: copy.pending,
    productGoal: copy.goal,
    packagingPreference: copy.preference,
    certificationConstraints: '',
    notes: '',
    privacyConsent: true
  };
}

export function ProposalPreview({locale}: {locale: Locale}) {
  const copy = previewCopy[locale];
  const sample = createSample(locale);
  const [inquiry, setInquiry] = useState<InquiryInput>(sample);
  const [proposal, setProposal] = useState<Proposal>(() => buildProposalDraft(sample, locale));
  const [email, setEmail] = useState<EmailDraft>(() => buildEmailDraft(proposal, sample, locale));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = sessionStorage.getItem('gt-recommendation');
    if (!stored) return;
    try {
      const parsed = inquirySchema.safeParse(JSON.parse(stored));
      if (!parsed.success) return;
      const nextProposal = buildProposalDraft(parsed.data, locale);
      setInquiry(parsed.data);
      setProposal(nextProposal);
      setEmail(buildEmailDraft(nextProposal, parsed.data, locale));
    } catch { /* Keep the safe demonstration proposal. */ }
  }, [locale]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="proposal-layout">
      <section className="proposal-sections">
        {Object.values(proposal.sections).map((content, index) => <article key={copy.labels[index]}><span>0{index + 1}</span><div><h2>{copy.labels[index]}</h2><p>{content}</p></div></article>)}
      </section>
      <aside className="email-preview">
        <div className="email-preview__status"><span /> {copy.status}</div>
        <p><b>{copy.to}</b> {email.to}</p><p><b>{copy.subject}</b> {email.subject}</p><pre>{email.body}</pre>
        <p className="email-preview__note">{copy.note}</p>
        <Link className="button button--primary" href={`${localizedPath(locale, 'inquiry')}#sku=${encodeURIComponent(inquiry.sku)}`} onClick={() => sessionStorage.setItem('gt-recommendation', JSON.stringify(inquiry))}>{copy.cta}</Link>
      </aside>
    </div>
  );
}
