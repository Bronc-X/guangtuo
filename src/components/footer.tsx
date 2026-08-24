import Link from 'next/link';
import {categories} from '@/data/catalog';
import {locales, localizedPath, type Locale} from '@/lib/routing';

const localeLabels: Record<Locale, string> = {en: 'English', zh: '中文', fr: 'Français', es: 'Español'};

const footerCopy: Record<Locale, Record<string, string>> = {
  en: {
    eyebrow: 'CREATE YOUR NEXT MASK', title: 'Tell us what you\nwant to launch.', body: 'Share the product, intended use, quantity and market. We will help you choose a useful first sample.', cta: 'Talk to the product team',
    products: 'Products', productCentre: 'Product centre', services: 'Services', customization: 'R&D & customisation', studio: '3D packaging studio', process: 'How it works', samples: 'Request samples', quote: 'Request a quote',
    company: 'Guangtuo', factory: 'Manufacturing & quality', patents: 'Patents & innovation', about: 'About us', contact: 'Contact',
    brand: 'Hydrogel masks, custom development, samples and production support.', disclaimer: 'Final specifications and commercial terms are confirmed with your Guangtuo advisor.', language: 'Languages'
  },
  zh: {
    eyebrow: '打造下一款面膜', title: '欢迎分享\n您的新品计划。', body: '告诉我们产品、用途、数量与目标市场，我们会一起找到合适的首轮样品。', cta: '联系产品顾问',
    products: '产品', productCentre: '产品中心', services: '服务', customization: '研发与定制', studio: '3D 包装设计', process: '合作方式', samples: '申请样品', quote: '获取报价',
    company: '广拓', factory: '制造与品控', patents: '专利与创新', about: '关于我们', contact: '联系我们',
    brand: '水凝胶面膜、定制开发、样品与生产支持。', disclaimer: '最终规格与商务条件，请与广拓顾问确认。', language: '语言'
  },
  fr: {
    eyebrow: 'CRÉER VOTRE PROCHAIN MASQUE', title: 'Parlez-nous de votre\nprochain lancement.', body: 'Précisez le produit, son usage, la quantité et le marché. Nous vous aiderons à choisir un premier échantillon utile.', cta: 'Parler à l’équipe produit',
    products: 'Produits', productCentre: 'Centre produits', services: 'Services', customization: 'R&D et personnalisation', studio: 'Studio d’emballage 3D', process: 'Notre façon de travailler', samples: 'Demander des échantillons', quote: 'Demander un devis',
    company: 'Guangtuo', factory: 'Fabrication et qualité', patents: 'Brevets et innovation', about: 'À propos', contact: 'Contact',
    brand: 'Masques hydrogel, personnalisation, échantillons et production.', disclaimer: 'Les spécifications et conditions commerciales finales sont confirmées avec votre conseiller Guangtuo.', language: 'Langues'
  },
  es: {
    eyebrow: 'CREAR SU PRÓXIMA MASCARILLA', title: 'Cuéntanos qué\nquieres lanzar.', body: 'Comparte el producto, el uso previsto, la cantidad y el mercado. Te ayudaremos a elegir una primera muestra útil.', cta: 'Hablar con el equipo de producto',
    products: 'Productos', productCentre: 'Centro de productos', services: 'Servicios', customization: 'I+D y personalización', studio: 'Estudio de envases 3D', process: 'Cómo trabajamos', samples: 'Solicitar muestras', quote: 'Solicitar cotización',
    company: 'Guangtuo', factory: 'Fabricación y calidad', patents: 'Patentes e innovación', about: 'Nosotros', contact: 'Contacto',
    brand: 'Mascarillas de hidrogel, personalización, muestras y producción.', disclaimer: 'Las especificaciones y condiciones comerciales finales se confirman con tu asesor de Guangtuo.', language: 'Idiomas'
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
        {label: copy.about, path: 'about'},
        {label: copy.contact, path: 'contact'}
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
            <strong className="footer-wordmark">GUANGTUO</strong>
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
          <p>© {new Date().getFullYear()} GUANGTUO BIO</p>
          <p>{copy.disclaimer}</p>
          <nav aria-label={copy.language}>{locales.map((targetLocale) => <Link key={targetLocale} href={localizedPath(targetLocale)}>{localeLabels[targetLocale]}</Link>)}</nav>
        </div>
      </div>
    </footer>
  );
}
