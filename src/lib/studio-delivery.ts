import {decodeConfiguration, encodeConfiguration} from './config-state';
import {createStudioGenerateRequest} from './sku-3d-studio';
import type {Locale} from './routing';
import {allPackagingProducts, type PackagingPrintText} from '../data/legacy-packaging-catalog';
import {packagingParts, packagingPartSelectionKeys, validPackagingPartSelection} from './packaging-parts';
import {z} from 'zod';
import type {InquiryInput} from './contracts';

type StudioShare = {sku: string; specifications: Record<string, string>; assemblyState: 'open' | 'closed'; printText?: PackagingPrintText};
const printKeys = {brand: 'print-brand', detail: 'print-detail'} as const;
function validPrintText(text: PackagingPrintText): boolean {
  return text.brand.length <= 32 && text.detail.length <= 120 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text.brand + text.detail) && !/[\r\n]/.test(text.brand);
}
export function withStudioPrintSpecifications(specifications: Record<string, string>, printText?: PackagingPrintText): Record<string, string> {
  return printText ? {...specifications, [printKeys.brand]: printText.brand, [printKeys.detail]: printText.detail} : specifications;
}
export function studioPartSpecifications(product: (typeof allPackagingProducts)[number], selections: Record<string, string>): Record<string, string> {
  const available = packagingParts(product);
  return Object.fromEntries(packagingPartSelectionKeys.flatMap((key) => {
    const value = selections[key];
    if (!value || !available.includes(key.startsWith('cap-') ? 'cap' : 'pump')) return [];
    if (!validPackagingPartSelection(key, value)) throw new Error('PART_STYLE_INVALID');
    return [[key, value]];
  }));
}
export function supportsStudioWebGl(createContext: () => WebGL2RenderingContext | null = () => document.createElement('canvas').getContext('webgl2')): boolean {
  try {
    const context = createContext();
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
const studioWorkSchema = z.object({version: z.literal(1), apiBase: z.string().max(2000), savedAt: z.number(), jobId: z.string().regex(/^[a-f0-9]{32}$/), conceptImage: z.object({id: z.string().regex(/^[a-f0-9]{32}$/), sku: z.string(), prompt: z.string().max(2000), specifications: z.record(z.string(), z.string()), imageUrl: z.string().regex(/^\/concept-images\/[a-f0-9]{32}$/), createdAt: z.string(), cached: z.boolean()}).optional()});
export function decodeStudioWork(raw: string, apiBase: string, now = Date.now()) {
  if (raw.length > 16000) return null;
  try {
    const work = studioWorkSchema.parse(JSON.parse(raw));
    return work.apiBase === apiBase && now >= work.savedAt && now - work.savedAt <= 86_400_000 ? work : null;
  } catch { return null; }
}
export function encodeStudioShare(state: StudioShare): string {
  const product = allPackagingProducts.find((item) => item.sku === state.sku);
  const printText = product?.editablePrint ? state.printText ?? product.editablePrint.defaults : undefined;
  if (printText && !validPrintText(printText)) throw new Error('PRINT_TEXT_INVALID');
  const parts = product ? studioPartSpecifications(product, state.specifications) : {};
  return encodeConfiguration({sku: state.sku, selections: {...withStudioPrintSpecifications(createStudioGenerateRequest({sku: state.sku, specifications: state.specifications}).specifications, printText), ...parts, assembly: state.assemblyState}});
}
export function decodeStudioShare(fragment: string): StudioShare | null {
  const state = decodeConfiguration(fragment.replace(/^#/, ''));
  if (!state) return null;
  try {
    const product = allPackagingProducts.find((item) => item.sku === state.sku);
    const printText = product?.editablePrint ? {
      brand: state.selections[printKeys.brand] ?? product.editablePrint.defaults.brand,
      detail: state.selections[printKeys.detail] ?? product.editablePrint.defaults.detail
    } : undefined;
    if (printText && !validPrintText(printText)) return null;
    const specifications = createStudioGenerateRequest({sku: state.sku, specifications: state.selections}).specifications;
    return {sku: state.sku, specifications: {...specifications, ...(product ? studioPartSpecifications(product, state.selections) : {})}, assemblyState: state.selections.assembly === 'open' ? 'open' : 'closed', ...(printText ? {printText} : {})};
  }
  catch { return null; }
}

export function validateStudioLogoHeader(bytes: Uint8Array, size: number): string {
  if (size < 1 || size > 2 * 1024 * 1024) throw new Error('LOGO_SIZE');
  if ([137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  throw new Error('LOGO_TYPE');
}

export function packagingInquiryFields(fragment: string, locale: Locale): {packagingPreference: string; configuration: string; design: InquiryInput['design']} | null {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  const shared = decodeStudioShare(params.get('cfg') ?? '');
  if (!shared) return null;
  const product = allPackagingProducts.find((item) => item.sku === shared.sku);
  if (!product) return null;
  const printLabels: Record<Locale, [string, string]> = {
    zh: ['品牌文字', '下方小字'], en: ['Brand text', 'Small print'], fr: ['Texte de marque', 'Petit texte'], es: ['Texto de marca', 'Texto pequeño'], ru: ['Текст бренда', 'Мелкий текст'], ar: ['نص العلامة', 'النص الصغير']
  };
  const partLabels: Record<Locale, {cap: string; pump: string; color: string; finish: string}> = {
    zh: {cap: '盖子', pump: '喷头', color: '颜色', finish: '表面效果'},
    en: {cap: 'Cap', pump: 'Dispenser', color: 'colour', finish: 'finish'},
    fr: {cap: 'Bouchon', pump: 'Pompe', color: 'couleur', finish: 'finition'},
    es: {cap: 'Tapa', pump: 'Dosificador', color: 'color', finish: 'acabado'},
    ru: {cap: 'Крышка', pump: 'Помпа', color: 'цвет', finish: 'отделка'},
    ar: {cap: 'الغطاء', pump: 'المضخة', color: 'اللون', finish: 'التشطيب'}
  };
  const optionConfiguration = product.optionGroups.map((group) => `${group.label[locale]}: ${group.options.find((option) => option.id === shared.specifications[group.id])?.label[locale] ?? shared.specifications[group.id]}`).join('; ');
  const partConfiguration = packagingPartSelectionKeys.flatMap((key) => {
    const value = shared.specifications[key];
    if (!value) return [];
    const [part, field] = key.split('-') as ['cap' | 'pump', 'color' | 'finish'];
    const displayValue = field === 'finish' ? product.optionGroups.find((group) => group.id === 'finish')?.options.find((option) => option.id === value)?.label[locale] ?? value : value;
    return [`${partLabels[locale][part]}${partLabels[locale][field]}: ${displayValue}`];
  }).join('; ');
  const textConfiguration = shared.printText ? `${printLabels[locale][0]}: ${shared.printText.brand}; ${printLabels[locale][1]}: ${shared.printText.detail.replace(/\n/g, ' / ')}` : '';
  return {
    design: {kind: 'existing', sku: shared.sku, specifications: withStudioPrintSpecifications(shared.specifications, shared.printText), assemblyState: shared.assemblyState},
    packagingPreference: `${product.name[locale]} · ${product.sku}`,
    configuration: [optionConfiguration, partConfiguration, textConfiguration].filter(Boolean).join('; ')
  };
}

export async function readStudioLogo(file: File): Promise<string> {
  validateStudioLogoHeader(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.size);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 2048 || bitmap.height > 2048 || !bitmap.width || !bitmap.height) throw new Error('LOGO_DIMENSIONS');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('LOGO_DECODE');
    context.drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/png');
  } finally { bitmap.close(); }
}

export const studioDeliveryCopy: Record<Locale, {upload: string; remove: string; export: string; share: string; shareNote: string; logoNote: string; error: string; ready: string; fallback: string; retry: string; working: string; link: string}> = {
  zh: {upload: '上传 Logo', remove: '移除 Logo', export: '下载这个方案', share: '分享当前配置', shareNote: '链接包含规格和开合状态，不包含本地 Logo。', logoNote: 'PNG / JPG / WebP，≤2 MB，≤2048 像素；只在此浏览器使用。', error: '操作未完成，请检查文件或重试。', ready: '方案图已导出', fallback: '暂时无法显示 3D。您仍可选择规格并与顾问沟通。', retry: '重新加载预览', working: '正在处理…', link: '配置链接'},
  en: {upload: 'Upload logo', remove: 'Remove logo', export: 'Download this design', share: 'Share configuration', shareNote: 'The link includes options and assembly, not your local logo.', logoNote: 'PNG / JPG / WebP, ≤2 MB, ≤2048 px; used only in this browser.', error: 'Could not finish. Check the file or try again.', ready: 'Design image exported', fallback: '3D is unavailable. You can still choose options and contact an advisor.', retry: 'Reload preview', working: 'Working…', link: 'Configuration link'},
  fr: {upload: 'Importer un logo', remove: 'Retirer le logo', export: 'Télécharger ce modèle', share: 'Partager la configuration', shareNote: 'Le lien inclut les options et l’ouverture, pas le logo local.', logoNote: 'PNG / JPG / WebP, ≤2 Mo, ≤2048 px ; utilisé uniquement dans ce navigateur.', error: 'Opération impossible. Vérifiez le fichier ou réessayez.', ready: 'Image du modèle exportée', fallback: 'La 3D est indisponible. Vous pouvez choisir les options et contacter un conseiller.', retry: 'Recharger l’aperçu', working: 'En cours…', link: 'Lien de configuration'},
  es: {upload: 'Subir logotipo', remove: 'Quitar logotipo', export: 'Descargar este diseño', share: 'Compartir configuración', shareNote: 'El enlace incluye opciones y apertura, no el logotipo local.', logoNote: 'PNG / JPG / WebP, ≤2 MB, ≤2048 px; solo se usa en este navegador.', error: 'No se pudo completar. Revise el archivo o reintente.', ready: 'Imagen del diseño exportada', fallback: 'La vista 3D no está disponible. Puede elegir opciones y contactar con un asesor.', retry: 'Recargar vista', working: 'Procesando…', link: 'Enlace de configuración'},
  ru: {upload: 'Загрузить логотип', remove: 'Убрать логотип', export: 'Скачать этот дизайн', share: 'Поделиться настройками', shareNote: 'Ссылка включает параметры и открытие, но не локальный логотип.', logoNote: 'PNG / JPG / WebP, ≤2 МБ, ≤2048 пикс.; только в этом браузере.', error: 'Не удалось завершить. Проверьте файл или повторите.', ready: 'Изображение дизайна экспортировано', fallback: '3D недоступно. Можно выбрать параметры и связаться с консультантом.', retry: 'Перезагрузить просмотр', working: 'Обработка…', link: 'Ссылка на настройки'},
  ar: {upload: 'رفع الشعار', remove: 'إزالة الشعار', export: 'تنزيل هذا التصميم', share: 'مشاركة الإعدادات', shareNote: 'يتضمن الرابط الخيارات وحالة الفتح، دون الشعار المحلي.', logoNote: 'PNG / JPG / WebP، ≤2 ميجابايت، ≤2048 بكسل؛ في هذا المتصفح فقط.', error: 'تعذر الإكمال. تحقق من الملف أو أعد المحاولة.', ready: 'تم تصدير صورة التصميم', fallback: 'العرض ثلاثي الأبعاد غير متاح. لا يزال بإمكانك اختيار الخيارات والتواصل مع المستشار.', retry: 'إعادة تحميل المعاينة', working: 'جارٍ المعالجة…', link: 'رابط الإعدادات'}
};
