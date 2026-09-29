import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {listPublishedArticles} from '@/lib/published-content';
import {isLocale, localizedPath, type Locale} from '@/lib/routing';
import {pageLabels} from '@/data/page-labels';

const pageCopy = {
  en: {title: 'Insights', description: 'Practical notes about hydrogel product selection, sampling and production.', eyebrow: 'SHOWKI INSIGHTS', hero: 'Notes from product selection to production.', body: 'Published guidance from the Showki team.', sectionEyebrow: 'LATEST NOTES', sectionTitle: 'Published in Chinese', empty: 'No articles are published in this language yet.', ctaEyebrow: 'START A CONVERSATION', ctaTitle: 'Have a product direction to discuss?', ctaBody: 'Share the care area, format and expected quantity to continue with a sample.', ctaPrimary: 'Request samples', ctaSecondary: 'Browse products'},
  zh: {title: '水凝膜知识', description: '了解水凝膜产品选择、样品确认、制造与品控等实用内容。', eyebrow: '修齐水凝膜知识', hero: '水凝膜怎么选，\n样品怎么确认？', body: '从膜型、凝胶肤感到生产细节，看看开发一款水凝膜前有哪些问题值得先确认。', sectionEyebrow: '最新文章', sectionTitle: '选产品、做样品、看生产，先从这些文章开始', empty: '暂时还没有文章。', ctaEyebrow: '开始沟通产品', ctaTitle: '已经有想进一步确认的产品方向？', ctaBody: '带上护理部位、参考膜型和预计数量，即可继续沟通样品与规格。', ctaPrimary: '申请产品样品', ctaSecondary: '浏览水凝膜产品'},
  fr: {title: 'Conseils', description: 'Notes pratiques sur le choix, les échantillons et la production hydrogel.', eyebrow: 'CONSEILS SHOWKI', hero: 'Du choix du format à la production.', body: 'Des notes publiées par l’équipe Showki.', sectionEyebrow: 'DERNIÈRES NOTES', sectionTitle: 'Articles publiés en chinois', empty: 'Aucun article publié dans cette langue.', ctaEyebrow: 'PARLONS PRODUIT', ctaTitle: 'Une direction à discuter ?', ctaBody: 'Partagez la zone, le format et la quantité pour préparer un échantillon.', ctaPrimary: 'Demander des échantillons', ctaSecondary: 'Voir les produits'},
  es: {title: 'Guías', description: 'Notas prácticas sobre selección, muestras y producción de hidrogel.', eyebrow: 'GUÍAS SHOWKI', hero: 'De la selección a la producción.', body: 'Notas publicadas por el equipo de Showki.', sectionEyebrow: 'ÚLTIMAS NOTAS', sectionTitle: 'Artículos publicados en chino', empty: 'Todavía no hay artículos en este idioma.', ctaEyebrow: 'HABLEMOS DEL PRODUCTO', ctaTitle: '¿Tienes una dirección para revisar?', ctaBody: 'Comparte zona, formato y cantidad para avanzar con una muestra.', ctaPrimary: 'Solicitar muestras', ctaSecondary: 'Ver productos'},
  ru: {title: 'Материалы', description: 'Практические заметки о выборе, образцах и производстве гидрогеля.', eyebrow: 'МАТЕРИАЛЫ SHOWKI', hero: 'От выбора формата до производства.', body: 'Опубликованные материалы команды Showki.', sectionEyebrow: 'НОВЫЕ МАТЕРИАЛЫ', sectionTitle: 'Статьи опубликованы на китайском языке', empty: 'На этом языке пока нет статей.', ctaEyebrow: 'ОБСУДИТЬ ПРОДУКТ', ctaTitle: 'Есть направление для обсуждения?', ctaBody: 'Укажите зону ухода, формат и количество, чтобы перейти к образцу.', ctaPrimary: 'Запросить образцы', ctaSecondary: 'Смотреть продукты'},
  ar: {title: 'المعرفة', description: 'ملاحظات عملية حول اختيار منتجات الهيدروجيل والعينات والإنتاج.', eyebrow: 'معرفة SHOWKI', hero: 'من اختيار التصميم إلى الإنتاج.', body: 'ملاحظات منشورة من فريق Showki.', sectionEyebrow: 'أحدث الملاحظات', sectionTitle: 'المقالات منشورة باللغة الصينية', empty: 'لا توجد مقالات منشورة بهذه اللغة بعد.', ctaEyebrow: 'ابدأ مناقشة المنتج', ctaTitle: 'هل لديك اتجاه ترغب في مناقشته؟', ctaBody: 'شارك منطقة العناية والتصميم والكمية للانتقال إلى العينة.', ctaPrimary: 'طلب عينات', ctaSecondary: 'تصفح المنتجات'}
} satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {title: pageCopy[locale].title, description: pageCopy[locale].description};
}

export default async function InsightsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const copy = pageCopy[locale];
  const articles = listPublishedArticles(locale);

  return (
    <main className="page-main">
      <PageIntro eyebrow={copy.eyebrow} title={copy.hero} body={copy.body} meta={articles.length ? [`${pageLabels[locale].articles}: ${new Intl.NumberFormat(locale).format(articles.length)}`] : undefined} />
      <section className="section section--paper">
        <p id="translation-unavailable" className="translation-notice" role="status">{pageLabels[locale].unavailable}</p>
        <SectionTitle eyebrow={copy.sectionEyebrow} title={pageLabels[locale].articles} />
        {articles.length ? (
          <div className="mode-grid">
            {articles.map((article, index) => (
              <Link data-cms={`articles:${article.slug}`} className="mode-card" href={localizedPath(locale, `insights/${article.slug}`)} key={article.id}>
                <div className="mode-card__visual"><Image src={article.cover} fill sizes="(max-width: 700px) 100vw, 33vw" alt={article.title} loading={index === 0 ? 'eager' : 'lazy'} /></div>
                <div className="mode-card__content"><span>{String(index + 1).padStart(2, '0')} · {article.category}</span><h3 data-cms-field="title">{article.title}</h3><p data-cms-field="summary">{article.summary}</p></div>
              </Link>
            ))}
          </div>
        ) : <div className="stage-rail stage-rail--light"><article><span>01</span><h3>{copy.empty}</h3></article></div>}
      </section>
      <ActionBand locale={locale} eyebrow={copy.ctaEyebrow} title={copy.ctaTitle} body={copy.ctaBody} primaryPath="inquiry" primaryLabel={copy.ctaPrimary} secondaryPath="products" secondaryLabel={copy.ctaSecondary} />
    </main>
  );
}
