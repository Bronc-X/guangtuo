import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ProductCard} from '@/components/product-card';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {getCategory, getProduct, products} from '@/data/catalog';
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
    status: '产品图片与规格',
    overviewEyebrow: '产品详情',
    overviewTitle: '第一次比较产品所需的信息，都在这里。',
    reference: '产品编号',
    family: '产品系列',
    minimumOrder: '最低起订量',
    mold: '模具',
    pieces: '片',
    bottles: '瓶',
    highlights: '配方方向',
    highlightsTitle: '快速了解主要成分与产品特点。',
    applications: '适用方向',
    applicationsTitle: '了解这款产品适合的护理需求。',
    sampleNote: '颜色、触感与贴合度，建议通过实物样品确认。',
    threeDEyebrow: '查看 3D',
    threeDTitle: '这款产品可以查看 3D 效果。',
    threeDBody: '如需讨论形状与呈现方式，可在沟通时提出查看。',
    related: '同系列更多产品',
    relatedTitle: '这些产品也值得看看。',
    ctaEyebrow: '咨询这款产品',
    ctaTitle: '对这款面膜感兴趣？',
    ctaBody: '可以直接申请这款产品的报价或样品，并补充预计数量、目标市场与时间。',
    primary: '获取这款产品的报价',
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
  }
} satisfies Record<Locale, Record<string, string>>;

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((product) => ({locale, sku: product.slug})));
}

export default async function ProductPage({params}: {params: Promise<{locale: string; sku: string}>}) {
  const {locale: rawLocale, sku} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const product = getProduct(sku);
  if (!product) notFound();
  const category = getCategory(product.category);
  const related = products.filter((item) => item.category === product.category && item.sku !== product.sku).slice(0, 3);
  const t = detailCopy[locale];
  const productImage = product.media?.imageStatus === 'available' ? product.media.image : undefined;
  const unit = product.commercialTerms.moq.unit === 'pieces' ? t.pieces : t.bottles;
  const minimumOrder = `${product.commercialTerms.moq.quantity.toLocaleString(locale)} ${unit}`;
  const inquiryHref = `${localizedPath(locale, 'inquiry')}#sku=${encodeURIComponent(product.sku)}`;

  return (
    <main className="page-main">
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
            <p>{t.status}</p>
            <ol>
              <li>{product.productId}</li>
              <li>{category?.name[locale]}</li>
              <li>{product.specifications.map((item) => item.value[locale]).join(' · ')}</li>
              <li>{minimumOrder}</li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="section section--dark">
        <div className="capability-grid">
          <SectionTitle dark eyebrow={t.overviewEyebrow} title={t.overviewTitle} body={t.sampleNote} />
          <div className="spec-rail">
            <div className="spec-row"><span>{t.reference}</span><p>{product.productId}</p></div>
            <div className="spec-row"><span>{t.family}</span><p>{category?.name[locale]}</p></div>
            {product.specifications.map((item) => <div className="spec-row" key={item.id}><span>{item.label[locale]}</span><p>{item.value[locale]}</p></div>)}
            <div className="spec-row"><span>{t.minimumOrder}</span><p>{minimumOrder}</p></div>
            <div className="spec-row"><span>{t.mold}</span><p>{product.commercialTerms.mold.label[locale]}</p></div>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t.highlights} title={t.highlightsTitle} />
        <div className="check-grid">{product.highlights.map((highlight, index) => <article key={highlight[locale]}><span>0{index + 1}</span><h3>{highlight[locale]}</h3><p>{t.sampleNote}</p></article>)}</div>
      </section>

      <section className="section">
        <SectionTitle eyebrow={t.applications} title={t.applicationsTitle} />
        <div className="stage-rail stage-rail--light">{product.applications.map((application, index) => <article key={application[locale]}><span>0{index + 1}</span><h3>{application[locale]}</h3><p>{product.eyebrow[locale]}</p></article>)}</div>
      </section>

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
        title={t.ctaTitle}
        body={t.ctaBody}
        primaryHref={inquiryHref}
        primaryLabel={t.primary}
        secondaryPath="products"
        secondaryLabel={t.secondary}
      />
    </main>
  );
}
