import type {Metadata} from 'next';
import {pageLabels} from '@/data/page-labels';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.customization;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/customization/`, languages: companyPageAlternates('customization')}
  };
}

export default async function CustomizationPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.customization;
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main" data-cms="pages:customization">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section section--dark">
        <SectionTitle dark eyebrow={t(copy.scope.eyebrow)} title={t(copy.scope.title)} />
        <div className="scope-table" role="region" aria-label={t(copy.scope.title)} tabIndex={0}>
          <table>
            <thead><tr>{copy.scope.headers.map((header) => <th key={t(header)}>{t(header)}</th>)}</tr></thead>
            <tbody>
              {copy.scope.rows.map((row, index) => (
                <tr key={t(row.title)}>
                  <th><span>0{index + 1}</span>{t(row.title)}</th>
                  <td>{t(row.choices)}</td>
                  <td>{t(row.impact)}</td>
                  <td>{t(row.start)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={pageLabels[locale].faq} title={t(copy.faqTitle)} />
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
        secondaryPath="products"
        secondaryLabel={t(copy.action.secondary)}
      />
    </main>
  );
}
