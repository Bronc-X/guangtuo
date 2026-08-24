import type {Metadata} from 'next';
import {InquiryForm} from '@/components/inquiry-form';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

export const metadata: Metadata = {title: 'Request samples or a quote', robots: {index: false, follow: false}};

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]; sideEyebrow: string; sideTitle: string; sideBody: string; list: string[]}> = {
  en: {eyebrow: 'SAMPLES & PRICING', title: 'Ask for a sample\nor a useful price.', body: 'Choose a product and tell us the quantity, market and timing you have in mind.', meta: ['Product', 'Use', 'Quantity', 'Market'], sideEyebrow: 'WHAT HELPS', sideTitle: 'Three details make the reply faster.', sideBody: 'It is fine if everything is not decided yet. Share what you know and we will ask only for what is still needed.', list: ['The product or closest reference', 'Any formula, feel or packaging preference', 'Expected quantity and timing']},
  zh: {eyebrow: '样品与报价', title: '申请一份样品，\n或一份有参考价值的报价。', body: '选择产品，并告诉我们预计数量、目标市场与时间。', meta: ['产品', '用途', '数量', '市场'], sideEyebrow: '这些信息会有帮助', sideTitle: '准备三个细节，回复会更快。', sideBody: '信息还没完全确定也没关系，先提交已知内容，我们只会继续询问必要的信息。', list: ['产品或最接近的参考款', '配方、触感或包装偏好', '预计数量与时间']},
  fr: {eyebrow: 'ÉCHANTILLONS ET DEVIS', title: 'Demandez un échantillon\nou un prix utile.', body: 'Choisissez un produit et indiquez la quantité, le marché et le calendrier envisagés.', meta: ['Produit', 'Usage', 'Quantité', 'Marché'], sideEyebrow: 'CE QUI AIDE', sideTitle: 'Trois détails accélèrent la réponse.', sideBody: 'Ce n’est pas grave si tout n’est pas encore décidé. Partagez ce que vous savez et nous demanderons seulement ce qui manque.', list: ['Le produit ou la référence la plus proche', 'Vos préférences de formule, toucher ou emballage', 'La quantité et le calendrier']},
  es: {eyebrow: 'MUESTRAS Y COTIZACIÓN', title: 'Solicite una muestra\no un precio útil.', body: 'Elija un producto e indique la cantidad, el mercado y los plazos que tiene en mente.', meta: ['Producto', 'Uso', 'Cantidad', 'Mercado'], sideEyebrow: 'LO QUE AYUDA', sideTitle: 'Tres detalles agilizan la respuesta.', sideBody: 'No pasa nada si aún no está todo decidido. Comparta lo que sabe y preguntaremos solo lo que falte.', list: ['El producto o la referencia más cercana', 'Preferencias de fórmula, tacto o empaque', 'Cantidad y plazos previstos']}
};

export default async function InquiryPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section form-section"><div className="form-layout-shell"><aside className="form-context form-context--dark"><p className="eyebrow">{page.sideEyebrow}</p><h2>{page.sideTitle}</h2><p>{page.sideBody}</p><ul>{page.list.map((item) => <li key={item}>{item}</li>)}</ul></aside><InquiryForm locale={locale} /></div></section></main>;
}
