import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {ProductCard} from '@/components/product-card';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {categories, legacyCategories, getCategory, productInCategory, products, type LegacyProductCategory, type ProductCategory} from '@/data/catalog';
import {getHydrogelFamily, getHydrogelFormats, localizeHydrogelMeasure} from '@/data/hydrogel-formats';
import {isLocale, localizedPath, locales, type Locale} from '@/lib/routing';

type GuideCopy = {intro: string; guideEyebrow: string; guideTitle: string; rows: Array<[string, string]>};

const categoryCopy = {
  en: {
    'face-masks': {
      intro: 'Finished face and cream mask concepts across collagen, soothing, brightening and cooling-led directions.',
      guideEyebrow: 'CHOOSING A FACE MASK',
      guideTitle: 'Compare the finish, feel and care direction.',
      rows: [
        ['Care options', 'Face and cream masks for collagen, soothing, brightening and cooling care.'],
        ['Product differences', 'Net weight, ingredients and mask format vary by product.'],
        ['Try a sample', 'Feel the texture, check the fit and see the finish on skin.']
      ]
    },
    'eye-masks': {
      intro: 'Finished eye-mask concepts spanning moisturizing, soothing, peptide-led and cooling directions.',
      guideEyebrow: 'CHOOSING AN EYE MASK',
      guideTitle: 'Colour, ingredients and pack format all shape the experience.',
      rows: [
        ['Care options', 'Hydrogel eye masks for hydration, soothing, firming and brightening.'],
        ['Product differences', 'Ingredients, gel colour, net weight and pack format vary by product.'],
        ['Try a sample', 'See the colour, shape and feel before choosing your product.']
      ]
    },
    'specialty-patches': {
      intro: 'Finished lip, neck, forehead, nasolabial, jawline and multi-zone hydrogel patch concepts.',
      guideEyebrow: 'CHOOSING A TARGETED PATCH',
      guideTitle: 'Start with the exact area, fit and wear experience.',
      rows: [
        ['Target areas', 'Lips, neck, forehead, nasolabial folds, jawline and combined forehead-and-eye zones.'],
        ['Format differences', 'Coverage, ear-hook structure, gel weight, packaging and minimum order vary by format.'],
        ['Try a sample', 'Confirm shape, adhesion and comfort on the intended area before ordering.']
      ]
    }
  },
  zh: {
    'face-masks': {
      intro: '柔软贴合、清凉包裹或滋润丰盈，不同膜体会让消费者对面膜形成不同的第一印象。胶原、舒缓、焕亮与冷感等产品均可申请样品，并围绕配方、膜型和包装继续开发。',
      guideEyebrow: '决定产品体验的细节',
      guideTitle: '让成分卖点，在贴上脸的那一刻被感受到。',
      rows: [
        ['贴上脸的感受', '水凝胶片、微孔冷感膜与膏状膜带来不同的贴合、清凉与滋润体验。'],
        ['消费者看到的卖点', '胶原、舒缓、紧致感、焕亮等护理卖点，可与膜体颜色和质地自然呼应。'],
        ['值得亲自确认的实物', '通过样品比较颜色、质地、贴合度与上脸感受，让量产依据更明确。']
      ]
    },
    'eye-masks': {
      intro: '眼周面积不大，却很适合通过凝胶颜色、贴片造型和包装方式做出记忆点。独立装、瓶装、多造型与冷感眼膜均可结合品牌风格和使用场景开发。',
      guideEyebrow: '眼膜的产品记忆点',
      guideTitle: '让颜色、成分与取用体验，共同讲好眼周护理卖点。',
      rows: [
        ['醒目的凝胶外观', '红、金、粉、蓝与透明等选择，让产品在瓶内、袋装或开盒时更有辨识度。'],
        ['符合场景的包装', '瓶装适合多片日常护理；独立装便于单次使用，也适合礼盒与组合装。'],
        ['真实的眼周体验', '样品可以直接感受凝胶触感、贴片弧度、取用方式与眼周贴合度。']
      ]
    },
    'specialty-patches': {
      intro: '唇膜、颈膜、额头贴、法令纹贴与下颌贴，把护理部位直接做成产品卖点。独特轮廓、覆盖方式与佩戴结构，也让局部护理更容易被消费者看见和记住。',
      guideEyebrow: '局部护理的差异化',
      guideTitle: '护理更聚焦，产品也更有辨识度。',
      rows: [
        ['一眼看懂的护理部位', '唇部、颈部、额头、法令纹、下颌线，以及额头与眼周组合护理均有对应膜型。'],
        ['更有记忆点的佩戴方式', '局部贴合、耳挂固定和一片式覆盖，为不同使用场景带来鲜明体验。'],
        ['经得起实物体验的贴合度', '通过样品确认形状、贴合度、活动稳定性与佩戴舒适度，再落实量产规格。']
      ]
    }
  },
  fr: {
    'face-masks': {
      intro: 'Des concepts finis de masques visage et crème orientés collagène, apaisement, éclat ou sensation de fraîcheur.',
      guideEyebrow: 'CHOISIR UN MASQUE VISAGE',
      guideTitle: 'Comparez la finition, le toucher et le soin recherché.',
      rows: [
        ['Options de soin', 'Masques visage ou crème axés sur le collagène, l’apaisement, l’éclat ou la fraîcheur.'],
        ['Ce qui varie', 'Le poids net, la direction des ingrédients et le format diffèrent selon le produit.'],
        ['Essayer un échantillon', 'Découvrez la texture, l’ajustement et le rendu sur la peau.']
      ]
    },
    'eye-masks': {
      intro: 'Des concepts finis pour les yeux, orientés hydratation, apaisement, peptides ou sensation de fraîcheur.',
      guideEyebrow: 'CHOISIR DES PATCHS YEUX',
      guideTitle: 'Couleur, ingrédients et emballage façonnent l’expérience.',
      rows: [
        ['Options de soin', 'Hydratation, apaisement, fermeté ou éclat pour le contour des yeux.'],
        ['Ce qui varie', 'La direction des ingrédients, l’aspect du gel, le poids net et le format diffèrent selon le produit.'],
        ['Essayer un échantillon', 'Voyez la couleur, la forme et le toucher avant de choisir.']
      ]
    },
    'specialty-patches': {
      intro: 'Des concepts finis pour les lèvres, le cou, le front, les sillons nasogéniens, la mâchoire et les zones combinées.',
      guideEyebrow: 'CHOISIR UN PATCH CIBLÉ',
      guideTitle: 'Commencez par la zone, l’ajustement et l’expérience de pose.',
      rows: [
        ['Zones ciblées', 'Lèvres, cou, front, sillons nasogéniens, mâchoire et zones front-yeux combinées.'],
        ['Ce qui varie', 'Couverture, structure auriculaire, poids du gel, emballage et minimum de commande.'],
        ['Essayer un échantillon', 'Validez la forme, l’adhérence et le confort sur la zone prévue.']
      ]
    }
  },
  es: {
    'face-masks': {
      intro: 'Conceptos terminados de mascarillas faciales y en crema centrados en colágeno, efecto calmante, luminosidad o sensación refrescante.',
      guideEyebrow: 'ELEGIR UNA MASCARILLA FACIAL',
      guideTitle: 'Compara el acabado, el tacto y el cuidado que buscas.',
      rows: [
        ['Opciones de cuidado', 'Mascarillas faciales y en crema con colágeno, calma, luminosidad o frescor.'],
        ['Qué cambia', 'El peso neto, la dirección de ingredientes y el formato varían según el producto.'],
        ['Prueba una muestra', 'Comprueba textura, ajuste y acabado sobre la piel.']
      ]
    },
    'eye-masks': {
      intro: 'Conceptos terminados para ojos centrados en hidratación, efecto calmante, péptidos o sensación refrescante.',
      guideEyebrow: 'ELEGIR PARCHES PARA OJOS',
      guideTitle: 'Color, ingredientes y envase crean la experiencia.',
      rows: [
        ['Opciones de cuidado', 'Hidratación, calma, firmeza o luminosidad para el contorno de ojos.'],
        ['Qué cambia', 'La dirección de ingredientes, el aspecto del gel, el peso neto y el formato varían según el producto.'],
        ['Prueba una muestra', 'Comprueba color, forma y tacto antes de elegir.']
      ]
    },
    'specialty-patches': {
      intro: 'Conceptos terminados para labios, cuello, frente, surcos nasolabiales, mandíbula y zonas combinadas.',
      guideEyebrow: 'ELEGIR UN PARCHE LOCALIZADO',
      guideTitle: 'Empieza por la zona, el ajuste y la experiencia de uso.',
      rows: [
        ['Zonas objetivo', 'Labios, cuello, frente, surcos nasolabiales, mandíbula y frente-ojos combinados.'],
        ['Qué cambia', 'Cobertura, estructura de orejas, peso del gel, envase y pedido mínimo.'],
        ['Prueba una muestra', 'Confirma forma, adherencia y comodidad en la zona prevista.']
      ]
    }
  },
  ru: {
    'face-masks': {
      intro: 'Готовые маски для лица и крем-маски с коллагеновым, успокаивающим, осветляющим и охлаждающим действием.',
      guideEyebrow: 'КАК ВЫБРАТЬ МАСКУ ДЛЯ ЛИЦА', guideTitle: 'Сравните внешний вид, ощущение и направление ухода.',
      rows: [['Варианты ухода', 'Маски для лица и крем-маски с коллагеном, успокаивающим, осветляющим или охлаждающим эффектом.'], ['Различия продуктов', 'Масса нетто, ингредиенты и формат зависят от продукта.'], ['Попробуйте образец', 'Оцените текстуру, посадку и результат на коже.']]
    },
    'eye-masks': {
      intro: 'Готовые патчи для глаз с увлажняющим, успокаивающим, пептидным и охлаждающим действием.',
      guideEyebrow: 'КАК ВЫБРАТЬ ПАТЧИ', guideTitle: 'Цвет, ингредиенты и упаковка формируют впечатление.',
      rows: [['Варианты ухода', 'Гидрогелевые патчи для увлажнения, успокаивающего эффекта, упругости и сияния.'], ['Различия продуктов', 'Ингредиенты, цвет геля, масса нетто и формат упаковки различаются.'], ['Попробуйте образец', 'Оцените цвет, форму и ощущение перед выбором.']]
    },
    'specialty-patches': {
      intro: 'Готовые форматы для губ, шеи, лба, носогубных складок, линии подбородка и комбинированных зон.',
      guideEyebrow: 'КАК ВЫБРАТЬ ЛОКАЛЬНЫЙ ПАТЧ', guideTitle: 'Начните с зоны, посадки и ощущения при использовании.',
      rows: [['Целевые зоны', 'Губы, шея, лоб, носогубные складки, линия подбородка и комбинированная зона лба и глаз.'], ['Различия форматов', 'Площадь покрытия, крепление за ушами, масса геля, упаковка и минимальный заказ.'], ['Попробуйте образец', 'Проверьте форму, прилегание и комфорт на целевой зоне.']]
    }
  },
  ar: {
    'face-masks': {
      intro: 'نماذج جاهزة لأقنعة الوجه والأقنعة الكريمية بخيارات الكولاجين والتهدئة والإشراق والتبريد.',
      guideEyebrow: 'اختيار قناع الوجه', guideTitle: 'قارن التشطيب والملمس واتجاه العناية.',
      rows: [['خيارات العناية', 'أقنعة وجه وكريم بالكولاجين أو للتهدئة والإشراق والتبريد.'], ['اختلافات المنتجات', 'يختلف الوزن الصافي والمكونات وتصميم القناع حسب المنتج.'], ['جرّب عينة', 'اختبر القوام والملاءمة والمظهر على البشرة.']]
    },
    'eye-masks': {
      intro: 'نماذج جاهزة للصقات العين بخيارات الترطيب والتهدئة والببتيدات والتبريد.',
      guideEyebrow: 'اختيار لصقات العين', guideTitle: 'اللون والمكونات والتغليف تصنع التجربة.',
      rows: [['خيارات العناية', 'لصقات هيدروجيل للترطيب والتهدئة والتماسك والإشراق.'], ['اختلافات المنتجات', 'تختلف المكونات ولون الجل والوزن الصافي وتصميم العبوة.'], ['جرّب عينة', 'شاهد اللون والشكل واختبر الملمس قبل الاختيار.']]
    },
    'specialty-patches': {
      intro: 'تصاميم جاهزة للشفاه والرقبة والجبهة والطيات الأنفية وخط الفك والمناطق المدمجة.',
      guideEyebrow: 'اختيار لصقة موضعية', guideTitle: 'ابدأ بالمنطقة والملاءمة وتجربة الاستخدام.',
      rows: [['المناطق المستهدفة', 'الشفاه والرقبة والجبهة والطيات الأنفية وخط الفك ومنطقة الجبهة والعين المدمجة.'], ['اختلافات التصميم', 'تختلف التغطية وبنية التثبيت والوزن والتغليف والحد الأدنى للطلب.'], ['جرّب عينة', 'تحقق من الشكل والالتصاق والراحة على المنطقة المستهدفة.']]
    }
  }
} satisfies Record<Locale, Record<LegacyProductCategory, GuideCopy>>;

function guideFor(locale: Locale, category: {slug: ProductCategory; name: Record<Locale, string>}): GuideCopy {
  const legacy = (categoryCopy[locale] as Partial<Record<ProductCategory, GuideCopy>>)[category.slug];
  if (legacy) return legacy;
  const name = category.name[locale];
  const sample = ({zh: '规格与生产细节请以确认样品为准。', en: 'Confirm specifications and production details with a sample.', fr: 'Confirmez les détails avec un échantillon.', es: 'Confirme los detalles con una muestra.', ru: 'Уточните характеристики по образцу.', ar: 'أكد التفاصيل من خلال عينة.'} as const)[locale];
  return {intro: `${name} · ${sample}`, guideEyebrow: name, guideTitle: name, rows: [[name, sample]]};
}

const commonCopy = {
  en: {home: 'Home', products: 'Products', eyebrow: 'PRODUCT RANGE', all: 'All products', finishedEyebrow: 'FINISHED CONCEPTS', finishedTitle: 'Start with a sample-ready product.', atlasEyebrow: 'TECHNICAL FORMAT ATLAS', atlasTitle: 'Compare every source-backed format in this category.', atlasBody: 'Specifications, minimum orders and packaging shown here come from the supplied Showki hydrogel brochure and are reconfirmed during sampling.', specification: 'Specification', minimumOrder: 'Minimum order', packaging: 'Packaging', ctaEyebrow: 'REQUEST SAMPLES', ctaTitle: 'Want to feel the difference for yourself?', ctaBody: 'Choose one or more products and tell us the quantity and market you have in mind.', primary: 'Request samples', secondary: 'View all products'},
  zh: {home: '首页', products: '产品', eyebrow: '水凝膜产品', all: '全部产品', finishedEyebrow: '可申请样品的产品', finishedTitle: '现有实物可看、可摸，也为品牌调整留下空间。', atlasEyebrow: '更多膜型选择', atlasTitle: '同一个护理部位，也能做出不同的产品记忆点。', atlasBody: '不同膜型在覆盖范围、净含量与包装方式上各有特点，可按品牌定位选择，并通过实物样品确认最终规格。', specification: '参考规格', minimumOrder: '参考起订量', packaging: '包装方式', ctaEyebrow: '亲自感受产品', ctaTitle: '实物样品，比想象更能帮品牌做决定。', ctaBody: '欢迎申请一款或多款产品样品，比较颜色、质地、贴合度与佩戴感。如果需求尚未完全确定，提供护理部位、预计数量或参考图片即可沟通。', primary: '申请样品并获取报价', secondary: '查看全部产品'},
  fr: {home: 'Accueil', products: 'Produits', eyebrow: 'GAMME DE PRODUITS', all: 'Tous les produits', finishedEyebrow: 'CONCEPTS FINIS', finishedTitle: 'Commencez par un produit prêt à échantillonner.', atlasEyebrow: 'ATLAS TECHNIQUE', atlasTitle: 'Comparez tous les formats documentés de cette catégorie.', atlasBody: 'Les spécifications, minimums et emballages proviennent de la brochure fournie et sont reconfirmés lors de l’échantillonnage.', specification: 'Spécification', minimumOrder: 'Minimum', packaging: 'Emballage', ctaEyebrow: 'DEMANDER DES ÉCHANTILLONS', ctaTitle: 'Envie de sentir la différence ?', ctaBody: 'Choisissez un ou plusieurs produits et indiquez la quantité et le marché envisagés.', primary: 'Demander des échantillons', secondary: 'Voir tous les produits'},
  es: {home: 'Inicio', products: 'Productos', eyebrow: 'GAMA DE PRODUCTOS', all: 'Todos los productos', finishedEyebrow: 'CONCEPTOS TERMINADOS', finishedTitle: 'Empieza por un producto listo para muestra.', atlasEyebrow: 'ATLAS TÉCNICO', atlasTitle: 'Compara todos los formatos documentados de esta categoría.', atlasBody: 'Las especificaciones, mínimos y envases proceden del folleto facilitado y se reconfirman durante el muestreo.', specification: 'Especificación', minimumOrder: 'Pedido mínimo', packaging: 'Envase', ctaEyebrow: 'SOLICITAR MUESTRAS', ctaTitle: '¿Quieres sentir la diferencia?', ctaBody: 'Elige uno o varios productos e indica la cantidad y el mercado previstos.', primary: 'Solicitar muestras', secondary: 'Ver todos los productos'},
  ru: {home: 'Главная', products: 'Продукция', eyebrow: 'ЛИНЕЙКА ПРОДУКТОВ', all: 'Все продукты', finishedEyebrow: 'ГОТОВЫЕ КОНЦЕПЦИИ', finishedTitle: 'Начните с продукта, доступного для образца.', atlasEyebrow: 'ТЕХНИЧЕСКИЙ АТЛАС', atlasTitle: 'Сравните все документированные форматы категории.', atlasBody: 'Характеристики, минимальные заказы и упаковка взяты из предоставленного буклета и подтверждаются при изготовлении образца.', specification: 'Характеристика', minimumOrder: 'Минимальный заказ', packaging: 'Упаковка', ctaEyebrow: 'ЗАПРОСИТЬ ОБРАЗЦЫ', ctaTitle: 'Хотите почувствовать разницу сами?', ctaBody: 'Выберите один или несколько продуктов и укажите примерное количество и рынок.', primary: 'Запросить образцы', secondary: 'Смотреть все продукты'},
  ar: {home: 'الرئيسية', products: 'المنتجات', eyebrow: 'مجموعة المنتجات', all: 'جميع المنتجات', finishedEyebrow: 'نماذج جاهزة', finishedTitle: 'ابدأ بمنتج جاهز لطلب العينة.', atlasEyebrow: 'أطلس تقني', atlasTitle: 'قارن جميع التصاميم الموثقة ضمن هذه الفئة.', atlasBody: 'المواصفات والحد الأدنى والتغليف مأخوذة من الكتيب المقدم ويعاد تأكيدها عند إعداد العينة.', specification: 'المواصفة', minimumOrder: 'الحد الأدنى', packaging: 'التغليف', ctaEyebrow: 'طلب عينات', ctaTitle: 'هل تريد اختبار الفرق بنفسك؟', ctaBody: 'اختر منتجاً أو أكثر وأخبرنا بالكمية والسوق المستهدف.', primary: 'طلب عينات', secondary: 'عرض جميع المنتجات'}
} satisfies Record<Locale, Record<string, string>>;

export function generateStaticParams() {
  return locales.flatMap((locale) => [...categories, ...legacyCategories].map((category) => ({locale, category: category.slug})));
}

const zhCategorySeoTitles: Record<LegacyProductCategory, string> = {
  'face-masks': '水凝胶面膜与膏状面膜定制',
  'eye-masks': '水凝胶眼膜定制与样品',
  'specialty-patches': '唇膜、颈膜与局部护理贴定制'
};

export async function generateMetadata({params}: {params: Promise<{locale: string; category: string}>}): Promise<Metadata> {
  const {locale: rawLocale, category: slug} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: locale === 'zh' ? zhCategorySeoTitles[category.slug as LegacyProductCategory] ?? category.name.zh : category.name[locale],
    description: guideFor(locale, category).intro
  };
}

export default async function CategoryPage({params}: {params: Promise<{locale: string; category: string}>}) {
  const {locale: rawLocale, category: slug} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const category = getCategory(slug);
  if (!category) notFound();
  const items = products.filter((product) => productInCategory(product, category.slug)).sort((a, b) => Number(Boolean(b.sourcePage)) - Number(Boolean(a.sourcePage)) || a.sortOrder - b.sortOrder);
  const formats = getHydrogelFormats(category.slug);
  const guide = guideFor(locale, category);
  const t = commonCopy[locale];

  return (
    <main className="page-main">
      <div className="breadcrumbs"><Link href={localizedPath(locale)}>{t.home}</Link><span>/</span><Link href={localizedPath(locale, 'products')}>{t.products}</Link><span>/</span>{category.name[locale]}</div>
      <PageIntro eyebrow={t.eyebrow} title={category.name[locale]} body={guide.intro} meta={guide.rows.map(([label]) => label)} />
      <section className="section">
        <SectionTitle eyebrow={t.finishedEyebrow} title={t.finishedTitle} />
        <div className="filters">
          <Link className="filter-chip" href={localizedPath(locale, 'products')}>{t.all}</Link>
          {categories.map((item) => <Link className={item.slug === category.slug ? 'filter-chip filter-chip--active' : 'filter-chip'} key={item.slug} href={localizedPath(locale, `categories/${item.slug}`)}>{item.name[locale]}</Link>)}
        </div>
        <div className="product-grid">{items.map((product, index) => <ProductCard key={product.sku} product={product} locale={locale} eager={index === 0} />)}</div>
      </section>
      {formats.length > 0 && <section className="section section--dark format-atlas-section">
        <SectionTitle dark eyebrow={t.atlasEyebrow} title={t.atlasTitle} body={t.atlasBody} />
        <div className="format-atlas">
          {formats.map((format, index) => (
            <article data-cms={`formats:${format.id}`} className="format-record" key={format.id}>
              <div className="format-record__visual">
                <Image src={format.image} fill sizes="(max-width: 700px) 32vw, 180px" alt={format.name[locale]} loading={index < 3 ? 'eager' : 'lazy'} />
              </div>
              <div className="format-record__copy">
                <div className="format-record__identity"><span>{format.id}</span><small>{getHydrogelFamily(format.family)?.name[locale]}</small></div>
                <h3>{format.name[locale]}</h3>
                <p data-cms-field="effects">{format.effects[locale]}</p>
              </div>
              <dl className="format-record__specs">
                <div><dt>{t.specification}</dt><dd data-cms-field="specification">{format.localizedSpecification?.[locale] ?? localizeHydrogelMeasure(format.specification, locale)}</dd></div>
                <div><dt>{t.minimumOrder}</dt><dd data-cms-field="moq">{format.localizedMoq?.[locale] ?? localizeHydrogelMeasure(format.moq, locale)}</dd></div>
                <div><dt>{t.packaging}</dt><dd data-cms-field="packaging">{format.packaging[locale]}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>}
      <section className="section section--paper category-guide">
        <SectionTitle eyebrow={guide.guideEyebrow} title={guide.guideTitle} />
        <div className="stage-rail stage-rail--light">{guide.rows.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>
      <ActionBand
        locale={locale}
        eyebrow={t.ctaEyebrow}
        title={t.ctaTitle}
        body={t.ctaBody}
        primaryPath="inquiry"
        primaryLabel={t.primary}
        secondaryPath="products"
        secondaryLabel={t.secondary}
      />
    </main>
  );
}
