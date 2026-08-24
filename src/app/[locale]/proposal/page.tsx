import {ProposalPreview} from '@/components/proposal-preview';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]}> = {
  en: {eyebrow: 'YOUR CHOSEN PRODUCT', title: 'Your mask idea,\ngathered in one place.', body: 'Check the product and preferences you shared, then continue to samples or pricing.', meta: ['Chosen product', 'Your preferences', 'Samples & pricing']},
  zh: {eyebrow: '您选择的产品', title: '您的面膜想法，\n集中展示在这里。', body: '查看已选择的产品与偏好，然后继续申请样品或报价。', meta: ['所选产品', '您的偏好', '样品与报价']},
  fr: {eyebrow: 'VOTRE PRODUIT', title: 'Votre idée de masque,\nréunie au même endroit.', body: 'Vérifiez le produit et les préférences partagées, puis passez aux échantillons ou au devis.', meta: ['Produit choisi', 'Vos préférences', 'Échantillons et devis']},
  es: {eyebrow: 'SU PRODUCTO ELEGIDO', title: 'Su idea de mascarilla,\nreunida en un solo lugar.', body: 'Compruebe el producto y las preferencias que compartió y continúe a muestras o precios.', meta: ['Producto elegido', 'Sus preferencias', 'Muestras y precios']}
};

export default async function ProposalPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section"><ProposalPreview locale={locale} /></section></main>;
}
