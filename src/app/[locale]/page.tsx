import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ActionBand, RadiantFrame} from '@/components/site-section-kit';
import {ProductCard} from '@/components/product-card';
import {SectionHeading} from '@/components/section-heading';
import {HomeStudio} from '@/components/home-studio';
import {categories, productInCategory, products} from '@/data/catalog';
import {getSiteCopy, steps} from '@/data/site-copy';
import {getArticlePageCopy} from '@/data/page-labels';
import {categoryVisuals, developmentVisuals} from '@/data/site-visuals';
import {getPublishedHome, listPublishedArticles} from '@/lib/published-content';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';

const metadataCopy = {
  en: {title: 'Showki Biotech | Skincare OEM/ODM & Hydrogel', description: 'Explore 78 skincare and hydrogel product concepts across 12 care ranges, with formulation, sampling and packaging support.'},
  zh: {title: '修齐生物｜护肤品 OEM/ODM 与水凝胶研发', description: '探索 78 款护肤与水凝胶产品，覆盖清洁、保湿、修护、身体护理及底妆等系列，提供研发、打样与包装支持。'},
  fr: {title: 'Showki Biotech | Soins OEM/ODM et hydrogel', description: 'Découvrez 78 produits de soin et hydrogel dans 12 gammes, avec formulation et échantillons.'},
  es: {title: 'Showki Biotech | Cosmética OEM/ODM e hidrogel', description: 'Explora 78 productos de cuidado e hidrogel en 12 gamas, con formulación y muestras.'},
  ru: {title: 'Showki Biotech | Косметика OEM/ODM и гидрогель', description: '78 концепций косметики и гидрогелевых продуктов в 12 категориях с разработкой и образцами.'},
  ar: {title: 'Showki Biotech | مستحضرات العناية والهيدروجيل', description: 'استكشف 78 منتجاً للعناية بالبشرة والهيدروجيل ضمن 12 مجموعة مع تطوير التركيبات والعينات.'}
} satisfies Record<Locale, {title: string; description: string}>;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const content = getPublishedHome(locale);
  return {
    title: {absolute: content?.heroTitle ?? metadataCopy[locale].title},
    description: content?.heroBody ?? metadataCopy[locale].description,
    alternates: {languages: {en: '/en/', zh: '/zh/', fr: '/fr/', es: '/es/', ru: '/ru/', ar: '/ar/'}}
  };
}

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const siteCopy = getSiteCopy(locale);
  const publishedHome = getPublishedHome(locale);
  const c = {
    ...siteCopy,
    heroTitle: publishedHome?.heroTitle ?? siteCopy.heroTitle,
    heroBody: publishedHome?.heroBody ?? siteCopy.heroBody
  };
  const heroImage = publishedHome?.heroImage ?? categoryVisuals['eye-masks'].src;
  const latestArticles = listPublishedArticles(locale).slice(0, 3);
  const articleCopy = getArticlePageCopy(locale);
  const featuredProducts = products.filter((product) => product.isNew).slice(0, 3);

  return (
    <main className="page-main" data-cms="home">
      <section className="hero">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1>{c.heroTitle}</h1>
          <p className="hero__lead">{c.heroBody}</p>
          <div className="hero__actions">
            <Link className="button button--primary" href={localizedPath(locale, 'products')}>{c.primary}</Link>
            <Link className="button button--ghost" href={localizedPath(locale, 'inquiry')}>{c.secondary}</Link>
          </div>
          <div className="hero__proofs">{c.heroHighlights.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <RadiantFrame
          className="hero__visual"
          imageClassName="hero__image"
          image={heroImage}
          imageAlt={publishedHome ? c.heroTitle : categoryVisuals['eye-masks'].alt[locale]}
          eyebrow={c.gelCapability.eyebrow}
          caption={c.gelCapability.title}
          position={categoryVisuals['eye-masks'].position}
          priority
          sizes="(max-width: 1100px) 100vw, 48vw"
        />
      </section>

      <section className="section">
        <SectionHeading eyebrow={c.featured} title={c.featuredTitle} body={c.featureBody} />
        <div className="product-grid">{featuredProducts.map((product, index) => <ProductCard key={product.sku} product={product} locale={locale} eager={index === 0} />)}</div>
        <div className="inline-actions"><Link className="text-link" href={localizedPath(locale, 'products')}>{c.viewAll} <span>→</span></Link></div>
      </section>

      {latestArticles.length > 0 && (
        <section className="section section--paper">
          <SectionHeading eyebrow={articleCopy.index} title={articleCopy.homeTitle} body={articleCopy.homeBody} />
          <div className="mode-grid">
            {latestArticles.map((article, index) => (
              <Link data-cms={`articles:${article.slug}`} className="mode-card" href={localizedPath(locale, `insights/${article.slug}`)} key={article.id}>
                <div className="mode-card__visual"><Image src={article.cover} fill sizes="(max-width: 700px) 100vw, 33vw" alt={article.title} /></div>
                <div className="mode-card__content"><span>{String(index + 1).padStart(2, '0')} · {article.category}</span><h3 data-cms-field="title">{article.title}</h3><p data-cms-field="summary">{article.summary}</p></div>
              </Link>
            ))}
          </div>
          <div className="inline-actions"><Link className="text-link" href={localizedPath(locale, 'insights')}>{articleCopy.all} <span>→</span></Link></div>
        </section>
      )}

      <section className="section section--paper">
        <SectionHeading eyebrow={c.families} title={c.familiesTitle} />
        <div className="mode-grid">
          {categories.slice(0, 6).map((category, index) => (
            <Link className="mode-card" href={localizedPath(locale, `categories/${category.slug}`)} key={category.slug}>
              <div className="mode-card__visual">
                <Image
                  src={products.find((product) => productInCategory(product, category.slug))?.media?.image ?? categoryVisuals['eye-masks'].src}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                  alt={category.name[locale]}
                />
              </div>
              <div className="mode-card__content"><span>{String(index + 1).padStart(2, '0')}</span><h3>{category.name[locale]}</h3><p>{products.filter((product) => productInCategory(product, category.slug)).length} {locale === 'zh' ? '款产品' : 'products'}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section id="hydrogel" className="section section--dark">
        <div className="hydrogel-showcase">
          <RadiantFrame
            className="hydrogel-showcase__visual"
            image="/assets/hydrogel/gel-texture.png"
            imageAlt={c.gelCapability.title}
            eyebrow={c.gelCapability.eyebrow}
            caption={c.gelCapability.items[0]?.[0] ?? c.gelCapability.title}
            sizes="(max-width: 1100px) 100vw, 44vw"
          />
          <div className="hydrogel-showcase__content">
            <SectionHeading eyebrow={c.gelCapability.eyebrow} title={c.gelCapability.title} body={c.gelCapability.body} />
            <div className="spec-rail">
              {c.gelCapability.items.map(([label, body]) => <div className="spec-row" key={label}><span>{label}</span><p>{body}</p></div>)}
              <Link className="text-link text-link--light" href={localizedPath(locale, 'inquiry')}>{c.secondary} →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeading eyebrow={c.factory.eyebrow} title={c.factory.title} body={c.factory.body} />
        <div className="factory-gallery">
          {[
            '/assets/factory/production-line.png',
            '/assets/factory/quality-inspection.png',
            '/assets/factory/final-assembly.png'
          ].map((src, index) => (
            <figure className={index === 0 ? 'factory-shot factory-shot--production' : 'factory-shot'} key={src}>
              <Image src={src} fill sizes={index === 0 ? '(max-width: 700px) 100vw, 58vw' : '(max-width: 700px) 100vw, 34vw'} alt={c.factory.captions[index]} />
              <figcaption><span>0{index + 1}</span>{c.factory.captions[index]}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section section--paper">
        <SectionHeading eyebrow={c.process} title={c.processTitle} />
        <div className="process-grid">
          {steps[locale].map((step, index) => <article className="process-card" key={step}><div className="process-card__visual"><Image src={developmentVisuals[index]} fill sizes="(max-width: 700px) 100vw, 33vw" alt={step} /></div><h3>{step}</h3></article>)}
        </div>
      </section>

      <section className="section partnership-section">
        <div className="partnership-intro">
          <SectionHeading eyebrow={c.partnership.eyebrow} title={c.partnership.title} body={c.partnership.body} />
          <p className="partnership-intro__aside">{c.partnership.aside.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</p>
        </div>
        <figure className="partnership-map">
          <Image className="partnership-map__base" src="/assets/editorial/serum-world-map-v2.png" fill sizes="(max-width: 700px) 100vw, 1216px" alt={c.partnership.title} />
          {['north-america', 'europe', 'asia', 'oceania'].map((market, index) => (
            <span className={`market-spot market-spot--${market}`} key={market}>
              <span className="market-spot__pin" />
              <span className="market-spot__label">{c.partnership.markets[index]}</span>
            </span>
          ))}
          <div className="partnership-card">
            <div className="partnership-card__visual"><Image src="/assets/hydrogel/eye-mask-hero.jpg" fill sizes="116px" alt="" /></div>
            <div><small>{c.partnership.cardEyebrow}</small><strong>{c.partnership.cardTitle}</strong></div>
          </div>
          <figcaption>{c.partnership.caption}</figcaption>
        </figure>
      </section>

      <HomeStudio locale={locale} />

      <section className="section section--dark">
        <div className="capability-grid">
          <SectionHeading eyebrow={c.evidence} title={c.evidenceTitle} body={c.evidenceBody} />
          <div className="spec-rail">{c.evidenceItems.map(([label, body]) => <div className="spec-row" key={label}><span>{label}</span><p>{body}</p></div>)}</div>
        </div>
      </section>

      <ActionBand
        locale={locale}
        eyebrow={c.finalEyebrow}
        title={c.finalTitle}
        body={c.finalBody}
        primaryPath="inquiry"
        primaryLabel={c.secondary}
        secondaryPath="products"
        secondaryLabel={c.primary}
      />
    </main>
  );
}
