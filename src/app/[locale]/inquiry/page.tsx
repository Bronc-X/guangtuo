import type {Metadata} from 'next';
import {ContactMethods} from '@/components/contact-methods';
import {InquiryForm} from '@/components/inquiry-form';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

const metadataCopy: Record<Locale, {title: string; description: string}> = {
  en: {title: 'Request samples or a quote', description: 'Request hydrogel mask samples, pricing and lead-time information from Showki Biotech.'},
  zh: {title: '申请样品与报价', description: '申请护肤品与水凝膜实物样品，并咨询起订量、报价和交期。'},
  fr: {title: 'Demander des échantillons ou un devis', description: 'Demandez des échantillons, un devis et des délais pour les masques hydrogel Showki Biotech.'},
  es: {title: 'Solicitar muestras o cotización', description: 'Solicite muestras, precios y plazos para mascarillas de hidrogel Showki Biotech.'},
  ru: {title: 'Запросить образцы или расчёт', description: 'Запросите образцы, цены и сроки для гидрогелевых масок Showki Biotech.'},
  ar: {title: 'طلب عينات أو عرض سعر', description: 'اطلب عينات وأسعاراً ومواعيد توريد لأقنعة الهيدروجيل من Showki Biotech.'}
};

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]; sideEyebrow: string; sideTitle: string; sideBody: string; list: string[]}> = {
  en: {eyebrow: 'SAMPLES & PRICING', title: 'Ask for a sample\nor a useful price.', body: 'Choose a product and tell us the quantity, market and timing you have in mind.', meta: ['Product', 'Use', 'Quantity', 'Market'], sideEyebrow: 'WHAT HELPS', sideTitle: 'Three details make the reply faster.', sideBody: 'It is fine if everything is not decided yet. Share what you know and we will ask only for what is still needed.', list: ['The product or closest reference', 'Any formula, feel or packaging preference', 'Expected quantity and timing']},
  zh: {eyebrow: '申请样品与报价', title: '想看实物、问价格，\n从这里开始。', body: '看中了某款产品，可以直接申请样品；只有膜型、肤感或包装想法，也欢迎来聊。结合预计数量与目标市场，我们会进一步确认报价和交期。', meta: ['实物样品', '产品报价', '参考起订量', '交付时间'], sideEyebrow: '一张参考图，也能开始', sideTitle: '有想法，就能开始。', sideBody: '感兴趣的产品、理想肤感或大致数量，提供其中任何一项，都能让沟通更具体。', list: ['感兴趣的产品或参考图片', '希望呈现的成分、肤感或包装', '预计数量与上市时间']},
  fr: {eyebrow: 'ÉCHANTILLONS ET DEVIS', title: 'Demandez un échantillon\nou un prix utile.', body: 'Choisissez un produit et indiquez la quantité, le marché et le calendrier envisagés.', meta: ['Produit', 'Usage', 'Quantité', 'Marché'], sideEyebrow: 'CE QUI AIDE', sideTitle: 'Trois détails accélèrent la réponse.', sideBody: 'Ce n’est pas grave si tout n’est pas encore décidé. Partagez ce que vous savez et nous demanderons seulement ce qui manque.', list: ['Le produit ou la référence la plus proche', 'Vos préférences de formule, toucher ou emballage', 'La quantité et le calendrier']},
  es: {eyebrow: 'MUESTRAS Y COTIZACIÓN', title: 'Solicite una muestra\no un precio útil.', body: 'Elija un producto e indique la cantidad, el mercado y los plazos que tiene en mente.', meta: ['Producto', 'Uso', 'Cantidad', 'Mercado'], sideEyebrow: 'LO QUE AYUDA', sideTitle: 'Tres detalles agilizan la respuesta.', sideBody: 'No pasa nada si aún no está todo decidido. Comparta lo que sabe y preguntaremos solo lo que falte.', list: ['El producto o la referencia más cercana', 'Preferencias de fórmula, tacto o empaque', 'Cantidad y plazos previstos']},
  ru: {eyebrow: 'ОБРАЗЦЫ И ЦЕНЫ', title: 'Запросите образец\nили полезный расчёт.', body: 'Выберите продукт и укажите предполагаемые количество, рынок и сроки.', meta: ['Продукт', 'Назначение', 'Количество', 'Рынок'], sideEyebrow: 'ЧТО ПОМОЖЕТ', sideTitle: 'Три детали ускорят ответ.', sideBody: 'Не страшно, если ещё не всё решено. Расскажите, что уже известно, а мы уточним только необходимое.', list: ['Продукт или ближайший референс', 'Пожелания по формуле, ощущению или упаковке', 'Ожидаемые количество и сроки']},
  ar: {eyebrow: 'العينات والأسعار', title: 'اطلب عينة\nأو سعراً مفيداً.', body: 'اختر منتجاً وأخبرنا بالكمية والسوق والموعد المتوقع.', meta: ['المنتج', 'الاستخدام', 'الكمية', 'السوق'], sideEyebrow: 'ما يساعدنا', sideTitle: 'ثلاثة تفاصيل تسرّع الرد.', sideBody: 'لا بأس إن لم تحسم كل شيء بعد. شارك ما تعرفه وسنسأل فقط عما ينقص.', list: ['المنتج أو أقرب مرجع', 'تفضيلات التركيبة أو الملمس أو التغليف', 'الكمية والموعد المتوقعان']}
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {...metadataCopy[locale], robots: {index: false, follow: false}};
}

export default async function InquiryPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section form-section"><div id="inquiry-form" className="form-layout-shell form-layout-shell--contacts"><div className="inquiry-sidebar"><aside className="form-context form-context--dark"><p className="eyebrow">{page.sideEyebrow}</p><h2>{page.sideTitle}</h2><p>{page.sideBody}</p><ul>{page.list.map((item) => <li key={item}>{item}</li>)}</ul></aside><ContactMethods locale={locale} layout="sidebar" /></div><InquiryForm locale={locale} /></div></section></main>;
}
