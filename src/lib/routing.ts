export const locales = ['en', 'zh', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = ''): string {
  const suffix = path ? `/${path.replace(/^\/+|\/+$/g, '')}` : '';
  return `/${locale}${suffix}/`;
}

export function replacePathLocale(path: string, locale: Locale): string {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] && isLocale(segments[0])) segments.shift();

  return `${localizedPath(locale, segments.join('/'))}${suffix}`;
}
