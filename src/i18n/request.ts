import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {locales} from '@/lib/routing';

export default getRequestConfig(async ({requestLocale}) => {
  const candidate = await requestLocale;
  const locale = hasLocale(locales, candidate) ? candidate : 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
