import {writeFile, mkdir} from 'node:fs/promises';
import {Scene, Group, Mesh, MeshPhysicalMaterial, LatheGeometry, Vector2, CylinderGeometry, BoxGeometry} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {blob.arrayBuffer().then(value => {this.result = value; this.onloadend?.();});}
};
const output = new URL('../public/models/sku/', import.meta.url);
await mkdir(output, {recursive: true});
function material(role, color) {const m = new MeshPhysicalMaterial({color, roughness: .28, clearcoat: .55}); m.name = `SHOWKI_${role}`; return m;}
function part(group, name, geometry, role, colour, position = [0,0,0]) {
  const mesh = new Mesh(geometry, material(role, colour)); mesh.name = name; mesh.userData.role = role; mesh.position.set(...position); group.add(mesh); return mesh;
}
function lathe(points) {return new LatheGeometry(points.map(point => new Vector2(...point)), 128);}
for (const type of ['lotion', 'cleanser']) {
  const scene = new Scene(); const root = new Group(); root.name = `Showki_${type}_Root`; scene.add(root);
  part(root, 'Bottle_Body', lathe([[0,-1.4],[.57,-1.4],[.67,-1.33],[.69,-1.18],[.69,.72],[.66,.91],[.49,1.03],[.29,1.08],[.29,1.24],[.25,1.24],[.25,1.06],[.44,.94],[.60,.75],[.60,-1.23],[0,-1.23]]), 'body', '#ede7dc');
  if (type === 'lotion') {
    const pump = new Group(); pump.name = 'Lotion_Pump_Assembly'; pump.position.y = 1.16; root.add(pump);
    part(pump, 'Pump_Collar', new CylinderGeometry(.33,.34,.26,96), 'trim', '#315346');
    part(pump, 'Pump_Stem', new CylinderGeometry(.10,.10,.32,48), 'trim', '#315346', [0,.25,0]);
    part(pump, 'Pump_Head', new CylinderGeometry(.30,.30,.14,96), 'trim', '#315346', [0,.45,0]);
    part(pump, 'Pump_Nozzle', new BoxGeometry(.18,.12,.54), 'trim', '#315346', [0,.45,.32]);
    part(pump, 'Dip_Tube', new CylinderGeometry(.035,.035,2.30,32), 'inner', '#eee9df', [0,-1.24,0]);
  } else {
    root.scale.set(1.04,1,1.04);
    part(root, 'Cap_Base', new CylinderGeometry(.36,.36,.25,96), 'trim', '#315346', [0,1.22,0]);
    const cap = new Group(); cap.name = 'Cleanser_Flip_Assembly'; cap.position.set(0,1.37,-.32); root.add(cap);
    part(cap, 'Flip_Lid', new CylinderGeometry(.37,.37,.12,96), 'trim', '#315346', [0,.06,.32]);
    part(root, 'Dispensing_Spout', new CylinderGeometry(.08,.09,.10,48), 'inner', '#f6f2ea', [0,1.38,.10]);
  }
  root.userData = {sku: `SK-${type.toUpperCase()}-150`, usage: 'visual-scoping-only'};
  const glb = await new GLTFExporter().parseAsync(scene, {binary:true});
  await writeFile(new URL(`sk-${type}-150.glb`, output), Buffer.from(glb));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="b"><stop stop-color="#c7c0b3"/><stop offset=".3" stop-color="#f5f1e8"/><stop offset=".8" stop-color="#e6dfd3"/><stop offset="1" stop-color="#c8c1b4"/></linearGradient></defs><rect width="600" height="600" fill="#ecebe5"/><ellipse cx="300" cy="510" rx="113" ry="19" fill="#20342c" opacity=".09"/><path d="M230 204Q230 174 268 168L268 140H332V168Q370 174 370 204V481Q370 503 346 503H254Q230 503 230 481Z" fill="url(#b)" stroke="#c9c6bc"/>${type === 'lotion' ? '<rect x="263" y="136" width="74" height="36" rx="8" fill="#29493b"/><rect x="292" y="99" width="16" height="40" fill="#29493b"/><path d="M261 89H347L374 99V118H261Z" fill="#29493b"/>' : '<rect x="263" y="126" width="74" height="47" rx="9" fill="#29493b"/><path d="M265 140H335" stroke="#64796b"/>'}<text x="300" y="333" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#253e32">SHOWKI</text><text x="300" y="349" text-anchor="middle" font-family="Arial" font-size="10" letter-spacing="3" fill="#253e32">BIOTECH</text></svg>`;
  await writeFile(new URL(`../public/assets/products/sk-${type}-150.svg`, import.meta.url), svg);
  console.log(`Created ${type} model and preview`);
}
