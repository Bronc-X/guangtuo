import {readFile, stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {legacyPackagingProducts as products} from '@/data/legacy-packaging-catalog';

type GlbNode = {name?: string; translation?: number[]; matrix?: number[]; scale?: number[]; mesh?: number; children?: number[]; extras?: {role?: string}};
type GlbDocument = {
  asset?: {version?: string; generator?: string};
  meshes?: Array<{primitives?: Array<{attributes?: {POSITION?: number}}>}>;
  accessors?: Array<{min?: number[]; max?: number[]}>;
  nodes?: GlbNode[];
  scenes?: unknown[];
};

type ModelManifest = {
  version: number;
  generator: string;
  qualityStandard: string;
  constraints: {maxBytesPerModel: number; minTrianglesPerModel: number; maxTrianglesPerModel: number};
  models: Array<{
    sku: string;
    geometryId: string;
    path: string;
    bytes: number;
    triangles: number;
    configurableRoles: string[];
    requiredComponents: string[];
    parameterBindings: Record<string, {effect: string; targetRoles: string[]}>;
    interactiveAssembly: {nodeName: string; action: string} | null;
  }>;
};

const requiredComponents: Record<string, string[]> = {
  'GT-AIRLESS-030': ['Airless_Sculpted_Body', 'Airless_Inner_Cartridge', 'Airless_Pump_Actuator', 'Airless_Nozzle_Opening', 'Airless_Cap_Assembly', 'Airless_Removable_Cap', 'Airless_Cap_Inner_Rim'],
  'GT-DROPPER-030': ['Dropper_Weighted_Glass_Bottle', 'Dropper_Liquid_Volume', 'Dropper_Pipette_Assembly', 'Dropper_Glass_Pipette', 'Dropper_Dip_Tube_Tip', 'Dropper_Elastomer_Bulb'],
  'GT-JAR-050': ['Jar_Sculpted_Outer_Body', 'Jar_Inner_Cup', 'Jar_Cream_Surface', 'Jar_Lid_Assembly', 'Jar_Weighted_Lid', 'Jar_Lid_Inner_Disc'],
  'GT-MASK-FULL-025': ['Premium_Sachet_Shell', 'Full_Sculpted_Face_Sheet', 'Full_Eye_Rim_Left', 'Full_Eye_Rim_Right', 'Full_Mouth_Edge', 'Sachet_Tear_Notch'],
  'GT-MASK-SPLIT-030': ['Premium_Sachet_Shell', 'Split_Upper_Hydrogel_Sheet', 'Split_Lower_Hydrogel_Sheet', 'Split_Upper_Edge_Rim', 'Split_Lower_Edge_Rim', 'Sachet_Tear_Notch']
};

const geometryIds: Record<string, string> = {
  'GT-AIRLESS-030': 'airless-cylinder-v6',
  'GT-DROPPER-030': 'dropper-round-v6',
  'GT-JAR-050': 'cream-jar-wide-v6',
  'GT-MASK-FULL-025': 'mask-soft-drape-v7',
  'GT-MASK-SPLIT-030': 'mask-soft-drape-split-v7'
};

const interactiveAssemblies: Record<string, {nodeName: string; action: string} | null> = {
  'GT-AIRLESS-030': {nodeName: 'Airless_Cap_Assembly', action: 'remove-cap'},
  'GT-DROPPER-030': {nodeName: 'Dropper_Pipette_Assembly', action: 'remove-dropper'},
  'GT-JAR-050': {nodeName: 'Jar_Lid_Assembly', action: 'open-lid'},
  'GT-MASK-FULL-025': null,
  'GT-MASK-SPLIT-030': null
};

function parseGlb(buffer: Buffer): GlbDocument {
  expect(buffer.subarray(0, 4).toString('ascii')).toBe('glTF');
  expect(buffer.readUInt32LE(4)).toBe(2);
  expect(buffer.readUInt32LE(8)).toBe(buffer.byteLength);
  const jsonLength = buffer.readUInt32LE(12);
  expect(buffer.readUInt32LE(16)).toBe(0x4e4f534a);
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').trim()) as GlbDocument;
}

function meshAxisBounds(document: GlbDocument, nodeName: string, axis: 0 | 1 | 2) {
  const node = document.nodes?.find((candidate) => candidate.name === nodeName);
  const primitive = typeof node?.mesh === 'number' ? document.meshes?.[node.mesh]?.primitives?.[0] : undefined;
  const accessorIndex = primitive?.attributes?.POSITION;
  const accessor = typeof accessorIndex === 'number' ? document.accessors?.[accessorIndex] : undefined;
  if (!node || !accessor?.min || !accessor.max) throw new Error(`Missing bounds for ${nodeName}`);
  const matrix = node.matrix ?? [
    node.scale?.[0] ?? 1, 0, 0, 0,
    0, node.scale?.[1] ?? 1, 0, 0,
    0, 0, node.scale?.[2] ?? 1, 0,
    node.translation?.[0] ?? 0, node.translation?.[1] ?? 0, node.translation?.[2] ?? 0, 1
  ];
  const values: number[] = [];
  for (const x of [accessor.min[0], accessor.max[0]]) {
    for (const y of [accessor.min[1], accessor.max[1]]) {
      for (const z of [accessor.min[2], accessor.max[2]]) {
        values.push(matrix[axis] * x + matrix[4 + axis] * y + matrix[8 + axis] * z + matrix[12 + axis]);
      }
    }
  }
  return {min: Math.min(...values), max: Math.max(...values), span: Math.max(...values) - Math.min(...values)};
}

function meshLocalAxisSpan(document: GlbDocument, nodeName: string, axis: 0 | 1 | 2) {
  const node = document.nodes?.find((candidate) => candidate.name === nodeName);
  const primitive = typeof node?.mesh === 'number' ? document.meshes?.[node.mesh]?.primitives?.[0] : undefined;
  const accessorIndex = primitive?.attributes?.POSITION;
  const accessor = typeof accessorIndex === 'number' ? document.accessors?.[accessorIndex] : undefined;
  if (!accessor?.min || !accessor.max) throw new Error(`Missing local bounds for ${nodeName}`);
  return accessor.max[axis] - accessor.min[axis];
}

function meshTranslatedLocalAxisBounds(document: GlbDocument, nodeName: string, axis: 0 | 1 | 2) {
  const node = document.nodes?.find((candidate) => candidate.name === nodeName);
  const primitive = typeof node?.mesh === 'number' ? document.meshes?.[node.mesh]?.primitives?.[0] : undefined;
  const accessorIndex = primitive?.attributes?.POSITION;
  const accessor = typeof accessorIndex === 'number' ? document.accessors?.[accessorIndex] : undefined;
  if (!node || !accessor?.min || !accessor.max) throw new Error(`Missing translated local bounds for ${nodeName}`);
  const translation = node.translation?.[axis] ?? node.matrix?.[12 + axis] ?? 0;
  const scale = node.scale?.[axis] ?? 1;
  const first = translation + accessor.min[axis] * scale;
  const second = translation + accessor.max[axis] * scale;
  return {min: Math.min(first, second), max: Math.max(first, second)};
}

describe('generated SKU model assets', () => {
  it('ships five valid, lightweight GLB 2.0 files with configurable component roles', async () => {
    const manifestPath = resolve(process.cwd(), 'public/models/sku/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ModelManifest;

    expect(manifest.version).toBe(7);
    expect(manifest.generator).toBe('gt-parametric-v7');
    expect(manifest.qualityStandard).toBe('catalog-review-sculpted-v1');
    expect(manifest.constraints.minTrianglesPerModel).toBeGreaterThanOrEqual(32_000);
    expect(manifest.constraints.maxTrianglesPerModel).toBeLessThanOrEqual(140_000);
    expect(manifest.models).toHaveLength(5);
    expect(manifest.models.map((model) => model.sku).sort()).toEqual(products.map((product) => product.sku).sort());

    for (const product of products) {
      const filePath = resolve(process.cwd(), 'public', product.modelPath.split('?')[0].replace(/^\//, ''));
      const file = await readFile(filePath);
      const fileStats = await stat(filePath);
      const document = parseGlb(file);
      const entry = manifest.models.find((model) => model.sku === product.sku);
      const roles = new Set(document.nodes?.map((node) => node.extras?.role).filter((role): role is string => Boolean(role)));
      const nodeNames = new Set(document.nodes?.map((node) => node.name).filter((name): name is string => Boolean(name)));

      expect(fileStats.size).toBeLessThanOrEqual(manifest.constraints.maxBytesPerModel);
      expect(entry?.bytes).toBe(fileStats.size);
      expect(entry?.triangles).toBeGreaterThanOrEqual(manifest.constraints.minTrianglesPerModel);
      expect(entry?.triangles).toBeLessThanOrEqual(manifest.constraints.maxTrianglesPerModel);
      expect(product.modelBoundary.geometryId).toBe(geometryIds[product.sku]);
      expect(entry?.geometryId).toBe(geometryIds[product.sku]);
      expect(document.asset?.version).toBe('2.0');
      expect(document.scenes?.length).toBeGreaterThan(0);
      expect(document.meshes?.length).toBeGreaterThan(1);
      expect(document.meshes?.every((mesh) => mesh.primitives?.every((primitive) => typeof primitive.attributes?.POSITION === 'number'))).toBe(true);
      expect(roles.has('label')).toBe(true);
      expect(roles.has('body') || roles.has('glass') || roles.has('pack')).toBe(true);
      expect(entry?.requiredComponents).toEqual(requiredComponents[product.sku]);
      for (const componentName of requiredComponents[product.sku]) expect(nodeNames.has(componentName), `${product.sku}: ${componentName}`).toBe(true);
      expect(entry?.interactiveAssembly).toEqual(interactiveAssemblies[product.sku]);
      if (entry?.interactiveAssembly) {
        const assemblyNode = document.nodes?.find((node) => node.name === entry.interactiveAssembly?.nodeName);
        expect(assemblyNode?.children?.length, `${product.sku}: movable assembly children`).toBeGreaterThanOrEqual(2);
      }
      expect(Object.keys(entry?.parameterBindings ?? {}).sort()).toEqual(product.optionGroups.map((group) => group.id).sort());
      for (const binding of Object.values(entry?.parameterBindings ?? {})) {
        expect(binding.effect.length).toBeGreaterThan(0);
        expect(binding.targetRoles.length).toBeGreaterThan(0);
        expect(binding.targetRoles.every((role) => roles.has(role) || role === 'root' || role === 'artwork')).toBe(true);
      }
    }
  });

  it('keeps the single sheet and split mask as genuinely different mesh structures', async () => {
    const full = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-mask-full-025.glb')));
    const split = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-mask-split-030.glb')));
    const fullNames = full.nodes?.map((node) => node.name) ?? [];
    const splitNames = split.nodes?.map((node) => node.name) ?? [];

    expect(fullNames).toContain('Full_Sculpted_Face_Sheet');
    expect(splitNames).toContain('Split_Upper_Hydrogel_Sheet');
    expect(splitNames).toContain('Split_Lower_Hydrogel_Sheet');
    expect(fullNames).not.toContain('Split_Upper_Hydrogel_Sheet');
    expect(fullNames).not.toContain('Configurable_Sachet');
    expect(splitNames).not.toContain('Configurable_Sachet');
  });

  it('keeps split-mask edge finishes inside the same assemblies as their hydrogel pieces', async () => {
    const split = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-mask-split-030.glb')));
    const childNames = (parentName: string) => {
      const parent = split.nodes?.find((node) => node.name === parentName);
      return (parent?.children ?? []).map((index) => split.nodes?.[index]?.name);
    };

    expect(childNames('Split_Upper_Panel_Assembly')).toEqual(expect.arrayContaining(['Split_Upper_Hydrogel_Sheet', 'Split_Upper_Edge_Rim']));
    expect(childNames('Split_Lower_Panel_Assembly')).toEqual(expect.arrayContaining(['Split_Lower_Hydrogel_Sheet', 'Split_Lower_Edge_Rim']));
    const position = (name: string) => {
      const node = split.nodes?.find((candidate) => candidate.name === name);
      return node?.translation ?? node?.matrix?.slice(12, 15);
    };
    expect(position('Split_Upper_Panel_Assembly')?.[1]).toBeCloseTo(0.12, 3);
    expect(position('Split_Lower_Panel_Assembly')?.[1]).toBeCloseTo(-0.12, 3);
  });

  it('keeps both sachets as sealed volumes with every front layer attached to the pouch surface', async () => {
    const attachments = [
      ['Sachet_Sculpted_Front_Panel', 'Premium_Sachet_Shell'],
      ['Sachet_Shoulder_Gusset', 'Premium_Sachet_Shell'],
      ['Sachet_Base_Gusset', 'Premium_Sachet_Shell'],
      ['Sachet_Left_Fin', 'Premium_Sachet_Shell'],
      ['Sachet_Right_Fin', 'Premium_Sachet_Shell'],
      ['Sachet_Tear_Notch', 'Premium_Sachet_Shell'],
      ['Configurable_Label_Plate', 'Sachet_Sculpted_Front_Panel'],
      ['Label_Copper_Keyline', 'Configurable_Label_Plate']
    ];
    for (const fileName of ['gt-mask-full-025.glb', 'gt-mask-split-030.glb']) {
      const document = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku', fileName)));
      const shellDepth = meshLocalAxisSpan(document, 'Premium_Sachet_Shell', 2);

      expect(shellDepth, `${fileName}: pouch depth`).toBeGreaterThanOrEqual(0.075);
      expect(shellDepth, `${fileName}: pouch depth`).toBeLessThanOrEqual(0.11);
      for (const [childName, parentName] of attachments) {
        const child = meshTranslatedLocalAxisBounds(document, childName, 2);
        const parent = meshTranslatedLocalAxisBounds(document, parentName, 2);
        expect(child.min - parent.max, `${fileName}: ${childName} attachment gap`).toBeLessThanOrEqual(0.006);
        expect(child.max, `${fileName}: ${childName} reaches its parent`).toBeGreaterThanOrEqual(parent.max - 0.004);
      }
    }
  });

  it('keeps the complete airless pump envelope inside the closed cap clearance', async () => {
    const airless = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-airless-030.glb')));
    for (const nodeName of ['Airless_Pump_Actuator', 'Airless_Nozzle', 'Airless_Nozzle_Tip', 'Airless_Nozzle_Opening']) {
      const bounds = meshAxisBounds(airless, nodeName, 0);
      expect(bounds.min, `${nodeName} left clearance`).toBeGreaterThanOrEqual(-0.46);
      expect(bounds.max, `${nodeName} right clearance`).toBeLessThanOrEqual(0.46);
    }
  });

  it('keeps a gentle face-following drape without returning to a flat sheet or exaggerated face sculpture', async () => {
    const full = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-mask-full-025.glb')));
    const split = parseGlb(await readFile(resolve(process.cwd(), 'public/models/sku/gt-mask-split-030.glb')));

    for (const [document, nodeName] of [
      [full, 'Full_Sculpted_Face_Sheet'],
      [split, 'Split_Upper_Hydrogel_Sheet'],
      [split, 'Split_Lower_Hydrogel_Sheet']
    ] as const) {
      const depth = meshLocalAxisSpan(document, nodeName, 2);
      expect(depth, `${nodeName}: minimum drape`).toBeGreaterThanOrEqual(0.16);
      expect(depth, `${nodeName}: maximum drape`).toBeLessThanOrEqual(0.24);
    }
    expect(full.nodes?.some((node) => node.name === 'Full_Nose_Drape')).toBe(false);
  });
});
