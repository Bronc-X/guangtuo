import {getAboutSettings} from '@/data/brand-contact';
import type {Metadata} from 'next';
import {pageLabels} from '@/data/page-labels';
import Image from 'next/image';
import Link from 'next/link';
import {ContactMethods} from '@/components/contact-methods';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.about;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/about/`, languages: companyPageAlternates('about')}
  };
}

export default async function AboutPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.about;
  const aboutSettings = getAboutSettings(locale);
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main" data-cms="pages:about">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section showki-profile">
        <p className="eyebrow">GUANGZHOU · EST. 2015</p>
        <h2>{aboutSettings.profileTitle}</h2>
        <p>{aboutSettings.profileBody}</p>
      </section>
      <section className="section about-story">
        <div className="about-story__copy">
          <SectionTitle eyebrow={t(copy.belief.eyebrow)} title={t(copy.belief.title)} />
          <p>{t(copy.belief.body)}</p>
        </div>
        <div className="about-collage">
          {[
            '/assets/editorial/concept-development.png',
            '/assets/editorial/material-finish-study.png',
            '/assets/editorial/sample-review.png',
            '/assets/hydrogel/gel-texture.png'
          ].map((image, index) => (
            <figure key={image}><Image src={image} fill sizes="(max-width: 700px) 50vw, 30vw" alt={t(copy.practices[index % copy.practices.length].title)} /></figure>
          ))}
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t(copy.belief.eyebrow)} title={t(copy.practicesTitle)} />
        <div className="principle-grid">
          {copy.practices.map((practice, index) => <article key={t(practice.title)}><span>0{index + 1}</span><h3>{t(practice.title)}</h3><p>{t(practice.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--dark">
        <SectionTitle dark eyebrow={pageLabels[locale].evidence} title={t(copy.trustTitle)} />
        <div className="principle-grid">
          {copy.trust.map((item, index) => <article key={t(item.title)}><span>0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>)}
        </div>
      </section>

      {aboutSettings.videoId && <section className="section showki-video">
        <SectionTitle eyebrow="SHOWKI BIOTECH" title={locale === 'zh' ? '从配方到包装，了解更多' : 'Explore product development'} />
        <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${aboutSettings.videoId}?rel=0`} title={`${aboutSettings.videoSourceLabel} ${locale === 'zh' ? '产品介绍视频' : 'product video'}`} loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
        {aboutSettings.videoSource && <p className="video-source">{locale === 'zh' ? '视频来源：' : 'Video source: '}<a href={aboutSettings.videoSource} target="_blank" rel="noopener noreferrer">{aboutSettings.videoSourceLabel}</a></p>}
      </section>}
      <section id="contact" className="section section--paper">
        <SectionTitle eyebrow="LET’S TALK" title={t(companyPageCopy.contact.intro.title)} />
        <p>{t(companyPageCopy.contact.intro.body)}</p>
        <ContactMethods locale={locale} layout="cards" />
        <Link className="button button--primary" href={`/${locale}/inquiry/`}>{locale === 'zh' ? '提交产品需求' : 'Share your brief'}</Link>
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
