'use client';

import {useEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, SRGBColorSpace} from 'three';
import type {PackagingConcept, PackagingPrintText} from '@/data/legacy-packaging-catalog';

type EditablePrint = NonNullable<PackagingConcept['editablePrint']>;

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  return value.split(/\r?\n/).flatMap((paragraph) => {
    if (!paragraph) return [''];
    const lines: string[] = [];
    let line = '';
    for (const character of paragraph) {
      if (line && context.measureText(line + character).width > maxWidth) {
        lines.push(line.trim());
        line = character.trimStart();
      } else line += character;
    }
    lines.push(line.trim());
    return lines;
  });
}

function makePrintTexture(value: string, kind: 'brand' | 'detail'): CanvasTexture | null {
  if (typeof document === 'undefined' || !value.trim()) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = kind === 'brand' ? 256 : 384;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.direction = /[\u0590-\u08ff]/.test(value) ? 'rtl' : 'ltr';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f8f5f0';
  const family = kind === 'brand' ? 'Georgia, "Noto Serif CJK SC", serif' : 'Arial, "Noto Sans SC", sans-serif';
  let fontSize = kind === 'brand' ? 142 : 96;
  let lines: string[] = [];
  for (; fontSize >= 22; fontSize -= 2) {
    context.font = `600 ${fontSize}px ${family}`;
    lines = kind === 'brand' ? [value.replace(/\s+/g, ' ').trim()] : wrapText(context, value, 900);
    if (lines.length <= (kind === 'brand' ? 1 : 3) && lines.every((line) => context.measureText(line).width <= 900)) break;
  }
  const lineHeight = fontSize * 1.25;
  const startY = (canvas.height - lineHeight * (lines.length - 1)) / 2;
  lines.forEach((line, index) => context.fillText(line, canvas.width / 2, startY + index * lineHeight, 900));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeCurvedPrintGeometry(radius: number, width: number, height: number, centerY: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const segments = 40;
  for (let segment = 0; segment <= segments; segment += 1) {
    const u = segment / segments;
    const x = (u - .5) * width;
    const z = Math.sqrt(radius * radius - x * x) + .025;
    positions.push(x, centerY - height / 2, z, x, centerY + height / 2, z);
    uv.push(u, 0, u, 1);
    if (segment < segments) {
      const index = segment * 2;
      indices.push(index, index + 2, index + 3, index, index + 3, index + 1);
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function CurvedPrint({text, kind, radius, centerY}: {text: string; kind: 'brand' | 'detail'; radius: number; centerY: number}) {
  const invalidate = useThree((state) => state.invalidate);
  const width = Math.min(kind === 'brand' ? 1.03 : .99, radius * 1.62);
  const height = kind === 'brand' ? .25 : .27;
  const geometry = useMemo(() => makeCurvedPrintGeometry(radius, width, height, centerY), [centerY, height, radius, width]);
  const texture = useMemo(() => makePrintTexture(text, kind), [kind, text]);
  useEffect(() => {
    invalidate();
    return () => { geometry.dispose(); texture?.dispose(); };
  }, [geometry, invalidate, texture]);
  if (!texture) return null;
  return <mesh geometry={geometry} renderOrder={2}>
    <meshBasicMaterial map={texture} transparent alphaTest={.03} depthWrite={false} toneMapped={false} side={DoubleSide} />
  </mesh>;
}

export function PackagingPrintArtwork({layout, text, logoReplacesBrand}: {layout: EditablePrint; text: PackagingPrintText; logoReplacesBrand: boolean}) {
  return <>
    {!logoReplacesBrand && <CurvedPrint text={text.brand} kind="brand" radius={layout.bodyRadius} centerY={layout.brandY} />}
    <CurvedPrint text={text.detail} kind="detail" radius={layout.bodyRadius} centerY={layout.detailY} />
  </>;
}
