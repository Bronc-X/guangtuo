'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState, type FormEvent} from 'react';
import {categories, products} from '@/data/catalog';
import {buildEmailDraft, buildProposalDraft} from '@/lib/ai-mail';
import {createRemoteInquiry} from '@/lib/api-client';
import {decodeConfiguration} from '@/lib/config-state';
import {inquirySchema, type InquiryInput} from '@/lib/contracts';
import {localizedPath, type Locale} from '@/lib/routing';

const inquiryCopy: Record<Locale, Record<string, string>> = {
  en: {
    check: 'Check the following:', serviceError: 'The enquiry service is temporarily unavailable. Please try again.',
    name: 'Name', email: 'Work email', company: 'Company / brand', market: 'Target sales market', family: 'Product family', product: 'Finished product',
    configuration: 'Formula, format and packaging requirements', quantity: 'Expected quantity', budget: 'Target budget', launch: 'Preferred launch date', preference: 'Preferred formula / format / pack',
    goal: 'Product goal and intended skincare use', requirements: 'Market-specific requirements', requirementsPlaceholder: 'Optional — add any label, document or testing needs you already know', notes: 'Sample request or other notes',
    consent: 'I agree that Guangtuo may use these details to contact me about this finished-product enquiry. Information is retained for 12 months.', sending: 'Sending…', submit: 'Request samples / quote',
    sampleNote: 'I would like to request product samples.'
  },
  zh: {
    check: '请检查以下内容：', serviceError: '询盘服务暂时不可用，请稍后重试。',
    name: '姓名', email: '工作邮箱', company: '公司或品牌名称', market: '目标销售市场', family: '产品系列', product: '成品',
    configuration: '配方、形态与包装要求', quantity: '预计采购数量', budget: '目标预算', launch: '希望上市时间', preference: '偏好的配方 / 形态 / 包装',
    goal: '产品目标与预期护肤用途', requirements: '目标市场的特殊要求', requirementsPlaceholder: '选填：已知的标签、资料或检测需求', notes: '样品申请或其他说明',
    consent: '我同意广拓使用以上信息就本次成品需求与我联系。信息默认保留 12 个月。', sending: '正在提交…', submit: '申请样品 / 获取报价',
    sampleNote: '我希望申请产品样品。'
  },
  fr: {
    check: 'Vérifiez les éléments suivants :', serviceError: 'Le service de demande est momentanément indisponible. Réessayez plus tard.',
    name: 'Nom', email: 'E-mail professionnel', company: 'Entreprise / marque', market: 'Marché cible', family: 'Famille de produits', product: 'Produit fini',
    configuration: 'Exigences de formule, de format et d’emballage', quantity: 'Quantité prévue', budget: 'Budget cible', launch: 'Date de lancement souhaitée', preference: 'Formule / format / emballage souhaité',
    goal: 'Objectif du produit et usage cosmétique prévu', requirements: 'Exigences propres au marché', requirementsPlaceholder: 'Facultatif — ajoutez les besoins connus en matière d’étiquette, document ou essai', notes: 'Demande d’échantillons ou remarques',
    consent: 'J’accepte que Guangtuo utilise ces informations pour me contacter au sujet de cette demande de produit fini. Les informations sont conservées 12 mois.', sending: 'Envoi…', submit: 'Demander des échantillons / un devis',
    sampleNote: 'Je souhaite demander des échantillons de produits.'
  },
  es: {
    check: 'Revisa lo siguiente:', serviceError: 'El servicio de consultas no está disponible temporalmente. Inténtalo más tarde.',
    name: 'Nombre', email: 'Correo de trabajo', company: 'Empresa / marca', market: 'Mercado objetivo', family: 'Familia de productos', product: 'Producto terminado',
    configuration: 'Requisitos de fórmula, formato y empaque', quantity: 'Cantidad prevista', budget: 'Presupuesto objetivo', launch: 'Fecha de lanzamiento prevista', preference: 'Fórmula / formato / empaque preferido',
    goal: 'Objetivo del producto y uso cosmético previsto', requirements: 'Requisitos específicos del mercado', requirementsPlaceholder: 'Opcional — añada requisitos conocidos de etiqueta, documentos o pruebas', notes: 'Solicitud de muestras u otras notas',
    consent: 'Acepto que Guangtuo use estos datos para contactarme sobre esta consulta de producto terminado. La información se conserva durante 12 meses.', sending: 'Enviando…', submit: 'Solicitar muestras / cotización',
    sampleNote: 'Deseo solicitar muestras de productos.'
  }
};

export function InquiryForm({locale}: {locale: Locale}) {
  const copy = inquiryCopy[locale];
  const router = useRouter();
  const defaultSku = products[0]?.sku ?? '';
  const [initial, setInitial] = useState<Partial<InquiryInput>>({});
  const [selectedSku, setSelectedSku] = useState(defaultSku);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const selectedProduct = products.find((product) => product.sku === selectedSku); const selectedProductCategory = selectedProduct?.category ?? '';
  const selectedCategory = categories.find((category) => category.slug === selectedProductCategory);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = sessionStorage.getItem('gt-recommendation');
    const advisorLead = sessionStorage.getItem('gt-mail-agent-lead');
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    let next: Partial<InquiryInput> = {};
    try { if (stored) next = JSON.parse(stored) as InquiryInput; } catch { /* Ignore malformed local state. */ }
    try { if (advisorLead) next = {...next, ...JSON.parse(advisorLead) as Partial<InquiryInput>}; } catch { /* Ignore malformed local state. */ }
    const configuration = decodeConfiguration(window.location.hash.replace(/^#/, ''));
    const requestedSku = fragment.get('sku') ?? configuration?.sku ?? next.sku;
    const restoredSku = requestedSku && products.some((product) => product.sku === requestedSku) ? requestedSku : defaultSku;
    const restoredProduct = products.find((product) => product.sku === restoredSku);
    next = {
      ...next,
      sku: restoredSku,
      category: restoredProduct?.category,
      configuration: configuration
        ? Object.entries(configuration.selections).map(([key, value]) => `${key}=${value}`).join('; ')
        : next.configuration,
      notes: fragment.get('request') === 'sample' ? (next.notes || copy.sampleNote) : next.notes
    };
    setInitial(next);
    setSelectedSku(restoredSku);
  }, [copy.sampleNote, defaultSku]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const result = inquirySchema.safeParse({...raw, privacyConsent: raw.privacyConsent === 'on'});
    if (!result.success) {
      setErrors(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
      return;
    }
    setSubmitting(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      try {
        const remote = await createRemoteInquiry(apiBaseUrl, result.data);
        sessionStorage.setItem(`gt-access:${remote.id}`, remote.accessToken);
        router.push(`${localizedPath(locale, 'status')}#job=${remote.id}&mode=remote`);
        return;
      } catch {
        setErrors([copy.serviceError]);
        setSubmitting(false);
        return;
      }
    }
    const jobId = crypto.randomUUID();
    const proposal = buildProposalDraft(result.data, locale);
    const email = buildEmailDraft(proposal, result.data, locale);
    sessionStorage.setItem(`gt-job:${jobId}`, JSON.stringify({createdAt: Date.now(), inquiry: result.data, proposal, email}));
    router.push(`${localizedPath(locale, 'status')}#job=${jobId}`);
  }

  return (
    <form className="brief-form brief-form--inquiry" onSubmit={submit}>
      {errors.length > 0 && <div className="error-summary" role="alert"><b>{copy.check}</b><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <div className="form-grid" key={JSON.stringify(initial)}>
        <label><span>{copy.name}</span><input name="name" defaultValue={initial.name} required maxLength={200} autoComplete="name" /></label>
        <label><span>{copy.email}</span><input name="businessEmail" type="email" defaultValue={initial.businessEmail} required maxLength={254} autoComplete="email" /></label>
        <label><span>{copy.company}</span><input name="company" defaultValue={initial.company} required maxLength={200} autoComplete="organization" /></label>
        <label><span>{copy.market}</span><input name="market" defaultValue={initial.market} required maxLength={200} /></label>
        <label><span>{copy.family}</span><input value={selectedCategory?.name[locale] ?? ''} readOnly aria-readonly="true" /><input name="category" type="hidden" value={selectedProductCategory} /></label>
        <label><span>{copy.product}</span><select name="sku" value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)} required>{products.map((product) => <option value={product.sku} key={product.sku}>{product.name[locale]} · {product.sku}</option>)}</select></label>
        <label className="form-span-2"><span>{copy.configuration}</span><textarea name="configuration" defaultValue={initial.configuration} maxLength={1200} rows={2} /></label>
        <label><span>{copy.quantity}</span><input name="quantity" defaultValue={initial.quantity} required maxLength={200} /></label>
        <label><span>{copy.budget}</span><input name="budget" defaultValue={initial.budget} required maxLength={200} /></label>
        <label><span>{copy.launch}</span><input name="launchDate" defaultValue={initial.launchDate} required maxLength={200} /></label>
        <label><span>{copy.preference}</span><input name="packagingPreference" defaultValue={initial.packagingPreference} required maxLength={500} /></label>
        <label className="form-span-2"><span>{copy.goal}</span><textarea name="productGoal" defaultValue={initial.productGoal} required maxLength={500} rows={3} /></label>
        <label className="form-span-2"><span>{copy.requirements}</span><textarea name="certificationConstraints" defaultValue={initial.certificationConstraints} maxLength={500} rows={2} placeholder={copy.requirementsPlaceholder} /></label>
        <label className="form-span-2"><span>{copy.notes}</span><textarea name="notes" defaultValue={initial.notes} maxLength={2000} rows={4} /></label>
      </div>
      <label className="consent"><input name="privacyConsent" type="checkbox" required /> <span>{copy.consent}</span></label>
      <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? copy.sending : copy.submit}</button>
    </form>
  );
}
