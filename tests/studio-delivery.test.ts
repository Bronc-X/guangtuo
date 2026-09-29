import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import * as delivery from '../src/lib/studio-delivery';
import {createStudioGenerateRequest} from '../src/lib/sku-3d-studio';

it('restores the complete selected configuration, custom colour and assembly without sharing uploaded artwork', () => {
  expect(delivery).toHaveProperty('encodeStudioShare');
  const state = {sku: 'GT-JAR-050', specifications: {...createStudioGenerateRequest({sku: 'GT-JAR-050'}).specifications, color: '#123456'}, assemblyState: 'open' as const};
  const fragment = delivery.encodeStudioShare(state);
  expect(delivery.decodeStudioShare(fragment)).toEqual(state);
  expect(delivery.decodeStudioShare('cfg=invalid')).toBeNull();
  expect(delivery.decodeStudioShare('x'.repeat(9000))).toBeNull();
  expect(fragment).not.toMatch(/data:|logoDataUrl/);
});

it('accepts raster logo signatures and rejects SVG, forged images and oversized files', () => {
  expect(delivery).toHaveProperty('validateStudioLogoHeader');
  expect(delivery.validateStudioLogoHeader(new Uint8Array([137,80,78,71,13,10,26,10]), 100)).toBe('image/png');
  expect(() => delivery.validateStudioLogoHeader(new TextEncoder().encode('<svg>bad</svg>'), 100)).toThrow();
  expect(() => delivery.validateStudioLogoHeader(new Uint8Array([137,80,78,71,13,10,26,10]), 3_000_000)).toThrow();
});

it('shows one gated design download action in the 3D studio', () => {
  const source = readFileSync('src/components/sku-3d-studio.tsx', 'utf8');
  expect(source).toContain('onChange={uploadLogo}');
  expect(source).toContain("setDownloadIntent('png')");
  expect(source).toContain('<DownloadLeadGate');
  expect(source).toContain("if (intent === 'png') void downloadPng()");
  const actions = source.match(/!aiMode && <section className=\{styles\.deliveryControls\}[\s\S]*?<\/section>/)?.[0];
  expect(actions?.match(/<button\b/g)).toHaveLength(1);
  expect(actions).not.toContain('<a ');
  expect(delivery.studioDeliveryCopy.zh.export).toBe('下载这个方案');
  expect(source).toContain('webglcontextlost');
  expect(source).not.toContain('Environment preset="studio"');
  expect(source).toContain('decodeStudioShare');
  const css = readFileSync('src/components/sku-3d-studio.module.css', 'utf8');
  expect(css).toMatch(/\.deliveryControls\s*\{[^}]*color: var\(--control-paper\)/);
});

it('carries the shared packaging concept and readable settings into the inquiry', () => {
  expect(delivery).toHaveProperty('packagingInquiryFields');
  const share = delivery.encodeStudioShare({sku: 'GT-JAR-050', specifications: createStudioGenerateRequest({sku: 'GT-JAR-050'}).specifications, assemblyState: 'closed'});
  const fields = delivery.packagingInquiryFields(`#request=packaging&${share}`, 'zh');
  expect(fields?.packagingPreference).toContain('GT-JAR-050');
  expect(fields?.configuration).toContain('灌装容量: 30 g');
  expect(delivery.packagingInquiryFields('#cfg=invalid', 'zh')).toBeNull();
});

it('restores a selected size variant and passes its capacity to inquiry', () => {
  const state = {sku: 'HD-847', specifications: createStudioGenerateRequest({sku: 'HD-847'}).specifications, assemblyState: 'closed' as const};
  const fragment = delivery.encodeStudioShare(state);
  expect(delivery.decodeStudioShare(fragment)).toEqual(state);
  const fields = delivery.packagingInquiryFields(`#request=packaging&${fragment}`, 'zh');
  expect(fields?.packagingPreference).toContain('HD-847');
  expect(fields?.configuration).toContain('30 ml × 2');
});

it('preserves editable bottle printing across size links and includes it in the inquiry', () => {
  const printText = {brand: 'AURORA', detail: 'CALMING FOAM\n150 ML'};
  const fragment = delivery.encodeStudioShare({sku: 'HD-1168', specifications: createStudioGenerateRequest({sku: 'HD-1168'}).specifications, assemblyState: 'closed', printText});
  expect(delivery.decodeStudioShare(fragment)?.printText).toEqual(printText);
  const fields = delivery.packagingInquiryFields(`#request=packaging&${fragment}`, 'zh');
  expect(fields?.configuration).toContain('品牌文字: AURORA');
  expect(fields?.configuration).toContain('下方小字: CALMING FOAM / 150 ML');
  expect(fields?.design?.specifications['print-brand']).toBe('AURORA');
  expect(fields?.design?.specifications['print-detail']).toBe(printText.detail);
  expect(() => delivery.encodeStudioShare({sku: 'HD-1168', specifications: createStudioGenerateRequest({sku: 'HD-1168'}).specifications, assemblyState: 'closed', printText: {brand: 'X'.repeat(33), detail: ''}})).toThrow('PRINT_TEXT_INVALID');
});

it('shares independent cap and dispenser finishes without changing the body selection', () => {
  const specifications = {
    ...createStudioGenerateRequest({sku: 'HD-1267'}).specifications,
    'cap-color': '#3b94b2', 'cap-finish': 'gloss',
    'pump-color': '#284a36', 'pump-finish': 'soft-touch'
  };
  const fragment = delivery.encodeStudioShare({sku: 'HD-1267', specifications, assemblyState: 'closed'});
  expect(delivery.decodeStudioShare(fragment)?.specifications).toEqual(specifications);
  const fields = delivery.packagingInquiryFields(`#request=packaging&${fragment}`, 'zh');
  expect(fields?.design?.specifications['cap-color']).toBe('#3b94b2');
  expect(fields?.design?.specifications['pump-finish']).toBe('soft-touch');
  expect(fields?.configuration).toContain('盖子颜色: #3b94b2');
  expect(fields?.configuration).toContain('喷头表面效果: 柔触');
  expect(() => delivery.encodeStudioShare({sku: 'HD-1267', specifications: {...specifications, 'cap-color': 'javascript:alert(1)'}, assemblyState: 'closed'})).toThrow('PART_STYLE_INVALID');
});

it('restores only a recent job from the same configured generation service', () => {
  expect(delivery).toHaveProperty('decodeStudioWork');
  const raw = JSON.stringify({version: 1, apiBase: '/studio-api', savedAt: 1000, jobId: '8f0dc3b059964183a2fe5d6f294006fe'});
  expect(delivery.decodeStudioWork(raw, '/studio-api', 1500)).toMatchObject({jobId: '8f0dc3b059964183a2fe5d6f294006fe'});
  expect(delivery.decodeStudioWork(raw, 'https://other.example', 1500)).toBeNull();
  expect(delivery.decodeStudioWork(raw, '/studio-api', 1000 + 86400001)).toBeNull();
  expect(delivery.decodeStudioWork('{"jobId":"../../private"}', '/studio-api', 1500)).toBeNull();
});

it('fails closed when WebGL2 is unavailable or context creation throws', () => {
  expect(delivery).toHaveProperty('supportsStudioWebGl');
  expect(delivery.supportsStudioWebGl(() => null)).toBe(false);
  expect(delivery.supportsStudioWebGl(() => { throw new Error('Disabled by browser'); })).toBe(false);
  expect(delivery.supportsStudioWebGl(() => ({getExtension: () => null}) as unknown as WebGL2RenderingContext)).toBe(true);
});
