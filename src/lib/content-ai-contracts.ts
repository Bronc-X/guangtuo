import {z} from 'zod';
import {marketingCopySchema} from './marketing-contracts';

export const contentAiBrief = z.strictObject({
  kind: z.enum(['article', 'marketing']), topic: z.string().trim().min(2).max(300),
  facts: z.string().trim().min(2).max(8000), sourceText: z.string().max(20000).default(''),
  sourceUrl: z.union([z.literal(''), z.url()]).default(''),
  referenceMediaId: z.uuid().nullable().default(null), language: z.enum(['zh', 'en']).default('zh'),
  imageStyle: z.string().trim().max(1000).default('写实产品摄影，简洁背景，保留产品形状与包装结构')
});
export const contentAiPrompts = z.strictObject({textPrompt: z.string().trim().min(10).max(14000), imagePrompt: z.string().trim().min(10).max(6000)});
export const contentAiArticle = z.strictObject({title: z.string().trim().min(1).max(120), summary: z.string().trim().min(1).max(300), body: z.string().trim().min(1).max(30000), category: z.string().trim().min(1).max(60)});
export const contentAiOutput = z.union([contentAiArticle, marketingCopySchema]);
export type ContentAiBrief = z.infer<typeof contentAiBrief>;
export type ContentAiPrompts = z.infer<typeof contentAiPrompts>;
export type ContentAiArticle = z.infer<typeof contentAiArticle>;
export type ContentAiJob = {
  id: string; version: number; brief: ContentAiBrief; prompts?: ContentAiPrompts;
  output?: z.infer<typeof contentAiOutput>; imageMediaId?: string;
  state: 'draft' | 'planning' | 'planned' | 'writing' | 'written' | 'imaging' | 'ready' | 'failed';
  error?: string; errorStep?: 'plan' | 'write' | 'image'; createdAt: string; updatedAt: string;
  adopted?: {kind: 'article' | 'marketing'; id: string}; textModel: string; imageModel: string;
};
export type ContentAiStatus = {configured: boolean; textModel: string; imageModel: string};
export type ContentAiSource = {url: string; title: string; text: string; images: string[]};
