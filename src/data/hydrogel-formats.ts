import {locales} from '@/lib/routing';
import type {CatalogLocale, LocalizedText, ProductCategory} from '@/data/catalog';
import {getPublishedFormatOverride, publishedContent} from '@/lib/published-content';
import {hydrogelArabic} from '@/data/hydrogel-arabic';
import {deliveryTranslation} from '@/data/delivery-translations';

export type HydrogelMaterialFamily =
  | 'natural-hydrogel'
  | 'cool-conductive-gel'
  | 'polymer-gel'
  | 'composite-gel'
  | 'cream-mask';

export type HydrogelFormat = {
  id: string;
  category: ProductCategory;
  family: HydrogelMaterialFamily;
  name: LocalizedText;
  effects: LocalizedText;
  specification: string;
  localizedSpecification?: LocalizedText;
  localizedMoq?: LocalizedText;
  moq: string;
  packaging: LocalizedText;
  image: string;
  sourceSlide: number;
};

const text = (
  en: string,
  zh: string,
  fr = deliveryTranslation(en, 'fr') ?? en,
  es = deliveryTranslation(en, 'es') ?? en,
  ru = deliveryTranslation(en, 'ru') ?? en,
  ar = hydrogelArabic[en] ?? en
): LocalizedText => ({en, zh, fr, es, ru, ar});

const pack = {
  blister: text('Blister pack + film bag + outer box', '吸塑托 + 膜袋 + 外彩盒'),
  aluminum: text('Pure aluminum film bag + outer box', '纯铝膜袋 + 外彩盒'),
  jar: text('Wide-mouth jar + outer box', '广口瓶 + 外彩盒'),
  pouch: text('Film bag + outer box', '膜袋 + 外彩盒'),
  singlePvc: text('Printed PVC top film + outer box', '印刷 PVC 顶膜 + 外彩盒')
};

export const hydrogelMaterialFamilies: Array<{
  id: HydrogelMaterialFamily;
  name: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: 'natural-hydrogel',
    name: text('Natural hydrogel', '天然水凝胶'),
    description: text('Collagen, gelatin, hyaluronic acid, chitosan and other naturally derived gel systems.', '以胶原、明胶、透明质酸、壳聚糖等为代表，触感柔润贴肤，也让保湿卖点更容易被消费者理解。')
  },
  {
    id: 'cool-conductive-gel',
    name: text('Microporous cooling gel', '微孔冰导凝胶'),
    description: text('A layered cooling format developed for close fit, hydration and a fresh skin feel.', '分层微孔结构带来更鲜明的清凉与贴合体验，让消费者一贴就能感受到膜体差异。')
  },
  {
    id: 'polymer-gel',
    name: text('Polymer gel', '高分子凝胶'),
    description: text('Shape-flexible gel formats for face, eye, jawline and targeted-area patches.', '膜体柔韧、塑形空间较大，可覆盖面部、眼周、下颌与其他局部护理，让造型本身成为产品亮点。')
  },
  {
    id: 'composite-gel',
    name: text('Composite gel', '复合凝胶'),
    description: text('Natural and synthetic polymer systems combined for shape, load and skin-contact performance.', '结合天然与合成高分子，在成型、承载精华与贴肤表现之间取得平衡。')
  },
  {
    id: 'cream-mask',
    name: text('Cream mask', '膏状膜'),
    description: text('Nourishing cream and oil-cream formats for face and eye-area applications.', '膏状与油膏质地更显丰润，为面部与眼周护理带来更有包裹感的滋养体验。')
  }
];

export const hydrogelFormats: HydrogelFormat[] = [
  {
    id: 'HG-F-01', category: 'face-masks', family: 'natural-hydrogel',
    name: text('Collagen gel face mask · blister pack', '胶原凝胶面膜 · 吸塑装'),
    effects: text('Hydrating, moisturizing and soothing', '补水、保湿、舒缓'),
    specification: '60 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/face-collagen-blister-hd.webp', sourceSlide: 21
  },
  {
    id: 'HG-F-02', category: 'face-masks', family: 'natural-hydrogel',
    name: text('White-to-transparent gel face mask', '白变透明凝胶面膜'),
    effects: text('Firming, anti-wrinkle and brightening-led care; becomes thinner and clearer during wear', '紧致、抗皱与焕亮；贴敷过程中逐渐变薄、趋于透明'),
    specification: '23 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/face-white-transparent-hd.webp', sourceSlide: 21
  },
  {
    id: 'HG-F-03', category: 'face-masks', family: 'natural-hydrogel',
    name: text('Human-like hydrogel face mask', '仿生水凝胶面膜'),
    effects: text('Hydrating, moisturizing, firming and brightening-led care', '补水、保湿、紧致与焕亮'),
    specification: '35 g / piece', moq: '50,000 pieces', packaging: pack.pouch,
    image: '/assets/products/hydrogel/formats/face-human-like-hd.webp', sourceSlide: 21
  },
  {
    id: 'HG-F-04', category: 'face-masks', family: 'cool-conductive-gel',
    name: text('Microporous cooling conductive cream mask', '微孔冰导膏状面膜'),
    effects: text('Cooling, contour-fitting, elasticity and firming-led care', '清凉、贴合、弹力与紧致感'),
    specification: '29 g × 4 patches / box', moq: '10,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/face-cool-conductive-hd.webp', sourceSlide: 25
  },
  {
    id: 'HG-F-05', category: 'face-masks', family: 'polymer-gel',
    name: text('Polymer gel face mask', '高分子凝胶面膜'),
    effects: text('Hydrating, anti-wrinkle, firming and brightening-led care', '补水、抗皱、紧致与焕亮'),
    specification: '30 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/face-polymer-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-F-06', category: 'face-masks', family: 'cream-mask',
    name: text('Cream face mask', '膏状面膜'),
    effects: text('Nourishing, repairing, firming and brightening-led care', '滋养、修护、紧致与焕亮'),
    specification: '14 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/face-cream-hd.webp', sourceSlide: 29
  },
  {
    id: 'HG-F-07', category: 'face-masks', family: 'cream-mask',
    name: text('Oil cream face mask', '油膏面膜'),
    effects: text('Oil-rich moisturizing, repairing and firming-led care', '油润保湿、修护与紧致感'),
    specification: '16 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/face-oil-cream-hd.webp', sourceSlide: 29
  },

  {
    id: 'HG-E-01', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('White-to-transparent butterfly eye mask', '白变透明蝶形眼膜'),
    effects: text('Firming, anti-wrinkle and brightening-led care', '紧致、抗皱与焕亮'),
    specification: '8 g / pair', moq: '50,000 pairs', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-wtc-butterfly-hd.webp', sourceSlide: 22
  },
  {
    id: 'HG-E-02', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Bottled gel eye mask · single colour', '瓶装凝胶眼膜 · 单色'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '1.4 g × 60 pieces', moq: '10,000 bottles', packaging: pack.jar,
    image: '/assets/products/hydrogel/formats/eye-bottled-single-hd.webp', sourceSlide: 22
  },
  {
    id: 'HG-E-03', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Bottled star eye mask', '瓶装星形眼膜'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '1.4 g × 60 pieces', moq: '10,000 bottles', packaging: pack.jar,
    image: '/assets/products/hydrogel/formats/eye-bottled-star-hd.webp', sourceSlide: 22
  },
  {
    id: 'HG-E-04', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Bottled gel eye mask · dual colour', '瓶装凝胶眼膜 · 双色'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '1.4 g × 60 pieces', moq: '10,000 bottles', packaging: pack.jar,
    image: '/assets/products/hydrogel/formats/eye-bottled-dual-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-05', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Eye-shaped gel patch · single pack', '眼罩形凝胶贴 · 单片装'),
    effects: text('Hydrating, moisturizing, anti-wrinkle and firming-led care', '补水、保湿、抗皱与紧致'),
    specification: '18 g / patch', moq: '50,000 pieces', packaging: pack.pouch,
    image: '/assets/products/hydrogel/formats/eye-shaped-single-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-06', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Crescent gel eye patch · individual pack', '月牙形凝胶眼膜 · 独立装'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '6.2 g / pair', moq: '50,000 pairs', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/eye-crescent-individual-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-07', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Blister crescent eye patch', '吸塑月牙形眼膜'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '5 g / pair', moq: '50,000 pairs', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/eye-crescent-blister-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-08', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Blister eye mask · patented shape A', '吸塑眼膜 · 专利形状 A'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '5 g / pair', moq: '50,000 pairs', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/eye-patented-shape-a-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-09', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('Blister eye mask · patented shape B', '吸塑眼膜 · 专利形状 B'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '7 g / pair', moq: '50,000 pairs', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/eye-patented-shape-b-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-10', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('White-to-transparent eye mask', '白变透明眼膜'),
    effects: text('Hydrating, moisturizing, anti-wrinkle, firming and brightening-led care', '补水、保湿、抗皱、紧致与焕亮'),
    specification: '10 g / pair', moq: '50,000 pairs', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/eye-white-transparent-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-11', category: 'eye-masks', family: 'natural-hydrogel',
    name: text('White-to-transparent E-shape eye mask', '白变透明 E 形眼膜'),
    effects: text('Firming, anti-wrinkle and brightening-led care; becomes thinner and clearer during wear', '紧致、抗皱与焕亮；贴敷过程中逐渐变薄、趋于透明'),
    specification: '8 g / pair', moq: '50,000 pairs', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-white-transparent-e-hd.webp', sourceSlide: 23
  },
  {
    id: 'HG-E-12', category: 'eye-masks', family: 'cool-conductive-gel',
    name: text('Microporous cooling conductive eye mask', '微孔冰导眼膜'),
    effects: text('Cooling, close-fitting, smoothing, brightening and hydrating-led care', '清凉、贴合、平滑、焕亮与补水'),
    specification: '10.5 g × 7 patches / box', moq: '10,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-micropore-cooling-hd.webp', sourceSlide: 25
  },
  {
    id: 'HG-E-13', category: 'eye-masks', family: 'polymer-gel',
    name: text('Polymer gel eye mask · eye-mask shape', '高分子凝胶眼膜 · 眼罩形'),
    effects: text('Hydrating, fatigue-relief, brightening and firming-led care', '补水、舒缓眼周疲惫、焕亮与紧致'),
    specification: '10 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/eye-polymer-mask-shape-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-E-14', category: 'eye-masks', family: 'polymer-gel',
    name: text('Polymer gel eye mask · crescent shape', '高分子凝胶眼膜 · 月牙形'),
    effects: text('Hydrating, fatigue-relief, brightening and firming-led care', '补水、舒缓眼周疲惫、焕亮与紧致'),
    specification: '7 g / pair', moq: '25,000 pairs', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/eye-polymer-crescent-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-E-15', category: 'eye-masks', family: 'polymer-gel',
    name: text('Polymer gel cold-compress eye mask', '高分子凝胶冷敷眼膜'),
    effects: text('Cooling, hydrating and eye-fatigue relief', '冷敷、补水与缓解眼周疲惫'),
    specification: '8 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/eye-polymer-cold-compress-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-E-16', category: 'eye-masks', family: 'polymer-gel',
    name: text('Polymer gel wrap eye mask', '高分子凝胶包裹式眼膜'),
    effects: text('Multi-zone anti-wrinkle, firming and repairing-led care', '多区域抗皱、紧致与修护'),
    specification: '7 g / pair', moq: '25,000 pairs', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/eye-polymer-cheek-shape-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-E-17', category: 'eye-masks', family: 'composite-gel',
    name: text('Composite gel eye mask · crescent shape', '复合凝胶眼膜 · 月牙形'),
    effects: text('Hydrating, intensive repair, anti-wrinkle, firming and brightening-led care', '补水、密集修护、抗皱、紧致与焕亮'),
    specification: '5 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-composite-crescent-hd.webp', sourceSlide: 28
  },
  {
    id: 'HG-E-18', category: 'eye-masks', family: 'composite-gel',
    name: text('Composite printed gel eye patch', '复合印花凝胶眼膜'),
    effects: text('Hydrating, intensive repair, anti-wrinkle, firming and brightening-led care', '补水、密集修护、抗皱、紧致与焕亮'),
    specification: '5 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-composite-biohyalux-hd.webp', sourceSlide: 28
  },
  {
    id: 'HG-E-19', category: 'eye-masks', family: 'composite-gel',
    name: text('Composite gel eye mask · full eye shape', '复合凝胶眼膜 · 全眼罩形'),
    effects: text('Hydrating, intensive repair, anti-wrinkle, firming and brightening-led care', '补水、密集修护、抗皱、紧致与焕亮'),
    specification: '8 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-composite-mask-a-hd.webp', sourceSlide: 28
  },
  {
    id: 'HG-E-20', category: 'eye-masks', family: 'composite-gel',
    name: text('Composite gel eye mask · contour shape', '复合凝胶眼膜 · 轮廓形'),
    effects: text('Hydrating, intensive repair, anti-wrinkle, firming and brightening-led care', '补水、密集修护、抗皱、紧致与焕亮'),
    specification: '8 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-composite-mask-b-hd.webp', sourceSlide: 28
  },
  {
    id: 'HG-E-21', category: 'eye-masks', family: 'cream-mask',
    name: text('Cream eye mask', '膏状眼膜'),
    effects: text('Nourishing, repairing, firming and brightening-led care', '滋养、修护、紧致与焕亮'),
    specification: '5 g / pair', moq: '50,000 pairs', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-cream-hd.webp', sourceSlide: 29
  },

  {
    id: 'HG-S-01', category: 'specialty-patches', family: 'natural-hydrogel',
    name: text('Boxed hydrogel lip patch', '盒装水凝胶唇膜'),
    effects: text('Hydrating, soothing and exfoliating-led lip care', '补水、舒缓与去角质唇部护理'),
    specification: '120 g / box · 60 g / pair', moq: '10,000 pieces', packaging: pack.jar,
    image: '/assets/products/hydrogel/formats/specialty-lip-boxed-hd.webp', sourceSlide: 24
  },
  {
    id: 'HG-S-02', category: 'specialty-patches', family: 'natural-hydrogel',
    name: text('Individual hydrogel lip patch', '独立装水凝胶唇膜'),
    effects: text('Hydrating and moisturizing-led lip care', '补水与保湿唇部护理'),
    specification: '6 g / piece', moq: '10,000 pieces', packaging: pack.singlePvc,
    image: '/assets/products/hydrogel/formats/specialty-lip-individual-hd.webp', sourceSlide: 24
  },
  {
    id: 'HG-S-03', category: 'specialty-patches', family: 'natural-hydrogel',
    name: text('Individual hydrogel neck mask', '独立装水凝胶颈膜'),
    effects: text('Hydrating, anti-wrinkle, firming and brightening-led neck care', '补水、抗皱、紧致与焕亮颈部护理'),
    specification: '35 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/specialty-neck-hd.webp', sourceSlide: 24
  },
  {
    id: 'HG-S-04', category: 'specialty-patches', family: 'cool-conductive-gel',
    name: text('Microporous cooling conductive neck mask', '微孔冰导颈膜'),
    effects: text('Cooling, contour-fitting, smoothing and firming-led neck care', '清凉、贴合、平滑与紧致颈部护理'),
    specification: '13.5 g × 5 pieces / box', moq: '10,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/specialty-neck-micropore-hd.webp', sourceSlide: 25
  },
  {
    id: 'HG-S-05', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Forehead & eye 2-in-1 anti-wrinkle patch', '额头眼周二合一抗皱贴'),
    effects: text('Multi-zone anti-wrinkle, firming and repairing-led care', '额头与眼周多区域抗皱、紧致与修护'),
    specification: '15 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-forehead-eye-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-S-06', category: 'specialty-patches', family: 'polymer-gel',
    name: text('V-line lifting patch', 'V 脸提拉贴'),
    effects: text('Hydrating, nourishing, contour-firming and lifting-led care', '补水、滋养、轮廓紧致与提拉感'),
    specification: '15 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-v-line-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-S-07', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Double ear-hook V-line mask', '双耳挂 V 脸膜'),
    effects: text('Jawline firming, lifting and swelling-reduction-led care', '下颌线紧致、提拉与减轻浮肿感'),
    specification: '25 g / piece', moq: '25,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-double-ear-hook-hd.webp', sourceSlide: 26
  },
  {
    id: 'HG-S-08', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Golf mask', '高尔夫运动护理面膜'),
    effects: text('Sports care, long-lasting hydration and jawline firming-led care', '运动场景护理、长效补水与下颌紧致感'),
    specification: '38 g / piece', moq: '50,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-golf-mask-hd.webp', sourceSlide: 27
  },
  {
    id: 'HG-S-09', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Forehead patch', '额头贴'),
    effects: text('Hydrating and forehead-line smoothing-led care', '补水与额纹平滑感'),
    specification: '5 g / piece', moq: '50,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-forehead-hd.webp', sourceSlide: 27
  },
  {
    id: 'HG-S-10', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Nasolabial folds patch', '法令纹贴'),
    effects: text('Smile-line and expression-line smoothing with firming and hydration-led care', '法令纹、笑纹与表情纹平滑，并兼顾紧致补水'),
    specification: '3 g / piece', moq: '50,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-nasolabial-hd.webp', sourceSlide: 27
  },
  {
    id: 'HG-S-11', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Butterfly nasolabial folds patch', '蝴蝶形法令纹贴'),
    effects: text('Eye-line, smile-line and nasolabial-fold smoothing-led care', '眼纹、笑纹与法令纹多区域平滑护理'),
    specification: '5 g / piece', moq: '50,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-butterfly-nasolabial-hd.webp', sourceSlide: 27
  },
  {
    id: 'HG-S-12', category: 'specialty-patches', family: 'polymer-gel',
    name: text('Lifting line mask', '轮廓提拉贴'),
    effects: text('Intensive repair, firming and anti-wrinkle-led care', '密集修护、紧致与抗皱'),
    specification: '30 g / piece', moq: '50,000 pieces', packaging: pack.aluminum,
    image: '/assets/products/hydrogel/formats/specialty-lifting-line-hd.webp', sourceSlide: 27
  },
  {
    id: 'HG-S-13', category: 'specialty-patches', family: 'composite-gel',
    name: text('Composite forehead & eye 2-in-1 patch', '复合凝胶额头眼周二合一贴'),
    effects: text('Hydrating, intensive repair, anti-wrinkle, firming and brightening-led care', '补水、密集修护、抗皱、紧致与焕亮'),
    specification: '12 g / piece', moq: '50,000 pieces', packaging: pack.blister,
    image: '/assets/products/hydrogel/formats/eye-polymer-crescent-hd.webp', sourceSlide: 28
  }
];

for (const format of hydrogelFormats) {
  const override = getPublishedFormatOverride(format.id);
  if (!override) continue;
  format.specification = override.specification;
  format.moq = override.moq;
  format.image = override.image;
  for (const locale of locales) {
    if (locale !== 'zh' && !publishedContent.translations) continue;
    const value = getPublishedFormatOverride(format.id, publishedContent, locale)!;
    format.name = {...format.name, [locale]: value.name};
    format.effects = {...format.effects, [locale]: value.effects};
    format.packaging = {...format.packaging, [locale]: value.packaging};
    format.localizedSpecification = {...(format.localizedSpecification ?? text(format.specification, format.specification)), [locale]: value.specification};
    format.localizedMoq = {...(format.localizedMoq ?? text(format.moq, format.moq)), [locale]: value.moq};
  }
}

export const hydrogelCapabilityFacts = [
  {
    id: 'founded',
    value: '2015',
    label: text('Founded in Guangzhou', '成立于广州')
  },
  {
    id: 'high-tech',
    value: '2020',
    label: text('Recognised as a National High-tech Enterprise', '获国家高新技术企业认证')
  },
  {
    id: 'patents',
    value: '30',
    label: text('Patents stated in the supplied company profile', '水凝膜相关专利数量')
  },
  {
    id: 'daily-skincare',
    value: '200,000+',
    label: text('Daily skincare-product capacity stated in the supplied profile', '护肤品参考日产能')
  },
  {
    id: 'daily-hydrogel',
    value: '100,000+',
    label: text('Daily hydrogel face- and eye-mask capacity stated in the supplied profile', '水凝胶面膜与眼膜参考日产能')
  }
];

export const hydrogelProcessSteps = [
  text('Gel powder pre-dispersion', '凝胶粉预分散'),
  text('Activation and dissolution', '活化与溶解'),
  text('Active ingredient addition', '活性成分加入'),
  text('Vacuum degassing', '真空脱泡'),
  text('Insulation and filtration', '保温与过滤'),
  text('Thin-layer flow guidance', '薄层导流'),
  text('Uniform cooling', '均匀冷却'),
  text('Cutting and forming', '裁切成型'),
  text('Bottling and bagging', '装瓶与装袋'),
  text('Essence soaking', '精华浸泡'),
  text('Inspection', '检验'),
  text('Boxing and packaging', '装盒包装')
];

export const hydrogelPatentProofs = [
  {
    title: text('Cosmetic gel-film cutting device', '化妆凝胶薄膜切料装置'),
    patentNo: 'ZL 2019 2 0531642.2',
    relevance: text('Supports controlled cutting within the hydrogel forming workflow.', '为水凝膜成型中的稳定切料提供工艺支持。'),
    image: '/assets/qualifications/hydrogel-patents/gel-film-cutting-device.png'
  },
  {
    title: text('Gel cosmetics production system', '凝胶化妆品生产系统'),
    patentNo: 'ZL 2020 2 3135860.6',
    relevance: text('Covers an integrated system for gel-cosmetics production.', '覆盖凝胶类化妆品的一体化生产系统。'),
    image: '/assets/qualifications/hydrogel-patents/gel-cosmetics-production-system.png'
  },
  {
    title: text('Eye-gel production colloid mill', '眼凝胶生产用胶体磨'),
    patentNo: 'ZL 2022 2 2174913.8',
    relevance: text('Supports controlled eye-gel material preparation.', '为眼凝胶物料的研磨与制备提供工艺支持。'),
    image: '/assets/qualifications/hydrogel-patents/eye-gel-colloid-mill.png'
  },
  {
    title: text('Fish-scale collagen eye-patch design', '鱼鳞纹状胶原眼贴外观设计'),
    patentNo: 'ZL 2020 3 0469320.8',
    relevance: text('An appearance-design patent for a distinctive collagen eye-patch format.', '以鱼鳞纹理与眼贴轮廓形成鲜明的产品外观。'),
    image: '/assets/qualifications/hydrogel-patents/collagen-eye-patch-design.png'
  },
  {
    title: text('Gel-cosmetics coating device', '凝胶类化妆品涂布装置'),
    patentNo: 'ZL 2022 2 1704757.5',
    relevance: text('Supports the coating stage before cooling and cutting.', '对应冷却、裁切前的凝胶涂布环节。'),
    image: '/assets/qualifications/hydrogel-patents/gel-coating-device.png'
  }
];

export function getHydrogelFormats(category?: ProductCategory) {
  return category ? hydrogelFormats.filter((format) => format.category === category) : hydrogelFormats;
}

export function getHydrogelFamily(id: HydrogelMaterialFamily) {
  return hydrogelMaterialFamilies.find((family) => family.id === id);
}

const measureTranslations: Record<Exclude<CatalogLocale, 'en'>, Array<[string, string]>> = {
  zh: [['bottles', '瓶'], ['bottle', '瓶'], ['pieces', '片'], ['piece', '片'], ['pairs', '对'], ['pair', '对'], ['boxes', '盒'], ['box', '盒'], ['patches', '片'], ['patch', '片']],
  fr: [['bottles', 'flacons'], ['bottle', 'flacon'], ['pieces', 'pièces'], ['piece', 'pièce'], ['pairs', 'paires'], ['pair', 'paire'], ['boxes', 'boîtes'], ['box', 'boîte'], ['patches', 'patchs'], ['patch', 'patch']],
  es: [['bottles', 'frascos'], ['bottle', 'frasco'], ['pieces', 'unidades'], ['piece', 'unidad'], ['pairs', 'pares'], ['pair', 'par'], ['boxes', 'cajas'], ['box', 'caja'], ['patches', 'parches'], ['patch', 'parche']],
  ru: [['bottles', 'флаконов'], ['bottle', 'флакон'], ['pieces', 'шт.'], ['piece', 'шт.'], ['pairs', 'пар'], ['pair', 'пара'], ['boxes', 'коробок'], ['box', 'коробка'], ['patches', 'патчей'], ['patch', 'патч']],
  ar: [['bottles', 'عبوة'], ['bottle', 'عبوة'], ['pieces', 'قطعة'], ['piece', 'قطعة'], ['pairs', 'زوج'], ['pair', 'زوج'], ['boxes', 'علبة'], ['box', 'علبة'], ['patches', 'لصقات'], ['patch', 'لصقة']]
};

export function localizeHydrogelMeasure(value: string, locale: CatalogLocale): string {
  if (locale === 'en') return value;
  return measureTranslations[locale].reduce(
    (translated, [source, target]) => translated.replace(new RegExp(`\\b${source}\\b`, 'gi'), target),
    value
  );
}
