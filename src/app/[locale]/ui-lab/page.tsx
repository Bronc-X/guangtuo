import type {Metadata} from 'next';

import {UiConceptLab} from '@/components/ui-concept-lab';
import {isLocale, type Locale} from '@/lib/routing';

export const metadata: Metadata = {
  title: 'Interface Concepts',
  description: 'Internal interface concept lab.',
  robots: {index: false, follow: false}
};

export default async function UiLabPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';

  return <UiConceptLab locale={locale} />;
}
