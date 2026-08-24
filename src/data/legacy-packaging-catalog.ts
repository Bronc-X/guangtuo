import type {Locale} from '@/lib/routing';

export type PackagingLocalizedText = Record<Locale, string>;
export type PackagingOption = {id: string; label: PackagingLocalizedText; value?: string};
export type PackagingOptionGroup = {id: string; label: PackagingLocalizedText; options: PackagingOption[]};
export type PackagingShape = 'airless' | 'bottle' | 'jar' | 'full-mask' | 'split-mask';

export type PackagingConcept = {
  sku: string;
  slug: string;
  category: string;
  name: PackagingLocalizedText;
  eyebrow: PackagingLocalizedText;
  description: PackagingLocalizedText;
  color: string;
  poster: string;
  shape: PackagingShape;
  optionGroups: PackagingOptionGroup[];
  modelPath: string;
  modelPresentation: {
    scale: number;
    position: [number, number, number];
    groundOffset: number;
    logoAnchor: [number, number, number];
    logoSize: [number, number];
    logoStep: number;
  };
  modelBoundary: {geometryId: string; note: PackagingLocalizedText};
  logoUpload: {accept: ['image/png', 'image/jpeg', 'image/webp']; maxBytes: number};
};

const localized = (en: string, zh: string, fr = en, es = en): PackagingLocalizedText => ({en, zh, fr, es});
const option = (id: string, en: string, zh: string, value?: string): PackagingOption => ({
  id,
  label: localized(en, zh),
  ...(value ? {value} : {})
});
const group = (id: string, en: string, zh: string, options: PackagingOption[]): PackagingOptionGroup => ({
  id,
  label: localized(en, zh),
  options
});

const colours = group('color', 'Package colour', '包装颜色', [
  option('forest', 'Deep green', '深绿色', '#15362e'),
  option('ivory', 'Ivory', '象牙白', '#e9ddc9'),
  option('copper', 'Copper brown', '铜棕', '#a6532e'),
  option('graphite', 'Graphite', '石墨黑', '#252927')
]);
const finishes = group('finish', 'Finish', '表面效果', [
  option('satin', 'Satin', '缎面'),
  option('soft-touch', 'Soft touch', '柔触'),
  option('gloss', 'High gloss', '高光')
]);
const branding = group('branding', 'Logo decoration', 'Logo 工艺', [
  option('label', 'Applied label', '贴标'),
  option('screen', 'Screen print', '丝印'),
  option('foil', 'Foil detail', '烫印')
]);
const logoPosition = group('logo-position', 'Logo position', 'Logo 位置', [
  option('front-upper', 'Front · upper', '正面 · 上部'),
  option('front-centre', 'Front · centre', '正面 · 中部'),
  option('front-lower', 'Front · lower', '正面 · 下部')
]);
const logoUpload: PackagingConcept['logoUpload'] = {
  accept: ['image/png', 'image/jpeg', 'image/webp'],
  maxBytes: 2 * 1024 * 1024
};

export const legacyPackagingProducts: PackagingConcept[] = [
  {
    sku: 'GT-AIRLESS-030',
    slug: 'airless-serum-30',
    category: 'airless',
    shape: 'airless',
    color: '#d6c7ad',
    poster: '/assets/products/gt-airless-030-v2.png',
    modelPath: '/models/sku/gt-airless-030.glb?v=6',
    modelPresentation: {scale: 0.94, position: [0, -0.08, 0], groundOffset: 1.58, logoAnchor: [0, -0.18, 0.76], logoSize: [0.66, 0.27], logoStep: 0.55},
    name: localized('Contour Airless Bottle', '轮廓真空瓶'),
    eyebrow: localized('Packaging concept', '包装概念'),
    description: localized('A ready-to-customise packaging format for colour, finish and logo exploration.', '可调整颜色、表面效果与 Logo 的包装款式。'),
    modelBoundary: {geometryId: 'airless-cylinder-v6', note: localized('Preview only; verify the final structure with a physical sample.', '仅供预览；最终结构以实物样品确认。')},
    logoUpload,
    optionGroups: [
      group('capacity', 'Capacity', '容量', [option('15ml', '15 ml', '15 ml'), option('30ml', '30 ml', '30 ml'), option('50ml', '50 ml', '50 ml')]),
      group('material', 'Bottle material', '瓶身材质', [option('pp', 'PP', 'PP'), option('pcr-pp', 'PCR-PP', 'PCR-PP'), option('petg', 'PETG', 'PETG')]),
      colours,
      finishes,
      branding,
      logoPosition
    ]
  },
  {
    sku: 'GT-DROPPER-030',
    slug: 'glass-dropper-30',
    category: 'bottles',
    shape: 'bottle',
    color: '#657d73',
    poster: '/assets/products/gt-dropper-030-v2.png',
    modelPath: '/models/sku/gt-dropper-030.glb?v=6',
    modelPresentation: {scale: 0.86, position: [0, -0.12, 0], groundOffset: 1.55, logoAnchor: [0, -0.22, 0.76], logoSize: [0.64, 0.26], logoStep: 0.54},
    name: localized('Botanical Dropper Bottle', '植萃滴管瓶'),
    eyebrow: localized('Packaging concept', '包装概念'),
    description: localized('A ready-to-customise packaging format for colour, finish and logo exploration.', '可调整颜色、表面效果与 Logo 的包装款式。'),
    modelBoundary: {geometryId: 'dropper-round-v6', note: localized('Preview only; verify the final structure with a physical sample.', '仅供预览；最终结构以实物样品确认。')},
    logoUpload,
    optionGroups: [
      group('capacity', 'Capacity', '容量', [option('15ml', '15 ml', '15 ml'), option('30ml', '30 ml', '30 ml'), option('50ml', '50 ml', '50 ml')]),
      group('material', 'Glass', '玻璃材质', [option('flint', 'Flint glass', '高白玻璃'), option('amber', 'Amber glass', '棕色玻璃'), option('frosted', 'Frosted glass', '磨砂玻璃')]),
      colours,
      group('finish', 'Collar / bottle finish', '肩套和瓶身效果', [option('satin', 'Satin collar', '缎面肩套'), option('gloss', 'Gloss collar', '高光肩套'), option('soft-touch', 'Frosted body', '磨砂瓶身')]),
      branding,
      logoPosition
    ]
  },
  {
    sku: 'GT-JAR-050',
    slug: 'cream-jar-50',
    category: 'jars',
    shape: 'jar',
    color: '#e1d2bf',
    poster: '/assets/products/gt-jar-050-v2.png',
    modelPath: '/models/sku/gt-jar-050.glb?v=6',
    modelPresentation: {scale: 1.15, position: [0, -0.02, 0], groundOffset: 1.24, logoAnchor: [0, -0.58, 1.13], logoSize: [0.76, 0.24], logoStep: 0.32},
    name: localized('Monolith Cream Jar', '磐石面霜罐'),
    eyebrow: localized('Packaging concept', '包装概念'),
    description: localized('A ready-to-customise packaging format for colour, finish and logo exploration.', '可调整颜色、表面效果与 Logo 的包装款式。'),
    modelBoundary: {geometryId: 'cream-jar-wide-v6', note: localized('Preview only; verify the final structure with a physical sample.', '仅供预览；最终结构以实物样品确认。')},
    logoUpload,
    optionGroups: [
      group('capacity', 'Fill size', '灌装容量', [option('30g', '30 g', '30 g'), option('50g', '50 g', '50 g'), option('80g', '80 g', '80 g')]),
      group('material', 'Jar material', '罐体材质', [option('glass', 'Glass', '玻璃'), option('petg', 'PETG', 'PETG'), option('pp', 'PP', 'PP')]),
      colours,
      finishes,
      branding,
      logoPosition
    ]
  },
  {
    sku: 'GT-MASK-FULL-025',
    slug: 'full-sheet-mask',
    category: 'masks',
    shape: 'full-mask',
    color: '#e9ddc9',
    poster: '/assets/products/gt-mask-full-025-v2.png',
    modelPath: '/models/sku/gt-mask-full-025.glb?v=7',
    modelPresentation: {scale: 0.98, position: [0, 0, 0], groundOffset: 1.41, logoAnchor: [-0.98, -0.08, -0.12], logoSize: [0.68, 0.28], logoStep: 0.58},
    name: localized('Single-Piece Sheet Mask Pack', '整张式面膜包装'),
    eyebrow: localized('Packaging concept', '包装概念'),
    description: localized('A ready-to-customise packaging format for colour, finish and logo exploration.', '可调整颜色、表面效果与 Logo 的包装款式。'),
    modelBoundary: {geometryId: 'mask-soft-drape-v7', note: localized('Preview only; verify the final cut and pouch with a physical sample.', '仅供预览；最终裁片与袋材以实物样品确认。')},
    logoUpload,
    optionGroups: [
      group('capacity', 'Sheet size', '膜布尺寸', [option('compact', 'Small', '小号'), option('standard', 'Standard', '标准'), option('extended', 'Large', '大号')]),
      group('material', 'Sheet material', '膜布材质', [option('cotton', 'Cotton fibre', '棉纤维'), option('lyocell', 'Lyocell', '莱赛尔'), option('bio-cellulose', 'Bio-cellulose', '生物纤维')]),
      group('pack-material', 'Sachet material', '包装袋材质', [option('pet-al-pe', 'PET / AL / PE', 'PET / AL / PE'), option('pet-pe', 'PET / PE', 'PET / PE'), option('paper-look', 'Paper-look laminate', '纸感复合膜')]),
      colours,
      finishes,
      logoPosition
    ]
  },
  {
    sku: 'GT-MASK-SPLIT-030',
    slug: 'split-hydrogel-mask',
    category: 'masks',
    shape: 'split-mask',
    color: '#c8d9d1',
    poster: '/assets/products/gt-mask-split-030-v2.png',
    modelPath: '/models/sku/gt-mask-split-030.glb?v=7',
    modelPresentation: {scale: 0.98, position: [0, 0, 0], groundOffset: 1.41, logoAnchor: [-0.98, -0.08, -0.12], logoSize: [0.68, 0.28], logoStep: 0.58},
    name: localized('Two-Piece Hydrogel Mask Pack', '上下分体水凝胶面膜包装'),
    eyebrow: localized('Packaging concept', '包装概念'),
    description: localized('A ready-to-customise packaging format for colour, finish and logo exploration.', '可调整颜色、表面效果与 Logo 的包装款式。'),
    modelBoundary: {geometryId: 'mask-soft-drape-split-v7', note: localized('Preview only; verify the final fit and pouch with a physical sample.', '仅供预览；最终贴合尺寸与袋材以实物样品确认。')},
    logoUpload,
    optionGroups: [
      group('capacity', 'Mask size', '面膜尺寸', [option('compact', 'Small', '小号'), option('standard', 'Standard', '标准'), option('extended', 'Large', '大号')]),
      group('material', 'Hydrogel thickness', '水凝胶厚度', [option('thin', 'Thin', '轻薄'), option('standard', 'Standard', '标准'), option('plush', 'Thick', '加厚')]),
      group('pack-material', 'Sachet material', '包装袋材质', [option('pet-al-pe', 'PET / AL / PE', 'PET / AL / PE'), option('pet-pe', 'PET / PE', 'PET / PE'), option('paper-look', 'Paper-look laminate', '纸感复合膜')]),
      colours,
      finishes,
      logoPosition
    ]
  }
];

const customProductColorPattern = /^#[0-9a-f]{6}$/i;

export function isCustomProductColor(value: string): boolean {
  return customProductColorPattern.test(value);
}

export function resolvePackagingConceptColor(product: PackagingConcept, selection: string): string {
  if (isCustomProductColor(selection)) return selection.toLowerCase();
  return product.optionGroups
    .find((candidate) => candidate.id === 'color')?.options
    .find((candidate) => candidate.id === selection)?.value ?? product.color;
}
