'use client';

import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useId, useRef, useState} from 'react';
import {type ProductCategory} from '@/data/catalog';
import {ContactMethods} from '@/components/contact-methods';
import {advisorResponse, type AdvisorMessage, type AdvisorBrief} from '@/lib/advisor-contracts';
import {resolveInquiryApiBaseUrl} from '@/lib/api-client';
import {localizedPath, type Locale} from '@/lib/routing';

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
  guided: Record<'goal' | 'family' | 'readiness', GuidedStage>;
};

const advisorCopy: Record<Locale, AdvisorCopy> = {
  en: {
    launcher: 'Email assistant', online: 'ONLINE · PRODUCT ENQUIRIES', title: 'Showki product advisor', close: 'Close email assistant',
    intro: 'Tell me whether you are comparing face masks, eye masks or targeted patches, checking a SKU, or planning an OEM/ODM product.',
    askPlaceholder: 'Ask about a product or SKU…', askLabel: 'Ask a question', typing: 'The advisor is replying',
    reviewReply: 'This needs a product or commercial review. Add it to your enquiry and an advisor will confirm it with you.',
    leadStage: 'CONTACT DETAILS', leadKicker: 'CONTINUE BY EMAIL', leadTitle: 'Leave your contact details.',
    leadBody: 'Your product family and request will be carried into the full enquiry form.', name: 'Name', email: 'Work email', company: 'Company / brand',
    consent: 'I agree that Showki may use these details to contact me about this finished-product enquiry.',
    submit: 'Continue to enquiry', handoff: 'Open the full sample / quote form', notesPrefix: 'From the email assistant',
    guided: {
      goal: {label: 'REQUEST 1 / 3', options: [
        {label: 'Compare the 21 SKUs', value: 'Compare the 21 finished-product SKUs'},
        {label: 'Discuss OEM / ODM', value: 'OEM/ODM finished-product development'},
        {label: 'Request samples', value: 'Product sample request'},
        {label: 'Ask about hydrogel', value: 'Hydrogel product development'}
      ], reply: 'Which product family are you considering?'},
      family: {label: 'PRODUCT 2 / 3', options: [
        {label: 'Face masks', value: 'Face masks', category: 'face-masks'},
        {label: 'Eye masks', value: 'Eye masks', category: 'eye-masks'},
        {label: 'Targeted patches', value: 'Targeted hydrogel patches', category: 'specialty-patches'},
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
    launcher: '在线咨询', online: '产品顾问 · 在线咨询', title: '修齐产品顾问', close: '关闭在线咨询',
    intro: '您好，想做面膜、眼膜，还是更有新意的局部护理贴？无论已有明确产品，还是只有初步设想，都欢迎在这里聊聊。',
    askPlaceholder: '咨询产品、样品、报价或交期…', askLabel: '发送问题', typing: '正在回复',
    reviewReply: '样品、价格、交期和市场要求，需要结合具体产品核实。您可以直接提交需求，我们会把确认结果发到工作邮箱。',
    leadStage: '继续沟通', leadKicker: '通过工作邮箱继续', leadTitle: '留下工作邮箱，把刚才聊的继续下去。',
    leadBody: '我们会带上刚才提到的产品与想法，您不必重新说明。', name: '您的姓名', email: '工作邮箱', company: '公司或品牌名称',
    consent: '我同意修齐使用以上信息与我沟通本次产品需求。',
    submit: '继续申请样品与报价', handoff: '直接申请样品或报价', notesPrefix: '在线咨询内容',
    guided: {
      goal: {label: '您希望获得什么', options: [
        {label: '看看现有产品', value: '了解并比较现有水凝膜产品'},
        {label: '开发品牌新品', value: '开发一款品牌水凝膜新品'},
        {label: '申请实物样品', value: '申请产品实物样品'},
        {label: '咨询报价与交期', value: '咨询产品报价与交期'}
      ], reply: '可以。您更关注哪一类水凝膜？'},
      family: {label: '您关注的产品', options: [
        {label: '面部面膜', value: '面部面膜', category: 'face-masks'},
        {label: '眼膜', value: '眼膜', category: 'eye-masks'},
        {label: '其他局部膜贴', value: '其他局部水凝膜贴', category: 'specialty-patches'},
        {label: '还没有确定', value: '希望由产品顾问推荐合适品类'}
      ], reply: '明白了。目前您手上已经有哪些产品想法？'},
      readiness: {label: '目前已有的想法', options: [
        {label: '已有产品编号', value: '已有准确产品编号'},
        {label: '已有参考图片', value: '已有产品或包装参考图片'},
        {label: '已有配方想法', value: '已有配方或成分想法'},
        {label: '希望获得推荐', value: '希望产品顾问结合需求推荐'}
      ], reply: '好的，请留下工作邮箱，我们会按刚才的产品方向继续沟通。'}
    }
  },
  fr: {
    launcher: 'Assistant e-mail', online: 'EN LIGNE · DEMANDES PRODUITS', title: 'Conseiller produit Showki', close: 'Fermer l’assistant e-mail',
    intro: 'Indiquez si vous comparez des masques visage, yeux ou des patchs ciblés, vérifiez un SKU ou préparez un produit OEM / ODM.',
    askPlaceholder: 'Question sur un produit ou SKU…', askLabel: 'Poser une question', typing: 'Le conseiller répond',
    reviewReply: 'Ce point nécessite une revue produit ou commerciale. Ajoutez-le à la demande pour confirmation par un conseiller.',
    leadStage: 'COORDONNÉES', leadKicker: 'POURSUIVRE PAR E-MAIL', leadTitle: 'Laissez vos coordonnées.',
    leadBody: 'La famille de produits et la demande seront reprises dans le formulaire complet.', name: 'Nom', email: 'E-mail professionnel', company: 'Entreprise / marque',
    consent: 'J’accepte que Showki utilise ces informations pour me contacter au sujet de cette demande de produit fini.',
    submit: 'Poursuivre la demande', handoff: 'Ouvrir le formulaire échantillon / devis', notesPrefix: 'Depuis l’assistant e-mail',
    guided: {
      goal: {label: 'DEMANDE 1 / 3', options: [
        {label: 'Comparer les 21 SKU', value: 'Comparer les 21 SKU de produits finis'},
        {label: 'Projet OEM / ODM', value: 'Développement OEM/ODM de produit fini'},
        {label: 'Demander des échantillons', value: 'Demande d’échantillons'},
        {label: 'Parler de l’hydrogel', value: 'Développement de produit hydrogel'}
      ], reply: 'Quelle famille de produits recherchez-vous ?'},
      family: {label: 'PRODUIT 2 / 3', options: [
        {label: 'Masques visage', value: 'Masques visage', category: 'face-masks'},
        {label: 'Masques yeux', value: 'Masques yeux', category: 'eye-masks'},
        {label: 'Patchs ciblés', value: 'Patchs hydrogel ciblés', category: 'specialty-patches'},
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
    launcher: 'Asistente de correo', online: 'EN LÍNEA · CONSULTAS DE PRODUCTO', title: 'Asesor de producto Showki', close: 'Cerrar el asistente de correo',
    intro: 'Indica si comparas mascarillas faciales, de ojos o parches localizados, consultas un SKU o preparas un producto OEM / ODM.',
    askPlaceholder: 'Pregunta por un producto o SKU…', askLabel: 'Hacer una pregunta', typing: 'El asesor está respondiendo',
    reviewReply: 'Este punto requiere revisión de producto o comercial. Añádelo a la consulta y un asesor lo confirmará contigo.',
    leadStage: 'DATOS DE CONTACTO', leadKicker: 'CONTINUAR POR CORREO', leadTitle: 'Deja tus datos de contacto.',
    leadBody: 'La familia de producto y la solicitud pasarán al formulario completo.', name: 'Nombre', email: 'Correo de trabajo', company: 'Empresa / marca',
    consent: 'Acepto que Showki use estos datos para contactarme sobre esta consulta de producto terminado.',
    submit: 'Continuar la consulta', handoff: 'Abrir formulario de muestras / cotización', notesPrefix: 'Desde el asistente de correo',
    guided: {
      goal: {label: 'SOLICITUD 1 / 3', options: [
        {label: 'Comparar los 21 SKU', value: 'Comparar los 21 SKU de producto terminado'},
        {label: 'Proyecto OEM / ODM', value: 'Desarrollo OEM/ODM de producto terminado'},
        {label: 'Solicitar muestras', value: 'Solicitud de muestras'},
        {label: 'Consultar hidrogel', value: 'Desarrollo de producto hidrogel'}
      ], reply: '¿Qué familia de productos estás considerando?'},
      family: {label: 'PRODUCTO 2 / 3', options: [
        {label: 'Mascarillas faciales', value: 'Mascarillas faciales', category: 'face-masks'},
        {label: 'Mascarillas de ojos', value: 'Mascarillas de ojos', category: 'eye-masks'},
        {label: 'Parches localizados', value: 'Parches de hidrogel localizados', category: 'specialty-patches'},
        {label: 'Aún no lo sé', value: 'Familia por confirmar'}
      ], reply: '¿En qué punto está la elección del producto?'},
      readiness: {label: 'DETALLES 3 / 3', options: [
        {label: 'Tengo un SKU exacto', value: 'SKU exacto disponible'},
        {label: 'Necesito una selección', value: 'Selección de productos solicitada'},
        {label: 'Tengo un brief de fórmula', value: 'Brief de fórmula disponible'},
        {label: 'Estoy explorando', value: 'Exploración inicial'}
      ], reply: 'Gracias. Deja tus datos para continuar con la solicitud guardada.'}
    }
  },
  ru: {
    launcher: 'Почтовый помощник', online: 'ОНЛАЙН · ЗАПРОСЫ ПО ПРОДУКЦИИ', title: 'Консультант Showki', close: 'Закрыть помощника',
    intro: 'Расскажите, сравниваете ли вы маски для лица, глаз или локальные патчи, проверяете SKU или планируете продукт OEM / ODM.',
    askPlaceholder: 'Вопрос о продукте или SKU…', askLabel: 'Задать вопрос', typing: 'Консультант отвечает',
    reviewReply: 'Этот вопрос требует проверки продукта или коммерческих условий. Добавьте его к запросу, и консультант всё подтвердит.',
    leadStage: 'КОНТАКТНЫЕ ДАННЫЕ', leadKicker: 'ПРОДОЛЖИТЬ ПО ПОЧТЕ', leadTitle: 'Оставьте контактные данные.',
    leadBody: 'Категория продукта и запрос будут перенесены в полную форму.', name: 'Имя', email: 'Рабочая почта', company: 'Компания / бренд',
    consent: 'Я разрешаю Showki использовать эти данные для связи со мной по поводу запроса готового продукта.',
    submit: 'Перейти к запросу', handoff: 'Открыть полную форму образцов / цены', notesPrefix: 'Из почтового помощника',
    guided: {
      goal: {label: 'ЗАПРОС 1 / 3', options: [
        {label: 'Сравнить 21 SKU', value: 'Сравнить 21 SKU готовой продукции'},
        {label: 'Обсудить OEM / ODM', value: 'Разработка готового продукта OEM/ODM'},
        {label: 'Запросить образцы', value: 'Запрос образцов продукции'},
        {label: 'Спросить о гидрогеле', value: 'Разработка гидрогелевого продукта'}
      ], reply: 'Какая категория продукции вас интересует?'},
      family: {label: 'ПРОДУКТ 2 / 3', options: [
        {label: 'Маски для лица', value: 'Маски для лица', category: 'face-masks'},
        {label: 'Патчи для глаз', value: 'Патчи для глаз', category: 'eye-masks'},
        {label: 'Локальные патчи', value: 'Локальные гидрогелевые патчи', category: 'specialty-patches'},
        {label: 'Пока не уверен(а)', value: 'Категория будет уточнена'}
      ], reply: 'На каком этапе находится выбор продукта?'},
      readiness: {label: 'ДЕТАЛИ 3 / 3', options: [
        {label: 'У меня есть точный SKU', value: 'Точный SKU известен'},
        {label: 'Нужна подборка', value: 'Требуется подборка продуктов'},
        {label: 'Есть бриф формулы', value: 'Есть бриф формулы'},
        {label: 'Пока изучаю', value: 'Первичное изучение продукции'}
      ], reply: 'Спасибо. Оставьте контактные данные и продолжите с сохранённым запросом.'}
    }
  },
  ar: {
    launcher: 'مساعد البريد', online: 'متصل · استفسارات المنتجات', title: 'مستشار منتجات Showki', close: 'إغلاق مساعد البريد',
    intro: 'أخبرني إن كنت تقارن أقنعة الوجه أو العين أو اللصقات الموضعية، أو تتحقق من SKU، أو تخطط لمنتج OEM / ODM.',
    askPlaceholder: 'اسأل عن منتج أو SKU…', askLabel: 'اطرح سؤالاً', typing: 'المستشار يرد',
    reviewReply: 'يحتاج هذا السؤال إلى مراجعة المنتج أو الشروط التجارية. أضفه إلى الاستفسار وسيؤكده المستشار معك.',
    leadStage: 'بيانات الاتصال', leadKicker: 'المتابعة عبر البريد', leadTitle: 'اترك بيانات الاتصال.',
    leadBody: 'ستنتقل فئة المنتج والطلب إلى نموذج الاستفسار الكامل.', name: 'الاسم', email: 'بريد العمل', company: 'الشركة / العلامة',
    consent: 'أوافق على استخدام Showki لهذه البيانات للتواصل معي بشأن استفسار المنتج الجاهز.',
    submit: 'المتابعة إلى الاستفسار', handoff: 'فتح نموذج العينات / عرض السعر الكامل', notesPrefix: 'من مساعد البريد',
    guided: {
      goal: {label: 'الطلب 1 / 3', options: [
        {label: 'مقارنة 21 SKU', value: 'مقارنة 21 SKU للمنتجات الجاهزة'},
        {label: 'مناقشة OEM / ODM', value: 'تطوير منتج جاهز OEM/ODM'},
        {label: 'طلب عينات', value: 'طلب عينات منتجات'},
        {label: 'السؤال عن الهيدروجيل', value: 'تطوير منتج هيدروجيل'}
      ], reply: 'ما فئة المنتج التي تفكر فيها؟'},
      family: {label: 'المنتج 2 / 3', options: [
        {label: 'أقنعة الوجه', value: 'أقنعة الوجه', category: 'face-masks'},
        {label: 'لصقات العين', value: 'لصقات العين', category: 'eye-masks'},
        {label: 'لصقات موضعية', value: 'لصقات هيدروجيل موضعية', category: 'specialty-patches'},
        {label: 'لست متأكداً بعد', value: 'فئة المنتج تحتاج إلى تأكيد'}
      ], reply: 'إلى أي مرحلة وصلت في اختيار المنتج؟'},
      readiness: {label: 'التفاصيل 3 / 3', options: [
        {label: 'لدي SKU محدد', value: 'SKU محدد متوفر'},
        {label: 'أحتاج قائمة مختصرة', value: 'مطلوب ترشيح منتجات'},
        {label: 'لدي موجز تركيبة', value: 'موجز التركيبة متوفر'},
        {label: 'ما زلت أستكشف', value: 'استكشاف أولي للمنتجات'}
      ], reply: 'شكراً. اترك بيانات الاتصال وتابع مع الطلب المحفوظ.'}
    }
  }
};

export function MailAgentWidget({locale}: {locale: Locale}) {
  const copy = advisorCopy[locale];
  const zh = locale === 'zh';
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [brief, setBrief] = useState<Partial<AdvisorBrief>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messageList = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const storageKey = `showki-advisor:${locale}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        if (saved && Array.isArray(saved.messages)) {setMessages(saved.messages); setBrief(saved.brief ?? {});}
      } catch {sessionStorage.removeItem(storageKey);}
    });
    return () => {cancelAnimationFrame(frame); abort.current?.abort();};
  }, [storageKey]);
  useEffect(() => {if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;}, [messages, isTyping]);
  function save(next: AdvisorMessage[], nextBrief: Partial<AdvisorBrief>) {
    sessionStorage.setItem(storageKey, JSON.stringify({messages: next, brief: nextBrief}));
  }
  async function ask(value: string, retry = false) {
    const question = value.trim();
    if ((!question && !retry) || inFlight.current) return;
    const next: AdvisorMessage[] = retry ? messages : [...messages, {role: 'user', content: question}];
    if (next.length > 79) {setError(zh ? '这段对话已较长，请打开需求表继续补充。全部对话都会保留。' : 'Please continue in the inquiry form. Your full conversation will be preserved.'); return;}
    inFlight.current = true; setMessages(next); setQuery(''); setError(''); setIsTyping(true); save(next, brief);
    const controller = new AbortController(); abort.current = controller;
    const timer = setTimeout(() => controller.abort(), 70_000);
    try {
      const base = resolveInquiryApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, process.env.NODE_ENV === 'production');
      if (!base) throw new Error('NOT_CONFIGURED');
      const response = await fetch(`${base.replace(/\/$/, '')}/advisor`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({locale, messages: next}), signal: controller.signal});
      if (!response.ok) throw new Error('UNAVAILABLE');
      const result = advisorResponse.parse(await response.json());
      const complete: AdvisorMessage[] = [...next, {role: 'assistant', content: result.reply}];
      setMessages(complete); setBrief(result.brief); setSuggestions(result.suggestions); save(complete, result.brief);
    } catch {setError(zh ? '这次暂时未能回复，您的需求已保留。可以重试，或带着完整对话打开需求表。' : 'We could not get a reply. Your requirements are saved. Retry or continue in the inquiry form.');}
    finally {clearTimeout(timer); inFlight.current = false; setIsTyping(false);}
  }
  function handoff() {
    const lead = {...brief, salesChannel: ['online', 'offline', 'both'].includes(brief.salesChannel ?? '') ? brief.salesChannel : undefined, salesPlatforms: brief.salesPlatforms?.split(/[,，]/).map(item => item.trim()).filter(Boolean), conversation: messages};
    sessionStorage.removeItem('gt-recommendation');
    sessionStorage.setItem('gt-mail-agent-lead', JSON.stringify(lead));
    setOpen(false); router.push(localizedPath(locale, 'inquiry'));
  }
  function submit(event: FormEvent<HTMLFormElement>) {event.preventDefault(); void ask(query);}
  return <aside className={open ? 'mail-agent mail-agent--open' : 'mail-agent'}>
    {open && <section id={panelId} className="mail-agent__panel" role="dialog" aria-modal="false" aria-labelledby={`${panelId}-title`} onKeyDown={event => {if(event.key === 'Escape') setOpen(false);}}>
      <header className="mail-agent__header"><div className="mail-agent__identity"><span className="mail-agent__avatar" aria-hidden="true">S</span><div><p>SHOWKI BIOTECH</p><h2 id={`${panelId}-title`}>{copy.title}</h2></div></div><button type="button" onClick={() => setOpen(false)} aria-label={copy.close}>×</button></header>
      <div ref={messageList} className="mail-agent__messages" role="log" aria-live="polite">
        <p className="mail-agent__bubble mail-agent__bubble--agent">{zh ? '您好，我是修齐产品顾问。您正在筹备什么产品？可以先说一个想法，也可以把已有的功效、市场和包装需求一起告诉我。' : copy.intro}</p>
        {messages.map((message, index) => <p key={index} className={`mail-agent__bubble mail-agent__bubble--${message.role === 'assistant' ? 'agent' : 'user'}`}>{message.content}</p>)}
        {isTyping && <p role="status" className="mail-agent__bubble">{zh ? '正在梳理您的需求…' : copy.typing}</p>}
        {error && <div role="alert" className="advisor-error"><p>{error}</p><button type="button" disabled={isTyping} onClick={() => void ask('', true)}>{zh ? '重试回复' : 'Retry'}</button></div>}
      </div>
      <div className="mail-agent__prompts">{(messages.length ? suggestions : copy.guided.goal.options.map(option => option.label)).map(value => <button key={value} type="button" disabled={isTyping} onClick={() => void ask(value)}>{value}<span>↗</span></button>)}</div>
      <form className="mail-agent__form" onSubmit={submit}><label className="sr-only" htmlFor={`${panelId}-input`}>{copy.askLabel}</label><input id={`${panelId}-input`} value={query} maxLength={4000} onChange={event => setQuery(event.target.value)} placeholder={zh ? '补充想法，或修改前面的需求…' : copy.askPlaceholder} /><button type="submit" disabled={isTyping || !query.trim()} aria-label={copy.askLabel}>↑</button></form>
      <button type="button" className="mail-agent__handoff" disabled={isTyping} onClick={handoff}>{zh ? '带着这些需求，申请样品或报价' : copy.handoff}<span>↗</span></button>
      <details className="advisor-contact"><summary>{zh ? '直接联系修齐' : 'Contact SHOWKI'}</summary><ContactMethods locale={locale} /></details>
    </section>}
    <button className="mail-agent__launcher" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}><span aria-hidden="true">✦</span>{zh ? '聊聊产品想法' : copy.launcher}</button>
  </aside>;
}
