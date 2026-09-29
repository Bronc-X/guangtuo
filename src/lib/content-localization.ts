import {locales, type Locale} from './routing';

// Only editorial text is translated. IDs, addresses, contacts and assets stay identical.
export const translatedFields = new Set([
  'heroTitle', 'heroBody', 'title', 'summary', 'body', 'category', 'name',
  'description', 'highlights', 'applications', 'netWeight', 'packFormat',
  'effects', 'specification', 'moq', 'packaging', 'kind', 'rightsholder',
  'profileTitle', 'profileBody', 'videoSourceLabel'
]);
export const targetLocales = locales.filter((locale): locale is Exclude<Locale, 'zh'> => locale !== 'zh');
export type ContentTranslations = Partial<Record<Locale, Record<string, string>>>;

export function mapEditorialText<T>(record: T, transform: (text: string) => string): T {
  if (!record || typeof record !== 'object') return record;
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key,
    translatedFields.has(key)
      ? typeof value === 'string' ? transform(value) : Array.isArray(value) ? value.map(item => typeof item === 'string' ? transform(item) : item) : value
      : value
  ])) as T;
}

export function contentStrings(snapshot: {home: unknown; articles: unknown[]; pageOverrides: unknown[]; productOverrides: unknown[]; formatOverrides: unknown[]; credentialOverrides: unknown[]}): string[] {
  const strings = new Set<string>();
  for (const record of [snapshot.home, ...snapshot.articles, ...snapshot.pageOverrides, ...snapshot.productOverrides, ...snapshot.formatOverrides, ...snapshot.credentialOverrides]) {
    mapEditorialText(record, text => {if (text.trim()) strings.add(text); return text;});
  }
  return [...strings];
}
