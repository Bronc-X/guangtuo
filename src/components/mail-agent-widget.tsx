'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useId, useRef, useState} from 'react';
import {products, type ProductCategory} from '@/data/catalog';
import {assessInboundMail, mailAgentPresets} from '@/data/mail-agent';
import {localizedPath, type Locale} from '@/lib/routing';

type Message = {
  id: number;
  role: 'user' | 'agent';
  body: string;
};

type GuidedStep = 'goal' | 'family' | 'readiness' | 'lead';

type GuidedOption = {
  label: string;
  value: string;
  category?: ProductCategory;
};

type GuidedStage = {
  label: string;
  options: GuidedOption[];
  reply: string;
};

type BriefDraft = {
  productGoal?: string;
  category?: ProductCategory;
  categoryLabel?: string;
  sku?: string;
  packagingPreference?: string;
};

type AdvisorCopy = {
  launcher: string;
  online: string;
  title: string;
  close: string;
  intro: string;
  askPlaceholder: string;
  askLabel: string;
  typing: string;
  reviewReply: string;
  leadStage: string;
  leadKicker: string;
  leadTitle: string;
  leadBody: string;
  name: string;
  email: string;
  company: string;
  consent: string;
  submit: string;
  handoff: string;
  notesPrefix: string;
  guided: Record<Exclude<GuidedStep, 'lead'>, GuidedStage>;
};

const advisorCopy: Record<Locale, AdvisorCopy> = {
  en: {
    launcher: 'Email assistant', online: 'ONLINE · PRODUCT ENQUIRIES', title: 'Guangtuo product advisor', close: 'Close email assistant',
    intro: 'Tell me whether you are comparing face, eye or neck masks, checking a SKU, or planning an OEM/ODM product.',
    askPlaceholder: 'Ask about a product or SKU…', askLabel: 'Ask a question', typing: 'The advisor is replying',
    reviewReply: 'This needs a product or commercial review. Add it to your enquiry and an advisor will confirm it with you.',
    leadStage: 'CONTACT DETAILS', leadKicker: 'CONTINUE BY EMAIL', leadTitle: 'Leave your contact details.',
    leadBody: 'Your product family and request will be carried into the full enquiry form.', name: 'Name', email: 'Work email', company: 'Company / brand',
    consent: 'I agree that Guangtuo may use these details to contact me about this finished-product enquiry.',
    submit: 'Continue to enquiry', handoff: 'Open the full sample / quote form', notesPrefix: 'From the email assistant',
    guided: {
      goal: {label: 'REQUEST 1 / 3', options: [
        {label: 'Compare the 13 SKUs', value: 'Compare the 13 finished-product SKUs'},
        {label: 'Discuss OEM / ODM', value: 'OEM/ODM finished-product development'},
        {label: 'Request samples', value: 'Product sample request'},
        {label: 'Ask about hydrogel', value: 'Hydrogel product development'}
      ], reply: 'Which product family are you considering?'},
      family: {label: 'PRODUCT 2 / 3', options: [
        {label: 'Face masks', value: 'Face masks', category: 'face-masks'},
        {label: 'Eye masks', value: 'Eye masks', category: 'eye-masks'},
        {label: 'Neck masks', value: 'Neck masks', category: 'neck-masks'},
        {label: 'Not sure yet', value: 'Product family to be confirmed'}
      ], reply: 'How far have you got with the product choice?'},
      readiness: {label: 'DETAILS 3 / 3', options: [
        {label: 'I have an exact SKU', value: 'Exact SKU available'},
        {label: 'I need a shortlist', value: 'Shortlist requested'},
        {label: 'I have a formula brief', value: 'Formula brief available'},
        {label: 'Still exploring', value: 'Early product exploration'}
      ], reply: 'Thanks. Leave your contact details and continue with the saved request.'}
    }
  },
  zh: {
    launcher: '邮件助手', online: '在线 · 成品询盘', title: '广拓产品顾问', close: '关闭邮件助手',
    intro: '您可以直接告诉我：正在比较面膜、眼膜或颈膜，查询某个 SKU，还是准备开发 OEM / ODM 成品。',
    askPlaceholder: '询问产品或 SKU…', askLabel: '输入问题', typing: '顾问正在回复',
    reviewReply: '这个问题需要结合产品或商务条件人工确认。请带入询盘，顾问会继续与您核对。',
    leadStage: '联系方式', leadKicker: '转到邮件沟通', leadTitle: '请留下您的联系方式。',
    leadBody: '刚才选择的产品系列与需求会自动带入完整询盘表。', name: '姓名', email: '工作邮箱', company: '公司或品牌名称',
    consent: '我同意广拓使用以上信息就本次成品需求与我联系。',
    submit: '继续填写询盘', handoff: '打开完整样品 / 报价表', notesPrefix: '来自邮件助手',
    guided: {
      goal: {label: '需求 1 / 3', options: [
        {label: '比较 13 个 SKU', value: '比较 13 个成品 SKU'},
        {label: '沟通 OEM / ODM', value: 'OEM/ODM 成品开发'},
        {label: '申请产品样品', value: '产品样品申请'},
        {label: '了解凝胶产品', value: '凝胶产品开发'}
      ], reply: '您主要在考虑哪一类产品？'},
      family: {label: '产品 2 / 3', options: [
        {label: '面部面膜', value: '面部面膜', category: 'face-masks'},
        {label: '眼膜', value: '眼膜', category: 'eye-masks'},
        {label: '颈膜', value: '颈膜', category: 'neck-masks'},
        {label: '暂时不确定', value: '产品系列待确认'}
      ], reply: '目前产品选择进行到哪一步？'},
      readiness: {label: '资料 3 / 3', options: [
        {label: '已有准确 SKU', value: '已有准确 SKU'},
        {label: '需要协助筛选', value: '需要产品筛选建议'},
        {label: '已有配方需求', value: '已有配方需求'},
        {label: '还在初步了解', value: '产品初步了解'}
      ], reply: '好的。留下联系方式后，可带着刚才的需求继续填写询盘。'}
    }
  },
  fr: {
    launcher: 'Assistant e-mail', online: 'EN LIGNE · DEMANDES PRODUITS', title: 'Conseiller produit Guangtuo', close: 'Fermer l’assistant e-mail',
    intro: 'Indiquez si vous comparez des masques visage, yeux ou cou, vérifiez un SKU ou préparez un produit OEM / ODM.',
    askPlaceholder: 'Question sur un produit ou SKU…', askLabel: 'Poser une question', typing: 'Le conseiller répond',
    reviewReply: 'Ce point nécessite une revue produit ou commerciale. Ajoutez-le à la demande pour confirmation par un conseiller.',
    leadStage: 'COORDONNÉES', leadKicker: 'POURSUIVRE PAR E-MAIL', leadTitle: 'Laissez vos coordonnées.',
    leadBody: 'La famille de produits et la demande seront reprises dans le formulaire complet.', name: 'Nom', email: 'E-mail professionnel', company: 'Entreprise / marque',
    consent: 'J’accepte que Guangtuo utilise ces informations pour me contacter au sujet de cette demande de produit fini.',
    submit: 'Poursuivre la demande', handoff: 'Ouvrir le formulaire échantillon / devis', notesPrefix: 'Depuis l’assistant e-mail',
    guided: {
      goal: {label: 'DEMANDE 1 / 3', options: [
        {label: 'Comparer les 13 SKU', value: 'Comparer les 13 SKU de produits finis'},
        {label: 'Projet OEM / ODM', value: 'Développement OEM/ODM de produit fini'},
        {label: 'Demander des échantillons', value: 'Demande d’échantillons'},
        {label: 'Parler de l’hydrogel', value: 'Développement de produit hydrogel'}
      ], reply: 'Quelle famille de produits recherchez-vous ?'},
      family: {label: 'PRODUIT 2 / 3', options: [
        {label: 'Masques visage', value: 'Masques visage', category: 'face-masks'},
        {label: 'Masques yeux', value: 'Masques yeux', category: 'eye-masks'},
        {label: 'Masques cou', value: 'Masques cou', category: 'neck-masks'},
        {label: 'Pas encore décidé', value: 'Famille à confirmer'}
      ], reply: 'Où en êtes-vous dans le choix du produit ?'},
      readiness: {label: 'DÉTAILS 3 / 3', options: [
        {label: 'J’ai un SKU précis', value: 'SKU précis disponible'},
        {label: 'J’ai besoin d’une sélection', value: 'Sélection de produits demandée'},
        {label: 'J’ai un brief formule', value: 'Brief formule disponible'},
        {label: 'Je découvre la gamme', value: 'Exploration initiale'}
      ], reply: 'Merci. Laissez vos coordonnées pour poursuivre avec cette demande enregistrée.'}
    }
  },
  es: {
    launcher: 'Asistente de correo', online: 'EN LÍNEA · CONSULTAS DE PRODUCTO', title: 'Asesor de producto Guangtuo', close: 'Cerrar el asistente de correo',
    intro: 'Indica si comparas mascarillas faciales, de ojos o cuello, consultas un SKU o preparas un producto OEM / ODM.',
    askPlaceholder: 'Pregunta por un producto o SKU…', askLabel: 'Hacer una pregunta', typing: 'El asesor está respondiendo',
    reviewReply: 'Este punto requiere revisión de producto o comercial. Añádelo a la consulta y un asesor lo confirmará contigo.',
    leadStage: 'DATOS DE CONTACTO', leadKicker: 'CONTINUAR POR CORREO', leadTitle: 'Deja tus datos de contacto.',
    leadBody: 'La familia de producto y la solicitud pasarán al formulario completo.', name: 'Nombre', email: 'Correo de trabajo', company: 'Empresa / marca',
    consent: 'Acepto que Guangtuo use estos datos para contactarme sobre esta consulta de producto terminado.',
    submit: 'Continuar la consulta', handoff: 'Abrir formulario de muestras / cotización', notesPrefix: 'Desde el asistente de correo',
    guided: {
      goal: {label: 'SOLICITUD 1 / 3', options: [
        {label: 'Comparar los 13 SKU', value: 'Comparar los 13 SKU de producto terminado'},
        {label: 'Proyecto OEM / ODM', value: 'Desarrollo OEM/ODM de producto terminado'},
        {label: 'Solicitar muestras', value: 'Solicitud de muestras'},
        {label: 'Consultar hidrogel', value: 'Desarrollo de producto hidrogel'}
      ], reply: '¿Qué familia de productos estás considerando?'},
      family: {label: 'PRODUCTO 2 / 3', options: [
        {label: 'Mascarillas faciales', value: 'Mascarillas faciales', category: 'face-masks'},
        {label: 'Mascarillas de ojos', value: 'Mascarillas de ojos', category: 'eye-masks'},
        {label: 'Mascarillas de cuello', value: 'Mascarillas de cuello', category: 'neck-masks'},
        {label: 'Aún no lo sé', value: 'Familia por confirmar'}
      ], reply: '¿En qué punto está la elección del producto?'},
      readiness: {label: 'DETALLES 3 / 3', options: [
        {label: 'Tengo un SKU exacto', value: 'SKU exacto disponible'},
        {label: 'Necesito una selección', value: 'Selección de productos solicitada'},
        {label: 'Tengo un brief de fórmula', value: 'Brief de fórmula disponible'},
        {label: 'Estoy explorando', value: 'Exploración inicial'}
      ], reply: 'Gracias. Deja tus datos para continuar con la solicitud guardada.'}
    }
  }
};

export function MailAgentWidget({locale}: {locale: Locale}) {
  const copy = advisorCopy[locale];
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>('goal');
  const [brief, setBrief] = useState<BriefDraft>({});
  const [isTyping, setIsTyping] = useState(false);
  const nextMessageId = useRef(0);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageList = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  useEffect(() => {
    if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;
  }, [messages, isTyping]);

  function queueReply(answer: string) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setIsTyping(true);
    replyTimer.current = setTimeout(() => {
      const id = nextMessageId.current++;
      setMessages((current) => [...current, {id, role: 'agent', body: answer}]);
      setIsTyping(false);
    }, 420);
  }

  function selectGuided(option: GuidedOption) {
    if (isTyping || guidedStep === 'lead') return;
    const id = nextMessageId.current++;
    setMessages((current) => [...current, {id, role: 'user', body: option.label}]);

    if (guidedStep === 'goal') {
      setBrief((current) => ({...current, productGoal: option.value}));
      setGuidedStep('family');
    } else if (guidedStep === 'family') {
      const firstProduct = option.category ? products.find((product) => product.category === option.category) : undefined;
      setBrief((current) => ({...current, category: option.category, categoryLabel: option.value, sku: firstProduct?.sku}));
      setGuidedStep('readiness');
    } else {
      setBrief((current) => ({...current, packagingPreference: option.value}));
      setGuidedStep('lead');
    }

    queueReply(copy.guided[guidedStep].reply);
  }

  function ask(value: string) {
    const question = value.trim();
    if (!question || isTyping) return;
    const assessment = assessInboundMail({subject: 'Website enquiry', body: question, hasAttachments: false, confidence: 1});
    const selected = assessment.matchedPresetId
      ? mailAgentPresets.find((preset) => preset.id === assessment.matchedPresetId)
      : undefined;
    const answer = assessment.decision === 'substantive_auto_reply' && selected ? selected.answer[locale] : copy.reviewReply;
    const id = nextMessageId.current++;
    setMessages((current) => [...current, {id, role: 'user', body: question}]);
    setQuery('');
    queueReply(answer);
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(query);
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lead = {
      name: String(form.get('name') ?? ''),
      businessEmail: String(form.get('businessEmail') ?? ''),
      company: String(form.get('company') ?? ''),
      ...(brief.sku ? {sku: brief.sku} : {}),
      ...(brief.category ? {category: brief.category} : {}),
      productGoal: brief.productGoal ?? '',
      packagingPreference: brief.packagingPreference ?? brief.categoryLabel ?? '',
      notes: `${copy.notesPrefix}: ${[brief.productGoal, brief.categoryLabel, brief.packagingPreference].filter(Boolean).join(' · ')}`
    };
    sessionStorage.removeItem('gt-recommendation');
    sessionStorage.setItem('gt-mail-agent-lead', JSON.stringify(lead));
    router.push(localizedPath(locale, 'inquiry'));
  }

  const stageLabel = guidedStep === 'lead' ? copy.leadStage : copy.guided[guidedStep].label;

  return (
    <aside className={open ? 'mail-agent mail-agent--open' : 'mail-agent'}>
      {open && (
        <section id={panelId} className={guidedStep === 'lead' ? 'mail-agent__panel mail-agent__panel--lead' : 'mail-agent__panel'} role="dialog" aria-modal="false" aria-labelledby={`${panelId}-title`}>
          <header className="mail-agent__header">
            <div className="mail-agent__identity">
              <span className="mail-agent__avatar" aria-hidden="true">G</span>
              <div><p><span className="mail-agent__status" aria-hidden="true" />{copy.online}</p><h2 id={`${panelId}-title`}>{copy.title}</h2></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={copy.close}>×</button>
          </header>
          <div className="mail-agent__stage"><span>{stageLabel}</span><b>{guidedStep === 'lead' ? '✓' : '→'}</b></div>
          <div ref={messageList} className="mail-agent__messages" aria-live="polite">
            <p className="mail-agent__bubble mail-agent__bubble--agent">{copy.intro}</p>
            {messages.map((message) => <p key={message.id} className={`mail-agent__bubble mail-agent__bubble--${message.role}`}>{message.body}</p>)}
            {isTyping && <div className="mail-agent__typing" aria-label={copy.typing}><span /><span /><span /></div>}
          </div>
          {guidedStep !== 'lead' && (
            <>
              <div className="mail-agent__prompts">
                {copy.guided[guidedStep].options.map((option) => <button type="button" key={option.label} disabled={isTyping} onClick={() => selectGuided(option)}>{option.label}<span>↗</span></button>)}
              </div>
              <form className="mail-agent__form" onSubmit={submitQuestion}>
                <label className="sr-only" htmlFor={`${panelId}-input`}>{copy.askLabel}</label>
                <input id={`${panelId}-input`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.askPlaceholder} autoComplete="off" />
                <button type="submit" disabled={isTyping} aria-label={copy.askLabel}>↑</button>
              </form>
            </>
          )}
          {guidedStep === 'lead' && !isTyping && (
            <form className="mail-agent__lead" onSubmit={submitLead}>
              <div className="mail-agent__lead-heading"><small>{copy.leadKicker}</small><strong>{copy.leadTitle}</strong><p>{copy.leadBody}</p></div>
              <label><span>{copy.name}</span><input name="name" required maxLength={200} autoComplete="name" /></label>
              <label><span>{copy.email}</span><input name="businessEmail" type="email" required maxLength={254} autoComplete="email" /></label>
              <label><span>{copy.company}</span><input name="company" required maxLength={200} autoComplete="organization" /></label>
              <label className="mail-agent__lead-consent"><input type="checkbox" required /><span>{copy.consent}</span></label>
              <button type="submit">{copy.submit}<span>↗</span></button>
            </form>
          )}
          <Link className="mail-agent__handoff" href={localizedPath(locale, 'inquiry')}>{copy.handoff}<span>↗</span></Link>
        </section>
      )}
      <button className="mail-agent__launcher" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">✦</span>{copy.launcher}
      </button>
    </aside>
  );
}
