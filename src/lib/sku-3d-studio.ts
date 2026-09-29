import {z} from 'zod';

import {
  isCustomProductColor,
  allPackagingProducts,
  type PackagingConcept
} from '@/data/legacy-packaging-catalog';
import type {Locale} from '@/lib/routing';

export const STUDIO_STAGE_ORDER = [
  'queued',
  'preparing',
  'generating',
  'finalizing',
  'completed',
  'failed'
] as const;

export type StudioStage = (typeof STUDIO_STAGE_ORDER)[number];

export const SKU_3D_WORKFLOW_POLICY = {
  primary: {
    id: 'catalog-configurator',
    geometry: 'curated-parametric-glb',
    appearance: 'runtime-pbr',
    branding: 'artwork-layer',
    output: 'review-preview'
  },
  concept: {
    id: 'brief-image-managed-3d',
    image: {
      provider: 'image-2',
      model: 'gpt-image-2',
      input: 'text-brief',
      output: 'approved-concept-image'
    },
    geometry: {
      provider: 'managed-worker',
      device: 'server-gpu',
      input: 'approved-concept-image',
      output: 'web-ready-preview'
    },
    delivery: 'cached-web-asset',
    customerDevice: 'viewer-only',
    specificationsAffectMesh: 'through-approved-design'
  }
} as const;

export const GPT_IMAGE_CONCEPT_POLICY = {
  provider: 'openai',
  model: 'gpt-image-2',
  size: '1024x1024',
  quality: 'medium',
  background: 'transparent',
  outputFormat: 'png'
} as const;

export const STUDIO_WORKFLOW_COPY = {
  zh: {
    kicker: '3D 包装设计',
    heading: '看看包装的样子。',
    intro: '选一款现有包装，调整颜色、材质与 Logo；也可以从一个新造型开始。',
    configurationTab: '现有包装',
    conceptTab: '新造型'
  },
  en: {
    kicker: '3D PACKAGING STUDIO',
    heading: 'See your packaging before it is made.',
    intro: 'Choose a current format and change the colour, material and logo, or begin with a completely new shape.',
    configurationTab: 'Customise a product',
    conceptTab: 'Create a new shape'
  },
  fr: {
    kicker: 'STUDIO D’EMBALLAGE 3D',
    heading: 'Visualisez votre emballage avant sa fabrication.',
    intro: 'Choisissez un format existant et changez la couleur, le matériau et le logo, ou imaginez une nouvelle forme.',
    configurationTab: 'Personnaliser un concept',
    conceptTab: 'Créer une forme'
  },
  es: {
    kicker: 'ESTUDIO DE ENVASES 3D',
    heading: 'Visualiza tu envase antes de fabricarlo.',
    intro: 'Elige un formato actual y cambia color, material y logotipo, o imagina una forma nueva.',
    configurationTab: 'Personalizar un concepto',
    conceptTab: 'Crear una forma'
  },
  ru: {
    kicker: 'СТУДИЯ 3D-УПАКОВКИ', heading: 'Посмотрите упаковку до её производства.', intro: 'Выберите текущий формат и измените цвет, материал и логотип или начните с совершенно новой формы.', configurationTab: 'Настроить продукт', conceptTab: 'Создать новую форму'
  },
  ar: {
    kicker: 'استوديو التغليف ثلاثي الأبعاد', heading: 'شاهد تغليفك قبل تصنيعه.', intro: 'اختر تصميماً حالياً وعدّل اللون والمادة والشعار، أو ابدأ بشكل جديد تماماً.', configurationTab: 'تخصيص منتج', conceptTab: 'إنشاء شكل جديد'
  }
} as const satisfies Record<Locale, {
  kicker: string;
  heading: string;
  intro: string;
  configurationTab: string;
  conceptTab: string;
}>;

export const HUNYUAN_CONCEPT_ENGINE_POLICY = {
  provider: 'hunyuan3d',
  model: 'Hunyuan3D-2mini',
  tripoEnabled: false,
  steps: 50,
  octreeResolution: 384,
  preserveNativeMesh: true
} as const;

/** @deprecated Use HUNYUAN_CONCEPT_ENGINE_POLICY for the experimental AI branch. */
export const PRIMARY_3D_ENGINE_POLICY = HUNYUAN_CONCEPT_ENGINE_POLICY;

export const GENERATED_VIEWER_POLICY = {
  autoRotate: false,
  frameloop: 'demand',
  minDistance: 2.2,
  maxDistance: 9,
  maxDpr: 1.25,
  shadowFrames: 1,
  viewerHeight: 600
} as const;

const generationSchema = z.object({
  engine: z.literal(HUNYUAN_CONCEPT_ENGINE_POLICY.provider).default(HUNYUAN_CONCEPT_ENGINE_POLICY.provider),
  sku: z.string().trim().min(1),
  steps: z.literal(HUNYUAN_CONCEPT_ENGINE_POLICY.steps).default(HUNYUAN_CONCEPT_ENGINE_POLICY.steps),
  seed: z.coerce.number().int().min(0).max(2_147_483_647).default(1234),
  octreeResolution: z.literal(HUNYUAN_CONCEPT_ENGINE_POLICY.octreeResolution).default(HUNYUAN_CONCEPT_ENGINE_POLICY.octreeResolution),
  preserveNativeMesh: z.literal(HUNYUAN_CONCEPT_ENGINE_POLICY.preserveNativeMesh).default(HUNYUAN_CONCEPT_ENGINE_POLICY.preserveNativeMesh),
  specifications: z.record(z.string(), z.string()).optional()
});

const conceptImageIdSchema = z.string().regex(/^[a-f0-9]{32}$/, '方案图编号无效');
const conceptImageRequestSchema = z.object({
  sku: z.string().trim().min(1),
  prompt: z.string().trim().min(12, '请把新造型说明写得再具体一些').max(1200, '新造型说明不能超过 1200 个字符'),
  specifications: z.record(z.string(), z.string()).optional()
});

const specificationEffects = {
  capacity: 'geometry-scale',
  material: 'pbr-material',
  'pack-material': 'pbr-material',
  color: 'pbr-color',
  finish: 'pbr-finish',
  branding: 'logo-material',
  'logo-position': 'logo-anchor'
} as const;

const specificationTargetRoles = {
  lotion: {capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']},
  cleanser: {capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']},
  airless: {
    capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']
  },
  bottle: {
    capacity: ['root'], material: ['glass'], color: ['trim'], finish: ['glass', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']
  },
  jar: {
    capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']
  },
  'full-mask': {
    capacity: ['root'], material: ['sheet'], 'pack-material': ['pack', 'pack-detail'], color: ['pack', 'pack-detail'], finish: ['pack', 'pack-detail'], 'logo-position': ['artwork']
  },
  'split-mask': {
    capacity: ['root'], material: ['sheet'], 'pack-material': ['pack', 'pack-detail'], color: ['pack', 'pack-detail'], finish: ['pack', 'pack-detail'], 'logo-position': ['artwork']
  },
  mousse: {capacity: ['root'], material: ['body'], color: ['body'], finish: ['body'], branding: ['artwork'], 'logo-position': ['artwork']},
  spray: {capacity: ['root'], material: ['body'], color: ['body'], finish: ['body'], branding: ['artwork'], 'logo-position': ['artwork']},
  'cotton-box': {capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']},
  'dual-chamber': {capacity: ['root'], material: ['body'], color: ['body', 'trim'], finish: ['body', 'trim'], branding: ['artwork'], 'logo-position': ['artwork']}
} as const;

const specificationEffectCopy: Record<Locale, Record<StudioSpecificationEffect, string>> = {
  zh: {
    'geometry-scale': '大小变化',
    'pbr-material': '材质效果',
    'pbr-color': '包装颜色',
    'pbr-finish': '表面质感',
    'logo-material': 'Logo 效果',
    'logo-anchor': 'Logo 位置'
  },
  en: {
    'geometry-scale': 'SIZE',
    'pbr-material': 'MATERIAL',
    'pbr-color': 'PACKAGE COLOR',
    'pbr-finish': 'SURFACE',
    'logo-material': 'LOGO',
    'logo-anchor': 'POSITION'
  },
  fr: {
    'geometry-scale': 'FORMAT',
    'pbr-material': 'MATÉRIAU',
    'pbr-color': 'COULEUR',
    'pbr-finish': 'FINITION',
    'logo-material': 'LOGO',
    'logo-anchor': 'POSITION'
  },
  es: {
    'geometry-scale': 'TAMAÑO',
    'pbr-material': 'MATERIAL',
    'pbr-color': 'COLOR',
    'pbr-finish': 'ACABADO',
    'logo-material': 'LOGOTIPO',
    'logo-anchor': 'POSICIÓN'
  },
  ru: {
    'geometry-scale': 'РАЗМЕР', 'pbr-material': 'МАТЕРИАЛ', 'pbr-color': 'ЦВЕТ УПАКОВКИ', 'pbr-finish': 'ПОВЕРХНОСТЬ', 'logo-material': 'ЛОГОТИП', 'logo-anchor': 'ПОЗИЦИЯ'
  },
  ar: {
    'geometry-scale': 'الحجم', 'pbr-material': 'المادة', 'pbr-color': 'لون التغليف', 'pbr-finish': 'السطح', 'logo-material': 'الشعار', 'logo-anchor': 'الموضع'
  }
};

export type StudioSpecificationEffect = (typeof specificationEffects)[keyof typeof specificationEffects];

function getPackagingConcept(sku: string): PackagingConcept | undefined {
  return allPackagingProducts.find((item) => item.sku === sku);
}

export function getStudioSpecificationPlan(sku: string, specifications: Record<string, string>) {
  const product = getPackagingConcept(sku);
  if (!product) throw new Error('请选择目录中的 SKU');
  const validated = createStudioGenerateRequest({sku, specifications}).specifications;

  return product.optionGroups.map((group) => ({
    id: group.id,
    value: validated[group.id],
    effect: specificationEffects[group.id as keyof typeof specificationEffects] ?? 'pbr-material',
    targetRoles: [...(specificationTargetRoles[product.shape][group.id as keyof (typeof specificationTargetRoles)[typeof product.shape]] ?? ['root'])]
  }));
}

export function getStudioSpecificationEffectCopy(effect: StudioSpecificationEffect, locale: Locale): string {
  return specificationEffectCopy[locale][effect];
}

export type StudioGenerateRequest = Omit<z.infer<typeof generationSchema>, 'specifications'> & {
  specifications: Record<string, string>;
};

export type StudioConceptImageRequest = {
  sku: string;
  prompt: string;
  specifications: Record<string, string>;
};

export type StudioConceptImage = StudioConceptImageRequest & {
  id: string;
  imageUrl: string;
  createdAt: string;
  cached: boolean;
};

export type StudioConceptGenerationRequest = Pick<StudioGenerateRequest, 'sku' | 'seed' | 'specifications'> & {
  conceptImageId: string;
};

export type StudioJob = StudioConceptGenerationRequest & {
  id: string;
  status: StudioStage;
  progress: number;
  message: string;
  modelUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

const stageCopy: Record<Locale, Record<StudioStage, string>> = {
  zh: {
    queued: '准备开始',
    preparing: '正在整理图片',
    generating: '正在生成 3D 预览',
    finalizing: '正在调整细节',
    completed: '可以查看 3D 了',
    failed: '暂时没有完成'
  },
  en: {
    queued: 'Getting ready',
    preparing: 'Preparing the image',
    generating: 'Creating the 3D preview',
    finalizing: 'Refining the details',
    completed: 'Your 3D preview is ready',
    failed: 'Not completed this time'
  },
  fr: {
    queued: 'Préparation',
    preparing: 'Préparation de l’image',
    generating: 'Création de l’aperçu 3D',
    finalizing: 'Ajustement des détails',
    completed: 'L’aperçu 3D est prêt',
    failed: 'La génération a échoué'
  },
  es: {
    queued: 'Preparando',
    preparing: 'Preparando la imagen',
    generating: 'Creando la vista 3D',
    finalizing: 'Ajustando los detalles',
    completed: 'La vista 3D está lista',
    failed: 'No se pudo completar'
  },
  ru: {
    queued: 'Подготовка', preparing: 'Подготавливаем изображение', generating: 'Создаём 3D-просмотр', finalizing: 'Уточняем детали', completed: '3D-просмотр готов', failed: 'Не удалось завершить'
  },
  ar: {
    queued: 'جارٍ الاستعداد', preparing: 'جارٍ تجهيز الصورة', generating: 'جارٍ إنشاء العرض ثلاثي الأبعاد', finalizing: 'جارٍ تحسين التفاصيل', completed: 'العرض ثلاثي الأبعاد جاهز', failed: 'لم تكتمل العملية'
  }
};

export function createStudioGenerateRequest(
  input: Partial<StudioGenerateRequest> & Pick<StudioGenerateRequest, 'sku'>
): StudioGenerateRequest {
  const product = getPackagingConcept(input.sku);
  if (!product) {
    throw new Error('请选择目录中的 SKU');
  }

  const parsed = generationSchema.parse(input);
  const specifications = Object.fromEntries(product.optionGroups.map((group) => {
    const selected = parsed.specifications?.[group.id] ?? group.options[0]?.id;
    const validCustomColor = group.id === 'color' && Boolean(selected) && isCustomProductColor(selected);
    if (!selected || (!validCustomColor && !group.options.some((option) => option.id === selected))) {
      throw new Error(`规格值不属于当前 SKU：${group.id}`);
    }
    return [group.id, selected];
  }));

  return {...parsed, specifications};
}

export function createStudioConceptImageRequest(
  input: {sku: string; prompt: string; specifications?: Record<string, string>}
): StudioConceptImageRequest {
  const parsed = conceptImageRequestSchema.parse(input);
  const specifications = createStudioGenerateRequest({
    sku: parsed.sku,
    specifications: parsed.specifications
  }).specifications;
  return {...parsed, specifications};
}

export function createStudioConceptGenerationRequest(
  input: Partial<StudioGenerateRequest> & Pick<StudioGenerateRequest, 'sku'> & {conceptImageId: string}
): StudioConceptGenerationRequest {
  const request = createStudioGenerateRequest(input);
  return {
    sku: request.sku,
    seed: request.seed,
    specifications: request.specifications,
    conceptImageId: conceptImageIdSchema.parse(input.conceptImageId)
  };
}

export function getStudioStageCopy(stage: StudioStage, locale: Locale): string {
  return stageCopy[locale][stage];
}

export function getStudioApiBaseUrl(
  configuredUrl?: string,
  development = process.env.NODE_ENV === 'development'
): string | null {
  const explicitUrl = configuredUrl?.trim();
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');
  return development ? 'http://127.0.0.1:8091' : null;
}

export function normalizeStudioJob(payload: Record<string, unknown>): StudioJob {
  return {
    id: String(payload.id),
    sku: String(payload.sku),
    seed: Number(payload.seed),
    conceptImageId: conceptImageIdSchema.parse(payload.concept_image_id),
    specifications: isStringRecord(payload.specifications) ? payload.specifications : {},
    status: payload.status as StudioStage,
    progress: Number(payload.progress),
    message: String(payload.message ?? ''),
    modelUrl: payload.model_url ? String(payload.model_url) : null,
    error: payload.error ? String(payload.error) : null,
    createdAt: String(payload.created_at),
    updatedAt: String(payload.updated_at)
  };
}

export function normalizeStudioConceptImage(payload: Record<string, unknown>): StudioConceptImage {
  const request = createStudioConceptImageRequest({
    sku: String(payload.sku),
    prompt: String(payload.prompt),
    specifications: isStringRecord(payload.specifications) ? payload.specifications : undefined
  });
  return {
    ...request,
    id: conceptImageIdSchema.parse(payload.id),
    imageUrl: String(payload.image_url),
    createdAt: String(payload.created_at),
    cached: Boolean(payload.cached)
  };
}

export function getConceptWorkflowReadiness({
  imageServiceReady,
  modelServiceReady,
  conceptImageId,
  imageSubmitting,
  modelSubmitting,
  modelRunning
}: {
  imageServiceReady: boolean;
  modelServiceReady: boolean;
  conceptImageId: string | null;
  imageSubmitting: boolean;
  modelSubmitting: boolean;
  modelRunning: boolean;
}) {
  const busy = imageSubmitting || modelSubmitting || modelRunning;
  return {
    canGenerateImage: imageServiceReady && !busy,
    canGenerateModel: modelServiceReady && Boolean(conceptImageId) && !busy,
    busy
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}
