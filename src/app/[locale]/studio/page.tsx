import type {Metadata} from 'next';

import {Sku3dStudio} from '@/components/sku-3d-studio';
import {studioPackagingProducts} from '@/data/legacy-packaging-catalog';
import {isLocale, type Locale} from '@/lib/routing';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return {
    title: locale === 'zh' ? '3D 包装设计预览' : locale === 'ar' ? 'استوديو تصميم التغليف ثلاثي الأبعاد' : '3D Packaging Studio',
    description: locale === 'zh'
      ? '在线比较包装类型、颜色、材质与品牌呈现，并通过实物样品确认最终效果。'
      : locale === 'ar' ? 'قارن أنواع التغليف والألوان والمواد وهوية العلامة، واعرض فكرة جديدة في تصور مرئي ومعاينة ثلاثية الأبعاد قابلة للدوران.' : 'Customise a packaging format or turn a new packaging idea into a visual concept and rotatable 3D preview.',
    robots: {index: false, follow: false}
  };
}

export default async function StudioPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: rawLocale} = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'en';
  return <Sku3dStudio locale={locale} products={studioPackagingProducts} />;
}
