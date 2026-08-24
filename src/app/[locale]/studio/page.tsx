import type {Metadata} from 'next';

import {Sku3dStudio} from '@/components/sku-3d-studio';
import {legacyPackagingProducts} from '@/data/legacy-packaging-catalog';
import {isLocale, type Locale} from '@/lib/routing';

export const metadata: Metadata = {
  title: '3D Packaging Studio',
  description: 'Customise a packaging format or turn a new packaging idea into a visual concept and rotatable 3D preview.',
  robots: {index: false, follow: false}
};

export default async function StudioPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return <Sku3dStudio locale={locale} products={legacyPackagingProducts} />;
}
