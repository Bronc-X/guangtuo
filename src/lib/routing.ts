export const locales = ['en', 'zh', 'fr', 'es', 'ru', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = ''): string {
  if (path === 'contact') return `/${locale}/about/#contact`;
  const suffix = path ? `/${path.replace(/^\/+|\/+$/g, '')}` : '';
  return `/${locale}${suffix}/`;
}

export function replacePathLocale(path: string, locale: Locale, articleLocales?: Readonly<Record<string, readonly Locale[]>>): string {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] && isLocale(segments[0])) segments.shift();

  if (articleLocales && segments[0] === 'insights' && segments[1] && !articleLocales[segments[1]]?.includes(locale)) {
    const query = suffix.startsWith('?') ? suffix.split('#')[0] : '';
    return `${localizedPath(locale, 'insights')}${query}#translation-unavailable`;
  }

  return `${localizedPath(locale, segments.join('/'))}${suffix}`;
}
