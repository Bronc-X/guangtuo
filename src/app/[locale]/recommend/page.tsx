import {RecommendationForm} from '@/components/recommendation-form';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]; sideEyebrow: string; sideTitle: string; sideBody: string; list: string[]}> = {
  en: {eyebrow: 'FIND YOUR MASK', title: 'Choose the mask\nthat feels closest.', body: 'Compare facial, eye and neck products, then tell us how you would make the chosen one your own.', meta: ['Product', 'Use', 'Quantity', 'Launch'], sideEyebrow: 'A SIMPLE START', sideTitle: 'Begin with the closest finished product.', sideBody: 'You can keep it as it is or change the formula, fit, fill and packaging later.', list: ['Choose a finished mask', 'Describe the skincare experience you want', 'Add quantity and launch timing']},
  zh: {eyebrow: '找到合适的面膜', title: '先选择一款\n最接近想法的产品。', body: '比较面部、眼部与颈部产品，再告诉我们希望怎样把它变成自己的产品。', meta: ['产品', '用途', '数量', '上市时间'], sideEyebrow: '简单开始', sideTitle: '从最接近的成品款开始。', sideBody: '可以保留现有方案，也可以继续调整配方、版型、内容量与包装。', list: ['选择一款成品面膜', '说明希望带来的护肤体验', '补充数量与上市时间']},
  fr: {eyebrow: 'TROUVER VOTRE MASQUE', title: 'Choisissez le masque\nle plus proche de votre idée.', body: 'Comparez les produits visage, yeux et cou, puis dites-nous comment vous souhaitez personnaliser votre choix.', meta: ['Produit', 'Usage', 'Quantité', 'Lancement'], sideEyebrow: 'UN DÉPART SIMPLE', sideTitle: 'Commencez par le produit fini le plus proche.', sideBody: 'Gardez-le tel quel ou adaptez ensuite la formule, la coupe, le remplissage et l’emballage.', list: ['Choisir un masque fini', 'Décrire l’expérience de soin souhaitée', 'Ajouter la quantité et le calendrier']},
  es: {eyebrow: 'ENCONTRAR SU MASCARILLA', title: 'Elija la mascarilla\nmás cercana a su idea.', body: 'Compare productos faciales, oculares y de cuello y díganos cómo desea personalizar su elección.', meta: ['Producto', 'Uso', 'Cantidad', 'Lanzamiento'], sideEyebrow: 'UN INICIO SENCILLO', sideTitle: 'Empiece por el producto terminado más cercano.', sideBody: 'Puede mantenerlo tal cual o adaptar después la fórmula, el ajuste, el contenido y el envase.', list: ['Elegir una mascarilla terminada', 'Describir la experiencia de cuidado deseada', 'Añadir cantidad y plazos']}
};

export default async function RecommendPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section form-section"><div className="form-layout-shell"><aside className="form-context"><p className="eyebrow">{page.sideEyebrow}</p><h2>{page.sideTitle}</h2><p>{page.sideBody}</p><ol>{page.list.map((item) => <li key={item}>{item}</li>)}</ol></aside><RecommendationForm locale={locale} /></div></section></main>;
}
