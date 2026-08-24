import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getMessages} from 'next-intl/server';
import {describe, expect, it, vi} from 'vitest';

vi.mock('next-intl/server', () => ({
  getMessages: vi.fn(async () => ({
    Nav: {
      products: 'Products',
      how: 'How it works',
      capabilities: 'R&D & customisation',
      factory: 'Manufacturing & quality',
      patents: 'Patents & innovation',
      about: 'About',
      contact: 'Contact',
      start: 'Request samples / quote'
    }
  })),
  setRequestLocale: vi.fn()
}));

import LocaleLayout, {generateStaticParams} from '@/app/[locale]/layout';
import LanguageGateway from '@/app/page';
import {
  defaultLocale,
  isLocale,
  locales,
  localizedPath,
  replacePathLocale,
  type Locale
} from '@/lib/routing';

const navigationKeys = [
  'products',
  'how',
  'capabilities',
  'factory',
  'patents',
  'about',
  'contact',
  'start'
] as const;

describe('locale routing', () => {
  it('uses English as the first and default locale, followed by Chinese, French and Spanish', () => {
    expect(locales).toEqual(['en', 'zh', 'fr', 'es']);
    expect(defaultLocale).toBe('en');

    for (const locale of locales) expect(isLocale(locale)).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('builds canonical trailing-slash paths for every locale', () => {
    expect(localizedPath('en')).toBe('/en/');
    expect(localizedPath('zh', '/products/')).toBe('/zh/products/');
    expect(localizedPath('fr', 'products/GT-EM-001')).toBe('/fr/products/GT-EM-001/');
    expect(localizedPath('es', '')).toBe('/es/');
  });

  it('replaces only the locale segment while preserving the route, query and hash', () => {
    expect(replacePathLocale('/zh/products/GT-EM-001/?ref=nav#details', 'fr'))
      .toBe('/fr/products/GT-EM-001/?ref=nav#details');
    expect(replacePathLocale('/fr', 'en')).toBe('/en/');
    expect(replacePathLocale('/', 'es')).toBe('/es/');
    expect(replacePathLocale('/products?ref=nav', 'zh')).toBe('/zh/products/?ref=nav');
  });

  it('statically generates exactly one root route for each supported locale', () => {
    expect(generateStaticParams()).toEqual([
      {locale: 'en'},
      {locale: 'zh'},
      {locale: 'fr'},
      {locale: 'es'}
    ]);
  });

  it('rejects unsupported locale segments before rendering page chrome', async () => {
    await expect(LocaleLayout({
      children: createElement('main'),
      params: Promise.resolve({locale: 'de'})
    })).rejects.toMatchObject({digest: 'NEXT_HTTP_ERROR_FALLBACK;404'});
  });

  it('sets the document language before the localized page chrome', async () => {
    const layout = await LocaleLayout({
      children: createElement('main'),
      params: Promise.resolve({locale: 'fr'})
    });
    const fragment = layout as ReactElement<{
      children: ReactElement<{dangerouslySetInnerHTML: {__html: string}}> [];
    }>;
    const languageScript = fragment.props.children[0];

    expect(getMessages).toHaveBeenCalledWith({locale: 'fr'});
    expect(languageScript.type).toBe('script');
    expect(languageScript.props.dangerouslySetInnerHTML.__html)
      .toBe('document.documentElement.lang="fr";');
  });

  it('accepts the intentional pre-hydration html lang correction', () => {
    const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');

    expect(rootLayout).toContain('suppressHydrationWarning');
  });
});

describe('locale messages', () => {
  it('provides the complete base navigation in every supported language', () => {
    const dictionaries = Object.fromEntries(locales.map((locale) => {
      const json = readFileSync(`messages/${locale}.json`, 'utf8');
      return [locale, JSON.parse(json) as {Nav: Record<string, string>}];
    })) as Record<Locale, {Nav: Record<string, string>}>;

    const englishKeys = Object.keys(dictionaries.en.Nav).sort();

    for (const locale of locales) {
      expect(Object.keys(dictionaries[locale].Nav).sort()).toEqual(englishKeys);
      for (const key of navigationKeys) {
        expect(dictionaries[locale].Nav[key]?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('static default-locale gateway', () => {
  it('offers an accessible English fallback while redirecting the static root document', () => {
    const markup = renderToStaticMarkup(createElement(LanguageGateway));

    expect(markup).toContain('http-equiv="refresh"');
    expect(markup).toContain('content="0;url=/en/"');
    expect(markup).toContain('href="/en/"');
    expect(markup).toContain('<noscript>');
    expect(markup).toMatch(/English/i);
  });
});
