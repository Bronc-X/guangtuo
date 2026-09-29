import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect, it} from 'vitest';
import {allPackagingProducts} from '../src/data/legacy-packaging-catalog';
import {packagingMeshPart, packagingParts} from '../src/lib/packaging-parts';

it('finds independently editable parts in the actual packaging models', () => {
  const expected = {
    'HD-1267': ['body', 'cap', 'pump'],
    'HD-1159': ['body', 'cap'],
    'HD-843': ['body', 'cap'],
    'HD-844': ['body', 'pump'],
    'GT-AIRLESS-030': ['body', 'cap', 'pump']
  } as const;
  for (const [sku, partNames] of Object.entries(expected)) {
    const product = allPackagingProducts.find((item) => item.sku === sku)!;
    const file = readFileSync(join(process.cwd(), 'public', product.modelPath.split('?')[0].replace(/^\//, '')));
    const jsonLength = file.readUInt32LE(12);
    const glb = JSON.parse(file.subarray(20, 20 + jsonLength).toString('utf8')) as {nodes: {name?: string; mesh?: number; extras?: {role?: string}}[]};
    const found = new Set(glb.nodes.filter((node) => node.mesh !== undefined).map((node) => packagingMeshPart(product.shape, node.name ?? '', node.extras?.role ?? '')).filter(Boolean));
    expect(packagingParts(product)).toEqual(partNames);
    expect([...found].sort()).toEqual([...partNames].sort());
  }
});
