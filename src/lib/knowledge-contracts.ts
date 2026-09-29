import {z} from 'zod';

export const knowledgeLocale = z.enum(['en', 'zh', 'fr', 'es', 'ru', 'ar']);
export const knowledgeMetadata = z.strictObject({title: z.string().trim().min(1).max(200), locale: knowledgeLocale, skus: z.array(z.string().trim().min(1).max(64)).max(40).default([])});
export const knowledgeUpdate = z.strictObject({title: z.string().trim().min(1).max(200).optional(), skus: z.array(z.string().trim().min(1).max(64)).max(40).optional(), status: z.enum(['draft', 'active', 'archived']).optional(), visibility: z.enum(['internal', 'customer']).optional(), reviewed: z.boolean().optional()});
export const knowledgeSearch = z.strictObject({query: z.string().trim().min(1).max(2000), mode: z.enum(['bm25', 'hybrid']).default('bm25'), audience: z.enum(['internal', 'customer']).default('customer'), locale: knowledgeLocale.optional(), sku: z.string().max(64).optional(), limit: z.number().int().min(1).max(10).default(6)});
export type KnowledgeDocument = z.infer<typeof knowledgeMetadata> & {id: string; version: number; fileName: string; sha256: string; status: 'draft' | 'active' | 'archived'; visibility: 'internal' | 'customer'; parseState: 'ready' | 'needs_ocr' | 'failed'; chunkCount: number; warnings: string[]; error?: string; createdAt: number; updatedAt: number};
export type SourceReference = {chunkId: string; documentId: string; version: number; title: string; location: string};
export type KnowledgeHit = SourceReference & {text: string; score: number};
export type KnowledgeCitation = SourceReference & {quote: string};
export type KnowledgeSearchResult = {mode: 'bm25' | 'hybrid'; embeddingProfile?: string; items: KnowledgeHit[]};
export type Grounding = {mode: 'bm25' | 'hybrid'; model: string; generatedAt: number; citations: KnowledgeCitation[]};
