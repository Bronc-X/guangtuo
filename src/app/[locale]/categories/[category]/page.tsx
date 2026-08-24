import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ProductCard} from '@/components/product-card';
import {ActionBand, PageIntro, SectionTitle} from '@/components/site-section-kit';
import {categories, getCategory, products, type ProductCategory} from '@/data/catalog';
import {isLocale, localizedPath, locales, type Locale} from '@/lib/routing';

type GuideCopy = {intro: string; guideEyebrow: string; guideTitle: string; rows: Array<[string, string]>};

const categoryCopy = {
  en: {
    'face-masks': {
      intro: 'Finished face and cream mask concepts across collagen, soothing, brightening and cooling-led directions.',
      guideEyebrow: 'CHOOSING A FACE MASK',
      guideTitle: 'Compare the finish, feel and care direction.',
      rows: [
        ['Care options', 'Face and cream masks for collagen, soothing, brightening and cooling care.'],
        ['Product differences', 'Net weight, ingredients and mask format vary by product.'],
        ['Try a sample', 'Feel the texture, check the fit and see the finish on skin.']
      ]
    },
    'eye-masks': {
      intro: 'Finished eye-mask concepts spanning moisturizing, soothing, peptide-led and cooling directions.',
      guideEyebrow: 'CHOOSING AN EYE MASK',
      guideTitle: 'Colour, ingredients and pack format all shape the experience.',
      rows: [
        ['Care options', 'Hydrogel eye masks for hydration, soothing, firming and brightening.'],
        ['Product differences', 'Ingredients, gel colour, net weight and pack format vary by product.'],
        ['Try a sample', 'See the colour, shape and feel before choosing your product.']
      ]
    },
    'neck-masks': {
      intro: 'A cooling microporous collagen neck mask for firmer, smoother-looking neck care.',
      guideEyebrow: 'CHOOSING A NECK MASK',
      guideTitle: 'Comfort and coverage matter most.',
      rows: [
        ['Care option', 'A cooling microporous format with collagen and peptides.'],
        ['Your version', 'Shape, fit, appearance and ingredient direction can be adapted.'],
        ['Try a sample', 'Check the fit and feel on the neck before ordering.']
      ]
    }
  },
  zh: {
    'face-masks': {
      intro: '涵盖胶原、舒缓、焕亮与冷感方向的面部及膏状面膜成品方案。',
      guideEyebrow: '挑选面部面膜',
      guideTitle: '重点比较外观、触感与护理方向。',
      rows: [
        ['护理选择', '涵盖胶原、舒缓、焕亮与冷感方向的面部和膏状面膜。'],
        ['产品差异', '不同产品的净含量、成分与面膜形态有所不同。'],
        ['试用样品', '亲自感受质地、贴合度和上脸效果。']
      ]
    },
    'eye-masks': {
      intro: '涵盖保湿、舒缓、多肽与冷感方向的成品眼膜方案。',
      guideEyebrow: '挑选眼膜',
      guideTitle: '颜色、成分与包装方式都会影响产品体验。',
      rows: [
        ['护理选择', '用于补水、舒缓、紧致与焕亮护理的水凝胶眼膜。'],
        ['产品差异', '不同产品的成分、凝胶颜色、净含量与包装形式有所不同。'],
        ['试用样品', '先看颜色、形状与触感，再选择适合品牌的款式。']
      ]
    },
    'neck-masks': {
      intro: '以微孔胶原颈膜为核心，面向紧致与平滑型颈部护理需求。',
      guideEyebrow: '挑选颈膜',
      guideTitle: '舒适度与覆盖范围最值得关注。',
      rows: [
        ['护理选择', '结合胶原蛋白与多肽方向的微孔冷感颈膜。'],
        ['定制空间', '形状、贴合度、外观与成分方向均可沟通。'],
        ['试用样品', '下单前亲自确认颈部贴合度与触感。']
      ]
    }
  },
  fr: {
    'face-masks': {
      intro: 'Des concepts finis de masques visage et crème orientés collagène, apaisement, éclat ou sensation de fraîcheur.',
      guideEyebrow: 'CHOISIR UN MASQUE VISAGE',
      guideTitle: 'Comparez la finition, le toucher et le soin recherché.',
      rows: [
        ['Options de soin', 'Masques visage ou crème axés sur le collagène, l’apaisement, l’éclat ou la fraîcheur.'],
        ['Ce qui varie', 'Le poids net, la direction des ingrédients et le format diffèrent selon le produit.'],
        ['Essayer un échantillon', 'Découvrez la texture, l’ajustement et le rendu sur la peau.']
      ]
    },
    'eye-masks': {
      intro: 'Des concepts finis pour les yeux, orientés hydratation, apaisement, peptides ou sensation de fraîcheur.',
      guideEyebrow: 'CHOISIR DES PATCHS YEUX',
      guideTitle: 'Couleur, ingrédients et emballage façonnent l’expérience.',
      rows: [
        ['Options de soin', 'Hydratation, apaisement, fermeté ou éclat pour le contour des yeux.'],
        ['Ce qui varie', 'La direction des ingrédients, l’aspect du gel, le poids net et le format diffèrent selon le produit.'],
        ['Essayer un échantillon', 'Voyez la couleur, la forme et le toucher avant de choisir.']
      ]
    },
    'neck-masks': {
      intro: 'Un masque cou microporeux et frais au collagène pour un soin lissant et raffermissant.',
      guideEyebrow: 'CHOISIR UN MASQUE COU',
      guideTitle: 'Le confort et la couverture passent en premier.',
      rows: [
        ['Option de soin', 'Un format microporeux rafraîchissant au collagène et aux peptides.'],
        ['Ce qui varie', 'La forme, l’ajustement, l’apparence et les ingrédients peuvent être adaptés à votre marque.'],
        ['Essayer un échantillon', 'Vérifiez l’ajustement et le toucher sur le cou avant de commander.']
      ]
    }
  },
  es: {
    'face-masks': {
      intro: 'Conceptos terminados de mascarillas faciales y en crema centrados en colágeno, efecto calmante, luminosidad o sensación refrescante.',
      guideEyebrow: 'ELEGIR UNA MASCARILLA FACIAL',
      guideTitle: 'Compara el acabado, el tacto y el cuidado que buscas.',
      rows: [
        ['Opciones de cuidado', 'Mascarillas faciales y en crema con colágeno, calma, luminosidad o frescor.'],
        ['Qué cambia', 'El peso neto, la dirección de ingredientes y el formato varían según el producto.'],
        ['Prueba una muestra', 'Comprueba textura, ajuste y acabado sobre la piel.']
      ]
    },
    'eye-masks': {
      intro: 'Conceptos terminados para ojos centrados en hidratación, efecto calmante, péptidos o sensación refrescante.',
      guideEyebrow: 'ELEGIR PARCHES PARA OJOS',
      guideTitle: 'Color, ingredientes y envase crean la experiencia.',
      rows: [
        ['Opciones de cuidado', 'Hidratación, calma, firmeza o luminosidad para el contorno de ojos.'],
        ['Qué cambia', 'La dirección de ingredientes, el aspecto del gel, el peso neto y el formato varían según el producto.'],
        ['Prueba una muestra', 'Comprueba color, forma y tacto antes de elegir.']
      ]
    },
    'neck-masks': {
      intro: 'Una mascarilla de cuello microporosa y refrescante con colágeno para un cuidado alisador y reafirmante.',
      guideEyebrow: 'ELEGIR UNA MASCARILLA DE CUELLO',
      guideTitle: 'La comodidad y la cobertura son lo primero.',
      rows: [
        ['Opción de cuidado', 'Un formato microporoso refrescante con colágeno y péptidos.'],
        ['Qué cambia', 'La forma, el ajuste, el aspecto y los ingredientes pueden adaptarse a su marca.'],
        ['Prueba una muestra', 'Comprueba el ajuste y el tacto en el cuello antes de pedir.']
      ]
    }
  }
} satisfies Record<Locale, Record<ProductCategory, GuideCopy>>;

const commonCopy = {
  en: {home: 'Home', products: 'Products', eyebrow: 'PRODUCT RANGE', all: 'All products', ctaEyebrow: 'REQUEST SAMPLES', ctaTitle: 'Want to feel the difference for yourself?', ctaBody: 'Choose one or more products and tell us the quantity and market you have in mind.', primary: 'Request samples', secondary: 'View all products'},
  zh: {home: '首页', products: '产品', eyebrow: '产品系列', all: '全部产品', ctaEyebrow: '申请样品', ctaTitle: '想亲自感受产品差别？', ctaBody: '选择一款或多款产品，并告诉我们大致数量与目标市场。', primary: '申请样品', secondary: '查看全部产品'},
  fr: {home: 'Accueil', products: 'Produits', eyebrow: 'GAMME DE PRODUITS', all: 'Tous les produits', ctaEyebrow: 'DEMANDER DES ÉCHANTILLONS', ctaTitle: 'Envie de sentir la différence ?', ctaBody: 'Choisissez un ou plusieurs produits et indiquez la quantité et le marché envisagés.', primary: 'Demander des échantillons', secondary: 'Voir tous les produits'},
  es: {home: 'Inicio', products: 'Productos', eyebrow: 'GAMA DE PRODUCTOS', all: 'Todos los productos', ctaEyebrow: 'SOLICITAR MUESTRAS', ctaTitle: '¿Quieres sentir la diferencia?', ctaBody: 'Elige uno o varios productos e indica la cantidad y el mercado previstos.', primary: 'Solicitar muestras', secondary: 'Ver todos los productos'}
} satisfies Record<Locale, Record<string, string>>;

export function generateStaticParams() {
  return locales.flatMap((locale) => categories.map((category) => ({locale, category: category.slug})));
}

export default async function CategoryPage({params}: {params: Promise<{locale: string; category: string}>}) {
  const {locale: rawLocale, category: slug} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  const category = getCategory(slug);
  if (!category) notFound();
  const items = products.filter((product) => product.category === category.slug);
  const guide = categoryCopy[locale][category.slug];
  const t = commonCopy[locale];

  return (
    <main className="page-main">
      <div className="breadcrumbs"><Link href={localizedPath(locale)}>{t.home}</Link><span>/</span><Link href={localizedPath(locale, 'products')}>{t.products}</Link><span>/</span>{category.name[locale]}</div>
      <PageIntro eyebrow={t.eyebrow} title={category.name[locale]} body={guide.intro} meta={guide.rows.map(([label]) => label)} />
      <section className="section">
        <div className="filters">
          <Link className="filter-chip" href={localizedPath(locale, 'products')}>{t.all}</Link>
          {categories.map((item) => <Link className={item.slug === category.slug ? 'filter-chip filter-chip--active' : 'filter-chip'} key={item.slug} href={localizedPath(locale, `categories/${item.slug}`)}>{item.name[locale]}</Link>)}
        </div>
        <div className="product-grid">{items.map((product, index) => <ProductCard key={product.sku} product={product} locale={locale} eager={index === 0} />)}</div>
      </section>
      <section className="section section--paper category-guide">
        <SectionTitle eyebrow={guide.guideEyebrow} title={guide.guideTitle} />
        <div className="stage-rail stage-rail--light">{guide.rows.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>
      <ActionBand
        locale={locale}
        eyebrow={t.ctaEyebrow}
        title={t.ctaTitle}
        body={t.ctaBody}
        primaryPath="inquiry"
        primaryLabel={t.primary}
        secondaryPath="products"
        secondaryLabel={t.secondary}
      />
    </main>
  );
}
