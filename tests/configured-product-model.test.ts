import {describe, expect, it} from 'vitest';
import {BoxGeometry, Group, Mesh, MeshPhysicalMaterial} from 'three';

import * as configurator from '@/components/bottle-configurator';

describe('configured product model', () => {
  it('uses a restrained review-lighting policy that preserves pale and translucent detail', () => {
    expect(configurator).toHaveProperty('CONFIGURED_MODEL_VIEWER_POLICY');
    expect((configurator as unknown as {CONFIGURED_MODEL_VIEWER_POLICY: unknown}).CONFIGURED_MODEL_VIEWER_POLICY).toEqual({
      toneMapping: 'aces-filmic',
      exposure: 0.9,
      ambientIntensity: 0.58,
      keyIntensity: 2.4,
      fillIntensity: 0.72,
      maxDpr: 1.5,
      cameraPosition: [1.4, 2.3, 6.4]
    });
  });

  it('exposes the configured GLB model for reuse in the studio workflow', () => {
    expect(configurator).toHaveProperty('ConfiguredProductModel');
  });

  it('turns foil selection into a metallic logo layer', () => {
    expect(configurator).toHaveProperty('getLogoMaterialPreset');
    const getLogoMaterialPreset = (configurator as unknown as {
      getLogoMaterialPreset: (branding: string) => Record<string, number | string>;
    }).getLogoMaterialPreset;

    expect(getLogoMaterialPreset('foil')).toEqual({
      color: '#c27646',
      metalness: 0.82,
      roughness: 0.2
    });
    expect(getLogoMaterialPreset('screen')).toEqual({
      color: '#26302c',
      metalness: 0,
      roughness: 0.58
    });
  });

  it('produces visibly distinct runtime PBR profiles for jar and sachet materials', () => {
    expect(configurator).toHaveProperty('getRuntimeMaterialProfile');
    const getRuntimeMaterialProfile = (configurator as unknown as {
      getRuntimeMaterialProfile: (input: {shape: string; role: string; material: string; finish: string; packMaterial?: string}) => Record<string, number>;
    }).getRuntimeMaterialProfile;

    expect(getRuntimeMaterialProfile({shape: 'jar', role: 'body', material: 'glass', finish: 'satin'})).toMatchObject({transmission: 0.58, ior: 1.5, metalness: 0});
    expect(getRuntimeMaterialProfile({shape: 'jar', role: 'body', material: 'pp', finish: 'satin'})).toMatchObject({transmission: 0, metalness: 0.025});
    expect(getRuntimeMaterialProfile({shape: 'full-mask', role: 'pack', material: 'cotton', packMaterial: 'pet-al-pe', finish: 'gloss'})).toMatchObject({metalness: 0.28, roughness: 0.16});
    expect(getRuntimeMaterialProfile({shape: 'full-mask', role: 'pack', material: 'cotton', packMaterial: 'paper-look', finish: 'gloss'})).toMatchObject({metalness: 0, roughness: 0.88});
  });

  it('uses a restrained jade tint for hydrogel instead of flat white', () => {
    expect(configurator).toHaveProperty('getRuntimeSheetColor');
    const getRuntimeSheetColor = (configurator as unknown as {
      getRuntimeSheetColor: (shape: string, material: string) => string;
    }).getRuntimeSheetColor;

    expect(getRuntimeSheetColor('split-mask', 'thin')).toBe('#d4ebe2');
    expect(getRuntimeSheetColor('full-mask', 'cotton')).toBe('#ded8cc');
  });

  it('repaints a configured model and invalidates an on-demand canvas', () => {
    expect(configurator).toHaveProperty('applyRuntimeModelConfiguration');
    const applyRuntimeModelConfiguration = (configurator as unknown as {
      applyRuntimeModelConfiguration: (model: Group, shape: 'split-mask', selections: Record<string, string>, color: string, finish: string, invalidate: () => void) => void;
    }).applyRuntimeModelConfiguration;
    const material = new MeshPhysicalMaterial({color: '#ffffff'});
    const pack = new Mesh(new BoxGeometry(1, 1, 1), material);
    pack.userData.role = 'pack';
    const model = new Group();
    model.add(pack);
    let invalidations = 0;

    applyRuntimeModelConfiguration(model, 'split-mask', {material: 'thin', 'pack-material': 'pet-al-pe'}, '#15362e', 'satin', () => { invalidations += 1; });

    expect(material.color.getHexString()).toBe('15362e');
    expect(invalidations).toBe(1);
  });

  it('converts dark artwork into a clean monochrome process mask', () => {
    expect(configurator).toHaveProperty('buildMonochromeLogoMask');
    const buildMonochromeLogoMask = (configurator as unknown as {
      buildMonochromeLogoMask: (pixels: Uint8ClampedArray) => Uint8ClampedArray;
    }).buildMonochromeLogoMask;
    const mask = buildMonochromeLogoMask(new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
      0, 0, 0, 0
    ]));

    expect([...mask]).toEqual([
      255, 255, 255, 255,
      0, 0, 0, 255,
      0, 0, 0, 255
    ]);
  });

  it('hides the built-in branding placeholder when real artwork is present', () => {
    expect(configurator).toHaveProperty('shouldHideEmbeddedBranding');
    const shouldHideEmbeddedBranding = (configurator as unknown as {
      shouldHideEmbeddedBranding: (role: string, hasArtwork: boolean) => boolean;
    }).shouldHideEmbeddedBranding;

    expect(shouldHideEmbeddedBranding('label', true)).toBe(true);
    expect(shouldHideEmbeddedBranding('label', false)).toBe(false);
    expect(shouldHideEmbeddedBranding('body', true)).toBe(false);
  });

  it('moves independent cap, dropper and lid assemblies between closed and open states', () => {
    expect(configurator).toHaveProperty('applyRuntimeAssemblyState');
    const applyRuntimeAssemblyState = (configurator as unknown as {
      applyRuntimeAssemblyState: (model: Group, shape: 'airless' | 'bottle' | 'jar', state: 'closed' | 'open', invalidate: () => void) => boolean;
    }).applyRuntimeAssemblyState;
    const cases = [
      {shape: 'airless' as const, nodeName: 'Airless_Cap_Assembly'},
      {shape: 'bottle' as const, nodeName: 'Dropper_Pipette_Assembly'},
      {shape: 'jar' as const, nodeName: 'Jar_Lid_Assembly'}
    ];

    for (const item of cases) {
      const model = new Group();
      const assembly = new Group();
      assembly.name = item.nodeName;
      assembly.position.set(0.1, 0.2, 0.3);
      model.add(assembly);
      let invalidations = 0;

      expect(applyRuntimeAssemblyState(model, item.shape, 'open', () => { invalidations += 1; })).toBe(true);
      expect(assembly.position.toArray()).not.toEqual([0.1, 0.2, 0.3]);
      expect(applyRuntimeAssemblyState(model, item.shape, 'closed', () => { invalidations += 1; })).toBe(true);
      expect(assembly.position.toArray()).toEqual([0.1, 0.2, 0.3]);
      expect(invalidations).toBe(2);
    }
  });

  it('describes the three assembly interactions with product-specific labels', () => {
    expect(configurator).toHaveProperty('getAssemblyInteraction');
    const getAssemblyInteraction = (configurator as unknown as {
      getAssemblyInteraction: (shape: string) => {nodeName: string; closed: {zh: string}; open: {zh: string}} | null;
    }).getAssemblyInteraction;

    expect(getAssemblyInteraction('airless')).toMatchObject({nodeName: 'Airless_Cap_Assembly', open: {zh: '取下瓶盖'}});
    expect(getAssemblyInteraction('bottle')).toMatchObject({nodeName: 'Dropper_Pipette_Assembly', open: {zh: '取出滴管'}});
    expect(getAssemblyInteraction('jar')).toMatchObject({nodeName: 'Jar_Lid_Assembly', open: {zh: '打开罐盖'}, openPosition: [0.72, 0.42, -0.95]});
    expect(getAssemblyInteraction('full-mask')).toBeNull();
  });
});
