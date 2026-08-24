import {describe, expect, it} from 'vitest';

import * as catalog from '@/data/legacy-packaging-catalog';
import * as studio from '@/lib/sku-3d-studio';

const {legacyPackagingProducts: products} = catalog;

const {
  createStudioGenerateRequest,
  getStudioApiBaseUrl,
  getStudioSpecificationPlan,
  getStudioStageCopy,
  HUNYUAN_CONCEPT_ENGINE_POLICY,
  SKU_3D_WORKFLOW_POLICY,
  STUDIO_STAGE_ORDER
} = studio;

describe('SKU 3D studio contract', () => {
  it('fills safe generation defaults for a catalog SKU', () => {
    expect(createStudioGenerateRequest({sku: 'GT-JAR-050'})).toEqual({
      engine: 'hunyuan3d',
      sku: 'GT-JAR-050',
      steps: 50,
      seed: 1234,
      octreeResolution: 384,
      preserveNativeMesh: true,
      specifications: {
        capacity: '30g',
        material: 'glass',
        color: 'forest',
        finish: 'satin',
        branding: 'label',
        'logo-position': 'front-upper'
      }
    });
  });

  it('keeps customer devices outside the image and 3D generation path', () => {
    expect(SKU_3D_WORKFLOW_POLICY).toEqual({
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
    });
    expect(HUNYUAN_CONCEPT_ENGINE_POLICY).toEqual({
      provider: 'hunyuan3d',
      model: 'Hunyuan3D-2mini',
      tripoEnabled: false,
      steps: 50,
      octreeResolution: 384,
      preserveNativeMesh: true
    });
  });

  it('builds a bounded GPT Image 2 request from the product brief and six specifications', () => {
    expect(studio).toHaveProperty('createStudioConceptImageRequest');
    const createStudioConceptImageRequest = (studio as unknown as {
      createStudioConceptImageRequest: (input: {sku: string; prompt: string; specifications?: Record<string, string>}) => {
        sku: string; prompt: string; specifications: Record<string, string>;
      };
    }).createStudioConceptImageRequest;
    const request = createStudioConceptImageRequest({
      sku: 'GT-DROPPER-030',
      prompt: '做一款肩部更利落、底部更厚重的 30ml 棕色玻璃滴管瓶。',
      specifications: {
        capacity: '30ml',
        material: 'amber',
        color: 'forest',
        finish: 'satin',
        branding: 'foil',
        'logo-position': 'front-upper'
      }
    });

    expect(request).toEqual({
      sku: 'GT-DROPPER-030',
      prompt: '做一款肩部更利落、底部更厚重的 30ml 棕色玻璃滴管瓶。',
      specifications: {
        capacity: '30ml',
        material: 'amber',
        color: 'forest',
        finish: 'satin',
        branding: 'foil',
        'logo-position': 'front-upper'
      }
    });
    expect(() => createStudioConceptImageRequest({
      sku: 'GT-DROPPER-030',
      prompt: '太短'
    })).toThrow();
  });

  it('sends only customer choices when requesting managed 3D generation', () => {
    expect(studio).toHaveProperty('createStudioConceptGenerationRequest');
    const createStudioConceptGenerationRequest = (studio as unknown as {
      createStudioConceptGenerationRequest: (input: {sku: string; conceptImageId: string}) => {
        conceptImageId: string;
      };
    }).createStudioConceptGenerationRequest;
    const request = createStudioConceptGenerationRequest({
      sku: 'GT-JAR-050',
      conceptImageId: '0123456789abcdef0123456789abcdef'
    });

    expect(request).toEqual({
      sku: 'GT-JAR-050',
      conceptImageId: '0123456789abcdef0123456789abcdef',
      seed: 1234,
      specifications: {
        capacity: '30g',
        material: 'glass',
        color: 'forest',
        finish: 'satin',
        branding: 'label',
        'logo-position': 'front-upper'
      }
    });
    expect(request).not.toHaveProperty('engine');
    expect(request).not.toHaveProperty('steps');
    expect(request).not.toHaveProperty('octreeResolution');
    expect(request).not.toHaveProperty('preserveNativeMesh');
    expect(() => createStudioConceptGenerationRequest({
      sku: 'GT-JAR-050',
      conceptImageId: '../../client-file.png'
    })).toThrow();
  });

  it('uses customer-facing copy while keeping implementation details private', () => {
    expect(studio).toHaveProperty('STUDIO_WORKFLOW_COPY');
    const copy = (studio as unknown as {
      STUDIO_WORKFLOW_COPY: {zh: {kicker: string; heading: string; intro: string; configurationTab: string; conceptTab: string}};
    }).STUDIO_WORKFLOW_COPY.zh;
    const allCopy = Object.values(copy).join(' ');

    expect(copy.heading).toBe('包装做出来之前，\n先看看它会是什么样。');
    expect(copy.intro).toBe('选一款现有包装，调整颜色、材质与 Logo；也可以从一个新造型开始。');
    expect(allCopy).not.toMatch(/SKU|GPT|GPU|显卡|参数化|PBR|GLB|Hunyuan|本机|服务|任务|队列|接口|轨道|边界|实验|生产单元|高精度策略/i);
  });

  it('gates managed image and 3D services without inspecting customer hardware', () => {
    expect(studio).toHaveProperty('getConceptWorkflowReadiness');
    const getConceptWorkflowReadiness = (studio as unknown as {
      getConceptWorkflowReadiness: (input: {
        imageServiceReady: boolean;
        modelServiceReady: boolean;
        conceptImageId: string | null;
        imageSubmitting: boolean;
        modelSubmitting: boolean;
        modelRunning: boolean;
      }) => {canGenerateImage: boolean; canGenerateModel: boolean; busy: boolean};
    }).getConceptWorkflowReadiness;
    expect(getConceptWorkflowReadiness({
      imageServiceReady: true,
      modelServiceReady: true,
      conceptImageId: null,
      imageSubmitting: false,
      modelSubmitting: false,
      modelRunning: false
    })).toEqual({canGenerateImage: true, canGenerateModel: false, busy: false});

    expect(getConceptWorkflowReadiness({
      imageServiceReady: false,
      modelServiceReady: true,
      conceptImageId: '0123456789abcdef0123456789abcdef',
      imageSubmitting: false,
      modelSubmitting: false,
      modelRunning: false
    })).toEqual({canGenerateImage: false, canGenerateModel: true, busy: false});

    expect(getConceptWorkflowReadiness({
      imageServiceReady: true,
      modelServiceReady: true,
      conceptImageId: '0123456789abcdef0123456789abcdef',
      imageSubmitting: true,
      modelSubmitting: false,
      modelRunning: false
    })).toEqual({canGenerateImage: false, canGenerateModel: false, busy: true});
  });

  it('maps all six dropper specifications to deterministic preview effects', () => {
    const request = createStudioGenerateRequest({
      sku: 'GT-DROPPER-030',
      specifications: {
        capacity: '15ml',
        material: 'amber',
        color: 'ivory',
        finish: 'soft-touch',
        branding: 'foil',
        'logo-position': 'front-lower'
      }
    });

    expect(getStudioSpecificationPlan('GT-DROPPER-030', request.specifications)).toEqual([
      {id: 'capacity', value: '15ml', effect: 'geometry-scale', targetRoles: ['root']},
      {id: 'material', value: 'amber', effect: 'pbr-material', targetRoles: ['glass']},
      {id: 'color', value: 'ivory', effect: 'pbr-color', targetRoles: ['trim']},
      {id: 'finish', value: 'soft-touch', effect: 'pbr-finish', targetRoles: ['glass', 'trim']},
      {id: 'branding', value: 'foil', effect: 'logo-material', targetRoles: ['artwork']},
      {id: 'logo-position', value: 'front-lower', effect: 'logo-anchor', targetRoles: ['artwork']}
    ]);
  });

  it('provides at least six catalog specifications for every studio SKU', () => {
    for (const product of products) {
      const request = createStudioGenerateRequest({sku: product.sku});
      expect(Object.keys(request.specifications), product.sku).toHaveLength(6);
      const plan = getStudioSpecificationPlan(product.sku, request.specifications);
      expect(plan, product.sku).toHaveLength(6);
      expect(plan.every((item) => {
        const targetRoles = (item as typeof item & {targetRoles?: string[]}).targetRoles;
        return Array.isArray(targetRoles) && targetRoles.length > 0;
      }), product.sku).toBe(true);
    }
  });

  it('preserves valid selected specifications and rejects invalid values', () => {
    const request = createStudioGenerateRequest({
      sku: 'GT-JAR-050',
      specifications: {
        capacity: '80g',
        material: 'petg',
        color: 'copper',
        finish: 'gloss',
        branding: 'foil',
        'logo-position': 'front-lower'
      }
    });

    expect(request.specifications.capacity).toBe('80g');
    expect(() => createStudioGenerateRequest({
      sku: 'GT-JAR-050',
      specifications: {...request.specifications, capacity: '500g'}
    })).toThrow('规格值不属于当前 SKU');
  });

  it('accepts any valid six-digit package colour while rejecting malformed colour values', () => {
    const request = createStudioGenerateRequest({
      sku: 'GT-MASK-FULL-025',
      specifications: {color: '#7a3ff2'}
    });

    expect(request.specifications.color).toBe('#7a3ff2');
    expect(() => createStudioGenerateRequest({
      sku: 'GT-MASK-FULL-025',
      specifications: {color: '#7a3f'}
    })).toThrow('规格值不属于当前 SKU：color');
  });

  it('resolves both catalog swatches and arbitrary package colours to runtime hex values', () => {
    expect(catalog).toHaveProperty('resolvePackagingConceptColor');
    const resolveProductColor = (catalog as unknown as {
      resolvePackagingConceptColor: (product: (typeof products)[number], selection: string) => string;
    }).resolvePackagingConceptColor;
    const mask = products.find((product) => product.sku === 'GT-MASK-FULL-025');
    expect(mask).toBeDefined();
    if (!mask) return;

    expect(resolveProductColor(mask, 'forest')).toBe('#15362e');
    expect(resolveProductColor(mask, '#7a3ff2')).toBe('#7a3ff2');
  });

  it('rejects an SKU that is not in the catalog', () => {
    expect(() => createStudioGenerateRequest({sku: 'UNKNOWN-SKU'})).toThrow(
      '请选择目录中的 SKU'
    );
  });

  it('keeps the production stages in a stable display order', () => {
    expect(STUDIO_STAGE_ORDER).toEqual([
      'queued',
      'preparing',
      'generating',
      'finalizing',
      'completed',
      'failed'
    ]);
    expect(getStudioStageCopy('generating', 'zh')).toBe('正在生成 3D 预览');
    expect(getStudioStageCopy('finalizing', 'en')).toBe('Refining the details');
  });

  it('requires an explicit production service URL and uses localhost only in development', () => {
    expect(getStudioApiBaseUrl('http://127.0.0.1:8091///')).toBe(
      'http://127.0.0.1:8091'
    );
    expect(getStudioApiBaseUrl(undefined, false)).toBeNull();
    expect(getStudioApiBaseUrl(undefined, true)).toBe('http://127.0.0.1:8091');
  });

  it('uses bounded, on-demand viewer interaction for heavy meshes', () => {
    expect(studio).toHaveProperty('GENERATED_VIEWER_POLICY');
    const policy = (studio as unknown as Record<string, unknown>).GENERATED_VIEWER_POLICY;
    expect(policy).toEqual({
      autoRotate: false,
      frameloop: 'demand',
      minDistance: 2.2,
      maxDistance: 9,
      maxDpr: 1.25,
      shadowFrames: 1,
      viewerHeight: 600
    });
  });
});
