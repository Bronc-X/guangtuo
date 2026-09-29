import type {LocalizedText, LegacyProductCategory} from '@/data/catalog';

type CategoryVisual = {
  src: string;
  alt: LocalizedText;
  position?: string;
};

export const categoryVisuals: Record<LegacyProductCategory, CategoryVisual> = {
  'face-masks': {
    src: '/assets/hydrogel/face-mask-reference-hd.webp',
    alt: {
      en: 'Hydrogel face-mask format reference',
      zh: '水凝胶面膜形态参考',
      fr: 'Référence de format de masque visage hydrogel',
      es: 'Referencia de formato de mascarilla facial de hidrogel',
      ru: 'Пример формата гидрогелевой маски для лица',
      ar: 'مرجع لتصميم قناع وجه من الهيدروجيل'
    }
  },
  'eye-masks': {
    src: '/assets/hydrogel/eye-mask-hero.jpg',
    alt: {
      en: 'Gold and red hydrogel eye-mask format reference',
      zh: '金色与红色水凝胶眼膜形态参考',
      fr: 'Référence de patchs hydrogel dorés et rouges pour les yeux',
      es: 'Referencia de parches de hidrogel dorados y rojos para ojos',
      ru: 'Пример золотых и красных гидрогелевых патчей для глаз',
      ar: 'مرجع للصقات عين هيدروجيل ذهبية وحمراء'
    },
    position: '50% 38%'
  },
  'specialty-patches': {
    src: '/assets/hydrogel/neck-mask-reference-hd.webp',
    alt: {
      en: 'Hydrogel specialty patch format for neck and jawline care',
      zh: '用于颈部与下颌护理的水凝胶局部膜贴参考',
      fr: 'Référence de patch hydrogel ciblé pour le cou et la mâchoire',
      es: 'Referencia de parche de hidrogel localizado para cuello y mandíbula',
      ru: 'Пример гидрогелевого патча для шеи и линии подбородка',
      ar: 'مرجع للصقات هيدروجيل موضعية للرقبة وخط الفك'
    }
  }
};

export const developmentVisuals = [
  '/assets/editorial/concept-development.png',
  '/assets/editorial/material-finish-study.png',
  '/assets/editorial/sample-review.png',
  '/assets/factory/production-line.png',
  '/assets/factory/quality-inspection.png',
  '/assets/factory/final-assembly.png'
] as const;
