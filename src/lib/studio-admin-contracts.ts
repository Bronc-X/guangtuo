import {z} from 'zod';
import {allPackagingProducts} from '@/data/legacy-packaging-catalog';

const packagingSkus = allPackagingProducts.map((product) => product.sku);
export const studioSku = z.string().refine((sku) => packagingSkus.includes(sku), 'Unknown packaging model');
export const studioId = z.string().regex(/^[a-f0-9]{32}$/);
const specifications = z.record(z.string().min(1).max(64), z.string().min(1).max(128)).refine(value => Object.keys(value).length <= 12).default({});
export const studioConceptRequest = z.strictObject({sku: studioSku, prompt: z.string().trim().min(12).max(1200), specifications, confirmed: z.boolean()});
export const studioJobRequest = z.strictObject({sku: studioSku, conceptImageId: studioId, seed: z.number().int().min(0).max(2_147_483_647).default(1234), specifications, confirmed: z.boolean()});
export type StudioConcept = {id: string; sku: string; image_url: string; cached: boolean};
export type StudioJob = {id: string; sku: string; status: 'queued' | 'preparing' | 'generating' | 'finalizing' | 'completed' | 'failed'; progress: number; model_url: string | null; cached: boolean; error: string | null};
