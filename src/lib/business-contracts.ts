import {z} from 'zod';

const short = z.string().trim().max(300);
const text = z.string().max(12000);
export const businessPlatforms = ['独立站', '微信公众号', '小红书', '抖音', 'LinkedIn', 'Facebook', 'Instagram', 'YouTube', 'TikTok', '其他'] as const;
export const stageLabels = {new: '待筛选', qualified: '已确认需求', contacted: '跟进中', quoted: '已报价', won: '已成交', lost: '已关闭'} as const;
export const opportunityFields = z.object({
  name: short.min(1, '请填写客户或账号名称'), company: short.default(''), contact: short.default(''),
  platform: z.enum(businessPlatforms).default('其他'), kind: z.enum(['public', 'inbound']).default('public'),
  sourceUrl: z.union([z.literal(''), z.url().refine(value => /^https?:\/\//i.test(value), '来源链接须为 http 或 https')]).default(''),
  requirements: text.default(''), market: short.default(''), stage: z.enum(Object.keys(stageLabels) as [keyof typeof stageLabels, ...Array<keyof typeof stageLabels>]).default('new'),
  owner: short.default(''), nextAction: z.string().max(2000).default(''), nextDate: z.union([z.literal(''), z.iso.date()]).default(''), notes: text.default('')
});
export type OpportunityFields = z.infer<typeof opportunityFields>;
export type Opportunity = OpportunityFields & {id: string; version: number; source: 'manual' | 'import' | 'website' | 'chatwoot' | 'tikhub'; externalId: string; createdAt: string; updatedAt: string};
export const documentKinds = {proposal: '合作方案', quote: '报价单', contract: '合同草稿'} as const;
const money = z.string().regex(/^(?:|(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?)$/, '金额请填写小于一百万、最多两位小数的非负数');
export const commercialFields = z.object({
  title: short.min(1), seller: text.default(''), buyer: text.default(''), contact: short.default(''),
  currency: z.enum(['CNY', 'USD', 'EUR', 'GBP']).default('USD'),
  items: z.array(z.object({name: short.min(1), specification: z.string().max(2000).default(''), quantity: z.number().int().min(1).max(100000), unit: short.default('件'), unitPrice: money.default('')})).min(1).max(100),
  discount: money.default('0'), shipping: money.default('0'), taxPercent: z.number().min(0).max(100).refine(n => Number.isInteger(Math.round(n * 1000000) / 10000), '税率最多两位小数').default(0),
  validUntil: z.union([z.literal(''), z.iso.date()]).default(''), delivery: z.string().max(4000).default(''), payment: z.string().max(4000).default(''),
  body: z.string().max(30000).default(''), terms: z.string().max(30000).default('')
});
export type CommercialFields = z.infer<typeof commercialFields>;
export type CommercialDocument = CommercialFields & {id: string; number: string; version: number; kind: keyof typeof documentKinds; opportunityId: string; opportunityVersion: number; status: 'draft' | 'reviewed'; createdAt: string; updatedAt: string};
export type BusinessStatus = {chatwoot: {ready: boolean; message: string}; tikhub: {ready: boolean; message: string; remainingRequests: number}};
export type ImportResult = {added: number; skipped: number; received: number};

export function moneyMinor(value: string): number {
  const [whole, fraction = ''] = (value || '0').split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function commercialTotals(fields: CommercialFields) {
  const lines = fields.items.map(item => item.quantity * moneyMinor(item.unitPrice));
  const subtotal = lines.reduce((sum, n) => sum + n, 0);
  const discount = moneyMinor(fields.discount), shipping = moneyMinor(fields.shipping);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number((BigInt(taxable) * BigInt(Math.round(fields.taxPercent * 100)) + BigInt(5000)) / BigInt(10000));
  return {lines, subtotal, discount, shipping, tax, total: taxable + tax + shipping, incomplete: fields.items.some(item => item.unitPrice === '') || fields.shipping === '' || fields.discount === ''};
}
export function formatMoney(minor: number, currency: string) {return `${currency} ${(minor / 100).toFixed(2)}`;}
export function documentMissing(fields: CommercialFields) {
  return [!fields.seller.trim() && '供应方主体', !fields.buyer.trim() && '客户主体', commercialTotals(fields).incomplete && '价格', !fields.validUntil && '有效日期', !fields.delivery.trim() && '交付约定', !fields.payment.trim() && '付款约定', !fields.terms.trim() && '其他条款'].filter(Boolean) as string[];
}
