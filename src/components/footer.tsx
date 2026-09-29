import Link from 'next/link';
import {BrandLogo} from '@/components/brand-logo';
import {categories} from '@/data/catalog';
import {locales, localizedPath, type Locale} from '@/lib/routing';

const localeLabels: Record<Locale, string> = {en: 'English', zh: '中文', fr: 'Français', es: 'Español', ru: 'Русский', ar: 'العربية'};

const footerCopy: Record<Locale, Record<string, string>> = {
  en: {
    eyebrow: 'CREATE YOUR NEXT PRODUCT', title: 'Tell us what you\nwant to launch.', body: 'Share the product, intended use, quantity and market. We will help you choose a useful first sample.', cta: 'Talk to the product team',
    products: 'Products', productCentre: 'Product centre', services: 'Services', customization: 'R&D & customisation', studio: '3D packaging studio', process: 'How it works', samples: 'Request samples', quote: 'Request a quote',
    company: 'Showki', factory: 'Manufacturing & quality', patents: 'Patents & innovation', insights: 'Insights', about: 'About us', contact: 'Contact',
    brand: 'Skincare, body care, makeup and hydrogel development, samples and production.', disclaimer: 'Final specifications and commercial terms are confirmed with your Showki advisor.', language: 'Languages'
  },
  zh: {
    eyebrow: '打造品牌护肤产品', title: '一起开发下一款好产品。', body: '带上感兴趣的产品、理想肤感、预计数量与目标市场，即可进一步沟通样品、报价和交期。', cta: '申请样品与报价',
    products: '产品', productCentre: '产品中心', services: '服务', customization: '研发与定制', studio: '3D 包装设计', process: '合作方式', samples: '申请样品', quote: '获取报价',
    company: '修齐', factory: '制造与品控', patents: '专利与创新', insights: '文章与知识', about: '关于我们', contact: '联系我们',
    brand: '护肤、身体护理、底妆与水凝胶产品的开发、打样与生产。', disclaimer: '产品规格、样品、报价与交期，以修齐产品顾问确认结果为准。', language: '语言'
  },
  fr: {
    eyebrow: 'CRÉER VOTRE PROCHAIN PRODUIT', title: 'Parlez-nous de votre\nprochain lancement.', body: 'Précisez le produit, son usage, la quantité et le marché. Nous vous aiderons à choisir un premier échantillon utile.', cta: 'Parler à l’équipe produit',
    products: 'Produits', productCentre: 'Centre produits', services: 'Services', customization: 'R&D et personnalisation', studio: 'Studio d’emballage 3D', process: 'Notre façon de travailler', samples: 'Demander des échantillons', quote: 'Demander un devis',
    company: 'Showki', factory: 'Fabrication et qualité', patents: 'Brevets et innovation', insights: 'Conseils', about: 'À propos', contact: 'Contact',
    brand: 'Soins, maquillage et hydrogel : développement, échantillons et production.', disclaimer: 'Les spécifications et conditions commerciales finales sont confirmées avec votre conseiller Showki.', language: 'Langues'
  },
  es: {
    eyebrow: 'CREAR SU PRÓXIMO PRODUCTO', title: 'Cuéntanos qué\nquieres lanzar.', body: 'Comparte el producto, el uso previsto, la cantidad y el mercado. Te ayudaremos a elegir una primera muestra útil.', cta: 'Hablar con el equipo de producto',
    products: 'Productos', productCentre: 'Centro de productos', services: 'Servicios', customization: 'I+D y personalización', studio: 'Estudio de envases 3D', process: 'Cómo trabajamos', samples: 'Solicitar muestras', quote: 'Solicitar cotización',
    company: 'Showki', factory: 'Fabricación y calidad', patents: 'Patentes e innovación', insights: 'Artículos', about: 'Nosotros', contact: 'Contacto',
    brand: 'Cuidado facial, corporal, maquillaje e hidrogel: desarrollo y producción.', disclaimer: 'Las especificaciones y condiciones comerciales finales se confirman con tu asesor de Showki.', language: 'Idiomas'
  },
  ru: {
    eyebrow: 'СОЗДАЙТЕ НОВЫЙ ПРОДУКТ', title: 'Расскажите, что вы\nпланируете выпустить.', body: 'Укажите продукт, назначение, количество и рынок. Мы поможем выбрать полезный первый образец.', cta: 'Связаться с продуктовой командой',
    products: 'Продукция', productCentre: 'Каталог продукции', services: 'Услуги', customization: 'Разработка и кастомизация', studio: 'Студия 3D-упаковки', process: 'Как мы работаем', samples: 'Запросить образцы', quote: 'Запросить цену',
    company: 'Showki', factory: 'Производство и качество', patents: 'Патенты и инновации', insights: 'Статьи', about: 'О компании', contact: 'Контакты',
    brand: 'Косметика, уход за телом, макияж и гидрогель: разработка и производство.', disclaimer: 'Окончательные характеристики и коммерческие условия согласовываются с консультантом Showki.', language: 'Языки'
  },
  ar: {
    eyebrow: 'طوّر منتجك القادم', title: 'أخبرنا بما\nتريد إطلاقه.', body: 'شارك المنتج والاستخدام والكمية والسوق المستهدف. سنساعدك على اختيار عينة أولى مناسبة.', cta: 'تحدث مع فريق المنتجات',
    products: 'المنتجات', productCentre: 'مركز المنتجات', services: 'الخدمات', customization: 'البحث والتطوير والتخصيص', studio: 'استوديو التغليف ثلاثي الأبعاد', process: 'آلية العمل', samples: 'طلب عينات', quote: 'طلب عرض سعر',
    company: 'Showki', factory: 'التصنيع والجودة', patents: 'براءات الاختراع والابتكار', insights: 'المقالات', about: 'من نحن', contact: 'تواصل معنا',
    brand: 'تطوير وإنتاج منتجات العناية بالبشرة والجسم والمكياج والهيدروجيل.', disclaimer: 'تُعتمد المواصفات النهائية والشروط التجارية مع مستشار Showki.', language: 'اللغات'
  }
};

export function Footer({locale}: {locale: Locale}) {
  const copy = footerCopy[locale];
  const groups = [
    {
      title: copy.products,
      links: [
        {label: copy.productCentre, path: 'products'},
        ...categories.map((category) => ({label: category.name[locale], path: `categories/${category.slug}`}))
      ]
    },
    {
      title: copy.services,
      links: [
        {label: copy.customization, path: 'customization'},
        {label: copy.studio, path: 'studio'},
        {label: copy.process, path: 'how-it-works'},
        {label: copy.samples, path: 'inquiry#request=sample'},
        {label: copy.quote, path: 'inquiry'}
      ]
    },
    {
      title: copy.company,
      links: [
        {label: copy.factory, path: 'factory'},
        {label: copy.patents, path: 'patents'},
        {label: copy.insights, path: 'insights'},
        {label: copy.about, path: 'about'}
      ]
    }
  ];

  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <section className="footer-cta">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <Link className="button button--primary" href={localizedPath(locale, 'recommend')}>{copy.cta}</Link>
        </section>
        <div className="footer-sitemap">
          <div className="footer-brand">
            <BrandLogo />
            <p>{copy.brand}</p>
          </div>
          {groups.map((group) => (
            <div className="footer-group" key={group.title}>
              <h3>{group.title}</h3>
              <ul>{group.links.map(({label, path}) => {
                const [route, hash] = path.split('#');
                return <li key={path}><Link href={`${localizedPath(locale, route)}${hash ? `#${hash}` : ''}`}>{label}</Link></li>;
              })}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} SHOWKI BIOTECH</p>
          <p>{copy.disclaimer}</p>
          <nav aria-label={copy.language}>{locales.map((targetLocale) => <Link key={targetLocale} href={localizedPath(targetLocale)}>{localeLabels[targetLocale]}</Link>)}</nav>
        </div>
      </div>
    </footer>
  );
}
