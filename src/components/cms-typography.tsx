import {publishedContent} from '@/lib/published-content';
import {typographyRules} from '@/lib/cms-typography';
export function CmsTypography() {
  const s=publishedContent;
  const css=[typographyRules('home','home',s.home?.textStyles),...s.pageOverrides.map(r=>typographyRules('pages',r.pageId,r.textStyles)),...s.productOverrides.map(r=>typographyRules('products',r.productId,r.textStyles)),...s.formatOverrides.map(r=>typographyRules('formats',r.formatId,r.textStyles)),...s.credentialOverrides.map(r=>typographyRules('credentials',r.credentialId,r.textStyles)),...s.articles.map(r=>typographyRules('articles',r.slug,r.textStyles))].join('\n');
  return css ? <style data-cms-typography>{css}</style> : null;
}
