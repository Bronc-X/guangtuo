import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

import sitemap from '@/app/sitemap';
import {products} from '@/data/catalog';
import {getSiteCopy} from '@/data/site-copy';
import {locales} from '@/lib/routing';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('finished-product website repositioning', () => {
  it('provides complete homepage and hydrogel capability copy in all four locales', () => {
    for (const locale of locales) {
      const copy = getSiteCopy(locale) as
        | {heroTitle?: string; heroBody?: string; primary?: string; gelCapability?: {title?: string; body?: string}}
        | undefined;

      expect(copy, `${locale} homepage copy`).toBeDefined();
      expect(copy?.heroTitle?.trim()).toBeTruthy();
      expect(copy?.heroBody?.trim()).toBeTruthy();
      expect(copy?.primary?.trim()).toBeTruthy();
      expect(copy?.gelCapability?.title?.trim()).toBeTruthy();
      expect(copy?.gelCapability?.body?.trim()).toBeTruthy();
    }
  });

  it('keeps packaging concepts out of the main public product journey', () => {
    const publicJourney = [
      'src/app/[locale]/page.tsx',
      'src/app/[locale]/products/page.tsx',
      'src/app/[locale]/products/[sku]/page.tsx',
      'src/components/header.tsx',
      'src/components/footer.tsx',
      'src/components/product-card.tsx',
      'src/components/inquiry-form.tsx',
      'src/data/site-copy.ts'
    ]
      .map(source)
      .join('\n');

    for (const phrase of [
      'Skincare packaging',
      'Beauty packaging',
      'Airless bottles, droppers, cream jars',
      'Airless, dropper, jar',
      '真空瓶、滴管瓶、膏霜罐',
      '瓶型与容量'
    ]) {
      expect(publicJourney).not.toContain(phrase);
    }
  });

  it('uses source-backed product imagery and retains a deliberate fallback for future products', () => {
    const card = source('src/components/product-card.tsx');

    for (const product of products) {
      expect(product.media?.imageStatus, product.productId).toBe('available');
      expect(product.media?.image, product.productId).toBeTruthy();
      expect(existsSync(join(process.cwd(), 'public', product.media!.image!.replace(/^\//, ''))), product.productId).toBe(true);
    }
    expect(card).toContain("product.media?.imageStatus === 'available'");
    expect(card).toContain('product-media-placeholder');
    expect(card).not.toContain('src={product.poster}');
  });

  it('restores the homepage map, factory gallery and full 3D creation module', () => {
    const home = source('src/app/[locale]/page.tsx');

    expect(home).toContain('partnership-map');
    expect(home).toContain('factory-gallery');
    expect(home).toContain('<Sku3dStudio');
    expect(home).toContain('legacyPackagingProducts');
  });

  it('places the homepage header inside the hero, then pins it after scrolling', () => {
    const css = source('src/app/globals.css');
    const layout = source('src/app/[locale]/layout.tsx');
    const header = source('src/components/header.tsx');

    expect(css).toMatch(/\.site-header\s*\{[^}]*position:\s*relative/s);
    expect(css).toMatch(/\.site-header--hero\s*\{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.site-header--pinned\s*\{[^}]*position:\s*fixed/s);
    expect(header).toContain('site-header--hero');
    expect(header).toContain('site-header--pinned');
    expect(header).toContain('usePathname');
    expect(header).toContain("window.addEventListener('scroll'");
    expect(layout).toContain('<BackToTop');
    expect(source('src/components/back-to-top.tsx')).toContain('window.scrollTo');
    expect(css).toContain('.back-to-top');
    expect(css).toMatch(/\.back-to-top\s*\{[^}]*position:\s*fixed/s);
  });

  it('mounts an interactive finished-product mail advisor in all four locales', () => {
    const layout = source('src/app/[locale]/layout.tsx');
    const widget = source('src/components/mail-agent-widget.tsx');

    expect(layout).toContain('<MailAgentWidget');
    expect(widget).toContain("'use client'");
    expect(widget).toContain('mail-agent__launcher');
    expect(widget).toContain('mailAgentPresets');
    expect(widget).not.toMatch(/return\s+null/);
    for (const locale of locales) expect(widget).toContain(`${locale}:`);
  });

  it('treats 3D as optional and carries the exact SKU into the inquiry flow', () => {
    const detail = source('src/app/[locale]/products/[sku]/page.tsx');

    expect(detail).toContain('product.configurator3d');
    expect(detail).toMatch(/inquiry[^\n]+sku/i);
    expect(detail).not.toContain('<BottleConfigurator product={product}');
  });

  it('switches all four languages without dropping the current path', () => {
    const header = source('src/components/header.tsx');

    expect(header).toContain('replacePathLocale');
    expect(header).toContain('locales.map');
    expect(header).not.toContain("locale === 'en' ? 'zh' : 'en'");
  });

  it('uses spacious, consistent hover dropdowns for products and language', () => {
    const css = source('src/app/globals.css');
    const header = source('src/components/header.tsx');

    expect(css).toMatch(/\.site-nav\s*\{[^}]*gap:\s*clamp\(/s);
    expect(css).toMatch(/@media\s*\(min-width:\s*1240px\)\s*and\s*\(max-width:\s*1400px\)\s*\{[^}]*\.site-nav\s*\{[^}]*gap:\s*10px/s);
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.site-nav\s*\{[^}]*display:\s*none/);
    expect(css).toContain('.nav-products__panel::before, .nav-language__panel::before');
    expect(css).toContain('.nav-language:hover .nav-language__panel');
    expect(css).toContain('.nav-language:focus-within .nav-language__panel');
    expect(css).toContain('.nav-products:hover .nav-products__panel');
    expect(header).toContain('nav-language__panel');
    expect(header).toContain('nav-chevron');
    expect(header).toContain('role="menuitemradio"');
    expect(header).toContain('aria-expanded={languageOpen}');
    expect(header).not.toContain('<select');
  });

  it('uses controlled SKU selection and derives the product family from that SKU', () => {
    const inquiry = source('src/components/inquiry-form.tsx');

    expect(inquiry).toContain('selectedSku');
    expect(inquiry).toContain('setSelectedSku');
    expect(inquiry).toMatch(/selectedProduct[^\n]+category/);
    expect(inquiry).not.toMatch(/defaultValue=\{initial\.sku\}/);
  });

  it('publishes discovery pages but keeps private and experimental routes out of the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);

    for (const locale of locales) {
      expect(urls).toContain(`https://example.invalid/${locale}/patents/`);
      expect(urls.some((url) => url.includes(`/${locale}/products/GT-`))).toBe(false);
    }

    for (const route of ['/studio/', '/ui-lab/', '/inquiry/', '/recommend/', '/proposal/', '/status/']) {
      expect(urls.some((url) => url.includes(route))).toBe(false);
    }
  });

  it('uses the Radiant design system across the public journey without the clinical-ledger detour', () => {
    const css = source('src/app/globals.css');
    const publicPages = [
      'src/app/[locale]/page.tsx',
      'src/app/[locale]/products/page.tsx',
      'src/app/[locale]/products/[sku]/page.tsx',
      'src/app/[locale]/categories/[category]/page.tsx'
    ].map(source).join('\n');

    for (const token of ['--radiant-cream', '--radiant-pink', '--radiant-violet', '--radiant-ink']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('.radiant-frame');
    expect(css).toContain('.hero__image');
    expect(css).not.toContain('.specimen-ledger');
    expect(css).not.toContain('.hero--research-ledger');
    expect(publicPages).not.toContain('clinical-atelier');
    expect(publicPages).not.toContain('research-ledger');
    expect(css).toMatch(/@media\s*\(max-width:\s*760px\)/);
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion');
  });
});
