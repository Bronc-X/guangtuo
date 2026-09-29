import {getPublishedProductOverride, publishedContent} from '@/lib/published-content';
import type {PublishedProductOverride} from '@/lib/published-content-schema';
import {hydrogelArabic} from '@/data/hydrogel-arabic';
import {deliveryTranslation} from '@/data/delivery-translations';
import brochureProducts from '@/data/showki-brochure-products.json';
import brochureTranslations from '@/data/showki-brochure-translations.json';
import {brochureZhNames} from '@/data/brochure-zh-names';
import {brochureZhEffects} from '@/data/brochure-zh-effects';

export const catalogLocales = ['en', 'zh', 'fr', 'es', 'ru', 'ar'] as const;

export type CatalogLocale = (typeof catalogLocales)[number];
export type LocalizedText = Record<CatalogLocale, string>;
export type LegacyProductCategory = 'face-masks' | 'eye-masks' | 'specialty-patches';
export type MarketCategory = 'new-arrivals' | 'makeup-remover' | 'facial-cleansing' | 'deep-cleansing' | 'hydration' | 'soothing' | 'anti-aging' | 'dark-spots' | 'mens-skincare' | 'scalp-care' | 'body-care' | 'sun-protection' | 'foundation';
export type ProductCategory = LegacyProductCategory | MarketCategory;
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
  categoryIds?: MarketCategory[];
  productForm?: LocalizedText;
  isNew?: boolean;
  sourcePage?: number;
  name: LocalizedText;
  eyebrow: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  specifications: ProductSpecification[];
  applications: LocalizedText[];
  compliance: Array<{claim: ComplianceClaim; status: ComplianceStatus}>;
  commercialTerms: {
    moq: {quantity: number; unit: 'pieces' | 'bottles'} | null;
    mold: {type: 'common'; label: LocalizedText} | null;
  };
  publishStatus: PublishStatus;
  featured: boolean;
  sortOrder: number;
  media?: ProductMedia;
  configurator3d?: ProductConfigurator3d;
  optionGroups: ProductOptionGroup[];
};

const catalogTranslations: Record<'ru' | 'ar', Record<string, string>> = {
  ru: {
    'Face mask': 'Маска для лица',
    'Eye mask': 'Патчи для глаз',
    'Neck mask': 'Маска для шеи',
    'Face & cream masks': 'Маски для лица и крем-маски',
    'Eye masks': 'Патчи для глаз',
    'Neck masks': 'Маски для шеи',
    'Common mold': 'Стандартная форма',
    'Net weight': 'Масса нетто',
    'Collagen Elastic Face Mask': 'Коллагеновая маска для упругости кожи',
    'A collagen mask with eight collagen types and four hyaluronic acid types, designed to become thinner and more translucent as it adheres.': 'Коллагеновая маска с восемью видами коллагена и четырьмя видами гиалуроновой кислоты, которая становится тоньше и прозрачнее по мере прилегания к коже.',
    'Eight collagen types · four hyaluronic acid types': 'Восемь видов коллагена · четыре вида гиалуроновой кислоты',
    'Firmness and elasticity-focused facial care': 'Уход за лицом для повышения упругости и эластичности',
    'Centella Asiatica Soothing Brightening Mask': 'Успокаивающая осветляющая маска с центеллой азиатской',
    'A triple Centella asiatica complex with purslane and other plant extracts for soothing care and a brighter-looking complexion.': 'Тройной комплекс центеллы азиатской с портулаком и другими растительными экстрактами успокаивает кожу и придаёт ей более сияющий вид.',
    'Triple Centella asiatica complex · purslane': 'Тройной комплекс центеллы азиатской · портулак',
    'Soothing care for redness-prone, sensitive-feeling skin': 'Успокаивающий уход для чувствительной кожи, склонной к покраснению',
    'Copper Tripeptide-1 Soothing Collagen Brightening Mask': 'Успокаивающая осветляющая коллагеновая маска с трипептидом меди-1',
    'Copper Tripeptide-1 combines with hyaluronic acid, panthenol and ubiquinol for hydrating, soothing and nourishing facial care.': 'Трипептид меди-1 в сочетании с гиалуроновой кислотой, пантенолом и убихинолом обеспечивает увлажняющий, успокаивающий и питательный уход.',
    'Copper Tripeptide-1 · hyaluronic acid · panthenol · ubiquinol': 'Трипептид меди-1 · гиалуроновая кислота · пантенол · убихинол',
    'Hydration and soothing care for dry, rough-feeling skin': 'Увлажняющий и успокаивающий уход для сухой и шероховатой кожи',
    'Red-Gold Dual-Color Hyaluronic Acid Eye Mask': 'Двухцветные красно-золотые патчи с гиалуроновой кислотой',
    'A red-and-gold dual-color gel eye mask with hyaluronic acid and soothing plant extracts including purslane.': 'Двухцветные красно-золотые гелевые патчи с гиалуроновой кислотой и успокаивающими растительными экстрактами, включая портулак.',
    'Dual-color gel · hyaluronic acid · purslane': 'Двухцветный гель · гиалуроновая кислота · портулак',
    'Moisturizing eye-area care for dryness and fine lines': 'Увлажняющий уход за областью вокруг глаз при сухости и мелких морщинах',
    'Anti-Wrinkle Cream Mask with Micropore Cooling Technology': 'Крем-маска против морщин с микропористой охлаждающей технологией',
    'A cream mask formulated with Copper Tripeptide-1, collagen and PDRN, pairing a cooling sensation with care for dry and sensitive skin.': 'Крем-маска с трипептидом меди-1, коллагеном и PDRN сочетает охлаждающий эффект с уходом за сухой и чувствительной кожей.',
    'Copper Tripeptide-1 · collagen · PDRN · cooling feel': 'Трипептид меди-1 · коллаген · PDRN · охлаждающий эффект',
    'Cooling, soothing and firming-focused facial care': 'Охлаждающий, успокаивающий и укрепляющий уход за лицом',
    'Astaxanthin Microporous Ice-Guided Eye Mask': 'Микропористые охлаждающие патчи с астаксантином',
    'An astaxanthin and peptide eye mask with a cooling microporous format for tired-looking eye-area care.': 'Охлаждающие микропористые патчи с астаксантином и пептидами для ухода за уставшей областью вокруг глаз.',
    'Astaxanthin · peptide blend · cooling microporous format': 'Астаксантин · комплекс пептидов · охлаждающий микропористый формат',
    'Care for puffiness, dark circles and early fine lines': 'Уход против отёчности, тёмных кругов и первых мелких морщин',
    'Collagen Microporous Anti-Wrinkle Neck Mask': 'Коллагеновая микропористая маска для шеи против морщин',
    'A cooling microporous neck mask combining collagen with a peptide complex for care focused on neck lines and loss of firmness.': 'Охлаждающая микропористая маска для шеи с коллагеном и комплексом пептидов помогает ухаживать за складками и снижением упругости кожи.',
    'Collagen · peptide complex · cooling microporous format': 'Коллаген · комплекс пептидов · охлаждающий микропористый формат',
    'Firming and smoothing-focused neck care': 'Укрепляющий и разглаживающий уход за шеей',
    'Aloe Vera Moisturizing Eye Mask': 'Увлажняющие патчи с алоэ вера',
    'An eye mask with aloe vera, collagen, hyaluronic acid and marine algae for refreshing, moisturizing eye-area care.': 'Патчи с алоэ вера, коллагеном, гиалуроновой кислотой и морскими водорослями освежают и увлажняют область вокруг глаз.',
    'Aloe vera · collagen · hyaluronic acid · marine algae': 'Алоэ вера · коллаген · гиалуроновая кислота · морские водоросли',
    'Hydration and puffiness-focused eye care': 'Увлажняющий уход против отёчности вокруг глаз',
    'Collagen Moisturizing Eye Mask': 'Увлажняющие коллагеновые патчи',
    'A dual-color collagen gel eye mask with hyaluronic acid for moisturizing care and a refreshed-looking eye area.': 'Двухцветные коллагеновые гелевые патчи с гиалуроновой кислотой увлажняют и освежают область вокруг глаз.',
    'Dual-color collagen gel · hyaluronic acid': 'Двухцветный коллагеновый гель · гиалуроновая кислота',
    'Moisturizing care for dry, tired-looking eye areas': 'Увлажняющий уход для сухой и уставшей области вокруг глаз',
    'Gold Collagen Eye Mask': 'Золотые коллагеновые патчи',
    'A gold-look eye mask combining a peptide blend with collagen and hyaluronic acid for moisturizing, firming-focused care.': 'Золотистые патчи с комплексом пептидов, коллагеном и гиалуроновой кислотой обеспечивают увлажняющий и укрепляющий уход.',
    'Gold look · peptide blend · collagen · hyaluronic acid': 'Золотистый вид · комплекс пептидов · коллаген · гиалуроновая кислота',
    'Care for dark circles, puffiness and fine lines': 'Уход против тёмных кругов, отёчности и мелких морщин',
    'Pink Collagen Peptide Eye Mask': 'Розовые коллагеново-пептидные патчи',
    'A pink eye mask with collagen and hyaluronic acid, positioned for gentle care of tired and sensitive-feeling eye areas.': 'Розовые патчи с коллагеном и гиалуроновой кислотой предназначены для деликатного ухода за уставшей и чувствительной областью вокруг глаз.',
    'Pink gel · collagen · hyaluronic acid': 'Розовый гель · коллаген · гиалуроновая кислота',
    'Gentle care for puffiness, dark circles and fine lines': 'Деликатный уход против отёчности, тёмных кругов и мелких морщин',
    'Collagen Peptide Eye Mask': 'Коллагеново-пептидные патчи',
    'A collagen and purslane eye mask in a gel format designed to hold the essence against the eye area.': 'Гелевые патчи с коллагеном и портулаком удерживают эссенцию на коже вокруг глаз.',
    'Collagen · purslane · gel format': 'Коллаген · портулак · гелевый формат',
    'Moisturizing and firming-focused care for tired eye areas': 'Увлажняющий и укрепляющий уход за уставшей областью вокруг глаз',
    'Blue Moisturizing Eye Mask': 'Синие увлажняющие патчи',
    'A refreshing blue eye mask with caffeine, hyaluronic acid and niacinamide for hydrating and brightening-focused care.': 'Освежающие синие патчи с кофеином, гиалуроновой кислотой и ниацинамидом увлажняют и придают коже более сияющий вид.',
    'Caffeine · hyaluronic acid · niacinamide': 'Кофеин · гиалуроновая кислота · ниацинамид',
    'Care for puffiness, dark circles, fine lines and dryness': 'Уход против отёчности, тёмных кругов, мелких морщин и сухости'
  },
  ar: {
    ...hydrogelArabic,
    'Face mask': 'قناع للوجه',
    'Eye mask': 'لصقات للعين',
    'Neck mask': 'قناع للرقبة',
    'Face & cream masks': 'أقنعة الوجه والأقنعة الكريمية',
    'Eye masks': 'لصقات العين',
    'Neck masks': 'أقنعة الرقبة',
    'Common mold': 'قالب قياسي',
    'Net weight': 'الوزن الصافي',
    'Collagen Elastic Face Mask': 'قناع الكولاجين لمرونة البشرة',
    'A collagen mask with eight collagen types and four hyaluronic acid types, designed to become thinner and more translucent as it adheres.': 'قناع كولاجين يحتوي على ثمانية أنواع من الكولاجين وأربعة أنواع من حمض الهيالورونيك، ويصبح أرق وأكثر شفافية كلما التصق بالبشرة.',
    'Eight collagen types · four hyaluronic acid types': 'ثمانية أنواع من الكولاجين · أربعة أنواع من حمض الهيالورونيك',
    'Firmness and elasticity-focused facial care': 'عناية بالوجه تركز على التماسك والمرونة',
    'Centella Asiatica Soothing Brightening Mask': 'قناع مهدئ ومشرق بسنتيلا أسياتيكا',
    'A triple Centella asiatica complex with purslane and other plant extracts for soothing care and a brighter-looking complexion.': 'مركب ثلاثي من سنتيلا أسياتيكا مع الرجلة ومستخلصات نباتية أخرى لتهدئة البشرة ومنحها مظهراً أكثر إشراقاً.',
    'Triple Centella asiatica complex · purslane': 'مركب ثلاثي من سنتيلا أسياتيكا · الرجلة',
    'Soothing care for redness-prone, sensitive-feeling skin': 'عناية مهدئة للبشرة الحساسة والمعرضة للاحمرار',
    'Copper Tripeptide-1 Soothing Collagen Brightening Mask': 'قناع كولاجين مهدئ ومشرق بثلاثي ببتيد النحاس-1',
    'Copper Tripeptide-1 combines with hyaluronic acid, panthenol and ubiquinol for hydrating, soothing and nourishing facial care.': 'يجمع ثلاثي ببتيد النحاس-1 بين حمض الهيالورونيك والبانثينول واليوبيكوينول لتوفير عناية مرطبة ومهدئة ومغذية للوجه.',
    'Copper Tripeptide-1 · hyaluronic acid · panthenol · ubiquinol': 'ثلاثي ببتيد النحاس-1 · حمض الهيالورونيك · بانثينول · يوبيكوينول',
    'Hydration and soothing care for dry, rough-feeling skin': 'عناية مرطبة ومهدئة للبشرة الجافة والخشنة',
    'Red-Gold Dual-Color Hyaluronic Acid Eye Mask': 'لصقات عين ثنائية اللون بالأحمر والذهبي مع حمض الهيالورونيك',
    'A red-and-gold dual-color gel eye mask with hyaluronic acid and soothing plant extracts including purslane.': 'لصقات جل ثنائية اللون بالأحمر والذهبي مع حمض الهيالورونيك ومستخلصات نباتية مهدئة تشمل الرجلة.',
    'Dual-color gel · hyaluronic acid · purslane': 'جل ثنائي اللون · حمض الهيالورونيك · الرجلة',
    'Moisturizing eye-area care for dryness and fine lines': 'عناية مرطبة لمنطقة العين للجفاف والخطوط الدقيقة',
    'Anti-Wrinkle Cream Mask with Micropore Cooling Technology': 'قناع كريمي مضاد للتجاعيد بتقنية التبريد الدقيقة المسام',
    'A cream mask formulated with Copper Tripeptide-1, collagen and PDRN, pairing a cooling sensation with care for dry and sensitive skin.': 'قناع كريمي بثلاثي ببتيد النحاس-1 والكولاجين وPDRN يجمع بين الإحساس المنعش والعناية بالبشرة الجافة والحساسة.',
    'Copper Tripeptide-1 · collagen · PDRN · cooling feel': 'ثلاثي ببتيد النحاس-1 · كولاجين · PDRN · إحساس منعش',
    'Cooling, soothing and firming-focused facial care': 'عناية بالوجه تركز على التبريد والتهدئة والتماسك',
    'Astaxanthin Microporous Ice-Guided Eye Mask': 'لصقات عين مبردة دقيقة المسام بالأستازانتين',
    'An astaxanthin and peptide eye mask with a cooling microporous format for tired-looking eye-area care.': 'لصقات عين بالأستازانتين والببتيدات بتصميم مبرد دقيق المسام للعناية بمظهر منطقة العين المتعب.',
    'Astaxanthin · peptide blend · cooling microporous format': 'أستازانتين · مزيج ببتيدات · تصميم مبرد دقيق المسام',
    'Care for puffiness, dark circles and early fine lines': 'عناية بالانتفاخ والهالات الداكنة والخطوط الدقيقة المبكرة',
    'Collagen Microporous Anti-Wrinkle Neck Mask': 'قناع رقبة كولاجين دقيق المسام مضاد للتجاعيد',
    'A cooling microporous neck mask combining collagen with a peptide complex for care focused on neck lines and loss of firmness.': 'قناع رقبة مبرد دقيق المسام يجمع الكولاجين مع مركب ببتيدات للعناية بخطوط الرقبة وفقدان التماسك.',
    'Collagen · peptide complex · cooling microporous format': 'كولاجين · مركب ببتيدات · تصميم مبرد دقيق المسام',
    'Firming and smoothing-focused neck care': 'عناية بالرقبة تركز على التماسك والتنعيم',
    'Aloe Vera Moisturizing Eye Mask': 'لصقات عين مرطبة بالألوفيرا',
    'An eye mask with aloe vera, collagen, hyaluronic acid and marine algae for refreshing, moisturizing eye-area care.': 'لصقات عين بالألوفيرا والكولاجين وحمض الهيالورونيك والطحالب البحرية لإنعاش وترطيب منطقة العين.',
    'Aloe vera · collagen · hyaluronic acid · marine algae': 'ألوفيرا · كولاجين · حمض الهيالورونيك · طحالب بحرية',
    'Hydration and puffiness-focused eye care': 'عناية مرطبة لمنطقة العين تركز على الانتفاخ',
    'Collagen Moisturizing Eye Mask': 'لصقات عين مرطبة بالكولاجين',
    'A dual-color collagen gel eye mask with hyaluronic acid for moisturizing care and a refreshed-looking eye area.': 'لصقات جل كولاجين ثنائية اللون مع حمض الهيالورونيك لترطيب منطقة العين ومنحها مظهراً منتعشاً.',
    'Dual-color collagen gel · hyaluronic acid': 'جل كولاجين ثنائي اللون · حمض الهيالورونيك',
    'Moisturizing care for dry, tired-looking eye areas': 'عناية مرطبة لمنطقة العين الجافة والمتعبة',
    'Gold Collagen Eye Mask': 'لصقات عين ذهبية بالكولاجين',
    'A gold-look eye mask combining a peptide blend with collagen and hyaluronic acid for moisturizing, firming-focused care.': 'لصقات عين بمظهر ذهبي تجمع مزيجاً من الببتيدات مع الكولاجين وحمض الهيالورونيك لعناية مرطبة تركز على التماسك.',
    'Gold look · peptide blend · collagen · hyaluronic acid': 'مظهر ذهبي · مزيج ببتيدات · كولاجين · حمض الهيالورونيك',
    'Care for dark circles, puffiness and fine lines': 'عناية بالهالات الداكنة والانتفاخ والخطوط الدقيقة',
    'Pink Collagen Peptide Eye Mask': 'لصقات عين وردية بالكولاجين والببتيدات',
    'A pink eye mask with collagen and hyaluronic acid, positioned for gentle care of tired and sensitive-feeling eye areas.': 'لصقات عين وردية بالكولاجين وحمض الهيالورونيك لعناية لطيفة بمنطقة العين المتعبة والحساسة.',
    'Pink gel · collagen · hyaluronic acid': 'جل وردي · كولاجين · حمض الهيالورونيك',
    'Gentle care for puffiness, dark circles and fine lines': 'عناية لطيفة بالانتفاخ والهالات الداكنة والخطوط الدقيقة',
    'Collagen Peptide Eye Mask': 'لصقات عين بالكولاجين والببتيدات',
    'A collagen and purslane eye mask in a gel format designed to hold the essence against the eye area.': 'لصقات جل بالكولاجين والرجلة مصممة لإبقاء الخلاصة ملاصقة لمنطقة العين.',
    'Collagen · purslane · gel format': 'كولاجين · رجلة · تصميم جل',
    'Moisturizing and firming-focused care for tired eye areas': 'عناية مرطبة ومشددة لمنطقة العين المتعبة',
    'Blue Moisturizing Eye Mask': 'لصقات عين زرقاء مرطبة',
    'A refreshing blue eye mask with caffeine, hyaluronic acid and niacinamide for hydrating and brightening-focused care.': 'لصقات عين زرقاء منعشة بالكافيين وحمض الهيالورونيك والنياسيناميد لعناية تركز على الترطيب والإشراق.',
    'Caffeine · hyaluronic acid · niacinamide': 'كافيين · حمض الهيالورونيك · نياسيناميد',
    'Care for puffiness, dark circles, fine lines and dryness': 'عناية بالانتفاخ والهالات الداكنة والخطوط الدقيقة والجفاف'
  }
};

const localized = (en: string, zh: string, fr: string, es: string): LocalizedText => ({
  en,
  zh,
  fr,
  es,
  ru: catalogTranslations.ru[en] ?? deliveryTranslation(en, 'ru') ?? en,
  ar: catalogTranslations.ar[en] ?? en
});

const categoryLabels: Record<LegacyProductCategory, LocalizedText> = {
  'face-masks': localized('Face mask', '面部面膜', 'Masque visage', 'Mascarilla facial'),
  'eye-masks': localized('Eye mask', '眼膜', 'Patchs pour les yeux', 'Parches para ojos'),
  'specialty-patches': localized('Specialty patch', '局部护理贴', 'Patch ciblé', 'Parche localizado')
};

export const legacyCategories = [
  {slug: 'face-masks', name: localized('Face & cream masks', '面部与膏状面膜', 'Masques visage et crème', 'Mascarillas faciales y en crema')},
  {slug: 'eye-masks', name: localized('Eye masks', '眼膜', 'Patchs pour les yeux', 'Parches para ojos')},
  {slug: 'specialty-patches', name: localized('Specialty patches', '其他局部膜贴', 'Patchs ciblés', 'Parches localizados')}
] satisfies Array<{slug: LegacyProductCategory; name: LocalizedText}>;

export const categories: Array<{slug: MarketCategory; name: LocalizedText}> = [
  {slug: 'new-arrivals', name: localized('New arrivals', '新品速递', 'Nouveautés', 'Novedades')},
  {slug: 'makeup-remover', name: localized('Makeup remover', '基础卸妆', 'Démaquillage', 'Desmaquillado')},
  {slug: 'facial-cleansing', name: localized('Facial cleansing', '科学洁面', 'Nettoyage du visage', 'Limpieza facial')},
  {slug: 'deep-cleansing', name: localized('Deep cleansing', '深层清洁', 'Nettoyage profond', 'Limpieza profunda')},
  {slug: 'hydration', name: localized('Hydration & moisturizing', '补水保湿', 'Hydratation', 'Hidratación')},
  {slug: 'soothing', name: localized('Soothing & repairing', '舒缓修护', 'Apaisement et réparation', 'Calma y reparación')},
  {slug: 'anti-aging', name: localized('Anti-aging', '抗衰护理', 'Soin anti-âge', 'Cuidado antiedad')},
  {slug: 'dark-spots', name: localized('Dark spot correction', '淡斑焕亮', 'Correction des taches', 'Corrección de manchas')},
  {slug: 'mens-skincare', name: localized("Men's skincare", '男士护肤', 'Soin pour hommes', 'Cuidado masculino')},
  {slug: 'scalp-care', name: localized('Scalp care', '头皮养护', 'Soin du cuir chevelu', 'Cuidado del cuero cabelludo')},
  {slug: 'body-care', name: localized('Body care', '身体护理', 'Soin du corps', 'Cuidado corporal')},
  {slug: 'sun-protection', name: localized('Sun protection', '防晒护理', 'Protection solaire', 'Protección solar')},
  {slug: 'foundation', name: localized('Foundation & makeup base', '底妆系列', 'Teint et base', 'Base de maquillaje')}
];

const marketCategoryRuAr: Record<MarketCategory, {ru: string; ar: string}> = {
  'new-arrivals': {ru: 'Новинки', ar: 'منتجات جديدة'},
  'makeup-remover': {ru: 'Средства для снятия макияжа', ar: 'إزالة المكياج'},
  'facial-cleansing': {ru: 'Очищение лица', ar: 'تنظيف الوجه'},
  'deep-cleansing': {ru: 'Глубокое очищение', ar: 'التنظيف العميق'},
  hydration: {ru: 'Увлажнение', ar: 'الترطيب'},
  soothing: {ru: 'Успокаивающий и восстанавливающий уход', ar: 'التهدئة والإصلاح'},
  'anti-aging': {ru: 'Антивозрастной уход', ar: 'العناية بمقاومة علامات التقدم في السن'},
  'dark-spots': {ru: 'Уход против пигментации', ar: 'العناية بالتصبغات'},
  'mens-skincare': {ru: 'Мужской уход', ar: 'العناية بالبشرة للرجال'},
  'scalp-care': {ru: 'Уход за кожей головы', ar: 'العناية بفروة الرأس'},
  'body-care': {ru: 'Уход за телом', ar: 'العناية بالجسم'},
  'sun-protection': {ru: 'Солнцезащитный уход', ar: 'الحماية من الشمس'},
  foundation: {ru: 'Тональные средства и база', ar: 'كريم الأساس وقاعدة المكياج'}
};
for (const category of categories) Object.assign(category.name, marketCategoryRuAr[category.slug]);

const marketByLegacyId: Record<string, MarketCategory[]> = {
  'GT-FM-001': ['anti-aging', 'hydration'], 'GT-FM-002': ['soothing', 'dark-spots'],
  'GT-FM-003': ['soothing', 'dark-spots'], 'GT-FM-004': ['anti-aging'],
  'GT-FM-005': ['hydration'], 'GT-EM-001': ['hydration'],
  'GT-EM-002': ['anti-aging'], 'GT-EM-003': ['hydration'],
  'GT-EM-004': ['hydration'], 'GT-EM-005': ['anti-aging'],
  'GT-EM-006': ['anti-aging'], 'GT-EM-007': ['anti-aging'],
  'GT-EM-008': ['hydration'], 'GT-EM-009': ['hydration'],
  'GT-NM-001': ['anti-aging'], 'GT-LP-001': ['hydration'],
  'GT-FP-001': ['anti-aging'], 'GT-NP-001': ['anti-aging'],
  'GT-VL-001': ['anti-aging'], 'GT-FE-001': ['anti-aging'],
  'GT-JM-001': ['anti-aging']
};

export function productInCategory(product: Product, category: ProductCategory): boolean {
  return product.category === category || (product.categoryIds?.includes(category as MarketCategory) ?? false)
    || (category === 'new-arrivals' && Boolean(product.isNew));
}

const rawComplianceClaims: ComplianceClaim[] = ['ISO', 'GMPC', 'FDA', 'MSDS'];
const commonMold = localized('Common mold', '公模', 'Moule standard', 'Molde estándar');
const netWeightLabel = localized('Net weight', '净含量', 'Poids net', 'Peso neto');
const packFormatLabel = localized('Format', '产品形态', 'Format', 'Formato');
const productImageById: Record<string, string> = {
  'GT-FM-001': '/assets/products/hydrogel/gallery/collagen-face/collagen-face-1.jpg',
  'GT-FM-002': '/assets/products/hydrogel/gallery/centella-face/centella-face-1.jpg',
  'GT-FM-003': '/assets/products/masks/gt-fm-003-copper-peptide-face-hd.webp',
  'GT-FM-004': '/assets/products/masks/gt-fm-004-cooling-cream-hd.webp',
  'GT-FM-005': '/assets/products/hydrogel/formats/face-polymer-hd.webp',
  'GT-EM-001': '/assets/products/hydrogel/gallery/dual-eye/dual-eye-1.jpg',
  'GT-EM-002': '/assets/products/hydrogel/gallery/micropore-eye/micropore-eye-1.jpg',
  'GT-EM-003': '/assets/products/hydrogel/gallery/aloe-eye/aloe-eye-1.jpg',
  'GT-EM-004': '/assets/products/hydrogel/gallery/collagen-eye/collagen-eye-1.jpg',
  'GT-EM-005': '/assets/products/hydrogel/gallery/gold-eye/gold-eye-1.jpg',
  'GT-EM-006': '/assets/products/hydrogel/gallery/pink-eye/pink-eye-1.jpg',
  'GT-EM-007': '/assets/products/masks/gt-em-007-collagen-peptide-eye-hd.webp',
  'GT-EM-008': '/assets/products/masks/gt-em-008-blue-eye-hd.webp',
  'GT-EM-009': '/assets/products/hydrogel/formats/eye-polymer-cold-compress-hd.webp',
  'GT-NM-001': '/assets/products/masks/gt-nm-001-collagen-neck-hd.webp',
  'GT-LP-001': '/assets/products/hydrogel/formats/specialty-lip-individual-hd.webp',
  'GT-FP-001': '/assets/products/hydrogel/formats/specialty-forehead-hd.webp',
  'GT-NP-001': '/assets/products/hydrogel/formats/specialty-nasolabial-hd.webp',
  'GT-VL-001': '/assets/products/hydrogel/formats/specialty-v-line-hd.webp',
  'GT-FE-001': '/assets/products/hydrogel/formats/specialty-forehead-eye-hd.webp',
  'GT-JM-001': '/assets/products/hydrogel/formats/specialty-double-ear-hook-hd.webp'
};

const productGalleryById: Partial<Record<string, string[]>> = {
  'GT-FM-001': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/collagen-face/collagen-face-${index}.jpg`),
  'GT-FM-002': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/centella-face/centella-face-${index}.jpg`),
  'GT-EM-001': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/dual-eye/dual-eye-${index}.jpg`),
  'GT-EM-002': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/micropore-eye/micropore-eye-${index}.jpg`),
  'GT-EM-003': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/aloe-eye/aloe-eye-${index}.jpg`),
  'GT-EM-004': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/collagen-eye/collagen-eye-${index}.jpg`),
  'GT-EM-005': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/gold-eye/gold-eye-${index}.jpg`),
  'GT-EM-006': [1, 2, 3, 4].map((index) => `/assets/products/hydrogel/gallery/pink-eye/pink-eye-${index}.jpg`)
};

type ProductSeed = {
  productId: string;
  slug: string;
  category: LegacyProductCategory;
  name: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  applications: LocalizedText[];
  netWeight: string;
  packFormat?: LocalizedText;
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
    specifications: [
      {id: 'net-weight', label: netWeightLabel, value: localized(seed.netWeight, seed.netWeight, seed.netWeight, seed.netWeight)},
      ...(seed.packFormat ? [{id: 'pack-format', label: packFormatLabel, value: seed.packFormat}] : [])
    ],
    applications: seed.applications,
    compliance: rawComplianceClaims.map((claim) => ({claim, status: 'raw'})),
    commercialTerms: {moq: seed.moq, mold: {type: 'common', label: commonMold}},
    publishStatus: 'draft',
    featured: seed.featured ?? false,
    sortOrder: seed.sortOrder,
    media: {image, gallery: productGalleryById[seed.productId], imageStatus: image ? 'available' : 'placeholder', alt: seed.name},
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
      '八种胶原蛋白搭配四种透明质酸，让弹润保湿的卖点一目了然。膜体贴敷后逐渐变薄、趋于透明，消费者既能感受贴合，也能看见使用过程中的变化。',
      'Un masque réunissant huit types de collagène et quatre types d’acide hyaluronique, conçu pour s’affiner et devenir plus translucide pendant la pose.',
      'Una mascarilla con ocho tipos de colágeno y cuatro tipos de ácido hialurónico, diseñada para volverse más fina y translúcida durante el uso.'
    ),
    highlights: [localized('Eight collagen types · four hyaluronic acid types', '八种胶原蛋白 · 四种透明质酸', 'Huit types de collagène · quatre acides hyaluroniques', 'Ocho tipos de colágeno · cuatro ácidos hialurónicos')],
    applications: [localized('Firmness and elasticity-focused facial care', '保湿、弹润与紧致感面部护理', 'Soin du visage axé sur la fermeté et l’élasticité', 'Cuidado facial enfocado en firmeza y elasticidad')],
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
      '三重积雪草复合物搭配马齿苋等植物提取物，主打温和舒缓与清透水润，适合打造让消费者容易理解的日常维稳面膜。',
      'Un complexe triple de centella asiatica associé au pourpier et à d’autres extraits végétaux pour un soin apaisant et un teint visiblement plus lumineux.',
      'Un complejo triple de centella asiática con verdolaga y otros extractos vegetales para un cuidado calmante y una apariencia más luminosa.'
    ),
    highlights: [localized('Triple Centella asiatica complex · purslane', '三重积雪草复合物 · 马齿苋', 'Triple complexe de centella asiatica · pourpier', 'Complejo triple de centella asiática · verdolaga')],
    applications: [localized('Soothing care for redness-prone, sensitive-feeling skin', '温和舒缓、维稳与清透水润面部护理', 'Soin apaisant des peaux sujettes aux rougeurs et à l’inconfort', 'Cuidado calmante para piel con tendencia a rojeces y sensibilidad')],
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
      '铜三肽-1搭配透明质酸、泛醇与泛醇醌，既有醒目的成分看点，也有滋润肤感，适合主打干燥、粗糙肌肤的补水舒缓护理。',
      'Le tripeptide de cuivre-1 s’associe à l’acide hyaluronique, au panthénol et à l’ubiquinol pour un soin hydratant, apaisant et nourrissant.',
      'El tripéptido de cobre-1 se combina con ácido hialurónico, pantenol y ubiquinol para un cuidado hidratante, calmante y nutritivo.'
    ),
    highlights: [localized('Copper Tripeptide-1 · hyaluronic acid · panthenol · ubiquinol', '铜三肽-1 · 透明质酸 · 泛醇 · 泛醇醌', 'Tripeptide de cuivre-1 · acide hyaluronique · panthénol · ubiquinol', 'Tripéptido de cobre-1 · ácido hialurónico · pantenol · ubiquinol')],
    applications: [localized('Hydration and soothing care for dry, rough-feeling skin', '干燥、粗糙肤感的补水舒缓与修护护理', 'Soin hydratant et apaisant des peaux sèches et rêches', 'Cuidado hidratante y calmante para piel seca y áspera')],
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
      '红金双色凝胶在瓶内格外醒目，透明质酸搭配马齿苋等植物提取物，让产品同时拥有好看的外观与容易理解的保湿舒缓卖点。',
      'Des patchs gel bicolores rouge et or à l’acide hyaluronique et aux extraits végétaux apaisants, dont le pourpier.',
      'Parches de gel bicolor rojo y dorado con ácido hialurónico y extractos vegetales calmantes, incluida la verdolaga.'
    ),
    highlights: [localized('Dual-color gel · hyaluronic acid · purslane', '双色凝胶 · 透明质酸 · 马齿苋', 'Gel bicolore · acide hyaluronique · pourpier', 'Gel bicolor · ácido hialurónico · verdolaga')],
    applications: [localized('Moisturizing eye-area care for dryness and fine lines', '兼顾瓶装颜值、保湿与舒缓感的眼周护理', 'Soin hydratant du contour des yeux ciblant sécheresse et ridules', 'Cuidado hidratante del contorno de ojos para sequedad y líneas finas')],
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
      '铜三肽-1、胶原蛋白与 PDRN 构成鲜明的成分组合，冷感膏状质地让贴敷体验更有记忆点，并兼顾舒缓、滋养与紧致感。',
      'Un masque crème au tripeptide de cuivre-1, au collagène et au PDRN, associant une sensation de fraîcheur à un soin des peaux sèches et sensibles.',
      'Una mascarilla en crema con tripéptido de cobre-1, colágeno y PDRN que combina una sensación refrescante con el cuidado de la piel seca y sensible.'
    ),
    highlights: [localized('Copper Tripeptide-1 · collagen · PDRN · cooling feel', '铜三肽-1 · 胶原蛋白 · PDRN · 冷感体验', 'Tripeptide de cuivre-1 · collagène · PDRN · effet frais', 'Tripéptido de cobre-1 · colágeno · PDRN · sensación refrescante')],
    applications: [localized('Cooling, soothing and firming-focused facial care', '冷感舒缓、滋养与紧致感面部护理', 'Soin du visage rafraîchissant, apaisant et axé sur la fermeté', 'Cuidado facial refrescante, calmante y enfocado en la firmeza')],
    netWeight: '29 g',
    moq: {quantity: 10000, unit: 'pieces'},
    sortOrder: 5
  }),
  createProduct({
    productId: 'GT-EM-002',
    slug: 'astaxanthin-microporous-eye-mask',
    category: 'eye-masks',
    name: localized('Astaxanthin Microporous Ice-Guided Eye Mask', '虾青素微孔冰导眼膜', 'Patchs yeux à l’astaxanthine et effet frais microporeux', 'Parches para ojos con astaxantina y efecto frío microporoso'),
    description: localized(
      'An astaxanthin and peptide eye mask with a cooling microporous format for tired-looking eye-area care.',
      '虾青素与多肽组合搭配微孔冷感膜型，让成分故事与清凉贴合的眼周体验同时被感受到。',
      'Des patchs à l’astaxanthine et aux peptides, dans un format microporeux rafraîchissant, pour le contour des yeux marqué par la fatigue.',
      'Parches con astaxantina y péptidos en un formato microporoso refrescante para el cuidado del contorno de ojos con aspecto fatigado.'
    ),
    highlights: [localized('Astaxanthin · peptide blend · cooling microporous format', '虾青素 · 多肽复合物 · 微孔冷感形态', 'Astaxanthine · complexe de peptides · format microporeux frais', 'Astaxantina · mezcla de péptidos · formato microporoso refrescante')],
    applications: [localized('Care for puffiness, dark circles and early fine lines', '疲惫、浮肿感、暗沉感与初期细纹眼周护理', 'Soin ciblant poches, cernes et premières ridules', 'Cuidado para bolsas, ojeras y primeras líneas finas')],
    netWeight: '10.5 g',
    moq: {quantity: 10000, unit: 'pieces'},
    sortOrder: 6
  }),
  createProduct({
    productId: 'GT-NM-001',
    slug: 'collagen-microporous-neck-mask',
    category: 'specialty-patches',
    name: localized('Collagen Microporous Anti-Wrinkle Neck Mask', '胶原微孔抗皱颈膜', 'Masque cou anti-rides au collagène microporeux', 'Mascarilla de cuello antiarrugas con colágeno microporoso'),
    description: localized(
      'A cooling microporous neck mask combining collagen with a peptide complex for care focused on neck lines and loss of firmness.',
      '微孔冷感膜型贴合颈部轮廓，胶原蛋白与多肽复合物强化成分看点，让颈部护理同时拥有清凉感、包裹感与紧致感。',
      'Un masque cou microporeux rafraîchissant associant collagène et complexe de peptides pour un soin ciblant les lignes du cou et le manque de fermeté.',
      'Una mascarilla de cuello microporosa y refrescante que combina colágeno y un complejo de péptidos para el cuidado de líneas y pérdida de firmeza.'
    ),
    highlights: [localized('Collagen · peptide complex · cooling microporous format', '胶原蛋白 · 多肽复合物 · 微孔冷感形态', 'Collagène · complexe de peptides · format microporeux frais', 'Colágeno · complejo de péptidos · formato microporoso refrescante')],
    applications: [localized('Firming and smoothing-focused neck care', '颈部紧致、平滑与冷感护理', 'Soin du cou axé sur la fermeté et le lissage', 'Cuidado del cuello enfocado en firmeza y suavidad')],
    netWeight: '13.5 g',
    moq: {quantity: 10000, unit: 'pieces'},
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
      '芦荟、胶原蛋白、透明质酸与海藻组成消费者熟悉的保湿配方；清爽凝胶配合瓶装取用，适合日常眼周护理。',
      'Des patchs à l’aloe vera, au collagène, à l’acide hyaluronique et aux algues marines pour un soin frais et hydratant du contour des yeux.',
      'Parches con aloe vera, colágeno, ácido hialurónico y algas marinas para un cuidado refrescante e hidratante del contorno de ojos.'
    ),
    highlights: [localized('Aloe vera · collagen · hyaluronic acid · marine algae', '芦荟 · 胶原蛋白 · 透明质酸 · 海藻', 'Aloe vera · collagène · acide hyaluronique · algues marines', 'Aloe vera · colágeno · ácido hialurónico · algas marinas')],
    applications: [localized('Hydration and puffiness-focused eye care', '日常补水、清爽与眼周浮肿感护理', 'Soin du contour des yeux axé sur l’hydratation et les poches', 'Cuidado del contorno de ojos enfocado en hidratación y bolsas')],
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
      '双色胶原凝胶搭配透明质酸，放在瓶内就有直观辨识度，也让日常眼周护理的保湿卖点更容易被消费者理解。',
      'Des patchs gel bicolores au collagène et à l’acide hyaluronique pour hydrater et rafraîchir visiblement le contour des yeux.',
      'Parches de gel bicolor con colágeno y ácido hialurónico para hidratar y mejorar el aspecto del contorno de ojos.'
    ),
    highlights: [localized('Dual-color collagen gel · hyaluronic acid', '双色胶原凝胶 · 透明质酸', 'Gel bicolore au collagène · acide hyaluronique', 'Gel bicolor con colágeno · ácido hialurónico')],
    applications: [localized('Moisturizing care for dry, tired-looking eye areas', '干燥、疲惫眼周的日常保湿护理', 'Soin hydratant des contours des yeux secs et fatigués', 'Cuidado hidratante para contornos de ojos secos y fatigados')],
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
      '金色凝胶搭配多肽复合物、胶原蛋白与透明质酸，视觉更显精致，也为眼周护理带来明确的保湿与紧致感卖点。',
      'Des patchs à l’aspect doré associant un complexe de peptides, du collagène et de l’acide hyaluronique pour un soin hydratant axé sur la fermeté.',
      'Parches de aspecto dorado con una mezcla de péptidos, colágeno y ácido hialurónico para un cuidado hidratante enfocado en la firmeza.'
    ),
    highlights: [localized('Gold look · peptide blend · collagen · hyaluronic acid', '金色外观 · 多肽复合物 · 胶原蛋白 · 透明质酸', 'Aspect doré · complexe de peptides · collagène · acide hyaluronique', 'Aspecto dorado · mezcla de péptidos · colágeno · ácido hialurónico')],
    applications: [localized('Care for dark circles, puffiness and fine lines', '暗沉感、浮肿感与细纹眼周护理', 'Soin ciblant cernes, poches et ridules', 'Cuidado para ojeras, bolsas y líneas finas')],
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
      '柔和粉色凝胶搭配胶原蛋白与透明质酸，外观亲和、成分好懂，适合打造温和清新的日常保湿眼膜。',
      'Des patchs roses au collagène et à l’acide hyaluronique, conçus pour un soin doux des contours des yeux fatigués et sensibles.',
      'Parches rosas con colágeno y ácido hialurónico para el cuidado suave de contornos de ojos cansados y sensibles.'
    ),
    highlights: [localized('Pink gel · collagen · hyaluronic acid', '粉色凝胶 · 胶原蛋白 · 透明质酸', 'Gel rose · collagène · acide hyaluronique', 'Gel rosa · colágeno · ácido hialurónico')],
    applications: [localized('Gentle care for puffiness, dark circles and fine lines', '温和保湿与疲惫眼周护理', 'Soin doux ciblant poches, cernes et ridules', 'Cuidado suave para bolsas, ojeras y líneas finas')],
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
      '胶原蛋白搭配马齿苋，凝胶膜体柔软贴合眼周并承载精华，让保湿与紧致感不只停留在成分名称上。',
      'Des patchs gel au collagène et au pourpier, conçus pour maintenir l’essence au contact du contour des yeux.',
      'Parches de gel con colágeno y verdolaga, diseñados para mantener la esencia en contacto con el contorno de ojos.'
    ),
    highlights: [localized('Collagen · purslane · gel format', '胶原蛋白 · 马齿苋 · 凝胶形态', 'Collagène · pourpier · format gel', 'Colágeno · verdolaga · formato de gel')],
    applications: [localized('Moisturizing and firming-focused care for tired eye areas', '保湿、紧致感与疲惫眼周护理', 'Soin hydratant et raffermissant des contours des yeux fatigués', 'Cuidado hidratante y reafirmante para contornos de ojos cansados')],
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
      '清爽蓝色凝胶搭配咖啡因、透明质酸与烟酰胺，颜色醒目、成分熟悉，适合主打补水与焕亮感的眼周护理。',
      'Des patchs bleus rafraîchissants à la caféine, à l’acide hyaluronique et à la niacinamide pour un soin hydratant axé sur l’éclat.',
      'Parches azules refrescantes con cafeína, ácido hialurónico y niacinamida para un cuidado hidratante enfocado en la luminosidad.'
    ),
    highlights: [localized('Caffeine · hyaluronic acid · niacinamide', '咖啡因 · 透明质酸 · 烟酰胺', 'Caféine · acide hyaluronique · niacinamide', 'Cafeína · ácido hialurónico · niacinamida')],
    applications: [localized('Care for puffiness, dark circles, fine lines and dryness', '浮肿感、暗沉感、细纹与干燥眼周护理', 'Soin ciblant poches, cernes, ridules et sécheresse', 'Cuidado para bolsas, ojeras, líneas finas y sequedad')],
    netWeight: '100 g',
    moq: {quantity: 10000, unit: 'bottles'},
    sortOrder: 13
  }),
  createProduct({
    productId: 'GT-FM-005',
    slug: 'polymer-gel-face-mask',
    category: 'face-masks',
    name: localized('Polymer Gel Face Mask', '高分子凝胶面膜', 'Masque visage en gel polymère', 'Mascarilla facial de gel polimérico'),
    description: localized(
      'A full-face polymer gel format for hydrating, firming and brightening-led skincare concepts.',
      '高分子凝胶完整覆盖面部，膜体柔韧、造型空间更大，可围绕补水、紧致感与焕亮等不同卖点开发。',
      'Un format gel polymère couvrant tout le visage, destiné aux concepts hydratants, raffermissants et illuminateurs.',
      'Un formato de gel polimérico de cobertura facial completa para conceptos hidratantes, reafirmantes e iluminadores.'
    ),
    highlights: [localized('Full-face coverage · polymer gel · shape customisation', '全脸覆盖 · 高分子凝胶 · 形状可定制', 'Couverture complète · gel polymère · forme personnalisable', 'Cobertura completa · gel polimérico · forma personalizable')],
    applications: [localized('Hydrating, anti-wrinkle, firming and brightening-led facial care', '补水、紧致感、抗皱与焕亮面部护理', 'Soin visage hydratant, anti-rides, raffermissant et illuminateur', 'Cuidado facial hidratante, antiarrugas, reafirmante e iluminador')],
    netWeight: '30 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 25000, unit: 'pieces'},
    sortOrder: 14
  }),
  createProduct({
    productId: 'GT-EM-009',
    slug: 'polymer-cold-compress-eye-mask',
    category: 'eye-masks',
    name: localized('Polymer Gel Cold-Compress Eye Mask', '高分子凝胶冷敷眼膜', 'Masque froid pour les yeux en gel polymère', 'Mascarilla fría para ojos de gel polimérico'),
    description: localized(
      'A cooling polymer gel eye format developed for hydrating care and relief of tired-looking eye areas.',
      '高分子凝胶带来鲜明冷敷感，为疲惫眼周增添清凉补水体验；如计划开发可重复使用的产品，也可进一步沟通膜体与包装要求。',
      'Un format froid en gel polymère pour hydrater et rafraîchir le contour des yeux marqué par la fatigue.',
      'Un formato frío de gel polimérico para hidratar y refrescar el contorno de ojos con aspecto cansado.'
    ),
    highlights: [localized('Cooling feel · polymer gel · reusable-format development potential', '冷敷体验 · 高分子凝胶 · 可沟通复用型开发', 'Sensation froide · gel polymère · potentiel de format réutilisable', 'Sensación fría · gel polimérico · potencial de formato reutilizable')],
    applications: [localized('Cooling hydration and tired-eye care', '冷敷感、补水与疲惫眼周护理', 'Hydratation fraîche et soin des yeux fatigués', 'Hidratación refrescante y cuidado de ojos cansados')],
    netWeight: '8 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 25000, unit: 'pieces'},
    sortOrder: 15
  }),
  createProduct({
    productId: 'GT-LP-001',
    slug: 'individual-hydrogel-lip-patch',
    category: 'specialty-patches',
    name: localized('Individual Hydrogel Lip Patch', '独立装水凝胶唇膜', 'Patch lèvres hydrogel individuel', 'Parche labial de hidrogel individual'),
    description: localized(
      'A lip-shaped hydrogel patch supplied in an individual blister format for moisturizing lip-care concepts.',
      '贴合唇形的水凝胶采用独立吸塑包装，取用直观、呈现完整，既适合单次保湿护理，也方便进入礼盒或组合装。',
      'Un patch hydrogel en forme de lèvres, conditionné individuellement sous blister pour les concepts de soin hydratant.',
      'Un parche de hidrogel con forma de labios en blíster individual para conceptos de cuidado hidratante.'
    ),
    highlights: [localized('Lip contour fit · gel 4 g + essence 2 g · individual pack', '贴合唇形 · 胶体 4 g + 精华 2 g · 独立装', 'Forme lèvres · gel 4 g + essence 2 g · emballage individuel', 'Forma labial · gel 4 g + esencia 2 g · envase individual')],
    applications: [localized('Hydrating and moisturizing-led lip care', '补水保湿、单次护理与礼盒组合型唇部产品', 'Soin hydratant des lèvres', 'Cuidado hidratante de labios')],
    netWeight: '6 g',
    packFormat: localized('Printed PVC blister + outer box', '印刷 PVC 吸塑 + 外彩盒', 'Blister PVC imprimé + étui', 'Blíster de PVC impreso + caja'),
    moq: {quantity: 10000, unit: 'pieces'},
    sortOrder: 16
  }),
  createProduct({
    productId: 'GT-FP-001',
    slug: 'polymer-gel-forehead-patch',
    category: 'specialty-patches',
    name: localized('Polymer Gel Forehead Patch', '高分子凝胶额头贴', 'Patch front en gel polymère', 'Parche de frente de gel polimérico'),
    description: localized(
      'A targeted forehead patch for hydrating care and concepts focused on the appearance of forehead lines.',
      '轻量凝胶贴集中覆盖额头区域，护理部位一目了然，让补水与额纹平滑感成为容易被消费者理解的局部护理卖点。',
      'Un patch ciblé pour hydrater le front et prendre soin de l’apparence des lignes frontales.',
      'Un parche localizado para hidratar la frente y cuidar la apariencia de las líneas frontales.'
    ),
    highlights: [localized('Targeted forehead coverage · polymer gel · lightweight format', '额头定区覆盖 · 高分子凝胶 · 轻量形态', 'Couverture ciblée du front · gel polymère · format léger', 'Cobertura localizada de frente · gel polimérico · formato ligero')],
    applications: [localized('Hydration and forehead-line smoothing-led care', '额头补水与额纹平滑感局部护理', 'Hydratation et soin lissant des lignes du front', 'Hidratación y cuidado alisador de líneas de la frente')],
    netWeight: '5 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 17
  }),
  createProduct({
    productId: 'GT-NP-001',
    slug: 'nasolabial-folds-patch',
    category: 'specialty-patches',
    name: localized('Nasolabial Folds Patch', '法令纹贴', 'Patch sillons nasogéniens', 'Parche para surcos nasolabiales'),
    description: localized(
      'A paired local-area patch shaped for smile-line and nasolabial-fold care.',
      '成对轮廓贴片对应笑纹与法令纹区域，消费者一眼就能理解护理目标，并感受局部补水与贴合包裹。',
      'Une paire de patchs locaux conçue pour le soin des rides du sourire et des sillons nasogéniens.',
      'Un par de parches localizados para el cuidado de líneas de sonrisa y surcos nasolabiales.'
    ),
    highlights: [localized('Paired contour shape · localized fit · polymer gel', '成对轮廓形 · 局部贴合 · 高分子凝胶', 'Forme contour par paire · ajustement local · gel polymère', 'Forma de contorno por pares · ajuste local · gel polimérico')],
    applications: [localized('Smile-line and nasolabial-fold smoothing with firming and hydration-led care', '笑纹、法令纹与局部补水紧致护理', 'Soin lissant des rides du sourire et sillons, avec hydratation et fermeté', 'Cuidado alisador de líneas de sonrisa y surcos, con hidratación y firmeza')],
    netWeight: '3 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 50000, unit: 'pieces'},
    sortOrder: 18
  }),
  createProduct({
    productId: 'GT-VL-001',
    slug: 'polymer-gel-v-line-lifting-patch',
    category: 'specialty-patches',
    name: localized('Polymer Gel V-Line Lifting Patch', '高分子凝胶 V 脸提拉贴', 'Patch liftant V-line en gel polymère', 'Parche lifting V-line de gel polimérico'),
    description: localized(
      'A lower-face contour patch developed for hydrating, nourishing and firming-led jawline concepts.',
      '下半脸轮廓膜配有耳孔结构，方便贴合与固定，让补水、滋养与轮廓紧致感融入更具包裹感的下颌护理体验。',
      'Un patch pour le bas du visage, destiné aux concepts hydratants, nourrissants et raffermissants de la mâchoire.',
      'Un parche para el contorno inferior del rostro destinado a conceptos hidratantes, nutritivos y reafirmantes de la mandíbula.'
    ),
    highlights: [localized('Lower-face contour · polymer gel · ear-opening structure', '下半脸轮廓 · 高分子凝胶 · 耳孔结构', 'Contour bas du visage · gel polymère · ouvertures auriculaires', 'Contorno inferior · gel polimérico · aberturas para orejas')],
    applications: [localized('Hydrating, nourishing and contour-firming-led jawline care', '下颌贴合、滋养与轮廓紧致感护理', 'Soin hydratant, nourrissant et raffermissant de la mâchoire', 'Cuidado hidratante, nutritivo y reafirmante de la mandíbula')],
    netWeight: '15 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 25000, unit: 'pieces'},
    sortOrder: 19
  }),
  createProduct({
    productId: 'GT-FE-001',
    slug: 'forehead-eye-two-in-one-patch',
    category: 'specialty-patches',
    name: localized('Forehead & Eye 2-in-1 Anti-Wrinkle Patch', '额头眼周二合一抗皱贴', 'Patch anti-rides front et yeux 2-en-1', 'Parche antiarrugas 2 en 1 para frente y ojos'),
    description: localized(
      'A one-piece format covering the forehead and eye area for multi-zone firming and smoothing-led care.',
      '一片同时覆盖额头与眼周，把两个护理部位融入一次贴敷，让多区域护理本身成为醒目的产品记忆点。',
      'Un format monobloc couvrant le front et les yeux pour un soin multi-zone raffermissant et lissant.',
      'Un formato de una pieza que cubre frente y ojos para un cuidado reafirmante y alisador multizona.'
    ),
    highlights: [localized('Forehead + eye coverage · one-piece format · polymer gel', '额头 + 眼周覆盖 · 一片式 · 高分子凝胶', 'Front + yeux · format monobloc · gel polymère', 'Frente + ojos · formato de una pieza · gel polimérico')],
    applications: [localized('Multi-zone anti-wrinkle, firming and repairing-led care', '额头与眼周同步护理的多区域产品', 'Soin multi-zone anti-rides, raffermissant et réparateur', 'Cuidado multizona antiarrugas, reafirmante y reparador')],
    netWeight: '15 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 25000, unit: 'pieces'},
    sortOrder: 20
  }),
  createProduct({
    productId: 'GT-JM-001',
    slug: 'double-ear-hook-jawline-mask',
    category: 'specialty-patches',
    name: localized('Double Ear-Hook Jawline Mask', '双耳挂下颌提拉膜', 'Masque mâchoire à double contour d’oreille', 'Mascarilla de mandíbula con doble sujeción de orejas'),
    description: localized(
      'A double ear-hook lower-face mask designed for close jawline fit and firming-led contour care.',
      '双耳挂结构帮助膜体贴合下颌线，佩戴方式直观，让下半脸获得更鲜明的包裹感与轮廓紧致体验。',
      'Un masque bas du visage à double contour d’oreille, conçu pour épouser la mâchoire et soutenir les concepts raffermissants.',
      'Una mascarilla inferior con doble sujeción de orejas para adaptarse a la mandíbula y apoyar conceptos reafirmantes.'
    ),
    highlights: [localized('Double ear-hook structure · jawline coverage · polymer gel', '双耳挂结构 · 下颌覆盖 · 高分子凝胶', 'Double contour d’oreille · couverture mâchoire · gel polymère', 'Doble sujeción · cobertura de mandíbula · gel polimérico')],
    applications: [localized('Jawline firming, lifting and swelling-reduction-led care', '下颌线紧致感、提拉感与浮肿感护理', 'Soin raffermissant et liftant de la mâchoire', 'Cuidado reafirmante y lifting de la mandíbula')],
    netWeight: '25 g',
    packFormat: localized('Individual aluminum film bag + outer box', '独立纯铝膜袋 + 外彩盒', 'Sachet aluminium individuel + étui', 'Bolsa individual de aluminio + caja'),
    moq: {quantity: 25000, unit: 'pieces'},
    sortOrder: 21
  })
];

for (const product of products) {
  product.categoryIds = marketByLegacyId[product.productId] ?? [];
  product.productForm = product.category === 'eye-masks'
    ? localized('Hydrogel eye mask', '水凝胶眼膜', 'Patch hydrogel yeux', 'Parche hidrogel para ojos')
    : product.category === 'face-masks'
      ? localized('Face mask', '面膜', 'Masque visage', 'Mascarilla facial')
      : localized('Targeted hydrogel patch', '局部水凝胶膜贴', 'Patch hydrogel ciblé', 'Parche hidrogel localizado');
}

function brochureForm(name: string): LocalizedText {
  const normalized = name.toLowerCase();
  if (/mist|spray/.test(normalized)) return localized('Mist', '喷雾', 'Brume', 'Bruma');
  if (/cleanser|body wash/.test(normalized)) return localized('Cleanser', '清洁产品', 'Nettoyant', 'Limpiador');
  if (/mask/.test(normalized)) return localized('Mask', '面膜', 'Masque', 'Mascarilla');
  if (/cream|balm/.test(normalized)) return localized('Cream', '膏霜', 'Crème', 'Crema');
  if (/lotion/.test(normalized)) return localized('Lotion', '乳液', 'Lotion', 'Loción');
  if (/essence/.test(normalized)) return localized('Essence', '精华', 'Sérum', 'Sérum');
  if (/oil/.test(normalized)) return localized('Oil', '油类产品', 'Huile', 'Aceite');
  if (/pad/.test(normalized)) return localized('Pad', '棉片', 'Disque', 'Disco');
  return localized('Skincare product', '护肤产品', 'Soin', 'Producto de cuidado');
}

for (const [index, source] of brochureProducts.entries()) {
  const category = categories.find((item) => item.slug === source.category);
    if (!category || !source.effect.trim() || !brochureZhNames[source.id] || !brochureZhEffects[source.id]) throw new Error(`Incomplete brochure entry: ${source.id}`);
    const form = brochureForm(source.name);
    const translated = brochureTranslations[source.id as keyof typeof brochureTranslations];
    if (!translated) throw new Error(`Missing brochure translation: ${source.id}`);
    const name: LocalizedText = {en: source.name, zh: brochureZhNames[source.id], fr: translated.fr.name, es: translated.es.name, ru: translated.ru.name, ar: `${category.name.ar} · ${source.name}`};
    const effect: LocalizedText = {en: source.effect, zh: brochureZhEffects[source.id], fr: translated.fr.effect, es: translated.es.effect, ru: translated.ru.effect, ar: source.id === 'SK-P20-02' ? 'يوحد لون البشرة ويوفر تغطية طبيعية وحماية من الأشعة فوق البنفسجية.' : translated.ar.effect};
  products.push({
    productId: source.id, sku: `${source.id}-V01`, slug: source.id.toLowerCase(),
    category: category.slug,
    categoryIds: source.isNew ? [category.slug, 'new-arrivals'] : [category.slug],
    productForm: form, isNew: source.isNew, sourcePage: source.sourcePage,
    name, eyebrow: category.name, description: effect, highlights: [effect], applications: [category.name],
    specifications: source.specification ? [{id: 'net-weight', label: netWeightLabel, value: localized(source.specification, source.specification, source.specification, source.specification)}] : [],
    compliance: [], commercialTerms: {moq: null, mold: null}, publishStatus: 'draft',
    featured: source.isNew, sortOrder: 22 + index,
    media: {image: source.image, imageStatus: 'available', alt: name}, optionGroups: []
  });
}

export function applyPublishedProductOverride(
  product: Product,
  override: PublishedProductOverride,
  localizedOverride: (locale: CatalogLocale) => PublishedProductOverride,
  activeLocales: readonly CatalogLocale[]
): void {
  product.commercialTerms.moq = override.moqQuantity === null ? null : {quantity: override.moqQuantity, unit: override.moqUnit};
  if (product.media) {product.media.image = override.image; product.media.imageStatus = 'available';}

  // The editor treats each line as a separate visible card on the product page.
  product.highlights = override.highlights.map((value, index) => ({
    ...(product.highlights[index] ?? product.highlights[0] ?? product.name), zh: value
  }));
  product.applications = override.applications.map((value, index) => ({
    ...(product.applications[index] ?? product.applications[0] ?? product.name), zh: value
  }));

  let netWeight = product.specifications.find((item) => item.id === 'net-weight');
  if (!netWeight) {
    netWeight = {id: 'net-weight', label: netWeightLabel, value: localized(override.netWeight, override.netWeight, override.netWeight, override.netWeight)};
    product.specifications.push(netWeight);
  }
  let packFormat = product.specifications.find((item) => item.id === 'pack-format');
  if (override.packFormat && !packFormat) {
    packFormat = {id: 'pack-format', label: packFormatLabel, value: localized(override.packFormat, override.packFormat, override.packFormat, override.packFormat)};
    product.specifications.push(packFormat);
  } else if (!override.packFormat && packFormat) {
    product.specifications = product.specifications.filter((item) => item.id !== 'pack-format');
    packFormat = undefined;
  }

  for (const locale of activeLocales) {
    const text = localizedOverride(locale);
    product.name = {...product.name, [locale]: text.name};
    product.description = {...product.description, [locale]: text.description};
    product.highlights.forEach((item, index) => {item[locale] = text.highlights[index];});
    product.applications.forEach((item, index) => {item[locale] = text.applications[index];});
    netWeight.value = {...netWeight.value, [locale]: text.netWeight};
    if (packFormat) packFormat.value = {...packFormat.value, [locale]: text.packFormat};
    if (product.media) product.media.alt = {...product.media.alt, [locale]: text.name};
  }
}

for (const product of products) {
  const override = getPublishedProductOverride(product.productId);
  if (!override) continue;
  applyPublishedProductOverride(
    product,
    override,
    (locale) => getPublishedProductOverride(product.productId, publishedContent, locale)!,
    publishedContent.translations ? catalogLocales : ['zh']
  );
}

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
  return categories.find((item) => item.slug === slug) ?? legacyCategories.find((item) => item.slug === slug);
}
