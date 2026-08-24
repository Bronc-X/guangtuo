import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {BackToTop} from '@/components/back-to-top';
import {Footer} from '@/components/footer';
import {Header} from '@/components/header';
import {MailAgentWidget} from '@/components/mail-agent-widget';
import {isLocale, locales} from '@/lib/routing';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale: candidate} = await params;
  if (!isLocale(candidate)) notFound();
  const locale = candidate;
  setRequestLocale(locale);
  const messages = await getMessages({locale});

  return (
    <>
      <script dangerouslySetInnerHTML={{__html: `document.documentElement.lang=${JSON.stringify(locale)};`}} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Header locale={locale} />
        {children}
        <Footer locale={locale} />
        <BackToTop locale={locale} />
        <MailAgentWidget locale={locale} />
      </NextIntlClientProvider>
    </>
  );
}
