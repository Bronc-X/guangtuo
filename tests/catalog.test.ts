import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {categories, legacyCategories, productInCategory, products as allProducts, validateCatalog, type LocalizedText, type Product, type ProductOptionGroup} from '@/data/catalog';
import {hydrogelFormats, hydrogelMaterialFamilies, hydrogelPatentProofs, hydrogelProcessSteps, localizeHydrogelMeasure} from '@/data/hydrogel-formats';

const localeKeys = ['en', 'zh', 'fr', 'es', 'ru', 'ar'] as const;
const products = allProducts.filter((product) => !product.sourcePage);
const localized = (en: string): LocalizedText => ({en, zh: en, fr: en, es: en, ru: en, ar: en});

function expectLocalizedText(value: LocalizedText) {
  expect(Object.keys(value).sort()).toEqual([...localeKeys].sort());
  for (const locale of localeKeys) expect(value[locale].trim()).not.toBe('');
}

describe('finished-product catalog contract', () => {
  it('adds all 57 brochure entries without duplicating the 21 established product routes', () => {
    expect(allProducts).toHaveLength(78);
    expect(categories).toHaveLength(13);
    expect(new Set(allProducts.map((product) => product.slug)).size).toBe(78);
    const brochure = allProducts.filter((product) => product.sourcePage);
    expect(brochure).toHaveLength(57);
    expect(brochure.filter((product) => product.isNew)).toHaveLength(6);
    for (const product of brochure) {
      expect(product.sourcePage).toBeGreaterThanOrEqual(8);
      expect(product.sourcePage).toBeLessThanOrEqual(20);
      expect(productInCategory(product, product.category)).toBe(true);
      expect(product.media?.image).toBeTruthy();
      expect(existsSync(join(process.cwd(), 'public', product.media!.image!.slice(1)))).toBe(true);
      expect(product.commercialTerms.moq).toBeNull();
    }
  });
  it('ships twenty-one stable product records in the approved category mix', () => {
    expect(products).toHaveLength(21);
    expect(products.filter((product) => product.category === 'face-masks')).toHaveLength(5);
    expect(products.filter((product) => product.category === 'eye-masks')).toHaveLength(9);
    expect(products.filter((product) => product.category === 'specialty-patches')).toHaveLength(7);
    expect(new Set(products.map((product) => product.productId)).size).toBe(21);
    expect(new Set(products.map((product) => product.sku)).size).toBe(21);
    expect(new Set(products.map((product) => product.slug)).size).toBe(21);
    expect(products.every((product) => legacyCategories.some((category) => category.slug === product.category))).toBe(true);
  });

  it('gives each product one V01 sellable SKU derived from its stable product id', () => {
    expect(products.map((product) => product.productId)).toEqual([
      'GT-FM-001', 'GT-FM-002', 'GT-FM-003', 'GT-EM-001', 'GT-FM-004',
      'GT-EM-002', 'GT-NM-001', 'GT-EM-003', 'GT-EM-004', 'GT-EM-005',
      'GT-EM-006', 'GT-EM-007', 'GT-EM-008', 'GT-FM-005', 'GT-EM-009',
      'GT-LP-001', 'GT-FP-001', 'GT-NP-001', 'GT-VL-001', 'GT-FE-001', 'GT-JM-001'
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
      'Blue Moisturizing Eye Mask',
      'Polymer Gel Face Mask',
      'Polymer Gel Cold-Compress Eye Mask',
      'Individual Hydrogel Lip Patch',
      'Polymer Gel Forehead Patch',
      'Nasolabial Folds Patch',
      'Polymer Gel V-Line Lifting Patch',
      'Forehead & Eye 2-in-1 Anti-Wrinkle Patch',
      'Double Ear-Hook Jawline Mask'
    ]);
  });

  it('provides complete natural-language fields for all six site locales', () => {
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
      expect(product.media?.image).toMatch(/^\/assets\/products\/(?:masks|hydrogel)\//);
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
      '100 g', '100 g', '100 g', '100 g', '100 g', '100 g',
      '30 g', '8 g', '6 g', '5 g', '3 g', '15 g', '15 g', '25 g'
    ]);
    expect(products.map((product) => product.commercialTerms.moq?.quantity)).toEqual([
      50000, 50000, 50000, 10000, 10000, 10000, 10000,
      10000, 10000, 10000, 10000, 10000, 10000,
      25000, 25000, 10000, 50000, 50000, 25000, 25000, 25000
    ]);
    expect(products.map((product) => product.commercialTerms.moq?.unit)).toEqual([
      'pieces', 'pieces', 'pieces', 'bottles', 'pieces', 'pieces', 'pieces',
      'bottles', 'bottles', 'bottles', 'bottles', 'bottles', 'bottles',
      'pieces', 'pieces', 'pieces', 'pieces', 'pieces', 'pieces', 'pieces', 'pieces'
    ]);
  });

  it('publishes the source-backed hydrogel atlas, production flow and patent evidence', () => {
    expect(hydrogelFormats).toHaveLength(41);
    expect(hydrogelFormats.filter((format) => format.category === 'face-masks')).toHaveLength(7);
    expect(hydrogelFormats.filter((format) => format.category === 'eye-masks')).toHaveLength(21);
    expect(hydrogelFormats.filter((format) => format.category === 'specialty-patches')).toHaveLength(13);
    expect(new Set(hydrogelFormats.map((format) => format.id)).size).toBe(41);
    expect(hydrogelFormats.every((format) => format.image.startsWith('/assets/products/hydrogel/formats/'))).toBe(true);
    expect(hydrogelFormats.every((format) => format.sourceSlide >= 21 && format.sourceSlide <= 29)).toBe(true);
    expect(hydrogelMaterialFamilies).toHaveLength(5);
    expect(hydrogelProcessSteps).toHaveLength(12);
    expect(hydrogelPatentProofs).toHaveLength(5);
    expect(new Set(hydrogelPatentProofs.map((patent) => patent.patentNo)).size).toBe(5);
    expect(localizeHydrogelMeasure('1.4 g × 60 pieces / box', 'zh')).toBe('1.4 g × 60 片 / 盒');
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
