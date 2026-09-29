'use client';

import Link from 'next/link';
import {BrandLogo} from '@/components/brand-logo';
import {useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import {categories} from '@/data/catalog';
import {pageLabels} from '@/data/page-labels';
import {localeDirection, locales, localizedPath, replacePathLocale, type Locale} from '@/lib/routing';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية'
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
      {title: 'Browse finished products', body: 'Compare face, eye and targeted hydrogel formats.', path: 'products'},
      {title: 'Request samples', body: 'Choose the masks you would like to try.', path: 'inquiry#request=sample'},
      {title: 'Request a quote', body: 'Tell us the product, quantity and destination market.', path: 'inquiry'}
    ]
  },
  zh: {
    menu: '菜单', language: '语言', browse: '按产品系列浏览', close: '关闭',
    panelEyebrow: '欢迎联系修齐', panelTitle: '想为品牌找哪一款水凝膜？',
    options: [
      {title: '浏览水凝膜产品', body: '查看面膜、眼膜与其他局部膜贴的外观、成分和规格。', path: 'products'},
      {title: '申请产品样品', body: '亲自比较凝胶肤感、颜色与贴合度。', path: 'inquiry#request=sample'},
      {title: '获取产品报价', body: '提交感兴趣的产品、预计数量与目标市场。', path: 'inquiry'}
    ]
  },
  fr: {
    menu: 'Menu', language: 'Langue', browse: 'Par famille de produits', close: 'Fermer',
    panelEyebrow: 'ÉCHANGEONS', panelTitle: 'Comment pouvons-nous vous aider ?',
    options: [
      {title: 'Voir les produits finis', body: 'Comparez les formats visage, yeux et zones ciblées.', path: 'products'},
      {title: 'Demander des échantillons', body: 'Choisissez les masques que vous souhaitez essayer.', path: 'inquiry#request=sample'},
      {title: 'Demander un devis', body: 'Indiquez le produit, la quantité et le marché.', path: 'inquiry'}
    ]
  },
  es: {
    menu: 'Menú', language: 'Idioma', browse: 'Por familia de productos', close: 'Cerrar',
    panelEyebrow: 'HABLEMOS', panelTitle: '¿En qué podemos ayudarte?',
    options: [
      {title: 'Ver productos terminados', body: 'Compara formatos faciales, oculares y localizados.', path: 'products'},
      {title: 'Solicitar muestras', body: 'Elige las mascarillas que quieres probar.', path: 'inquiry#request=sample'},
      {title: 'Solicitar cotización', body: 'Indica producto, cantidad y mercado.', path: 'inquiry'}
    ]
  },
  ru: {
    menu: 'Меню', language: 'Язык', browse: 'По категории продукта', close: 'Закрыть',
    panelEyebrow: 'ОБСУДИМ', panelTitle: 'Чем мы можем вам помочь?',
    options: [
      {title: 'Смотреть готовые продукты', body: 'Сравните форматы для лица, глаз и локальных зон.', path: 'products'},
      {title: 'Запросить образцы', body: 'Выберите маски, которые хотите попробовать.', path: 'inquiry#request=sample'},
      {title: 'Запросить цену', body: 'Укажите продукт, количество и целевой рынок.', path: 'inquiry'}
    ]
  },
  ar: {
    menu: 'القائمة', language: 'اللغة', browse: 'تصفح حسب فئة المنتج', close: 'إغلاق',
    panelEyebrow: 'لنتحدث', panelTitle: 'كيف يمكننا مساعدتك؟',
    options: [
      {title: 'تصفح المنتجات الجاهزة', body: 'قارن تصاميم الوجه والعين والمناطق الموضعية.', path: 'products'},
      {title: 'طلب عينات', body: 'اختر الأقنعة التي ترغب في تجربتها.', path: 'inquiry#request=sample'},
      {title: 'طلب عرض سعر', body: 'أخبرنا بالمنتج والكمية والسوق المستهدف.', path: 'inquiry'}
    ]
  }
};

export function Header({locale, articleLocales = {}}: {locale: Locale; articleLocales?: Record<string, Locale[]>}) {
  const t = useTranslations('Nav');
  const copy = headerCopy[locale];
  const pathname = usePathname();
  const isHome = pathname.replace(/\/+$/, '') === `/${locale}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
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
    window.location.assign(replacePathLocale(currentPath, targetLocale, articleLocales));
  }

  function selectLanguage(targetLocale: Locale) {
    setLanguageOpen(false);
    setMenuOpen(false);
    switchLanguage(targetLocale);
  }

  return (
    <>
      <header className={isHome ? `site-header site-header--hero${isPinned ? ' site-header--pinned' : ''}` : 'site-header'}>
        <Link className="brand" href={localizedPath(locale)} aria-label={pageLabels[locale].home}>
          <BrandLogo />
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
        <Link className="header-cta" href={`${localizedPath(locale, 'inquiry')}#inquiry-form`} onClick={() => setMenuOpen(false)}>{t('start')}</Link>
      </header>
      <Link className="mobile-project-cta" href={`${localizedPath(locale, 'inquiry')}#inquiry-form`} onClick={() => setMenuOpen(false)}>{t('start')} <span>↗</span></Link>
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
