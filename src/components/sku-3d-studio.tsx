'use client';

import {Bounds, ContactShadows, Environment, Html, OrbitControls, useGLTF} from '@react-three/drei';
import {Canvas} from '@react-three/fiber';
import Image from 'next/image';
import {Component, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode} from 'react';
import {ACESFilmicToneMapping, Mesh, NeutralToneMapping} from 'three';

import {CONFIGURED_MODEL_VIEWER_POLICY, ConfiguredProductModel, getAssemblyInteraction, type ModelAssemblyState} from '@/components/bottle-configurator';
import {
  legacyPackagingProducts,
  resolvePackagingConceptColor,
  type PackagingConcept,
  type PackagingOption
} from '@/data/legacy-packaging-catalog';
import {type Locale} from '@/lib/routing';
import {
  createStudioConceptGenerationRequest,
  createStudioConceptImageRequest,
  createStudioGenerateRequest,
  GENERATED_VIEWER_POLICY,
  getConceptWorkflowReadiness,
  getStudioApiBaseUrl,
  getStudioSpecificationEffectCopy,
  getStudioSpecificationPlan,
  getStudioStageCopy,
  normalizeStudioConceptImage,
  normalizeStudioJob,
  STUDIO_WORKFLOW_COPY,
  type StudioConceptImage,
  type StudioJob
} from '@/lib/sku-3d-studio';

import styles from './sku-3d-studio.module.css';

type StudioMode = 'configuration' | 'ai-concept';
type Health = {
  ready: boolean;
  image_ready: boolean;
  model_ready: boolean;
  busy: boolean;
  estimated_wait_seconds: number;
};

const apiBase = getStudioApiBaseUrl(process.env.NEXT_PUBLIC_STUDIO_API_URL);
const defaultStudioSku = 'GT-DROPPER-030';
export const STUDIO_LOGO_ARTWORK = '/assets/brand/guangtuo-monogram-minimal.svg';
export const STUDIO_CONCEPT_EXAMPLE = '/assets/studio/new-shape-four-view-v1.png';
const reportedDropperSpecifications = {
  capacity: '15ml',
  material: 'amber',
  color: 'ivory',
  finish: 'soft-touch',
  branding: 'foil',
  'logo-position': 'front-lower'
};
const defaultConceptBriefs: Record<string, Record<Locale, string>> = {
  'GT-AIRLESS-030': {
    zh: '重新设计一款 30ml 真空瓶：瓶肩更利落，泵头与外盖比例更紧凑，整体适合高端功效护肤线。',
    en: 'Redesign a 30 ml airless bottle with a sharper shoulder, a compact pump-and-cap proportion, and a premium clinical skincare feel.',
    fr: 'Redessiner un flacon airless de 30 ml avec une épaule plus nette, une pompe et un capot compacts, dans un esprit de soin clinique haut de gamme.',
    es: 'Rediseñar un frasco airless de 30 ml con hombros más definidos, una bomba y tapa compactas y una estética clínica de alta gama.'
  },
  'GT-DROPPER-030': {
    zh: '重新设计一款 30ml 滴管瓶：瓶肩更干净，瓶底略厚，滴管盖与瓶身比例精致，适合高端精华。',
    en: 'Redesign a 30 ml dropper bottle with a cleaner shoulder, a slightly weighted base, and refined cap-to-bottle proportions.',
    fr: 'Redessiner un flacon compte-gouttes de 30 ml avec une épaule épurée, une base légèrement lestée et des proportions raffinées.',
    es: 'Rediseñar un frasco cuentagotas de 30 ml con hombros limpios, una base ligeramente pesada y proporciones refinadas.'
  },
  'GT-JAR-050': {
    zh: '重新设计一款 50g 面霜罐：罐体低矮稳重，盖子更薄，开合结构清楚，适合高端修护面霜。',
    en: 'Redesign a 50 g cream jar with a low weighted body, a slimmer lid, and a clearly readable opening structure.',
    fr: 'Redessiner un pot de crème de 50 g, bas et stable, avec un couvercle plus fin et une ouverture clairement lisible.',
    es: 'Rediseñar un tarro de crema de 50 g, bajo y estable, con una tapa más fina y una apertura claramente visible.'
  },
  'GT-MASK-FULL-025': {
    zh: '重新设计一款整体式面膜包装：袋型平整、边角柔和、封边精致，正面留出清晰的品牌与信息区域。',
    en: 'Redesign a full-sheet mask sachet with a flat premium pouch, soft corners, refined seals, and a clear front branding area.',
    fr: 'Redessiner un sachet de masque intégral, plat et haut de gamme, aux angles doux, avec des soudures fines et une zone de marque claire.',
    es: 'Rediseñar un sobre plano y premium para mascarilla completa, con esquinas suaves, sellos refinados y una zona frontal clara para la marca.'
  },
  'GT-MASK-SPLIT-030': {
    zh: '重新设计一款上下分体面膜包装：袋型平整，能清楚表达上下两片结构，封边和撕口简洁精致。',
    en: 'Redesign a split-mask sachet that clearly communicates the upper and lower pieces, with clean seals and a refined tear notch.',
    fr: 'Redessiner un sachet pour masque en deux parties qui exprime clairement les pièces haute et basse, avec des soudures nettes et une encoche fine.',
    es: 'Rediseñar un sobre para mascarilla dividida que muestre claramente las piezas superior e inferior, con sellos limpios y una muesca refinada.'
  }
};

const studioUiCopy = {
  en: {
    paletteAria: 'Package colour palette', customColorAria: 'Choose any package colour', anyColour: 'ANY COLOUR', unavailableShape: 'New shape creation is temporarily unavailable.', conceptFirstError: 'Generate and approve a concept image first.', unavailable3d: '3D preview is temporarily unavailable.', workcellAria: 'Packaging design and preview', workflowAria: 'Choose a workflow', configurationNote: 'Colour, material and brand', conceptNote: 'Start with an idea', formatTitle: 'Choose a format', formatNote: 'Bottle, dropper, jar or mask', formatAria: 'Packaging format', lookTitle: 'Choose the look', lookNote: 'Colour, material, finish and branding', shapeTitle: 'Describe the new shape', shapeNote: 'Describe its shape, proportions and opening', shapeBrief: 'Shape idea', creatingConcept: 'Creating concept…', anotherConcept: 'Try another concept', createConcept: 'Create concept', shapeUnavailable: 'New shape creation is temporarily unavailable. You can explore the existing formats.', view3dTitle: 'Approve and view in 3D', view3dNote: 'Create a rotatable preview when ready', creating3d: 'Creating 3D…', create3d: 'Create rotatable 3D', conceptFirst: 'Create and approve a concept first.', conceptSaved: 'Your concept is saved. You can create the 3D preview later.', assemblyAria: 'Assembly demonstration', assembly: 'ASSEMBLY', closed: 'Closed', open: 'Open', approveShape: 'Choose the shape', chosen: 'Selected', startVisual: 'Start with a visual', view3d: 'View in 3D', readyExplore: 'Ready to explore', waitingApproval: 'Waiting for your choice', livePreview: 'LIVE PREVIEW', dragRotate: 'Drag to rotate', errorTitle: 'It did not work this time', status: 'STATUS', ready3d: '3D ready', conceptReady: 'Concept ready', readyIdea: 'Ready for your idea', detailsSelected: '{count} details selected', download3d: 'Download 3D', readyFor3d: 'Ready for 3D', createConceptFirst: 'Create a concept first', viewProduct: 'View this product', boundary: 'The online preview helps you explore the look. Final size, structure, colour and feel are confirmed with samples.', exampleAlt: 'Four-view packaging example', example: 'EXAMPLE', exampleText: 'Your new shape will appear here', visualAlt: 'New packaging concept image', yourVisual: 'YOUR VISUAL', selectedDirection: 'Selected direction', loadingModel: 'Loading configured model…', opening3d: 'Opening 3D preview…', viewerError: 'The 3D preview cannot be opened right now.', viewerErrorNote: 'You can still download it below.'
  },
  zh: {
    paletteAria: '包装颜色调色板', customColorAria: '选择任意包装颜色', anyColour: '任意色', unavailableShape: '新造型暂时不可用，请先浏览现有包装。', conceptFirstError: '请先生成并确认一张方案图。', unavailable3d: '3D 预览暂时不可用。', workcellAria: '包装设计与预览', workflowAria: '选择工作方式', configurationNote: '颜色、材质与品牌', conceptNote: '从想法开始', formatTitle: '选择包装类型', formatNote: '真空瓶、滴管瓶、面霜罐或面膜', formatAria: '包装品类', lookTitle: '选择外观', lookNote: '颜色、材质、表面与品牌呈现', shapeTitle: '描述新造型', shapeNote: '写下形状、比例和开合方式', shapeBrief: '造型想法', creatingConcept: '正在生成方案图…', anotherConcept: '换一个方案', createConcept: '生成方案图', shapeUnavailable: '暂时不能生成新造型，您可以先查看现有包装。', view3dTitle: '确认后查看 3D', view3dNote: '满意后再生成可旋转预览', creating3d: '正在生成 3D…', create3d: '生成可旋转 3D', conceptFirst: '请先生成并确认方案图。', conceptSaved: '方案图已保存，3D 稍后可以继续生成。', assemblyAria: '部件演示', assembly: '部件演示', closed: '闭合', open: '打开', approveShape: '选择外形', chosen: '已经选好', startVisual: '先看灵感图', view3d: '查看 3D', readyExplore: '可以旋转查看', waitingApproval: '等待选择外形', livePreview: '实时预览', dragRotate: '拖动即可旋转', errorTitle: '这次没有生成成功', status: '当前状态', ready3d: '3D 已完成', conceptReady: '方案图已生成', readyIdea: '等待您的想法', detailsSelected: '已选择 {count} 项细节', download3d: '下载 3D', readyFor3d: '可继续生成 3D', createConceptFirst: '请先生成方案图', viewProduct: '查看这款包装', boundary: '在线效果帮助您探索外观。最终尺寸、结构、颜色和手感以实物样品为准。', exampleAlt: '同一包装的四视图示例', example: '示例', exampleText: '您的新造型会显示在这里', visualAlt: '新包装造型方案图', yourVisual: '您的灵感图', selectedDirection: '当前选用的方向', loadingModel: '载入配置模型…', opening3d: '正在打开 3D 预览…', viewerError: '3D 预览暂时无法打开。', viewerErrorNote: '您仍然可以在下方下载文件。'
  },
  fr: {
    paletteAria: 'Palette de couleurs de l’emballage', customColorAria: 'Choisir une couleur libre', anyColour: 'COULEUR LIBRE', unavailableShape: 'La création d’une nouvelle forme est momentanément indisponible.', conceptFirstError: 'Créez et choisissez d’abord une image de concept.', unavailable3d: 'L’aperçu 3D est momentanément indisponible.', workcellAria: 'Design et aperçu de l’emballage', workflowAria: 'Choisir une méthode', configurationNote: 'Couleur, matière et marque', conceptNote: 'Partir d’une idée', formatTitle: 'Choisir un format', formatNote: 'Flacon, compte-gouttes, pot ou masque', formatAria: 'Format d’emballage', lookTitle: 'Choisir l’apparence', lookNote: 'Couleur, matière, finition et marque', shapeTitle: 'Décrire la nouvelle forme', shapeNote: 'Décrivez la forme, les proportions et l’ouverture', shapeBrief: 'Idée de forme', creatingConcept: 'Création du concept…', anotherConcept: 'Essayer un autre concept', createConcept: 'Créer le concept', shapeUnavailable: 'La création d’une nouvelle forme est momentanément indisponible. Vous pouvez explorer les formats existants.', view3dTitle: 'Choisir puis voir en 3D', view3dNote: 'Créez un aperçu rotatif lorsque le concept vous plaît', creating3d: 'Création de la 3D…', create3d: 'Créer la 3D rotative', conceptFirst: 'Créez et choisissez d’abord un concept.', conceptSaved: 'Votre concept est enregistré. Vous pourrez créer la 3D plus tard.', assemblyAria: 'Démonstration d’assemblage', assembly: 'ASSEMBLAGE', closed: 'Fermé', open: 'Ouvert', approveShape: 'Choisir la forme', chosen: 'Sélectionnée', startVisual: 'Commencer par un visuel', view3d: 'Voir en 3D', readyExplore: 'Prêt à explorer', waitingApproval: 'En attente de votre choix', livePreview: 'APERÇU EN DIRECT', dragRotate: 'Faites glisser pour tourner', errorTitle: 'Cela n’a pas fonctionné cette fois', status: 'ÉTAT', ready3d: '3D prête', conceptReady: 'Concept prêt', readyIdea: 'Prêt pour votre idée', detailsSelected: '{count} détails sélectionnés', download3d: 'Télécharger la 3D', readyFor3d: 'Prêt pour la 3D', createConceptFirst: 'Créez d’abord un concept', viewProduct: 'Voir ce produit', boundary: 'L’aperçu en ligne aide à explorer l’apparence. Les dimensions, la structure, la couleur et le toucher finaux se confirment sur échantillon.', exampleAlt: 'Exemple d’emballage vu sous quatre angles', example: 'EXEMPLE', exampleText: 'Votre nouvelle forme apparaîtra ici', visualAlt: 'Image du nouveau concept d’emballage', yourVisual: 'VOTRE VISUEL', selectedDirection: 'Direction choisie', loadingModel: 'Chargement du modèle…', opening3d: 'Ouverture de l’aperçu 3D…', viewerError: 'L’aperçu 3D ne peut pas s’ouvrir pour le moment.', viewerErrorNote: 'Vous pouvez toujours télécharger le fichier ci-dessous.'
  },
  es: {
    paletteAria: 'Paleta de colores del envase', customColorAria: 'Elegir cualquier color de envase', anyColour: 'COLOR LIBRE', unavailableShape: 'La creación de una forma nueva no está disponible temporalmente.', conceptFirstError: 'Cree y elija primero una imagen de concepto.', unavailable3d: 'La vista 3D no está disponible temporalmente.', workcellAria: 'Diseño y vista previa del envase', workflowAria: 'Elegir una forma de trabajo', configurationNote: 'Color, material y marca', conceptNote: 'Empezar con una idea', formatTitle: 'Elegir un formato', formatNote: 'Frasco, cuentagotas, tarro o mascarilla', formatAria: 'Formato del envase', lookTitle: 'Elegir el aspecto', lookNote: 'Color, material, acabado y marca', shapeTitle: 'Describir la nueva forma', shapeNote: 'Describa la forma, las proporciones y la apertura', shapeBrief: 'Idea de forma', creatingConcept: 'Creando el concepto…', anotherConcept: 'Probar otro concepto', createConcept: 'Crear concepto', shapeUnavailable: 'La creación de una forma nueva no está disponible temporalmente. Puede explorar los formatos existentes.', view3dTitle: 'Elegir y ver en 3D', view3dNote: 'Cree una vista giratoria cuando le guste el concepto', creating3d: 'Creando 3D…', create3d: 'Crear 3D giratorio', conceptFirst: 'Cree y elija primero un concepto.', conceptSaved: 'Su concepto está guardado. Podrá crear la vista 3D más adelante.', assemblyAria: 'Demostración de montaje', assembly: 'MONTAJE', closed: 'Cerrado', open: 'Abierto', approveShape: 'Elegir la forma', chosen: 'Seleccionada', startVisual: 'Empezar con una imagen', view3d: 'Ver en 3D', readyExplore: 'Listo para explorar', waitingApproval: 'Esperando su elección', livePreview: 'VISTA EN DIRECTO', dragRotate: 'Arrastre para girar', errorTitle: 'Esta vez no ha funcionado', status: 'ESTADO', ready3d: '3D listo', conceptReady: 'Concepto listo', readyIdea: 'Listo para su idea', detailsSelected: '{count} detalles seleccionados', download3d: 'Descargar 3D', readyFor3d: 'Listo para 3D', createConceptFirst: 'Cree primero un concepto', viewProduct: 'Ver este producto', boundary: 'La vista en línea ayuda a explorar el aspecto. El tamaño, la estructura, el color y el tacto finales se confirman con muestras.', exampleAlt: 'Ejemplo de envase visto desde cuatro ángulos', example: 'EJEMPLO', exampleText: 'Su nueva forma aparecerá aquí', visualAlt: 'Imagen del nuevo concepto de envase', yourVisual: 'SU IMAGEN', selectedDirection: 'Dirección elegida', loadingModel: 'Cargando el modelo…', opening3d: 'Abriendo la vista 3D…', viewerError: 'La vista 3D no puede abrirse ahora.', viewerErrorNote: 'Aún puede descargar el archivo abajo.'
  }
} as const satisfies Record<Locale, Record<string, string>>;

export function PackageColorPalette({options, locale, selectedValue, resolvedColor, disabled, onSelect}: {
  options: PackagingOption[];
  locale: Locale;
  selectedValue: string;
  resolvedColor: string;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.colorPalette} role="group" aria-label={ui.paletteAria}>
      {options.map((option) => (
        <button
          className={selectedValue === option.id ? styles.paletteSwatchActive : styles.paletteSwatch}
          key={option.id}
          type="button"
          aria-label={option.label[locale]}
          aria-pressed={selectedValue === option.id}
          title={option.label[locale]}
          disabled={disabled}
          style={{'--palette-color': option.value} as CSSProperties}
          onClick={() => onSelect(option.id)}
        />
      ))}
      <label className={styles.customColor}>
        <input
          type="color"
          value={resolvedColor}
          aria-label={ui.customColorAria}
          disabled={disabled}
          onInput={(event) => onSelect(event.currentTarget.value.toLowerCase())}
        />
        <span><b>{ui.anyColour}</b><code>{resolvedColor.toUpperCase()}</code></span>
      </label>
    </div>
  );
}

export function Sku3dStudio({locale, products = legacyPackagingProducts, embedded = false}: {locale: Locale; products?: PackagingConcept[]; embedded?: boolean}) {
  const ui = studioUiCopy[locale];
  const [mode, setMode] = useState<StudioMode>('configuration');
  const [selectedSku, setSelectedSku] = useState(defaultStudioSku);
  const [seed] = useState(1234);
  const [conceptPrompt, setConceptPrompt] = useState(defaultConceptBriefs[defaultStudioSku][locale]);
  const [conceptImage, setConceptImage] = useState<StudioConceptImage | null>(null);
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    () => createStudioGenerateRequest({sku: defaultStudioSku, specifications: reportedDropperSpecifications}).specifications
  );
  const [health, setHealth] = useState<Health | null>(null);
  const [job, setJob] = useState<StudioJob | null>(null);
  const [requestError, setRequestError] = useState('');
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [assemblyState, setAssemblyState] = useState<ModelAssemblyState>('closed');

  const aiMode = mode === 'ai-concept';
  const selectedProduct = products.find((product) => product.sku === selectedSku) ?? products[0];
  const selectedColor = resolvePackagingConceptColor(selectedProduct, specifications.color);
  const selectedFinish = specifications.finish ?? 'satin';
  const specificationPlan = getStudioSpecificationPlan(selectedSku, specifications);
  const assemblyInteraction = getAssemblyInteraction(selectedProduct.shape);
  const configuredProductHref = `/${locale}/products/`;

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      if (!apiBase) {
        setHealth(null);
        return;
      }
      try {
        const response = await fetch(`${apiBase}/health`, {cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const nextHealth = await response.json() as Health;
        if (!active) return;
        setHealth(nextHealth);
      } catch {
        if (!active) return;
        setHealth(null);
      }
    }

    void loadHealth();
    const timer = window.setInterval(loadHealth, 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiBase}/jobs/${job.id}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setJob(normalizeStudioJob(await response.json() as Record<string, unknown>));
      } catch (error) {
        if (controller.signal.aborted) return;
        setRequestError(error instanceof Error ? error.message : String(error));
      }
    }, 1_200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [job]);

  function selectProduct(product: PackagingConcept) {
    setSelectedSku(product.sku);
    setSpecifications(createStudioGenerateRequest({sku: product.sku}).specifications);
    setConceptPrompt(defaultConceptBriefs[product.sku][locale]);
    setConceptImage(null);
    setJob(null);
    setRequestError('');
    setAssemblyState('closed');
  }

  function updateSpecification(id: string, value: string) {
    setSpecifications((current) => ({...current, [id]: value}));
    if (aiMode) {
      setConceptImage(null);
      setJob(null);
      setRequestError('');
    }
  }

  function updateConceptPrompt(value: string) {
    setConceptPrompt(value);
    setConceptImage(null);
    setJob(null);
    setRequestError('');
  }

  async function generateConceptImage() {
    if (!apiBase) {
      setRequestError(ui.unavailableShape);
      return;
    }
    setImageSubmitting(true);
    setRequestError('');
    setJob(null);
    try {
      const request = createStudioConceptImageRequest({
        sku: selectedSku,
        prompt: conceptPrompt,
        specifications
      });
      const response = await fetch(`${apiBase}/concept-images`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request)
      });
      const payload = await response.json() as Record<string, unknown> & {detail?: string};
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setConceptImage(normalizeStudioConceptImage(payload));
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      setImageSubmitting(false);
    }
  }

  async function generateModel() {
    if (!conceptImage) {
      setRequestError(ui.conceptFirstError);
      return;
    }
    if (!apiBase) {
      setRequestError(ui.unavailable3d);
      return;
    }
    setModelSubmitting(true);
    setRequestError('');
    setJob(null);
    try {
      const request = createStudioConceptGenerationRequest({
        sku: selectedSku,
        conceptImageId: conceptImage.id,
        seed,
        specifications
      });
      const response = await fetch(`${apiBase}/jobs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request)
      });
      const payload = await response.json() as Record<string, unknown> & {detail?: string};
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setJob(normalizeStudioJob(payload));
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      setModelSubmitting(false);
    }
  }

  const running = Boolean(job && job.status !== 'completed' && job.status !== 'failed');
  const modelUrl = apiBase && job?.modelUrl ? `${apiBase}${job.modelUrl}?v=${encodeURIComponent(job.updatedAt)}` : null;
  const conceptImageUrl = apiBase && conceptImage ? `${apiBase}${conceptImage.imageUrl}?v=${encodeURIComponent(conceptImage.createdAt)}` : null;
  const workflowReadiness = getConceptWorkflowReadiness({
    imageServiceReady: Boolean(health?.image_ready),
    modelServiceReady: Boolean(health?.model_ready),
    conceptImageId: conceptImage?.id ?? null,
    imageSubmitting,
    modelSubmitting,
    modelRunning: running
  });
  const pageCopy = STUDIO_WORKFLOW_COPY[locale];
  const Root = embedded ? 'section' : 'main';
  const Heading = embedded ? 'h2' : 'h1';

  return (
    <Root className={styles.page}>
      <header className={styles.intro}>
        <div>
          <p className={styles.kicker}>{pageCopy.kicker}</p>
          <Heading>{pageCopy.heading}</Heading>
        </div>
        <p>{pageCopy.intro}</p>
      </header>

      <section className={styles.workcell} aria-label={ui.workcellAria}>
        <aside className={styles.controls}>
          <div className={styles.modeSwitch} role="tablist" aria-label={ui.workflowAria}>
            <button type="button" role="tab" aria-selected={!aiMode} className={!aiMode ? styles.modeButtonActive : styles.modeButton} onClick={() => setMode('configuration')}>
              <span>01</span><b>{pageCopy.configurationTab}</b><small>{ui.configurationNote}</small>
            </button>
            <button type="button" role="tab" aria-selected={aiMode} className={aiMode ? styles.modeButtonActive : styles.modeButton} onClick={() => setMode('ai-concept')}>
              <span>02</span><b>{pageCopy.conceptTab}</b><small>{ui.conceptNote}</small>
            </button>
          </div>

          <div className={styles.sectionHeader}>
            <span>01</span>
            <div><b>{ui.formatTitle}</b><small>{ui.formatNote}</small></div>
          </div>

          <div className={styles.skuGrid} role="radiogroup" aria-label={ui.formatAria}>
            {products.map((product) => (
              <button
                className={product.sku === selectedSku ? styles.skuCardActive : styles.skuCard}
                key={product.sku}
                type="button"
                role="radio"
                aria-checked={product.sku === selectedSku}
                disabled={workflowReadiness.busy}
                onClick={() => selectProduct(product)}
              >
                <Image src={product.poster} width={240} height={240} alt="" />
                <span><b>{product.name[locale]}</b><small>{product.eyebrow[locale]}</small></span>
              </button>
            ))}
          </div>

          <div className={styles.specifications}>
            <div className={styles.sectionHeader}>
              <span>02</span>
              <div><b>{ui.lookTitle}</b><small>{ui.lookNote}</small></div>
            </div>
            <div className={styles.specificationGrid}>
              {selectedProduct.optionGroups.map((group, index) => group.id === 'color' ? (
                <div className={`${styles.specificationField} ${styles.colorField}`} key={group.id}>
                  <span>{group.label[locale]}<em title={specificationPlan[index].targetRoles.join(' · ')}>{getStudioSpecificationEffectCopy(specificationPlan[index].effect, locale)}</em></span>
                  <PackageColorPalette
                    options={group.options}
                    locale={locale}
                    selectedValue={specifications.color}
                    resolvedColor={selectedColor}
                    disabled={workflowReadiness.busy}
                    onSelect={(color) => updateSpecification('color', color)}
                  />
                </div>
              ) : (
                <label className={styles.specificationField} key={group.id}>
                  <span>{group.label[locale]}<em title={specificationPlan[index].targetRoles.join(' · ')}>{getStudioSpecificationEffectCopy(specificationPlan[index].effect, locale)}</em></span>
                  <select
                    value={specifications[group.id]}
                    disabled={workflowReadiness.busy}
                    onChange={(event) => updateSpecification(group.id, event.target.value)}
                  >
                    {group.options.map((option) => <option value={option.id} key={option.id}>{option.label[locale]}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {aiMode ? (
            <>
              <div className={styles.conceptStep}>
                <div className={styles.sectionHeader}>
                  <span>03</span>
                  <div><b>{ui.shapeTitle}</b><small>{ui.shapeNote}</small></div>
                </div>
                <label className={styles.promptField}>
                  <span>{ui.shapeBrief}<small>{conceptPrompt.length}/1200</small></span>
                  <textarea maxLength={1200} value={conceptPrompt} disabled={workflowReadiness.busy} onChange={(event) => updateConceptPrompt(event.target.value)} />
                </label>
                <button className={styles.conceptButton} type="button" disabled={!workflowReadiness.canGenerateImage} onClick={generateConceptImage}>
                  <span>{imageSubmitting ? ui.creatingConcept : conceptImage ? ui.anotherConcept : ui.createConcept}</span><b>→</b>
                </button>
                {!health?.image_ready && <p className={styles.help}>{ui.shapeUnavailable}</p>}
              </div>

              <div className={styles.geometryStep}>
                <div className={styles.sectionHeader}>
                  <span>04</span>
                  <div><b>{ui.view3dTitle}</b><small>{ui.view3dNote}</small></div>
                </div>
                <button className={styles.generateButton} type="button" disabled={!workflowReadiness.canGenerateModel} onClick={generateModel}>
                  <span>{modelSubmitting || running ? ui.creating3d : ui.create3d}</span><b>↗</b>
                </button>
                {!conceptImage && <p className={styles.help}>{ui.conceptFirst}</p>}
                {conceptImage && !health?.model_ready && <p className={styles.help}>{ui.conceptSaved}</p>}
              </div>
            </>
          ) : null}
        </aside>

        <div className={styles.output} style={{'--generated-viewer-height': `${GENERATED_VIEWER_POLICY.viewerHeight}px`} as CSSProperties}>
          <div className={styles.outputBar}><span>{aiMode ? pageCopy.conceptTab : pageCopy.configurationTab}</span><span>{selectedProduct.name[locale]}</span></div>

          <div className={styles.viewer}>
            {aiMode ? (
              modelUrl
                ? <ModelErrorBoundary key={modelUrl} fallback={<ViewerError locale={locale} />}><GeneratedModelViewer url={modelUrl} locale={locale} /></ModelErrorBoundary>
                : conceptImageUrl
                  ? <ConceptImagePreview imageUrl={conceptImageUrl} product={selectedProduct} locale={locale} />
                  : <StudioConceptExample locale={locale} />
            ) : (
              <ConfiguredModelViewer product={selectedProduct} specifications={specifications} color={selectedColor} finish={selectedFinish} logoDataUrl={STUDIO_LOGO_ARTWORK} assemblyState={assemblyState} locale={locale} />
            )}
            {aiMode && running && <div className={styles.processing}><span>{job?.progress ?? 0}%</span><p>{job ? getStudioStageCopy(job.status, locale) : ''}</p></div>}
            {!aiMode && assemblyInteraction && <div className={styles.assemblyControl} role="group" aria-label={ui.assemblyAria}>
              <span>{ui.assembly}</span>
              <button type="button" aria-pressed={assemblyState === 'closed'} onClick={() => setAssemblyState('closed')}>{ui.closed}</button>
              <button type="button" aria-pressed={assemblyState === 'open'} onClick={() => setAssemblyState('open')}>{ui.open}</button>
            </div>}
          </div>

          {aiMode ? (
            <div>
              <div className={styles.handoffRail}>
                <div className={conceptImage ? styles.handoffDone : styles.handoffCurrent}><span>01</span><div><b>{ui.approveShape}</b><small>{conceptImage ? ui.chosen : ui.startVisual}</small></div></div>
                <i aria-hidden="true">→</i>
                <div className={modelUrl ? styles.handoffDone : job ? styles.handoffCurrent : styles.handoff}><span>02</span><div><b>{ui.view3d}</b><small>{modelUrl ? ui.readyExplore : job ? getStudioStageCopy(job.status, locale) : ui.waitingApproval}</small></div></div>
              </div>
              {job && <div className={styles.productionRail}>
                <div className={styles.jobStatusLine}><b>{getStudioStageCopy(job.status, locale)}</b><span>{job.progress}%</span></div>
                <div className={styles.progressTrack}><span style={{width: `${job.progress}%`}} /></div>
              </div>}
            </div>
          ) : <div className={styles.configurationRail}><span>{ui.livePreview}</span><b>{ui.dragRotate}</b></div>}

          {(requestError || job?.error) && <div className={styles.error} role="alert"><b>{ui.errorTitle}</b><p>{requestError || job?.error}</p></div>}

          <div className={styles.resultBar}>
            <div><span>{ui.status}</span><b>{aiMode ? (modelUrl ? ui.ready3d : conceptImage ? ui.conceptReady : ui.readyIdea) : ui.detailsSelected.replace('{count}', String(Object.keys(specifications).length))}</b></div>
            {aiMode ? (modelUrl ? <a className={styles.download} href={modelUrl} download>{ui.download3d} <span>↓</span></a> : <span className={styles.downloadDisabled}>{conceptImage ? ui.readyFor3d : ui.createConceptFirst}</span>) : <a className={styles.download} href={configuredProductHref}>{ui.viewProduct} <span>↗</span></a>}
          </div>
        </div>
      </section>

      <p className={styles.boundary}>{ui.boundary}</p>
    </Root>
  );
}

function StudioConceptExample({locale}: {locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.conceptExample}>
      <Image src={STUDIO_CONCEPT_EXAMPLE} width={1024} height={1536} sizes="(max-width: 820px) 100vw, 70vw" alt={ui.exampleAlt} priority />
      <div className={styles.posterLabel}><span>{ui.example}</span><b>{ui.exampleText}</b></div>
    </div>
  );
}

function ConceptImagePreview({imageUrl, product, locale}: {imageUrl: string; product: PackagingConcept; locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.conceptPreview}>
      <Image src={imageUrl} width={1024} height={1024} sizes="(max-width: 820px) 100vw, 70vw" unoptimized alt={`${product.name[locale]} — ${ui.visualAlt}`} />
      <div className={styles.posterLabel}><span>{ui.yourVisual}</span><b>{ui.selectedDirection}</b></div>
    </div>
  );
}

function ConfiguredModelViewer({product, specifications, color, finish, logoDataUrl, assemblyState, locale}: {product: PackagingConcept; specifications: Record<string, string>; color: string; finish: string; logoDataUrl: string; assemblyState: ModelAssemblyState; locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <Canvas dpr={[1, CONFIGURED_MODEL_VIEWER_POLICY.maxDpr]} frameloop="demand" shadows="basic" camera={{position: [...CONFIGURED_MODEL_VIEWER_POLICY.cameraPosition], fov: 36}} gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = CONFIGURED_MODEL_VIEWER_POLICY.exposure; }}>
      <color attach="background" args={['#ded9cf']} />
      <ambientLight intensity={CONFIGURED_MODEL_VIEWER_POLICY.ambientIntensity} />
      <directionalLight castShadow position={[4, 7, 5]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.keyIntensity} color="#fff7e7" />
      <directionalLight position={[-5, 2, -3]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.fillIntensity} color="#aac8bf" />
      <Suspense fallback={<Html center><div className={styles.modelLoader}>{ui.loadingModel}</div></Html>}>
        <Bounds fit margin={1.2} maxDuration={0.35}><ConfiguredProductModel product={product} selections={specifications} color={color} finish={finish} logoDataUrl={logoDataUrl} assemblyState={assemblyState} /></Bounds>
        <Environment preset="studio" />
        <ContactShadows frames={1} resolution={256} position={[0, -1.7, 0]} opacity={0.3} scale={7} blur={2.8} far={5} />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={2.2} maxDistance={9} minPolarAngle={Math.PI / 4.2} maxPolarAngle={Math.PI / 1.72} />
    </Canvas>
  );
}

function GeneratedModelViewer({url, locale}: {url: string; locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <Canvas dpr={[1, GENERATED_VIEWER_POLICY.maxDpr]} frameloop={GENERATED_VIEWER_POLICY.frameloop} shadows="basic" camera={{position: [3.8, 2.6, 4.8], fov: 36}} gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = NeutralToneMapping; gl.toneMappingExposure = 1.05; }}>
      <color attach="background" args={['#e8e4dc']} />
      <ambientLight intensity={1.2} />
      <directionalLight castShadow position={[4, 7, 5]} intensity={3.4} color="#fff7e7" />
      <directionalLight position={[-5, 2, -3]} intensity={1.8} color="#aac8bf" />
      <Suspense fallback={<Html center><div className={styles.modelLoader}>{ui.opening3d}</div></Html>}>
        <Bounds fit margin={1.25} maxDuration={0.35}><GeneratedMesh url={url} /></Bounds>
        <ContactShadows frames={GENERATED_VIEWER_POLICY.shadowFrames} resolution={256} position={[0, -1.7, 0]} opacity={0.32} scale={7} blur={2.8} far={5} />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} autoRotate={GENERATED_VIEWER_POLICY.autoRotate} minDistance={GENERATED_VIEWER_POLICY.minDistance} maxDistance={GENERATED_VIEWER_POLICY.maxDistance} minPolarAngle={Math.PI / 4.2} maxPolarAngle={Math.PI / 1.72} />
    </Canvas>
  );
}

function GeneratedMesh({url}: {url: string}) {
  const {scene} = useGLTF(url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [scene]);
  return <primitive object={model} />;
}

class ModelErrorBoundary extends Component<{children: ReactNode; fallback: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function ViewerError({locale}: {locale: Locale}) {
  const ui = studioUiCopy[locale];
  return <div className={styles.viewerError}><b>{ui.viewerError}</b><p>{ui.viewerErrorNote}</p></div>;
}
