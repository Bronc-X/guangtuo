'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import {categories, products} from '@/data/catalog';
import {buildEmailDraft, buildProposalDraft} from '@/lib/ai-mail';
import {createRemoteInquiry, resolveInquiryApiBaseUrl} from '@/lib/api-client';
import {packagingInquiryFields} from '@/lib/studio-delivery';
import {decodeConfiguration} from '@/lib/config-state';
import {inquirySchema, type InquiryInput} from '@/lib/contracts';
import {localizedPath, type Locale} from '@/lib/routing';
import {inquiryValidationMessage} from '@/lib/inquiry-validation-copy';
import {ChoiceField} from '@/components/choice-field';
import {inquiryChoices, platformOptions, platformChinese, normalizeSalesPlatform} from '@/data/inquiry-choices';
import {pageLabels} from '@/data/page-labels';

const inquiryCopy: Record<Locale, Record<string, string>> = {
  en: {
    check: 'Check the following:', serviceError: 'The enquiry service is temporarily unavailable. Please try again.',
    name: 'Name', email: 'Work email', company: 'Company / brand', market: 'Target sales market', family: 'Product family', product: 'Finished product',
    configuration: 'Formula, format and packaging requirements', quantity: 'Expected quantity', budget: 'Target budget', launch: 'Preferred launch date', preference: 'Preferred formula / format / pack',
    goal: 'Product goal and intended skincare use', requirements: 'Market-specific requirements', requirementsPlaceholder: 'Optional — add any label, document or testing needs you already know', notes: 'Sample request or other notes',
    consent: 'I agree that Showki may use these details to contact me about this finished-product enquiry. Information is retained for 12 months.', sending: 'Sending…', submit: 'Request samples / quote',
    sampleNote: 'I would like to request product samples.'
  },
  zh: {
    check: '请检查以下内容：', serviceError: '暂时无法提交，请稍后重试。',
    name: '您的姓名', email: '工作邮箱', company: '公司或品牌名称', market: '产品计划销售到哪里', family: '护理品类', product: '感兴趣的产品',
    configuration: '方案摘要', quantity: '预计数量', budget: '预算范围', launch: '期望上市时间', preference: '理想肤感与包装偏好',
    goal: '希望消费者感受到什么', requirements: '目标市场与合规要求', requirementsPlaceholder: '选填：已知的标签、文件或检测要求', notes: '样品需求或其他想法',
    consent: '我同意修齐使用以上信息与我沟通本次产品需求。信息默认保留 12 个月。', sending: '正在提交…', submit: '申请样品并获取报价',
    sampleNote: '希望申请这款产品的实物样品，并了解费用与时间。'
  },
  fr: {
    check: 'Vérifiez les éléments suivants :', serviceError: 'Le service de demande est momentanément indisponible. Réessayez plus tard.',
    name: 'Nom', email: 'E-mail professionnel', company: 'Entreprise / marque', market: 'Marché cible', family: 'Famille de produits', product: 'Produit fini',
    configuration: 'Exigences de formule, de format et d’emballage', quantity: 'Quantité prévue', budget: 'Budget cible', launch: 'Date de lancement souhaitée', preference: 'Formule / format / emballage souhaité',
    goal: 'Objectif du produit et usage cosmétique prévu', requirements: 'Exigences propres au marché', requirementsPlaceholder: 'Facultatif — ajoutez les besoins connus en matière d’étiquette, document ou essai', notes: 'Demande d’échantillons ou remarques',
    consent: 'J’accepte que Showki utilise ces informations pour me contacter au sujet de cette demande de produit fini. Les informations sont conservées 12 mois.', sending: 'Envoi…', submit: 'Demander des échantillons / un devis',
    sampleNote: 'Je souhaite demander des échantillons de produits.'
  },
  es: {
    check: 'Revisa lo siguiente:', serviceError: 'El servicio de consultas no está disponible temporalmente. Inténtalo más tarde.',
    name: 'Nombre', email: 'Correo de trabajo', company: 'Empresa / marca', market: 'Mercado objetivo', family: 'Familia de productos', product: 'Producto terminado',
    configuration: 'Requisitos de fórmula, formato y empaque', quantity: 'Cantidad prevista', budget: 'Presupuesto objetivo', launch: 'Fecha de lanzamiento prevista', preference: 'Fórmula / formato / empaque preferido',
    goal: 'Objetivo del producto y uso cosmético previsto', requirements: 'Requisitos específicos del mercado', requirementsPlaceholder: 'Opcional — añada requisitos conocidos de etiqueta, documentos o pruebas', notes: 'Solicitud de muestras u otras notas',
    consent: 'Acepto que Showki use estos datos para contactarme sobre esta consulta de producto terminado. La información se conserva durante 12 meses.', sending: 'Enviando…', submit: 'Solicitar muestras / cotización',
    sampleNote: 'Deseo solicitar muestras de productos.'
  },
  ru: {
    check: 'Проверьте следующее:', serviceError: 'Сервис запросов временно недоступен. Повторите попытку позже.',
    name: 'Имя', email: 'Рабочая почта', company: 'Компания / бренд', market: 'Целевой рынок', family: 'Категория продукта', product: 'Готовый продукт',
    configuration: 'Требования к формуле, формату и упаковке', quantity: 'Ожидаемое количество', budget: 'Целевой бюджет', launch: 'Желаемая дата запуска', preference: 'Предпочтения по формуле / формату / упаковке',
    goal: 'Цель продукта и назначение ухода', requirements: 'Требования целевого рынка', requirementsPlaceholder: 'Необязательно — добавьте известные требования к маркировке, документам или испытаниям', notes: 'Запрос образцов или другие примечания',
    consent: 'Я разрешаю Showki использовать эти данные для связи со мной по поводу запроса готового продукта. Информация хранится 12 месяцев.', sending: 'Отправка…', submit: 'Запросить образцы / цену', sampleNote: 'Я хотел(а) бы запросить образцы продукции.'
  },
  ar: {
    check: 'يرجى التحقق مما يلي:', serviceError: 'خدمة الاستفسارات غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.',
    name: 'الاسم', email: 'بريد العمل', company: 'الشركة / العلامة', market: 'سوق البيع المستهدف', family: 'فئة المنتج', product: 'المنتج الجاهز',
    configuration: 'متطلبات التركيبة والتصميم والتغليف', quantity: 'الكمية المتوقعة', budget: 'الميزانية المستهدفة', launch: 'تاريخ الإطلاق المفضل', preference: 'التركيبة / التصميم / التغليف المفضل',
    goal: 'هدف المنتج واستخدام العناية المقصود', requirements: 'متطلبات خاصة بالسوق', requirementsPlaceholder: 'اختياري — أضف أي متطلبات معروفة للملصق أو المستندات أو الاختبارات', notes: 'طلب عينة أو ملاحظات أخرى',
    consent: 'أوافق على استخدام Showki لهذه البيانات للتواصل معي بشأن استفسار المنتج الجاهز. تُحفظ المعلومات لمدة 12 شهراً.', sending: 'جارٍ الإرسال…', submit: 'طلب عينات / عرض سعر', sampleNote: 'أرغب في طلب عينات من المنتجات.'
  }
};

export function InquiryForm({locale}: {locale: Locale}) {
  const copy = inquiryCopy[locale];
  const choices = inquiryChoices(locale);
  const zh = locale === 'zh';
  const [salesChannel, setSalesChannel] = useState('');
  const router = useRouter();
  const defaultSku = 'CUSTOM';
  const [initial, setInitial] = useState<Partial<InquiryInput>>({});
  const [selectedSku, setSelectedSku] = useState(defaultSku);
  const [errors, setErrors] = useState<string[]>([]);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submissionRef = useRef<{payload: string; key: string} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedProduct = products.find((product) => product.sku === selectedSku); const selectedProductCategory = selectedProduct?.category ?? '';
  const selectedCategory = categories.find((category) => category.slug === selectedProductCategory);

  useEffect(() => {
    if (errors.length) errorSummaryRef.current?.focus();
  }, [errors]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = sessionStorage.getItem('gt-recommendation');
    const advisorLead = sessionStorage.getItem('gt-mail-agent-lead');
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    let next: Partial<InquiryInput> = {};
    try { if (stored) next = JSON.parse(stored) as InquiryInput; } catch { /* Ignore malformed local state. */ }
    try { if (advisorLead) next = {...next, ...JSON.parse(advisorLead) as Partial<InquiryInput>}; } catch { /* Ignore malformed local state. */ }
    const configuration = decodeConfiguration(fragment.get('cfg') ?? window.location.hash.replace(/^#/, ''));
    const requestedSku = fragment.get('sku') ?? configuration?.sku ?? next.sku;
    const restoredSku = requestedSku && products.some((product) => product.sku === requestedSku) ? requestedSku : defaultSku;
    const restoredProduct = products.find((product) => product.sku === restoredSku);
    next = {
      ...next,
      sku: restoredSku,
      category: restoredProduct?.category ?? next.category ?? 'custom',
      configuration: configuration
        ? Object.entries(configuration.selections).map(([key, value]) => `${key}=${value}`).join('; ')
        : next.configuration,
      notes: fragment.get('request') === 'sample' ? (next.notes || copy.sampleNote) : next.notes
    };
    if (fragment.get('request') === 'packaging') next = {...next, ...packagingInquiryFields(window.location.hash, locale)};
    next.salesPlatforms = next.salesPlatforms?.map(normalizeSalesPlatform);
    setInitial(next);
    setSalesChannel(next.salesChannel ?? '');
    setSelectedSku(restoredSku);
  }, [copy.sampleNote, defaultSku, locale]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const result = inquirySchema.safeParse({...raw, conversation: initial.conversation, design: initial.design, salesPlatforms: [...form.getAll('salesPlatforms'), ...(String(form.get('customSalesPlatforms') ?? '').trim() ? [String(form.get('customSalesPlatforms')).trim()] : [])], configuration: initial.configuration ?? '', salesChannel: raw.salesChannel || undefined, privacyConsent: true});
    if (!result.success) {
      const labels = {...copy, contact: zh ? '联系方式' : 'Contact', businessEmail: copy.email, category: copy.family, sku: copy.product, launchDate: copy.launch, productGoal: copy.goal, packagingPreference: copy.preference, certificationConstraints: copy.requirements};
      setErrors(result.error.issues.map(issue => inquiryValidationMessage(issue, locale, labels)));
      return;
    }
    setSubmitting(true);
    const apiBaseUrl = resolveInquiryApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, process.env.NODE_ENV === 'production');
    if (apiBaseUrl) {
      try {
        const payload = JSON.stringify(result.data);
        if (submissionRef.current?.payload !== payload) submissionRef.current = {payload, key: crypto.randomUUID()};
        const remote = await createRemoteInquiry(apiBaseUrl, result.data, fetch, {idempotencyKey: submissionRef.current.key, locale});
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
    <form className="brief-form brief-form--inquiry" data-form-title={pageLabels[locale].form} onSubmit={submit}>
      {errors.length > 0 && <div className="error-summary" ref={errorSummaryRef} tabIndex={-1} role="alert"><b>{copy.check}</b><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <div className="form-grid" key={JSON.stringify(initial)}>
        <label><span>{copy.name}{zh ? '（必填）' : ' (required)'}</span><input name="name" defaultValue={initial.name} required maxLength={200} autoComplete="name" /></label>
        <label><span>{zh ? '联系方式（必填）' : 'Contact (required)'}</span><input name="contact" defaultValue={initial.contact ?? initial.businessEmail} required maxLength={254} placeholder={zh ? '微信号、WhatsApp 号码或邮箱' : 'WeChat, WhatsApp number or email'} /><small>{zh ? '任选一种；WhatsApp 请带国家区号。' : 'Choose one. Include the country code for WhatsApp.'}</small></label>
        <label><span>{copy.company}</span><input name="company" defaultValue={initial.company} maxLength={200} autoComplete="organization" /></label>
        <ChoiceField name="market" label={zh ? '销售国家或地区' : copy.market} initial={initial.market} options={choices.market} locale={locale} />
        <label><span>{zh ? '销售方式' : 'Sales channel'}</span><select name="salesChannel" value={salesChannel} onChange={event => setSalesChannel(event.target.value)}><option value="">{zh ? '请选择' : 'Choose an option'}</option><option value="online">{zh ? '线上' : 'Online'}</option><option value="offline">{zh ? '线下' : 'Offline'}</option><option value="both">{zh ? '线上与线下' : 'Online & offline'}</option></select></label>
        {(['online', 'offline'] as const).filter(channel => salesChannel === channel || salesChannel === 'both').map(channel => <fieldset key={channel} className="sales-platforms form-span-2"><legend>{channel === 'online' ? (zh ? '线上销售平台（可多选）' : 'Online platforms') : (zh ? '线下销售渠道（可多选）' : 'Offline channels')}</legend>{platformOptions[channel].map(platform => <label key={platform}><input type="checkbox" name="salesPlatforms" value={platform} defaultChecked={initial.salesPlatforms?.includes(platform)} /><span>{zh ? platformChinese[platform] ?? platform : platform}</span></label>)}</fieldset>)}
        {salesChannel && <label className="form-span-2"><span>{zh ? '其他销售平台 / 渠道（选填）' : 'Other sales platforms / channels (optional)'}</span><input name="customSalesPlatforms" maxLength={200} defaultValue={initial.salesPlatforms?.filter(value => ![...platformOptions.online, ...platformOptions.offline].includes(value)).join(', ')} /></label>}
        {selectedProduct ? <label><span>{copy.family}{zh ? '（必填）' : ' (required)'}</span><input value={selectedCategory?.name[locale] ?? ''} readOnly /><input name="category" type="hidden" value={selectedProductCategory} /></label> : <ChoiceField name="category" label={`${copy.family}${zh ? '（必填）' : ' (required)'}`} locale={locale} initial={initial.category === 'custom' ? '' : initial.category} required options={zh ? ['水凝面膜', '水凝眼膜', '局部膜贴', '乳液', '面霜', '洁面', '精华', '身体护理', '头皮护理', '其他护肤品'] : ['Hydrogel face mask', 'Eye patch', 'Targeted patch', 'Lotion', 'Cream', 'Cleanser', 'Serum', 'Body care', 'Scalp care', 'Other skincare']} />}
        <label><span>{copy.product}</span><select name="sku" value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)}><option value="CUSTOM">{zh ? '定制新品 / 尚未选定' : 'New product / undecided'}</option>{products.map((product) => <option value={product.sku} key={product.sku}>{product.name[locale]} · {product.sku}</option>)}</select></label>
        <ChoiceField name="efficacy" label={zh ? '目标功效' : 'Efficacy'} initial={initial.efficacy} options={choices.efficacy} locale={locale} maxLength={500} />
        <ChoiceField name="productColor" label={zh ? '颜色' : 'Colour'} initial={initial.productColor} options={choices.color} locale={locale} />
        <ChoiceField name="texture" label={zh ? '质地' : 'Texture'} initial={initial.texture} options={choices.texture} locale={locale} />
        <ChoiceField name="quantity" label={copy.quantity} initial={initial.quantity} options={choices.quantity} locale={locale} />
        <ChoiceField name="budget" label={copy.budget} initial={initial.budget} options={choices.budget} locale={locale} />
        <ChoiceField name="launchDate" label={copy.launch} initial={initial.launchDate} options={choices.launch} locale={locale} />
        <ChoiceField name="packagingPreference" label={zh ? '包装方式与材质' : copy.preference} initial={initial.packagingPreference} options={choices.packaging} locale={locale} maxLength={500} />
        <label className="form-span-2"><span>{copy.goal}</span><textarea name="productGoal" defaultValue={initial.productGoal} maxLength={500} rows={3} /></label>
        <label className="form-span-2"><span>{copy.requirements}</span><textarea name="certificationConstraints" defaultValue={initial.certificationConstraints} maxLength={500} rows={2} placeholder={copy.requirementsPlaceholder} /></label>
        <label className="form-span-2"><span>{copy.notes}</span><textarea name="notes" defaultValue={initial.notes} maxLength={2000} rows={4} /></label>
        <label className="form-span-2"><span>{zh ? '其他要求' : 'Other requirements'}</span><textarea name="otherNeeds" defaultValue={initial.otherNeeds} maxLength={2000} rows={3} placeholder={zh ? '例如：多种功效、指定成分、平台链接或包装细节' : 'Additional efficacy, ingredients, platform links or packaging details'} /></label>
      </div>
      {initial.conversation?.length ? <details className="inquiry-transcript"><summary>{zh ? '查看顾问对话（随需求一并提交）' : 'Advisor conversation (included with your inquiry)'}</summary>{initial.conversation.map((message, index) => <p key={index}><b>{message.role === 'user' ? (zh ? '您：' : 'You: ') : (zh ? '顾问：' : 'Advisor: ')}</b>{message.content}</p>)}</details> : null}
      <p className="consent">{zh ? '点击提交即同意修齐保存本次需求并与您联系，资料默认保留 12 个月。' : 'By submitting, you agree that SHOWKI may store this request for 12 months and contact you about it.'}</p>
      <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? copy.sending : copy.submit}</button>
    </form>
  );
}
