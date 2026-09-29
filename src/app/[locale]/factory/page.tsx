import type {Metadata} from 'next';
import {pageLabels} from '@/data/page-labels';
import Image from 'next/image';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.factory;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/factory/`, languages: companyPageAlternates('factory')}
  };
}

export default async function FactoryPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.factory;
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main" data-cms="pages:factory">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section">
        <div className="factory-collage">
          {[
            ['/assets/factory/production-line.png', 'factory-collage__main'],
            ['/assets/factory/quality-inspection.png', ''],
            ['/assets/factory/final-assembly.png', '']
          ].map(([image, className], index) => (
            <figure className={className} key={image}>
              <Image src={image} fill sizes={index === 0 ? '(max-width: 700px) 100vw, 50vw' : '(max-width: 700px) 100vw, 25vw'} alt={t(copy.stages[index].title)} priority={index === 0} />
              <figcaption>0{index + 1} · {t(copy.stages[index].title)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section section--dark factory-system">
        <SectionTitle dark eyebrow={t(copy.intro.eyebrow)} title={t(copy.stagesTitle)} />
        <div className="stage-rail">
          {copy.stages.map((stage, index) => <article key={t(stage.title)}><span>0{index + 1}</span><h3>{t(stage.title)}</h3><p>{t(stage.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.checksTitle)} />
        <div className="check-grid">
          {copy.checks.map((check, index) => <article key={t(check.title)}><span>0{index + 1}</span><h3>{t(check.title)}</h3><p>{t(check.body)}</p></article>)}
        </div>
      </section>

      <section className="section">
        <div className="trust-panel">
          <div className="trust-panel__copy">
            <p className="eyebrow">{t(copy.evidence.eyebrow)}</p>
            <h2>{t(copy.evidence.title)}</h2>
            <p>{t(copy.evidence.body)}</p>
          </div>
          <div className="trust-panel__graphic" aria-hidden="true">
            <div className="trust-wordmark"><strong>SHOWKI</strong><span>{pageLabels[locale].production}</span></div>
          </div>
        </div>
      </section>

      <ActionBand
        locale={locale}
        eyebrow={t(copy.action.eyebrow)}
        title={t(copy.action.title)}
        body={t(copy.action.body)}
        primaryPath="inquiry"
        primaryLabel={t(copy.action.primary)}
        secondaryPath="how-it-works"
        secondaryLabel={t(copy.action.secondary)}
      />
    </main>
  );
}
