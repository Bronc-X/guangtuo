import {textStylesSchema, type TextStyles} from './cms-typography';
import {z} from 'zod';
import {aboutTextFields} from './about-fields';

export const loginRequestSchema = z.strictObject({
  username: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(512)
});

export const homeFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  heroTitle: z.string().max(120),
  heroBody: z.string().max(600),
  heroMediaId: z.uuid().nullable()
});

export const homePatchSchema = homeFieldsSchema.extend({
  version: z.number().int().nonnegative()
});

export const articleFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  title: z.string().max(120),
  summary: z.string().max(300),
  body: z.string().max(30_000),
  category: z.string().max(60),
  coverMediaId: z.uuid().nullable()
});

export const articlePatchSchema = articleFieldsSchema.extend({
  version: z.number().int().positive()
});

export const publishRequestSchema = z.strictObject({
  version: z.number().int().nonnegative()
});

export const managedContentKinds = ['pages', 'products', 'formats', 'credentials'] as const;
export const managedContentKindSchema = z.enum(managedContentKinds);

const managedImageMediaIdSchema = z.uuid().nullable();

export const managedPageFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  ...aboutTextFields,
  wechatQrMediaId: managedImageMediaIdSchema.optional(), whatsappQrMediaId: managedImageMediaIdSchema.optional(), tiktokQrMediaId: managedImageMediaIdSchema.optional(),
  heroTitle: z.string().max(160),
  heroBody: z.string().max(1_000)
});

export const managedProductFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  name: z.string().max(160),
  description: z.string().max(1_200),
  highlights: z.string().max(2_000),
  applications: z.string().max(2_000),
  netWeight: z.string().max(120),
  packFormat: z.string().max(300),
  moqQuantity: z.number().int().positive().max(10_000_000).nullable(),
  moqUnit: z.enum(['pieces', 'bottles']),
  imageMediaId: managedImageMediaIdSchema
});

export const managedFormatFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  name: z.string().max(160),
  effects: z.string().max(1_000),
  specification: z.string().max(300),
  moq: z.string().max(200),
  packaging: z.string().max(300),
  imageMediaId: managedImageMediaIdSchema
});

export const managedCredentialFieldsSchema = z.strictObject({
  textStyles: textStylesSchema.optional(),
  title: z.string().max(220),
  kind: z.string().max(120),
  number: z.string().max(120),
  rightsholder: z.string().max(220),
  imageMediaId: managedImageMediaIdSchema,
  pdfMediaId: z.uuid().nullable().optional()
});

export const managedContentFieldSchemas = {
  pages: managedPageFieldsSchema,
  products: managedProductFieldsSchema,
  formats: managedFormatFieldsSchema,
  credentials: managedCredentialFieldsSchema
} as const;

export type HomeFields = z.infer<typeof homeFieldsSchema>;
export type ArticleFields = z.infer<typeof articleFieldsSchema>;
export type ManagedContentKind = z.infer<typeof managedContentKindSchema>;
export type ManagedPageFields = z.infer<typeof managedPageFieldsSchema>;
export type ManagedProductFields = z.infer<typeof managedProductFieldsSchema>;
export type ManagedFormatFields = z.infer<typeof managedFormatFieldsSchema>;
export type ManagedCredentialFields = z.infer<typeof managedCredentialFieldsSchema>;
export type ManagedContentFieldsByKind = {
  pages: ManagedPageFields;
  products: ManagedProductFields;
  formats: ManagedFormatFields;
  credentials: ManagedCredentialFields;
};

export type ManagedContentDto<Kind extends ManagedContentKind = ManagedContentKind> = {
  id: string;
  kind: Kind;
  label: string;
  fields: ManagedContentFieldsByKind[Kind];
  image: string;
  version: number;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
  published: ManagedContentFieldsByKind[Kind] | null;
};

export type HomeDto = HomeFields & {
  id: 'home';
  heroImage: string;
  version: number;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
  published: HomeFields | null;
};

export type ArticleDto = ArticleFields & {
  id: string;
  slug: string;
  cover: string;
  version: number;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
  published: ArticleFields | null;
};

export type MediaDto = {
  id: string;
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  size: number;
  width: number;
  height: number;
  createdAt: string;
  url: string;
};

export type ReleaseDto = {
  id: string;
  kind: 'home' | 'article' | ManagedContentKind;
  title: string;
  status: 'building' | 'live' | 'failed';
  publishedAt: string;
  message?: string;
};

export type PublishedContentSnapshot = {
  translationRevision?: string;
  translations?: Record<'en' | 'fr' | 'es' | 'ru' | 'ar', Record<string, string>>;
  schemaVersion: 1;
  releaseId: string;
  publishedAt: string;
  home: {textStyles?: TextStyles; heroTitle: string; heroBody: string; heroImage: string} | null;
  articles: Array<{
    textStyles?: TextStyles;
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    category: string;
    cover: string;
    publishedAt: string;
  }>;
  pageOverrides?: Array<{textStyles?: TextStyles; pageId: string; heroTitle: string; heroBody: string}>;
  productOverrides?: Array<{
    textStyles?: TextStyles;
    productId: string;
    name: string;
    description: string;
    highlights: string[];
    applications: string[];
    netWeight: string;
    packFormat: string;
    moqQuantity: number | null;
    moqUnit: 'pieces' | 'bottles';
    image: string;
  }>;
  formatOverrides?: Array<{
    textStyles?: TextStyles;
    formatId: string;
    name: string;
    effects: string;
    specification: string;
    moq: string;
    packaging: string;
    image: string;
  }>;
  credentialOverrides?: Array<{
    textStyles?: TextStyles;
    credentialId: string;
    title: string;
    kind: string;
    number: string;
    rightsholder: string;
    image: string;
    pdf?: string;
  }>;
};
