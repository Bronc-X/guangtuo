import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  Scene,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2
} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'public', 'models', 'sku');
const generatorVersion = 'gt-parametric-v1';

class NodeFileReader {
  result = null;
  error = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.();
      })
      .catch((error) => {
        this.error = error;
        this.onerror?.(error);
      });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer()
      .then((result) => {
        this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;
        this.onloadend?.();
      })
      .catch((error) => {
        this.error = error;
        this.onerror?.(error);
      });
  }
}

globalThis.FileReader ??= NodeFileReader;

const materials = {
  body: () => new MeshPhysicalMaterial({
    name: 'GT_BODY_CONFIG', color: '#d8c9b1', roughness: 0.46, metalness: 0.02,
    clearcoat: 0.3, clearcoatRoughness: 0.24
  }),
  glass: () => new MeshPhysicalMaterial({
    name: 'GT_GLASS_CONFIG', color: '#728b81', roughness: 0.18, metalness: 0,
    transparent: true, opacity: 0.72, transmission: 0.12, thickness: 0.14,
    clearcoat: 1, clearcoatRoughness: 0.08
  }),
  trim: () => new MeshStandardMaterial({
    name: 'GT_TRIM_FIXED', color: '#163a31', roughness: 0.3, metalness: 0.16
  }),
  label: () => new MeshPhysicalMaterial({
    name: 'GT_LABEL_CONFIG', color: '#f5ede0', roughness: 0.68, metalness: 0,
    clearcoat: 0.08
  }),
  pack: () => new MeshPhysicalMaterial({
    name: 'GT_PACK_CONFIG', color: '#e9ddc9', roughness: 0.4, metalness: 0.08,
    clearcoat: 0.36, clearcoatRoughness: 0.25
  }),
  sheet: () => new MeshPhysicalMaterial({
    name: 'GT_SHEET_CONFIG', color: '#dcebe4', roughness: 0.82, metalness: 0,
    transparent: true, opacity: 0.73, transmission: 0.04, thickness: 0.05,
    side: 2
  }),
  liquid: () => new MeshPhysicalMaterial({
    name: 'GT_LIQUID_FIXED', color: '#b66c35', roughness: 0.12, transparent: true,
    opacity: 0.72, transmission: 0.2, thickness: 0.12
  }),
  clear: () => new MeshPhysicalMaterial({
    name: 'GT_CLEAR_FIXED', color: '#eef5f2', roughness: 0.08, transparent: true,
    opacity: 0.45, transmission: 0.3, thickness: 0.08
  })
};

function component(name, role, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.userData = {role};
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function ring(name, radius, tube, y, material) {
  return component(name, 'trim', new TorusGeometry(radius, tube, 12, 48), material, [0, y, 0], [Math.PI / 2, 0, 0]);
}

function labelPlate(width, height, z, y = 0, x = 0) {
  return component(
    'Configurable_Label_Plate',
    'label',
    new RoundedBoxGeometry(width, height, 0.025, 2, 0.02),
    materials.label(),
    [x, y, z]
  );
}

function createAirless() {
  const root = new Group();
  root.name = 'GT_AIRLESS_030_Root';
  root.add(
    component('Airless_Body', 'body', new CylinderGeometry(0.72, 0.75, 2.9, 64, 1), materials.body(), [0, -0.15, 0]),
    component('Airless_Shoulder', 'body', new CylinderGeometry(0.47, 0.72, 0.32, 64, 1), materials.body(), [0, 1.46, 0]),
    component('Airless_Pump_Collar', 'trim', new CylinderGeometry(0.45, 0.45, 0.27, 48), materials.trim(), [0, 1.74, 0]),
    component('Airless_Pump_Stem', 'trim', new CylinderGeometry(0.12, 0.12, 0.28, 32), materials.trim(), [0, 1.98, 0]),
    component('Airless_Pump_Head', 'trim', new RoundedBoxGeometry(0.82, 0.18, 0.44, 3, 0.06), materials.trim(), [0.18, 2.14, 0]),
    component('Airless_Nozzle', 'trim', new CylinderGeometry(0.07, 0.09, 0.48, 24), materials.trim(), [0.76, 2.14, 0], [0, 0, Math.PI / 2]),
    ring('Airless_Bottom_Ring', 0.7, 0.026, -1.58, materials.trim()),
    labelPlate(1.02, 0.74, 0.735, -0.18),
    component('Airless_Removable_Cap', 'body', new CylinderGeometry(0.77, 0.77, 1.14, 64, 1, true), materials.body(), [1.14, -1.02, -0.08], [0.04, 0, -0.12])
  );
  return root;
}

function createDropper() {
  const root = new Group();
  root.name = 'GT_DROPPER_030_Root';
  const profile = [
    new Vector2(0.05, -1.5), new Vector2(0.69, -1.5), new Vector2(0.73, -1.36),
    new Vector2(0.73, 0.72), new Vector2(0.68, 0.98), new Vector2(0.46, 1.2),
    new Vector2(0.34, 1.28), new Vector2(0.34, 1.47), new Vector2(0.05, 1.47)
  ];
  root.add(
    component('Dropper_Glass_Bottle', 'glass', new LatheGeometry(profile, 64), materials.glass(), [0, -0.05, 0]),
    component('Dropper_Liquid_Visual', 'liquid', new CylinderGeometry(0.62, 0.64, 1.72, 48), materials.liquid(), [0, -0.56, 0]),
    component('Dropper_Collar', 'trim', new CylinderGeometry(0.47, 0.47, 0.48, 48), materials.trim(), [0, 1.53, 0]),
    component('Dropper_Pipette', 'clear', new CylinderGeometry(0.055, 0.04, 2.35, 24), materials.clear(), [0, 0.28, 0]),
    component('Dropper_Bulb', 'trim', new SphereGeometry(0.48, 48, 32), materials.trim(), [0, 2.05, 0], [0, 0, 0], [0.84, 1.2, 0.84]),
    ring('Dropper_Base_Ring', 0.69, 0.024, -1.55, materials.trim()),
    labelPlate(0.98, 0.76, 0.735, -0.22)
  );
  return root;
}

function createJar() {
  const root = new Group();
  root.name = 'GT_JAR_050_Root';
  root.add(
    component('Jar_Outer_Body', 'body', new CylinderGeometry(1.13, 1.09, 1.34, 64), materials.body(), [0, -0.56, 0]),
    component('Jar_Inner_Cup', 'inner', new CylinderGeometry(0.91, 0.87, 1.1, 64), new MeshStandardMaterial({name: 'GT_INNER_FIXED', color: '#f1eadf', roughness: 0.62}), [0, -0.48, 0]),
    component('Jar_Lid', 'trim', new CylinderGeometry(1.16, 1.16, 0.45, 64), materials.trim(), [0, 0.39, 0]),
    ring('Jar_Lid_Detail', 1.06, 0.025, 0.18, materials.label()),
    ring('Jar_Base_Detail', 1.04, 0.025, -1.23, materials.trim()),
    labelPlate(1.34, 0.52, 1.105, -0.58)
  );
  return root;
}

function faceOutline() {
  const shape = new Shape();
  shape.moveTo(0, 1.55);
  shape.bezierCurveTo(0.95, 1.48, 1.2, 0.72, 1.08, -0.1);
  shape.bezierCurveTo(0.98, -0.92, 0.54, -1.47, 0, -1.66);
  shape.bezierCurveTo(-0.54, -1.47, -0.98, -0.92, -1.08, -0.1);
  shape.bezierCurveTo(-1.2, 0.72, -0.95, 1.48, 0, 1.55);
  return shape;
}

function ellipseHole(x, y, radiusX, radiusY) {
  const hole = new Path();
  hole.absellipse(x, y, radiusX, radiusY, 0, Math.PI * 2, false, 0);
  return hole;
}

function fullMaskGeometry() {
  const shape = faceOutline();
  shape.holes.push(
    ellipseHole(-0.4, 0.55, 0.3, 0.14),
    ellipseHole(0.4, 0.55, 0.3, 0.14),
    ellipseHole(0, -0.05, 0.12, 0.24),
    ellipseHole(0, -0.78, 0.34, 0.12)
  );
  return new ExtrudeGeometry(shape, {depth: 0.035, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 20});
}

function upperMaskGeometry() {
  const shape = new Shape();
  shape.moveTo(-1.05, -0.18);
  shape.bezierCurveTo(-1.18, 0.6, -0.9, 1.43, 0, 1.5);
  shape.bezierCurveTo(0.9, 1.43, 1.18, 0.6, 1.05, -0.18);
  shape.bezierCurveTo(0.55, -0.38, -0.55, -0.38, -1.05, -0.18);
  shape.holes.push(ellipseHole(-0.4, 0.55, 0.3, 0.14), ellipseHole(0.4, 0.55, 0.3, 0.14));
  return new ExtrudeGeometry(shape, {depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.014, bevelSegments: 2, curveSegments: 20});
}

function lowerMaskGeometry() {
  const shape = new Shape();
  shape.moveTo(-0.98, 0.32);
  shape.bezierCurveTo(-0.95, -0.62, -0.5, -1.38, 0, -1.57);
  shape.bezierCurveTo(0.5, -1.38, 0.95, -0.62, 0.98, 0.32);
  shape.bezierCurveTo(0.48, 0.48, -0.48, 0.48, -0.98, 0.32);
  shape.holes.push(ellipseHole(0, -0.72, 0.34, 0.12));
  return new ExtrudeGeometry(shape, {depth: 0.07, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.016, bevelSegments: 2, curveSegments: 20});
}

function sachet(x, color = '#e9ddc9') {
  const pack = materials.pack();
  pack.color.set(color);
  return component('Configurable_Sachet', 'pack', new RoundedBoxGeometry(1.72, 2.72, 0.13, 5, 0.11), pack, [x, -0.05, -0.3], [0, -0.08, 0.035]);
}

function createFullMask() {
  const root = new Group();
  root.name = 'GT_MASK_FULL_025_Root';
  root.add(
    sachet(-0.92),
    component('Full_Face_Sheet', 'sheet', fullMaskGeometry(), materials.sheet(), [0.87, 0, 0.15], [0.02, -0.06, -0.02], [0.77, 0.77, 0.77]),
    labelPlate(1.12, 0.64, -0.225, -0.08, -0.92)
  );
  return root;
}

function createSplitMask() {
  const root = new Group();
  root.name = 'GT_MASK_SPLIT_030_Root';
  const gel = materials.sheet();
  gel.name = 'GT_HYDROGEL_CONFIG';
  gel.color.set('#c9e4dc');
  gel.opacity = 0.8;
  root.add(
    sachet(-0.92, '#d5e4dd'),
    component('Split_Upper_Sheet', 'sheet', upperMaskGeometry(), gel, [0.87, 0.14, 0.14], [0.02, -0.06, -0.02], [0.78, 0.78, 0.78]),
    component('Split_Lower_Sheet', 'sheet', lowerMaskGeometry(), gel.clone(), [0.87, -0.12, 0.15], [0.02, -0.06, -0.02], [0.78, 0.78, 0.78]),
    labelPlate(1.12, 0.64, -0.225, -0.08, -0.92)
  );
  return root;
}

const definitions = [
  {sku: 'GT-AIRLESS-030', geometryId: 'airless-cylinder-v1', file: 'gt-airless-030.glb', create: createAirless},
  {sku: 'GT-DROPPER-030', geometryId: 'dropper-round-v1', file: 'gt-dropper-030.glb', create: createDropper},
  {sku: 'GT-JAR-050', geometryId: 'cream-jar-wide-v1', file: 'gt-jar-050.glb', create: createJar},
  {sku: 'GT-MASK-FULL-025', geometryId: 'mask-single-sheet-v1', file: 'gt-mask-full-025.glb', create: createFullMask},
  {sku: 'GT-MASK-SPLIT-030', geometryId: 'mask-upper-lower-v1', file: 'gt-mask-split-030.glb', create: createSplitMask}
];

function countTriangles(root) {
  let triangles = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  });
  return Math.round(triangles);
}

async function exportBinary(root) {
  const scene = new Scene();
  scene.name = root.name.replace('_Root', '_Scene');
  scene.add(root);
  scene.userData = {...root.userData};
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    truncateDrawRange: true,
    maxTextureSize: 2048
  });
  if (!(result instanceof ArrayBuffer)) throw new Error('Expected binary glTF output.');
  return Buffer.from(result);
}

await mkdir(outputDirectory, {recursive: true});
const manifest = {
  version: 1,
  generator: generatorVersion,
  constraints: {maxBytesPerModel: 5_000_000, maxTrianglesPerModel: 100_000},
  models: []
};

for (const definition of definitions) {
  const root = definition.create();
  root.userData = {
    sku: definition.sku,
    geometryId: definition.geometryId,
    generator: generatorVersion,
    usage: 'visual-scoping-only'
  };
  root.updateMatrixWorld(true);
  const triangles = countTriangles(root);
  const binary = await exportBinary(root);
  const outputPath = resolve(outputDirectory, definition.file);
  await writeFile(outputPath, binary);
  manifest.models.push({
    sku: definition.sku,
    geometryId: definition.geometryId,
    path: `/models/sku/${definition.file}`,
    bytes: binary.byteLength,
    triangles,
    configurableRoles: [...new Set(root.children.map((child) => child.userData.role).filter(Boolean))]
  });
}

const manifestPath = resolve(outputDirectory, 'manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.table(manifest.models.map(({sku, bytes, triangles, configurableRoles}) => ({sku, bytes, triangles, roles: configurableRoles.join(', ')})));
console.log(`Wrote ${definitions.length} GLB files and ${manifestPath}`);
