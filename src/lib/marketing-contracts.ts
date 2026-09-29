import {z} from 'zod';

export const marketingPlatforms = ['wechat', 'xiaohongshu', 'douyin', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok'] as const;
export const platformNames: Record<MarketingPlatform, string> = {wechat: '微信公众号', xiaohongshu: '小红书', douyin: '抖音', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok'};
export type MarketingPlatform = typeof marketingPlatforms[number];
export const marketingBriefSchema = z.strictObject({topic: z.string().trim().min(2).max(300), facts: z.string().trim().min(2).max(3500), language: z.enum(['zh', 'en']), imageMediaId: z.uuid(), mode: z.enum(['template', 'ai', 'manual']).default('template')});
export const marketingManualSchema = z.strictObject({requestId:z.uuid(),title:z.string().trim().min(2).max(80),text:z.string().trim().min(2).max(4000),imageMediaId:z.uuid()});
export type MarketingManual = z.infer<typeof marketingManualSchema>;
export const marketingCopySchema = z.strictObject({title: z.string().trim().min(1).max(80), posts: z.array(z.strictObject({platform: z.enum(marketingPlatforms), text: z.string().trim().min(1).max(4000)})).length(8).refine(posts => new Set(posts.map(p => p.platform)).size === 8), scenes: z.array(z.string().trim().min(1).max(90)).min(3).max(6)});
export type MarketingCopy = z.infer<typeof marketingCopySchema>;
export type MarketingBrief = z.infer<typeof marketingBriefSchema>;
export type MarketingReceipt = {platform: MarketingPlatform; state: 'submitting' | 'submitted' | 'unknown' | 'failed'; id?: string; message: string; at: string};
export type MarketingCampaign = {id: string; version: number; brief: MarketingBrief; copy: MarketingCopy; createdAt: string; updatedAt: string; videoState: 'idle' | 'rendering' | 'ready' | 'failed'; videoError?: string; receipts: MarketingReceipt[]; sourceRequestId?:string};
export type MarketingChannel = {platform: MarketingPlatform; name: string; ready: boolean; message: string; integrationId?: string};
export type MarketingStatus = {aiConfigured: boolean; videoConfigured: boolean; channels: MarketingChannel[]};
export type MarketingTrend = {title: string; url: string; source: string; publishedAt: string};
export const marketingPublishSchema = z.strictObject({version: z.number().int().positive(), platforms: z.array(z.enum(marketingPlatforms)).min(1).max(8), confirmed: z.literal(true), visibility: z.enum(['public', 'private'])});
