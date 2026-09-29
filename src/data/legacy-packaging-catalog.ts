import type {Locale} from '@/lib/routing';
import {deliveryTranslation} from '@/data/delivery-translations';
import packagingVariantInventory from '../../docs/packaging-brochure-variants.json';

export type PackagingLocalizedText = Record<Locale, string>;
export type PackagingPrintText = {brand: string; detail: string};
export type PackagingOption = {id: string; label: PackagingLocalizedText; value?: string};
export type PackagingOptionGroup = {id: string; label: PackagingLocalizedText; options: PackagingOption[]};
export type PackagingShape = 'airless' | 'bottle' | 'jar' | 'lotion' | 'cleanser' | 'spray' | 'full-mask' | 'split-mask' | 'mousse' | 'cotton-box' | 'dual-chamber';

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
  seriesSku?: string;
  availableParts?: readonly ('body' | 'cap' | 'pump')[];
  assembly?: boolean;
  editablePrint?: {defaults: PackagingPrintText; bodyRadius: number; brandY: number; detailY: number};
  catalogImages?: {retouched?: string; original: string};
  source?: {supplier: string; page: number; material: string; capacity: string; modelCode?: string; totalCapacity?: string; pumpHead?: PackagingLocalizedText; specificationNote?: PackagingLocalizedText; modelVersion: string; status: 'review' | 'approved'};
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

const packagingTranslations: Record<string, {ru: string; ar: string}> = {
  'Package colour': {ru: 'Цвет упаковки', ar: 'لون العبوة'},
  'Deep green': {ru: 'Тёмно-зелёный', ar: 'أخضر داكن'},
  Ivory: {ru: 'Слоновая кость', ar: 'عاجي'},
  'Copper brown': {ru: 'Медно-коричневый', ar: 'بني نحاسي'},
  Graphite: {ru: 'Графитовый', ar: 'غرافيتي'},
  Finish: {ru: 'Отделка', ar: 'التشطيب'},
  Satin: {ru: 'Сатиновая', ar: 'ساتان'},
  'Soft touch': {ru: 'Софт-тач', ar: 'ملمس ناعم'},
  'High gloss': {ru: 'Высокий глянец', ar: 'لمعان عالٍ'},
  'Logo decoration': {ru: 'Нанесение логотипа', ar: 'تنفيذ الشعار'},
  'Applied label': {ru: 'Наклейка', ar: 'ملصق تطبيقي'},
  'Screen print': {ru: 'Шелкография', ar: 'طباعة بالشاشة الحريرية'},
  'Foil detail': {ru: 'Тиснение фольгой', ar: 'تفاصيل برقائق معدنية'},
  'Logo position': {ru: 'Положение логотипа', ar: 'موضع الشعار'},
  'Front · upper': {ru: 'Спереди · сверху', ar: 'الأمام · أعلى'},
  'Front · centre': {ru: 'Спереди · по центру', ar: 'الأمام · الوسط'},
  'Front · lower': {ru: 'Спереди · снизу', ar: 'الأمام · أسفل'},
  'Contour Airless Bottle': {ru: 'Контурный вакуумный флакон', ar: 'عبوة مفرغة بتصميم انسيابي'},
  'Botanical Dropper Bottle': {ru: 'Ботанический флакон с пипеткой', ar: 'عبوة نباتية بقطّارة'},
  'Monolith Cream Jar': {ru: 'Монолитная банка для крема', ar: 'عبوة كريم أحادية الكتلة'},
  'Single-Piece Sheet Mask Pack': {ru: 'Упаковка цельной тканевой маски', ar: 'عبوة قناع ورقي من قطعة واحدة'},
  'Two-Piece Hydrogel Mask Pack': {ru: 'Упаковка двухкомпонентной гидрогелевой маски', ar: 'عبوة قناع هيدروجيل من قطعتين'},
  'Packaging concept': {ru: 'Концепция упаковки', ar: 'مفهوم العبوة'},
  'A ready-to-customise packaging format for colour, finish and logo exploration.': {ru: 'Готовый к адаптации формат упаковки для выбора цвета, отделки и размещения логотипа.', ar: 'صيغة عبوة جاهزة للتخصيص لاختبار اللون والتشطيب والشعار.'},
  'Preview only; verify the final structure with a physical sample.': {ru: 'Только предварительный просмотр; окончательную конструкцию следует подтвердить физическим образцом.', ar: 'للمعاينة فقط؛ يجب تأكيد البنية النهائية بعينة فعلية.'},
  'Preview only; verify the final cut and pouch with a physical sample.': {ru: 'Только предварительный просмотр; окончательный крой и пакет следует подтвердить физическим образцом.', ar: 'للمعاينة فقط؛ يجب تأكيد القص النهائي والكيس بعينة فعلية.'},
  'Preview only; verify the final fit and pouch with a physical sample.': {ru: 'Только предварительный просмотр; окончательную посадку и пакет следует подтвердить физическим образцом.', ar: 'للمعاينة فقط؛ يجب تأكيد الملاءمة النهائية والكيس بعينة فعلية.'},
  Capacity: {ru: 'Объём', ar: 'السعة'},
  'Bottle material': {ru: 'Материал флакона', ar: 'مادة العبوة'},
  Glass: {ru: 'Стекло', ar: 'زجاج'},
  'Flint glass': {ru: 'Прозрачное стекло', ar: 'زجاج شديد الصفاء'},
  'Amber glass': {ru: 'Янтарное стекло', ar: 'زجاج كهرماني'},
  'Frosted glass': {ru: 'Матовое стекло', ar: 'زجاج مصنفر'},
  'Collar / bottle finish': {ru: 'Отделка воротника / флакона', ar: 'تشطيب الطوق / العبوة'},
  'Satin collar': {ru: 'Сатиновый воротник', ar: 'طوق ساتان'},
  'Gloss collar': {ru: 'Глянцевый воротник', ar: 'طوق لامع'},
  'Frosted body': {ru: 'Матовый корпус', ar: 'جسم مصنفر'},
  'Fill size': {ru: 'Объём наполнения', ar: 'حجم التعبئة'},
  'Jar material': {ru: 'Материал банки', ar: 'مادة العبوة'},
  'Sheet size': {ru: 'Размер полотна', ar: 'حجم القناع'},
  Small: {ru: 'Малый', ar: 'صغير'},
  Standard: {ru: 'Стандартный', ar: 'قياسي'},
  Large: {ru: 'Большой', ar: 'كبير'},
  'Sheet material': {ru: 'Материал полотна', ar: 'مادة القناع'},
  'Cotton fibre': {ru: 'Хлопковое волокно', ar: 'ألياف قطنية'},
  Lyocell: {ru: 'Лиоцелл', ar: 'ليوسيل'},
  'Bio-cellulose': {ru: 'Биоцеллюлоза', ar: 'سليلوز حيوي'},
  'Sachet material': {ru: 'Материал саше', ar: 'مادة الكيس'},
  'Paper-look laminate': {ru: 'Ламинат с фактурой бумаги', ar: 'رقائق مركبة بمظهر ورقي'},
  'Mask size': {ru: 'Размер маски', ar: 'حجم القناع'},
  'Hydrogel thickness': {ru: 'Толщина гидрогеля', ar: 'سماكة الهيدروجيل'},
  Thin: {ru: 'Тонкий', ar: 'رقيق'},
  Thick: {ru: 'Толстый', ar: 'سميك'}
};

const localized = (en: string, zh: string, fr = en, es = en, ru = en, ar = en): PackagingLocalizedText => ({
  en,
  zh,
  fr: fr === en ? deliveryTranslation(en, 'fr') ?? en : fr,
  es: es === en ? deliveryTranslation(en, 'es') ?? en : es,
  ru: ru === en ? (packagingTranslations[en]?.ru ?? en) : ru,
  ar: ar === en ? (packagingTranslations[en]?.ar ?? en) : ar
});
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

const bottleBase = legacyPackagingProducts[0];
const moussePrintDefaults: PackagingPrintText = {brand: 'RED DESIGN', detail: 'AMINO ACID SURFACTANT\nMOISTURIZING CLEANSING MOUSSE'};
function mousseEditablePrint(bodyHeight: number, bodyRadius: number): NonNullable<PackagingConcept['editablePrint']> {
  return {defaults: moussePrintDefaults, bodyRadius, brandY: .03 + bodyHeight * .81, detailY: .03 + bodyHeight * .22};
}
const samplePackagingProducts: PackagingConcept[] = [
  {sku: 'HD-1267', slug: 'hd-1267-mousse-250', category: 'mousse', shape: 'mousse', color: '#b3aaa7', poster: '/assets/packaging/hd-1267.png', modelPath: '/models/packaging/hd-1267.glb?v=3', catalogImages: {retouched: '/assets/packaging/reference/hd-1267-250ml-image2.png', original: '/assets/packaging/reference/hd-1267.png'},
    editablePrint: mousseEditablePrint(2.32, .66),
    name: localized('HD-1267 Mousse Bottle', 'HD-1267 慕斯瓶', 'Flacon mousse HD-1267', 'Botella de espuma HD-1267', 'Флакон-пенка HD-1267', 'عبوة رغوة HD-1267'), eyebrow: localized('Red Dot Packaging · P7', '红点包装 · 第 7 页'),
    description: localized('250 ml PET mousse bottle with a burgundy dispenser and clear cover.', '250 ml PET 慕斯瓶，酒红色泵头与透明防尘罩。'),
    source: {supplier: 'Red Dot Packaging', page: 7, material: 'PET', capacity: '250 ml', pumpHead: localized('43-thread', '43牙', 'Filetage 43', 'Rosca 43', 'Резьба 43', 'سن 43'), modelVersion: 'review-2', status: 'review'},
    modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0, logoAnchor: [0, 1.22, .69], logoSize: [.55, .21], logoStep: .38},
    modelBoundary: {geometryId: 'hd-1267-review-2', note: localized('Visual reference only. Confirm fit and production dimensions with a sample.', '外观参考；结构配合与量产尺寸以样品确认。')}, logoUpload,
    optionGroups: [group('capacity', 'Capacity', '容量', [option('250ml', '250 ml', '250 ml')]), group('material', 'Bottle material', '瓶身材质', [option('pet', 'PET', 'PET')]), group('color', 'Package colour', '包装颜色', [option('reference', 'Reference taupe', '手册灰褐', '#b3aaa7')]), finishes, branding, logoPosition]},
  {sku: 'HD-1159', slug: 'hd-1159-scrub-jar-50', category: 'jars', shape: 'jar', color: '#c5c2b5', poster: '/assets/packaging/hd-1159.png', modelPath: '/models/packaging/hd-1159.glb', catalogImages: {original: '/assets/packaging/reference/hd-1159.png'},
    name: localized('HD-1159 Scrub Jar', 'HD-1159 磨砂膏罐', 'Pot de gommage HD-1159', 'Tarro exfoliante HD-1159', 'Банка для скраба HD-1159', 'عبوة مقشر HD-1159'), eyebrow: localized('Red Dot Packaging · P13', '红点包装 · 第 13 页'),
    description: localized('50 g PETG jar with a broad soft ivory lid and subtle parting line.', '50 g PETG 罐，宽盖、柔白材质与细腻接缝。'),
    source: {supplier: 'Red Dot Packaging', page: 13, material: 'PETG', capacity: '50 g', modelVersion: 'review-1', status: 'review'},
    modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0, logoAnchor: [0, .36, 1.09], logoSize: [.75, .18], logoStep: .13},
    modelBoundary: {geometryId: 'hd-1159-review-1', note: localized('Visual reference only. Confirm lid and material with a sample.', '外观参考；盖体与材质以样品确认。')}, logoUpload,
    optionGroups: [group('capacity', 'Capacity', '容量', [option('50g', '50 g', '50 g')]), group('material', 'Jar material', '罐体材质', [option('petg', 'PETG', 'PETG')]), group('color', 'Package colour', '包装颜色', [option('reference', 'Reference ivory', '手册象牙白', '#c5c2b5')]), finishes, branding, logoPosition]},
  {sku: 'HD-843', slug: 'hd-843-cotton-pad-box-300', category: 'jars', shape: 'cotton-box', color: '#d6aa55', poster: '/assets/packaging/hd-843.png', modelPath: '/models/packaging/hd-843.glb', catalogImages: {original: '/assets/packaging/reference/hd-843.png'},
    name: localized('HD-843 Cotton Pad Box', 'HD-843 双层棉片盒', 'Boîte à disques de coton HD-843', 'Caja para discos de algodón HD-843', 'Коробка для ватных дисков HD-843', 'علبة وسادات قطنية HD-843'), eyebrow: localized('Red Dot Packaging · P21', '红点包装 · 第 21 页'),
    description: localized('300 ml PP dual-layer cotton pad box with hinged lid and pickup insert.', '300 ml PP 双层棉片盒，翻盖、内盒及抽取口分件展示。'),
    source: {supplier: 'Red Dot Packaging', page: 21, material: 'PP', capacity: '300 ml', modelVersion: 'review-1', status: 'review'},
    modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0, logoAnchor: [0, .5, .98], logoSize: [.8, .2], logoStep: .2},
    modelBoundary: {geometryId: 'hd-843-review-1', note: localized('Visual reference only. Confirm hinge and insert with a sample.', '外观参考；铰链与内盒以样品确认。')}, logoUpload,
    optionGroups: [group('capacity', 'Capacity', '容量', [option('300ml', '300 ml', '300 ml')]), group('material', 'Box material', '盒体材质', [option('pp', 'PP', 'PP')]), group('color', 'Package colour', '包装颜色', [option('reference', 'Reference gold', '手册浅金', '#d6aa55')]), finishes, branding, logoPosition]},
  {sku: 'HD-844', slug: 'hd-844-dual-chamber-200', category: 'bottles', shape: 'dual-chamber', color: '#628263', poster: '/assets/packaging/hd-844.png', modelPath: '/models/packaging/hd-844.glb?v=2', catalogImages: {original: '/assets/packaging/reference/hd-844.png'},
    name: localized('HD-844 Dual-Chamber Bottle', 'HD-844 双仓洗护瓶', 'Flacon à deux compartiments HD-844', 'Botella de doble cámara HD-844', 'Двухкамерный флакон HD-844', 'عبوة مزدوجة الحجرات HD-844'), eyebrow: localized('Red Dot Packaging · P31', '红点包装 · 第 31 页'),
    description: localized('PETG twin-chamber dispenser, 100 ml per chamber, with separate pumps.', 'PETG 双仓洗护瓶，每仓 100 ml，双管乳液泵。'),
    source: {supplier: 'Red Dot Packaging', page: 31, material: 'PETG', capacity: '100 ml × 2', totalCapacity: '200 ml', pumpHead: localized('Twin lotion pump', '双管乳液泵', 'Pompe double', 'Dosificador doble', 'Двойная помпа', 'مضخة مزدوجة'), modelVersion: 'review-2', status: 'review'},
    modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0, logoAnchor: [0, 1.68, .44], logoSize: [.7, .2], logoStep: .38},
    modelBoundary: {geometryId: 'hd-844-review-2', note: localized('Visual reference only. Confirm chamber and pump details with a sample.', '外观参考；双仓与泵头结构以样品确认。')}, logoUpload,
    optionGroups: [group('capacity', 'Capacity', '容量', [option('100ml-x2', '100 ml × 2', '100 ml × 2')]), group('material', 'Bottle material', '瓶身材质', [option('petg', 'PETG', 'PETG')]), group('color', 'Package colour', '包装颜色', [option('reference', 'Reference sage', '手册鼠尾草绿', '#628263')]), finishes, branding, logoPosition]}
];

function sampleSizeVariant(base: PackagingConcept, sku: string, capacity: string, capacityId: string, description: PackagingLocalizedText, logoAnchor: [number, number, number], totalCapacity?: string, mousseProfile?: [number, number]): PackagingConcept {
  return {
    ...base,
    sku,
    slug: `${sku.toLowerCase()}-${base.category}`,
    seriesSku: base.sku,
    name: Object.fromEntries(Object.entries(base.name).map(([locale, value]) => [locale, value.replace(base.sku, sku)])) as PackagingLocalizedText,
    description,
    poster: `/assets/packaging/${sku.toLowerCase()}.png`,
    modelPath: `/models/packaging/${sku.toLowerCase()}.glb`,
    catalogImages: base.catalogImages ? {original: base.catalogImages.original} : undefined,
    editablePrint: mousseProfile ? mousseEditablePrint(...mousseProfile) : base.editablePrint,
    source: {...base.source!, capacity, ...(totalCapacity ? {totalCapacity} : {}), modelVersion: 'review-1'},
    modelPresentation: {...base.modelPresentation, logoAnchor},
    modelBoundary: {...base.modelBoundary, geometryId: `${sku.toLowerCase()}-review-1`},
    optionGroups: base.optionGroups.map((group) => group.id === 'capacity' ? {...group, options: [option(capacityId, capacity, capacity)]} : group)
  };
}

const samplePackagingVariants: PackagingConcept[] = [
  sampleSizeVariant(samplePackagingProducts[0], 'HD-1167', '200 ml', '200ml', localized('200 ml PET mousse bottle with a clear pump cover.', '200 ml PET 慕斯瓶，带透明泵头罩。'), [0, 1.08, .67], undefined, [2.10, .65]),
  sampleSizeVariant(samplePackagingProducts[0], 'HD-1168', '150 ml', '150ml', localized('150 ml PET mousse bottle with a clear pump cover.', '150 ml PET 慕斯瓶，带透明泵头罩。'), [0, .91, .66], undefined, [1.88, .64]),
  sampleSizeVariant(samplePackagingProducts[0], 'HD-1169', '120 ml', '120ml', localized('120 ml PET mousse bottle with a clear pump cover.', '120 ml PET 慕斯瓶，带透明泵头罩。'), [0, .77, .64], undefined, [1.66, .62]),
  sampleSizeVariant(samplePackagingProducts[0], 'HD-1170', '100 ml', '100ml', localized('100 ml PET mousse bottle with a clear pump cover.', '100 ml PET 慕斯瓶，带透明泵头罩。'), [0, .67, .63], undefined, [1.52, .61]),
  sampleSizeVariant(samplePackagingProducts[1], 'HD-1160', '30 g', '30g', localized('30 g PETG scrub jar.', '30 g PETG 磨砂膏罐。'), [0, .27, .9]),
  sampleSizeVariant(samplePackagingProducts[1], 'HD-1161', '30 g', '30g', localized('30 g PETG scrub jar with a broad profile.', '30 g PETG 磨砂膏罐，较宽罐型。'), [0, .25, .98]),
  sampleSizeVariant(samplePackagingProducts[1], 'HD-1162', '50 g', '50g', localized('50 g PETG scrub jar with a broad profile.', '50 g PETG 磨砂膏罐，较宽罐型。'), [0, .28, 1.15]),
  sampleSizeVariant(samplePackagingProducts[3], 'HD-845', '75 ml × 2', '75ml-x2', localized('150 ml PETG dual-chamber bottle, 75 ml per chamber.', '150 ml PETG 双仓瓶，每仓 75 ml。'), [0, 1.48, .42], '150 ml'),
  sampleSizeVariant(samplePackagingProducts[3], 'HD-846', '50 ml × 2', '50ml-x2', localized('100 ml PETG dual-chamber bottle, 50 ml per chamber.', '100 ml PETG 双仓瓶，每仓 50 ml。'), [0, 1.02, .4], '100 ml'),
  sampleSizeVariant(samplePackagingProducts[3], 'HD-847', '30 ml × 2', '30ml-x2', localized('60 ml PETG dual-chamber bottle, 30 ml per chamber.', '60 ml PETG 双仓瓶，每仓 30 ml。'), [0, .74, .39], '60 ml')
];

const firstBatchSpec = {
  8: {root: 'HD-1166', shape: 'mousse', category: 'mousse', en: 'Brush Mousse Bottle', zh: '硅胶刷头慕斯瓶', color: '#6da9d0', parts: ['body', 'pump'], pump: '43牙'},
  9: {root: 'HD-1181', shape: 'mousse', category: 'mousse', en: 'Blue Mousse Bottle', zh: '蓝色慕斯瓶', color: '#a9c5d9', parts: ['body', 'pump'], pump: '42牙'},
  10: {root: 'HD-71', shape: 'lotion', category: 'lotion', en: 'Amber Pump Bottle', zh: '琥珀泵瓶', color: '#b97b2d', parts: ['body', 'pump'], pump: ''},
  11: {root: 'HD-1406', shape: 'spray', category: 'spray', en: 'Amber Spray Bottle', zh: '琥珀喷雾瓶', color: '#8b4d2a', parts: ['body', 'cap', 'pump'], pump: '24牙'},
  12: {root: 'HD-1183', shape: 'spray', category: 'spray', en: 'Ivory Spray Bottle', zh: '象牙白喷雾瓶', color: '#d8d5c8', parts: ['body', 'cap', 'pump'], pump: ''}
} as const;

const firstBatchProducts: PackagingConcept[] = packagingVariantInventory.variants
  .filter((row) => row.sourcePage >= 8 && row.sourcePage <= 12 && row.status === 'review-model-ready')
  .map((row) => {
    const spec = firstBatchSpec[row.sourcePage as keyof typeof firstBatchSpec];
    const capacity = row.capacity!;
    const ml = Number.parseInt(capacity, 10);
    const bodyHeight = row.sourcePage === 8 ? 1.86 + (ml - 100) * .0052
      : row.sourcePage === 9 ? 1.75 + (ml - 200) * .0039
        : row.sourcePage === 10 ? 2.15 + (ml - 100) * .005
          : row.sourcePage === 11 ? 1.36 + (ml - 50) * .009 : 1.7 + (ml - 80) * .007;
    const radius = row.sourcePage === 8 ? .51 + (ml - 100) * .00072
      : row.sourcePage === 9 ? .60 + (ml - 200) * .00055
        : row.sourcePage === 10 ? .58 + (ml - 100) * .00035
          : row.sourcePage === 11 ? .54 + (ml - 50) * .00065 : .56 + (ml - 80) * .00065;
    const capacityLabel = capacity.replace(/(ml|g)$/i, ' $1');
    return {
      sku: row.sku, slug: `${row.sku.toLowerCase()}-${spec.category}`, category: spec.category,
      shape: spec.shape, color: spec.color, poster: `/assets/packaging/${row.sku.toLowerCase()}.png?v=2`,
      modelPath: `/models/packaging/${row.sku.toLowerCase()}.glb?v=2`,
      ...(row.sku === spec.root ? {} : {seriesSku: spec.root}),
      availableParts: spec.parts, assembly: row.sourcePage >= 10,
      editablePrint: {defaults: moussePrintDefaults, bodyRadius: radius, brandY: bodyHeight * .78, detailY: bodyHeight * .25},
      catalogImages: {original: `/assets/packaging/reference/p${row.sourcePage}-original.png`, ...(row.sku === 'HD-1166' ? {retouched: '/assets/packaging/reference/hd-1166-100ml-image2.png'} : {})},
      name: localized(`${row.sku} ${spec.en}`, `${row.sku} ${spec.zh}`),
      eyebrow: localized(`Red Dot Packaging · P${row.sourcePage}`, `红点包装 · 第 ${row.sourcePage} 页`),
      description: localized(`${capacityLabel} ${row.material ?? 'material pending'} ${spec.en.toLowerCase()}.`, `${capacityLabel} ${row.material ?? '材质待确认'} ${spec.zh}。`),
      source: {supplier: 'Red Dot Packaging', page: row.sourcePage, material: row.material ?? '待确认', capacity: capacityLabel,
        ...(spec.pump ? {pumpHead: localized(spec.pump, spec.pump)} : {}), modelVersion: 'review-1', status: 'review'},
      modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0,
        logoAnchor: [0, bodyHeight * .78, radius + .03], logoSize: [.54, .21], logoStep: .3},
      modelBoundary: {geometryId: `${row.sku.toLowerCase()}-review-1`, note: localized('Photo-based visual reference only; verify production dimensions with the supplier.', '按照片制作的外观参考；量产尺寸以厂家确认为准。')},
      logoUpload,
      optionGroups: [
        group('capacity', 'Capacity', '容量', [option(capacity, capacityLabel, capacityLabel)]),
        group('material', 'Bottle material', '瓶身材质', [option((row.material ?? 'pending').toLowerCase(), row.material ?? 'Pending', row.material ?? '待确认')]),
        group('color', 'Package colour', '包装颜色', [option('reference', 'Reference colour', '手册配色', spec.color)]),
        finishes, branding, logoPosition
      ]
    } satisfies PackagingConcept;
  });

const firstBatchRoots = firstBatchProducts.filter((item) => !item.seriesSku);
const firstBatchVariants = firstBatchProducts.filter((item) => Boolean(item.seriesSku));
const alreadyCataloguedPages = new Set([7, 8, 9, 10, 11, 12, 13, 21, 31]);
const brochurePageRoots = new Map<number, string>();
const brochureReferenceColours: Record<number, string> = {
  14: '#9b3036', 15: '#b08b80', 16: '#cbd8d7', 17: '#a9d0d7', 18: '#a8c78b', 19: '#a99ac8', 20: '#8c705e',
  22: '#a8b9a1', 23: '#b2272b', 24: '#e6e1d6', 25: '#c0c3be', 26: '#454540', 28: '#d49172', 29: '#b9c0bd',
  33: '#6f3d27', 35: '#dfded2', 37: '#bd242c', 39: '#784628', 41: '#233c94', 43: '#e1ddd2', 45: '#8bc6bd',
  47: '#57352b', 48: '#3168bc', 49: '#72ad89', 50: '#c2c5c3', 51: '#d9ad82', 52: '#765b47', 53: '#654232',
  54: '#9c7cb8', 55: '#b1b0d2', 56: '#8fc4d7', 57: '#9bc5a8', 58: '#c9db77'
};
function brochureGeometry(page: number, amount: number, capacity: string, isJar: boolean): {height: number; radius: number; front: number} {
  if (page === 22) return {height: 1.4, radius: .6, front: .64};
  if (page >= 14 && page <= 20) {
    if (page >= 17 && page <= 19) {
      const radius = .64 + amount * .00095;
      return {height: .54 + amount * .0016, radius, front: radius + .025};
    }
    const short = page === 14 || page === 15 || page === 20;
    const radius = (short ? .67 : .72) + amount * (short ? .0013 : .001);
    return {height: (short ? .36 : .45) + amount * (short ? .0018 : .0023), radius, front: radius + .025};
  }
  if (page >= 22 && page <= 29) {
    if (isJar) {
      const radius = .66 + amount * .002;
      return {height: .43 + amount * .0024, radius, front: radius + .025};
    }
    const small = amount <= 60;
    const radius = (small ? .39 : .48) + amount * (small ? .0017 : .00115);
    return {height: (small ? 1.23 : 1.52) + amount * (small ? .008 : .005), radius, front: radius + .025};
  }
  const total = capacity.includes('×2') ? amount * 2 : amount;
  const radius = Math.max(.46, .56 + (total - 250) * .00045);
  const height = Math.max(1.35, 1.75 + (total - 250) * .0024);
  const frontRatio = page === 43 ? .525 : [35, 41, 49, 52, 57].includes(page) ? .625
    : page === 48 ? .575 : page === 39 ? .75 : page === 45 ? 1.09 : 1;
  return {height, radius, front: radius * frontRatio + .035};
}
function conflictingCapacityNote(modelCode: string): PackagingLocalizedText | undefined {
  const values = modelCode === 'HD-1256' ? ['120 ml', '120 g'] : modelCode === 'HD-978' ? ['650 ml', '650 g'] : null;
  if (!values) return undefined;
  const [caption, card] = values;
  return localized(
    `Catalogue conflict: the page caption says ${caption}, while the model card says ${card}. Confirm with the supplier.`,
    `手册标注有冲突：页脚为 ${caption}，型号参数为 ${card}；请与厂家确认。`,
    `Incohérence du catalogue : légende ${caption}, fiche du modèle ${card}. À confirmer auprès du fournisseur.`,
    `Discrepancia en el catálogo: el pie indica ${caption} y la ficha del modelo ${card}. Confírmelo con el proveedor.`,
    `В каталоге расхождение: в подписи ${caption}, в карточке модели ${card}. Уточните у поставщика.`,
    `يوجد تعارض في الدليل: التعليق يذكر ${caption} وبطاقة الطراز تذكر ${card}. يُرجى التأكيد مع المورّد.`
  );
}
const remainingBrochureProducts: PackagingConcept[] = packagingVariantInventory.variants
  .filter((row) => !alreadyCataloguedPages.has(row.sourcePage) && row.status === 'review-model-ready')
  .map((row) => {
    const page = row.sourcePage;
    const root = brochurePageRoots.get(page) ?? row.id;
    brochurePageRoots.set(page, root);
    const isBox = page === 22;
    const isJar = isBox || row.capacity?.endsWith('g') || (page >= 14 && page <= 20);
    const amount = Number.parseFloat(row.capacity ?? '') || 100;
    const hasPump = page >= 33 && page !== 58 || (page >= 23 && page <= 29 && !isJar && [23, 24, 28].includes(page) && amount >= 100);
    const shape: PackagingShape = isBox ? 'cotton-box' : isJar ? 'jar' : hasPump ? 'lotion' : 'bottle';
    const category = isJar ? 'jars' : hasPump ? 'lotion' : 'bottles';
    const en = isBox ? 'Cotton Pad Box' : isJar ? 'Skincare Jar' : 'Care Bottle';
    const zh = isBox ? '棉片盒' : isJar ? '护肤罐' : '洗护瓶';
    const capacity = row.capacity ?? '待确认';
    const capacityLabel = capacity.replace(/(ml|g)$/i, ' $1');
    const {height, front} = brochureGeometry(page, amount, capacity, isJar);
    const modelCode = row.sku;
    const referenceColour = page === 45 ? {'HD-900': '#b8b9b6', 'HD-901': '#8bc6bd', 'HD-902': '#d6cd5d'}[row.id] ?? brochureReferenceColours[page]
      : page === 58 ? {'HD-09': '#d990ac', 'HD-10': '#c9db77', 'HD-11': '#d9a278'}[row.id] ?? brochureReferenceColours[page]
        : brochureReferenceColours[page] ?? '#b9b4aa';
    const availableParts: PackagingConcept['availableParts'] = hasPump ? ['body', 'pump'] : ['body', 'cap'];
    const hasAnimatedLid = isBox || page >= 14 && page <= 20 || isJar;
    return {
      sku: row.id, slug: `${row.id.toLowerCase()}-${category}`, category, shape,
      color: referenceColour,
      poster: `/assets/packaging/${row.id.toLowerCase()}.png?v=2`,
      modelPath: `/models/packaging/${row.id.toLowerCase()}.glb?v=2`,
      ...(row.id === root ? {} : {seriesSku: root}),
      availableParts, assembly: hasAnimatedLid,
      editablePrint: {defaults: {brand: 'RED DESIGN', detail: page >= 33 ? 'HAIR & BODY CARE' : 'SKIN CARE'}, bodyRadius: front, brandY: height * .68, detailY: height * .27},
      catalogImages: {original: `/assets/packaging/reference/p${page}-original.png`},
      name: localized(`${modelCode} ${en}`, `${modelCode} ${zh}`),
      eyebrow: localized(`Red Dot Packaging · P${page}`, `红点包装 · 第 ${page} 页`),
      description: localized(`${capacityLabel} ${en.toLowerCase()}; material: ${row.material ?? 'to be confirmed'}.`, `${capacityLabel}${zh}；材质：${row.material ?? '待确认'}。`),
      source: {supplier: 'Red Dot Packaging', page, material: row.material ?? 'pending', capacity: capacityLabel, modelCode,
        ...(conflictingCapacityNote(modelCode) ? {specificationNote: conflictingCapacityNote(modelCode)} : {}), modelVersion: 'review-1', status: 'review'},
      modelPresentation: {scale: 1, position: [0, 0, 0], groundOffset: 0,
        logoAnchor: [0, height * .68, front], logoSize: [.54, .21], logoStep: .3},
      modelBoundary: {geometryId: `${row.id.toLowerCase()}-review-1`, note: localized('Photo-based visual reference only; verify production dimensions with the supplier.', '按照片制作的外观参考；量产尺寸以厂家确认为准。')},
      logoUpload,
      optionGroups: [
        group('capacity', 'Capacity', '容量', [option(capacity, capacityLabel, capacityLabel)]),
        group('material', 'Bottle material', '瓶身材质', [option((row.material ?? 'pending').toLowerCase(), row.material ?? 'Pending', row.material ?? '待确认')]),
        group('color', 'Package colour', '包装颜色', [option('reference', 'Reference colour', '手册配色', referenceColour)]),
        finishes, branding, logoPosition
      ]
    } satisfies PackagingConcept;
  });
const remainingBrochureRoots = remainingBrochureProducts.filter((item) => !item.seriesSku);
const remainingBrochureVariants = remainingBrochureProducts.filter((item) => Boolean(item.seriesSku));
export const studioPackagingProducts: PackagingConcept[] = [
  ...samplePackagingProducts,
  ...firstBatchRoots,
  ...remainingBrochureRoots,
  {...bottleBase, sku: 'SK-LOTION-150', slug: 'lotion-bottle-150', shape: 'lotion',
    name: localized('Lotion bottle', '乳液瓶', 'Flacon de lotion', 'Frasco de loción', 'Флакон для лосьона', 'عبوة لوشن'),
    modelPath: '/models/sku/sk-lotion-150.glb', poster: '/assets/products/sk-lotion-150.svg',
    modelBoundary: {...bottleBase.modelBoundary, geometryId: 'showki-lotion-pump-v1'},
    modelPresentation: {...bottleBase.modelPresentation, logoAnchor: [0, -0.35, 0.68], groundOffset: 1.4},
    optionGroups: [group('capacity', 'Capacity', '容量', [option('100ml', '100 ml', '100 ml'), option('150ml', '150 ml', '150 ml'), option('200ml', '200 ml', '200 ml')]), ...bottleBase.optionGroups.slice(1)]},
  {...bottleBase, sku: 'SK-CLEANSER-150', slug: 'cleanser-bottle-150', shape: 'cleanser',
    name: localized('Cleanser bottle', '洁面瓶', 'Flacon nettoyant', 'Frasco limpiador', 'Флакон для очищения', 'عبوة غسول'),
    modelPath: '/models/sku/sk-cleanser-150.glb', poster: '/assets/products/sk-cleanser-150.svg',
    modelBoundary: {...bottleBase.modelBoundary, geometryId: 'showki-cleanser-flip-v1'},
    modelPresentation: {...bottleBase.modelPresentation, logoAnchor: [0, -0.2, 0.73], groundOffset: 1.4},
    optionGroups: [group('capacity', 'Capacity', '容量', [option('100ml', '100 ml', '100 ml'), option('150ml', '150 ml', '150 ml'), option('200ml', '200 ml', '200 ml')]), ...bottleBase.optionGroups.slice(1)]},
  {...bottleBase, name: localized('Airless bottle', '真空瓶', 'Flacon airless', 'Frasco airless', 'Вакуумный флакон', 'عبوة مفرغة')},
  {...legacyPackagingProducts[1], name: localized('Glass serum bottle', '玻璃精华瓶', 'Flacon de sérum en verre', 'Frasco de sérum de vidrio', 'Стеклянный флакон сыворотки', 'عبوة سيروم زجاجية')}
];
export const allPackagingProducts = [...studioPackagingProducts, ...samplePackagingVariants, ...firstBatchVariants, ...remainingBrochureVariants, ...legacyPackagingProducts.filter(item => !studioPackagingProducts.some(current => current.sku === item.sku))];

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
