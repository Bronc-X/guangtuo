import type {Metadata} from 'next';
import Link from 'next/link';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {defaultLocale, isLocale, localizedPath, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.contact;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/contact/`, languages: companyPageAlternates('contact')}
  };
}

export default async function ContactPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.contact;
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.pathsTitle)} />
        <div className="contact-grid">
          {copy.paths.map((path, index) => (
            <article key={t(path.title)}>
              <span>0{index + 1}</span>
              <h2>{t(path.title)}</h2>
              <p>{t(path.body)}</p>
              <Link className="text-link" href={localizedPath(locale, path.path)}>{t(path.label)} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.prepareTitle)} />
        <div className="check-grid">
          {copy.prepare.map((item, index) => <article key={t(item.title)}><span>0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--dark contact-expectation">
        <SectionTitle dark eyebrow={t(copy.intro.eyebrow)} title={t(copy.nextTitle)} />
        <div className="stage-rail">
          {copy.next.map((item, index) => <article key={t(item.title)}><span>0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>)}
        </div>
      </section>

      <ActionBand
        locale={locale}
        eyebrow={t(copy.action.eyebrow)}
        title={t(copy.action.title)}
        body={t(copy.action.body)}
        primaryPath="inquiry"
        primaryLabel={t(copy.action.primary)}
        secondaryPath="products"
        secondaryLabel={t(copy.action.secondary)}
      />
    </main>
  );
}
