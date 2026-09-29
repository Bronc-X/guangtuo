import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ProductCatalog} from '@/components/product-catalog';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {categories, productInCategory, products} from '@/data/catalog';
import {
  hydrogelCapabilityFacts,
  hydrogelFormats,
  hydrogelMaterialFamilies
} from '@/data/hydrogel-formats';
import {categoryVisuals} from '@/data/site-visuals';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';

type ProductsPageCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroMeta: string[];
  familyEyebrow: string;
  familyTitle: string;
  familyBody: string;
  explore: string;
  finishedUnit: string;
  formatUnit: string;
  materialsEyebrow: string;
  materialsTitle: string;
  materialsBody: string;
  factsEyebrow: string;
  factsTitle: string;
  factsBody: string;
  factsNote: string;
  allEyebrow: string;
  allTitle: string;
  allBody: string;
  all: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  primary: string;
  secondary: string;
};

const pageCopy = {
  en: {
    title: 'Hydrogel finished products and technical formats',
    description: 'Compare 21 finished hydrogel-mask products, 41 documented formats and Showki Biotech production capability.',
    eyebrow: 'HYDROGEL PRODUCT CENTRE',
    heroTitle: '21 finished products.\n41 ways to shape the gel.',
    heroBody: 'Start with a sample-ready SKU or use the technical atlas to develop a face mask, eye mask or targeted patch for your brand.',
    heroMeta: ['21 finished SKUs', '41 documented formats', '5 material systems', '3 product groups'],
    familyEyebrow: 'THREE PRODUCT GROUPS',
    familyTitle: 'Start with the area and wear experience.',
    familyBody: 'Each group combines finished products with the broader shapes, weights, packs and minimum orders documented in the supplied material.',
    explore: 'Open category', finishedUnit: 'products', formatUnit: 'formats',
    materialsEyebrow: 'MATERIAL SYSTEM INDEX',
    materialsTitle: 'Five gel systems support the complete format range.',
    materialsBody: 'Compare natural hydrogel, microporous cooling gel, polymer gel, composite gel and cream-mask directions before sampling.',
    factsEyebrow: 'COMPANY & PRODUCTION PROFILE',
    factsTitle: 'Hydrogel development backed by production evidence.',
    factsBody: 'The supplied company material links product development with gel preparation, forming, filling, inspection and packing capacity.',
    factsNote: 'Company dates, patent totals and capacity figures are reproduced from the supplied company profile. Current capacity and commercial terms are reconfirmed for each project.',
    allEyebrow: 'FINISHED PRODUCT LIBRARY',
    allTitle: 'Compare all 21 sample-ready directions.',
    allBody: 'Every record includes the current format, net weight, intended use and minimum order; final colour, fit and specification are confirmed by sample.',
    all: 'All products',
    ctaEyebrow: 'FIND YOUR FORMAT',
    ctaTitle: 'Have a product direction but not an exact SKU?',
    ctaBody: 'Tell us the target area, care direction, pack and quantity. We can shortlist a finished product or a technical format for sampling.',
    primary: 'Ask a product advisor', secondary: 'See how customisation works'
  },
  zh: {
    title: '水凝膜定制、样品与产品系列',
    description: '面向护肤品牌提供面膜、眼膜、唇膜、颈膜与局部水凝膜贴的产品开发、实物样品、报价及量产服务。',
    eyebrow: '为护肤品牌开发水凝膜',
    heroTitle: '让消费者一贴，\n就感受到这款水凝膜的不同。',
    heroBody: '面膜、眼膜、唇膜、颈膜及局部护理贴，均可围绕膜型、配方、颜色与包装开发。欢迎申请样品，亲自确认贴合度、肤感与产品呈现。',
    heroMeta: ['面膜 · 眼膜 · 局部膜贴', '天然 · 微孔 · 高分子凝胶', '独立装 · 瓶装 · 吸塑装', '支持样品确认'],
    familyEyebrow: '覆盖三类护理场景',
    familyTitle: '面膜、眼膜，还是更有新意的局部护理贴？',
    familyBody: '全脸的包裹感、眼周的精致感、局部护理的鲜明造型——每一类都能围绕品牌定位，做出不同的肤感与产品辨识度。',
    explore: '查看这类产品', finishedUnit: '款产品', formatUnit: '种膜型',
    materialsEyebrow: '凝胶决定第一触感',
    materialsTitle: '贴合、清凉、柔韧——不同凝胶，带来不同体验。',
    materialsBody: '天然水凝胶、微孔冰导凝胶、高分子凝胶、复合凝胶与膏状膜，在贴合度、清凉感、柔润度和造型表现上各有特点，可通过实物样品亲自比较。',
    factsEyebrow: '为什么选择修齐',
    factsTitle: '一款好产品，不只要有卖点，也要经得起量产。',
    factsBody: '凝胶制备、成型、灌装、检验与包装均有对应工艺；相关专利与生产记录，让品牌在合作前更直观地了解修齐的技术基础。',
    factsNote: '企业、专利及产能信息依据公司现有资料；具体排产、价格与交期以项目确认结果为准。',
    allEyebrow: '可申请样品的产品',
    allTitle: '为您的下一款水凝膜，找到值得打样的产品。',
    allBody: '胶原、积雪草、胜肽、虾青素等成分方向，覆盖补水、舒缓、紧致感、焕亮与冷感体验。看中哪一款，都可以进一步咨询规格、样品与合作条件。',
    all: '全部 21 款产品',
    ctaEyebrow: '把想法变成实物',
    ctaTitle: '想先拿一份样品，看看肤感和贴合度？',
    ctaBody: '无论已有明确配方，还是只有护理部位与参考图片，都可以从实物样品开始。带上预计数量和目标市场，即可进一步咨询报价与交期。',
    primary: '提交需求并申请样品', secondary: '了解定制流程'
  },
  fr: {
    title: 'Produits hydrogel finis et formats techniques',
    description: 'Comparez 21 produits finis, 41 formats documentés et les capacités de production hydrogel de Showki Biotech.',
    eyebrow: 'CENTRE PRODUITS HYDROGEL',
    heroTitle: '21 produits finis.\n41 façons de façonner le gel.',
    heroBody: 'Partez d’un SKU prêt à échantillonner ou de l’atlas technique pour développer un masque visage, yeux ou un patch ciblé.',
    heroMeta: ['21 SKU finis', '41 formats documentés', '5 systèmes matière', '3 familles de produits'],
    familyEyebrow: 'TROIS FAMILLES', familyTitle: 'Commencez par la zone et l’expérience de pose.',
    familyBody: 'Chaque famille associe les produits finis aux formes, grammages, emballages et minimums documentés.',
    explore: 'Ouvrir la catégorie', finishedUnit: 'produits', formatUnit: 'formats',
    materialsEyebrow: 'INDEX DES MATIÈRES', materialsTitle: 'Cinq systèmes de gel couvrent toute la gamme.',
    materialsBody: 'Comparez hydrogel naturel, gel microporeux frais, gel polymère, gel composite et masque crème avant l’échantillonnage.',
    factsEyebrow: 'PROFIL ENTREPRISE & PRODUCTION', factsTitle: 'Le développement hydrogel appuyé par des preuves de production.',
    factsBody: 'Les documents fournis relient le développement à la préparation, au formage, au remplissage, au contrôle et au conditionnement.',
    factsNote: 'Les dates, brevets et capacités proviennent du profil fourni. La capacité actuelle et les conditions commerciales sont reconfirmées pour chaque projet.',
    allEyebrow: 'BIBLIOTHÈQUE DE PRODUITS FINIS', allTitle: 'Comparez les 21 directions prêtes à échantillonner.',
    allBody: 'Chaque fiche indique format, poids net, usage et minimum; couleur, ajustement et spécification sont validés sur échantillon.',
    all: 'Tous les produits', ctaEyebrow: 'TROUVER VOTRE FORMAT', ctaTitle: 'Une direction produit, mais pas encore de SKU précis ?',
    ctaBody: 'Indiquez zone, bénéfice, emballage et quantité : nous proposerons un produit fini ou un format technique à échantillonner.',
    primary: 'Parler à un conseiller', secondary: 'Voir la personnalisation'
  },
  es: {
    title: 'Productos de hidrogel y formatos técnicos',
    description: 'Compara 21 productos terminados, 41 formatos documentados y la capacidad de producción de Showki Biotech.',
    eyebrow: 'CENTRO DE PRODUCTOS DE HIDROGEL',
    heroTitle: '21 productos terminados.\n41 formas de dar forma al gel.',
    heroBody: 'Empieza con un SKU listo para muestra o usa el atlas técnico para desarrollar mascarillas faciales, oculares o parches localizados.',
    heroMeta: ['21 SKU terminados', '41 formatos documentados', '5 sistemas de material', '3 grupos de producto'],
    familyEyebrow: 'TRES GRUPOS', familyTitle: 'Empieza por la zona y la experiencia de uso.',
    familyBody: 'Cada grupo une productos terminados con formas, pesos, envases y pedidos mínimos documentados.',
    explore: 'Abrir categoría', finishedUnit: 'productos', formatUnit: 'formatos',
    materialsEyebrow: 'ÍNDICE DE MATERIALES', materialsTitle: 'Cinco sistemas de gel cubren toda la gama.',
    materialsBody: 'Compara hidrogel natural, gel microporoso frío, gel polimérico, gel compuesto y mascarilla en crema antes del muestreo.',
    factsEyebrow: 'EMPRESA Y PRODUCCIÓN', factsTitle: 'Desarrollo de hidrogel respaldado por evidencia productiva.',
    factsBody: 'El material suministrado conecta el desarrollo con preparación, formado, llenado, inspección y empaque.',
    factsNote: 'Fechas, patentes y capacidades proceden del perfil suministrado. La capacidad actual y las condiciones se reconfirman por proyecto.',
    allEyebrow: 'BIBLIOTECA DE PRODUCTOS', allTitle: 'Compara las 21 opciones listas para muestra.',
    allBody: 'Cada ficha muestra formato, peso, uso y pedido mínimo; color, ajuste y especificación se confirman con muestra.',
    all: 'Todos los productos', ctaEyebrow: 'ENCUENTRA TU FORMATO', ctaTitle: '¿Tienes una dirección pero no un SKU exacto?',
    ctaBody: 'Indica zona, beneficio, envase y cantidad; propondremos un producto o formato técnico para muestra.',
    primary: 'Hablar con un asesor', secondary: 'Ver la personalización'
  },
  ru: {
    title: 'Готовые гидрогелевые продукты и технические форматы',
    description: 'Сравните 21 готовый продукт, 41 документированный формат и производственные возможности Showki Biotech.',
    eyebrow: 'ЦЕНТР ГИДРОГЕЛЕВОЙ ПРОДУКЦИИ',
    heroTitle: '21 готовый продукт.\n41 способ придать гелю форму.',
    heroBody: 'Начните с готового SKU или используйте технический атлас для разработки маски для лица, глаз или локального патча.',
    heroMeta: ['21 готовый SKU', '41 документированный формат', '5 систем материалов', '3 группы продуктов'],
    familyEyebrow: 'ТРИ ГРУППЫ', familyTitle: 'Начните с зоны ухода и способа применения.',
    familyBody: 'В каждой группе готовые продукты сопоставлены с формами, массой, упаковкой и минимальными заказами из материалов.',
    explore: 'Открыть категорию', finishedUnit: 'продуктов', formatUnit: 'форматов',
    materialsEyebrow: 'ИНДЕКС МАТЕРИАЛОВ', materialsTitle: 'Пять гелевых систем охватывают всю линейку.',
    materialsBody: 'Сравните натуральный, микропористый охлаждающий, полимерный, композитный гель и крем-маску до заказа образцов.',
    factsEyebrow: 'КОМПАНИЯ И ПРОИЗВОДСТВО', factsTitle: 'Разработка гидрогеля с производственными подтверждениями.',
    factsBody: 'Материалы компании охватывают подготовку геля, формование, наполнение, контроль и упаковку.',
    factsNote: 'Даты, число патентов и мощности взяты из предоставленного профиля и подтверждаются для каждого проекта.',
    allEyebrow: 'КАТАЛОГ ГОТОВЫХ ПРОДУКТОВ', allTitle: 'Сравните все 21 направления для образцов.',
    allBody: 'В каждой карточке указаны формат, масса, назначение и минимум; цвет, посадка и характеристики утверждаются по образцу.',
    all: 'Все продукты', ctaEyebrow: 'НАЙДИТЕ ФОРМАТ', ctaTitle: 'Есть направление, но нет точного SKU?',
    ctaBody: 'Сообщите зону, эффект, упаковку и количество — мы подберём готовый продукт или технический формат.',
    primary: 'Спросить консультанта', secondary: 'Как работает кастомизация'
  },
  ar: {
    title: 'منتجات الهيدروجيل الجاهزة والتصاميم التقنية',
    description: 'قارن 21 منتجاً جاهزاً و41 تصميماً موثقاً وقدرات إنتاج الهيدروجيل لدى Showki Biotech.',
    eyebrow: 'مركز منتجات الهيدروجيل',
    heroTitle: '21 منتجاً جاهزاً.\n41 طريقة لتشكيل الجل.',
    heroBody: 'ابدأ من SKU جاهز للعينة أو استخدم الأطلس التقني لتطوير قناع للوجه أو العين أو لصقة موضعية.',
    heroMeta: ['21 SKU جاهزاً', '41 تصميماً موثقاً', '5 أنظمة مواد', '3 مجموعات منتجات'],
    familyEyebrow: 'ثلاث مجموعات', familyTitle: 'ابدأ بمنطقة العناية وتجربة الاستخدام.',
    familyBody: 'تجمع كل مجموعة المنتجات الجاهزة مع الأشكال والأوزان والتغليف والحد الأدنى الموثق.',
    explore: 'فتح الفئة', finishedUnit: 'منتجاً', formatUnit: 'تصميماً',
    materialsEyebrow: 'فهرس المواد', materialsTitle: 'خمسة أنظمة جل تغطي المجموعة الكاملة.',
    materialsBody: 'قارن الهيدروجيل الطبيعي والجل المبرد دقيق المسام والبوليمري والمركب والقناع الكريمي قبل طلب العينة.',
    factsEyebrow: 'الشركة والإنتاج', factsTitle: 'تطوير هيدروجيل مدعوم بأدلة الإنتاج.',
    factsBody: 'تربط المواد المقدمة التطوير بتحضير الجل والتشكيل والتعبئة والفحص والتغليف.',
    factsNote: 'التواريخ وعدد البراءات والطاقة مأخوذة من ملف الشركة المقدم ويعاد تأكيدها لكل مشروع.',
    allEyebrow: 'مكتبة المنتجات الجاهزة', allTitle: 'قارن الاتجاهات الـ21 الجاهزة للعينة.',
    allBody: 'تعرض كل صفحة التصميم والوزن والاستخدام والحد الأدنى؛ ويؤكد اللون والملاءمة والمواصفة بالعينة.',
    all: 'جميع المنتجات', ctaEyebrow: 'اعثر على تصميمك', ctaTitle: 'لديك اتجاه ولكن لا يوجد SKU محدد؟',
    ctaBody: 'أخبرنا بالمنطقة والفائدة والتغليف والكمية لنقترح منتجاً جاهزاً أو تصميماً تقنياً للعينة.',
    primary: 'اسأل مستشار المنتجات', secondary: 'تعرف على آلية التخصيص'
  }
} satisfies Record<Locale, ProductsPageCopy>;

const updatedRangeCopy: Record<Locale, Partial<ProductsPageCopy>> = {
  en: {title: 'Skincare product catalogue | Showki Biotech', description: 'Explore 78 skincare and hydrogel concepts across 12 care ranges.', heroTitle: 'Explore skincare products for your brand.', heroBody: 'Browse the latest brochure products and established hydrogel formats. Formula, size, packaging and commercial terms are confirmed during sampling.', familyTitle: 'Explore 12 care ranges and the latest arrivals.', familyBody: 'Find a product direction by care need, then refine it with a sample.', allTitle: 'Compare all 78 product concepts.', allBody: 'Product images come from the supplied brochure or existing product materials. Missing commercial details are confirmed on enquiry.'},
  zh: {title: '护肤品与水凝胶产品目录｜修齐生物', description: '查看 12 个护理系列、57 款宣传册产品和原有水凝胶产品。', heroTitle: '找到适合品牌的护肤产品。', heroBody: '浏览最新宣传册产品与现有水凝胶膜贴。配方、规格、包材及商务条件可在打样时进一步确认。', familyTitle: '从 12 个护理系列和新品速递中选择。', familyBody: '先按护理需求找到方向，再通过样品确定细节。', allTitle: '比较全部 78 款产品参考。', allBody: '图片来自宣传册或既有产品资料；未提供的商务规格可在咨询时确认。'},
  fr: {title: 'Catalogue de soins | Showki Biotech', description: '78 produits de soin et hydrogel dans 12 gammes.', heroTitle: 'Trouvez le soin adapté à votre marque.', heroBody: 'Parcourez les nouveautés et les formats hydrogel. Formule, format, emballage et conditions sont confirmés avec un échantillon.', familyTitle: 'Découvrez les gammes et les nouveautés.', familyBody: 'Choisissez un soin puis confirmez les détails avec un échantillon.', allTitle: 'Comparez 78 concepts produits.', allBody: 'Les informations manquantes sont à confirmer.'},
  es: {title: 'Catálogo cosmético | Showki Biotech', description: '78 productos de cuidado e hidrogel en 12 gamas.', heroTitle: 'Encuentra el producto para tu marca.', heroBody: 'Explora novedades y formatos de hidrogel. Fórmula, tamaño, envase y condiciones se confirman con muestras.', familyTitle: 'Explora las gamas y novedades.', familyBody: 'Elige una dirección y confirma los detalles con una muestra.', allTitle: 'Compara 78 conceptos de producto.', allBody: 'Los datos pendientes se confirman en la consulta.'},
  ru: {title: 'Каталог косметики | Showki Biotech', description: '78 косметических и гидрогелевых продуктов в 12 категориях.', heroTitle: 'Найдите продукт для вашего бренда.', heroBody: 'Изучите новинки и гидрогелевые форматы. Формулу, объём, упаковку и условия подтвердим по образцу.', familyTitle: 'Категории ухода и новинки.', familyBody: 'Выберите направление и уточните детали по образцу.', allTitle: 'Сравните 78 концепций.', allBody: 'Недостающие данные уточняются при запросе.'},
  ar: {title: 'كتالوج العناية بالبشرة | شوكي', description: '78 منتجاً للعناية والهيدروجيل ضمن 12 مجموعة.', heroTitle: 'اعثر على المنتج المناسب لعلامتك.', heroBody: 'تصفح المنتجات الجديدة وتصاميم الهيدروجيل. تؤكد التركيبة والحجم والعبوة والشروط من خلال العينة.', familyTitle: 'استكشف مجموعات العناية والجديد.', familyBody: 'اختر الاتجاه ثم أكد التفاصيل بعينة.', allTitle: 'قارن 78 فكرة منتج.', allBody: 'تؤكد البيانات الناقصة عند الاستفسار.'}
};

const rangeNavigationCopy: Record<Locale, Partial<ProductsPageCopy>> = {
  en: {eyebrow: 'SKINCARE PRODUCT CATALOGUE', heroMeta: ['12 care ranges', '57 brochure products', '21 hydrogel concepts', 'Sample review'], familyEyebrow: 'CARE RANGES', allEyebrow: 'PRODUCT LIBRARY', all: 'All 78 products', ctaEyebrow: 'FROM IDEA TO SAMPLE', ctaTitle: 'Ready to compare products and packaging?', ctaBody: 'Tell us the care direction, preferred format, quantity and market to begin sample planning.'},
  zh: {eyebrow: '护肤产品目录', heroMeta: ['12 个护理系列', '57 款宣传册产品', '21 款水凝胶产品', '支持样品确认'], familyEyebrow: '按护理方向查找', allEyebrow: '完整产品目录', all: '全部 78 款产品', ctaEyebrow: '从想法到样品', ctaTitle: '想比较产品和包材的实际效果？', ctaBody: '告诉我们护理方向、产品形态、预计数量和目标市场，即可开始样品沟通。'},
  fr: {eyebrow: 'CATALOGUE DE SOINS', heroMeta: ['12 gammes', '57 produits du catalogue', '21 concepts hydrogel', 'Validation sur échantillon'], familyEyebrow: 'GAMMES DE SOINS', allEyebrow: 'CATALOGUE COMPLET', all: 'Les 78 produits', ctaEyebrow: 'DE L’IDÉE À L’ÉCHANTILLON', ctaTitle: 'Comparer produits et emballages ?', ctaBody: 'Précisez le soin, le format, la quantité et le marché pour commencer les échantillons.'},
  es: {eyebrow: 'CATÁLOGO DE CUIDADO', heroMeta: ['12 gamas', '57 productos del folleto', '21 conceptos de hidrogel', 'Validación con muestras'], familyEyebrow: 'GAMAS DE CUIDADO', allEyebrow: 'CATÁLOGO COMPLETO', all: 'Los 78 productos', ctaEyebrow: 'DE LA IDEA A LA MUESTRA', ctaTitle: '¿Quieres comparar productos y envases?', ctaBody: 'Indica el cuidado, formato, cantidad y mercado para preparar las muestras.'},
  ru: {eyebrow: 'КАТАЛОГ КОСМЕТИКИ', heroMeta: ['12 направлений', '57 продуктов из буклета', '21 гидрогелевый продукт', 'Проверка на образце'], familyEyebrow: 'НАПРАВЛЕНИЯ УХОДА', allEyebrow: 'ПОЛНЫЙ КАТАЛОГ', all: 'Все 78 продуктов', ctaEyebrow: 'ОТ ИДЕИ ДО ОБРАЗЦА', ctaTitle: 'Сравнить продукты и упаковку?', ctaBody: 'Укажите назначение, формат, количество и рынок для подготовки образцов.'},
  ar: {eyebrow: 'كتالوج منتجات العناية', heroMeta: ['12 مجموعة عناية', '57 منتجاً من الكتيب', '21 منتج هيدروجيل', 'تأكيد بالعينة'], familyEyebrow: 'مجموعات العناية', allEyebrow: 'الكتالوج الكامل', all: 'جميع المنتجات الـ78', ctaEyebrow: 'من الفكرة إلى العينة', ctaTitle: 'هل تريد مقارنة المنتجات والعبوات؟', ctaBody: 'أخبرنا بنوع العناية والشكل والكمية والسوق للبدء بتجهيز العينات.'}
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {title: updatedRangeCopy[locale].title ?? pageCopy[locale].title, description: updatedRangeCopy[locale].description ?? pageCopy[locale].description};
}

export default async function ProductsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const t = {...pageCopy[locale], ...updatedRangeCopy[locale], ...rangeNavigationCopy[locale]};

  return (
    <main className="page-main" data-cms="pages:products">
      <PageIntro eyebrow={t.eyebrow} title={t.heroTitle} body={t.heroBody} meta={t.heroMeta} />

      <section className="section category-portals">
        <SectionTitle eyebrow={t.familyEyebrow} title={t.familyTitle} body={t.familyBody} />
        <div className="category-portal-grid">
          {categories.map((category, index) => {
            const productCount = products.filter((product) => productInCategory(product, category.slug)).length;
            const formatCount = hydrogelFormats.filter((format) => format.category === category.slug).length;
            const image = (products.find((product) => product.sourcePage && productInCategory(product, category.slug)) ?? products.find((product) => productInCategory(product, category.slug)))?.media?.image ?? categoryVisuals['eye-masks'].src;
            return (
              <Link href={localizedPath(locale, `categories/${category.slug}`)} className="category-portal" key={category.slug}>
                <Image
                  src={image}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                  alt={category.name[locale]}
                />
                <span className="category-portal__copy">
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  <strong>{category.name[locale]}</strong>
                  <span>{productCount} {t.finishedUnit}{formatCount ? ` · ${formatCount} ${t.formatUnit}` : ''} · {t.explore} ↗</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section section--dark material-system-section">
        <SectionTitle dark eyebrow={t.materialsEyebrow} title={t.materialsTitle} body={t.materialsBody} />
        <div className="material-family-index">
          {hydrogelMaterialFamilies.map((family, index) => {
            const count = hydrogelFormats.filter((format) => format.family === family.id).length;
            return (
              <article className="material-family-row" key={family.id}>
                <span>0{index + 1}</span>
                <h3>{family.name[locale]}</h3>
                <p>{family.description[locale]}</p>
                <strong>{count} {t.formatUnit}</strong>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section--paper capability-facts-section">
        <SectionTitle eyebrow={t.factsEyebrow} title={t.factsTitle} body={t.factsBody} />
        <div className="capability-fact-grid">
          {hydrogelCapabilityFacts.map((fact) => (
            <article key={fact.id}><strong>{fact.value}</strong><p>{fact.label[locale]}</p></article>
          ))}
        </div>
        <p className="evidence-note">{t.factsNote}</p>
      </section>

      <section className="section">
        <SectionTitle eyebrow={t.allEyebrow} title={t.allTitle} body={t.allBody} />
        <div className="filters">
          <Link className="filter-chip filter-chip--active" href={localizedPath(locale, 'products')}>{t.all}</Link>
          {categories.map((category) => <Link className="filter-chip" key={category.slug} href={localizedPath(locale, `categories/${category.slug}`)}>{category.name[locale]}</Link>)}
        </div>
        <ProductCatalog products={[...products].sort((a, b) => Number(Boolean(b.sourcePage)) - Number(Boolean(a.sourcePage)) || a.sortOrder - b.sortOrder)} locale={locale} />
      </section>

      <ActionBand
        locale={locale}
        eyebrow={t.ctaEyebrow}
        title={t.ctaTitle}
        body={t.ctaBody}
        primaryPath="inquiry"
        primaryLabel={t.primary}
        secondaryPath="how-it-works"
        secondaryLabel={t.secondary}
      />
    </main>
  );
}
