import {ContactRedirect} from '@/components/contact-redirect';
import {defaultLocale, isLocale} from '@/lib/routing';
export const metadata = {robots: {index: false, follow: true}};
export default async function ContactPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return <ContactRedirect locale={isLocale(locale) ? locale : defaultLocale} />;
}
