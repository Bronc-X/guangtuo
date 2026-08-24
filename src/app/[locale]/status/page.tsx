import type {Metadata} from 'next';
import {JobStatusView} from '@/components/job-status';
import {isLocale, type Locale} from '@/lib/routing';

export const metadata: Metadata = {title: 'Enquiry status', robots: {index: false, follow: false}};

export default async function StatusPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return <main className="page-main"><section className="section status-section"><JobStatusView locale={locale} /></section></main>;
}
