import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect, it} from 'vitest';
import inventory from '../docs/packaging-brochure-variants.json';
import {allPackagingProducts, studioPackagingProducts} from '../src/data/legacy-packaging-catalog';
import {packagingMeshPart, packagingParts} from '../src/lib/packaging-parts';

it('maps every brochure model and capacity to a distinct editable 3D asset', () => {
  expect(inventory.variants).toHaveLength(144);
  const ids = new Set<string>();
  const modelPaths = new Set<string>();
  for (const row of inventory.variants) {
    const item = allPackagingProducts.find((product) => product.sku === row.id);
    expect(item, row.id).toBeDefined();
    expect(item!.source?.modelCode ?? item!.sku).toBe(row.sku);
    expect(item!.source?.capacity.replace(/\s/g, '')).toBe(row.capacity);
    expect(item!.source?.page).toBe(row.sourcePage);
    expect(item!.catalogImages?.original).toBeTruthy();
    expect(existsSync(join(process.cwd(), 'public', item!.catalogImages!.original.slice(1)))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', item!.modelPath.split('?')[0].slice(1)))).toBe(true);
    const file = join(process.cwd(), 'public', item!.modelPath.split('?')[0].slice(1));
    const bytes = readFileSync(file);
    const jsonLength = bytes.readUInt32LE(12);
    const glb = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8')) as {nodes: {name?: string; mesh?: number; extras?: {role?: string}}[]};
    const found = new Set(glb.nodes.filter((node) => node.mesh !== undefined)
      .map((node) => packagingMeshPart(item!.shape, node.name ?? '', node.extras?.role ?? '')).filter(Boolean));
    for (const part of packagingParts(item!)) expect(found.has(part), `${row.id} ${part}`).toBe(true);
    ids.add(item!.sku);
    modelPaths.add(item!.modelPath.split('?')[0]);
    const rootSku = item!.seriesSku ?? item!.sku;
    expect(studioPackagingProducts.some((product) => product.sku === rootSku)).toBe(true);
  }
  expect(ids.size).toBe(144);
  expect(modelPaths.size).toBe(144);
  expect(allPackagingProducts.filter((item) => item.source?.specificationNote).map((item) => item.source?.modelCode)).toEqual(['HD-1256', 'HD-978']);
});
