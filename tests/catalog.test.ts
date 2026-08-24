import {describe, expect, it} from 'vitest';
import {categories, products, validateCatalog, type LocalizedText, type Product, type ProductOptionGroup} from '@/data/catalog';

const localeKeys = ['en', 'zh', 'fr', 'es'] as const;
const localized = (en: string): LocalizedText => ({en, zh: en, fr: en, es: en});

function expectLocalizedText(value: LocalizedText) {
  expect(Object.keys(value).sort()).toEqual([...localeKeys].sort());
  for (const locale of localeKeys) expect(value[locale].trim()).not.toBe('');
}

describe('finished-product catalog contract', () => {
  it('ships thirteen stable product records in the approved category mix', () => {
    expect(products).toHaveLength(13);
    expect(products.filter((product) => product.category === 'face-masks')).toHaveLength(4);
    expect(products.filter((product) => product.category === 'eye-masks')).toHaveLength(8);
    expect(products.filter((product) => product.category === 'neck-masks')).toHaveLength(1);
    expect(new Set(products.map((product) => product.productId)).size).toBe(13);
    expect(new Set(products.map((product) => product.sku)).size).toBe(13);
    expect(new Set(products.map((product) => product.slug)).size).toBe(13);
    expect(products.every((product) => categories.some((category) => category.slug === product.category))).toBe(true);
  });

  it('gives each product one V01 sellable SKU derived from its stable product id', () => {
    expect(products.map((product) => product.productId)).toEqual([
      'GT-FM-001', 'GT-FM-002', 'GT-FM-003', 'GT-EM-001', 'GT-FM-004',
      'GT-EM-002', 'GT-NM-001', 'GT-EM-003', 'GT-EM-004', 'GT-EM-005',
      'GT-EM-006', 'GT-EM-007', 'GT-EM-008'
    ]);
    for (const product of products) expect(product.sku).toBe(`${product.productId}-V01`);
  });

  it('uses the corrected Sheet1 English product names', () => {
    expect(products.map((product) => product.name.en)).toEqual([
      'Collagen Elastic Face Mask',
      'Centella Asiatica Soothing Brightening Mask',
      'Copper Tripeptide-1 Soothing Collagen Brightening Mask',
      'Red-Gold Dual-Color Hyaluronic Acid Eye Mask',
      'Anti-Wrinkle Cream Mask with Micropore Cooling Technology',
      'Astaxanthin Microporous Ice-Guided Eye Mask',
      'Collagen Microporous Anti-Wrinkle Neck Mask',
      'Aloe Vera Moisturizing Eye Mask',
      'Collagen Moisturizing Eye Mask',
      'Gold Collagen Eye Mask',
      'Pink Collagen Peptide Eye Mask',
      'Collagen Peptide Eye Mask',
      'Blue Moisturizing Eye Mask'
    ]);
  });

  it('provides complete natural-language fields for all four site locales', () => {
    for (const category of categories) expectLocalizedText(category.name);
    for (const product of products) {
      expectLocalizedText(product.name);
      expectLocalizedText(product.eyebrow);
      expectLocalizedText(product.description);
      expect(product.highlights.length).toBeGreaterThan(0);
      expect(product.applications.length).toBeGreaterThan(0);
      expect(product.specifications.length).toBeGreaterThan(0);
      product.highlights.forEach(expectLocalizedText);
      product.applications.forEach(expectLocalizedText);
      for (const specification of product.specifications) {
        expectLocalizedText(specification.label);
        expectLocalizedText(specification.value);
      }
    }
  });

  it('keeps the draft catalogue source-backed while exposing the supplied product imagery', () => {
    for (const [index, product] of products.entries()) {
      expect(product.publishStatus).toBe('draft');
      expect(product.sortOrder).toBe(index + 1);
      expect(product.media?.image).toMatch(/^\/assets\/products\/masks\//);
      expect(product.media?.imageStatus).toBe('available');
      expect(product.configurator3d).toBeUndefined();
    }
  });

  it('records spreadsheet certification text only as unverified raw claims', () => {
    for (const product of products) {
      expect(product.compliance.map((item) => item.claim)).toEqual(['ISO', 'GMPC', 'FDA', 'MSDS']);
      expect(product.compliance.every((item) => item.status === 'raw')).toBe(true);
      expect(product.compliance.some((item) => item.status === 'verified')).toBe(false);
    }
  });

  it('keeps source-backed net weights, MOQ quantities and MOQ units', () => {
    expect(products.map((product) => product.specifications.find((item) => item.id === 'net-weight')?.value.en)).toEqual([
      '35 g', '35 g', '35 g', '100 g', '29 g', '10.5 g', '13.5 g',
      '100 g', '100 g', '100 g', '100 g', '100 g', '100 g'
    ]);
    expect(products.map((product) => product.commercialTerms.moq.quantity)).toEqual([
      50000, 50000, 50000, 10000, 50000, 50000, 50000,
      10000, 10000, 10000, 10000, 10000, 10000
    ]);
    expect(products.map((product) => product.commercialTerms.moq.unit)).toEqual([
      'pieces', 'pieces', 'pieces', 'bottles', 'pieces', 'pieces', 'pieces',
      'bottles', 'bottles', 'bottles', 'bottles', 'bottles', 'bottles'
    ]);
  });

  it('retains runtime option-group upper-bound validation without generating variant combinations', () => {
    expect(validateCatalog(products)).toEqual([]);

    const option = {id: 'one', label: localized('One')};
    const group = (id: string, optionCount = 1): ProductOptionGroup => ({
      id,
      label: localized(id),
      options: Array.from({length: optionCount}, (_, index) => ({...option, id: `${id}-${index}`}))
    });
    const withGroups = (optionGroups: ProductOptionGroup[]): Product => ({...products[0], optionGroups});

    expect(validateCatalog([withGroups(Array.from({length: 7}, (_, index) => group(`group-${index}`)))])).toContain(
      'GT-FM-001-V01: too many option groups'
    );
    expect(validateCatalog([withGroups([group('oversized', 7)])])).toContain(
      'GT-FM-001-V01: too many options in a group'
    );
    expect(validateCatalog([withGroups(Array.from({length: 5}, (_, index) => group(`group-${index}`, 5)))])).toContain(
      'GT-FM-001-V01: too many option values'
    );
  });
});
