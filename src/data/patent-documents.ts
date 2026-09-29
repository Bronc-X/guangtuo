import {locales} from '@/lib/routing';
import type {LocalizedText} from '@/data/catalog';
import {getPublishedCredentialOverride, publishedContent} from '@/lib/published-content';

export type PatentDocument = {
  id: string;
  image: string;
  pdf?: string;
  title: LocalizedText;
  kind: LocalizedText;
  number: string;
  rightsholder: LocalizedText;
};

const text = (en: string, zh: string, fr: string, es: string, ru: string, ar: string): LocalizedText => ({en, zh, fr, es, ru, ar});
const pinjue = text(
  'Guangzhou Pinjue Biotechnology Co., Ltd.',
  '广州品爵生物科技有限公司',
  'Guangzhou Pinjue Biotechnology Co., Ltd.',
  'Guangzhou Pinjue Biotechnology Co., Ltd.',
  'Guangzhou Pinjue Biotechnology Co., Ltd.',
  'Guangzhou Pinjue Biotechnology Co., Ltd.'
);
const utilityPatent = text('Utility model patent', '实用新型专利', 'Brevet de modèle d’utilité', 'Patente de modelo d’utilidad', 'Патент на полезную модель', 'براءة نموذج منفعة');

const sourceDocuments: PatentDocument[] = [
  {
    id: 'hydrogel-production-system',
    image: '/assets/qualifications/hydrogel-production-system.jpg',
    title: text('Hydrogel cosmetics production system', '一种凝胶化妆品生产系统', 'Système de production de cosmétiques hydrogel', 'Sistema de producción de cosméticos de hidrogel', 'Система производства гидрогелевой косметики', 'نظام إنتاج مستحضرات تجميل الهيدروجيل'),
    kind: utilityPatent,
    number: 'ZL 2020 2 3135860.6',
    rightsholder: pinjue
  },
  {
    id: 'mask-forming-system',
    image: '/assets/qualifications/mask-forming-system.jpg',
    title: text('Facial-mask forming tray and mask machine', '一种面膜成型托盘及面膜机', 'Plateau de formage et machine pour masques visage', 'Bandeja de formado y máquina para mascarillas faciales', 'Формовочный лоток и машина для лицевых масок', 'صينية تشكيل وآلة لأقنعة الوجه'),
    kind: utilityPatent,
    number: 'ZL 2022 2 0744405.6',
    rightsholder: pinjue
  },
  {
    id: 'collagen-eye-patch-design',
    image: '/assets/qualifications/collagen-eye-patch.jpg',
    title: text('Fish-scale-pattern collagen eye patch (I)', '鱼鳞纹状胶原眼贴（一）', 'Patch contour des yeux au collagène motif écailles (I)', 'Parche de ojos de colágeno con patrón de escamas (I)', 'Коллагеновый патч для глаз с рисунком рыбьей чешуи (I)', 'لصقة عين بالكولاجين بنمط قشور السمك (I)'),
    kind: text('Design patent', '外观设计专利', 'Brevet de dessin', 'Patente de diseño', 'Патент на промышленный образец', 'براءة تصميم'),
    number: 'ZL 2020 3 0469320.8',
    rightsholder: pinjue
  },
  {
    id: 'hydrogel-coating-device',
    image: '/assets/qualifications/hydrogel-coating-certificate.jpg',
    title: text('Coating device for gel cosmetics', '一种凝胶类化妆品的涂布装置', 'Dispositif d’enduction pour cosmétiques en gel', 'Dispositivo de recubrimiento para cosméticos en gel', 'Устройство нанесения покрытия для гелевой косметики', 'جهاز طلاء لمستحضرات التجميل الهلامية'),
    kind: utilityPatent,
    number: 'ZL 2022 2 1704757.5',
    rightsholder: pinjue
  }
];

export const patentDocuments = sourceDocuments.map((document) => {
  const override = getPublishedCredentialOverride(document.id);
  if (!override) return document;
  const translated = (field: 'title' | 'kind' | 'rightsholder') => Object.fromEntries(locales.map(locale => [locale, locale === 'zh' || publishedContent.translations ? getPublishedCredentialOverride(document.id, publishedContent, locale)![field] : document[field][locale]])) as typeof document.title;
  return {
    ...document,
    image: override.image,
    pdf: override.pdf,
    title: translated('title'),
    kind: translated('kind'),
    number: override.number,
    rightsholder: translated('rightsholder')
  };
});
