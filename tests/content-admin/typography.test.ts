import {describe, expect, it} from 'vitest';
import {fontStyle, setFontSize, textStylesSchema, typographyRules} from '../../src/lib/cms-typography';
import {localizeContent} from '../../src/lib/published-content';
import {publishedContentSchema} from '../../src/lib/published-content-schema';

describe('CMS typography', () => {
  it('rejects invalid CSS inputs and isolates each record', () => {
    for(const styles of [{heroTitle:11},{body:97},{body:18.5},{body:'18; color:red'},{unknown:24}]) expect(textStylesSchema.safeParse(styles).success).toBe(false);
    expect(typographyRules('home','home',{heroTitle:32})).toContain('font-size:32px');
    expect(typographyRules('products','GT-001',{name:24})).toContain('products:GT-001');
    expect(typographyRules('products','"><script>',{name:24})).toBe('');
    expect(setFontSize({heroTitle:32,heroBody:18},'heroTitle')).toEqual({heroBody:18});
    expect(fontStyle({},'heroTitle')).toBeUndefined();
  });
  it('uses the same sizes in all six locales while translating only text', () => {
    const text='第一行\n\n第二行';
    const home={heroTitle:text,heroBody:text,heroImage:'/assets/test.png',textStyles:{heroTitle:32,heroBody:18}};
    const snapshot=publishedContentSchema.parse({schemaVersion:1,releaseId:'font-test',publishedAt:new Date().toISOString(),home,articles:[],translations:Object.fromEntries(['en','fr','es','ru','ar'].map(locale=>[locale,{[text]:`${locale} first\n\nsecond`}]))});
    for(const locale of ['zh','en','fr','es','ru','ar']) {
      const result=localizeContent(home,locale,snapshot);
      expect(result.textStyles).toEqual(home.textStyles);
      expect(result.heroTitle).toContain('\n\n');
    }
  });
});
