import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';

it('keeps the existing typography without a network-dependent font download during content publishing', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  expect(layout.includes('next/font/google')).toBe(false);
  for (const family of ['manrope', 'noto-sans-sc', 'cormorant-garamond']) expect(layout).toContain(`@fontsource-variable/${family}`);
  const css = readFileSync('src/app/globals.css', 'utf8');
  expect(css).toContain("--font-sans-latin: 'Manrope Variable'");
  expect(css).toContain("--font-sans-cjk: 'Noto Sans SC Variable'");
  expect(css).toContain("--font-display-latin: 'Cormorant Garamond Variable'");
});
