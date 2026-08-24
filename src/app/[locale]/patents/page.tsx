import type {Metadata} from 'next';
import Image from 'next/image';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

const patentDocuments = [
  {
    image: '/assets/qualifications/hydrogel-production-system.jpg',
    title: {
      en: 'Hydrogel cosmetics production system',
      zh: '一种凝胶化妆品生产系统',
      fr: 'Système de production de cosmétiques hydrogel',
      es: 'Sistema de producción de cosméticos de hidrogel'
    },
    kind: {en: 'Utility model patent', zh: '实用新型专利', fr: 'Brevet de modèle d’utilité', es: 'Patente de modelo de utilidad'},
    number: 'ZL 2020 2 3135860.6'
  },
  {
    image: '/assets/qualifications/mask-forming-system.jpg',
    title: {
      en: 'Facial-mask forming tray and mask machine',
      zh: '一种面膜成型托盘及面膜机',
      fr: 'Plateau de formage et machine pour masques visage',
      es: 'Bandeja de formado y máquina para mascarillas faciales'
    },
    kind: {en: 'Utility model patent', zh: '实用新型专利', fr: 'Brevet de modèle d’utilité', es: 'Patente de modelo de utilidad'},
    number: 'ZL 2022 2 0744405.6'
  },
  {
    image: '/assets/qualifications/collagen-eye-patch.jpg',
    title: {
      en: 'Fish-scale-pattern collagen eye patch (I)',
      zh: '鱼鳞纹状胶原眼贴（一）',
      fr: 'Patch contour des yeux au collagène motif écailles (I)',
      es: 'Parche de ojos de colágeno con patrón de escamas (I)'
    },
    kind: {en: 'Design patent', zh: '外观设计专利', fr: 'Brevet de dessin', es: 'Patente de diseño'},
    number: 'ZL 2020 3 0469320.8'
  },
  {
    image: '/assets/qualifications/hydrogel-coating-certificate.jpg',
    title: {
      en: 'Coating device for gel cosmetics',
      zh: '一种凝胶类化妆品的涂布装置',
      fr: 'Dispositif d’enduction pour cosmétiques en gel',
      es: 'Dispositivo de recubrimiento para cosméticos en gel'
    },
    kind: {en: 'Utility model patent', zh: '实用新型专利', fr: 'Brevet de modèle d’utilité', es: 'Patente de modelo de utilidad'},
    number: 'ZL 2022 2 1704757.5'
  }
] as const;

const documentSectionCopy: Record<Locale, {eyebrow: string; title: string; holder: string; note: string}> = {
  en: {
    eyebrow: 'PATENT CERTIFICATES',
    title: 'Selected patents in hydrogel production and mask design.',
    holder: 'Rightsholder shown on document: Guangzhou Pinjue Biotechnology Co., Ltd.',
    note: 'The certificate image is shown so the title, patent number and rightsholder can be read from the source.'
  },
  zh: {
    eyebrow: '专利证书',
    title: '凝胶生产与面膜设计相关的部分专利。',
    holder: '证书记载专利权人：广州品爵生物科技有限公司',
    note: '页面保留证书原图，名称、专利号与权利人均可直接对照原件。'
  },
  fr: {
    eyebrow: 'CERTIFICATS DE BREVETS',
    title: 'Une sélection de brevets en production d’hydrogel et design de masques.',
    holder: 'Titulaire indiqué : Guangzhou Pinjue Biotechnology Co., Ltd.',
    note: 'L’image du certificat permet de lire directement le titre, le numéro et le titulaire.'
  },
  es: {
    eyebrow: 'CERTIFICADOS DE PATENTES',
    title: 'Una selección de patentes de producción de hidrogel y diseño de mascarillas.',
    holder: 'Titular indicado: Guangzhou Pinjue Biotechnology Co., Ltd.',
    note: 'La imagen permite comprobar directamente el título, el número y el titular.'
  }
};

export async function generateMetadata({params}: PageParams): Promise<Metadata> {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.patents;
  return {
    title: companyText(locale, copy.seoTitle),
    description: companyText(locale, copy.seoDescription),
    alternates: {canonical: `/${locale}/patents/`, languages: companyPageAlternates('patents')}
  };
}

export default async function PatentsPage({params}: PageParams) {
  const {locale: candidate} = await params;
  const locale: Locale = isLocale(candidate) ? candidate : defaultLocale;
  const copy = companyPageCopy.patents;
  const t = (value: Parameters<typeof companyText>[1]) => companyText(locale, value);

  return (
    <main className="page-main">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section">
        <SectionTitle eyebrow={documentSectionCopy[locale].eyebrow} title={documentSectionCopy[locale].title} />
        <div className="patent-document-grid">
          {patentDocuments.map((document) => (
            <article className="patent-document" key={document.number}>
              <figure>
                <Image src={document.image} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" alt={`${document.kind[locale]} — ${document.title[locale]}`} />
              </figure>
              <div>
                <span>{document.kind[locale]} · {document.number}</span>
                <h2>{document.title[locale]}</h2>
                <p>{documentSectionCopy[locale].holder}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="patent-document-note">{documentSectionCopy[locale].note}</p>
      </section>

      <section className="section">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.areasTitle)} />
        <div className="principle-grid">
          {copy.areas.map((area, index) => <article key={t(area.title)}><span>0{index + 1}</span><h3>{t(area.title)}</h3><p>{t(area.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--dark">
        <SectionTitle dark eyebrow={t(copy.intro.eyebrow)} title={t(copy.reviewTitle)} />
        <div className="stage-rail">
          {copy.review.map((item, index) => <article key={t(item.title)}><span>0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>)}
        </div>
      </section>

      <section className="section section--paper">
        <SectionTitle eyebrow={t(copy.intro.eyebrow)} title={t(copy.publicationTitle)} />
        <div className="check-grid">
          {copy.publication.map((item, index) => <article key={t(item.title)}><span>0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>)}
        </div>
      </section>

      <ActionBand
        locale={locale}
        eyebrow={t(copy.action.eyebrow)}
        title={t(copy.action.title)}
        body={t(copy.action.body)}
        primaryPath="contact"
        primaryLabel={t(copy.action.primary)}
        secondaryPath="products"
        secondaryLabel={t(copy.action.secondary)}
      />
    </main>
  );
}
