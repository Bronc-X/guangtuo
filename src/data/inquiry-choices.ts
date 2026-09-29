import type {Locale} from '@/lib/routing';

export const platformOptions = {
  online: ['Amazon', 'TikTok Shop', 'Shopify / DTC', 'Shopee', 'Lazada', 'eBay', 'Walmart Marketplace', 'Tmall / Taobao', 'JD.com', 'Other online'],
  offline: ['Beauty salons / spas', 'Beauty specialty retailers', 'Department store counters', 'Pharmacies', 'Distributors / wholesalers', 'Other offline']
};
export const platformChinese: Record<string, string> = {
  'Shopify / DTC': '品牌独立站（Shopify / DTC）', 'Tmall / Taobao': '天猫 / 淘宝', 'JD.com': '京东', 'Other online': '其他线上平台',
  'Beauty salons / spas': '美容院 / SPA', 'Beauty specialty retailers': '美妆集合店 / 专营店', 'Department store counters': '百货专柜', 'Pharmacies': '药房 / 药妆店', 'Distributors / wholesalers': '经销 / 批发渠道', 'Other offline': '其他线下渠道'
};

export function normalizeSalesPlatform(value: string): string {
  const aliases: Array<[RegExp, string]> = [
    [/shopify|独立站|\bdtc\b/i, 'Shopify / DTC'], [/美容院|\bsalon|\bspa\b/i, 'Beauty salons / spas'],
    [/集合店|专营店|specialty retail/i, 'Beauty specialty retailers'], [/百货|专柜|department/i, 'Department store counters'],
    [/药房|药妆|pharmac/i, 'Pharmacies'], [/经销|批发|distributor|wholesale/i, 'Distributors / wholesalers']
  ];
  return aliases.find(([pattern]) => pattern.test(value))?.[1] ?? [...platformOptions.online, ...platformOptions.offline].find(option => option.toLowerCase() === value.trim().toLowerCase()) ?? value.trim();
}

export function inquiryChoices(locale: Locale) {
  const zh = locale === 'zh';
  return {
    market: zh ? ['中国大陆', '中国香港', '中国台湾', '美国', '加拿大', '英国', '法国', '德国', '西班牙', '意大利', '俄罗斯', '澳大利亚', '日本', '韩国', '新加坡', '马来西亚', '泰国', '越南', '印度尼西亚', '菲律宾', '阿联酋', '沙特阿拉伯', '印度', '巴西', '墨西哥', '多国家 / 地区'] : ['Mainland China', 'Hong Kong', 'Taiwan', 'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Russia', 'Australia', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines', 'UAE', 'Saudi Arabia', 'India', 'Brazil', 'Mexico', 'Multiple countries / regions'],
    efficacy: zh ? ['保湿补水', '舒缓修护', '提亮肤色', '紧致抗皱', '控油净肤', '清洁卸妆', '头皮护理', '身体护理', '待讨论'] : ['Hydration', 'Soothing & barrier care', 'Brightening', 'Firming & anti-wrinkle', 'Oil control', 'Cleansing', 'Scalp care', 'Body care', 'To discuss'],
    packaging: zh ? ['水凝膜 · 瓶装', '水凝膜 · 单片袋装', '水凝膜 · 泡壳片装', '护肤 · 玻璃瓶', '护肤 · PET 瓶', '护肤 · PETG 瓶', '护肤 · PP 瓶', '护肤 · PCR 再生塑料瓶', '护肤 · 真空瓶', '护肤 · 面霜罐', '护肤 · 软管', '待讨论'] : ['Hydrogel · jar', 'Hydrogel · individual sachet', 'Hydrogel · blister tray', 'Skincare · glass bottle', 'Skincare · PET', 'Skincare · PETG', 'Skincare · PP', 'Skincare · PCR plastic', 'Skincare · airless bottle', 'Skincare · cream jar', 'Skincare · tube', 'To discuss'],
    color: zh ? ['透明', '乳白', '粉色', '蓝色', '绿色', '金色', '按品牌色定制', '待讨论'] : ['Clear', 'White', 'Pink', 'Blue', 'Green', 'Gold', 'Custom brand colour', 'To discuss'],
    texture: zh ? ['水凝胶', '清爽水感', '轻盈乳液', '柔润面霜', '丰润膏霜', '精华油', '泡沫', '待讨论'] : ['Hydrogel', 'Watery', 'Light lotion', 'Soft cream', 'Rich balm', 'Oil', 'Foam', 'To discuss'],
    quantity: ['1,000–3,000', '3,000–5,000', '5,000–10,000', '10,000–50,000', '50,000+', zh ? '先打样，再确定数量' : 'Samples first'],
    budget: zh ? ['待报价后确认', '单件低于 US$1', '单件 US$1–3', '单件 US$3–5', '单件 US$5 以上'] : ['Confirm after quote', 'Below US$1 / unit', 'US$1–3 / unit', 'US$3–5 / unit', 'Above US$5 / unit'],
    launch: zh ? ['1–3 个月', '3–6 个月', '6–12 个月', '时间待定'] : ['1–3 months', '3–6 months', '6–12 months', 'Flexible']
  };
}
