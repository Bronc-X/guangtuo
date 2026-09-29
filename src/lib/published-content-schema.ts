import {textStylesSchema} from './cms-typography';
import {z} from 'zod';
import {aboutTextFields} from './about-fields';

const sameOriginImageSchema = z.string().trim().regex(
  /^\/(?:assets\/|uploads\/cms\/)[^?#]+$/,
  'Image must use a same-origin /assets/ or /uploads/cms/ path'
).refine(
  (value) => !value.includes('\\') && !/%(?:2f|5c|2e)/i.test(value) && !value.split('/').includes('..'),
  'Image path must not contain traversal segments or encoded separators'
);

const publishedHomeSchema = z.object({
  textStyles: textStylesSchema.optional(),
  heroTitle: z.string().trim().min(1).max(120),
  heroBody: z.string().trim().min(1).max(600),
  heroImage: sameOriginImageSchema
}).strict();

const plainTextBodySchema = z.string().trim().min(1).max(30000).refine(
  (value) => !/<\/?[a-z][^>]*>/i.test(value),
  'Article body must be plain text without HTML markup'
);

const publishedArticleSchema = z.object({
  textStyles: textStylesSchema.optional(),
  id: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(300),
  body: plainTextBodySchema,
  category: z.string().trim().min(1).max(60),
  cover: sameOriginImageSchema,
  publishedAt: z.string().datetime({offset: true})
}).strict();

const publishedPageOverrideSchema = z.object({
  textStyles: textStylesSchema.optional(),
  ...aboutTextFields,
  wechatQr: sameOriginImageSchema.optional(), whatsappQr: sameOriginImageSchema.optional(), tiktokQr: sameOriginImageSchema.optional(),
  pageId: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  heroTitle: z.string().trim().min(1).max(160),
  heroBody: z.string().trim().min(1).max(1_000)
}).strict();

const publishedProductOverrideSchema = z.object({
  textStyles: textStylesSchema.optional(),
  productId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1_200),
  highlights: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  applications: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  netWeight: z.string().trim().min(1).max(120),
  packFormat: z.string().trim().max(300),
  moqQuantity: z.number().int().positive().max(10_000_000).nullable(),
  moqUnit: z.enum(['pieces', 'bottles']),
  image: sameOriginImageSchema
}).strict();

const publishedFormatOverrideSchema = z.object({
  textStyles: textStylesSchema.optional(),
  formatId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  effects: z.string().trim().min(1).max(1_000),
  specification: z.string().trim().min(1).max(300),
  moq: z.string().trim().min(1).max(200),
  packaging: z.string().trim().min(1).max(300),
  image: sameOriginImageSchema
}).strict();

const publishedCredentialOverrideSchema = z.object({
  textStyles: textStylesSchema.optional(),
  credentialId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(220),
  kind: z.string().trim().min(1).max(120),
  number: z.string().trim().min(1).max(120),
  rightsholder: z.string().trim().min(1).max(220),
  image: sameOriginImageSchema,
  pdf: sameOriginImageSchema.refine((value) => value.endsWith('.pdf'), 'Attachment must be a PDF').optional()
}).strict();

export const publishedContentSchema = z.object({
  schemaVersion: z.literal(1),
  releaseId: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/),
  publishedAt: z.string().datetime({offset: true}),
  translations: z.record(z.enum(['en', 'fr', 'es', 'ru', 'ar']), z.record(z.string(), z.string().trim().min(1).max(120000))).optional(),
  translationRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  home: publishedHomeSchema.nullable(),
  articles: z.array(publishedArticleSchema).max(500),
  pageOverrides: z.array(publishedPageOverrideSchema).max(20).default([]),
  productOverrides: z.array(publishedProductOverrideSchema).max(500).default([]),
  formatOverrides: z.array(publishedFormatOverrideSchema).max(500).default([]),
  credentialOverrides: z.array(publishedCredentialOverrideSchema).max(200).default([])
}).strict().superRefine((snapshot, context) => {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const [index, article] of snapshot.articles.entries()) {
    if (ids.has(article.id)) {
      context.addIssue({code: 'custom', path: ['articles', index, 'id'], message: `Duplicate article id: ${article.id}`});
    }
    if (slugs.has(article.slug)) {
      context.addIssue({code: 'custom', path: ['articles', index, 'slug'], message: `Duplicate article slug: ${article.slug}`});
    }
    ids.add(article.id);
    slugs.add(article.slug);
  }

  for (const [key, records] of [
    ['pageOverrides', snapshot.pageOverrides.map((item) => item.pageId)],
    ['productOverrides', snapshot.productOverrides.map((item) => item.productId)],
    ['formatOverrides', snapshot.formatOverrides.map((item) => item.formatId)],
    ['credentialOverrides', snapshot.credentialOverrides.map((item) => item.credentialId)]
  ] as const) {
    const seen = new Set<string>();
    records.forEach((id, index) => {
      if (seen.has(id)) context.addIssue({code: 'custom', path: [key, index], message: `Duplicate managed content id: ${id}`});
      seen.add(id);
    });
  }
});

export type PublishedContentSnapshot = z.infer<typeof publishedContentSchema>;
export type PublishedHome = NonNullable<PublishedContentSnapshot['home']>;
export type PublishedPageOverride = PublishedContentSnapshot['pageOverrides'][number];
export type PublishedProductOverride = PublishedContentSnapshot['productOverrides'][number];
export type PublishedFormatOverride = PublishedContentSnapshot['formatOverrides'][number];
export type PublishedCredentialOverride = PublishedContentSnapshot['credentialOverrides'][number];

export function parsePublishedContent(input: unknown): PublishedContentSnapshot {
  return publishedContentSchema.parse(input);
}
