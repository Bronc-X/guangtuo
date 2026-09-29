import {z} from 'zod';

export const bufferPlatforms = ['linkedin', 'facebook', 'instagram', 'youtube', 'tiktok'] as const;
export type BufferPlatform = typeof bufferPlatforms[number];
export type BufferChannel = {id: string; name: string; service: string; timezone: string; isDisconnected: boolean; isLocked: boolean; isQueuePaused: boolean};
export type BufferConnection = {connected: boolean; organizations: {id: string; name: string}[]; organizationId: string; channels: BufferChannel[]; checkedAt?: string; error?: string};
export const bufferDraftSchema = z.strictObject({
  requestId: z.uuid(), campaignId: z.uuid(), version: z.number().int().positive(), platform: z.enum(bufferPlatforms),
  media: z.enum(['image','video']), mode: z.enum(['customScheduled','addToQueue']), dueAt: z.iso.datetime().optional(),
  aiGenerated: z.boolean(),
});
export type BufferDraft = z.infer<typeof bufferDraftSchema>;
export type BufferSchedule = BufferDraft & {
  id: string; title: string; text: string; createdAt: string; updatedAt: string; actor: string;
  state: 'draft'|'submitting'|'scheduled'|'sending'|'sent'|'failed'|'unknown'|'approval'|'manual'|'cancelling'|'cancelled';
  channelId?: string; channelName?: string; organizationId?: string; remoteId?: string;
  message: string; externalLink?: string; sentAt?: string; nextCheckAt?: string; checks: number; retryable: boolean;
};
export const bufferStateNames: Record<BufferSchedule['state'], string> = {
  draft:'排期草稿', submitting:'正在提交', scheduled:'已排期', sending:'发布中', sent:'已发布', failed:'失败',
  unknown:'结果待核查', approval:'等待审核', manual:'需手动发布', cancelling:'正在取消', cancelled:'已取消',
};
