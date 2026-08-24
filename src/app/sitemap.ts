import type {MetadataRoute} from 'next';
import {categories, products} from '@/data/catalog';
import {locales} from '@/lib/routing';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.invalid';
export const dynamic = 'force-static';

function absoluteUrl(locale: string, route = ''): string {
  return `${siteUrl}/${locale}/${route ? `${route.replace(/^\/+|\/+$/g, '')}/` : ''}`;
}

function languageAlternates(route = '') {
  return {
    languages: Object.fromEntries([
      ...locales.map((locale) => [locale, absoluteUrl(locale, route)]),
      ['x-default', absoluteUrl('en', route)]
    ])
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', 'products', 'customization', 'how-it-works', 'factory', 'patents', 'about', 'contact'];
  return locales.flatMap((locale) => [
    ...staticRoutes.map((route) => ({url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: route ? 0.7 : 1, alternates: languageAlternates(route)})),
    ...categories.map((category) => {
      const route = `categories/${category.slug}`;
      return {url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: 0.7, alternates: languageAlternates(route)};
    }),
    ...products.map((product) => {
      const route = `products/${product.slug}`;
      return {url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: 0.8, alternates: languageAlternates(route)};
    })
  ]);
}
