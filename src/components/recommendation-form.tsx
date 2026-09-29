import {InquiryForm} from './inquiry-form';
import type {Locale} from '@/lib/routing';
// Every entry point uses the same complete brief so no requirements are lost.
export function RecommendationForm({locale}: {locale: Locale}) {
  return <InquiryForm locale={locale} />;
}
