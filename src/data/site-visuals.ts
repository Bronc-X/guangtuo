import type {LocalizedText, ProductCategory} from '@/data/catalog';

type CategoryVisual = {
  src: string;
  alt: LocalizedText;
  position?: string;
};

export const categoryVisuals: Record<ProductCategory, CategoryVisual> = {
  'face-masks': {
    src: '/assets/hydrogel/face-mask-reference.png',
    alt: {
      en: 'Hydrogel face-mask format reference',
      zh: '水凝胶面膜形态参考',
      fr: 'Référence de format de masque visage hydrogel',
      es: 'Referencia de formato de mascarilla facial de hidrogel'
    }
  },
  'eye-masks': {
    src: '/assets/hydrogel/eye-mask-hero.jpg',
    alt: {
      en: 'Gold and red hydrogel eye-mask format reference',
      zh: '金色与红色水凝胶眼膜形态参考',
      fr: 'Référence de patchs hydrogel dorés et rouges pour les yeux',
      es: 'Referencia de parches de hidrogel dorados y rojos para ojos'
    },
    position: '50% 38%'
  },
  'neck-masks': {
    src: '/assets/hydrogel/neck-mask-reference.png',
    alt: {
      en: 'Hydrogel neck-mask format reference',
      zh: '水凝胶颈膜形态参考',
      fr: 'Référence de format de masque hydrogel pour le cou',
      es: 'Referencia de formato de mascarilla de hidrogel para el cuello'
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
