import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('experimental packaging studio isolation', () => {
  it('uses a dedicated legacy packaging catalog instead of finished-product SKUs', () => {
    const studioPage = source('src/app/[locale]/studio/page.tsx');
    const studioComponent = source('src/components/sku-3d-studio.tsx');
    const studioLogic = source('src/lib/sku-3d-studio.ts');

    expect(studioPage).toContain('legacyPackagingProducts');
    expect(studioComponent).toContain('PackagingConcept');
    expect(studioLogic).toContain('PackagingConcept');
    expect(studioPage).not.toMatch(/import\s+\{products\}\s+from\s+'@\/data\/catalog'/);
  });

  it('restores the studio in the customer journey while keeping it out of search indexing', () => {
    expect(source('src/components/header.tsx')).toMatch(/localizedPath\(locale, ['"]studio['"]\)/);
    expect(source('src/app/[locale]/page.tsx')).toContain('<Sku3dStudio');
    expect(source('src/app/[locale]/page.tsx')).toContain('embedded');
    expect(source('src/app/sitemap.ts')).not.toContain("'studio'");
  });
});
