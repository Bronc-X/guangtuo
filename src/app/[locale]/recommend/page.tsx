import type {Metadata} from 'next';
import {RecommendationForm} from '@/components/recommendation-form';
import {PageIntro} from '@/components/site-section-kit';
import {isLocale, type Locale} from '@/lib/routing';

const copy: Record<Locale, {eyebrow: string; title: string; body: string; meta: string[]; sideEyebrow: string; sideTitle: string; sideBody: string; list: string[]}> = {
  en: {eyebrow: 'FIND YOUR MASK', title: 'Choose the mask\nthat feels closest.', body: 'Compare face masks, eye masks and targeted hydrogel patches, then tell us how you would make the chosen one your own.', meta: ['Product', 'Use', 'Quantity', 'Launch'], sideEyebrow: 'A SIMPLE START', sideTitle: 'Begin with the closest finished product.', sideBody: 'You can keep it as it is or change the formula, fit, fill and packaging later.', list: ['Choose a finished mask', 'Describe the skincare experience you want', 'Add quantity and launch timing']},
  zh: {eyebrow: '为新品挑一款水凝膜', title: '从现有好产品里，\n找到更像您品牌的方向。', body: '面膜、眼膜与其他局部膜贴，都可以比较外观、成分和规格。看中的颜色、膜型与肤感可以保留，其他细节继续围绕品牌调整。', meta: ['产品外观', '真实肤感', '预计数量', '上市时间'], sideEyebrow: '实物比想象更可靠', sideTitle: '一款接近的现有产品，能省掉很多想象。', sideBody: '颜色、质地与贴合度都能用样品亲自判断，配方、内容量和包装也能据此做得更像您的品牌。', list: ['看得见的产品外观与成分', '贴得到的肤感与贴合度', '谈得清的样品、数量与上市时间']},
  fr: {eyebrow: 'TROUVER VOTRE MASQUE', title: 'Choisissez le masque\nle plus proche de votre idée.', body: 'Comparez les masques visage, yeux et les patchs ciblés, puis dites-nous comment personnaliser votre choix.', meta: ['Produit', 'Usage', 'Quantité', 'Lancement'], sideEyebrow: 'UN DÉPART SIMPLE', sideTitle: 'Commencez par le produit fini le plus proche.', sideBody: 'Gardez-le tel quel ou adaptez ensuite la formule, la coupe, le remplissage et l’emballage.', list: ['Choisir un masque fini', 'Décrire l’expérience de soin souhaitée', 'Ajouter la quantité et le calendrier']},
  es: {eyebrow: 'ENCONTRAR SU MASCARILLA', title: 'Elija la mascarilla\nmás cercana a su idea.', body: 'Compare mascarillas faciales, oculares y parches localizados y díganos cómo desea personalizar su elección.', meta: ['Producto', 'Uso', 'Cantidad', 'Lanzamiento'], sideEyebrow: 'UN INICIO SENCILLO', sideTitle: 'Empiece por el producto terminado más cercano.', sideBody: 'Puede mantenerlo tal cual o adaptar después la fórmula, el ajuste, el contenido y el envase.', list: ['Elegir una mascarilla terminada', 'Describir la experiencia de cuidado deseada', 'Añadir cantidad y plazos']},
  ru: {eyebrow: 'НАЙДИТЕ СВОЮ МАСКУ', title: 'Выберите маску,\nкоторая ближе всего к вашей идее.', body: 'Сравните маски для лица, глаз и локальные гидрогелевые патчи и расскажите, как адаптировать вариант.', meta: ['Продукт', 'Назначение', 'Количество', 'Запуск'], sideEyebrow: 'ПРОСТОЕ НАЧАЛО', sideTitle: 'Начните с ближайшего готового продукта.', sideBody: 'Оставьте его как есть или позже измените формулу, посадку, наполнение и упаковку.', list: ['Выберите готовую маску', 'Опишите желаемое впечатление от ухода', 'Добавьте количество и срок запуска']},
  ar: {eyebrow: 'اعثر على قناعك', title: 'اختر القناع\nالأقرب إلى فكرتك.', body: 'قارن أقنعة الوجه والعين ولصقات الهيدروجيل الموضعية، ثم أخبرنا كيف تريد تخصيص اختيارك.', meta: ['المنتج', 'الاستخدام', 'الكمية', 'الإطلاق'], sideEyebrow: 'بداية بسيطة', sideTitle: 'ابدأ بأقرب منتج جاهز.', sideBody: 'يمكنك إبقاؤه كما هو أو تعديل التركيبة والملاءمة والمحتوى والتغليف لاحقاً.', list: ['اختر قناعاً جاهزاً', 'صف تجربة العناية التي تريدها', 'أضف الكمية وموعد الإطلاق']}
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {
    title: locale === 'zh' ? '水凝膜产品推荐' : copy[locale].eyebrow,
    description: copy[locale].body,
    robots: {index: false, follow: false}
  };
}

export default async function RecommendPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const page = copy[locale];
  return <main className="page-main"><PageIntro eyebrow={page.eyebrow} title={page.title} body={page.body} meta={page.meta} /><section className="section form-section"><div className="form-layout-shell"><aside className="form-context"><p className="eyebrow">{page.sideEyebrow}</p><h2>{page.sideTitle}</h2><p>{page.sideBody}</p><ol>{page.list.map((item) => <li key={item}>{item}</li>)}</ol></aside><RecommendationForm locale={locale} /></div></section></main>;
}
