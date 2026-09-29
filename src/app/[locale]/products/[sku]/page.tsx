import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ProductCard} from '@/components/product-card';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {getCategory, getProduct, products} from '@/data/catalog';
import {getHydrogelFormats, hydrogelPatentProofs, hydrogelProcessSteps} from '@/data/hydrogel-formats';
import {isLocale, localizedPath, locales, type Locale} from '@/lib/routing';

const detailCopy = {
  en: {
    home: 'Home',
    products: 'Products',
    record: 'PRODUCT',
    pendingImage: 'Product image coming soon',
    status: 'Product image and specifications',
    overviewEyebrow: 'PRODUCT DETAILS',
    overviewTitle: 'Everything you need for a first comparison.',
    reference: 'Product reference',
    family: 'Product family',
    minimumOrder: 'Minimum order',
    mold: 'Mold',
    pieces: 'pieces',
    bottles: 'bottles',
    highlights: 'FORMULATION DIRECTION',
    highlightsTitle: 'Ingredients and features at a glance.',
    applications: 'INTENDED APPLICATION',
    applicationsTitle: 'Where this concept fits.',
    sampleNote: 'A physical sample is the best way to confirm colour, feel and fit.',
    threeDEyebrow: 'VIEW IN 3D',
    threeDTitle: 'Turn the product and see it from every side.',
    threeDBody: 'Use the 3D view to explore its shape and presentation before requesting a sample.',
    related: 'MORE IN THIS RANGE',
    relatedTitle: 'You may also like these products.',
    ctaEyebrow: 'REQUEST THIS PRODUCT',
    ctaTitle: 'Interested in this mask?',
    ctaBody: 'Request a quote or sample for this product. Add your quantity, market and preferred timing if available.',
    primary: 'Request a quote for this product',
    secondary: 'View all products'
  },
  zh: {
    home: '首页',
    products: '产品',
    record: '产品',
    pendingImage: '产品图片即将更新',
    status: '实拍图片与参考规格',
    overviewEyebrow: '产品详情',
    overviewTitle: '规格、包装与起订量，合作前心里有数。',
    reference: '产品编号',
    family: '产品系列',
    minimumOrder: '参考起订量',
    mold: '模具',
    pieces: '片',
    bottles: '瓶',
    highlights: '消费者会感受到什么',
    highlightsTitle: '从成分到肤感，这款产品的核心看点。',
    applications: '可延展的产品卖点',
    applicationsTitle: '让消费者一眼看懂，这款产品适合什么场景。',
    sampleNote: '申请实物样品，亲自确认配方、颜色、肤感与贴合度。',
    threeDEyebrow: '查看产品造型',
    threeDTitle: '转动看看，这个轮廓是否符合品牌设想。',
    threeDBody: '在线效果便于比较整体造型；最终尺寸、颜色与质感，仍以实物样品为准。',
    related: '更多同类选择',
    relatedTitle: '不同成分、颜色与肤感，也值得一起比较。',
    ctaEyebrow: '申请这款产品',
    ctaTitle: '想了解这款产品的样品与报价？',
    ctaBody: '提交预计数量、目标市场与上市时间，即可咨询这款产品的样品、可调整内容、报价和交期；参考配方或包装图片也可一并提供。',
    primary: '申请样品并获取报价',
    secondary: '查看全部产品'
  },
  fr: {
    home: 'Accueil',
    products: 'Produits',
    record: 'PRODUIT',
    pendingImage: 'Visuel à venir',
    status: 'Image et spécifications du produit',
    overviewEyebrow: 'DÉTAILS DU PRODUIT',
    overviewTitle: 'Les informations utiles pour une première comparaison.',
    reference: 'Référence produit',
    family: 'Famille de produits',
    minimumOrder: 'Commande minimale',
    mold: 'Moule',
    pieces: 'pièces',
    bottles: 'flacons',
    highlights: 'DIRECTION DE FORMULATION',
    highlightsTitle: 'Ingrédients et caractéristiques en un coup d’œil.',
    applications: 'APPLICATION VISÉE',
    applicationsTitle: 'Le positionnement de ce concept.',
    sampleNote: 'Un échantillon permet de confirmer la couleur, le toucher et l’ajustement.',
    threeDEyebrow: 'VOIR EN 3D',
    threeDTitle: 'Faites tourner le produit et observez-le sous tous les angles.',
    threeDBody: 'La vue 3D permet d’explorer sa forme et sa présentation avant de demander un échantillon.',
    related: 'AUTRES PRODUITS DE LA GAMME',
    relatedTitle: 'Ces produits pourraient aussi vous intéresser.',
    ctaEyebrow: 'DEMANDER CE PRODUIT',
    ctaTitle: 'Ce masque vous intéresse ?',
    ctaBody: 'Demandez un devis ou un échantillon et précisez, si possible, la quantité, le marché et le calendrier.',
    primary: 'Demander un devis pour ce produit',
    secondary: 'Voir tous les produits'
  },
  es: {
    home: 'Inicio',
    products: 'Productos',
    record: 'PRODUCTO',
    pendingImage: 'Imagen disponible próximamente',
    status: 'Imagen y especificaciones del producto',
    overviewEyebrow: 'DETALLES DEL PRODUCTO',
    overviewTitle: 'La información útil para una primera comparación.',
    reference: 'Referencia de producto',
    family: 'Familia de productos',
    minimumOrder: 'Pedido mínimo',
    mold: 'Molde',
    pieces: 'unidades',
    bottles: 'frascos',
    highlights: 'DIRECCIÓN DE FORMULACIÓN',
    highlightsTitle: 'Ingredientes y características de un vistazo.',
    applications: 'APLICACIÓN PREVISTA',
    applicationsTitle: 'Dónde encaja este concepto.',
    sampleNote: 'Una muestra física permite confirmar color, tacto y ajuste.',
    threeDEyebrow: 'VER EN 3D',
    threeDTitle: 'Gire el producto y obsérvelo desde todos los ángulos.',
    threeDBody: 'Use la vista 3D para explorar la forma y la presentación antes de solicitar una muestra.',
    related: 'MÁS PRODUCTOS DE LA GAMA',
    relatedTitle: 'También te pueden interesar estos productos.',
    ctaEyebrow: 'SOLICITAR ESTE PRODUCTO',
    ctaTitle: '¿Te interesa esta mascarilla?',
    ctaBody: 'Solicita una cotización o muestra e indica, si puedes, cantidad, mercado y plazo.',
    primary: 'Solicitar cotización de este producto',
    secondary: 'Ver todos los productos'
  },
  ru: {
    home: 'Главная', products: 'Продукция', record: 'ПРОДУКТ', pendingImage: 'Изображение скоро появится', status: 'Изображение и характеристики продукта',
    overviewEyebrow: 'О ПРОДУКТЕ', overviewTitle: 'Всё необходимое для первого сравнения.', reference: 'Артикул', family: 'Категория', minimumOrder: 'Минимальный заказ', mold: 'Форма', pieces: 'шт.', bottles: 'флаконов',
    highlights: 'НАПРАВЛЕНИЕ ФОРМУЛЫ', highlightsTitle: 'Ингредиенты и особенности с первого взгляда.', applications: 'НАЗНАЧЕНИЕ', applicationsTitle: 'Для каких задач подходит этот продукт.', sampleNote: 'Физический образец лучше всего помогает оценить цвет, ощущение и посадку.',
    threeDEyebrow: '3D-ПРОСМОТР', threeDTitle: 'Поверните продукт и рассмотрите его со всех сторон.', threeDBody: 'Изучите форму и внешний вид в 3D перед запросом образца.', related: 'ДРУГИЕ ПРОДУКТЫ ЛИНЕЙКИ', relatedTitle: 'Вам также могут подойти эти продукты.',
    ctaEyebrow: 'ЗАПРОСИТЬ ПРОДУКТ', ctaTitle: 'Заинтересовала эта маска?', ctaBody: 'Запросите цену или образец. По возможности укажите количество, рынок и желаемые сроки.', primary: 'Запросить цену на этот продукт', secondary: 'Смотреть все продукты'
  },
  ar: {
    home: 'الرئيسية', products: 'المنتجات', record: 'المنتج', pendingImage: 'صورة المنتج ستتوفر قريباً', status: 'صورة المنتج ومواصفاته',
    overviewEyebrow: 'تفاصيل المنتج', overviewTitle: 'كل ما تحتاجه للمقارنة الأولى.', reference: 'مرجع المنتج', family: 'فئة المنتج', minimumOrder: 'الحد الأدنى للطلب', mold: 'القالب', pieces: 'قطعة', bottles: 'عبوة',
    highlights: 'اتجاه التركيبة', highlightsTitle: 'المكونات والخصائص بنظرة سريعة.', applications: 'الاستخدام المقصود', applicationsTitle: 'مجالات استخدام هذا المنتج.', sampleNote: 'العينة الفعلية هي أفضل طريقة لتأكيد اللون والملمس والملاءمة.',
    threeDEyebrow: 'عرض ثلاثي الأبعاد', threeDTitle: 'حرّك المنتج وشاهده من جميع الجوانب.', threeDBody: 'استخدم العرض ثلاثي الأبعاد لاستكشاف الشكل والتقديم قبل طلب عينة.', related: 'المزيد من هذه المجموعة', relatedTitle: 'قد تناسبك هذه المنتجات أيضاً.',
    ctaEyebrow: 'اطلب هذا المنتج', ctaTitle: 'هل أنت مهتم بهذا القناع؟', ctaBody: 'اطلب عرض سعر أو عينة، وأضف الكمية والسوق والموعد المفضل إن أمكن.', primary: 'طلب عرض سعر لهذا المنتج', secondary: 'عرض جميع المنتجات'
  }
} satisfies Record<Locale, Record<string, string>>;

const hydrogelDetailCopy = {
  en: {
    galleryEyebrow: 'SUPPLIED PRODUCT MATERIAL', galleryTitle: 'See the product from detail, use and pack perspectives.', galleryBody: 'These images come from the supplied product-detail material and help identify the current concept. The approved sample remains the production reference.',
    categoryFormats: 'Technical format range', formatUnit: 'documented formats', atlasLink: 'Open category atlas',
    processEyebrow: 'HYDROGEL PRODUCTION', processTitle: 'Twelve controlled stages from gel powder to finished pack.', processBody: 'The supplied process material shows how preparation, forming, soaking, inspection and packaging connect in one production flow.',
    patentsEyebrow: 'RELATED PATENT EVIDENCE', patentsTitle: 'Production know-how documented around the hydrogel workflow.', patentsBody: 'Five directly relevant certificates are shown here as evidence for cutting, production systems, material preparation, product appearance and coating.',
    patentNote: 'Patent evidence supports Showki’s stated hydrogel-production capability. It does not by itself state that this SKU is patented, licensed for a market or exclusive to a customer.'
  },
  zh: {
    galleryEyebrow: '查看产品实拍', galleryTitle: '实物细节，往往比文字更能说明产品。', galleryBody: '凝胶质地、贴敷方式与包装外观都能直观看见；颜色、配方、膜型与最终呈现，以品牌确认的样品为准。',
    categoryFormats: '同类膜型选择', formatUnit: '种膜型参考', atlasLink: '查看更多膜型',
    processEyebrow: '生产与品控', processTitle: '从凝胶制备到成品包装，十二道工序环环相接。', processBody: '确认样品会成为制备、成型、浸泡、检验与包装的沟通依据，让每个关键环节都有清晰标准。',
    patentsEyebrow: '水凝膜相关专利', patentsTitle: '把水凝膜做好，靠的是长期积累的工艺能力。', patentsBody: '5 项相关专利覆盖水凝膜切料、生产系统、物料制备、产品外观与涂布，为修齐的研发和生产能力提供可查证的依据。',
    patentNote: '这些专利用于说明相关生产与研发能力，并不代表当前产品本身已获专利、取得特定市场许可或属于客户独家产品。'
  },
  fr: {
    galleryEyebrow: 'VISUELS PRODUIT FOURNIS', galleryTitle: 'Observez le produit, son usage et son emballage.', galleryBody: 'Ces visuels proviennent des documents produit fournis. L’échantillon approuvé reste la référence de production.',
    categoryFormats: 'Formats techniques de la catégorie', formatUnit: 'formats documentés', atlasLink: 'Ouvrir l’atlas',
    processEyebrow: 'PRODUCTION HYDROGEL', processTitle: 'Douze étapes contrôlées, de la poudre de gel au produit emballé.', processBody: 'Le processus fourni relie préparation, formage, imprégnation, contrôle et conditionnement.',
    patentsEyebrow: 'PREUVES DE BREVETS LIÉES', patentsTitle: 'Un savoir-faire documenté autour du flux hydrogel.', patentsBody: 'Cinq certificats directement liés couvrent découpe, système de production, préparation, apparence et enduction.',
    patentNote: 'Ces preuves soutiennent la capacité annoncée de Showki. Elles ne signifient pas, à elles seules, que ce SKU est breveté, licencié sur un marché ou exclusif.'
  },
  es: {
    galleryEyebrow: 'MATERIAL DE PRODUCTO SUMINISTRADO', galleryTitle: 'Mira el producto, su uso y su empaque en detalle.', galleryBody: 'Las imágenes proceden del material facilitado. La muestra aprobada sigue siendo la referencia de producción.',
    categoryFormats: 'Formatos técnicos de la categoría', formatUnit: 'formatos documentados', atlasLink: 'Abrir atlas',
    processEyebrow: 'PRODUCCIÓN DE HIDROGEL', processTitle: 'Doce etapas controladas desde el polvo de gel hasta el empaque.', processBody: 'El proceso facilitado conecta preparación, formado, impregnación, inspección y empaque.',
    patentsEyebrow: 'EVIDENCIA DE PATENTES', patentsTitle: 'Conocimiento documentado en torno al proceso de hidrogel.', patentsBody: 'Cinco certificados relacionados cubren corte, sistema productivo, preparación, apariencia y recubrimiento.',
    patentNote: 'Esta evidencia respalda la capacidad declarada de Showki; por sí sola no indica que el SKU esté patentado, licenciado para un mercado o sea exclusivo.'
  },
  ru: {
    galleryEyebrow: 'ПРЕДОСТАВЛЕННЫЕ МАТЕРИАЛЫ', galleryTitle: 'Рассмотрите продукт, применение и упаковку.', galleryBody: 'Изображения взяты из предоставленных материалов. Производственным эталоном остаётся утверждённый образец.',
    categoryFormats: 'Технические форматы категории', formatUnit: 'документированных форматов', atlasLink: 'Открыть атлас',
    processEyebrow: 'ПРОИЗВОДСТВО ГИДРОГЕЛЯ', processTitle: 'Двенадцать контролируемых этапов от порошка до упаковки.', processBody: 'Процесс объединяет подготовку, формование, пропитку, контроль и упаковку.',
    patentsEyebrow: 'СВЯЗАННЫЕ ПАТЕНТЫ', patentsTitle: 'Документированная технология производства гидрогеля.', patentsBody: 'Пять сертификатов относятся к резке, производственной системе, подготовке материала, внешнему виду и нанесению.',
    patentNote: 'Материалы подтверждают заявленные возможности Showki, но сами по себе не означают, что SKU запатентован, разрешён для рынка или является эксклюзивным.'
  },
  ar: {
    galleryEyebrow: 'مواد المنتج المقدمة', galleryTitle: 'شاهد تفاصيل المنتج والاستخدام والتغليف.', galleryBody: 'الصور مأخوذة من مواد المنتج المقدمة، وتبقى العينة المعتمدة مرجع الإنتاج.',
    categoryFormats: 'التصاميم التقنية للفئة', formatUnit: 'تصميماً موثقاً', atlasLink: 'فتح الأطلس',
    processEyebrow: 'إنتاج الهيدروجيل', processTitle: 'اثنتا عشرة مرحلة مضبوطة من مسحوق الجل إلى العبوة النهائية.', processBody: 'يربط المسار المقدم التحضير والتشكيل والنقع والفحص والتغليف.',
    patentsEyebrow: 'أدلة البراءات ذات الصلة', patentsTitle: 'خبرة موثقة حول مسار إنتاج الهيدروجيل.', patentsBody: 'تغطي خمس شهادات مرتبطة القطع ونظام الإنتاج وتحضير المواد والمظهر والطلاء.',
    patentNote: 'تدعم الأدلة قدرات Showki المعلنة، لكنها لا تعني وحدها أن SKU حاصل على براءة أو مرخص لسوق أو حصري.'
  }
} satisfies Record<Locale, Record<string, string>>;

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((product) => ({locale, sku: product.slug})));
}

export async function generateMetadata({params}: {params: Promise<{locale: string; sku: string}>}): Promise<Metadata> {
  const {locale: rawLocale, sku} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const product = getProduct(sku);
  if (!product) return {};
  return {
    title: locale === 'zh' ? `${product.name.zh}样品、规格与报价` : product.name[locale],
    description: product.description[locale]
  };
}

export default async function ProductPage({params}: {params: Promise<{locale: string; sku: string}>}) {
  const {locale: rawLocale, sku} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const product = getProduct(sku);
  if (!product) notFound();
  const primaryCategory = product.categoryIds?.[0] ?? product.category;
  const category = getCategory(primaryCategory);
  const related = products.filter((item) => item.categoryIds?.includes(primaryCategory as import('@/data/catalog').MarketCategory) && item.sku !== product.sku).sort((a, b) => Number(Boolean(b.sourcePage)) - Number(Boolean(a.sourcePage)) || a.sortOrder - b.sortOrder).slice(0, 3);
  const t = detailCopy[locale];
  const sampleNote = product.sourcePage ? ({zh: '可通过实物样品确认质地、香型、颜色、包材及最终规格。', en: 'Confirm texture, scent, colour, packaging and final specifications with a physical sample.', fr: 'Confirmez la texture, le parfum, la couleur, l’emballage et les spécifications sur échantillon.', es: 'Confirma textura, fragancia, color, envase y especificaciones con una muestra física.', ru: 'Подтвердите текстуру, аромат, цвет, упаковку и характеристики по образцу.', ar: 'أكد القوام والرائحة واللون والعبوة والمواصفات النهائية بعينة فعلية.'} as const)[locale] : t.sampleNote;
  const overviewTitle = product.sourcePage ? ({zh: '先了解产品方向，规格与起订量按项目确认。', en: 'Explore the product direction; confirm specifications and minimum order by project.', fr: 'Découvrez le produit ; confirmez les spécifications et le minimum par projet.', es: 'Conoce el producto y confirma especificaciones y pedido mínimo por proyecto.', ru: 'Изучите продукт; характеристики и минимальный заказ уточняются для проекта.', ar: 'تعرف على المنتج؛ تؤكد المواصفات والحد الأدنى للطلب حسب المشروع.'} as const)[locale] : t.overviewTitle;
  const h = hydrogelDetailCopy[locale];
  const productImage = product.media?.imageStatus === 'available' ? product.media.image : undefined;
  const gallery = product.media?.gallery ?? [];
  const categoryFormatCount = getHydrogelFormats(product.category).length;
  const minimumOrder = product.commercialTerms.moq
    ? `${product.commercialTerms.moq.quantity.toLocaleString(locale)} ${product.commercialTerms.moq.unit === 'pieces' ? t.pieces : t.bottles}`
    : ({zh: '待确认', en: 'To be confirmed', fr: 'À confirmer', es: 'Por confirmar', ru: 'Уточняется', ar: 'قيد التأكيد'} as const)[locale];
  const inquiryHref = `${localizedPath(locale, 'inquiry')}#sku=${encodeURIComponent(product.sku)}`;

  return (
    <main className="page-main" data-cms={`products:${product.productId}`}>
      <div className="breadcrumbs"><Link href={localizedPath(locale)}>{t.home}</Link><span>/</span><Link href={localizedPath(locale, 'products')}>{t.products}</Link><span>/</span>{category?.name[locale]}<span>/</span>{product.name[locale]}</div>
      <PageIntro eyebrow={category?.name[locale] ?? t.record} title={product.name[locale]} body={product.description[locale]} meta={[product.productId, ...product.specifications.map((item) => item.value[locale])]} />

      <section className="section product-detail">
        <div className="product-detail-layout">
          <div className="product-detail__media radiant-frame">
            {productImage && product.media
              ? <Image src={productImage} width={1536} height={1536} alt={product.media.alt[locale]} priority />
              : <div className="product-media-placeholder" data-category={product.category} role="img" aria-label={`${product.name[locale]} · ${t.pendingImage}`}><span>{t.record}</span><strong>{product.productId}</strong><small>{t.pendingImage}</small></div>}
          </div>
          <aside className="product-detail__summary">
            <p className="eyebrow">{t.record}</p>
            <h2>{product.name[locale]}</h2>
            <p>{product.sourcePage ? ({zh: '宣传资料图片与参考信息', en: 'Brochure image and reference information', fr: 'Visuel et informations du catalogue', es: 'Imagen e información del folleto', ru: 'Изображение и сведения из буклета', ar: 'صورة ومعلومات من الكتيب'} as const)[locale] : t.status}</p>
            <ol>
              <li>{product.productId}</li>
              <li>{category?.name[locale]}</li>
              {product.specifications.length > 0 && <li>{product.specifications.map((item) => item.value[locale]).join(' · ')}</li>}
              <li>{minimumOrder}</li>
            </ol>
          </aside>
        </div>
      </section>

      {gallery.length > 1 && (
        <section className="section product-gallery-section">
          <SectionTitle eyebrow={h.galleryEyebrow} title={h.galleryTitle} body={h.galleryBody} />
          <div className="product-gallery-grid">
            {gallery.map((image, index) => (
              <figure className={index === 0 ? 'product-gallery-item product-gallery-item--lead' : 'product-gallery-item'} key={image}>
                <Image src={image} fill sizes={index === 0 ? '(max-width: 700px) 100vw, 58vw' : '(max-width: 700px) 100vw, 30vw'} alt={`${product.media?.alt[locale] ?? product.name[locale]} · ${index + 1}`} />
                <figcaption><span>{String(index + 1).padStart(2, '0')}</span><strong>{product.name[locale]}</strong></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section section--dark">
        <div className="capability-grid">
          <SectionTitle dark eyebrow={t.overviewEyebrow} title={overviewTitle} body={sampleNote} />
          <div className="spec-rail">
            <div className="spec-row"><span>{t.reference}</span><p>{product.productId}</p></div>
            <div className="spec-row"><span>{t.family}</span><p>{category?.name[locale]}</p></div>
            {product.specifications.map((item) => <div className="spec-row" key={item.id}><span>{item.label[locale]}</span><p data-cms-field={item.id}>{item.value[locale]}</p></div>)}
            <div className="spec-row"><span>{t.minimumOrder}</span><p>{minimumOrder}</p></div>
            {product.commercialTerms.mold && <div className="spec-row"><span>{t.mold}</span><p>{product.commercialTerms.mold.label[locale]}</p></div>}
            {categoryFormatCount > 0 && <div className="spec-row"><span>{h.categoryFormats}</span><p>{categoryFormatCount} {h.formatUnit} · <Link href={localizedPath(locale, `categories/${product.category}`)}>{h.atlasLink} ↗</Link></p></div>}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t.highlights} title={t.highlightsTitle} />
        <div className="check-grid">{product.highlights.map((highlight, index) => <article key={highlight[locale]}><span>0{index + 1}</span><h3>{highlight[locale]}</h3><p>{sampleNote}</p></article>)}</div>
      </section>

      <section className="section">
        <SectionTitle eyebrow={t.applications} title={t.applicationsTitle} />
        <div className="stage-rail stage-rail--light">{product.applications.map((application, index) => <article key={application[locale]}><span>0{index + 1}</span><h3>{application[locale]}</h3><p>{product.eyebrow[locale]}</p></article>)}</div>
      </section>

      {!product.sourcePage && <section className="section section--dark hydrogel-process-section">
        <SectionTitle dark eyebrow={h.processEyebrow} title={h.processTitle} body={h.processBody} />
        <ol className="hydrogel-process-track">
          {hydrogelProcessSteps.map((step, index) => (
            <li key={step.en}><span>{String(index + 1).padStart(2, '0')}</span><h3>{step[locale]}</h3></li>
          ))}
        </ol>
      </section>}

      {!product.sourcePage && <section className="section section--paper product-patent-evidence">
        <SectionTitle eyebrow={h.patentsEyebrow} title={h.patentsTitle} body={h.patentsBody} />
        <div className="hydrogel-patent-grid">
          {hydrogelPatentProofs.map((patent) => (
            <article className="hydrogel-patent-record" key={patent.patentNo}>
              <figure><Image src={patent.image} fill sizes="(max-width: 700px) 100vw, 24vw" alt={`${patent.title[locale]} · ${patent.patentNo}`} /></figure>
              <div><span>{patent.patentNo}</span><h3>{patent.title[locale]}</h3><p>{patent.relevance[locale]}</p></div>
            </article>
          ))}
        </div>
        <p className="evidence-note">{h.patentNote}</p>
      </section>}

      {product.configurator3d && (
        <section className="section section--paper product-3d-optional">
          <SectionTitle eyebrow={t.threeDEyebrow} title={t.threeDTitle} body={t.threeDBody} />
          <div className="optional-review-card"><span aria-hidden="true">3D</span><div><strong>{product.productId}</strong><p>{t.threeDBody}</p></div></div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section">
          <SectionTitle eyebrow={t.related} title={t.relatedTitle} />
          <div className="product-grid">{related.map((item) => <ProductCard product={item} locale={locale} key={item.sku} />)}</div>
        </section>
      )}

      <ActionBand
        locale={locale}
        eyebrow={t.ctaEyebrow}
        title={product.sourcePage ? product.name[locale] : t.ctaTitle}
        body={t.ctaBody}
        primaryHref={inquiryHref}
        primaryLabel={t.primary}
        secondaryPath="products"
        secondaryLabel={t.secondary}
      />
    </main>
  );
}
