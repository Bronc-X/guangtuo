import {describe, expect, it} from 'vitest';

import {applyPublishedProductOverride, products} from '@/data/catalog';
import type {PublishedProductOverride} from '@/lib/published-content-schema';

describe('published product fields on the public catalog', () => {
  it('keeps editor lines as separate cards and shows newly entered specifications', () => {
    const product = structuredClone(products[0]);
    product.specifications = [];
    const chinese: PublishedProductOverride = {
      productId: product.productId,
      name: '新产品名',
      description: '更新的介绍',
      highlights: ['亮点一', '亮点二'],
      applications: ['用途一', '用途二'],
      netWeight: '30 g',
      packFormat: '独立袋装',
      moqQuantity: 500,
      moqUnit: 'pieces',
      image: '/assets/products/example.webp'
    };
    const english: PublishedProductOverride = {
      ...chinese,
      name: 'Updated product',
      description: 'Updated description',
      highlights: ['Highlight one', 'Highlight two'],
      applications: ['Use one', 'Use two'],
      packFormat: 'Individual pouch'
    };

    applyPublishedProductOverride(product, chinese, locale => locale === 'en' ? english : chinese, ['zh', 'en']);

    expect(product.highlights.map(item => item.zh)).toEqual(['亮点一', '亮点二']);
    expect(product.highlights.map(item => item.en)).toEqual(['Highlight one', 'Highlight two']);
    expect(product.applications.map(item => item.zh)).toEqual(['用途一', '用途二']);
    expect(product.applications.map(item => item.en)).toEqual(['Use one', 'Use two']);
    expect(product.specifications.map(item => [item.id, item.value.zh, item.value.en])).toEqual([
      ['net-weight', '30 g', '30 g'],
      ['pack-format', '独立袋装', 'Individual pouch']
    ]);
    expect(product.commercialTerms.moq).toEqual({quantity: 500, unit: 'pieces'});
    expect(product.media?.image).toBe('/assets/products/example.webp');
  });

  it('removes a cleared optional packaging specification', () => {
    const product = structuredClone(products[0]);
    const chinese: PublishedProductOverride = {
      productId: product.productId,
      name: '产品名',
      description: '介绍',
      highlights: ['亮点'],
      applications: ['用途'],
      netWeight: '30 g',
      packFormat: '',
      moqQuantity: null,
      moqUnit: 'pieces',
      image: '/assets/products/example.webp'
    };
    product.specifications.push({id: 'pack-format', label: {...product.name}, value: {...product.name}});

    applyPublishedProductOverride(product, chinese, () => chinese, ['zh']);

    expect(product.specifications.some(item => item.id === 'pack-format')).toBe(false);
    expect(product.commercialTerms.moq).toBeNull();
  });
});
