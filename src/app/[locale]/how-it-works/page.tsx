import type {Metadata} from 'next';
import Image from 'next/image';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {developmentVisuals} from '@/data/site-visuals';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.process;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/how-it-works/`, languages: companyPageAlternates('how-it-works')}
  };
}

export default async function HowItWorksPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.process;
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.stepsTitle)} />
        <div className="process-grid process-grid--complete">
          {copy.steps.map((step, index) => (
            <article className="process-card" key={t(step.title)}>
              <div className="process-card__visual"><Image src={developmentVisuals[index]} fill sizes="(max-width: 700px) 100vw, 33vw" alt={t(step.title)} /></div>
              <div className="process-card__copy">
                <span className="eyebrow">0{index + 1}</span>
                <h3>{t(step.title)}</h3>
                <p>{t(step.body)}</p>
                <small>{t(step.note)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--dark process-principles">
        <SectionTitle dark eyebrow={t(copy.intro.eyebrow)} title={t(copy.controlsTitle)} />
        <div className="stage-rail">
          {copy.controls.map((control, index) => <article key={t(control.title)}><span>0{index + 1}</span><h3>{t(control.title)}</h3><p>{t(control.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow="FAQ" title={t(copy.faqTitle)} />
        <div className="faq-list">
          {copy.faq.map((item) => <details key={t(item.question)}><summary>{t(item.question)}</summary><p>{t(item.answer)}</p></details>)}
        </div>
      </section>

      <ActionBand
        locale={locale}
        eyebrow={t(copy.action.eyebrow)}
        title={t(copy.action.title)}
        body={t(copy.action.body)}
        primaryPath="inquiry"
        primaryLabel={t(copy.action.primary)}
        secondaryPath="customization"
        secondaryLabel={t(copy.action.secondary)}
      />
    </main>
  );
}
