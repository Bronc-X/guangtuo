import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

describe('published article navigation', () => {
  it('exposes the public article index from the footer', () => {
    const footer = readFileSync(join(root, 'src/components/footer.tsx'), 'utf8');

    expect(footer).toContain("path: 'insights'");
    expect(footer).toContain("insights: '文章与知识'");
  });

  it('includes the article index and published article detail pages in the sitemap', () => {
    const sitemap = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8');

    expect(sitemap).toContain("'insights'");
    expect(sitemap).toContain('listPublishedArticles');
    expect(sitemap).toContain('article.slug');
  });
});
