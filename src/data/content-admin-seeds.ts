import {products} from '@/data/catalog';
import {companyPageCopy, companyText} from '@/data/company-page-copy';
import {hydrogelFormats} from '@/data/hydrogel-formats';
import {patentDocuments} from '@/data/patent-documents';
import type {
  ManagedContentFieldsByKind,
  ManagedContentKind
} from '@/lib/content-admin-contracts';

export type ManagedContentSeed<Kind extends ManagedContentKind = ManagedContentKind> = {
  id: string;
  kind: Kind;
  label: string;
  sortOrder: number;
  fields: ManagedContentFieldsByKind[Kind] & {legacyImage?: string};
};

const pageLabels = {
  customization: '定制开发',
  process: '合作流程',
  factory: '制造与品控',
  about: '关于修齐',
  contact: '联系我们',
  patents: '专利与资质'
} as const;

const pageSeeds: Array<ManagedContentSeed<'pages'>> = Object.entries(pageLabels).map(([id, label], index) => {
  const page = companyPageCopy[id as keyof typeof pageLabels];
  return {
    id,
    kind: 'pages',
    label,
    sortOrder: index + 1,
    fields: {
      heroTitle: companyText('zh', page.intro.title),
      heroBody: companyText('zh', page.intro.body)
    }
  };
});

const productSeeds: Array<ManagedContentSeed<'products'>> = products.map((product, index) => ({
  id: product.productId,
  kind: 'products',
  label: product.name.zh,
  sortOrder: product.sortOrder ?? index + 1,
  fields: {
    name: product.name.zh,
    description: product.description.zh,
    highlights: product.highlights.map((item) => item.zh).join('\n'),
    applications: product.applications.map((item) => item.zh).join('\n'),
    netWeight: product.specifications.find((item) => item.id === 'net-weight')?.value.zh ?? '',
    packFormat: product.specifications.find((item) => item.id === 'pack-format')?.value.zh ?? '',
    moqQuantity: product.commercialTerms.moq?.quantity ?? null,
    moqUnit: product.commercialTerms.moq?.unit ?? 'pieces',
    imageMediaId: null,
    legacyImage: product.media?.image ?? ''
  }
}));

const formatSeeds: Array<ManagedContentSeed<'formats'>> = hydrogelFormats.map((format, index) => ({
  id: format.id,
  kind: 'formats',
  label: format.name.zh,
  sortOrder: index + 1,
  fields: {
    name: format.name.zh,
    effects: format.effects.zh,
    specification: format.specification,
    moq: format.moq,
    packaging: format.packaging.zh,
    imageMediaId: null,
    legacyImage: format.image
  }
}));

const credentialSeeds: Array<ManagedContentSeed<'credentials'>> = patentDocuments.map((document, index) => ({
  id: document.id,
  kind: 'credentials',
  label: document.title.zh,
  sortOrder: index + 1,
  fields: {
    title: document.title.zh,
    kind: document.kind.zh,
    number: document.number,
    rightsholder: document.rightsholder.zh,
    imageMediaId: null,
    legacyImage: document.image
  }
}));

export const managedContentSeeds: ManagedContentSeed[] = [
  ...pageSeeds,
  ...productSeeds,
  ...formatSeeds,
  ...credentialSeeds
];
