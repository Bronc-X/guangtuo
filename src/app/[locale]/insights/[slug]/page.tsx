import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {getArticleLocaleAvailability, getPublishedArticleBySlug, getPublishedArticleStaticParams} from '@/lib/published-content';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';
import {getArticlePageCopy, pageLabels} from '@/data/page-labels';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedArticleStaticParams();
}

export async function generateMetadata({params}: {params: Promise<{locale: string; slug: string}>}): Promise<Metadata> {
  const {locale: rawLocale, slug} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const article = getPublishedArticleBySlug(locale, slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: localizedPath(locale, `insights/${article.slug}`),
      languages: Object.fromEntries(getArticleLocaleAvailability()[slug].map(language => [language, localizedPath(language, `insights/${article.slug}`)]))
    }
  };
}

export default async function InsightPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale: rawLocale, slug} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const article = getPublishedArticleBySlug(locale, slug);
  if (!article) notFound();
  const copy = getArticlePageCopy(locale);
  const publishedDate = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale, {dateStyle: 'long'}).format(new Date(article.publishedAt));

  return (
    <main className="page-main" data-cms={`articles:${article.slug}`}>
      <div className="breadcrumbs"><Link href={localizedPath(locale)}>{pageLabels[locale].home}</Link><span>/</span><Link href={localizedPath(locale, 'insights')}>{copy.index}</Link><span>/</span>{article.title}</div>
      <PageIntro eyebrow={article.category} title={article.title} body={article.summary} meta={[publishedDate, copy.author]} />
      <section className="section product-detail">
        <div className="product-detail-layout">
          <div className="product-detail__media radiant-frame"><Image src={article.cover} width={1600} height={900} alt={article.title} priority /></div>
          <aside className="product-detail__summary"><p className="eyebrow">{copy.reading}</p><h2>{article.category}</h2><p>{article.summary}</p><ol><li>{publishedDate}</li><li>{copy.author}</li><li>{article.category}</li></ol></aside>
        </div>
      </section>
      <section className="section section--dark">
        <div className="capability-grid">
          <SectionTitle dark eyebrow={copy.points} title={copy.pointsTitle} body={copy.pointsBody} />
          <div className="spec-rail">
            <div className="spec-row"><span>01</span><p className="cms-text">{article.body}</p></div>
          </div>
        </div>
      </section>
      <ActionBand locale={locale} eyebrow={copy.action} title={copy.actionTitle} body={copy.actionBody} primaryPath="inquiry" primaryLabel={copy.samples} secondaryPath="products" secondaryLabel={copy.products} />
    </main>
  );
}
