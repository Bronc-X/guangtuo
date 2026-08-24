'use client';

import {Canvas, useThree} from '@react-three/fiber';
import {Bounds, ContactShadows, Environment, Html, OrbitControls, useGLTF, useTexture} from '@react-three/drei';
import Link from 'next/link';
import Image from 'next/image';
import {Component, Suspense, useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode} from 'react';
import {ACESFilmicToneMapping, CanvasTexture, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PCFSoftShadowMap, RepeatWrapping, SRGBColorSpace, type Object3D} from 'three';
import {
  isCustomProductColor,
  resolvePackagingConceptColor,
  type PackagingConcept
} from '@/data/legacy-packaging-catalog';
import {decodeConfiguration, encodeConfiguration, getConfigurationFragmentForSync} from '@/lib/config-state';
import {localizedPath, type Locale} from '@/lib/routing';

type Capture = () => Promise<Blob | null>;

export const CONFIGURED_MODEL_VIEWER_POLICY = {
  toneMapping: 'aces-filmic',
  exposure: 0.9,
  ambientIntensity: 0.58,
  keyIntensity: 2.4,
  fillIntensity: 0.72,
  maxDpr: 1.5,
  cameraPosition: [1.4, 2.3, 6.4]
} as const;

export type ModelAssemblyState = 'closed' | 'open';

type AssemblyInteraction = {
  nodeName: string;
  closed: {zh: string; en: string};
  open: {zh: string; en: string};
  openPosition: [number, number, number];
  openRotation: [number, number, number];
};

const assemblyInteractions: Partial<Record<PackagingConcept['shape'], AssemblyInteraction>> = {
  airless: {
    nodeName: 'Airless_Cap_Assembly',
    closed: {zh: '盖回瓶盖', en: 'Replace cap'},
    open: {zh: '取下瓶盖', en: 'Remove cap'},
    openPosition: [1.42, -2.96, 0.12],
    openRotation: [0.04, 0.08, -0.16]
  },
  bottle: {
    nodeName: 'Dropper_Pipette_Assembly',
    closed: {zh: '装回瓶内', en: 'Replace dropper'},
    open: {zh: '取出滴管', en: 'Remove dropper'},
    openPosition: [1.2, 0.5, 0.16],
    openRotation: [0.04, 0.04, -0.18]
  },
  jar: {
    nodeName: 'Jar_Lid_Assembly',
    closed: {zh: '合上罐盖', en: 'Close lid'},
    open: {zh: '打开罐盖', en: 'Open lid'},
    openPosition: [0.72, 0.42, -0.95],
    openRotation: [0.3, 0.04, -0.5]
  }
};

export function getAssemblyInteraction(shape: PackagingConcept['shape']) {
  return assemblyInteractions[shape] ?? null;
}

export function applyRuntimeAssemblyState(model: Object3D, shape: PackagingConcept['shape'], state: ModelAssemblyState, invalidate: () => void) {
  const interaction = getAssemblyInteraction(shape);
  if (!interaction) return false;
  const assembly = model.getObjectByName(interaction.nodeName);
  if (!assembly) return false;
  const basePosition = Array.isArray(assembly.userData.gtAssemblyBasePosition)
    ? assembly.userData.gtAssemblyBasePosition as [number, number, number]
    : assembly.position.toArray() as [number, number, number];
  const baseRotation = Array.isArray(assembly.userData.gtAssemblyBaseRotation)
    ? assembly.userData.gtAssemblyBaseRotation as [number, number, number]
    : [assembly.rotation.x, assembly.rotation.y, assembly.rotation.z] as [number, number, number];
  assembly.userData.gtAssemblyBasePosition = basePosition;
  assembly.userData.gtAssemblyBaseRotation = baseRotation;
  const positionOffset = state === 'open' ? interaction.openPosition : [0, 0, 0];
  const rotationOffset = state === 'open' ? interaction.openRotation : [0, 0, 0];
  assembly.position.set(
    basePosition[0] + positionOffset[0],
    basePosition[1] + positionOffset[1],
    basePosition[2] + positionOffset[2]
  );
  assembly.rotation.set(
    baseRotation[0] + rotationOffset[0],
    baseRotation[1] + rotationOffset[1],
    baseRotation[2] + rotationOffset[2]
  );
  invalidate();
  return true;
}

export function BottleConfigurator({product, locale}: {product: PackagingConcept; locale: Locale}) {
  const zh = locale === 'zh';
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(product.optionGroups.map((group) => [group.id, group.options[0]?.id ?? ''])));
  const [capture, setCapture] = useState<Capture | null>(null);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [viewerActive, setViewerActive] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [logoError, setLogoError] = useState('');
  const [configurationRestored, setConfigurationRestored] = useState(false);
  const handleCaptureReady = useCallback((nextCapture: Capture) => setCapture(() => nextCapture), []);
  const handleModelReady = useCallback(() => setModelStatus('ready'), []);
  const handleModelError = useCallback(() => setModelStatus('fallback'), []);

  useEffect(() => {
    const restored = decodeConfiguration(window.location.hash.replace(/^#/, ''));
    // The URL fragment is an external, user-shareable source restored after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored?.sku === product.sku) setSelections((current) => ({...current, ...restored.selections}));
    // Gate URL writes until the incoming fragment has been applied on the next render.
    setConfigurationRestored(true);
    try {
      const canvas = document.createElement('canvas');
      setWebgl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
  }, [product.sku]);

  useEffect(() => {
    const fragment = getConfigurationFragmentForSync({sku: product.sku, selections}, configurationRestored);
    if (!fragment) return;
    window.history.replaceState(null, '', `${window.location.pathname}#${fragment}`);
  }, [configurationRestored, product.sku, selections]);

  const selectedColor = resolvePackagingConceptColor(product, selections.color);
  const selectedFinish = selections.finish ?? 'satin';
  const fragment = encodeConfiguration({sku: product.sku, selections});

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (!product.logoUpload.accept.includes(file.type as PackagingConcept['logoUpload']['accept'][number])) {
      setLogoError(zh ? '仅支持 PNG、JPEG 或 WebP。' : 'Use a PNG, JPEG or WebP file.');
      event.target.value = '';
      return;
    }
    if (file.size > product.logoUpload.maxBytes) {
      setLogoError(zh ? '文件不得超过 2 MB。' : 'The file must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') return;
      setLogoDataUrl(reader.result);
      setLogoName(file.name);
      setViewerActive(true);
      setModelStatus('loading');
    }, {once: true});
    reader.addEventListener('error', () => setLogoError(zh ? 'Logo 读取失败，请重试。' : 'The logo could not be read. Try again.'), {once: true});
    reader.readAsDataURL(file);
  }

  async function downloadRender() {
    if (!capture) return;
    setCaptureStatus('working');
    const blob = await capture();
    if (!blob) {
      setCaptureStatus('error');
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${product.sku}-${Date.now()}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCaptureStatus('done');
  }

  return (
    <section className="configurator" aria-label={zh ? '包装效果预览' : 'Packaging preview'}>
      <div className="configurator__viewer">
        <div className="viewer-bar"><span>{zh ? '360° 包装预览' : '360° PACKAGE PREVIEW'}</span><span>{product.name[locale]}</span></div>
        {viewerActive && webgl && <span className={`viewer-model-status viewer-model-status--${modelStatus}`} role="status">
          {modelStatus === 'ready' ? (zh ? '可以拖动查看' : 'Drag to view') : modelStatus === 'fallback' ? (zh ? '当前显示静态效果图' : 'Static preview shown') : (zh ? '正在加载预览…' : 'Loading preview…')}
        </span>}
        {!viewerActive ? (
          <div className="viewer-poster">
            <Image src={product.poster} width={1536} height={1536} alt={product.name[locale]} priority />
            <button className="button button--primary viewer-launch" type="button" onClick={() => { setViewerActive(true); setModelStatus('loading'); }}>
              {zh ? '查看 360° 效果' : 'View in 360°'}
            </button>
          </div>
        ) : webgl ? (
          <Canvas
            shadows
            dpr={[1, CONFIGURED_MODEL_VIEWER_POLICY.maxDpr]}
            camera={{position: [...CONFIGURED_MODEL_VIEWER_POLICY.cameraPosition], fov: 38}}
            gl={{antialias: true, preserveDrawingBuffer: true}}
            onCreated={({gl}) => {
              gl.toneMapping = ACESFilmicToneMapping;
              gl.toneMappingExposure = CONFIGURED_MODEL_VIEWER_POLICY.exposure;
              gl.shadowMap.type = PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={['#eee8dd']} />
            <ambientLight intensity={CONFIGURED_MODEL_VIEWER_POLICY.ambientIntensity} />
            <directionalLight castShadow position={[4, 6, 3]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.keyIntensity} color="#fff5e2" shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, 2, -3]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.fillIntensity} color="#8eb2a5" />
            <spotLight castShadow position={[0, 5.5, 4.5]} intensity={7.5} angle={0.52} penumbra={1} decay={2} color="#fffdf7" />
            <Suspense fallback={<ModelLoading zh={zh} />}>
              <Bounds fit clip observe margin={1.28} maxDuration={0.55}>
                <ModelErrorBoundary onError={handleModelError} fallback={<ProceduralPackage shape={product.shape} color={selectedColor} finish={selectedFinish} logoDataUrl={logoDataUrl} logoPosition={selections['logo-position']} branding={selections.branding} />}>
                  <ConfiguredProductModel product={product} selections={selections} color={selectedColor} finish={selectedFinish} logoDataUrl={logoDataUrl} onLoaded={handleModelReady} />
                </ModelErrorBoundary>
              </Bounds>
              <Environment preset="studio" />
              <ContactShadows position={[0, -1.62, 0]} opacity={0.35} scale={7} blur={2.8} far={4} />
            </Suspense>
            <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={12} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.75} autoRotate autoRotateSpeed={0.7} />
            <CaptureBridge onReady={handleCaptureReady} />
          </Canvas>
        ) : (
          <div className="viewer-fallback">
            <Image src={product.poster} width={1536} height={1536} alt={product.name[locale]} />
            <p>{zh ? '当前设备暂时显示静态效果图，您已经选择的细节仍会保留。' : 'A static image is shown on this device. Your choices are still saved.'}</p>
          </div>
        )}
        <p className="viewer-help">{viewerActive && webgl ? (zh ? '拖动旋转 · 滚轮缩放' : 'Drag to rotate · scroll to zoom') : (zh ? '打开 360° 效果，查看不同角度' : 'Open the 360° view to see more angles')}</p>
      </div>

      <div className="configurator__controls">
        <p className="eyebrow">{zh ? '选择规格和外观' : 'CHOOSE SIZE AND APPEARANCE'}</p>
        <h2>{product.name[locale]}</h2>
        <p className="configurator__notice">{product.description[locale]}</p>
        <div className="geometry-boundary"><span>{zh ? '样品确认' : 'SAMPLE APPROVAL'}</span><p>{product.modelBoundary.note[locale]}</p></div>
        <div className="option-list">
          {product.optionGroups.map((group) => (
            <fieldset key={group.id}>
              <legend>{group.label[locale]} <span>{group.id === 'color' && isCustomProductColor(selections.color) ? selections.color.toUpperCase() : group.options.find((option) => option.id === selections[group.id])?.label[locale]}</span></legend>
              <div className={group.id === 'color' ? 'option-row option-row--color' : 'option-row'}>
                {group.options.map((option) => (
                  <button key={option.id} type="button" aria-pressed={selections[group.id] === option.id} className={selections[group.id] === option.id ? 'option-button option-button--active' : 'option-button'} style={option.value ? {'--swatch': option.value} as CSSProperties : undefined} onClick={() => setSelections((current) => ({...current, [group.id]: option.id}))}>
                    {option.value && <span className="color-swatch" aria-hidden="true" />}{option.label[locale]}
                  </button>
                ))}
                {group.id === 'color' && (
                  <label className="custom-color-picker">
                    <input type="color" value={selectedColor} aria-label={zh ? '选择任意包装颜色' : 'Choose any package colour'} onInput={(event) => setSelections((current) => ({...current, color: event.currentTarget.value.toLowerCase()}))} />
                    <span><b>{zh ? '任意颜色' : 'Any colour'}</b><small>{selectedColor.toUpperCase()}</small></span>
                  </label>
                )}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="logo-upload">
          <div><b>{zh ? '上传 Logo，预览品牌效果' : 'Try your logo'}</b><small>{zh ? '支持 PNG、JPEG 或 WebP，文件最大 2 MB。' : 'PNG, JPEG or WebP, up to 2 MB.'}</small></div>
          <label className="button button--ghost" htmlFor={`logo-${product.sku}`}>{logoName ? (zh ? '更换 Logo' : 'Replace logo') : (zh ? '选择 Logo' : 'Choose logo')}</label>
          <input id={`logo-${product.sku}`} className="sr-only" type="file" accept={product.logoUpload.accept.join(',')} onChange={handleLogoUpload} />
          {logoName && <p className="logo-upload__file">{logoName}</p>}
          {logoError && <p className="form-error" role="alert">{logoError}</p>}
        </div>

        <div className="configurator__actions">
          <button className="button button--ghost" type="button" disabled={!capture || captureStatus === 'working'} onClick={downloadRender}>
            {captureStatus === 'working' ? (zh ? '正在生成…' : 'Preparing…') : captureStatus === 'done' ? (zh ? '效果图已下载' : 'Preview downloaded') : (zh ? '下载当前效果图' : 'Download preview')}
          </button>
          <Link className="button button--primary" href={`${localizedPath(locale, 'inquiry')}#${fragment}`}>{zh ? '获取这款产品的报价' : 'Request a quote'}</Link>
        </div>
        {captureStatus === 'error' && <p className="form-error" role="alert">{zh ? '当前效果图无法导出，请刷新页面后重试。' : 'The current preview could not be exported. Refresh the page and try again.'}</p>}
      </div>
    </section>
  );
}

function CaptureBridge({onReady}: {onReady: (capture: Capture) => void}) {
  const {gl, scene, camera} = useThree();
  useEffect(() => {
    onReady(() => new Promise((resolve) => {
      gl.render(scene, camera);
      gl.domElement.toBlob(resolve, 'image/png', 1);
    }));
  }, [camera, gl, onReady, scene]);
  return null;
}

function ModelLoading({zh}: {zh: boolean}) {
  return <Html center><div className="model-loader">{zh ? '正在加载产品预览…' : 'Loading product preview…'}</div></Html>;
}

class ModelErrorBoundary extends Component<{children: ReactNode; fallback: ReactNode; onError: () => void}, {failed: boolean}> {
  state = {failed: false};

  static getDerivedStateFromError() {
    return {failed: true};
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ConfiguredProductModel({product, selections, color, finish, logoDataUrl, assemblyState = 'closed', onLoaded}: {product: PackagingConcept; selections: Record<string, string>; color: string; finish: string; logoDataUrl: string | null; assemblyState?: ModelAssemblyState; onLoaded?: () => void}) {
  const {scene} = useGLTF(product.modelPath);
  const invalidate = useThree((state) => state.invalidate);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    applyRuntimeModelConfiguration(model, product.shape, selections, color, finish, invalidate);
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const role = typeof object.userData.role === 'string' ? object.userData.role : '';
      if (role === 'label') object.visible = !shouldHideEmbeddedBranding(role, Boolean(logoDataUrl));
    });
  }, [color, finish, invalidate, logoDataUrl, model, product.shape, selections]);

  useEffect(() => {
    applyRuntimeAssemblyState(model, product.shape, assemblyState, invalidate);
  }, [assemblyState, invalidate, model, product.shape]);

  useEffect(() => {
    onLoaded?.();
    return () => {
      const disposable = new Set<import('three').Material>();
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        if (Array.isArray(object.material)) object.material.forEach((material) => disposable.add(material));
        else disposable.add(object.material);
      });
      disposable.forEach((material) => {
        const generatedTexture = material.userData.gtFiberTexture;
        if (generatedTexture instanceof CanvasTexture) generatedTexture.dispose();
        material.dispose();
      });
    };
  }, [model, onLoaded]);

  const relativeScale = capacityScale(product.shape, selections.capacity);
  const presentation = product.modelPresentation;
  const scale: [number, number, number] = relativeScale.map((value) => value * presentation.scale) as [number, number, number];
  const position: [number, number, number] = [
    presentation.position[0],
    presentation.position[1] + presentation.groundOffset * presentation.scale * (relativeScale[1] - 1),
    presentation.position[2]
  ];
  const logoOffset = selections['logo-position'] === 'front-upper' ? presentation.logoStep : selections['logo-position'] === 'front-lower' ? -presentation.logoStep : 0;
  const logoPosition: [number, number, number] = [presentation.logoAnchor[0], presentation.logoAnchor[1] + logoOffset, presentation.logoAnchor[2]];

  return <group scale={scale} position={position}>
    <primitive object={model} />
    {logoDataUrl && <LogoArtwork dataUrl={logoDataUrl} position={logoPosition} size={presentation.logoSize} branding={selections.branding} />}
  </group>;
}

export function shouldHideEmbeddedBranding(role: string, hasArtwork: boolean) {
  return role === 'label' && hasArtwork;
}

function capacityScale(shape: PackagingConcept['shape'], capacity: string): [number, number, number] {
  if (shape === 'full-mask' || shape === 'split-mask') {
    const scale = capacity === 'compact' ? 0.9 : capacity === 'extended' ? 1.1 : 1;
    return [scale, scale, scale];
  }
  if (shape === 'jar') {
    if (capacity === '30g') return [0.9, 0.88, 0.9];
    if (capacity === '80g') return [1.1, 1.12, 1.1];
    return [1, 1, 1];
  }
  if (capacity === '15ml') return [0.94, 0.88, 0.94];
  if (capacity === '50ml') return [1.06, 1.13, 1.06];
  return [1, 1, 1];
}

export function getRuntimeMaterialProfile({shape, role, material, finish, packMaterial}: {shape: PackagingConcept['shape']; role: string; material: string; finish: string; packMaterial?: string}) {
  const finishRoughness = finish === 'gloss' ? 0.16 : finish === 'soft-touch' ? 0.82 : 0.46;
  if (role === 'pack' || role === 'pack-detail') {
    if (packMaterial === 'paper-look') return {roughness: 0.88, metalness: 0, transmission: 0, thickness: 0, ior: 1.46, clearcoat: 0.02, clearcoatRoughness: 0.9};
    if (packMaterial === 'pet-al-pe') return {roughness: finish === 'gloss' ? 0.16 : Math.min(0.5, finishRoughness), metalness: 0.28, transmission: 0, thickness: 0, ior: 1.46, clearcoat: finish === 'gloss' ? 0.9 : 0.4, clearcoatRoughness: finish === 'gloss' ? 0.08 : 0.28};
    return {roughness: finishRoughness, metalness: 0.02, transmission: 0.035, thickness: 0.04, ior: 1.47, clearcoat: finish === 'gloss' ? 0.78 : 0.26, clearcoatRoughness: finish === 'gloss' ? 0.1 : 0.34};
  }
  if (role === 'body' && shape === 'jar' && material === 'glass') {
    return {roughness: finish === 'gloss' ? 0.14 : finish === 'soft-touch' ? 0.54 : 0.24, metalness: 0, transmission: 0.58, thickness: 0.38, ior: 1.5, clearcoat: 1, clearcoatRoughness: finish === 'soft-touch' ? 0.45 : 0.06};
  }
  if (role === 'body' && material === 'petg') {
    return {roughness: Math.min(0.52, finishRoughness), metalness: 0, transmission: 0.16, thickness: 0.18, ior: 1.47, clearcoat: finish === 'gloss' ? 0.9 : 0.35, clearcoatRoughness: finish === 'gloss' ? 0.08 : 0.28};
  }
  return {roughness: material === 'pcr-pp' ? Math.min(1, finishRoughness + 0.1) : finishRoughness, metalness: 0.025, transmission: 0, thickness: 0, ior: 1.46, clearcoat: finish === 'gloss' ? 1 : finish === 'soft-touch' ? 0.05 : 0.3, clearcoatRoughness: finish === 'gloss' ? 0.08 : finish === 'soft-touch' ? 0.7 : 0.28};
}

export function getRuntimeSheetColor(shape: PackagingConcept['shape'], material: string) {
  if (shape === 'split-mask') return '#d4ebe2';
  if (material === 'cotton') return '#ded8cc';
  if (material === 'bio-cellulose') return '#d5e2dc';
  return '#dfe7e2';
}

export function applyRuntimeModelConfiguration(model: Object3D, shape: PackagingConcept['shape'], selections: Record<string, string>, color: string, finish: string, invalidate: () => void) {
  applyModelConfiguration(model, shape, selections, color, finish);
  invalidate();
}

function applyModelConfiguration(model: Object3D, shape: PackagingConcept['shape'], selections: Record<string, string>, color: string, finish: string) {
  const finishRoughness = finish === 'gloss' ? 0.16 : finish === 'soft-touch' ? 0.82 : 0.46;
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const role = typeof object.userData.role === 'string' ? object.userData.role : '';
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of meshMaterials) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      if (role === 'body') {
        const profile = getRuntimeMaterialProfile({shape, role, material: selections.material, finish});
        material.color.set(color);
        material.roughness = profile.roughness;
        material.metalness = profile.metalness;
        material.transparent = false;
        material.opacity = 1;
        if (material instanceof MeshPhysicalMaterial) {
          material.transmission = profile.transmission;
          material.thickness = profile.thickness;
          material.ior = profile.ior;
          material.specularIntensity = profile.transmission > 0 ? 0.82 : 0.42;
          material.attenuationColor.set(color);
          material.attenuationDistance = shape === 'jar' && selections.material === 'glass' ? 2.2 : 3.4;
          material.clearcoat = profile.clearcoat;
          material.clearcoatRoughness = profile.clearcoatRoughness;
        }
      } else if (role === 'glass') {
        const glassColor = selections.material === 'amber' ? '#8a5733' : selections.material === 'frosted' ? '#eef3ef' : '#ffffff';
        material.color.set(glassColor);
        material.transparent = false;
        material.opacity = 1;
        material.roughness = selections.material === 'frosted' ? 0.58 : Math.min(0.22, finishRoughness);
        material.metalness = 0;
        if (material instanceof MeshPhysicalMaterial) {
          material.transmission = selections.material === 'frosted' ? 0.34 : selections.material === 'amber' ? 0.64 : 0.86;
          material.thickness = 0.34;
          material.ior = 1.5;
          material.specularIntensity = 0.92;
          material.attenuationColor.set(selections.material === 'amber' ? '#8a5733' : '#ffffff');
          material.attenuationDistance = selections.material === 'amber' ? 2.4 : 8;
        }
      } else if (role === 'trim') {
        material.color.set(color);
        material.roughness = finish === 'gloss' ? 0.16 : finish === 'soft-touch' ? 0.64 : 0.3;
        if (material instanceof MeshPhysicalMaterial) {
          material.clearcoat = finish === 'gloss' ? 0.9 : finish === 'soft-touch' ? 0.04 : 0.28;
          material.clearcoatRoughness = finish === 'gloss' ? 0.08 : finish === 'soft-touch' ? 0.62 : 0.2;
        }
      } else if (role === 'liquid') {
        material.color.set('#b87538');
        material.transparent = false;
        material.opacity = 1;
        material.roughness = 0.2;
        material.metalness = 0;
        if (material instanceof MeshPhysicalMaterial) {
          // Keep the inner volume opaque enough for Three.js transmission to sample it
          // through the outer glass instead of losing it in transparent-object sorting.
          material.transmission = 0;
          material.thickness = 0;
          material.clearcoat = 0.3;
          material.clearcoatRoughness = 0.12;
        }
      } else if (role === 'pack' || role === 'pack-detail') {
        const profile = getRuntimeMaterialProfile({shape, role, material: selections.material, finish, packMaterial: selections['pack-material']});
        material.color.set(color);
        if (role === 'pack-detail') material.color.multiplyScalar(0.72);
        material.roughness = profile.roughness;
        material.metalness = profile.metalness;
        material.transparent = false;
        material.opacity = 1;
        if (material instanceof MeshPhysicalMaterial) {
          material.transmission = profile.transmission;
          material.thickness = profile.thickness;
          material.ior = profile.ior;
          material.clearcoat = profile.clearcoat;
          material.clearcoatRoughness = profile.clearcoatRoughness;
        }
      } else if (role === 'sheet') {
        const hydrogel = shape === 'split-mask';
        material.color.set(getRuntimeSheetColor(shape, selections.material));
        material.map = hydrogel ? null : getFiberTexture(material);
        material.transparent = false;
        material.opacity = 1;
        material.roughness = hydrogel
          ? finish === 'gloss' ? 0.14 : finish === 'soft-touch' ? 0.62 : 0.34
          : selections.material === 'cotton' ? 0.94 : finish === 'gloss' ? 0.52 : 0.76;
        material.metalness = 0;
        if (material instanceof MeshPhysicalMaterial) {
          material.transmission = hydrogel
            ? selections.material === 'thin' ? 0.7 : selections.material === 'plush' ? 0.45 : 0.58
            : selections.material === 'bio-cellulose' ? 0.3 : selections.material === 'cotton' ? 0.02 : 0.12;
          material.thickness = hydrogel
            ? selections.material === 'thin' ? 0.07 : selections.material === 'plush' ? 0.18 : 0.12
            : selections.material === 'bio-cellulose' ? 0.05 : 0.03;
          material.ior = hydrogel ? 1.34 : 1.42;
          material.attenuationColor.set(hydrogel ? '#d6ebe4' : '#e3ece8');
          material.attenuationDistance = hydrogel ? 1.55 : 2.4;
          material.sheen = hydrogel ? 0.18 : 0.42;
          material.sheenColor.set('#f8fff9');
          material.sheenRoughness = hydrogel ? 0.42 : 0.82;
        }
        const baseScaleZ = typeof object.userData.baseScaleZ === 'number' ? object.userData.baseScaleZ : object.scale.z;
        object.userData.baseScaleZ = baseScaleZ;
        object.scale.z = baseScaleZ * (hydrogel ? (selections.material === 'thin' ? 0.72 : selections.material === 'plush' ? 1.34 : 1) : 1);
      } else if (role === 'label') {
        const branding = selections.branding ?? 'label';
        material.transparent = branding === 'screen';
        material.opacity = branding === 'screen' ? 0.08 : 1;
        material.depthWrite = branding !== 'screen';
        material.color.set(branding === 'foil' ? '#a6532e' : '#f5ede0');
        material.metalness = branding === 'foil' ? 0.72 : 0;
        material.roughness = branding === 'foil' ? 0.24 : 0.68;
      }
      if (material instanceof MeshPhysicalMaterial) {
        if (role === 'glass') {
          material.clearcoat = 1;
          material.clearcoatRoughness = selections.material === 'frosted' ? 0.5 : 0.06;
        } else if (role === 'sheet') {
          material.clearcoat = shape === 'split-mask'
            ? finish === 'gloss' ? 0.9 : finish === 'soft-touch' ? 0.16 : 0.48
            : finish === 'gloss' ? 0.22 : 0.08;
          material.clearcoatRoughness = shape === 'split-mask'
            ? finish === 'gloss' ? 0.08 : finish === 'soft-touch' ? 0.58 : 0.28
            : 0.72;
        }
        material.envMapIntensity = role === 'glass' || role === 'sheet' ? 1.35 : 1.05;
      }
      material.needsUpdate = true;
    }
  });
}

function getFiberTexture(material: MeshStandardMaterial) {
  const existing = material.userData.gtFiberTexture;
  if (existing instanceof CanvasTexture) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#f4f1ea';
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 2819;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < 1800; index += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const length = 2 + random() * 10;
    const angle = (random() - 0.5) * 0.8;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    context.strokeStyle = random() > 0.48 ? 'rgba(121, 116, 106, 0.13)' : 'rgba(255, 255, 255, 0.34)';
    context.lineWidth = 0.35 + random() * 0.75;
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.4, 3.8);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  material.userData.gtFiberTexture = texture;
  return texture;
}

function ProceduralPackage({shape, color, finish, logoDataUrl, logoPosition, branding}: {shape: PackagingConcept['shape']; color: string; finish: string; logoDataUrl: string | null; logoPosition: string; branding?: string}) {
  const roughness = finish === 'gloss' ? 0.18 : finish === 'soft-touch' ? 0.82 : 0.48;
  const bodyMaterial = <meshPhysicalMaterial color={color} roughness={roughness} metalness={0.05} clearcoat={finish === 'gloss' ? 1 : 0.25} clearcoatRoughness={0.2} />;
  const logoY = logoPosition === 'front-upper' ? 0.6 : logoPosition === 'front-lower' ? -0.65 : 0;

  if (shape === 'jar') return (
    <group position={[0, -0.65, 0]} rotation={[0, -0.2, 0]}>
      <mesh castShadow receiveShadow><cylinderGeometry args={[1.18, 1.1, 1.35, 64]} />{bodyMaterial}</mesh>
      <mesh position={[0, 0.82, 0]} castShadow><cylinderGeometry args={[1.2, 1.2, 0.3, 64]} /><meshStandardMaterial color="#17382f" roughness={0.35} /></mesh>
      <LabelBand y={0} z={1.08} />
      {logoDataUrl && <LogoArtwork dataUrl={logoDataUrl} position={[0, logoY * 0.55, 1.105]} size={[1.05, 0.42]} branding={branding} />}
    </group>
  );

  if (shape === 'full-mask' || shape === 'split-mask') return (
    <group position={[0, 0.1, 0]} rotation={[0, -0.2, 0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[2.7, 3.65, 0.14]} />{bodyMaterial}</mesh>
      {shape === 'full-mask' ? (
        <mesh position={[0, 0.05, 0.1]} scale={[0.72, 1.06, 0.025]}><sphereGeometry args={[1, 48, 32]} /><meshPhysicalMaterial color="#dbe9e2" transparent opacity={0.32} roughness={0.78} /></mesh>
      ) : (
        <group position={[0, 0.05, 0.1]}>
          <mesh position={[0, 0.55, 0]} scale={[0.78, 0.48, 0.025]}><sphereGeometry args={[1, 48, 24]} /><meshPhysicalMaterial color="#c9e4dc" transparent opacity={0.5} roughness={0.65} /></mesh>
          <mesh position={[0, -0.62, 0]} scale={[0.74, 0.62, 0.025]}><sphereGeometry args={[1, 48, 24]} /><meshPhysicalMaterial color="#c9e4dc" transparent opacity={0.5} roughness={0.65} /></mesh>
        </group>
      )}
      {logoDataUrl && <LogoArtwork dataUrl={logoDataUrl} position={[0, logoY * 1.25, 0.18]} size={[1.15, 0.5]} branding={branding} />}
    </group>
  );

  const radius = shape === 'airless' ? 0.82 : 0.9;
  return (
    <group position={[0, -0.28, 0]} rotation={[0, -0.2, 0]}>
      <mesh castShadow receiveShadow><cylinderGeometry args={[radius, radius * 1.03, 3.25, 64]} />{bodyMaterial}</mesh>
      <mesh position={[0, 1.78, 0]} castShadow><cylinderGeometry args={[radius * 0.44, radius * 0.44, 0.42, 48]} /><meshStandardMaterial color="#17382f" roughness={0.28} /></mesh>
      <mesh position={[0.18, 2.03, 0]} castShadow><boxGeometry args={[radius * 0.9, 0.15, 0.35]} /><meshStandardMaterial color="#17382f" roughness={0.28} /></mesh>
      <LabelBand y={-0.05} z={radius + 0.05} />
      {logoDataUrl && <LogoArtwork dataUrl={logoDataUrl} position={[0, logoY, radius + 0.075]} size={[1.05, 0.42]} branding={branding} />}
    </group>
  );
}

function LabelBand({y, z}: {y: number; z: number}) {
  return <mesh position={[0, y, z]}><boxGeometry args={[1.25, 0.95, 0.025]} /><meshStandardMaterial color="#f5ede0" roughness={0.7} /></mesh>;
}

export function getLogoMaterialPreset(branding = 'label') {
  if (branding === 'foil') return {color: '#c27646', metalness: 0.82, roughness: 0.2} as const;
  if (branding === 'screen') return {color: '#26302c', metalness: 0, roughness: 0.58} as const;
  return {color: '#ffffff', metalness: 0, roughness: 0.7} as const;
}

export function buildMonochromeLogoMask(pixels: Uint8ClampedArray) {
  const mask = new Uint8ClampedArray(pixels.length);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
    const coverage = Math.round((255 - luminance) * (pixels[offset + 3] / 255));
    mask[offset] = coverage;
    mask[offset + 1] = coverage;
    mask[offset + 2] = coverage;
    mask[offset + 3] = 255;
  }
  return mask;
}

function LogoArtwork({dataUrl, position, size, branding}: {dataUrl: string; position: [number, number, number]; size: [number, number]; branding?: string}) {
  const texture = useTexture(dataUrl);
  const material = getLogoMaterialPreset(branding);
  const processArtwork = branding === 'foil' || branding === 'screen';
  const displayTexture = useMemo(() => {
    const clone = texture.clone();
    clone.colorSpace = SRGBColorSpace;
    clone.needsUpdate = true;
    return clone;
  }, [texture]);
  const processMaskTexture = useMemo(() => {
    if (!processArtwork || typeof document === 'undefined') return null;
    const source = texture.image as CanvasImageSource & {naturalWidth?: number; naturalHeight?: number; width?: number; height?: number};
    const width = source.naturalWidth ?? source.width ?? 0;
    const height = source.naturalHeight ?? source.height ?? 0;
    if (!width || !height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) return null;
    try {
      context.drawImage(source, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      imageData.data.set(buildMonochromeLogoMask(imageData.data));
      context.putImageData(imageData, 0, 0);
    } catch {
      return null;
    }
    const maskTexture = new CanvasTexture(canvas);
    maskTexture.needsUpdate = true;
    return maskTexture;
  }, [processArtwork, texture]);
  useEffect(() => () => {
    displayTexture.dispose();
    processMaskTexture?.dispose();
  }, [displayTexture, processMaskTexture]);
  const useProcessMask = processArtwork && processMaskTexture;
  return <mesh position={position}><planeGeometry args={size} /><meshPhysicalMaterial map={useProcessMask ? null : displayTexture} alphaMap={useProcessMask || null} transparent alphaTest={0.04} depthWrite={false} color={material.color} metalness={material.metalness} roughness={material.roughness} /></mesh>;
}
