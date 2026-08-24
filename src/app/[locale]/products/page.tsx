import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ProductCard} from '@/components/product-card';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {categories, products} from '@/data/catalog';
import {categoryVisuals} from '@/data/site-visuals';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';

const pageCopy = {
  en: {
    title: 'Finished mask product library',
    description: 'Compare finished face, eye and neck mask concepts from Guangtuo Bio.',
    eyebrow: 'PRODUCT LIBRARY',
    heroTitle: 'Thirteen finished masks.\nOne place to find yours.',
    heroBody: 'Compare ingredients, net weight, use and minimum order, then request samples for the products that suit your brand.',
    familyEyebrow: 'BROWSE BY AREA',
    familyTitle: 'Start with the part of the skin you want to care for.',
    explore: 'View products',
    allEyebrow: 'ALL PRODUCTS',
    allTitle: 'Explore the complete mask range.',
    allBody: 'See each product alongside its current format, net weight and minimum order.',
    all: 'All products',
    ctaEyebrow: 'FIND YOUR MASK',
    ctaTitle: 'Not sure which mask suits your brand?',
    ctaBody: 'Tell us the skin area, ingredients or finish you prefer, and the quantity you have in mind.',
    primary: 'Ask a product advisor',
    secondary: 'See how customisation works'
  },
  zh: {
    title: '成品面膜产品库',
    description: '浏览广拓生物的面部、眼部与颈部成品面膜方案。',
    eyebrow: '产品库',
    heroTitle: '十三款成品面膜，\n在这里找到适合你的那一款。',
    heroBody: '比较成分、净含量、适用部位与起订量，再为感兴趣的产品申请样品。',
    familyEyebrow: '按护理部位浏览',
    familyTitle: '先从想护理的肌肤部位开始。',
    explore: '查看产品',
    allEyebrow: '全部产品',
    allTitle: '查看完整成品面膜系列。',
    allBody: '每款产品均展示现有形态、净含量与起订量，方便直接比较。',
    all: '全部产品',
    ctaEyebrow: '挑选面膜',
    ctaTitle: '还不确定哪一款更适合品牌？',
    ctaBody: '告诉我们护理部位、偏好的成分或外观，以及大致数量即可。',
    primary: '咨询产品顾问',
    secondary: '了解定制方式'
  },
  fr: {
    title: 'Bibliothèque de masques finis',
    description: 'Comparez les concepts de masques finis pour le visage, les yeux et le cou de Guangtuo Bio.',
    eyebrow: 'BIBLIOTHÈQUE PRODUITS',
    heroTitle: 'Treize masques finis.\nTrouvez celui de votre marque.',
    heroBody: 'Comparez ingrédients, poids net, usage et quantité minimale, puis demandez les échantillons qui vous intéressent.',
    familyEyebrow: 'PAR ZONE DE SOIN',
    familyTitle: 'Commencez par la zone que vous souhaitez choyer.',
    explore: 'Voir les produits',
    allEyebrow: 'TOUS LES PRODUITS',
    allTitle: 'Découvrez toute la gamme de masques.',
    allBody: 'Chaque produit présente son format, son poids net et sa quantité minimale actuels.',
    all: 'Tous les produits',
    ctaEyebrow: 'CHOISIR UN MASQUE',
    ctaTitle: 'Vous hésitez entre plusieurs produits ?',
    ctaBody: 'Indiquez la zone, les ingrédients ou l’aspect souhaités, ainsi que la quantité envisagée.',
    primary: 'Parler à un conseiller',
    secondary: 'Voir la personnalisation'
  },
  es: {
    title: 'Biblioteca de mascarillas terminadas',
    description: 'Compare conceptos terminados para rostro, ojos y cuello de Guangtuo Bio.',
    eyebrow: 'BIBLIOTECA DE PRODUCTOS',
    heroTitle: 'Trece mascarillas terminadas.\nEncuentra la de tu marca.',
    heroBody: 'Compara ingredientes, peso neto, uso y cantidad mínima, y solicita muestras de tus favoritas.',
    familyEyebrow: 'POR ZONA DE CUIDADO',
    familyTitle: 'Empieza por la zona que quieres cuidar.',
    explore: 'Ver productos',
    allEyebrow: 'TODOS LOS PRODUCTOS',
    allTitle: 'Descubre la gama completa de mascarillas.',
    allBody: 'Cada producto muestra su formato, peso neto y cantidad mínima actuales.',
    all: 'Todos los productos',
    ctaEyebrow: 'ELIGE TU MASCARILLA',
    ctaTitle: '¿Dudas entre varios productos?',
    ctaBody: 'Indica la zona, los ingredientes o el aspecto que buscas y la cantidad aproximada.',
    primary: 'Hablar con un asesor',
    secondary: 'Ver la personalización'
  }
} satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {title: pageCopy[locale].title, description: pageCopy[locale].description};
}

export default async function ProductsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const t = pageCopy[locale];

  return (
    <main className="page-main">
      <PageIntro eyebrow={t.eyebrow} title={t.heroTitle} body={t.heroBody} meta={categories.map((category) => category.name[locale])} />
      <section className="section category-portals">
        <SectionTitle eyebrow={t.familyEyebrow} title={t.familyTitle} />
        <div className="category-portal-grid">
          {categories.map((category, index) => (
            <Link href={localizedPath(locale, `categories/${category.slug}`)} className="category-portal" key={category.slug}>
              <Image
                src={categoryVisuals[category.slug].src}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
                alt={categoryVisuals[category.slug].alt[locale]}
                style={categoryVisuals[category.slug].position ? {objectPosition: categoryVisuals[category.slug].position} : undefined}
              />
              <span className="category-portal__copy"><small>0{index + 1}</small><strong>{category.name[locale]}</strong><span>{t.explore} ↗</span></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionTitle eyebrow={t.allEyebrow} title={t.allTitle} body={t.allBody} />
        <div className="filters">
          <Link className="filter-chip filter-chip--active" href={localizedPath(locale, 'products')}>{t.all}</Link>
          {categories.map((category) => <Link className="filter-chip" key={category.slug} href={localizedPath(locale, `categories/${category.slug}`)}>{category.name[locale]}</Link>)}
        </div>
        <div className="product-grid">{products.map((product, index) => <ProductCard key={product.sku} product={product} locale={locale} eager={index === 0} />)}</div>
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
