import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import '@fontsource-variable/manrope';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/noto-sans-sc';

const products = {
  face: {id:'HG-F-02', name:'白变透明凝胶面膜', subtitle:'完整覆盖，轻柔起伏。', weight:'23 g / 片', source:'产品图谱 · 第 8 页', ref:'face-reference.png',
    detail:'观察面部轮廓、眼口开孔与鼻部起伏，以及薄膜边缘的透光。'},
  eye: {id:'HG-E-01', name:'白变透明蝶形眼膜', subtitle:'一对蝶翼，贴合眼周。', weight:'8 g / 对', source:'产品图谱 · 第 9 页', ref:'eye-reference.png',
    detail:'按图谱里的宽蝶翼轮廓重建，观察眼周至颊部的覆盖和柔软弯曲。'}
};
let selected = 'face';
let mode = 'image';
let shot = 'hero';
let viewer;
let loadVersion = 0;
const byId = id => document.getElementById(id);
const video = byId('film');
const status = byId('status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateCopy() {
  const p=products[selected];
  byId('product-name').textContent=p.name;
  byId('product-subtitle').textContent=p.subtitle;
  byId('product-id').textContent=p.id;
  byId('weight').textContent=p.weight;
  byId('source').textContent=p.source;
  byId('product-detail').textContent=p.detail;
  byId('reference').src=p.ref;
  byId('reference').alt=p.name+'原始图谱参考';
  byId('download-blend').href=`${selected}/hydrogel-study.blend`;
  byId('download-glb').href=`${selected}/model.glb`;
  byId('download-still').href=`${selected}/hero.png`;
  byId('download-film').href=`${selected}/loop.mp4`;
  document.querySelectorAll('[data-product]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.product===selected)));
}
function updateMedia() {
  video.pause();
  status.textContent='';
  byId('poster').hidden=mode!=='image';
  video.hidden=mode!=='video';
  byId('webgl').hidden=mode!=='model';
  document.querySelector('.media-stamp').hidden=mode==='video';
  byId('image-tools').hidden=mode!=='image';
  byId('model-tools').hidden=mode!=='model';
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
  document.querySelectorAll('[data-shot]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shot===shot)));
  if(mode==='image') {
    byId('poster').src=`${selected}/${shot}.png`;
    byId('download-still').href=`${selected}/${shot}.png`;
    byId('poster').alt=products[selected].name+' · '+({hero:'整体渲染',translucent:'半透明材质',detail:'边缘特写'}[shot]);
  } else if(mode==='video') {
    video.poster=`${selected}/hero.png`;
    video.src=`${selected}/loop.mp4`;
    video.load();
    if(!reducedMotion) video.play().catch(()=>{status.textContent='点击播放查看动效。';});
  } else {
    loadModel();
  }
}
video.addEventListener('error',()=>{status.textContent='动效未能加载，请查看静帧或下载文件。';});
byId('poster').addEventListener('error',()=>{status.textContent='图片未能加载，请刷新预览页。';});
document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=>{
  selected=button.dataset.product;shot='hero';updateCopy();updateMedia();
}));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;updateMedia();}));
document.querySelectorAll('[data-shot]').forEach(button=>button.addEventListener('click',()=>{shot=button.dataset.shot;updateMedia();}));

function initViewer() {
  const host=byId('webgl');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','拖动旋转三维小样，滚轮缩放');
  renderer.domElement.setAttribute('tabindex','0');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e5e7df');
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=new RoomEnvironment();
  scene.environment=pmrem.fromScene(environment,.035).texture;
  environment.dispose();pmrem.dispose();
  const camera=new THREE.PerspectiveCamera(32,1,.01,100);
  camera.position.set(1.8,3.1,4.1);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.5;controls.maxDistance=10;
  controls.autoRotate=!reducedMotion;controls.autoRotateSpeed=.6;
  controls.maxPolarAngle=Math.PI*.8;
  scene.add(new THREE.HemisphereLight('#fff8ec','#6d9186',2.2));
  const key=new THREE.DirectionalLight('#ffffff',3);key.position.set(-3,5,2);scene.add(key);
  const root=new THREE.Group();scene.add(root);
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.08,96),new THREE.MeshStandardMaterial({color:'#2e6759',roughness:.3,metalness:.08}));
  floor.position.y=-.65;scene.add(floor);
  const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe(host);
  let last=0;
  function draw(time) {requestAnimationFrame(draw);if(mode!=='model'||time-last<30)return;last=time;controls.update();renderer.render(scene,camera);}
  requestAnimationFrame(draw);
  viewer={scene,camera,renderer,controls,root,resize,materials:[]};
  byId('spin').checked=controls.autoRotate;
  byId('spin').addEventListener('change',event=>controls.autoRotate=event.target.checked);
  byId('reset-view').addEventListener('click',()=>{camera.position.set(1.8,3.1,4.1);controls.target.set(0,0,0);controls.update();});
  byId('transmission').addEventListener('input',updateMaterial);
  return viewer;
}
function updateMaterial() {
  if(!viewer)return;
  const fraction=Number(byId('transmission').value)/100;
  viewer.materials.forEach(mat=>{mat.transmission=.25+.72*fraction;mat.roughness=.19-.1*fraction;mat.needsUpdate=true;});
  byId('material-label').textContent=fraction<.35?'乳白':fraction>.75?'通透':'半透明';
}
function disposeModel(object) {object.traverse(node=>{if(node.isMesh){node.geometry.dispose();for(const m of (Array.isArray(node.material)?node.material:[node.material]))m.dispose();}});}
function loadModel() {
  const version=++loadVersion;
  status.textContent='正在载入可旋转模型…';
  try {
    const v=viewer??initViewer();
    new GLTFLoader().load(`${selected}/model.glb`,gltf=>{
      if(version!==loadVersion||mode!=='model'){disposeModel(gltf.scene);return;}
      [...v.root.children].forEach(child=>{v.root.remove(child);disposeModel(child);});
      const box=new THREE.Box3().setFromObject(gltf.scene);
      const center=box.getCenter(new THREE.Vector3());
      const size=box.getSize(new THREE.Vector3());
      const scale=3.0/Math.max(size.x,size.y,size.z);
      gltf.scene.position.sub(center);const holder=new THREE.Group();holder.add(gltf.scene);holder.scale.setScalar(scale);
      v.materials=[];
      const originalMaterials=new Set();
      gltf.scene.traverse(node=>{if(node.isMesh){for(const original of (Array.isArray(node.material)?node.material:[node.material]))originalMaterials.add(original);const m=new THREE.MeshPhysicalMaterial({color:'#f4f8f5',roughness:.16,metalness:0,transmission:.55,thickness:.06,ior:1.37,clearcoat:.18,side:THREE.DoubleSide});node.material=m;v.materials.push(m);}});
      originalMaterials.forEach(material=>material.dispose());
      v.root.add(holder);v.resize();updateMaterial();
      status.textContent='模型已载入。拖动旋转，滚轮缩放。';
    },undefined,()=>{status.textContent='模型未能加载。可以查看渲染图，或下载 GLB。';});
  } catch(error) {status.textContent='当前浏览器无法打开三维预览。可以查看渲染图或下载模型。';console.error(error);}
}
updateCopy();updateMedia();
