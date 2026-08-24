export const catalogLocales = ['en', 'zh', 'fr', 'es'] as const;

export type CatalogLocale = (typeof catalogLocales)[number];
export type LocalizedText = Record<CatalogLocale, string>;
export type ProductCategory = 'face-masks' | 'eye-masks' | 'neck-masks';
export type ProductOption = {id: string; label: LocalizedText; value?: string};
export type ProductOptionGroup = {id: string; label: LocalizedText; options: ProductOption[]};
export type PublishStatus = 'draft' | 'published' | 'archived';
export type ComplianceStatus = 'raw' | 'verified';
export type ComplianceClaim = 'ISO' | 'GMPC' | 'FDA' | 'MSDS';

export type ModelPresentation = {
  scale: number;
  position: [number, number, number];
  groundOffset: number;
  logoAnchor: [number, number, number];
  logoSize: [number, number];
  logoStep: number;
};

export type ProductMedia = {
  image?: string;
  gallery?: string[];
  imageStatus: 'available' | 'placeholder';
  alt: LocalizedText;
};

export type ProductConfigurator3d = {
  color: string;
  shape: 'face-mask' | 'eye-mask' | 'neck-mask' | 'custom';
  modelPath: string;
  modelPresentation: ModelPresentation;
  modelBoundary: {geometryId: string; note: LocalizedText};
  logoUpload: {
    accept: ['image/png', 'image/jpeg', 'image/webp'];
    maxBytes: number;
  };
};

export type ProductSpecification = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
};

export type Product = {
  productId: string;
  sku: string;
  slug: string;
  category: ProductCategory;
  name: LocalizedText;
  eyebrow: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  specifications: ProductSpecification[];
  applications: LocalizedText[];
  compliance: Array<{claim: ComplianceClaim; status: ComplianceStatus}>;
  commercialTerms: {
    moq: {quantity: number; unit: 'pieces' | 'bottles'};
    mold: {type: 'common'; label: LocalizedText};
  };
  publishStatus: PublishStatus;
  featured: boolean;
  sortOrder: number;
  media?: ProductMedia;
  configurator3d?: ProductConfigurator3d;
  optionGroups: ProductOptionGroup[];
};

const localized = (en: string, zh: string, fr: string, es: string): LocalizedText => ({en, zh, fr, es});

const categoryLabels: Record<ProductCategory, LocalizedText> = {
  'face-masks': localized('Face mask', '面部面膜', 'Masque visage', 'Mascarilla facial'),
  'eye-masks': localized('Eye mask', '眼膜', 'Patchs pour les yeux', 'Parches para ojos'),
  'neck-masks': localized('Neck mask', '颈膜', 'Masque pour le cou', 'Mascarilla para el cuello')
};

export const categories = [
  {slug: 'face-masks', name: localized('Face & cream masks', '面部与膏状面膜', 'Masques visage et crème', 'Mascarillas faciales y en crema')},
  {slug: 'eye-masks', name: localized('Eye masks', '眼膜', 'Patchs pour les yeux', 'Parches para ojos')},
  {slug: 'neck-masks', name: localized('Neck masks', '颈膜', 'Masques pour le cou', 'Mascarillas para el cuello')}
] satisfies Array<{slug: ProductCategory; name: LocalizedText}>;

const rawComplianceClaims: ComplianceClaim[] = ['ISO', 'GMPC', 'FDA', 'MSDS'];
const commonMold = localized('Common mold', '公模', 'Moule standard', 'Molde estándar');
const netWeightLabel = localized('Net weight', '净含量', 'Poids net', 'Peso neto');
const productImageById: Record<string, string> = {
  'GT-FM-001': '/assets/products/masks/gt-fm-001-collagen-face.png',
  'GT-FM-002': '/assets/products/masks/gt-fm-002-centella-face.png',
  'GT-FM-003': '/assets/products/masks/gt-fm-003-copper-peptide-face.png',
  'GT-FM-004': '/assets/products/masks/gt-fm-004-cooling-cream.png',
  'GT-EM-001': '/assets/products/masks/gt-em-001-red-gold-eye.jpg',
  'GT-EM-002': '/assets/products/masks/gt-em-002-astaxanthin-eye.png',
  'GT-EM-003': '/assets/products/masks/gt-em-003-aloe-eye.png',
  'GT-EM-004': '/assets/products/masks/gt-em-004-collagen-eye.png',
  'GT-EM-005': '/assets/products/masks/gt-em-005-gold-eye.png',
  'GT-EM-006': '/assets/products/masks/gt-em-006-pink-eye.png',
  'GT-EM-007': '/assets/products/masks/gt-em-007-collagen-peptide-eye.png',
  'GT-EM-008': '/assets/products/masks/gt-em-008-blue-eye.jpg',
  'GT-NM-001': '/assets/products/masks/gt-nm-001-collagen-neck.png'
};

type ProductSeed = {
  productId: string;
  slug: string;
  category: ProductCategory;
  name: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  applications: LocalizedText[];
  netWeight: string;
  moq: {quantity: number; unit: 'pieces' | 'bottles'};
  featured?: boolean;
  sortOrder: number;
};

function createProduct(seed: ProductSeed): Product {
  const category = categoryLabels[seed.category];
  const image = productImageById[seed.productId];
  return {
    productId: seed.productId,
    sku: `${seed.productId}-V01`,
    slug: seed.slug,
    category: seed.category,
    name: seed.name,
    eyebrow: localized(
      `${category.en} · ${seed.netWeight}`,
      `${category.zh} · ${seed.netWeight}`,
      `${category.fr} · ${seed.netWeight}`,
      `${category.es} · ${seed.netWeight}`
    ),
    description: seed.description,
    highlights: seed.highlights,
    specifications: [{id: 'net-weight', label: netWeightLabel, value: localized(seed.netWeight, seed.netWeight, seed.netWeight, seed.netWeight)}],
    applications: seed.applications,
    compliance: rawComplianceClaims.map((claim) => ({claim, status: 'raw'})),
    commercialTerms: {moq: seed.moq, mold: {type: 'common', label: commonMold}},
    publishStatus: 'draft',
    featured: seed.featured ?? false,
    sortOrder: seed.sortOrder,
    media: {image, imageStatus: image ? 'available' : 'placeholder', alt: seed.name},
    optionGroups: []
  };
}

export const products: Product[] = [
  createProduct({
    productId: 'GT-FM-001',
    slug: 'collagen-elastic-face-mask',
    category: 'face-masks',
    name: localized('Collagen Elastic Face Mask', '胶原弹力面膜', 'Masque visage au collagène pour l’élasticité', 'Mascarilla facial con colágeno para la elasticidad'),
    description: localized(
      'A collagen mask with eight collagen types and four hyaluronic acid types, designed to become thinner and more translucent as it adheres.',
      '融合八种胶原蛋白与四种透明质酸，贴敷过程中膜体逐渐变薄并趋于透明。',
      'Un masque réunissant huit types de collagène et quatre types d’acide hyaluronique, conçu pour s’affiner et devenir plus translucide pendant la pose.',
      'Una mascarilla con ocho tipos de colágeno y cuatro tipos de ácido hialurónico, diseñada para volverse más fina y translúcida durante el uso.'
    ),
    highlights: [localized('Eight collagen types · four hyaluronic acid types', '八种胶原蛋白 · 四种透明质酸', 'Huit types de collagène · quatre acides hyaluroniques', 'Ocho tipos de colágeno · cuatro ácidos hialurónicos')],
    applications: [localized('Firmness and elasticity-focused facial care', '紧致与弹力型面部护理', 'Soin du visage axé sur la fermeté et l’élasticité', 'Cuidado facial enfocado en firmeza y elasticidad')],
    netWeight: '35 g',
    moq: {quantity: 50000, unit: 'pieces'},
    featured: true,
    sortOrder: 1
  }),
  createProduct({
    productId: 'GT-FM-002',
    slug: 'centella-soothing-brightening-mask',
    category: 'face-masks',
    name: localized('Centella Asiatica Soothing Brightening Mask', '积雪草舒缓焕亮面膜', 'Masque apaisant et illuminateur à la centella asiatica', 'Mascarilla calmante e iluminadora de centella asiática'),
    description: localized(
      'A triple Centella asiatica complex with purslane and other plant extracts for soothing care and a brighter-looking complexion.',
      '三重积雪草复合物搭配马齿苋等植物提取物，用于舒缓护理并改善肌肤观感。',
      'Un complexe triple de centella asiatica associé au pourpier et à d’autres extraits végétaux pour un soin apaisant et un teint visiblement plus lumineux.',
      'Un complejo triple de centella asiática con verdolaga y otros extractos vegetales para un cuidado calmante y una apariencia más luminosa.'
    ),
    highlights: [localized('Triple Centella asiatica complex · purslane', '三重积雪草复合物 · 马齿苋', 'Triple complexe de centella asiatica · pourpier', 'Complejo triple de centella asiática · verdolaga')],
    applications: [localized('Soothing care for redness-prone, sensitive-feeling skin', '泛红与敏感不适肌肤的舒缓护理', 'Soin apaisant des peaux sujettes aux rougeurs et à l’inconfort', 'Cuidado calmante para piel con tendencia a rojeces y sensibilidad')],
    netWeight: '35 g',
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 2
  }),
  createProduct({
    productId: 'GT-FM-003',
    slug: 'copper-tripeptide-collagen-mask',
    category: 'face-masks',
    name: localized('Copper Tripeptide-1 Soothing Collagen Brightening Mask', '铜三肽-1舒缓胶原焕亮面膜', 'Masque apaisant et illuminateur au collagène et au tripeptide de cuivre-1', 'Mascarilla calmante e iluminadora con colágeno y tripéptido de cobre-1'),
    description: localized(
      'Copper Tripeptide-1 combines with hyaluronic acid, panthenol and ubiquinol for hydrating, soothing and nourishing facial care.',
      '铜三肽-1搭配透明质酸、泛醇与泛醇醌，用于补水、舒缓与滋养型面部护理。',
      'Le tripeptide de cuivre-1 s’associe à l’acide hyaluronique, au panthénol et à l’ubiquinol pour un soin hydratant, apaisant et nourrissant.',
      'El tripéptido de cobre-1 se combina con ácido hialurónico, pantenol y ubiquinol para un cuidado hidratante, calmante y nutritivo.'
    ),
    highlights: [localized('Copper Tripeptide-1 · hyaluronic acid · panthenol · ubiquinol', '铜三肽-1 · 透明质酸 · 泛醇 · 泛醇醌', 'Tripeptide de cuivre-1 · acide hyaluronique · panthénol · ubiquinol', 'Tripéptido de cobre-1 · ácido hialurónico · pantenol · ubiquinol')],
    applications: [localized('Hydration and soothing care for dry, rough-feeling skin', '干燥粗糙肌肤的补水舒缓护理', 'Soin hydratant et apaisant des peaux sèches et rêches', 'Cuidado hidratante y calmante para piel seca y áspera')],
    netWeight: '35 g',
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 3
  }),
  createProduct({
    productId: 'GT-EM-001',
    slug: 'red-gold-hyaluronic-eye-mask',
    category: 'eye-masks',
    name: localized('Red-Gold Dual-Color Hyaluronic Acid Eye Mask', '红金双色透明质酸眼膜', 'Patchs yeux bicolores rouge et or à l’acide hyaluronique', 'Parches bicolor rojo y dorado con ácido hialurónico'),
    description: localized(
      'A red-and-gold dual-color gel eye mask with hyaluronic acid and soothing plant extracts including purslane.',
      '红金双色凝胶眼膜，结合透明质酸与马齿苋等舒缓型植物提取物。',
      'Des patchs gel bicolores rouge et or à l’acide hyaluronique et aux extraits végétaux apaisants, dont le pourpier.',
      'Parches de gel bicolor rojo y dorado con ácido hialurónico y extractos vegetales calmantes, incluida la verdolaga.'
    ),
    highlights: [localized('Dual-color gel · hyaluronic acid · purslane', '双色凝胶 · 透明质酸 · 马齿苋', 'Gel bicolore · acide hyaluronique · pourpier', 'Gel bicolor · ácido hialurónico · verdolaga')],
    applications: [localized('Moisturizing eye-area care for dryness and fine lines', '针对干燥与细纹的眼周保湿护理', 'Soin hydratant du contour des yeux ciblant sécheresse et ridules', 'Cuidado hidratante del contorno de ojos para sequedad y líneas finas')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    featured: true,
    sortOrder: 4
  }),
  createProduct({
    productId: 'GT-FM-004',
    slug: 'micropore-cooling-cream-mask',
    category: 'face-masks',
    name: localized('Anti-Wrinkle Cream Mask with Micropore Cooling Technology', '微孔冷感抗皱膏状面膜', 'Masque crème anti-rides à technologie rafraîchissante microporeuse', 'Mascarilla en crema antiarrugas con tecnología refrescante microporosa'),
    description: localized(
      'A cream mask formulated with Copper Tripeptide-1, collagen and PDRN, pairing a cooling sensation with care for dry and sensitive skin.',
      '以铜三肽-1、胶原蛋白与PDRN为配方重点，结合冷感体验，为干燥敏感肌提供护理。',
      'Un masque crème au tripeptide de cuivre-1, au collagène et au PDRN, associant une sensation de fraîcheur à un soin des peaux sèches et sensibles.',
      'Una mascarilla en crema con tripéptido de cobre-1, colágeno y PDRN que combina una sensación refrescante con el cuidado de la piel seca y sensible.'
    ),
    highlights: [localized('Copper Tripeptide-1 · collagen · PDRN · cooling feel', '铜三肽-1 · 胶原蛋白 · PDRN · 冷感体验', 'Tripeptide de cuivre-1 · collagène · PDRN · effet frais', 'Tripéptido de cobre-1 · colágeno · PDRN · sensación refrescante')],
    applications: [localized('Cooling, soothing and firming-focused facial care', '冷感、舒缓与紧致型面部护理', 'Soin du visage rafraîchissant, apaisant et axé sur la fermeté', 'Cuidado facial refrescante, calmante y enfocado en la firmeza')],
    netWeight: '29 g',
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 5
  }),
  createProduct({
    productId: 'GT-EM-002',
    slug: 'astaxanthin-microporous-eye-mask',
    category: 'eye-masks',
    name: localized('Astaxanthin Microporous Ice-Guided Eye Mask', '虾青素微孔冰导眼膜', 'Patchs yeux à l’astaxanthine et effet frais microporeux', 'Parches para ojos con astaxantina y efecto frío microporoso'),
    description: localized(
      'An astaxanthin and peptide eye mask with a cooling microporous format for tired-looking eye-area care.',
      '以虾青素与多肽为配方重点，结合微孔冷感形态，用于疲惫眼周护理。',
      'Des patchs à l’astaxanthine et aux peptides, dans un format microporeux rafraîchissant, pour le contour des yeux marqué par la fatigue.',
      'Parches con astaxantina y péptidos en un formato microporoso refrescante para el cuidado del contorno de ojos con aspecto fatigado.'
    ),
    highlights: [localized('Astaxanthin · peptide blend · cooling microporous format', '虾青素 · 多肽复合物 · 微孔冷感形态', 'Astaxanthine · complexe de peptides · format microporeux frais', 'Astaxantina · mezcla de péptidos · formato microporoso refrescante')],
    applications: [localized('Care for puffiness, dark circles and early fine lines', '针对浮肿、黑眼圈与初期细纹的护理', 'Soin ciblant poches, cernes et premières ridules', 'Cuidado para bolsas, ojeras y primeras líneas finas')],
    netWeight: '10.5 g',
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 6
  }),
  createProduct({
    productId: 'GT-NM-001',
    slug: 'collagen-microporous-neck-mask',
    category: 'neck-masks',
    name: localized('Collagen Microporous Anti-Wrinkle Neck Mask', '胶原微孔抗皱颈膜', 'Masque cou anti-rides au collagène microporeux', 'Mascarilla de cuello antiarrugas con colágeno microporoso'),
    description: localized(
      'A cooling microporous neck mask combining collagen with a peptide complex for care focused on neck lines and loss of firmness.',
      '微孔冷感颈膜，结合胶原蛋白与多肽复合物，用于颈纹与松弛感护理。',
      'Un masque cou microporeux rafraîchissant associant collagène et complexe de peptides pour un soin ciblant les lignes du cou et le manque de fermeté.',
      'Una mascarilla de cuello microporosa y refrescante que combina colágeno y un complejo de péptidos para el cuidado de líneas y pérdida de firmeza.'
    ),
    highlights: [localized('Collagen · peptide complex · cooling microporous format', '胶原蛋白 · 多肽复合物 · 微孔冷感形态', 'Collagène · complexe de peptides · format microporeux frais', 'Colágeno · complejo de péptidos · formato microporoso refrescante')],
    applications: [localized('Firming and smoothing-focused neck care', '紧致平滑型颈部护理', 'Soin du cou axé sur la fermeté et le lissage', 'Cuidado del cuello enfocado en firmeza y suavidad')],
    netWeight: '13.5 g',
    moq: {quantity: 50000, unit: 'pieces'},
    featured: true,
    sortOrder: 7
  }),
  createProduct({
    productId: 'GT-EM-003',
    slug: 'aloe-vera-moisturizing-eye-mask',
    category: 'eye-masks',
    name: localized('Aloe Vera Moisturizing Eye Mask', '芦荟保湿眼膜', 'Patchs hydratants pour les yeux à l’aloe vera', 'Parches hidratantes para ojos con aloe vera'),
    description: localized(
      'An eye mask with aloe vera, collagen, hyaluronic acid and marine algae for refreshing, moisturizing eye-area care.',
      '融合芦荟、胶原蛋白、透明质酸与海藻，用于清爽保湿型眼周护理。',
      'Des patchs à l’aloe vera, au collagène, à l’acide hyaluronique et aux algues marines pour un soin frais et hydratant du contour des yeux.',
      'Parches con aloe vera, colágeno, ácido hialurónico y algas marinas para un cuidado refrescante e hidratante del contorno de ojos.'
    ),
    highlights: [localized('Aloe vera · collagen · hyaluronic acid · marine algae', '芦荟 · 胶原蛋白 · 透明质酸 · 海藻', 'Aloe vera · collagène · acide hyaluronique · algues marines', 'Aloe vera · colágeno · ácido hialurónico · algas marinas')],
    applications: [localized('Hydration and puffiness-focused eye care', '保湿与浮肿型眼周护理', 'Soin du contour des yeux axé sur l’hydratation et les poches', 'Cuidado del contorno de ojos enfocado en hidratación y bolsas')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 8
  }),
  createProduct({
    productId: 'GT-EM-004',
    slug: 'collagen-moisturizing-eye-mask',
    category: 'eye-masks',
    name: localized('Collagen Moisturizing Eye Mask', '胶原保湿眼膜', 'Patchs hydratants pour les yeux au collagène', 'Parches hidratantes para ojos con colágeno'),
    description: localized(
      'A dual-color collagen gel eye mask with hyaluronic acid for moisturizing care and a refreshed-looking eye area.',
      '双色胶原凝胶眼膜，搭配透明质酸，用于保湿并改善眼周疲惫观感。',
      'Des patchs gel bicolores au collagène et à l’acide hyaluronique pour hydrater et rafraîchir visiblement le contour des yeux.',
      'Parches de gel bicolor con colágeno y ácido hialurónico para hidratar y mejorar el aspecto del contorno de ojos.'
    ),
    highlights: [localized('Dual-color collagen gel · hyaluronic acid', '双色胶原凝胶 · 透明质酸', 'Gel bicolore au collagène · acide hyaluronique', 'Gel bicolor con colágeno · ácido hialurónico')],
    applications: [localized('Moisturizing care for dry, tired-looking eye areas', '干燥疲惫眼周的保湿护理', 'Soin hydratant des contours des yeux secs et fatigués', 'Cuidado hidratante para contornos de ojos secos y fatigados')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 9
  }),
  createProduct({
    productId: 'GT-EM-005',
    slug: 'gold-collagen-eye-mask',
    category: 'eye-masks',
    name: localized('Gold Collagen Eye Mask', '金色胶原眼膜', 'Patchs yeux dorés au collagène', 'Parches dorados para ojos con colágeno'),
    description: localized(
      'A gold-look eye mask combining a peptide blend with collagen and hyaluronic acid for moisturizing, firming-focused care.',
      '金色外观眼膜，结合多肽复合物、胶原蛋白与透明质酸，用于保湿与紧致型护理。',
      'Des patchs à l’aspect doré associant un complexe de peptides, du collagène et de l’acide hyaluronique pour un soin hydratant axé sur la fermeté.',
      'Parches de aspecto dorado con una mezcla de péptidos, colágeno y ácido hialurónico para un cuidado hidratante enfocado en la firmeza.'
    ),
    highlights: [localized('Gold look · peptide blend · collagen · hyaluronic acid', '金色外观 · 多肽复合物 · 胶原蛋白 · 透明质酸', 'Aspect doré · complexe de peptides · collagène · acide hyaluronique', 'Aspecto dorado · mezcla de péptidos · colágeno · ácido hialurónico')],
    applications: [localized('Care for dark circles, puffiness and fine lines', '针对黑眼圈、浮肿与细纹的眼周护理', 'Soin ciblant cernes, poches et ridules', 'Cuidado para ojeras, bolsas y líneas finas')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 10
  }),
  createProduct({
    productId: 'GT-EM-006',
    slug: 'pink-collagen-peptide-eye-mask',
    category: 'eye-masks',
    name: localized('Pink Collagen Peptide Eye Mask', '粉色胶原肽眼膜', 'Patchs yeux roses au collagène et aux peptides', 'Parches rosas para ojos con colágeno y péptidos'),
    description: localized(
      'A pink eye mask with collagen and hyaluronic acid, positioned for gentle care of tired and sensitive-feeling eye areas.',
      '粉色眼膜，结合胶原蛋白与透明质酸，用于疲惫及敏感不适眼周的温和护理。',
      'Des patchs roses au collagène et à l’acide hyaluronique, conçus pour un soin doux des contours des yeux fatigués et sensibles.',
      'Parches rosas con colágeno y ácido hialurónico para el cuidado suave de contornos de ojos cansados y sensibles.'
    ),
    highlights: [localized('Pink gel · collagen · hyaluronic acid', '粉色凝胶 · 胶原蛋白 · 透明质酸', 'Gel rose · collagène · acide hyaluronique', 'Gel rosa · colágeno · ácido hialurónico')],
    applications: [localized('Gentle care for puffiness, dark circles and fine lines', '针对浮肿、黑眼圈与细纹的温和护理', 'Soin doux ciblant poches, cernes et ridules', 'Cuidado suave para bolsas, ojeras y líneas finas')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 11
  }),
  createProduct({
    productId: 'GT-EM-007',
    slug: 'collagen-peptide-eye-mask',
    category: 'eye-masks',
    name: localized('Collagen Peptide Eye Mask', '胶原肽眼膜', 'Patchs yeux au collagène et aux peptides', 'Parches para ojos con colágeno y péptidos'),
    description: localized(
      'A collagen and purslane eye mask in a gel format designed to hold the essence against the eye area.',
      '胶原蛋白与马齿苋眼膜，采用凝胶形态，使精华贴合眼周。',
      'Des patchs gel au collagène et au pourpier, conçus pour maintenir l’essence au contact du contour des yeux.',
      'Parches de gel con colágeno y verdolaga, diseñados para mantener la esencia en contacto con el contorno de ojos.'
    ),
    highlights: [localized('Collagen · purslane · gel format', '胶原蛋白 · 马齿苋 · 凝胶形态', 'Collagène · pourpier · format gel', 'Colágeno · verdolaga · formato de gel')],
    applications: [localized('Moisturizing and firming-focused care for tired eye areas', '疲惫眼周的保湿紧致型护理', 'Soin hydratant et raffermissant des contours des yeux fatigués', 'Cuidado hidratante y reafirmante para contornos de ojos cansados')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 12
  }),
  createProduct({
    productId: 'GT-EM-008',
    slug: 'blue-moisturizing-eye-mask',
    category: 'eye-masks',
    name: localized('Blue Moisturizing Eye Mask', '蓝色保湿眼膜', 'Patchs hydratants bleus pour les yeux', 'Parches hidratantes azules para ojos'),
    description: localized(
      'A refreshing blue eye mask with caffeine, hyaluronic acid and niacinamide for hydrating and brightening-focused care.',
      '清爽蓝色眼膜，结合咖啡因、透明质酸与烟酰胺，用于补水与焕亮型护理。',
      'Des patchs bleus rafraîchissants à la caféine, à l’acide hyaluronique et à la niacinamide pour un soin hydratant axé sur l’éclat.',
      'Parches azules refrescantes con cafeína, ácido hialurónico y niacinamida para un cuidado hidratante enfocado en la luminosidad.'
    ),
    highlights: [localized('Caffeine · hyaluronic acid · niacinamide', '咖啡因 · 透明质酸 · 烟酰胺', 'Caféine · acide hyaluronique · niacinamide', 'Cafeína · ácido hialurónico · niacinamida')],
    applications: [localized('Care for puffiness, dark circles, fine lines and dryness', '针对浮肿、黑眼圈、细纹与干燥的眼周护理', 'Soin ciblant poches, cernes, ridules et sécheresse', 'Cuidado para bolsas, ojeras, líneas finas y sequedad')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 13
  })
];

const customProductColorPattern = /^#[0-9a-f]{6}$/i;

export function isCustomProductColor(value: string): boolean {
  return customProductColorPattern.test(value);
}

export function resolveProductColor(product: Product, selection: string): string {
  if (isCustomProductColor(selection)) return selection.toLowerCase();
  return product.optionGroups
    .find((group) => group.id === 'color')?.options
    .find((option) => option.id === selection)?.value ?? product.configurator3d?.color ?? '#ded8cc';
}

export function validateCatalog(catalog: Product[]): string[] {
  const errors: string[] = [];
  for (const item of catalog) {
    if (item.optionGroups.length > 6) errors.push(`${item.sku}: too many option groups`);
    if (item.optionGroups.some((group) => group.options.length > 6)) errors.push(`${item.sku}: too many options in a group`);
    if (item.optionGroups.flatMap((group) => group.options).length > 24) errors.push(`${item.sku}: too many option values`);
  }
  return errors;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((item) => item.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((item) => item.slug === slug);
}
