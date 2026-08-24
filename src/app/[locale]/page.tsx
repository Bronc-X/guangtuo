import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ActionBand, RadiantFrame} from '@/components/site-section-kit';
import {ProductCard} from '@/components/product-card';
import {SectionHeading} from '@/components/section-heading';
import {Sku3dStudio} from '@/components/sku-3d-studio';
import {categories, products} from '@/data/catalog';
import {legacyPackagingProducts} from '@/data/legacy-packaging-catalog';
import {getSiteCopy, steps} from '@/data/site-copy';
import {categoryVisuals, developmentVisuals} from '@/data/site-visuals';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';

const metadataCopy = {
  en: {title: 'Guangtuo Bio | Hydrogel Masks for Skincare Brands', description: 'Explore 13 face, eye and neck masks, hydrogel customisation, samples, packaging and production support.'},
  zh: {title: '广拓生物｜水凝胶面膜', description: '浏览 13 款面部、眼部与颈部面膜，了解水凝胶定制、样品、包装与生产支持。'},
  fr: {title: 'Guangtuo Bio | Masques hydrogel', description: 'Découvrez 13 masques visage, yeux et cou, la personnalisation hydrogel, les échantillons et la production.'},
  es: {title: 'Guangtuo Bio | Mascarillas de hidrogel', description: 'Descubre 13 mascarillas faciales, de ojos y de cuello, personalización, muestras, envase y producción.'}
} satisfies Record<Locale, {title: string; description: string}>;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {
    ...metadataCopy[locale],
    alternates: {languages: {en: '/en/', zh: '/zh/', fr: '/fr/', es: '/es/'}}
  };
}

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const c = getSiteCopy(locale);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  return (
    <main className="page-main">
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
          image={categoryVisuals['eye-masks'].src}
          imageAlt={categoryVisuals['eye-masks'].alt[locale]}
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

      <section className="section section--paper">
        <SectionHeading eyebrow={c.families} title={c.familiesTitle} />
        <div className="mode-grid">
          {c.modes.map(([number, title, body], index) => (
            <Link className="mode-card" href={localizedPath(locale, `categories/${categories[index].slug}`)} key={number}>
              <div className="mode-card__visual">
                <Image
                  src={categoryVisuals[categories[index].slug].src}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                  alt={categoryVisuals[categories[index].slug].alt[locale]}
                  style={categoryVisuals[categories[index].slug].position ? {objectPosition: categoryVisuals[categories[index].slug].position} : undefined}
                />
              </div>
              <div className="mode-card__content"><span>{number}</span><h3>{title}</h3><p>{body}</p></div>
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

      <Sku3dStudio locale={locale} products={legacyPackagingProducts} embedded />

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
