import type {Metadata} from 'next';

import {UiConceptLab} from '@/components/ui-concept-lab';
import {isLocale, type Locale} from '@/lib/routing';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  return {
    title: locale === 'zh' ? '界面方案预览' : locale === 'ar' ? 'معاينة تصاميم الواجهة' : 'Interface Concepts',
    description: locale === 'zh' ? '比较包装顾问与 3D 工作台的界面方案。' : locale === 'ar' ? 'قارن تصاميم واجهة مستشار التغليف ومساحة العمل ثلاثية الأبعاد.' : 'Compare interface concepts for a packaging advisor and 3D workspace.',
    robots: {index: false, follow: false}
  };
}

export default async function UiLabPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';

  return <UiConceptLab locale={locale} />;
}
