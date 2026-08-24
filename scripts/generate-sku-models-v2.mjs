import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {
  BufferGeometry,
  CatmullRomCurve3,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Scene,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3
} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {TessellateModifier} from 'three/examples/jsm/modifiers/TessellateModifier.js';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'public', 'models', 'sku');
const generatorVersion = 'gt-parametric-v7';

class NodeFileReader {
  result = null;
  error = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    }).catch((error) => {
      this.error = error;
      this.onerror?.(error);
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;
      this.onloadend?.();
    }).catch((error) => {
      this.error = error;
      this.onerror?.(error);
    });
  }
}

globalThis.FileReader ??= NodeFileReader;

const materials = {
  body: () => new MeshPhysicalMaterial({
    name: 'GT_BODY_CONFIG', color: '#d8c9b1', roughness: 0.34, metalness: 0,
    ior: 1.46, specularIntensity: 0.75, clearcoat: 0.48, clearcoatRoughness: 0.16
  }),
  glass: () => new MeshPhysicalMaterial({
    name: 'GT_GLASS_CONFIG', color: '#d8e4df', roughness: 0.1, metalness: 0,
    opacity: 1, transmission: 0.82, thickness: 0.32, ior: 1.5,
    attenuationColor: '#a8c0b7', attenuationDistance: 1.8,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04
  }),
  trim: () => new MeshPhysicalMaterial({
    name: 'GT_TRIM_FIXED', color: '#173a31', roughness: 0.22, metalness: 0.58,
    specularIntensity: 1, clearcoat: 0.28, clearcoatRoughness: 0.14
  }),
  liner: () => new MeshPhysicalMaterial({
    name: 'GT_INNER_FIXED', color: '#f2eee7', roughness: 0.52, metalness: 0,
    ior: 1.46, specularIntensity: 0.5
  }),
  cream: () => new MeshPhysicalMaterial({
    name: 'GT_CREAM_FIXED', color: '#f1e3cf', roughness: 0.62, metalness: 0,
    ior: 1.4, specularIntensity: 0.38, sheen: 0.18, sheenColor: '#fff8ec', sheenRoughness: 0.8
  }),
  label: () => new MeshPhysicalMaterial({
    name: 'GT_LABEL_CONFIG', color: '#f4eee4', roughness: 0.58, metalness: 0,
    specularIntensity: 0.35, clearcoat: 0.12, clearcoatRoughness: 0.3
  }),
  accent: () => new MeshPhysicalMaterial({
    name: 'GT_ACCENT_FIXED', color: '#a6532e', roughness: 0.26, metalness: 0.72,
    specularIntensity: 1, clearcoat: 0.2, clearcoatRoughness: 0.12
  }),
  pack: () => new MeshPhysicalMaterial({
    name: 'GT_PACK_CONFIG', color: '#e8ddcb', roughness: 0.34, metalness: 0.12,
    ior: 1.46, specularIntensity: 0.85, clearcoat: 0.48, clearcoatRoughness: 0.18
  }),
  packDetail: () => new MeshPhysicalMaterial({
    name: 'GT_PACK_DETAIL_CONFIG', color: '#c7b9a3', roughness: 0.42, metalness: 0.22,
    specularIntensity: 0.7, clearcoat: 0.32, clearcoatRoughness: 0.24
  }),
  shadow: () => new MeshPhysicalMaterial({
    name: 'GT_SHADOWLINE_FIXED', color: '#303431', roughness: 0.58, metalness: 0,
    specularIntensity: 0.24
  }),
  fabric: () => new MeshPhysicalMaterial({
    name: 'GT_SHEET_CONFIG', color: '#edf3ef', roughness: 0.68, metalness: 0,
    opacity: 1, transmission: 0.12, thickness: 0.014, ior: 1.38,
    specularIntensity: 0.34, sheen: 0.18, sheenColor: '#edf8f3', sheenRoughness: 0.78,
    side: DoubleSide
  }),
  hydrogel: () => new MeshPhysicalMaterial({
    name: 'GT_HYDROGEL_CONFIG', color: '#d9f0e8', roughness: 0.16, metalness: 0,
    opacity: 1, transmission: 0.74, thickness: 0.035, ior: 1.34,
    attenuationColor: '#acd9ca', attenuationDistance: 1.4,
    specularIntensity: 0.92, clearcoat: 0.78, clearcoatRoughness: 0.08,
    side: DoubleSide
  }),
  liquid: () => new MeshPhysicalMaterial({
    name: 'GT_LIQUID_FIXED', color: '#c8894b', roughness: 0.1, metalness: 0,
    opacity: 1, transmission: 0.42, thickness: 0.28, ior: 1.34,
    attenuationColor: '#a96f38', attenuationDistance: 1.2,
    specularIntensity: 0.75, clearcoat: 0.42, clearcoatRoughness: 0.08
  }),
  clear: () => new MeshPhysicalMaterial({
    name: 'GT_CLEAR_FIXED', color: '#edf5f2', roughness: 0.04, metalness: 0,
    opacity: 1, transmission: 0.94, thickness: 0.06, ior: 1.47,
    attenuationColor: '#dbe7e2', attenuationDistance: 3,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03
  })
};

function finishGeometry(geometry) {
  geometry.computeVertexNormals();
  geometry.normalizeNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function component(name, role, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new Mesh(finishGeometry(geometry), material);
  mesh.name = name;
  mesh.userData = {role};
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function groupNode(name, role, children, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const group = new Group();
  group.name = name;
  group.userData = {role};
  group.position.set(...position);
  group.rotation.set(...rotation);
  group.add(...children);
  return group;
}

function lathe(name, role, profile, material, position = [0, 0, 0], segments = 192) {
  return component(name, role, new LatheGeometry(profile.map(([radius, y]) => new Vector2(radius, y)), segments), material, position);
}

function ring(name, radius, tube, y, material, role = 'trim', x = 0, z = 0) {
  return component(name, role, new TorusGeometry(radius, tube, 24, 144), material, [x, y, z], [Math.PI / 2, 0, 0]);
}

function tessellate(geometry, maxEdgeLength = 0.13, maxIterations = 6) {
  return new TessellateModifier(maxEdgeLength, maxIterations).modify(geometry);
}

function contourTube(name, role, points, material, radius = 0.014, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], closed = true) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)), closed, 'centripetal');
  return component(name, role, new TubeGeometry(curve, 96, radius, 14, closed), material, position, rotation, scale);
}

function labelSystem(width, height, z, y = 0, x = 0) {
  return [
    component('Configurable_Label_Plate', 'label', new RoundedBoxGeometry(width, height, 0.022, 4, 0.035), materials.label(), [x, y, z]),
    component('Label_Copper_Keyline', 'accent', new RoundedBoxGeometry(width * 0.58, 0.035, 0.029, 2, 0.012), materials.accent(), [x, y - height * 0.36, z + 0.018])
  ];
}

function createAirless() {
  const root = new Group();
  root.name = 'GT_AIRLESS_030_Root';
  const bottleProfile = [
    [0.03, -1.56], [0.62, -1.56], [0.7, -1.51], [0.735, -1.4],
    [0.735, 0.82], [0.72, 0.96], [0.66, 1.07], [0.55, 1.18],
    [0.49, 1.28], [0.47, 1.45], [0.03, 1.45]
  ];
  const capProfile = [
    [0.48, -0.64], [0.53, -0.64], [0.55, -0.56], [0.55, 0.5],
    [0.52, 0.59], [0.46, 0.64], [0.05, 0.64], [0.05, 0.56],
    [0.41, 0.56], [0.46, 0.49], [0.46, -0.54], [0.48, -0.59]
  ];
  const capAssembly = groupNode('Airless_Cap_Assembly', 'assembly', [
    lathe('Airless_Removable_Cap', 'body', capProfile, materials.body()),
    ring('Airless_Cap_Inner_Rim', 0.455, 0.018, -0.565, materials.liner(), 'inner'),
    ring('Airless_Cap_Lip', 0.505, 0.014, -0.585, materials.shadow(), 'shadow'),
    ring('Airless_Cap_Top_Keyline', 0.47, 0.012, 0.61, materials.accent(), 'accent')
  ], [0, 1.98, 0]);
  root.add(
    lathe('Airless_Sculpted_Body', 'body', bottleProfile, materials.body()),
    component('Airless_Inner_Cartridge', 'inner', new CylinderGeometry(0.57, 0.58, 2.45, 128), materials.liner(), [0, -0.2, 0]),
    component('Airless_Pump_Collar_Lower', 'trim', new CylinderGeometry(0.49, 0.49, 0.17, 128), materials.trim(), [0, 1.5, 0]),
    component('Airless_Pump_Collar_Upper', 'trim', new CylinderGeometry(0.42, 0.46, 0.19, 128), materials.trim(), [0, 1.68, 0]),
    component('Airless_Pump_Stem', 'trim', new CylinderGeometry(0.105, 0.105, 0.25, 64), materials.trim(), [0, 1.89, 0]),
    component('Airless_Pump_Actuator', 'trim', new RoundedBoxGeometry(0.58, 0.18, 0.38, 10, 0.06), materials.trim(), [0, 2.05, 0]),
    component('Airless_Pump_Actuator_Underside', 'shadow', new RoundedBoxGeometry(0.48, 0.035, 0.28, 7, 0.024), materials.shadow(), [0, 1.955, 0]),
    component('Airless_Nozzle', 'trim', new CylinderGeometry(0.04, 0.055, 0.16, 64), materials.trim(), [0.34, 2.05, 0], [0, 0, Math.PI / 2]),
    component('Airless_Nozzle_Tip', 'trim', new SphereGeometry(0.05, 64, 40), materials.trim(), [0.425, 2.05, 0], [0, 0, 0], [0.55, 1, 1]),
    component('Airless_Nozzle_Opening', 'shadow', new CylinderGeometry(0.022, 0.022, 0.012, 64), materials.shadow(), [0.452, 2.05, 0], [0, 0, Math.PI / 2]),
    ring('Airless_Base_Shadowline', 0.67, 0.018, -1.54, materials.accent(), 'accent'),
    ring('Airless_Collar_Keyline', 0.46, 0.016, 1.58, materials.accent(), 'accent'),
    ...labelSystem(0.56, 0.24, 0.742, -0.2),
    capAssembly
  );
  return root;
}

function createDropper() {
  const root = new Group();
  root.name = 'GT_DROPPER_030_Root';
  const bottleProfile = [
    [0.03, -1.52], [0.58, -1.52], [0.67, -1.48], [0.705, -1.34],
    [0.705, 0.72], [0.69, 0.86], [0.62, 1.0], [0.5, 1.11],
    [0.39, 1.2], [0.33, 1.32], [0.33, 1.46], [0.03, 1.46]
  ];
  const liquidProfile = [
    [0.02, -1.39], [0.53, -1.39], [0.6, -1.33], [0.61, 0.48], [0.02, 0.48]
  ];
  const pipetteAssembly = groupNode('Dropper_Pipette_Assembly', 'assembly', [
    component('Dropper_Metal_Collar', 'trim', new CylinderGeometry(0.43, 0.45, 0.42, 144), materials.trim(), [0, 1.48, 0]),
    ring('Dropper_Collar_Keyline_Top', 0.42, 0.014, 1.67, materials.accent(), 'accent'),
    ring('Dropper_Collar_Keyline_Lower', 0.44, 0.012, 1.29, materials.accent(), 'accent'),
    component('Dropper_Glass_Pipette', 'clear', new CylinderGeometry(0.045, 0.025, 2.36, 64), materials.clear(), [0, 0.2, 0]),
    component('Dropper_Dip_Tube_Tip', 'clear', new SphereGeometry(0.052, 64, 40), materials.clear(), [0, -1.0, 0], [0, 0, 0], [0.72, 1.28, 0.72]),
    component('Dropper_Elastomer_Bulb', 'trim', new CapsuleGeometry(0.34, 0.2, 28, 96), materials.trim(), [0, 2.12, 0], [0, 0, 0], [1, 1.06, 1]),
    component('Dropper_Collar_Inner_Seal', 'inner', new CylinderGeometry(0.31, 0.31, 0.065, 128), materials.liner(), [0, 1.27, 0])
  ]);
  root.add(
    lathe('Dropper_Weighted_Glass_Bottle', 'glass', bottleProfile, materials.glass()),
    lathe('Dropper_Liquid_Volume', 'liquid', liquidProfile, materials.liquid(), [0, 0, 0], 160),
    component('Dropper_Glass_Base', 'glass', new CylinderGeometry(0.62, 0.65, 0.12, 144), materials.glass(), [0, -1.43, 0]),
    ring('Dropper_Neck_Thread_One', 0.34, 0.018, 1.33, materials.clear(), 'clear'),
    ring('Dropper_Neck_Thread_Two', 0.34, 0.018, 1.4, materials.clear(), 'clear'),
    component('Dropper_Neck_Opening', 'shadow', new CylinderGeometry(0.24, 0.24, 0.035, 128), materials.shadow(), [0, 1.465, 0]),
    pipetteAssembly,
    ring('Dropper_Weighted_Heel', 0.62, 0.018, -1.45, materials.shadow(), 'shadow'),
    ring('Dropper_Shoulder_Highlight', 0.61, 0.012, 0.94, materials.clear(), 'clear'),
    ...labelSystem(0.54, 0.22, 0.714, -0.22)
  );
  return root;
}

function createJar() {
  const root = new Group();
  root.name = 'GT_JAR_050_Root';
  const jarProfile = [
    [0.03, -1.08], [0.93, -1.08], [1.04, -1.02], [1.1, -0.89],
    [1.1, -0.12], [1.07, 0.03], [0.99, 0.12], [0.9, 0.17],
    [0.82, 0.17], [0.79, 0.1], [0.79, -0.89], [0.03, -0.89]
  ];
  const lidProfile = [
    [0.03, 0.14], [0.98, 0.14], [1.08, 0.2], [1.14, 0.31],
    [1.14, 0.78], [1.1, 0.88], [1.02, 0.94], [0.03, 0.94]
  ];
  const lidAssembly = groupNode('Jar_Lid_Assembly', 'assembly', [
    lathe('Jar_Weighted_Lid', 'trim', lidProfile, materials.trim()),
    component('Jar_Lid_Inner_Disc', 'inner', new CylinderGeometry(0.92, 0.92, 0.075, 160), materials.liner(), [0, 0.13, 0]),
    ring('Jar_Lid_Copper_Keyline', 1.075, 0.016, 0.22, materials.accent(), 'accent'),
    ring('Jar_Lid_Inner_Gasket', 0.83, 0.026, 0.1, materials.shadow(), 'shadow')
  ]);
  root.add(
    lathe('Jar_Sculpted_Outer_Body', 'body', jarProfile, materials.body()),
    component('Jar_Inner_Cup', 'inner', new CylinderGeometry(0.81, 0.79, 0.96, 160), materials.liner(), [0, -0.42, 0]),
    component('Jar_Cream_Surface', 'inner', new CylinderGeometry(0.765, 0.765, 0.045, 192), materials.cream(), [0, 0.135, 0]),
    lidAssembly,
    ring('Jar_Base_Copper_Keyline', 1.01, 0.016, -1.035, materials.accent(), 'accent'),
    ring('Jar_Closure_Shadowline', 1.04, 0.013, 0.16, materials.shadow(), 'shadow'),
    ring('Jar_Closure_Thread_Upper', 0.94, 0.018, 0.08, materials.shadow(), 'shadow'),
    ring('Jar_Closure_Thread_Lower', 0.92, 0.016, 0.01, materials.shadow(), 'shadow'),
    ...labelSystem(0.66, 0.22, 1.105, -0.5)
  );
  return root;
}

function faceHalfWidth(v) {
  const oval = Math.sqrt(Math.max(0.22, 1 - 0.58 * v * v));
  const jawTaper = v < -0.35 ? 1 - 0.22 * ((-v - 0.35) / 0.65) : 1;
  return 1.12 * oval * jawTaper;
}

function faceSurfacePoint(u, v, zOffset = 0) {
  const x = u * faceHalfWidth(v);
  const y = v * 1.72;
  const centre = Math.max(0, 1 - u * u);
  const dome = 0.035 + 0.105 * Math.pow(centre, 0.82) * (1 - 0.22 * v * v);
  const nose = 0.085 * Math.exp(-(u * u) / 0.045 - ((v - 0.03) ** 2) / 0.12);
  const cheeks = 0.026 * Math.exp(-((Math.abs(u) - 0.45) ** 2) / 0.07 - ((v + 0.02) ** 2) / 0.18);
  const forehead = 0.012 * Math.exp(-(u * u) / 0.3 - ((v - 0.62) ** 2) / 0.22);
  const chin = 0.01 * Math.exp(-(u * u) / 0.16 - ((v + 0.74) ** 2) / 0.12);
  return [x, y, dome + nose + cheeks + forehead + chin + zOffset];
}

function insideEllipse(u, v, cx, cy, radiusU, radiusV) {
  return ((u - cx) / radiusU) ** 2 + ((v - cy) / radiusV) ** 2 < 1;
}

function maskPointIsActive(u, v, section) {
  if (section === 'upper' && v < -0.035 + 0.05 * (1 - u * u)) return false;
  if (section === 'lower' && v > 0.02 - 0.04 * (1 - u * u)) return false;
  const hasEyes = section === 'full' || section === 'upper';
  const hasMouth = section === 'full' || section === 'lower';
  if (hasEyes && (insideEllipse(u, v, -0.36, 0.3, 0.19, 0.075) || insideEllipse(u, v, 0.36, 0.3, 0.19, 0.075))) return false;
  if (hasMouth && insideEllipse(u, v, 0, -0.49, 0.23, 0.065)) return false;
  return true;
}

function faceDrapeGeometry(section) {
  const columns = 128;
  const rows = 176;
  const vertexMap = new Int32Array((columns + 1) * (rows + 1));
  vertexMap.fill(-1);
  const positions = [];
  const uvs = [];
  const indices = [];
  const gridIndex = (column, row) => row * (columns + 1) + column;

  for (let row = 0; row <= rows; row += 1) {
    const v = -1 + (row / rows) * 2;
    for (let column = 0; column <= columns; column += 1) {
      const u = -1 + (column / columns) * 2;
      if (!maskPointIsActive(u, v, section)) continue;
      const point = faceSurfacePoint(u, v);
      vertexMap[gridIndex(column, row)] = positions.length / 3;
      positions.push(...point);
      uvs.push((u + 1) / 2, (v + 1) / 2);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = vertexMap[gridIndex(column, row)];
      const b = vertexMap[gridIndex(column + 1, row)];
      const c = vertexMap[gridIndex(column, row + 1)];
      const d = vertexMap[gridIndex(column + 1, row + 1)];
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData = {surfaceModel: 'ellipsoidal-face-drape-v1'};
  return finishGeometry(geometry);
}

function fullMaskGeometry() {
  return faceDrapeGeometry('full');
}

function upperMaskGeometry() {
  return faceDrapeGeometry('upper');
}

function lowerMaskGeometry() {
  return faceDrapeGeometry('lower');
}

function ellipseFaceContour(cx, cy, radiusU, radiusV, samples = 28) {
  return Array.from({length: samples}, (_, index) => {
    const angle = (index / samples) * Math.PI * 2;
    return faceSurfacePoint(cx + Math.cos(angle) * radiusU, cy + Math.sin(angle) * radiusV, 0.018);
  });
}

function splitFaceContour(section, samples = 30) {
  return Array.from({length: samples}, (_, index) => {
    const u = -0.94 + (index / (samples - 1)) * 1.88;
    const v = section === 'upper' ? -0.035 + 0.05 * (1 - u * u) : 0.02 - 0.04 * (1 - u * u);
    return faceSurfacePoint(u, v, 0.02);
  });
}

function sachetOutline(scale = 1) {
  const shape = new Shape();
  shape.moveTo(-0.78 * scale, -1.4 * scale);
  shape.quadraticCurveTo(-0.86 * scale, -1.4 * scale, -0.86 * scale, -1.3 * scale);
  shape.lineTo(-0.82 * scale, 1.15 * scale);
  shape.quadraticCurveTo(-0.8 * scale, 1.31 * scale, -0.65 * scale, 1.38 * scale);
  shape.lineTo(0.65 * scale, 1.38 * scale);
  shape.quadraticCurveTo(0.8 * scale, 1.31 * scale, 0.82 * scale, 1.15 * scale);
  shape.lineTo(0.86 * scale, -1.3 * scale);
  shape.quadraticCurveTo(0.86 * scale, -1.4 * scale, 0.78 * scale, -1.4 * scale);
  shape.closePath();
  return shape;
}

function sachetParts(x, color = '#e8ddcb') {
  const pack = materials.pack();
  pack.color.set(color);
  const detail = materials.packDetail();
  detail.color.set(color).multiplyScalar(0.76);
  const shellZ = -0.39;
  const shellDepth = 0.064;
  const shellBevelThickness = 0.01;
  const shellFrontZ = shellZ + shellDepth + shellBevelThickness;
  const panelZ = shellFrontZ + 0.003;
  const panelFrontZ = panelZ + 0.008;
  const sealZ = shellFrontZ + 0.009;
  const labelZ = panelFrontZ + 0.007;
  const labelFrontZ = labelZ + 0.006;
  const keylineZ = labelFrontZ + 0.007;
  const rotation = [0.015, -0.09, 0.028];
  const shellGeometry = tessellate(new ExtrudeGeometry(sachetOutline(), {
    depth: shellDepth, bevelEnabled: true, bevelSize: 0.024, bevelThickness: shellBevelThickness,
    bevelSegments: 8, curveSegments: 64
  }), 0.2, 4);
  const panelGeometry = new ExtrudeGeometry(sachetOutline(0.86), {
    depth: 0.006, bevelEnabled: true, bevelSize: 0.007, bevelThickness: 0.002,
    bevelSegments: 6, curveSegments: 48
  });
  const parts = [
    component('Premium_Sachet_Shell', 'pack', shellGeometry, pack, [x, -0.02, shellZ], rotation),
    component('Sachet_Sculpted_Front_Panel', 'pack-detail', panelGeometry, detail, [x, -0.02, panelZ], rotation),
    component('Sachet_Shoulder_Gusset', 'pack-detail', new RoundedBoxGeometry(1.38, 0.09, 0.016, 8, 0.028), detail.clone(), [x, 1.18, sealZ], rotation),
    component('Sachet_Base_Gusset', 'pack-detail', new RoundedBoxGeometry(1.44, 0.085, 0.016, 8, 0.026), detail.clone(), [x, -1.2, sealZ], rotation),
    component('Sachet_Left_Fin', 'pack-detail', new RoundedBoxGeometry(0.055, 2.24, 0.016, 7, 0.018), detail.clone(), [x - 0.69, -0.04, sealZ], rotation),
    component('Sachet_Right_Fin', 'pack-detail', new RoundedBoxGeometry(0.055, 2.24, 0.016, 7, 0.018), detail.clone(), [x + 0.69, -0.04, sealZ], rotation),
    component('Configurable_Label_Plate', 'label', new RoundedBoxGeometry(0.58, 0.22, 0.012, 6, 0.06), materials.label(), [x, -0.08, labelZ], rotation),
    component('Label_Copper_Keyline', 'accent', new RoundedBoxGeometry(0.32, 0.024, 0.012, 5, 0.009), materials.accent(), [x, -0.55, keylineZ], rotation)
  ];
  parts.push(component('Sachet_Tear_Notch', 'pack-detail', new TorusGeometry(0.075, 0.014, 18, 48, Math.PI), detail.clone(), [x + 0.69, 1.02, shellFrontZ + 0.015], [rotation[0], rotation[1], Math.PI / 2 + rotation[2]]));
  return parts;
}

function createFullMask() {
  const root = new Group();
  root.name = 'GT_MASK_FULL_025_Root';
  const sheetPosition = [0.92, 0, 0.12];
  const sheetRotation = [0.015, -0.08, -0.018];
  const sheetScale = [0.8, 0.8, 0.8];
  root.add(
    ...sachetParts(-0.98),
    component('Full_Sculpted_Face_Sheet', 'sheet', fullMaskGeometry(), materials.fabric(), sheetPosition, sheetRotation, sheetScale),
    contourTube('Full_Eye_Rim_Left', 'sheet', ellipseFaceContour(-0.36, 0.3, 0.2, 0.082), materials.fabric(), 0.012, sheetPosition, sheetRotation, sheetScale),
    contourTube('Full_Eye_Rim_Right', 'sheet', ellipseFaceContour(0.36, 0.3, 0.2, 0.082), materials.fabric(), 0.012, sheetPosition, sheetRotation, sheetScale),
    contourTube('Full_Mouth_Edge', 'sheet', ellipseFaceContour(0, -0.49, 0.24, 0.072), materials.fabric(), 0.011, sheetPosition, sheetRotation, sheetScale)
  );
  return root;
}

function createSplitMask() {
  const root = new Group();
  root.name = 'GT_MASK_SPLIT_030_Root';
  const upperAssembly = groupNode('Split_Upper_Panel_Assembly', 'sheet-assembly', [
    component('Split_Upper_Hydrogel_Sheet', 'sheet', upperMaskGeometry(), materials.hydrogel()),
    contourTube('Split_Upper_Edge_Rim', 'sheet', splitFaceContour('upper'), materials.hydrogel(), 0.014, [0, 0, 0], [0, 0, 0], [1, 1, 1], false)
  ], [0.92, 0.12, 0.12], [0.015, -0.08, -0.018]);
  upperAssembly.scale.set(0.8, 0.8, 0.8);
  const lowerAssembly = groupNode('Split_Lower_Panel_Assembly', 'sheet-assembly', [
    component('Split_Lower_Hydrogel_Sheet', 'sheet', lowerMaskGeometry(), materials.hydrogel()),
    contourTube('Split_Lower_Edge_Rim', 'sheet', splitFaceContour('lower'), materials.hydrogel(), 0.014, [0, 0, 0], [0, 0, 0], [1, 1, 1], false)
  ], [0.92, -0.12, 0.13], [0.015, -0.08, -0.018]);
  lowerAssembly.scale.set(0.8, 0.8, 0.8);
  root.add(...sachetParts(-0.98, '#d8e7df'), upperAssembly, lowerAssembly);
  return root;
}

const standardBindings = {
  airless: {
    capacity: {effect: 'geometry-scale', targetRoles: ['root']},
    material: {effect: 'pbr-material', targetRoles: ['body']},
    color: {effect: 'pbr-color', targetRoles: ['body', 'trim']},
    finish: {effect: 'pbr-finish', targetRoles: ['body', 'trim']},
    branding: {effect: 'logo-material', targetRoles: ['artwork']},
    'logo-position': {effect: 'logo-anchor', targetRoles: ['artwork']}
  },
  bottle: {
    capacity: {effect: 'geometry-scale', targetRoles: ['root']},
    material: {effect: 'pbr-material', targetRoles: ['glass']},
    color: {effect: 'pbr-color', targetRoles: ['trim']},
    finish: {effect: 'pbr-finish', targetRoles: ['glass', 'trim']},
    branding: {effect: 'logo-material', targetRoles: ['artwork']},
    'logo-position': {effect: 'logo-anchor', targetRoles: ['artwork']}
  },
  jar: {
    capacity: {effect: 'geometry-scale', targetRoles: ['root']},
    material: {effect: 'pbr-material', targetRoles: ['body']},
    color: {effect: 'pbr-color', targetRoles: ['body', 'trim']},
    finish: {effect: 'pbr-finish', targetRoles: ['body', 'trim']},
    branding: {effect: 'logo-material', targetRoles: ['artwork']},
    'logo-position': {effect: 'logo-anchor', targetRoles: ['artwork']}
  },
  mask: {
    capacity: {effect: 'geometry-scale', targetRoles: ['root']},
    material: {effect: 'pbr-material', targetRoles: ['sheet']},
    'pack-material': {effect: 'pbr-material', targetRoles: ['pack', 'pack-detail']},
    color: {effect: 'pbr-color', targetRoles: ['pack', 'pack-detail']},
    finish: {effect: 'pbr-finish', targetRoles: ['pack', 'pack-detail']},
    'logo-position': {effect: 'logo-anchor', targetRoles: ['artwork']}
  }
};

const definitions = [
  {
    sku: 'GT-AIRLESS-030', geometryId: 'airless-cylinder-v6', file: 'gt-airless-030.glb', create: createAirless,
    requiredComponents: ['Airless_Sculpted_Body', 'Airless_Inner_Cartridge', 'Airless_Pump_Actuator', 'Airless_Nozzle_Opening', 'Airless_Cap_Assembly', 'Airless_Removable_Cap', 'Airless_Cap_Inner_Rim'],
    parameterBindings: standardBindings.airless,
    interactiveAssembly: {nodeName: 'Airless_Cap_Assembly', action: 'remove-cap'}
  },
  {
    sku: 'GT-DROPPER-030', geometryId: 'dropper-round-v6', file: 'gt-dropper-030.glb', create: createDropper,
    requiredComponents: ['Dropper_Weighted_Glass_Bottle', 'Dropper_Liquid_Volume', 'Dropper_Pipette_Assembly', 'Dropper_Glass_Pipette', 'Dropper_Dip_Tube_Tip', 'Dropper_Elastomer_Bulb'],
    parameterBindings: standardBindings.bottle,
    interactiveAssembly: {nodeName: 'Dropper_Pipette_Assembly', action: 'remove-dropper'}
  },
  {
    sku: 'GT-JAR-050', geometryId: 'cream-jar-wide-v6', file: 'gt-jar-050.glb', create: createJar,
    requiredComponents: ['Jar_Sculpted_Outer_Body', 'Jar_Inner_Cup', 'Jar_Cream_Surface', 'Jar_Lid_Assembly', 'Jar_Weighted_Lid', 'Jar_Lid_Inner_Disc'],
    parameterBindings: standardBindings.jar,
    interactiveAssembly: {nodeName: 'Jar_Lid_Assembly', action: 'open-lid'}
  },
  {
    sku: 'GT-MASK-FULL-025', geometryId: 'mask-soft-drape-v7', file: 'gt-mask-full-025.glb', create: createFullMask,
    requiredComponents: ['Premium_Sachet_Shell', 'Full_Sculpted_Face_Sheet', 'Full_Eye_Rim_Left', 'Full_Eye_Rim_Right', 'Full_Mouth_Edge', 'Sachet_Tear_Notch'],
    parameterBindings: standardBindings.mask,
    interactiveAssembly: null
  },
  {
    sku: 'GT-MASK-SPLIT-030', geometryId: 'mask-soft-drape-split-v7', file: 'gt-mask-split-030.glb', create: createSplitMask,
    requiredComponents: ['Premium_Sachet_Shell', 'Split_Upper_Hydrogel_Sheet', 'Split_Lower_Hydrogel_Sheet', 'Split_Upper_Edge_Rim', 'Split_Lower_Edge_Rim', 'Sachet_Tear_Notch'],
    parameterBindings: standardBindings.mask,
    interactiveAssembly: null
  }
];

function countTriangles(root) {
  let triangles = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    triangles += object.geometry.index ? object.geometry.index.count / 3 : object.geometry.attributes.position.count / 3;
  });
  return Math.round(triangles);
}

function collectRoles(root) {
  const roles = new Set();
  root.traverse((object) => {
    if (typeof object.userData.role === 'string') roles.add(object.userData.role);
  });
  return [...roles];
}

async function exportBinary(root) {
  const scene = new Scene();
  scene.name = root.name.replace('_Root', '_Scene');
  scene.add(root);
  scene.userData = {...root.userData};
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, {
    binary: true, onlyVisible: true, truncateDrawRange: true, maxTextureSize: 2048
  });
  if (!(result instanceof ArrayBuffer)) throw new Error('Expected binary glTF output.');
  return Buffer.from(result);
}

await mkdir(outputDirectory, {recursive: true});
const manifest = {
  version: 7,
  generator: generatorVersion,
  qualityStandard: 'catalog-review-sculpted-v1',
  materialModel: 'glTF-PBR-metallic-roughness-plus-physical-extensions',
  constraints: {maxBytesPerModel: 8_000_000, minTrianglesPerModel: 32_000, maxTrianglesPerModel: 140_000},
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
    configurableRoles: collectRoles(root),
    requiredComponents: definition.requiredComponents,
    parameterBindings: definition.parameterBindings,
    interactiveAssembly: definition.interactiveAssembly
  });
}

const manifestPath = resolve(outputDirectory, 'manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.table(manifest.models.map(({sku, bytes, triangles, configurableRoles}) => ({sku, bytes, triangles, roles: configurableRoles.join(', ')})));
console.log(`Wrote ${definitions.length} GLB files and ${manifestPath}`);
