import type {Metadata} from 'next';
import Image from 'next/image';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {companyPageAlternates, companyPageCopy, companyText} from '@/data/company-page-copy';
import {patentDocuments} from '@/data/patent-documents';
import {defaultLocale, isLocale, type Locale} from '@/lib/routing';

type PageParams = {params: Promise<{locale: string}>};

const documentSectionCopy: Record<Locale, {eyebrow: string; title: string; holderPrefix: string; note: string}> = {
  en: {
    eyebrow: 'PATENT CERTIFICATES',
    title: 'Selected patents in hydrogel production and mask design.',
    holderPrefix: 'Rightsholder shown on document: ',
    note: 'The certificate image is shown so the title, patent number and rightsholder can be read from the source.'
  },
  zh: {
    eyebrow: '专利原件',
    title: '专利名称、编号与权利人信息，均可对照证书核验。',
    holderPrefix: '证书记载专利权人：',
    note: '以下证书原图完整展示，方便在合作前直接核对关键信息。'
  },
  fr: {
    eyebrow: 'CERTIFICATS DE BREVETS',
    title: 'Une sélection de brevets en production d’hydrogel et design de masques.',
    holderPrefix: 'Titulaire indiqué : ',
    note: 'L’image du certificat permet de lire directement le titre, le numéro et le titulaire.'
  },
  es: {
    eyebrow: 'CERTIFICADOS DE PATENTES',
    title: 'Una selección de patentes de producción de hidrogel y diseño de mascarillas.',
    holderPrefix: 'Titular indicado: ',
    note: 'La imagen permite comprobar directamente el título, el número y el titular.'
  },
  ru: {
    eyebrow: 'ПАТЕНТНЫЕ СЕРТИФИКАТЫ', title: 'Избранные патенты в области производства гидрогеля и дизайна масок.', holderPrefix: 'Правообладатель, указанный в документе: ', note: 'Изображение сертификата позволяет проверить название, номер патента и правообладателя по оригиналу.'
  },
  ar: {
    eyebrow: 'شهادات براءات الاختراع', title: 'مجموعة مختارة من براءات إنتاج الهيدروجيل وتصميم الأقنعة.', holderPrefix: 'صاحب الحق الموضح في الوثيقة: ', note: 'تظهر صورة الشهادة لقراءة العنوان ورقم البراءة وصاحب الحق من المصدر.'
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
    <main className="page-main" data-cms="pages:patents">
      <PageIntro eyebrow={t(copy.intro.eyebrow)} title={t(copy.intro.title)} body={t(copy.intro.body)} meta={copy.intro.meta.map(t)} />

      <section className="section">
        <SectionTitle eyebrow={documentSectionCopy[locale].eyebrow} title={documentSectionCopy[locale].title} />
        <div className="patent-document-grid">
          {patentDocuments.map((document) => (
            <article data-cms={`credentials:${document.id}`} className="patent-document" key={document.number}>
              <figure>
                <Image src={document.image} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" alt={`${document.kind[locale]} — ${document.title[locale]}`} />
              </figure>
              <div>
                <span><i style={{fontStyle: 'normal'}} data-cms-field="kind">{document.kind[locale]}</i> · <i style={{fontStyle: 'normal'}} data-cms-field="number">{document.number}</i></span>
                <h2>{document.title[locale]}</h2>
                <p>{documentSectionCopy[locale].holderPrefix}<i style={{fontStyle: 'normal'}} data-cms-field="rightsholder">{document.rightsholder[locale]}</i></p>
                {document.pdf ? <a href={document.pdf} download>{({en: 'Download PDF', zh: '下载 PDF 原件', fr: 'Télécharger le PDF', es: 'Descargar PDF', ru: 'Скачать PDF', ar: 'تنزيل ملف PDF'})[locale]} ↓</a> : null}
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
