import {z} from 'zod';

export const fontFields = ['heroTitle','heroBody','title','summary','body','category','name','description','highlights','applications','netWeight','packFormat','effects','specification','moq','packaging','kind','number','rightsholder','profileTitle','profileBody','videoSourceLabel'] as const;
export const textStylesSchema = z.partialRecord(z.enum(fontFields), z.number().int().min(12).max(96));
export type TextStyles = z.infer<typeof textStylesSchema>;
export type FontField = typeof fontFields[number];
export function fontStyle(styles: TextStyles | undefined, field: string) {const size = styles?.[field as FontField]; return size ? {fontSize: `${size}px`, lineHeight: 1.4} : undefined;}
export function setFontSize(styles: TextStyles | undefined, field: string, size?: number): TextStyles {const next = {...styles}; if(size === undefined) delete next[field as FontField]; else next[field as FontField] = size; return next;}

const selectors: Record<string, Partial<Record<FontField, string>>> = {
  home:{heroTitle:'.hero h1',heroBody:'.hero__lead'},
  pages:{heroTitle:'.page-hero h1',heroBody:'.page-hero__aside > p',profileTitle:'.showki-profile > h2',profileBody:'.showki-profile > p:not(.eyebrow)',videoSourceLabel:'.video-source a'},
  products:{name:'.page-hero h1, .product-card__meta h3, .product-detail__summary > h2',description:'.page-hero__aside > p',highlights:'.check-grid h3',applications:'.stage-rail h3',netWeight:'[data-cms-field="net-weight"]',packFormat:'[data-cms-field="pack-format"]'},
  formats:{name:'h3',effects:'[data-cms-field="effects"]',specification:'[data-cms-field="specification"]',moq:'[data-cms-field="moq"]',packaging:'[data-cms-field="packaging"]'},
  credentials:{title:'h2',kind:'[data-cms-field="kind"]',number:'[data-cms-field="number"]',rightsholder:'[data-cms-field="rightsholder"]'},
  articles:{title:'.page-hero h1, [data-cms-field="title"]',summary:'.page-hero__aside > p, [data-cms-field="summary"]',body:'.cms-text',category:'.page-hero .eyebrow'}
};
export function typographyRules(kind: string, id: string, styles?: TextStyles) {
  if(!styles || !/^[a-zA-Z0-9_-]+$/.test(id)) return '';
  const parsed = textStylesSchema.parse(styles); const scope = `[data-cms="${kind === 'home' ? 'home' : `${kind}:${id}`}" ]`;
  return Object.entries(parsed).map(([field,size]) => {const target = selectors[kind]?.[field as FontField]; return target ? `${target.split(',').map(s=>`${scope} ${s.trim()}`).join(',')} {font-size:${size}px;line-height:1.4;}` : '';}).join('\n');
}
