import type {Metadata} from 'next';
import {JobStatusView} from '@/components/job-status';
import {isLocale, type Locale} from '@/lib/routing';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {
    title: locale === 'zh' ? '产品需求提交结果' : locale === 'ar' ? 'حالة استفسار المنتج' : 'Enquiry status',
    description: locale === 'zh' ? '查看水凝膜产品需求的提交结果，并继续浏览产品或联系修齐。' : locale === 'ar' ? 'اعرض نتيجة استفسارك عن منتجات Showki وتابع تصفح المنتجات أو تواصل مع الفريق.' : 'View the result of your Showki product enquiry.',
    robots: {index: false, follow: false}
  };
}

export default async function StatusPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return <main className="page-main"><section className="section status-section"><JobStatusView locale={locale} /></section></main>;
}
