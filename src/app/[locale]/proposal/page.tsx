import type {Metadata} from 'next';
import {ProposalPreview} from '@/components/proposal-preview';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]}> = {
  en: {eyebrow: 'YOUR CHOSEN PRODUCT', title: 'Your mask idea,\ngathered in one place.', body: 'Check the product and preferences you shared, then continue to samples or pricing.', meta: ['Chosen product', 'Your preferences', 'Samples & pricing']},
  zh: {eyebrow: '离样品更近一步', title: '您想做的水凝膜，\n已经有了清晰方向。', body: '参考产品、理想肤感与包装重点都在这里。确认符合设想后，即可申请实物样品并咨询报价与交期。', meta: ['参考产品', '品牌重点', '样品与报价']},
  fr: {eyebrow: 'VOTRE PRODUIT', title: 'Votre idée de masque,\nréunie au même endroit.', body: 'Vérifiez le produit et les préférences partagées, puis passez aux échantillons ou au devis.', meta: ['Produit choisi', 'Vos préférences', 'Échantillons et devis']},
  es: {eyebrow: 'SU PRODUCTO ELEGIDO', title: 'Su idea de mascarilla,\nreunida en un solo lugar.', body: 'Compruebe el producto y las preferencias que compartió y continúe a muestras o precios.', meta: ['Producto elegido', 'Sus preferencias', 'Muestras y precios']},
  ru: {eyebrow: 'ВЫБРАННЫЙ ПРОДУКТ', title: 'Ваша идея маски —\nв одном месте.', body: 'Проверьте выбранный продукт и пожелания, затем перейдите к образцам или расчёту.', meta: ['Выбранный продукт', 'Ваши пожелания', 'Образцы и цены']},
  ar: {eyebrow: 'المنتج الذي اخترته', title: 'فكرة قناعك،\nمجتمعة في مكان واحد.', body: 'راجع المنتج والتفضيلات التي شاركتها، ثم انتقل إلى العينات أو الأسعار.', meta: ['المنتج المختار', 'تفضيلاتك', 'العينات والأسعار']}
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {
    title: locale === 'zh' ? '水凝膜产品需求确认' : copy[locale].eyebrow,
    description: copy[locale].body,
    robots: {index: false, follow: false}
  };
}

export default async function ProposalPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section"><ProposalPreview locale={locale} /></section></main>;
}
