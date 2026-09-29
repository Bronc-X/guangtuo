import type {MetadataRoute} from 'next';
import {categories, products} from '@/data/catalog';
import {getArticleLocaleAvailability, listPublishedArticles} from '@/lib/published-content';
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
  const staticRoutes = ['', 'products', 'insights', 'customization', 'how-it-works', 'factory', 'patents', 'about'];
  return locales.flatMap((locale) => [
    ...staticRoutes.map((route) => ({url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: route ? 0.7 : 1, alternates: languageAlternates(route)})),
    ...categories.map((category) => {
      const route = `categories/${category.slug}`;
      return {url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: 0.7, alternates: languageAlternates(route)};
    }),
    ...products.map((product) => {
      const route = `products/${product.slug}`;
      return {url: absoluteUrl(locale, route), changeFrequency: 'monthly' as const, priority: 0.8, alternates: languageAlternates(route)};
    }),
    ...listPublishedArticles(locale).map((article) => {
      const route = `insights/${article.slug}`;
      return {
        url: absoluteUrl(locale, route),
        lastModified: new Date(article.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
        alternates: {languages: Object.fromEntries(getArticleLocaleAvailability()[article.slug].map(language => [language, absoluteUrl(language, route)]))}
      };
    })
  ]);
}
