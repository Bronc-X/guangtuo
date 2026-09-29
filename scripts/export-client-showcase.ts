import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {extname, join} from 'node:path';

import {
  legacyCategories as categories,
  products as allProducts,
  type LocalizedText,
  type Product,
  type LegacyProductCategory as ProductCategory
} from '@/data/catalog';
const products = allProducts.filter((product) => !product.sourcePage);
import {
  hydrogelCapabilityFacts,
  hydrogelFormats,
  hydrogelMaterialFamilies,
  hydrogelPatentProofs,
  hydrogelProcessSteps,
  localizeHydrogelMeasure
} from '@/data/hydrogel-formats';

type ImagePreset = 'hero' | 'product' | 'format' | 'proof' | 'factory' | 'texture' | 'logo';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const outputDir = join(rootDir, 'deliverables');
const outputPath = join(outputDir, '广拓生物-水凝膜产品中心.html');

const categoryMeta: Record<ProductCategory, {name: string; summary: string; image: string}> = {
  'face-masks': {
    name: '面膜',
    summary: '从胶原弹润、积雪草舒缓到微孔冷感、白变透明与高分子凝胶，兼顾日常补水和差异化新品。',
    image: '/assets/hydrogel/face-mask-reference.png'
  },
  'eye-masks': {
    name: '眼膜',
    summary: '瓶装、独立装与吸塑装均可选择，覆盖双色、微孔、冷敷、复合凝胶等多种产品形态。',
    image: '/assets/hydrogel/eye-mask-hero.jpg'
  },
  'specialty-patches': {
    name: '其他局部膜贴',
    summary: '唇膜、颈膜、额头贴、法令纹贴、轮廓提拉贴与双耳挂下颌膜，让细分护理更容易形成产品记忆点。',
    image: '/assets/hydrogel/neck-mask-reference.png'
  }
};

const imagePresets: Record<ImagePreset, {width: number; height: number; quality: number}> = {
  hero: {width: 1500, height: 1200, quality: 82},
  product: {width: 820, height: 820, quality: 80},
  format: {width: 620, height: 620, quality: 82},
  proof: {width: 1050, height: 1500, quality: 80},
  factory: {width: 1280, height: 960, quality: 78},
  texture: {width: 1000, height: 760, quality: 78},
  logo: {width: 400, height: 400, quality: 90}
};

const pythonImageOptimizer = String.raw`
import io
import sys
from PIL import Image, ImageOps

max_width = int(sys.argv[1])
max_height = int(sys.argv[2])
quality = int(sys.argv[3])
raw = sys.stdin.buffer.read()
image = Image.open(io.BytesIO(raw))
image = ImageOps.exif_transpose(image)
has_alpha = image.mode in ('RGBA', 'LA') or 'transparency' in image.info
image = image.convert('RGBA' if has_alpha else 'RGB')
image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
image.save(sys.stdout.buffer, format='WEBP', quality=quality, method=6)
`;

const imageCache = new Map<string, string>();
let optimizedImageCount = 0;
let rawImageCount = 0;

function cleanCopy(value: string): string {
  return value
    .replace(/[—–]/g, '，')
    .replace(/\s*·\s*/g, '、')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return cleanCopy(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function zh(value: LocalizedText): string {
  return escapeHtml(value.zh);
}

function mimeFromPath(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return 'image/png';
}

function assetFilePath(assetPath: string): string {
  return join(publicDir, ...assetPath.replace(/^\//, '').split('/'));
}

function assetDataUri(assetPath: string, presetName: ImagePreset): string {
  const cacheKey = `${assetPath}:${presetName}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;

  const filePath = assetFilePath(assetPath);
  if (!existsSync(filePath)) throw new Error(`Missing client-showcase asset: ${assetPath}`);

  const source = readFileSync(filePath);
  const sourceMime = mimeFromPath(filePath);
  if (sourceMime === 'image/svg+xml') {
    const uri = `data:${sourceMime};base64,${source.toString('base64')}`;
    imageCache.set(cacheKey, uri);
    rawImageCount += 1;
    return uri;
  }

  const python = process.env.CLIENT_EXPORT_PYTHON ?? 'python';
  const preset = imagePresets[presetName];
  const optimized = spawnSync(
    python,
    ['-c', pythonImageOptimizer, String(preset.width), String(preset.height), String(preset.quality)],
    {input: source, maxBuffer: 32 * 1024 * 1024}
  );

  if (optimized.status === 0 && optimized.stdout.length > 0) {
    const uri = `data:image/webp;base64,${optimized.stdout.toString('base64')}`;
    imageCache.set(cacheKey, uri);
    optimizedImageCount += 1;
    return uri;
  }

  const uri = `data:${sourceMime};base64,${source.toString('base64')}`;
  imageCache.set(cacheKey, uri);
  rawImageCount += 1;
  return uri;
}

function formatMoq(product: Product): string {
  if (!product.commercialTerms.moq) return '待确认';
  const {quantity, unit} = product.commercialTerms.moq;
  return `${quantity.toLocaleString('zh-CN')} ${unit === 'bottles' ? '瓶' : '片'}`;
}

function productCard(product: Product): string {
  const name = zh(product.name);
  const category = categoryMeta[product.category as ProductCategory].name;
  const imagePath = product.media?.image ?? categoryMeta[product.category as ProductCategory].image;
  const image = assetDataUri(imagePath, 'product');
  const highlights = product.highlights.map((item) => zh(item)).join('；');
  const applications = product.applications.map((item) => zh(item)).join('；');
  const specifications = product.specifications
    .map((item) => `<div><dt>${zh(item.label)}</dt><dd>${zh(item.value)}</dd></div>`)
    .join('');

  return `
    <article class="product-card" data-product-card data-category="${product.category}">
      <button class="image-button zoomable" type="button" aria-label="放大查看${name}">
        <img src="${image}" alt="${name}" loading="lazy" decoding="async">
      </button>
      <div class="product-card__body">
        <p class="product-category">${category}</p>
        <h3>${name}</h3>
        <p class="product-description">${zh(product.description)}</p>
        <div class="product-selling-points">
          <p><strong>产品亮点</strong>${highlights}</p>
          <p><strong>适用方向</strong>${applications}</p>
        </div>
        <details class="product-details">
          <summary>规格与合作信息</summary>
          <dl>
            ${specifications}
            <div><dt>参考起订量</dt><dd>${formatMoq(product)}</dd></div>
            <div><dt>模具</dt><dd>${product.commercialTerms.mold ? zh(product.commercialTerms.mold.label) : '待确认'}</dd></div>
            <div><dt>产品编号</dt><dd>${escapeHtml(product.productId)}</dd></div>
          </dl>
        </details>
      </div>
    </article>`;
}

const familyById = new Map(hydrogelMaterialFamilies.map((family) => [family.id, family]));

function formatCard(format: (typeof hydrogelFormats)[number]): string {
  const name = zh(format.name);
  const family = familyById.get(format.family);
  if (!family) throw new Error(`Missing material family for ${format.id}`);
  const image = assetDataUri(format.image, 'format');

  return `
    <article class="format-card" data-format-card data-category="${format.category}" data-family="${format.family}">
      <button class="image-button zoomable" type="button" aria-label="放大查看${name}">
        <img src="${image}" alt="${name}" loading="lazy" decoding="async">
      </button>
      <div class="format-card__body">
        <div class="format-card__meta"><span>${escapeHtml(format.id)}</span><span>${zh(family.name)}</span></div>
        <h3>${name}</h3>
        <p>${zh(format.effects)}</p>
        <dl>
          <div><dt>规格</dt><dd>${escapeHtml(localizeHydrogelMeasure(format.specification, 'zh'))}</dd></div>
          <div><dt>参考起订量</dt><dd>${escapeHtml(localizeHydrogelMeasure(format.moq, 'zh'))}</dd></div>
          <div><dt>包装建议</dt><dd>${zh(format.packaging)}</dd></div>
        </dl>
      </div>
    </article>`;
}

function categoryPanel(category: ProductCategory, modifier: string): string {
  const meta = categoryMeta[category];
  const productCount = products.filter((product) => product.category === category).length;
  const formatCount = hydrogelFormats.filter((format) => format.category === category).length;
  const image = assetDataUri(meta.image, category === 'eye-masks' ? 'hero' : 'format');

  return `
    <article class="category-panel category-panel--${modifier}">
      <button class="image-button zoomable" type="button" aria-label="放大查看${meta.name}形态参考">
        <img src="${image}" alt="${meta.name}形态参考" loading="lazy" decoding="async">
      </button>
      <div>
        <h3>${meta.name}</h3>
        <p>${meta.summary}</p>
        <span>${productCount} 款现有成品，${formatCount} 种膜型参考</span>
      </div>
    </article>`;
}

function materialRow(family: (typeof hydrogelMaterialFamilies)[number]): string {
  const count = hydrogelFormats.filter((format) => format.family === family.id).length;
  return `
    <article class="material-row">
      <div><h3>${zh(family.name)}</h3><span>${count} 种现有膜型</span></div>
      <p>${zh(family.description)}</p>
    </article>`;
}

function processGroup(title: string, start: number, end: number): string {
  return `
    <article class="process-group">
      <h3>${title}</h3>
      <ol>${hydrogelProcessSteps.slice(start, end).map((step) => `<li>${zh(step)}</li>`).join('')}</ol>
    </article>`;
}

function patentCard(proof: (typeof hydrogelPatentProofs)[number]): string {
  const image = assetDataUri(proof.image, 'proof');
  return `
    <article class="patent-card">
      <button class="image-button zoomable" type="button" aria-label="放大查看${zh(proof.title)}证书">
        <img src="${image}" alt="${zh(proof.title)}证书原图" loading="lazy" decoding="async">
      </button>
      <div>
        <span>${escapeHtml(proof.patentNo)}</span>
        <h3>${zh(proof.title)}</h3>
        <p>${zh(proof.relevance)}</p>
      </div>
    </article>`;
}

if (products.length !== 21) throw new Error(`Expected 21 products, received ${products.length}`);
if (hydrogelFormats.length !== 41) throw new Error(`Expected 41 formats, received ${hydrogelFormats.length}`);
if (hydrogelMaterialFamilies.length !== 5) throw new Error(`Expected 5 material families, received ${hydrogelMaterialFamilies.length}`);

const heroImage = assetDataUri('/assets/hydrogel/eye-mask-hero.jpg', 'hero');
const gelTexture = assetDataUri('/assets/hydrogel/gel-texture.png', 'texture');
const logo = assetDataUri('/assets/brand/guangtuo-monogram-minimal.svg', 'logo');
const factoryProduction = assetDataUri('/assets/factory/production-line.png', 'factory');
const factoryQuality = assetDataUri('/assets/factory/quality-inspection.png', 'factory');
const factoryAssembly = assetDataUri('/assets/factory/final-assembly.png', 'factory');
const hydrogelDaily = hydrogelCapabilityFacts.find((fact) => fact.id === 'daily-hydrogel');
const skincareDaily = hydrogelCapabilityFacts.find((fact) => fact.id === 'daily-skincare');
const documentDate = new Intl.DateTimeFormat('zh-CN', {year: 'numeric', month: 'long'}).format(new Date());

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="广拓生物水凝膜客户产品册，包含面膜、眼膜、局部膜贴、膜型、材质、工艺与专利资料。">
  <title>广拓生物｜水凝膜产品中心</title>
  <style>
    :root {
      --paper: #f4f7f7;
      --surface: #fbfcfc;
      --surface-soft: #e9eff0;
      --ink: #14272b;
      --ink-soft: #30454a;
      --muted: #627478;
      --line: rgba(20, 39, 43, .13);
      --line-strong: rgba(20, 39, 43, .24);
      --accent: #b94179;
      --accent-deep: #91305f;
      --accent-soft: #f6e6ef;
      --on-accent: #fffafd;
      --radius: 16px;
      --shadow: 0 18px 54px rgba(41, 73, 79, .12);
      --page: min(1240px, calc(100vw - 48px));
      --font: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; background: var(--paper); }
    body { margin: 0; color: var(--ink); background: var(--paper); font-family: var(--font); -webkit-font-smoothing: antialiased; }
    body::before { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 20; opacity: .14; background-image: radial-gradient(rgba(20, 39, 43, .2) .45px, transparent .45px); background-size: 5px 5px; }
    a { color: inherit; text-decoration: none; }
    button { color: inherit; font: inherit; }
    img { display: block; width: 100%; }
    h1, h2, h3, p, dl, dd, figure { margin: 0; }
    [hidden] { display: none !important; }
    :focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
    ::selection { color: var(--on-accent); background: var(--accent); }
    section[id], .contact-panel[id] { scroll-margin-top: 100px; }

    .site-header { width: var(--page); min-height: 72px; margin: 12px auto 0; padding: 10px 12px 10px 16px; position: sticky; top: 10px; z-index: 10; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 22px; border: 1px solid rgba(20, 39, 43, .12); border-radius: var(--radius); background: rgba(251, 252, 252, .91); box-shadow: 0 10px 30px rgba(41, 73, 79, .09); backdrop-filter: blur(18px) saturate(1.12); }
    .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
    .brand img { width: 34px; height: 34px; object-fit: contain; }
    .brand strong { display: block; font-size: .9rem; letter-spacing: .08em; }
    .brand small { display: block; margin-top: 3px; color: var(--muted); font-size: .58rem; letter-spacing: .12em; }
    .site-nav { display: flex; justify-content: flex-end; align-items: center; gap: 3px; white-space: nowrap; }
    .site-nav a { padding: 10px 11px; border-radius: var(--radius); color: var(--ink-soft); font-size: .76rem; font-weight: 650; transition: color .18s ease, background .18s ease; }
    .site-nav a:hover { color: var(--ink); background: var(--surface-soft); }
    .header-action, .button { min-height: 44px; padding: 0 18px; border: 1px solid transparent; border-radius: var(--radius); display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: .78rem; font-weight: 750; cursor: pointer; transition: transform .18s ease, background .18s ease, border-color .18s ease, color .18s ease; }
    .header-action, .button--primary { color: var(--on-accent); background: var(--accent); box-shadow: 0 10px 24px rgba(185, 65, 121, .18); }
    .header-action:hover, .button--primary:hover { background: var(--accent-deep); transform: translateY(-1px); }
    .button--secondary { color: var(--ink); border-color: var(--line-strong); background: var(--surface); }
    .button--secondary:hover { border-color: var(--ink-soft); background: var(--surface-soft); transform: translateY(-1px); }
    .button:active, .header-action:active, .filter-button:active, .image-button:active { transform: translateY(1px); }

    .hero { width: var(--page); min-height: calc(100dvh - 108px); margin: 16px auto 0; padding: clamp(34px, 5vw, 72px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr); align-items: center; gap: clamp(36px, 6vw, 84px); overflow: hidden; position: relative; border-radius: var(--radius); background: linear-gradient(128deg, #fff1be 0%, #f1bddc 52%, #d9c2ee 100%); box-shadow: inset 0 0 0 1px rgba(20, 39, 43, .06); }
    .hero::before { content: ""; position: absolute; width: 54%; aspect-ratio: 1; right: -20%; bottom: -42%; border-radius: 50%; background: rgba(251, 252, 252, .45); filter: blur(8px); }
    .hero__copy, .hero__visual { position: relative; z-index: 1; }
    .eyebrow { margin-bottom: 18px; color: var(--accent-deep); font-size: .7rem; font-weight: 800; letter-spacing: .12em; }
    .hero h1 { max-width: 680px; font-size: clamp(2.7rem, 3.6vw, 3.85rem); line-height: 1.03; letter-spacing: -.055em; text-wrap: balance; }
    .hero__copy > p:not(.eyebrow) { max-width: 34rem; margin-top: 24px; color: var(--ink-soft); font-size: clamp(.98rem, 1.35vw, 1.12rem); line-height: 1.8; }
    .hero__actions { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px; }
    .hero__visual { min-height: 560px; }
    .hero__visual-main { width: 88%; height: 86%; margin-left: auto; position: absolute; right: 0; bottom: 0; overflow: hidden; border: 1px solid rgba(251, 252, 252, .74); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }
    .hero__visual-main img { height: 100%; object-fit: cover; object-position: 50% 38%; }
    .hero__visual-texture { width: 48%; aspect-ratio: 1; position: absolute; left: 0; top: 0; overflow: hidden; border: 1px solid rgba(251, 252, 252, .78); border-radius: var(--radius); box-shadow: 0 20px 44px rgba(41, 73, 79, .14); }
    .hero__visual-texture img { height: 100%; object-fit: cover; }

    .section { width: var(--page); margin: 0 auto; padding: clamp(80px, 10vw, 140px) 0; }
    .section--tight { padding-top: 0; }
    .section-heading { max-width: 780px; margin-bottom: 44px; }
    .section-heading h2 { font-size: clamp(2.1rem, 4.2vw, 4.4rem); line-height: 1.02; letter-spacing: -.055em; text-wrap: balance; }
    .section-heading > p:not(.eyebrow) { max-width: 630px; margin-top: 18px; color: var(--muted); font-size: 1rem; line-height: 1.8; }

    .fact-rail { width: var(--page); margin: 18px auto 0; padding: 26px 0; display: grid; grid-template-columns: 1.1fr 1fr 1fr 1fr; border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); }
    .fact { min-height: 116px; padding: 8px 26px; display: flex; flex-direction: column; justify-content: space-between; border-left: 1px solid var(--line); }
    .fact:first-child { padding-left: 0; border-left: 0; }
    .fact strong { font-size: clamp(2rem, 4vw, 4rem); line-height: 1; letter-spacing: -.06em; }
    .fact span { max-width: 12rem; color: var(--muted); font-size: .78rem; line-height: 1.55; }

    .category-mosaic { min-height: 760px; display: grid; grid-template-columns: 1.15fr .85fr; grid-template-rows: 1fr 1fr; gap: 14px; }
    .category-panel { min-height: 0; overflow: hidden; position: relative; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .category-panel--face { grid-row: 1 / span 2; }
    .category-panel .image-button { width: 100%; height: 100%; }
    .category-panel img { height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.16, 1, .3, 1); }
    .category-panel:hover img { transform: scale(1.025); }
    .category-panel > div { width: calc(100% - 28px); padding: 22px; position: absolute; left: 14px; bottom: 14px; border: 1px solid rgba(251, 252, 252, .7); border-radius: var(--radius); background: rgba(251, 252, 252, .88); box-shadow: 0 12px 28px rgba(41, 73, 79, .12); backdrop-filter: blur(16px); }
    .category-panel h3 { font-size: clamp(1.4rem, 2.2vw, 2.4rem); letter-spacing: -.045em; }
    .category-panel p { max-width: 38rem; margin-top: 9px; color: var(--ink-soft); font-size: .84rem; line-height: 1.65; }
    .category-panel span { display: block; margin-top: 12px; color: var(--accent-deep); font-size: .72rem; font-weight: 750; }

    .filter-toolbar { margin: 0 0 30px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .filter-set { min-width: 0; display: flex; gap: 7px; overflow-x: auto; scrollbar-width: thin; }
    .filter-button { min-height: 40px; padding: 0 14px; flex: none; border: 1px solid var(--line); border-radius: var(--radius); color: var(--ink-soft); background: var(--paper); font-size: .75rem; font-weight: 700; cursor: pointer; transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease; }
    .filter-button:hover { border-color: var(--line-strong); }
    .filter-button[aria-pressed="true"] { color: var(--on-accent); border-color: var(--accent); background: var(--accent); }
    .result-count { flex: none; color: var(--muted); font-size: .74rem; }

    .product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
    .product-card { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: 0 8px 26px rgba(41, 73, 79, .055); }
    .image-button { padding: 0; border: 0; border-radius: var(--radius); display: block; overflow: hidden; background: var(--surface-soft); cursor: zoom-in; transition: transform .18s ease; }
    .product-card > .image-button { width: 100%; aspect-ratio: 1.14; border-radius: var(--radius) var(--radius) 0 0; }
    .product-card > .image-button img { height: 100%; object-fit: cover; transition: transform .45s cubic-bezier(.16, 1, .3, 1); }
    .product-card:hover > .image-button img { transform: scale(1.025); }
    .product-card__body { padding: 24px; }
    .product-category { color: var(--accent-deep); font-size: .7rem; font-weight: 800; }
    .product-card h3 { margin-top: 9px; font-size: 1.42rem; line-height: 1.18; letter-spacing: -.035em; }
    .product-description { margin-top: 14px; color: var(--muted); font-size: .86rem; line-height: 1.7; }
    .product-selling-points { margin-top: 20px; display: grid; gap: 9px; }
    .product-selling-points p { color: var(--ink-soft); font-size: .77rem; line-height: 1.6; }
    .product-selling-points strong { display: block; margin-bottom: 3px; color: var(--ink); font-size: .69rem; }
    .product-details { margin-top: 20px; border-top: 1px solid var(--line); }
    .product-details summary { padding: 16px 0 0; color: var(--accent-deep); font-size: .74rem; font-weight: 800; cursor: pointer; }
    .product-details dl { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .product-details dl div { min-width: 0; padding: 12px; border-radius: var(--radius); background: var(--paper); }
    .product-details dt { color: var(--muted); font-size: .65rem; }
    .product-details dd { margin-top: 5px; font-size: .76rem; font-weight: 700; overflow-wrap: anywhere; }

    .material-layout { display: grid; grid-template-columns: minmax(360px, .78fr) 1.22fr; gap: clamp(36px, 6vw, 86px); align-items: start; }
    .material-visual { min-height: 680px; position: sticky; top: 100px; overflow: hidden; border-radius: var(--radius); background: var(--surface-soft); box-shadow: var(--shadow); }
    .material-visual img { width: 100%; height: 100%; position: absolute; object-fit: cover; }
    .material-visual div { width: calc(100% - 32px); padding: 22px; position: absolute; left: 16px; bottom: 16px; border-radius: var(--radius); background: rgba(251, 252, 252, .9); backdrop-filter: blur(16px); }
    .material-visual strong { display: block; font-size: 2.2rem; letter-spacing: -.055em; }
    .material-visual span { display: block; margin-top: 8px; color: var(--muted); font-size: .8rem; line-height: 1.6; }
    .material-list { border-top: 1px solid var(--line-strong); }
    .material-row { padding: 26px 0; display: grid; grid-template-columns: minmax(180px, .7fr) 1.3fr; gap: 32px; border-bottom: 1px solid var(--line); }
    .material-row h3 { font-size: 1.2rem; letter-spacing: -.025em; }
    .material-row span { display: block; margin-top: 8px; color: var(--accent-deep); font-size: .7rem; font-weight: 750; }
    .material-row p { color: var(--muted); font-size: .86rem; line-height: 1.75; }

    .format-filter-stack { margin-bottom: 28px; display: grid; gap: 9px; }
    .format-filter-stack .filter-toolbar { margin: 0; }
    .format-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: start; }
    .format-card { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .format-card > .image-button { width: 100%; aspect-ratio: 1; border-radius: var(--radius) var(--radius) 0 0; }
    .format-card > .image-button img { height: 100%; object-fit: cover; transition: transform .45s cubic-bezier(.16, 1, .3, 1); }
    .format-card:hover > .image-button img { transform: scale(1.03); }
    .format-card__body { padding: 18px; }
    .format-card__meta { display: flex; justify-content: space-between; gap: 10px; color: var(--accent-deep); font-size: .63rem; font-weight: 750; }
    .format-card h3 { margin-top: 10px; font-size: 1rem; line-height: 1.35; letter-spacing: -.02em; }
    .format-card__body > p { min-height: 3.9em; margin-top: 10px; color: var(--muted); font-size: .75rem; line-height: 1.65; }
    .format-card dl { margin-top: 15px; padding-top: 13px; display: grid; gap: 8px; border-top: 1px solid var(--line); }
    .format-card dl div { display: grid; grid-template-columns: 76px 1fr; gap: 9px; font-size: .68rem; line-height: 1.5; }
    .format-card dt { color: var(--muted); }
    .format-card dd { font-weight: 650; }
    .empty-state { padding: 44px; border: 1px dashed var(--line-strong); border-radius: var(--radius); text-align: center; background: var(--surface); }
    .empty-state h3 { font-size: 1.4rem; }
    .empty-state p { margin: 10px auto 18px; color: var(--muted); font-size: .86rem; }

    .process-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 34px; border-top: 1px solid var(--line-strong); }
    .process-group { padding-top: 26px; }
    .process-group h3 { font-size: 1.25rem; letter-spacing: -.025em; }
    .process-group ol { margin: 18px 0 0; padding: 0; list-style: none; counter-reset: process; }
    .process-group li { min-height: 44px; padding: 10px 0 10px 40px; position: relative; color: var(--ink-soft); font-size: .82rem; line-height: 1.55; counter-increment: process; }
    .process-group li::before { content: counter(process, decimal-leading-zero); width: 28px; position: absolute; left: 0; top: 10px; color: var(--accent-deep); font-size: .65rem; font-weight: 800; }
    .factory-mosaic { margin-top: 62px; display: grid; grid-template-columns: 1.12fr .88fr; grid-template-rows: 1fr 1fr; gap: 12px; }
    .factory-mosaic figure { min-height: 270px; overflow: hidden; position: relative; border-radius: var(--radius); background: var(--surface-soft); }
    .factory-mosaic figure:first-child { min-height: 552px; grid-row: 1 / span 2; }
    .factory-mosaic img { height: 100%; object-fit: cover; }
    .factory-mosaic figcaption { padding: 9px 12px; position: absolute; left: 10px; bottom: 10px; border-radius: var(--radius); color: var(--ink); background: rgba(251, 252, 252, .88); font-size: .7rem; font-weight: 700; backdrop-filter: blur(12px); }
    .capacity-note { margin-top: 24px; padding: 22px 0; display: flex; justify-content: space-between; align-items: center; gap: 30px; border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); }
    .capacity-values { display: flex; gap: 36px; }
    .capacity-values strong { display: block; font-size: 2rem; letter-spacing: -.045em; }
    .capacity-values span, .capacity-note > p { color: var(--muted); font-size: .75rem; line-height: 1.55; }
    .capacity-note > p { max-width: 430px; }

    .patent-section { padding-left: max(24px, calc((100vw - 1240px) / 2)); padding-right: 0; }
    .patent-section .section-heading { padding-right: 24px; }
    .patent-rail { padding: 0 max(24px, calc((100vw - 1240px) / 2)) 20px 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(330px, 410px); gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; }
    .patent-card { overflow: hidden; scroll-snap-align: start; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .patent-card > .image-button { width: 100%; height: 450px; border-radius: var(--radius) var(--radius) 0 0; }
    .patent-card img { height: 100%; object-fit: cover; object-position: top center; }
    .patent-card > div { padding: 22px; }
    .patent-card span { color: var(--accent-deep); font-size: .68rem; font-weight: 800; }
    .patent-card h3 { margin-top: 9px; font-size: 1.2rem; letter-spacing: -.025em; }
    .patent-card p { margin-top: 10px; color: var(--muted); font-size: .78rem; line-height: 1.65; }
    .patent-note { max-width: 760px; margin-top: 22px; padding-right: 24px; color: var(--muted); font-size: .75rem; line-height: 1.7; }

    .contact-panel { width: var(--page); margin: 0 auto 18px; padding: clamp(42px, 6vw, 78px); display: grid; grid-template-columns: 1fr minmax(320px, .72fr); gap: 64px; align-items: end; border-radius: var(--radius); background: linear-gradient(128deg, #fff1be 0%, #efbbda 56%, #d9c2ee 100%); }
    .contact-panel h2 { max-width: 760px; font-size: clamp(2.3rem, 4.9vw, 5rem); line-height: .98; letter-spacing: -.06em; text-wrap: balance; }
    .contact-panel p { max-width: 650px; margin-top: 20px; color: var(--ink-soft); line-height: 1.8; }
    .contact-panel__actions { display: grid; gap: 10px; }
    .contact-panel__actions .button { width: 100%; }
    .brief-fields { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 8px; }
    .brief-fields span { padding: 9px 12px; border: 1px solid rgba(20, 39, 43, .13); border-radius: var(--radius); background: rgba(251, 252, 252, .58); font-size: .7rem; font-weight: 700; }

    .site-footer { width: var(--page); margin: 0 auto; padding: 28px 0 44px; display: grid; grid-template-columns: 1fr 1.6fr auto; align-items: center; gap: 28px; border-top: 1px solid var(--line-strong); }
    .site-footer .brand { align-self: start; }
    .site-footer > p { color: var(--muted); font-size: .68rem; line-height: 1.7; }
    .site-footer time { align-self: start; color: var(--muted); font-size: .68rem; white-space: nowrap; }

    .back-to-top { min-width: 92px; min-height: 42px; padding: 0 12px; position: fixed; right: 18px; bottom: 18px; z-index: 8; border: 1px solid var(--line-strong); border-radius: var(--radius); color: var(--on-accent); background: rgba(20, 39, 43, .92); display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 750; opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .18s ease, visibility .18s ease, transform .18s ease; }
    .back-to-top.is-visible { opacity: 1; visibility: visible; transform: translateY(0); }

    .image-viewer { width: min(1000px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 48px 16px 16px; border: 1px solid rgba(251, 252, 252, .28); border-radius: var(--radius); color: var(--on-accent); background: rgba(20, 39, 43, .96); box-shadow: 0 32px 100px rgba(20, 39, 43, .34); }
    .image-viewer::backdrop { background: rgba(20, 39, 43, .72); backdrop-filter: blur(8px); }
    .image-viewer img { max-height: calc(100dvh - 100px); object-fit: contain; border-radius: var(--radius); background: var(--surface); }
    .image-viewer button { min-height: 34px; padding: 0 12px; position: absolute; right: 16px; top: 9px; border: 1px solid rgba(251, 252, 252, .25); border-radius: var(--radius); color: var(--on-accent); background: transparent; font-size: .72rem; cursor: pointer; }

    @media (max-width: 1080px) {
      .site-nav a:nth-child(3), .site-nav a:nth-child(4) { display: none; }
      .hero { grid-template-columns: 1fr 1fr; gap: 30px; }
      .hero__visual { min-height: 490px; }
      .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .format-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 820px) {
      :root { --page: calc(100vw - 28px); }
      body::before { display: none; }
      .site-header { min-height: 64px; grid-template-columns: 1fr auto; top: 7px; }
      .site-nav { display: none; }
      .header-action { min-height: 40px; padding: 0 13px; }
      .hero { min-height: auto; padding: 48px 24px 24px; grid-template-columns: 1fr; }
      .hero h1 { font-size: clamp(2.45rem, 10.8vw, 3.6rem); }
      .hero__visual { min-height: 460px; margin-top: 6px; }
      .fact-rail { grid-template-columns: 1fr 1fr; }
      .fact { padding: 20px; border-bottom: 1px solid var(--line); }
      .fact:nth-child(odd) { padding-left: 0; border-left: 0; }
      .fact:nth-last-child(-n+2) { border-bottom: 0; }
      .category-mosaic { min-height: auto; grid-template-columns: 1fr; grid-template-rows: none; }
      .category-panel, .category-panel--face { min-height: 440px; grid-row: auto; }
      .material-layout { grid-template-columns: 1fr; }
      .material-visual { min-height: 520px; position: relative; top: auto; }
      .format-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .process-layout { grid-template-columns: 1fr; gap: 8px; }
      .factory-mosaic { grid-template-columns: 1fr; grid-template-rows: none; }
      .factory-mosaic figure, .factory-mosaic figure:first-child { min-height: 360px; grid-row: auto; }
      .capacity-note { align-items: flex-start; flex-direction: column; }
      .contact-panel { grid-template-columns: 1fr; gap: 34px; }
      .site-footer { grid-template-columns: 1fr; }
    }

    @media (max-width: 580px) {
      .brand small { display: none; }
      .hero__visual { min-height: 360px; }
      .section { padding: 76px 0; }
      .fact { min-height: 126px; }
      .category-panel, .category-panel--face { min-height: 380px; }
      .category-panel > div { padding: 18px; }
      .filter-toolbar { align-items: flex-start; flex-direction: column; }
      .product-grid, .format-grid { grid-template-columns: 1fr; }
      .product-card__body { padding: 21px; }
      .material-row { grid-template-columns: 1fr; gap: 12px; }
      .format-card__body > p { min-height: auto; }
      .factory-mosaic figure, .factory-mosaic figure:first-child { min-height: 290px; }
      .capacity-values { width: 100%; justify-content: space-between; gap: 16px; }
      .patent-rail { grid-auto-columns: minmax(290px, calc(100vw - 42px)); }
      .patent-card > .image-button { height: 390px; }
      .contact-panel { padding: 38px 22px; }
      .back-to-top { min-width: 76px; }
    }

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
    }

    @media print {
      @page { size: A4; margin: 12mm; }
      :root { --page: 100%; }
      body { background: #fdfdfc; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      body::before, .site-header, .filter-toolbar, .back-to-top, .contact-panel__actions, .image-viewer { display: none !important; }
      .hero { min-height: 235mm; margin: 0; padding: 18mm; grid-template-columns: 1fr; page-break-after: always; }
      .hero__visual { min-height: 116mm; }
      .fact-rail { margin-top: 12mm; }
      .section { padding: 16mm 0; }
      .section-heading { margin-bottom: 9mm; }
      .category-mosaic { min-height: 230mm; }
      .product-grid { grid-template-columns: 1fr 1fr; gap: 5mm; }
      .product-card, .format-card, .patent-card, .material-row, .process-group, .factory-mosaic figure { break-inside: avoid; box-shadow: none; }
      .product-details > * { display: block !important; }
      .product-details summary { display: none !important; }
      .format-grid { grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
      .format-card__body { padding: 4mm; }
      .format-card__body > p { min-height: auto; }
      .material-layout { grid-template-columns: 1fr; }
      .material-visual { min-height: 125mm; position: relative; top: auto; }
      .patent-section { padding-left: 0; }
      .patent-rail { padding-right: 0; grid-auto-flow: row; grid-template-columns: 1fr 1fr; overflow: visible; }
      .contact-panel { margin-top: 12mm; page-break-before: always; }
      .site-footer { margin-top: 10mm; }
    }
  </style>
</head>
<body>
  <span id="top" aria-hidden="true"></span>
  <header class="site-header">
    <a class="brand" href="#top" aria-label="返回广拓生物水凝膜产品中心顶部">
      <img src="${logo}" alt="广拓生物标志">
      <span><strong>广拓生物</strong><small>GUANGTUO BIO</small></span>
    </a>
    <nav class="site-nav" aria-label="产品册导航">
      <a href="#categories">产品方向</a>
      <a href="#products">现有成品</a>
      <a href="#formats">膜型库</a>
      <a href="#process">工艺与产能</a>
      <a href="#patents">专利证明</a>
    </nav>
    <a class="header-action" href="#contact">沟通新品</a>
  </header>

  <main>
    <section class="hero" aria-labelledby="page-title">
      <div class="hero__copy">
        <p class="eyebrow">2015 年成立于广州</p>
        <h1 id="page-title">下一款水凝膜，要让消费者愿意再次使用。</h1>
        <p>从配方肤感、膜型到包装与量产，面膜、眼膜和局部膜贴均可从实物样品开始确认。</p>
        <div class="hero__actions"><a class="button button--primary" href="#products">开始选品</a></div>
      </div>
      <div class="hero__visual" aria-label="水凝膜产品实拍与凝胶质感">
        <figure class="hero__visual-main"><img src="${heroImage}" alt="红金双色水凝胶眼膜产品实拍" fetchpriority="high"></figure>
        <figure class="hero__visual-texture"><img src="${gelTexture}" alt="水凝胶通透质感参考" fetchpriority="high"></figure>
      </div>
    </section>

    <section class="fact-rail" aria-label="广拓生物水凝膜能力概览">
      <article class="fact"><strong>21</strong><span>款现有成品，可直接比较配方、肤感与包装方向</span></article>
      <article class="fact"><strong>41</strong><span>种现有膜型，覆盖整脸、眼周、颈部与细分部位</span></article>
      <article class="fact"><strong>5</strong><span>类凝胶材质，支持不同触感、贴合度与产品故事</span></article>
      <article class="fact"><strong>30</strong><span>项公司资料所列水凝膜相关专利积累</span></article>
    </section>

    <section class="section" id="categories">
      <div class="section-heading">
        <h2>从整脸护理，到每一个值得单独开发的部位。</h2>
        <p>先确定消费者要护理哪里，再选择合适的凝胶体系、膜体轮廓、成分方向与包装方式。</p>
      </div>
      <div class="category-mosaic">
        ${categoryPanel('face-masks', 'face')}
        ${categoryPanel('eye-masks', 'eye')}
        ${categoryPanel('specialty-patches', 'specialty')}
      </div>
    </section>

    <section class="section section--tight" id="products">
      <div class="section-heading">
        <p class="eyebrow">现有成品系列</p>
        <h2>先看成品，选品和打样都会更快。</h2>
        <p>21 款现有产品把成分故事、膜体体验、功效用途、规格与参考起订量放在一起，方便品牌快速找到值得进一步拿样的方向。</p>
      </div>
      <div class="filter-toolbar">
        <div class="filter-set" role="group" aria-label="按产品分类筛选">
          <button class="filter-button" type="button" data-product-filter="all" aria-pressed="true">全部产品</button>
          ${categories.map((category) => `<button class="filter-button" type="button" data-product-filter="${category.slug}" aria-pressed="false">${categoryMeta[category.slug].name}</button>`).join('')}
        </div>
        <span class="result-count" id="product-count" aria-live="polite">正在显示 21 款产品</span>
      </div>
      <div class="product-grid">${products.map(productCard).join('')}</div>
    </section>

    <section class="section" id="materials">
      <div class="section-heading">
        <h2>一片水凝膜的手感，从凝胶体系开始。</h2>
        <p>同样是水凝膜，不同材质会影响清凉感、柔韧度、贴合度、成型空间和成分故事。样品能让这些差异真正被摸到、贴到。</p>
      </div>
      <div class="material-layout">
        <figure class="material-visual">
          <img src="${gelTexture}" alt="水凝胶材质通透感与表面质感" loading="lazy" decoding="async">
          <div><strong>5 类凝胶材质</strong><span>从天然水凝胶到微孔冰导、高分子、复合凝胶与膏状膜，按目标肤感和产品定位选择。</span></div>
        </figure>
        <div class="material-list">${hydrogelMaterialFamilies.map(materialRow).join('')}</div>
      </div>
    </section>

    <section class="section section--tight" id="formats">
      <div class="section-heading">
        <h2>41 种膜型，把护理部位和产品记忆点落到实物。</h2>
        <p>可按产品分类与凝胶材质筛选。每种膜型均列出功效方向、规格、参考起订量与包装建议，方便直接进入样品沟通。</p>
      </div>
      <div class="format-filter-stack">
        <div class="filter-toolbar">
          <div class="filter-set" role="group" aria-label="按膜型分类筛选">
            <button class="filter-button" type="button" data-format-category="all" aria-pressed="true">全部分类</button>
            ${categories.map((category) => `<button class="filter-button" type="button" data-format-category="${category.slug}" aria-pressed="false">${categoryMeta[category.slug].name}</button>`).join('')}
          </div>
          <span class="result-count" id="format-count" aria-live="polite">正在显示 41 种膜型</span>
        </div>
        <div class="filter-toolbar">
          <div class="filter-set" role="group" aria-label="按凝胶材质筛选">
            <button class="filter-button" type="button" data-format-family="all" aria-pressed="true">全部材质</button>
            ${hydrogelMaterialFamilies.map((family) => `<button class="filter-button" type="button" data-format-family="${family.id}" aria-pressed="false">${zh(family.name)}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="format-grid">${hydrogelFormats.map(formatCard).join('')}</div>
      <div class="empty-state" id="format-empty" hidden>
        <h3>当前组合暂无现有膜型</h3>
        <p>可以切换分类或材质，也可以把想做的部位与造型发给我们讨论。</p>
        <button class="button button--secondary" type="button" id="reset-format-filter">查看全部膜型</button>
      </div>
    </section>

    <section class="section" id="process">
      <div class="section-heading">
        <h2>样品确认后，生产守住同一套标准。</h2>
        <p>从凝胶粉分散、活化与脱泡，到导流、冷却、裁切、浸泡和检验，每一步都服务于膜体状态、贴敷体验与成品一致性。</p>
      </div>
      <div class="process-layout">
        ${processGroup('配好凝胶', 0, 5)}
        ${processGroup('让膜体稳定成型', 5, 8)}
        ${processGroup('灌装、检验与交付', 8, 12)}
      </div>
      <div class="factory-mosaic">
        <figure><img src="${factoryProduction}" alt="水凝膜生产现场" loading="lazy" decoding="async"><figcaption>生产现场</figcaption></figure>
        <figure><img src="${factoryQuality}" alt="水凝膜质量检查现场" loading="lazy" decoding="async"><figcaption>质量检查</figcaption></figure>
        <figure><img src="${factoryAssembly}" alt="水凝膜成品装配现场" loading="lazy" decoding="async"><figcaption>成品装配</figcaption></figure>
      </div>
      <div class="capacity-note">
        <div class="capacity-values">
          <div><strong>${escapeHtml(skincareDaily?.value ?? '200,000+')}</strong><span>护肤品参考日产能</span></div>
          <div><strong>${escapeHtml(hydrogelDaily?.value ?? '100,000+')}</strong><span>水凝胶面膜与眼膜参考日产能</span></div>
        </div>
        <p>以上产能来自现有公司资料，仅作项目评估参考。实际排产、交期与产能安排，以产品规格、订单数量和双方确认结果为准。</p>
      </div>
    </section>

    <section class="section patent-section" id="patents">
      <div class="section-heading">
        <p class="eyebrow">专利与工艺依据</p>
        <h2>工艺不只写在文案里，也能从证书原件核对。</h2>
        <p>以下为资料包中的部分水凝膜相关证书，覆盖凝胶生产、涂布、裁切、眼凝胶制备与产品外观设计。</p>
      </div>
      <div class="patent-rail">${hydrogelPatentProofs.map(patentCard).join('')}</div>
      <p class="patent-note">证书记载专利权人：广州品爵生物科技有限公司。证书名称、专利号与权利人信息均以原件为准，图片可点击放大核对。</p>
    </section>

    <section class="contact-panel" id="contact">
      <div>
        <h2>想拿样、询价，或开发新的膜型？</h2>
        <p>回复发送这份资料的业务联系人，告诉我们护理部位、期望肤感、首单数量、目标市场与上市时间。我们会把可选成品、膜型与样品建议一次说清楚。</p>
        <div class="brief-fields"><span>护理部位</span><span>成分或功效方向</span><span>预计数量</span><span>目标市场</span><span>上市时间</span></div>
      </div>
      <div class="contact-panel__actions">
        <button class="button button--primary" type="button" id="copy-brief">复制咨询清单</button>
        <button class="button button--secondary" type="button" id="print-page">打印或保存 PDF</button>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="brand"><img src="${logo}" alt="广拓生物标志"><span><strong>广拓生物</strong><small>GUANGTUO BIO</small></span></div>
    <p>本资料所列功效方向、规格、包装、起订量与产能来自现有产品及公司资料，仅供选品和项目沟通。实际配方、标签宣称、测试、法规、价格与交期，以确认样品及订单条件为准。</p>
    <time datetime="${new Date().toISOString().slice(0, 10)}">资料更新：${escapeHtml(documentDate)}</time>
  </footer>

  <a class="back-to-top" href="#top" id="back-to-top">返回顶部</a>

  <dialog class="image-viewer" id="image-viewer">
    <button type="button" id="close-viewer">关闭</button>
    <img id="viewer-image" alt="放大的产品或证书图片">
  </dialog>

  <script>
    (function () {
      var productFilter = 'all';
      var formatCategory = 'all';
      var formatFamily = 'all';

      function setPressed(buttons, activeButton) {
        buttons.forEach(function (button) {
          button.setAttribute('aria-pressed', button === activeButton ? 'true' : 'false');
        });
      }

      var productButtons = Array.from(document.querySelectorAll('[data-product-filter]'));
      var productCards = Array.from(document.querySelectorAll('[data-product-card]'));
      var productCount = document.getElementById('product-count');

      function applyProductFilter() {
        var visible = 0;
        productCards.forEach(function (card) {
          var matches = productFilter === 'all' || card.dataset.category === productFilter;
          card.hidden = !matches;
          if (matches) visible += 1;
        });
        productCount.textContent = '正在显示 ' + visible + ' 款产品';
      }

      productButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          productFilter = button.dataset.productFilter;
          setPressed(productButtons, button);
          applyProductFilter();
        });
      });

      var formatCategoryButtons = Array.from(document.querySelectorAll('[data-format-category]'));
      var formatFamilyButtons = Array.from(document.querySelectorAll('[data-format-family]'));
      var formatCards = Array.from(document.querySelectorAll('[data-format-card]'));
      var formatCount = document.getElementById('format-count');
      var formatEmpty = document.getElementById('format-empty');

      function applyFormatFilter() {
        var visible = 0;
        formatCards.forEach(function (card) {
          var categoryMatches = formatCategory === 'all' || card.dataset.category === formatCategory;
          var familyMatches = formatFamily === 'all' || card.dataset.family === formatFamily;
          var matches = categoryMatches && familyMatches;
          card.hidden = !matches;
          if (matches) visible += 1;
        });
        formatCount.textContent = '正在显示 ' + visible + ' 种膜型';
        formatEmpty.hidden = visible !== 0;
      }

      formatCategoryButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          formatCategory = button.dataset.formatCategory;
          setPressed(formatCategoryButtons, button);
          applyFormatFilter();
        });
      });

      formatFamilyButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          formatFamily = button.dataset.formatFamily;
          setPressed(formatFamilyButtons, button);
          applyFormatFilter();
        });
      });

      document.getElementById('reset-format-filter').addEventListener('click', function () {
        formatCategory = 'all';
        formatFamily = 'all';
        setPressed(formatCategoryButtons, formatCategoryButtons[0]);
        setPressed(formatFamilyButtons, formatFamilyButtons[0]);
        applyFormatFilter();
      });

      var viewer = document.getElementById('image-viewer');
      var viewerImage = document.getElementById('viewer-image');
      document.querySelectorAll('.zoomable').forEach(function (button) {
        button.addEventListener('click', function () {
          var image = button.querySelector('img');
          viewerImage.src = image.src;
          viewerImage.alt = image.alt;
          if (typeof viewer.showModal === 'function') viewer.showModal();
          else viewer.setAttribute('open', '');
        });
      });

      function closeViewer() {
        if (typeof viewer.close === 'function') viewer.close();
        else viewer.removeAttribute('open');
        viewerImage.removeAttribute('src');
      }

      document.getElementById('close-viewer').addEventListener('click', closeViewer);
      viewer.addEventListener('click', function (event) {
        if (event.target === viewer) closeViewer();
      });

      var consultationBrief = [
        '您好，我想了解广拓生物水凝膜项目：',
        '1. 护理部位或产品方向：',
        '2. 感兴趣的成品或膜型：',
        '3. 希望主打的成分、功效或肤感：',
        '4. 预计首单数量：',
        '5. 目标销售市场：',
        '6. 期望上市或交付时间：',
        '7. 其他包装或定制要求：'
      ].join('\\n');

      function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      document.getElementById('copy-brief').addEventListener('click', function (event) {
        var button = event.currentTarget;
        var copyPromise = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(consultationBrief)
          : Promise.resolve().then(function () { fallbackCopy(consultationBrief); });
        copyPromise.then(function () {
          button.textContent = '已复制，可直接发给对接人';
          window.setTimeout(function () { button.textContent = '复制咨询清单'; }, 2600);
        }).catch(function () {
          fallbackCopy(consultationBrief);
          button.textContent = '已复制，可直接发给对接人';
          window.setTimeout(function () { button.textContent = '复制咨询清单'; }, 2600);
        });
      });

      document.getElementById('print-page').addEventListener('click', function () { window.print(); });

      var topMarker = document.getElementById('top');
      var backToTop = document.getElementById('back-to-top');
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          backToTop.classList.toggle('is-visible', !entries[0].isIntersecting);
        });
        observer.observe(topMarker);
      }
    })();
  </script>
</body>
</html>`;

if (/[—–]/.test(html)) throw new Error('Client showcase contains a disallowed dash character');
if (/(?:src|href)=["'](?:https?:|\/)/i.test(html)) throw new Error('Client showcase contains an external or root-relative resource');
if (!html.includes('data:image/')) throw new Error('Client showcase does not contain embedded images');

mkdirSync(outputDir, {recursive: true});
writeFileSync(outputPath, html, 'utf8');

const sizeMb = Buffer.byteLength(html, 'utf8') / 1024 / 1024;
console.log(`Created ${outputPath}`);
console.log(`Products: ${products.length}; formats: ${hydrogelFormats.length}; material families: ${hydrogelMaterialFamilies.length}`);
console.log(`Embedded images: ${optimizedImageCount + rawImageCount}; optimized: ${optimizedImageCount}; raw: ${rawImageCount}`);
console.log(`File size: ${sizeMb.toFixed(2)} MB`);
