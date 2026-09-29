import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

describe('Alibaba Cloud release configuration', () => {
  it('builds initial and CMS-published releases with the production site origin', () => {
    const packageScript = readFileSync('scripts/package-delivery.ts', 'utf8');
    const runtimeEnvironment = readFileSync('deploy/aliyun/runtime.env.example', 'utf8');

    expect(packageScript).toContain("process.env.NEXT_PUBLIC_SITE_URL = 'https://showkibiotech.com'");
    expect(runtimeEnvironment).toContain('NEXT_PUBLIC_SITE_URL=https://showkibiotech.com');
  });
});
