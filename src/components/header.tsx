'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import {categories} from '@/data/catalog';
import {locales, localizedPath, replacePathLocale, type Locale} from '@/lib/routing';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  fr: 'Français',
  es: 'Español'
};

const headerCopy: Record<Locale, {
  menu: string;
  language: string;
  browse: string;
  close: string;
  panelEyebrow: string;
  panelTitle: string;
  options: Array<{title: string; body: string; path: string}>;
}> = {
  en: {
    menu: 'Menu', language: 'Language', browse: 'Browse by product family', close: 'Close',
    panelEyebrow: 'LET’S TALK', panelTitle: 'What can we help you with?',
    options: [
      {title: 'Browse finished products', body: 'Compare face, eye and neck mask formats.', path: 'products'},
      {title: 'Request samples', body: 'Choose the masks you would like to try.', path: 'inquiry#request=sample'},
      {title: 'Request a quote', body: 'Tell us the product, quantity and destination market.', path: 'inquiry'}
    ]
  },
  zh: {
    menu: '菜单', language: '语言', browse: '按产品系列浏览', close: '关闭',
    panelEyebrow: '欢迎联系', panelTitle: '这次想先了解什么？',
    options: [
      {title: '浏览成品目录', body: '比较面部、眼部与颈部面膜形态。', path: 'products'},
      {title: '申请样品', body: '选择想亲自试用的面膜产品。', path: 'inquiry#request=sample'},
      {title: '获取报价', body: '告诉我们产品、数量与目标市场。', path: 'inquiry'}
    ]
  },
  fr: {
    menu: 'Menu', language: 'Langue', browse: 'Par famille de produits', close: 'Fermer',
    panelEyebrow: 'ÉCHANGEONS', panelTitle: 'Comment pouvons-nous vous aider ?',
    options: [
      {title: 'Voir les produits finis', body: 'Comparez les masques visage, yeux et cou.', path: 'products'},
      {title: 'Demander des échantillons', body: 'Choisissez les masques que vous souhaitez essayer.', path: 'inquiry#request=sample'},
      {title: 'Demander un devis', body: 'Indiquez le produit, la quantité et le marché.', path: 'inquiry'}
    ]
  },
  es: {
    menu: 'Menú', language: 'Idioma', browse: 'Por familia de productos', close: 'Cerrar',
    panelEyebrow: 'HABLEMOS', panelTitle: '¿En qué podemos ayudarte?',
    options: [
      {title: 'Ver productos terminados', body: 'Compara mascarillas faciales, de ojos y de cuello.', path: 'products'},
      {title: 'Solicitar muestras', body: 'Elige las mascarillas que quieres probar.', path: 'inquiry#request=sample'},
      {title: 'Solicitar cotización', body: 'Indica producto, cantidad y mercado.', path: 'inquiry'}
    ]
  }
};

function projectPath(locale: Locale, path: string) {
  const [route, hash] = path.split('#');
  return `${localizedPath(locale, route)}${hash ? `#${hash}` : ''}`;
}

export function Header({locale}: {locale: Locale}) {
  const t = useTranslations('Nav');
  const copy = headerCopy[locale];
  const pathname = usePathname();
  const isHome = pathname.replace(/\/+$/, '') === `/${locale}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!isHome) return;
    const updatePinnedState = () => setIsPinned(window.scrollY > 24);
    const frame = window.requestAnimationFrame(updatePinnedState);
    window.addEventListener('scroll', updatePinnedState, {passive: true});
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePinnedState);
    };
  }, [isHome]);

  function switchLanguage(targetLocale: Locale) {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(replacePathLocale(currentPath, targetLocale));
  }

  function selectLanguage(targetLocale: Locale) {
    setLanguageOpen(false);
    setMenuOpen(false);
    switchLanguage(targetLocale);
  }

  return (
    <>
      <header className={isHome ? `site-header site-header--hero${isPinned ? ' site-header--pinned' : ''}` : 'site-header'}>
        <Link className="brand" href={localizedPath(locale)} aria-label="Guangtuo Bio home">
          <span className="brand__identity"><b>GUANGTUO</b><small>{locale === 'zh' ? '广拓生物' : 'GUANGTUO BIO'}</small></span>
        </Link>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => {
          setMenuOpen((value) => !value);
          setLanguageOpen(false);
        }}>
          <span /><span /><span /><span className="sr-only">{copy.menu}</span>
        </button>
        <nav id="site-nav" className={menuOpen ? 'site-nav site-nav--open' : 'site-nav'} aria-label={copy.menu}>
          <div className="nav-products">
            <Link href={localizedPath(locale, 'products')} onClick={() => setMenuOpen(false)}>
              {t('products')}<NavChevron />
            </Link>
            <div className="nav-products__panel">
              <p>{copy.browse}</p>
              {categories.map((category) => <Link key={category.slug} href={localizedPath(locale, `categories/${category.slug}`)} onClick={() => setMenuOpen(false)}>{category.name[locale]}<span>↗</span></Link>)}
            </div>
          </div>
          <Link href={localizedPath(locale, 'customization')} onClick={() => setMenuOpen(false)}>{t('capabilities')}</Link>
          <Link href={localizedPath(locale, 'studio')} onClick={() => setMenuOpen(false)}>{t('studio')}</Link>
          <Link href={localizedPath(locale, 'factory')} onClick={() => setMenuOpen(false)}>{t('factory')}</Link>
          <Link href={localizedPath(locale, 'patents')} onClick={() => setMenuOpen(false)}>{t('patents')}</Link>
          <Link href={localizedPath(locale, 'about')} onClick={() => setMenuOpen(false)}>{t('about')}</Link>
          <Link href={localizedPath(locale, 'contact')} onClick={() => setMenuOpen(false)}>{t('contact')}</Link>
          <div
            className={languageOpen ? 'nav-language nav-language--open' : 'nav-language'}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setLanguageOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              setLanguageOpen(false);
              event.currentTarget.querySelector<HTMLButtonElement>('.nav-language__trigger')?.focus();
            }}
          >
            <button
              className="nav-language__trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label={`${copy.language}: ${localeLabels[locale]}`}
              onClick={(event) => {
                const nextOpen = !languageOpen;
                setLanguageOpen(nextOpen);
                if (!nextOpen) event.currentTarget.blur();
              }}
            >
              {localeLabels[locale]}<NavChevron />
            </button>
            <div className="nav-language__panel" role="menu" aria-label={copy.language}>
              {locales.map((targetLocale) => (
                <button
                  key={targetLocale}
                  type="button"
                  role="menuitemradio"
                  aria-checked={targetLocale === locale}
                  onClick={() => selectLanguage(targetLocale)}
                >
                  <span>{localeLabels[targetLocale]}</span>
                  <span className="nav-language__status" aria-hidden="true">{targetLocale === locale ? '●' : '↗'}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
        <button className="header-cta" type="button" onClick={() => setStartOpen(true)}>{t('start')}</button>
      </header>
      <button className="mobile-project-cta" type="button" onClick={() => setStartOpen(true)}>{t('start')} <span>↗</span></button>
      {startOpen && <StartPanel locale={locale} onClose={() => setStartOpen(false)} />}
    </>
  );
}

function NavChevron() {
  return (
    <svg className="nav-chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function StartPanel({locale, onClose}: {locale: Locale; onClose: () => void}) {
  const copy = headerCopy[locale];
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="start-panel" role="dialog" aria-modal="true" aria-labelledby="start-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label={copy.close}>×</button>
        <p className="eyebrow">{copy.panelEyebrow}</p>
        <h2 id="start-title">{copy.panelTitle}</h2>
        <div className="start-panel__options">
          {copy.options.map((option, index) => (
            <Link href={projectPath(locale, option.path)} onClick={onClose} key={option.path}>
              <span>0{index + 1}</span><b>{option.title}</b><small>{option.body}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
