'use client';

import {Bounds, ContactShadows, Environment, Html, Lightformer, OrbitControls, useGLTF} from '@react-three/drei';
import {Canvas, useThree} from '@react-three/fiber';
import Image from 'next/image';
import {DownloadLeadGate} from '@/components/download-lead-gate';
import {Component, Suspense, useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode} from 'react';
import {ACESFilmicToneMapping, Mesh, NeutralToneMapping} from 'three';

import {CaptureBridge, CONFIGURED_MODEL_VIEWER_POLICY, ConfiguredProductModel, getAssemblyInteraction, type ModelAssemblyState} from '@/components/bottle-configurator';
import {
  studioPackagingProducts,
  allPackagingProducts,
  resolvePackagingConceptColor,
  type PackagingConcept,
  type PackagingOption,
  type PackagingPrintText
} from '@/data/legacy-packaging-catalog';
import {type Locale} from '@/lib/routing';
import {packagingPartColor, packagingParts, type PackagingPart} from '@/lib/packaging-parts';
import {
  createStudioConceptGenerationRequest,
  createStudioConceptImageRequest,
  createStudioGenerateRequest,
  GENERATED_VIEWER_POLICY,
  getConceptWorkflowReadiness,
  getStudioApiBaseUrl,
  getStudioSpecificationEffectCopy,
  getStudioSpecificationPlan,
  getStudioStageCopy,
  normalizeStudioConceptImage,
  normalizeStudioJob,
  STUDIO_WORKFLOW_COPY,
  type StudioConceptImage,
  type StudioJob
} from '@/lib/sku-3d-studio';

import styles from './sku-3d-studio.module.css';
import {decodeStudioShare, decodeStudioWork, encodeStudioShare, readStudioLogo, studioDeliveryCopy, studioPartSpecifications, supportsStudioWebGl, withStudioPrintSpecifications} from '@/lib/studio-delivery';

type StudioMode = 'configuration' | 'ai-concept';
const panelCopy: Record<Locale, {choosePackage: string; changePackage: string; body: string; cap: string; pump: string; color: string; finish: string; reference: string; showReference: string; hideReference: string; brand: string}> = {
  zh: {choosePackage: '选择包装', changePackage: '更换包装', body: '瓶身', cap: '盖子', pump: '喷头', color: '颜色', finish: '表面效果', reference: '恢复原色', showReference: '查看厂家效果图', hideReference: '收起厂家效果图', brand: '瓶身印字与 Logo'},
  en: {choosePackage: 'Choose packaging', changePackage: 'Change packaging', body: 'Body', cap: 'Cap', pump: 'Dispenser', color: 'Colour', finish: 'Finish', reference: 'Original colour', showReference: 'View catalogue image', hideReference: 'Hide catalogue image', brand: 'Printing & logo'},
  fr: {choosePackage: 'Choisir un emballage', changePackage: 'Changer l’emballage', body: 'Flacon', cap: 'Bouchon', pump: 'Pompe', color: 'Couleur', finish: 'Finition', reference: 'Couleur d’origine', showReference: 'Voir l’image du catalogue', hideReference: 'Masquer l’image', brand: 'Texte et logo'},
  es: {choosePackage: 'Elegir envase', changePackage: 'Cambiar envase', body: 'Envase', cap: 'Tapa', pump: 'Dosificador', color: 'Color', finish: 'Acabado', reference: 'Color original', showReference: 'Ver imagen del catálogo', hideReference: 'Ocultar imagen', brand: 'Texto y logotipo'},
  ru: {choosePackage: 'Выбрать упаковку', changePackage: 'Сменить упаковку', body: 'Корпус', cap: 'Крышка', pump: 'Помпа', color: 'Цвет', finish: 'Отделка', reference: 'Исходный цвет', showReference: 'Показать фото из каталога', hideReference: 'Скрыть фото', brand: 'Надписи и логотип'},
  ar: {choosePackage: 'اختيار العبوة', changePackage: 'تغيير العبوة', body: 'العبوة', cap: 'الغطاء', pump: 'المضخة', color: 'اللون', finish: 'التشطيب', reference: 'اللون الأصلي', showReference: 'عرض صورة الدليل', hideReference: 'إخفاء الصورة', brand: 'الطباعة والشعار'}
};
const catalogReferenceCopy: Record<Locale, {title: string; retouched: string; original: string; pending: string}> = {
  zh: {title: '该规格手册效果图', retouched: '手册裁剪 · AI 修饰', original: '查看手册原图', pending: '该型号的单瓶效果图制作中'},
  en: {title: 'Size-specific catalogue image', retouched: 'Catalogue crop · AI retouch', original: 'View original', pending: 'Individual image for this model is in progress'},
  fr: {title: 'Image du format choisi', retouched: 'Recadrage du catalogue · retouche IA', original: 'Voir l’original', pending: 'L’image individuelle de ce modèle est en préparation'},
  es: {title: 'Imagen del tamaño elegido', retouched: 'Recorte del catálogo · retoque IA', original: 'Ver original', pending: 'La imagen individual de este modelo está en preparación'},
  ru: {title: 'Изображение выбранного объёма', retouched: 'Кадр из каталога · ИИ-ретушь', original: 'Открыть оригинал', pending: 'Изображение этой модели готовится'},
  ar: {title: 'صورة المقاس المحدد', retouched: 'قص من الدليل · تحسين بالذكاء الاصطناعي', original: 'عرض الأصل', pending: 'الصورة الفردية لهذا الطراز قيد الإعداد'}
};
const catalogSizeCopy: Record<Locale, {title: string; model: string; capacity: string; chamber: string; material: string; pump: string; dimensions: string; pending: string; note: string}> = {
  zh: {title: '选择容量与型号', model: '型号', capacity: '标称容量', chamber: '双仓规格', material: '材质', pump: '泵头', dimensions: '外形尺寸', pending: '待厂家确认', note: '容量与材质来自手册；3D 外观比例按照片制作，毫米尺寸以厂家图纸或实样为准。'},
  en: {title: 'Choose size and model', model: 'Model', capacity: 'Capacity', chamber: 'Chambers', material: 'Material', pump: 'Pump', dimensions: 'Outer dimensions', pending: 'To be confirmed', note: 'Capacity and material come from the catalogue. The 3D proportions are photo-based; confirm millimetre dimensions with the supplier.'},
  fr: {title: 'Choisir le format', model: 'Modèle', capacity: 'Contenance', chamber: 'Compartiments', material: 'Matière', pump: 'Pompe', dimensions: 'Dimensions', pending: 'À confirmer', note: 'Contenance et matière proviennent du catalogue. Les dimensions en millimètres doivent être confirmées auprès du fournisseur.'},
  es: {title: 'Elegir tamaño y modelo', model: 'Modelo', capacity: 'Capacidad', chamber: 'Compartimentos', material: 'Material', pump: 'Dosificador', dimensions: 'Dimensiones', pending: 'Por confirmar', note: 'La capacidad y el material proceden del catálogo. Confirme las dimensiones en milímetros con el proveedor.'},
  ru: {title: 'Выберите размер и модель', model: 'Модель', capacity: 'Объём', chamber: 'Камеры', material: 'Материал', pump: 'Помпа', dimensions: 'Габариты', pending: 'Уточняется', note: 'Объём и материал указаны в каталоге. Размеры в миллиметрах необходимо подтвердить у поставщика.'},
  ar: {title: 'اختر السعة والطراز', model: 'الطراز', capacity: 'السعة', chamber: 'الحجرتان', material: 'المادة', pump: 'المضخة', dimensions: 'الأبعاد', pending: 'بانتظار التأكيد', note: 'السعة والمادة من الدليل. يجب تأكيد الأبعاد بالمليمتر مع المورّد.'}
};
function packagingFamily(product: PackagingConcept): PackagingConcept[] {
  if (!product.source) return [product];
  const rootSku = product.seriesSku ?? product.sku;
  return allPackagingProducts.filter((item) => item.source && (item.seriesSku ?? item.sku) === rootSku)
    .sort((a, b) => Number.parseFloat(b.source!.totalCapacity ?? b.source!.capacity) - Number.parseFloat(a.source!.totalCapacity ?? a.source!.capacity));
}

function displayedCapacities(product: PackagingConcept, locale: Locale): string[] {
  if (product.source) return packagingFamily(product).map((item) => item.source?.totalCapacity ?? item.source!.capacity);
  return product.optionGroups.find((group) => group.id === 'capacity')?.options.map((item) => item.label[locale]) ?? [];
}
type Health = {
  ready: boolean;
  image_ready: boolean;
  model_ready: boolean;
  busy: boolean;
  estimated_wait_seconds: number;
};

const serviceCopy: Record<Locale, {checking: string; unavailable: string; notConfigured: string; unreachable: string; image: string; model: string}> = {
  zh: {checking: '正在检查生成服务…', unavailable: '服务未接通', notConfigured: 'AI 方案图与新造型 3D 服务未接通，暂不能生成。请联系网站维护人完成接入；现有包装仍可使用。', unreachable: '无法连接生成服务。请联系网站维护人检查服务，连接恢复后再试。', image: '方案图生成服务不可用，暂不能生成图片。请联系网站维护人检查图片服务。', model: '新造型 3D 生成服务不可用，暂不能生成模型。请联系网站维护人检查 3D 服务。'},
  en: {checking: 'Checking generation services…', unavailable: 'Service not connected', notConfigured: 'AI concept and new-shape 3D services are not connected. Generation is unavailable. Ask the site administrator to connect them; existing packaging remains available.', unreachable: 'Cannot connect to the generation service. Ask the site administrator to check it and retry after the connection is restored.', image: 'Concept image generation is unavailable. Ask the site administrator to check the image service.', model: 'New-shape 3D generation is unavailable. Ask the site administrator to check the 3D service.'},
  fr: {checking: 'Vérification des services de génération…', unavailable: 'Service non connecté', notConfigured: 'Les services de concepts IA et de nouvelles formes 3D ne sont pas connectés. La génération est indisponible. Contactez l’administrateur du site ; les emballages existants restent disponibles.', unreachable: 'Connexion au service de génération impossible. Contactez l’administrateur du site et réessayez après le rétablissement de la connexion.', image: 'La génération d’images de concept est indisponible. Demandez à l’administrateur du site de vérifier le service d’images.', model: 'La génération de nouvelles formes 3D est indisponible. Demandez à l’administrateur du site de vérifier le service 3D.'},
  es: {checking: 'Comprobando los servicios de generación…', unavailable: 'Servicio no conectado', notConfigured: 'Los servicios de conceptos con IA y nuevas formas 3D no están conectados. No se puede generar contenido. Contacta con el administrador; los envases existentes siguen disponibles.', unreachable: 'No se puede conectar con el servicio de generación. Contacta con el administrador y vuelve a intentarlo cuando se restablezca la conexión.', image: 'La generación de imágenes conceptuales no está disponible. Pide al administrador que revise el servicio de imágenes.', model: 'La generación de nuevas formas 3D no está disponible. Pide al administrador que revise el servicio 3D.'},
  ru: {checking: 'Проверка сервисов генерации…', unavailable: 'Сервис не подключён', notConfigured: 'Сервисы ИИ-концепций и новых 3D-форм не подключены. Генерация недоступна. Обратитесь к администратору сайта; готовые варианты упаковки доступны.', unreachable: 'Не удалось подключиться к сервису генерации. Обратитесь к администратору сайта и повторите попытку после восстановления связи.', image: 'Генерация изображений концепции недоступна. Попросите администратора проверить сервис изображений.', model: 'Генерация новых 3D-форм недоступна. Попросите администратора проверить сервис 3D.'},
  ar: {checking: 'جارٍ التحقق من خدمات التوليد…', unavailable: 'الخدمة غير متصلة', notConfigured: 'خدمات الصور بالذكاء الاصطناعي والأشكال ثلاثية الأبعاد الجديدة غير متصلة، لذا لا يمكن التوليد. تواصل مع مسؤول الموقع لإعدادها؛ تظل العبوات الحالية متاحة.', unreachable: 'تعذر الاتصال بخدمة التوليد. تواصل مع مسؤول الموقع وأعد المحاولة بعد استعادة الاتصال.', image: 'خدمة توليد صور التصور غير متاحة. اطلب من مسؤول الموقع التحقق من خدمة الصور.', model: 'خدمة توليد الأشكال ثلاثية الأبعاد الجديدة غير متاحة. اطلب من مسؤول الموقع التحقق من خدمة 3D.'}
};

export function StudioServiceNotice({locale, configured, health, checking}: {locale: Locale; configured: boolean; health: Health | null; checking: boolean}) {
  const copy = serviceCopy[locale];
  const error = (code: string, message: string) => <p className={styles.error} role="alert"><b>{code}</b><span>{message}</span></p>;
  if (!configured) return error('STUDIO_NOT_CONFIGURED', copy.notConfigured);
  if (checking) return <p className={styles.help} role="status">{copy.checking}</p>;
  if (!health) return error('STUDIO_UNREACHABLE', copy.unreachable);
  return <>{!health.image_ready && error('IMAGE_SERVICE_UNAVAILABLE', copy.image)}{!health.model_ready && error('MODEL_SERVICE_UNAVAILABLE', copy.model)}</>;
}

const apiBase = getStudioApiBaseUrl(process.env.NEXT_PUBLIC_STUDIO_API_URL);
const defaultStudioSku = 'HD-1267';
const editablePrintCopy: Record<Locale, {brand: string; detail: string}> = {
  zh: {brand: '上方品牌文字', detail: '下方小字'},
  en: {brand: 'Upper brand text', detail: 'Lower small print'},
  fr: {brand: 'Texte de marque en haut', detail: 'Petit texte en bas'},
  es: {brand: 'Texto de marca superior', detail: 'Texto pequeño inferior'},
  ru: {brand: 'Текст бренда сверху', detail: 'Мелкий текст снизу'},
  ar: {brand: 'نص العلامة العلوي', detail: 'النص الصغير السفلي'}
};
const packagingTypeNames: Record<string, Record<Locale, string>> = {
  mousse: {zh: '慕斯瓶', en: 'Mousse bottles', fr: 'Flacons mousse', es: 'Frascos de espuma', ru: 'Флаконы для пенки', ar: 'عبوات الرغوة'},
  jars: {zh: '罐与盒', en: 'Jars & boxes', fr: 'Pots et boîtes', es: 'Tarros y cajas', ru: 'Банки и коробки', ar: 'المرطبانات والعلب'},
  bottles: {zh: '瓶类', en: 'Bottles', fr: 'Flacons', es: 'Frascos', ru: 'Флаконы', ar: 'العبوات'},
  lotion: {zh: '泵瓶', en: 'Pump bottles', fr: 'Flacons à pompe', es: 'Botellas con dosificador', ru: 'Флаконы с помпой', ar: 'عبوات بمضخة'},
  spray: {zh: '喷雾瓶', en: 'Spray bottles', fr: 'Flacons spray', es: 'Botellas pulverizadoras', ru: 'Флаконы с распылителем', ar: 'عبوات الرش'},
  airless: {zh: '真空瓶', en: 'Airless bottles', fr: 'Flacons airless', es: 'Frascos airless', ru: 'Вакуумные флаконы', ar: 'العبوات المفرغة'}
};
export const STUDIO_LOGO_ARTWORK = '/assets/brand/showki-logo.png';
export const STUDIO_CONCEPT_EXAMPLE = '/assets/studio/new-shape-four-view-v1.png';
const defaultConceptBriefs: Record<string, Record<Locale, string>> = {
  'GT-AIRLESS-030': {
    zh: '重新设计一款 30ml 真空瓶：瓶肩更利落，泵头与外盖比例更紧凑，整体适合高端功效护肤线。',
    en: 'Redesign a 30 ml airless bottle with a sharper shoulder, a compact pump-and-cap proportion, and a premium clinical skincare feel.',
    fr: 'Redessiner un flacon airless de 30 ml avec une épaule plus nette, une pompe et un capot compacts, dans un esprit de soin clinique haut de gamme.',
    es: 'Rediseñar un frasco airless de 30 ml con hombros más definidos, una bomba y tapa compactas y una estética clínica de alta gama.',
    ru: 'Создать новый дизайн безвоздушного флакона 30 мл с более чётким плечом, компактными пропорциями помпы и колпачка и премиальным клиническим характером.',
    ar: 'أعد تصميم عبوة مفرغة من الهواء سعة 30 مل بكتف أكثر حدة ونسبة مدمجة للمضخة والغطاء وطابع سريري فاخر.'
  },
  'GT-DROPPER-030': {
    zh: '重新设计一款 30ml 滴管瓶：瓶肩更干净，瓶底略厚，滴管盖与瓶身比例精致，适合高端精华。',
    en: 'Redesign a 30 ml dropper bottle with a cleaner shoulder, a slightly weighted base, and refined cap-to-bottle proportions.',
    fr: 'Redessiner un flacon compte-gouttes de 30 ml avec une épaule épurée, une base légèrement lestée et des proportions raffinées.',
    es: 'Rediseñar un frasco cuentagotas de 30 ml con hombros limpios, una base ligeramente pesada y proporciones refinadas.',
    ru: 'Создать новый дизайн флакона с пипеткой 30 мл с чистой линией плеча, слегка утяжелённым дном и изящными пропорциями крышки и флакона.',
    ar: 'أعد تصميم عبوة قطارة سعة 30 مل بكتف أنظف وقاعدة أثقل قليلاً ونسب راقية بين الغطاء والعبوة.'
  },
  'GT-JAR-050': {
    zh: '重新设计一款 50g 面霜罐：罐体低矮稳重，盖子更薄，开合结构清楚，适合高端修护面霜。',
    en: 'Redesign a 50 g cream jar with a low weighted body, a slimmer lid, and a clearly readable opening structure.',
    fr: 'Redessiner un pot de crème de 50 g, bas et stable, avec un couvercle plus fin et une ouverture clairement lisible.',
    es: 'Rediseñar un tarro de crema de 50 g, bajo y estable, con una tapa más fina y una apertura claramente visible.',
    ru: 'Создать новый дизайн банки для крема 50 г с низким устойчивым корпусом, более тонкой крышкой и понятной конструкцией открывания.',
    ar: 'أعد تصميم برطمان كريم 50 جم بجسم منخفض وثابت وغطاء أنحف وبنية فتح واضحة.'
  },
  'GT-MASK-FULL-025': {
    zh: '重新设计一款整体式面膜包装：袋型平整、边角柔和、封边精致，正面留出清晰的品牌与信息区域。',
    en: 'Redesign a full-sheet mask sachet with a flat premium pouch, soft corners, refined seals, and a clear front branding area.',
    fr: 'Redessiner un sachet de masque intégral, plat et haut de gamme, aux angles doux, avec des soudures fines et une zone de marque claire.',
    es: 'Rediseñar un sobre plano y premium para mascarilla completa, con esquinas suaves, sellos refinados y una zona frontal clara para la marca.',
    ru: 'Создать новый дизайн плоского премиального саше для цельной маски с мягкими углами, аккуратными швами и ясной зоной брендинга спереди.',
    ar: 'أعد تصميم كيس فاخر ومسطح لقناع كامل بزوايا ناعمة وحواف إغلاق دقيقة ومساحة أمامية واضحة للعلامة.'
  },
  'GT-MASK-SPLIT-030': {
    zh: '重新设计一款上下分体面膜包装：袋型平整，能清楚表达上下两片结构，封边和撕口简洁精致。',
    en: 'Redesign a split-mask sachet that clearly communicates the upper and lower pieces, with clean seals and a refined tear notch.',
    fr: 'Redessiner un sachet pour masque en deux parties qui exprime clairement les pièces haute et basse, avec des soudures nettes et une encoche fine.',
    es: 'Rediseñar un sobre para mascarilla dividida que muestre claramente las piezas superior e inferior, con sellos limpios y una muesca refinada.',
    ru: 'Создать новый дизайн саше для раздельной маски, ясно показывающий верхнюю и нижнюю части, с аккуратными швами и изящной насечкой для вскрытия.',
    ar: 'أعد تصميم كيس لقناع مقسوم يوضح بجلاء الجزأين العلوي والسفلي مع حواف نظيفة وشق فتح أنيق.'
  }
};

const studioUiCopy = {
  en: {
    paletteAria: 'Package colour palette', customColorAria: 'Choose any package colour', anyColour: 'ANY COLOUR', unavailableShape: 'New shape creation is temporarily unavailable.', conceptFirstError: 'Generate and approve a concept image first.', unavailable3d: '3D preview is temporarily unavailable.', workcellAria: 'Packaging design and preview', workflowAria: 'Choose a workflow', configurationNote: 'Colour, material and brand', conceptNote: 'Start with an idea', formatTitle: 'Choose a format', formatNote: 'Lotion, cream, cleanser, airless and serum', formatAria: 'Packaging format', lookTitle: 'Choose the look', lookNote: 'Colour, material, finish and branding', shapeTitle: 'Describe the new shape', shapeNote: 'Describe its shape, proportions and opening', shapeBrief: 'Shape idea', creatingConcept: 'Creating concept…', anotherConcept: 'Try another concept', createConcept: 'Create concept', shapeUnavailable: 'New shape creation is temporarily unavailable. You can explore the existing formats.', view3dTitle: 'Approve and view in 3D', view3dNote: 'Create a rotatable preview when ready', creating3d: 'Creating 3D…', create3d: 'Create rotatable 3D', conceptFirst: 'Create and approve a concept first.', conceptSaved: 'Your concept is saved. You can create the 3D preview later.', assemblyAria: 'Assembly demonstration', assembly: 'ASSEMBLY', closed: 'Closed', open: 'Open', approveShape: 'Choose the shape', chosen: 'Selected', startVisual: 'Start with a visual', view3d: 'View in 3D', readyExplore: 'Ready to explore', waitingApproval: 'Waiting for your choice', livePreview: 'LIVE PREVIEW', dragRotate: 'Drag to rotate', errorTitle: 'It did not work this time', status: 'STATUS', ready3d: '3D ready', conceptReady: 'Concept ready', readyIdea: 'Ready for your idea', detailsSelected: '{count} details selected', download3d: 'Download 3D', readyFor3d: 'Ready for 3D', createConceptFirst: 'Create a concept first', viewProduct: 'View this product', boundary: 'The online preview helps you explore the look. Final size, structure, colour and feel are confirmed with samples.', exampleAlt: 'Four-view packaging example', example: 'EXAMPLE', exampleText: 'Your new shape will appear here', visualAlt: 'New packaging concept image', yourVisual: 'YOUR VISUAL', selectedDirection: 'Selected direction', loadingModel: 'Loading configured model…', opening3d: 'Opening 3D preview…', viewerError: 'The 3D preview cannot be opened right now.', viewerErrorNote: 'You can still download it below.'
  },
  zh: {
    paletteAria: '包装颜色调色板', customColorAria: '选择任意包装颜色', anyColour: '任意色', unavailableShape: '新造型暂时不可用，现有包装仍可浏览。', conceptFirstError: '生成并选择一张方案图后，即可查看 3D 效果。', unavailable3d: '3D 效果暂时无法打开。', workcellAria: '包装设计与效果查看', workflowAria: '选择设计方式', configurationNote: '颜色、材质与品牌', conceptNote: '从品牌设想出发', formatTitle: '选择包装类型', formatNote: '乳液瓶、面霜罐、洁面瓶、真空瓶、玻璃精华瓶', formatAria: '包装品类', lookTitle: '搭配品牌外观', lookNote: '颜色、材质、表面与品牌呈现', shapeTitle: '描述理想造型', shapeNote: '可写下形状、比例和开合方式', shapeBrief: '造型设想', creatingConcept: '正在生成方案图…', anotherConcept: '换一个方案', createConcept: '查看方案图', shapeUnavailable: '新造型暂时无法生成，现有包装仍可浏览。', view3dTitle: '从不同角度查看外观', view3dNote: '选择满意的方案，即可生成可旋转效果', creating3d: '正在生成 3D 效果…', create3d: '查看可旋转 3D', conceptFirst: '选择一张方案图后，即可查看 3D 效果。', conceptSaved: '方案图已保留，稍后仍可继续查看 3D 效果。', assemblyAria: '部件开合演示', assembly: '查看开合方式', closed: '闭合', open: '打开', approveShape: '选择这个外形', chosen: '已选择', startVisual: '查看灵感图', view3d: '查看 3D', readyExplore: '可以旋转查看', waitingApproval: '请选择喜欢的外形', livePreview: '外观效果', dragRotate: '拖动即可旋转', errorTitle: '这次没有生成成功', status: '生成进度', ready3d: '3D 效果已完成', conceptReady: '方案图已生成', readyIdea: '等待您的造型想法', detailsSelected: '已选择 {count} 项外观细节', download3d: '下载 3D 文件', readyFor3d: '可继续查看 3D 效果', createConceptFirst: '生成方案图后即可继续', viewProduct: '查看这款包装', boundary: '在线效果帮助您比较外观，最终尺寸、结构、颜色与手感以实物样品为准。', exampleAlt: '同一包装的四视图示例', example: '造型参考', exampleText: '您的新包装造型会显示在这里', visualAlt: '新包装造型方案图', yourVisual: '您的包装灵感图', selectedDirection: '已选外观', loadingModel: '正在载入包装效果…', opening3d: '正在打开 3D 效果…', viewerError: '3D 效果暂时无法打开。', viewerErrorNote: '您仍然可以在下方下载文件。'
  },
  fr: {
    paletteAria: 'Palette de couleurs de l’emballage', customColorAria: 'Choisir une couleur libre', anyColour: 'COULEUR LIBRE', unavailableShape: 'La création d’une nouvelle forme est momentanément indisponible.', conceptFirstError: 'Créez et choisissez d’abord une image de concept.', unavailable3d: 'L’aperçu 3D est momentanément indisponible.', workcellAria: 'Design et aperçu de l’emballage', workflowAria: 'Choisir une méthode', configurationNote: 'Couleur, matière et marque', conceptNote: 'Partir d’une idée', formatTitle: 'Choisir un format', formatNote: 'Flacon, compte-gouttes, pot ou masque', formatAria: 'Format d’emballage', lookTitle: 'Choisir l’apparence', lookNote: 'Couleur, matière, finition et marque', shapeTitle: 'Décrire la nouvelle forme', shapeNote: 'Décrivez la forme, les proportions et l’ouverture', shapeBrief: 'Idée de forme', creatingConcept: 'Création du concept…', anotherConcept: 'Essayer un autre concept', createConcept: 'Créer le concept', shapeUnavailable: 'La création d’une nouvelle forme est momentanément indisponible. Vous pouvez explorer les formats existants.', view3dTitle: 'Choisir puis voir en 3D', view3dNote: 'Créez un aperçu rotatif lorsque le concept vous plaît', creating3d: 'Création de la 3D…', create3d: 'Créer la 3D rotative', conceptFirst: 'Créez et choisissez d’abord un concept.', conceptSaved: 'Votre concept est enregistré. Vous pourrez créer la 3D plus tard.', assemblyAria: 'Démonstration d’assemblage', assembly: 'ASSEMBLAGE', closed: 'Fermé', open: 'Ouvert', approveShape: 'Choisir la forme', chosen: 'Sélectionnée', startVisual: 'Commencer par un visuel', view3d: 'Voir en 3D', readyExplore: 'Prêt à explorer', waitingApproval: 'En attente de votre choix', livePreview: 'APERÇU EN DIRECT', dragRotate: 'Faites glisser pour tourner', errorTitle: 'Cela n’a pas fonctionné cette fois', status: 'ÉTAT', ready3d: '3D prête', conceptReady: 'Concept prêt', readyIdea: 'Prêt pour votre idée', detailsSelected: '{count} détails sélectionnés', download3d: 'Télécharger la 3D', readyFor3d: 'Prêt pour la 3D', createConceptFirst: 'Créez d’abord un concept', viewProduct: 'Voir ce produit', boundary: 'L’aperçu en ligne aide à explorer l’apparence. Les dimensions, la structure, la couleur et le toucher finaux se confirment sur échantillon.', exampleAlt: 'Exemple d’emballage vu sous quatre angles', example: 'EXEMPLE', exampleText: 'Votre nouvelle forme apparaîtra ici', visualAlt: 'Image du nouveau concept d’emballage', yourVisual: 'VOTRE VISUEL', selectedDirection: 'Direction choisie', loadingModel: 'Chargement du modèle…', opening3d: 'Ouverture de l’aperçu 3D…', viewerError: 'L’aperçu 3D ne peut pas s’ouvrir pour le moment.', viewerErrorNote: 'Vous pouvez toujours télécharger le fichier ci-dessous.'
  },
  es: {
    paletteAria: 'Paleta de colores del envase', customColorAria: 'Elegir cualquier color de envase', anyColour: 'COLOR LIBRE', unavailableShape: 'La creación de una forma nueva no está disponible temporalmente.', conceptFirstError: 'Cree y elija primero una imagen de concepto.', unavailable3d: 'La vista 3D no está disponible temporalmente.', workcellAria: 'Diseño y vista previa del envase', workflowAria: 'Elegir una forma de trabajo', configurationNote: 'Color, material y marca', conceptNote: 'Empezar con una idea', formatTitle: 'Elegir un formato', formatNote: 'Frasco, cuentagotas, tarro o mascarilla', formatAria: 'Formato del envase', lookTitle: 'Elegir el aspecto', lookNote: 'Color, material, acabado y marca', shapeTitle: 'Describir la nueva forma', shapeNote: 'Describa la forma, las proporciones y la apertura', shapeBrief: 'Idea de forma', creatingConcept: 'Creando el concepto…', anotherConcept: 'Probar otro concepto', createConcept: 'Crear concepto', shapeUnavailable: 'La creación de una forma nueva no está disponible temporalmente. Puede explorar los formatos existentes.', view3dTitle: 'Elegir y ver en 3D', view3dNote: 'Cree una vista giratoria cuando le guste el concepto', creating3d: 'Creando 3D…', create3d: 'Crear 3D giratorio', conceptFirst: 'Cree y elija primero un concepto.', conceptSaved: 'Su concepto está guardado. Podrá crear la vista 3D más adelante.', assemblyAria: 'Demostración de montaje', assembly: 'MONTAJE', closed: 'Cerrado', open: 'Abierto', approveShape: 'Elegir la forma', chosen: 'Seleccionada', startVisual: 'Empezar con una imagen', view3d: 'Ver en 3D', readyExplore: 'Listo para explorar', waitingApproval: 'Esperando su elección', livePreview: 'VISTA EN DIRECTO', dragRotate: 'Arrastre para girar', errorTitle: 'Esta vez no ha funcionado', status: 'ESTADO', ready3d: '3D listo', conceptReady: 'Concepto listo', readyIdea: 'Listo para su idea', detailsSelected: '{count} detalles seleccionados', download3d: 'Descargar 3D', readyFor3d: 'Listo para 3D', createConceptFirst: 'Cree primero un concepto', viewProduct: 'Ver este producto', boundary: 'La vista en línea ayuda a explorar el aspecto. El tamaño, la estructura, el color y el tacto finales se confirman con muestras.', exampleAlt: 'Ejemplo de envase visto desde cuatro ángulos', example: 'EJEMPLO', exampleText: 'Su nueva forma aparecerá aquí', visualAlt: 'Imagen del nuevo concepto de envase', yourVisual: 'SU IMAGEN', selectedDirection: 'Dirección elegida', loadingModel: 'Cargando el modelo…', opening3d: 'Abriendo la vista 3D…', viewerError: 'La vista 3D no puede abrirse ahora.', viewerErrorNote: 'Aún puede descargar el archivo abajo.'
  },
  ru: {
    paletteAria: 'Палитра цвета упаковки', customColorAria: 'Выбрать любой цвет упаковки', anyColour: 'ЛЮБОЙ ЦВЕТ', unavailableShape: 'Создание новой формы временно недоступно.', conceptFirstError: 'Сначала создайте и утвердите изображение концепции.', unavailable3d: '3D-просмотр временно недоступен.', workcellAria: 'Дизайн и просмотр упаковки', workflowAria: 'Выберите рабочий процесс', configurationNote: 'Цвет, материал и бренд', conceptNote: 'Начните с идеи', formatTitle: 'Выберите формат', formatNote: 'Флакон, пипетка, банка или маска', formatAria: 'Формат упаковки', lookTitle: 'Выберите внешний вид', lookNote: 'Цвет, материал, отделка и брендинг', shapeTitle: 'Опишите новую форму', shapeNote: 'Опишите форму, пропорции и способ открывания', shapeBrief: 'Идея формы', creatingConcept: 'Создаём концепцию…', anotherConcept: 'Попробовать другую', createConcept: 'Создать концепцию', shapeUnavailable: 'Создание новой формы временно недоступно. Можно изучить существующие форматы.', view3dTitle: 'Утвердить и открыть в 3D', view3dNote: 'Создайте вращаемый просмотр, когда будете готовы', creating3d: 'Создаём 3D…', create3d: 'Создать вращаемый 3D-просмотр', conceptFirst: 'Сначала создайте и утвердите концепцию.', conceptSaved: 'Концепция сохранена. 3D-просмотр можно создать позже.', assemblyAria: 'Демонстрация сборки', assembly: 'СБОРКА', closed: 'Закрыто', open: 'Открыто', approveShape: 'Выбрать форму', chosen: 'Выбрано', startVisual: 'Начать с изображения', view3d: 'Смотреть в 3D', readyExplore: 'Готово к просмотру', waitingApproval: 'Ожидается ваш выбор', livePreview: 'ПРЕДПРОСМОТР', dragRotate: 'Перетащите для вращения', errorTitle: 'В этот раз не получилось', status: 'СТАТУС', ready3d: '3D готов', conceptReady: 'Концепция готова', readyIdea: 'Готово для вашей идеи', detailsSelected: 'Выбрано деталей: {count}', download3d: 'Скачать 3D', readyFor3d: 'Готово для 3D', createConceptFirst: 'Сначала создайте концепцию', viewProduct: 'Смотреть продукт', boundary: 'Онлайн-просмотр помогает оценить внешний вид. Окончательные размер, конструкция, цвет и ощущение подтверждаются образцами.', exampleAlt: 'Пример упаковки в четырёх видах', example: 'ПРИМЕР', exampleText: 'Здесь появится новая форма', visualAlt: 'Изображение новой концепции упаковки', yourVisual: 'ВАША КОНЦЕПЦИЯ', selectedDirection: 'Выбранное направление', loadingModel: 'Загрузка модели…', opening3d: 'Открываем 3D-просмотр…', viewerError: 'Сейчас не удаётся открыть 3D-просмотр.', viewerErrorNote: 'Файл всё ещё можно скачать ниже.'
  },
  ar: {
    paletteAria: 'لوحة ألوان التغليف', customColorAria: 'اختر أي لون للتغليف', anyColour: 'أي لون', unavailableShape: 'إنشاء شكل جديد غير متاح مؤقتاً.', conceptFirstError: 'أنشئ صورة مفهوم واعتمدها أولاً.', unavailable3d: 'العرض ثلاثي الأبعاد غير متاح مؤقتاً.', workcellAria: 'تصميم التغليف ومعاينته', workflowAria: 'اختر مسار العمل', configurationNote: 'اللون والمادة والعلامة', conceptNote: 'ابدأ بفكرة', formatTitle: 'اختر تصميماً', formatNote: 'عبوة أو قطارة أو برطمان أو قناع', formatAria: 'تصميم التغليف', lookTitle: 'اختر المظهر', lookNote: 'اللون والمادة والتشطيب والعلامة', shapeTitle: 'صف الشكل الجديد', shapeNote: 'صف الشكل والنسب وطريقة الفتح', shapeBrief: 'فكرة الشكل', creatingConcept: 'جارٍ إنشاء المفهوم…', anotherConcept: 'جرّب مفهوماً آخر', createConcept: 'إنشاء مفهوم', shapeUnavailable: 'إنشاء شكل جديد غير متاح مؤقتاً. يمكنك استكشاف التصاميم الحالية.', view3dTitle: 'اعتمد وشاهد ثلاثي الأبعاد', view3dNote: 'أنشئ معاينة قابلة للدوران عندما تكون جاهزاً', creating3d: 'جارٍ إنشاء العرض…', create3d: 'إنشاء عرض ثلاثي الأبعاد قابل للدوران', conceptFirst: 'أنشئ مفهوماً واعتمده أولاً.', conceptSaved: 'تم حفظ المفهوم. يمكنك إنشاء العرض ثلاثي الأبعاد لاحقاً.', assemblyAria: 'عرض التجميع', assembly: 'التجميع', closed: 'مغلق', open: 'مفتوح', approveShape: 'اختر الشكل', chosen: 'تم الاختيار', startVisual: 'ابدأ بصورة', view3d: 'عرض ثلاثي الأبعاد', readyExplore: 'جاهز للاستكشاف', waitingApproval: 'بانتظار اختيارك', livePreview: 'معاينة مباشرة', dragRotate: 'اسحب للتدوير', errorTitle: 'لم تنجح العملية هذه المرة', status: 'الحالة', ready3d: 'العرض جاهز', conceptReady: 'المفهوم جاهز', readyIdea: 'جاهز لفكرتك', detailsSelected: 'تم اختيار {count} تفاصيل', download3d: 'تنزيل 3D', readyFor3d: 'جاهز للعرض ثلاثي الأبعاد', createConceptFirst: 'أنشئ مفهوماً أولاً', viewProduct: 'عرض هذا المنتج', boundary: 'تساعدك المعاينة عبر الإنترنت على استكشاف المظهر. تُعتمد الأبعاد والبنية واللون والملمس النهائي من خلال العينات.', exampleAlt: 'مثال للتغليف من أربع زوايا', example: 'مثال', exampleText: 'سيظهر شكلك الجديد هنا', visualAlt: 'صورة مفهوم التغليف الجديد', yourVisual: 'تصورك', selectedDirection: 'الاتجاه المختار', loadingModel: 'جارٍ تحميل النموذج…', opening3d: 'جارٍ فتح العرض ثلاثي الأبعاد…', viewerError: 'لا يمكن فتح العرض ثلاثي الأبعاد الآن.', viewerErrorNote: 'لا يزال بإمكانك تنزيل الملف أدناه.'
  }
} as const satisfies Record<Locale, Record<string, string>>;

export function PackageColorPalette({options, locale, selectedValue, resolvedColor, disabled, onSelect}: {
  options: PackagingOption[];
  locale: Locale;
  selectedValue: string;
  resolvedColor: string;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.colorPalette} role="group" aria-label={ui.paletteAria}>
      {options.map((option) => (
        <button
          className={selectedValue === option.id ? styles.paletteSwatchActive : styles.paletteSwatch}
          key={option.id}
          type="button"
          aria-label={option.label[locale]}
          aria-pressed={selectedValue === option.id}
          title={option.label[locale]}
          disabled={disabled}
          style={{'--palette-color': option.value} as CSSProperties}
          onClick={() => onSelect(option.id)}
        />
      ))}
      <label className={styles.customColor}>
        <input
          type="color"
          value={resolvedColor}
          aria-label={ui.customColorAria}
          disabled={disabled}
          onInput={(event) => onSelect(event.currentTarget.value.toLowerCase())}
        />
        <span><b>{ui.anyColour}</b><code>{resolvedColor.toUpperCase()}</code></span>
      </label>
    </div>
  );
}

export function Sku3dStudio({locale, products = studioPackagingProducts, embedded = false}: {locale: Locale; products?: PackagingConcept[]; embedded?: boolean}) {
  const ui = studioUiCopy[locale];
  const delivery = studioDeliveryCopy[locale];
  const [downloadIntent, setDownloadIntent] = useState<'png' | 'model' | null>(null);
  const [mode, setMode] = useState<StudioMode>('configuration');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState(defaultStudioSku);
  const [packageQuery, setPackageQuery] = useState('');
  const [packageType, setPackageType] = useState('all');
  const [packageCapacity, setPackageCapacity] = useState('all');
  const [seed] = useState(1234);
  const [conceptPrompt, setConceptPrompt] = useState(locale === 'zh' ? '设计一款慕斯瓶，重点考虑泵头、透明罩与瓶肩比例。' : 'Design a mousse bottle with balanced pump, clear cap and shoulder proportions.');
  const [conceptImage, setConceptImage] = useState<StudioConceptImage | null>(null);
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    () => createStudioGenerateRequest({sku: defaultStudioSku}).specifications
  );
  const [printText, setPrintText] = useState<PackagingPrintText>(() => allPackagingProducts.find((product) => product.sku === defaultStudioSku)?.editablePrint?.defaults ?? {brand: '', detail: ''});
  const [health, setHealth] = useState<Health | null>(null);
  const [job, setJob] = useState<StudioJob | null>(null);
  const [requestError, setRequestError] = useState('');
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [assemblyState, setAssemblyState] = useState<ModelAssemblyState>('closed');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [capture, setCapture] = useState<(() => Promise<Blob | null>) | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [viewerEpoch, setViewerEpoch] = useState(0);
  const [webglState, setWebglState] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [healthChecking, setHealthChecking] = useState(Boolean(apiBase));
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [pollRetry, setPollRetry] = useState(0);
  const onCaptureReady = useCallback((next: () => Promise<Blob | null>) => setCapture(() => next), []);
  const onModelReady = useCallback(() => setViewerReady(true), []);
  const onViewerError = useCallback(() => { setViewerFailed(true); setViewerReady(false); setCapture(null); }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWebglState(supportsStudioWebGl() ? 'ready' : 'unavailable'));
    return () => cancelAnimationFrame(frame);
  }, [viewerEpoch]);

  useEffect(() => {
    const restore = () => {
      const restored = decodeStudioShare(window.location.hash);
      if (!restored || !allPackagingProducts.some((item) => item.sku === restored.sku)) return;
      setSelectedSku(restored.sku); setSpecifications(restored.specifications); setAssemblyState(restored.assemblyState); setPrintText(restored.printText ?? allPackagingProducts.find((item) => item.sku === restored.sku)?.editablePrint?.defaults ?? {brand: '', detail: ''}); setMode('configuration');
      if (allPackagingProducts.find((item) => item.sku === restored.sku)?.source) setLogoDataUrl(null);
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, [products]);

  const aiMode = mode === 'ai-concept';
  const selectedProduct = allPackagingProducts.find((product) => product.sku === selectedSku) ?? products[0];
  const activePrintText = selectedProduct.editablePrint ? printText : undefined;
  const selectedFamilySku = selectedProduct.seriesSku ?? selectedProduct.sku;
  const familyProducts = packagingFamily(selectedProduct);
  const sizeCopy = catalogSizeCopy[locale];
  const selectableProducts = products.some((product) => product.sku === selectedFamilySku) ? products : [...products, selectedProduct];
  const availableTypes = [...new Set(selectableProducts.map((product) => product.category))];
  const availableCapacities = [...new Set(selectableProducts.flatMap((product) => displayedCapacities(product, locale)))];
  const filteredProducts = selectableProducts.filter((product) => {
    const query = packageQuery.trim().toLowerCase();
    const matchesQuery = !query || packagingFamily(product).some((item) => `${item.sku} ${item.name[locale]} ${item.name.en}`.toLowerCase().includes(query));
    const matchesType = packageType === 'all' || product.category === packageType;
    const matchesCapacity = packageCapacity === 'all' || displayedCapacities(product, locale).includes(packageCapacity);
    return matchesQuery && matchesType && matchesCapacity;
  });
  const selectedColor = resolvePackagingConceptColor(selectedProduct, specifications.color);
  const selectedFinish = specifications.finish ?? 'satin';
  const specificationPlan = getStudioSpecificationPlan(selectedSku, specifications);
  const assemblyInteraction = selectedProduct.assembly === false ? null : getAssemblyInteraction(selectedProduct.shape);
  const configuredProductHref = `/${locale}/inquiry/#request=packaging&packaging=${encodeURIComponent(selectedSku)}&${encodeStudioShare({sku: selectedSku, specifications, assemblyState, printText: activePrintText})}`;
  const inquirySpecifications = withStudioPrintSpecifications(specifications, activePrintText);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      if (!apiBase) {
        setHealth(null);
        return;
      }
      try {
        const response = await fetch(`${apiBase}/health`, {cache: 'no-store', signal: AbortSignal.timeout(10_000)});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const nextHealth = await response.json() as Health;
        if (!active) return;
        setHealth(nextHealth);
      } catch {
        if (!active) return;
        setHealth(null);
      } finally {
        if (active) setHealthChecking(false);
      }
    }

    void loadHealth();
    const timer = window.setInterval(loadHealth, 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!apiBase || window.location.hash.includes('cfg=')) return;
    let saved: ReturnType<typeof decodeStudioWork> = null;
    try { saved = decodeStudioWork(sessionStorage.getItem('gt-studio-work') ?? '', apiBase); } catch { return; }
    if (!saved) return;
    const work = saved;
    const controller = new AbortController();
    void fetch(`${apiBase}/jobs/${work.jobId}`, {signal: controller.signal, cache: 'no-store'}).then(async (response) => {
      if (!response.ok) throw new Error('JOB_UNAVAILABLE');
      const next = normalizeStudioJob(await response.json());
      if (controller.signal.aborted) return;
      setSelectedSku(next.sku); setSpecifications(createStudioGenerateRequest({sku: next.sku, specifications: next.specifications}).specifications);
      setConceptImage(work.conceptImage ?? null); setJob(next); setMode('ai-concept');
    }).catch(() => { if (!controller.signal.aborted) setRequestError(delivery.error); });
    return () => controller.abort();
  }, [delivery.error]);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiBase}/jobs/${job.id}`, {
          cache: 'no-store',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)])
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setJob(normalizeStudioJob(await response.json() as Record<string, unknown>));
      } catch (error) {
        if (controller.signal.aborted) return;
        setRequestError(error instanceof Error ? error.message : String(error));
      }
    }, 1_200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [job, pollRetry]);

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setDeliveryBusy(true); setDeliveryMessage('');
    try { setLogoDataUrl(await readStudioLogo(file)); }
    catch { setDeliveryMessage(delivery.error + ' ' + delivery.logoNote); }
    finally { setDeliveryBusy(false); }
  }
  async function downloadPng() {
    if (!capture || !viewerReady || viewerFailed) return;
    setDeliveryBusy(true); setDeliveryMessage('');
    try {
      const blob = await capture();
      if (!blob || !blob.size) throw new Error('EMPTY_CAPTURE');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selectedSku}-preview.png`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDeliveryMessage(delivery.ready);
    } catch { setDeliveryMessage(delivery.error); }
    finally { setDeliveryBusy(false); }
  }
  function selectProduct(product: PackagingConcept) {
    if (product.sku === selectedSku) return;
    setViewerReady(false); setViewerFailed(false); setCapture(null);
    setSelectedSku(product.sku);
    setCatalogOpen(false); setReferenceOpen(false);
    setPrintText(product.editablePrint?.defaults ?? {brand: '', detail: ''});
    if (product.source) setLogoDataUrl(null);
    setSpecifications(createStudioGenerateRequest({sku: product.sku}).specifications);
    setConceptPrompt(defaultConceptBriefs[product.sku]?.[locale] ?? (locale === 'zh' ? `设计一款${product.name.zh}，简洁的瓶身与易用的开合结构。` : `Design a refined ${product.name.en} with a practical opening.`));
    setConceptImage(null);
    setJob(null);
    setRequestError('');
    setAssemblyState('closed');
  }

  function selectSizeVariant(product: PackagingConcept) {
    if (product.sku === selectedSku) return;
    const capacity = product.optionGroups.find((group) => group.id === 'capacity')?.options[0]?.id;
    setViewerReady(false); setViewerFailed(false); setCapture(null);
    setSelectedSku(product.sku);
    setSpecifications({...createStudioGenerateRequest({sku: product.sku, specifications: {...specifications, ...(capacity ? {capacity} : {})}}).specifications, ...studioPartSpecifications(product, specifications)});
    setAssemblyState('closed');
  }

  function updateSpecification(id: string, value: string) {
    setSpecifications((current) => ({...current, [id]: value}));
    if (aiMode) {
      setConceptImage(null);
      setJob(null);
      setRequestError('');
    }
  }

  function updateConceptPrompt(value: string) {
    setConceptPrompt(value);
    setConceptImage(null);
    setJob(null);
    setRequestError('');
  }

  async function generateConceptImage() {
    if (!apiBase) {
      setRequestError(ui.unavailableShape);
      return;
    }
    setImageSubmitting(true);
    setRequestError('');
    setJob(null);
    try {
      const request = createStudioConceptImageRequest({
        sku: selectedSku,
        prompt: conceptPrompt,
        specifications
      });
      const response = await fetch(`${apiBase}/concept-images`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request)
      });
      const payload = await response.json() as Record<string, unknown> & {detail?: string};
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setConceptImage(normalizeStudioConceptImage(payload));
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      setImageSubmitting(false);
    }
  }

  async function generateModel() {
    if (!conceptImage) {
      setRequestError(ui.conceptFirstError);
      return;
    }
    if (!apiBase) {
      setRequestError(ui.unavailable3d);
      return;
    }
    setModelSubmitting(true);
    setRequestError('');
    setJob(null);
    try {
      const request = createStudioConceptGenerationRequest({
        sku: selectedSku,
        conceptImageId: conceptImage.id,
        seed,
        specifications
      });
      const response = await fetch(`${apiBase}/jobs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request)
      });
      const payload = await response.json() as Record<string, unknown> & {detail?: string};
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      const nextJob = normalizeStudioJob(payload);
      setJob(nextJob);
      try { sessionStorage.setItem('gt-studio-work', JSON.stringify({version: 1, apiBase, savedAt: Date.now(), jobId: nextJob.id, conceptImage})); }
      catch { setRequestError(delivery.error); }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      setModelSubmitting(false);
    }
  }

  const running = Boolean(job && job.status !== 'completed' && job.status !== 'failed');
  const modelUrl = apiBase && job?.modelUrl ? `${apiBase}${job.modelUrl}?v=${encodeURIComponent(job.updatedAt)}` : null;
  const conceptImageUrl = apiBase && conceptImage ? `${apiBase}${conceptImage.imageUrl}?v=${encodeURIComponent(conceptImage.createdAt)}` : null;
  const workflowReadiness = getConceptWorkflowReadiness({
    imageServiceReady: Boolean(health?.image_ready),
    modelServiceReady: Boolean(health?.model_ready),
    conceptImageId: conceptImage?.id ?? null,
    imageSubmitting,
    modelSubmitting,
    modelRunning: running
  });
  const pageCopy = STUDIO_WORKFLOW_COPY[locale];
  const Root = embedded ? 'section' : 'main';
  const viewerFallback = <div className={styles.viewerError} role="alert"><b>{delivery.fallback}</b><button type="button" onClick={() => { useGLTF.clear(selectedProduct.modelPath); if (modelUrl) useGLTF.clear(modelUrl); setViewerFailed(false); setViewerReady(false); setCapture(null); setWebglState('checking'); setViewerEpoch((value) => value + 1); }}>{delivery.retry}</button></div>;
  const Heading = embedded ? 'h2' : 'h1';

  return (
    <Root className={styles.page}>
      <header className={`${styles.intro} ${embedded ? '' : styles.compactIntro}`}>
        <div>
          <p className={styles.kicker}>{pageCopy.kicker}</p>
          <Heading>{pageCopy.heading}</Heading>
        </div>
        {embedded && <p>{pageCopy.intro}</p>}
      </header>

      <section className={styles.workcell} aria-label={ui.workcellAria}>
        <aside className={styles.controls}>
          <div className={styles.modeSwitch} role="tablist" aria-label={ui.workflowAria}>
            <button type="button" role="tab" aria-selected={!aiMode} className={!aiMode ? styles.modeButtonActive : styles.modeButton} onClick={() => setMode('configuration')}>
              <span>01</span><b>{pageCopy.configurationTab}</b>
            </button>
            <button type="button" role="tab" aria-selected={aiMode} className={aiMode ? styles.modeButtonActive : styles.modeButton} onClick={() => setMode('ai-concept')}>
              <span>02</span><b>{pageCopy.conceptTab}</b>
            </button>
          </div>

          <button type="button" className={styles.catalogToggle} aria-expanded={catalogOpen} aria-controls="studio-packaging-list" onClick={() => setCatalogOpen((open) => !open)}>
            <span><small>{panelCopy[locale].choosePackage}</small><b>{selectedProduct.name[locale]}</b></span><span aria-hidden="true">{catalogOpen ? '−' : '+'}</span>
          </button>

          {catalogOpen && <div id="studio-packaging-list" className={styles.skuGrid} role="radiogroup" aria-label={ui.formatAria}>
            <div className={styles.catalogFilters}>
              <input type="search" value={packageQuery} onChange={(event) => setPackageQuery(event.target.value)} placeholder={locale === 'zh' ? '搜索型号或包材名称' : 'Search model or package'} aria-label={locale === 'zh' ? '搜索包材' : 'Search packaging'} />
              <select value={packageType} onChange={(event) => setPackageType(event.target.value)} aria-label={locale === 'zh' ? '包材类型' : 'Package type'}><option value="all">{locale === 'zh' ? '全部类型' : 'All types'}</option>{availableTypes.map((type) => <option key={type} value={type}>{packagingTypeNames[type]?.[locale] ?? type}</option>)}</select>
              <select value={packageCapacity} onChange={(event) => setPackageCapacity(event.target.value)} aria-label={locale === 'zh' ? '容量' : 'Capacity'}><option value="all">{locale === 'zh' ? '全部容量' : 'All capacities'}</option>{availableCapacities.map((capacity) => <option key={capacity} value={capacity}>{capacity}</option>)}</select>
            </div>
            {!filteredProducts.length && <p role="status">{locale === 'zh' ? '没有符合条件的包材，请调整筛选。' : 'No packaging matches these filters.'}</p>}
            {filteredProducts.map((product) => (
              <button
                className={product.sku === selectedFamilySku ? styles.skuCardActive : styles.skuCard}
                key={product.sku}
                type="button"
                role="radio"
                aria-checked={product.sku === selectedFamilySku}
                disabled={workflowReadiness.busy}
                onClick={() => { if (product.sku !== selectedFamilySku) selectProduct(product); }}
              >
                <Image src={product.poster} width={240} height={240} alt="" />
                <span><b>{product.name[locale]}</b><small>{product.eyebrow[locale]}</small></span>
              </button>
            ))}
          </div>}

          {!aiMode && selectedProduct.source && <section className={styles.sizeSelection} aria-label={sizeCopy.title}>
            <div className={styles.sizeHeading}><b>{sizeCopy.title}</b><small>P{selectedProduct.source.page}</small></div>
            <div className={styles.sizeOptions} role="group" aria-label={sizeCopy.title}>
              {familyProducts.map((product) => <button key={product.sku} type="button" aria-pressed={product.sku === selectedSku} disabled={workflowReadiness.busy} onClick={() => selectSizeVariant(product)}>
                <b>{product.source?.totalCapacity ?? product.source?.capacity}</b><small>{product.source?.modelCode ?? product.sku}</small>
              </button>)}
            </div>
            <dl className={styles.sizeFacts}>
              <div><dt>{sizeCopy.model}</dt><dd>{selectedProduct.source.modelCode ?? selectedSku}</dd></div>
              <div><dt>{sizeCopy.capacity}</dt><dd>{selectedProduct.source.totalCapacity ?? selectedProduct.source.capacity}</dd></div>
              {selectedProduct.source.totalCapacity && <div><dt>{sizeCopy.chamber}</dt><dd>{selectedProduct.source.capacity}</dd></div>}
              <div><dt>{sizeCopy.material}</dt><dd>{selectedProduct.source.material === 'pending' ? sizeCopy.pending : selectedProduct.source.material}</dd></div>
              {selectedProduct.source.pumpHead && <div><dt>{sizeCopy.pump}</dt><dd>{selectedProduct.source.pumpHead[locale]}</dd></div>}
              <div><dt>{sizeCopy.dimensions}</dt><dd>{sizeCopy.pending}</dd></div>
            </dl>
            {selectedProduct.source.specificationNote && <p className={styles.help}>{selectedProduct.source.specificationNote[locale]}</p>}
          </section>}

          <div className={styles.specifications}>
            <div className={styles.sectionHeader}>
              <span>02</span>
              <div><b>{ui.lookTitle}</b></div>
            </div>
            <div className={styles.specificationGrid}>
              {selectedProduct.optionGroups.map((group, index) => (selectedProduct.source && group.id === 'capacity') || (!aiMode && ['color', 'finish', 'branding', 'logo-position'].includes(group.id)) ? null : group.id === 'color' ? (
                <div className={`${styles.specificationField} ${styles.colorField}`} key={group.id}>
                  <span>{group.label[locale]}<em title={specificationPlan[index].targetRoles.join(' · ')}>{getStudioSpecificationEffectCopy(specificationPlan[index].effect, locale)}</em></span>
                  <PackageColorPalette
                    options={group.options}
                    locale={locale}
                    selectedValue={specifications.color}
                    resolvedColor={selectedColor}
                    disabled={workflowReadiness.busy}
                    onSelect={(color) => updateSpecification('color', color)}
                  />
                </div>
              ) : (
                <label className={styles.specificationField} key={group.id}>
                  <span>{group.label[locale]}<em title={specificationPlan[index].targetRoles.join(' · ')}>{getStudioSpecificationEffectCopy(specificationPlan[index].effect, locale)}</em></span>
                  <select
                    value={specifications[group.id]}
                    disabled={workflowReadiness.busy}
                    onChange={(event) => updateSpecification(group.id, event.target.value)}
                  >
                    {group.options.map((option) => <option value={option.id} key={option.id}>{option.label[locale]}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {!aiMode && <div className={styles.partStyles}>
              {packagingParts(selectedProduct).map((part: PackagingPart) => <fieldset className={styles.partStyle} key={part}>
                <legend>{panelCopy[locale][part]}</legend>
                <div className={styles.partStyleFields}>
                  <label>{panelCopy[locale].color}<span className={styles.partColorInput}>
                    <input type="color" aria-label={`${panelCopy[locale][part]}${panelCopy[locale].color}`} value={part === 'body' ? selectedColor : specifications[`${part}-color`] || packagingPartColor(selectedProduct, part)} disabled={workflowReadiness.busy} onInput={(event) => updateSpecification(part === 'body' ? 'color' : `${part}-color`, event.currentTarget.value.toLowerCase())} />
                    <button type="button" disabled={workflowReadiness.busy} onClick={() => updateSpecification(part === 'body' ? 'color' : `${part}-color`, part === 'body' ? selectedProduct.optionGroups.find((group) => group.id === 'color')?.options[0]?.id ?? selectedProduct.color : '')}>{panelCopy[locale].reference}</button>
                  </span></label>
                  <label>{panelCopy[locale].finish}<select aria-label={`${panelCopy[locale][part]}${panelCopy[locale].finish}`} value={part === 'body' ? selectedFinish : specifications[`${part}-finish`] || 'reference'} disabled={workflowReadiness.busy} onChange={(event) => updateSpecification(part === 'body' ? 'finish' : `${part}-finish`, event.target.value)}>
                    {part !== 'body' && <option value="reference">{panelCopy[locale].reference}</option>}
                    {selectedProduct.optionGroups.find((group) => group.id === 'finish')?.options.map((option) => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}
                  </select></label>
                </div>
              </fieldset>)}
            </div>}
            {!aiMode && <div className={styles.editablePrint}>
              <b>{selectedProduct.editablePrint ? panelCopy[locale].brand : 'Logo'}</b>
              {selectedProduct.editablePrint && <>
                <label>{editablePrintCopy[locale].brand}<input type="text" value={printText.brand} maxLength={32} disabled={workflowReadiness.busy} onChange={(event) => setPrintText((current) => ({...current, brand: event.target.value}))} /></label>
                <label>{editablePrintCopy[locale].detail}<textarea value={printText.detail} maxLength={120} rows={2} disabled={workflowReadiness.busy} onChange={(event) => setPrintText((current) => ({...current, detail: event.target.value}))} /></label>
              </>}
              <div className={styles.logoActions}><label className={styles.logoUpload}>{delivery.upload}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} disabled={deliveryBusy} /></label><button type="button" disabled={!logoDataUrl || deliveryBusy} onClick={() => setLogoDataUrl(null)}>{delivery.remove}</button></div>
            </div>}
          </div>

          {aiMode ? (
            <>
              <StudioServiceNotice locale={locale} configured={Boolean(apiBase)} health={health} checking={healthChecking} />
              <div className={styles.conceptStep}>
                <div className={styles.sectionHeader}>
                  <span>03</span>
                  <div><b>{ui.shapeTitle}</b><small>{ui.shapeNote}</small></div>
                </div>
                <label className={styles.promptField}>
                  <span>{ui.shapeBrief}<small>{conceptPrompt.length}/1200</small></span>
                  <textarea maxLength={1200} value={conceptPrompt} disabled={workflowReadiness.busy} onChange={(event) => updateConceptPrompt(event.target.value)} />
                </label>
                <button className={styles.conceptButton} type="button" disabled={!workflowReadiness.canGenerateImage} onClick={generateConceptImage}>
                  <span>{imageSubmitting ? ui.creatingConcept : conceptImage ? ui.anotherConcept : ui.createConcept}</span><b>→</b>
                </button>
              </div>

              <div className={styles.geometryStep}>
                <div className={styles.sectionHeader}>
                  <span>04</span>
                  <div><b>{ui.view3dTitle}</b><small>{ui.view3dNote}</small></div>
                </div>
                <button className={styles.generateButton} type="button" disabled={!workflowReadiness.canGenerateModel} onClick={generateModel}>
                  <span>{modelSubmitting || running ? ui.creating3d : ui.create3d}</span><b>↗</b>
                </button>
                {!conceptImage && <p className={styles.help}>{ui.conceptFirst}</p>}
                {conceptImage && !health?.model_ready && <p className={styles.help}>{ui.conceptSaved}</p>}
              </div>
            </>
          ) : null}
        </aside>

        <div className={styles.output} style={{'--generated-viewer-height': `${GENERATED_VIEWER_POLICY.viewerHeight}px`} as CSSProperties}>
          <div className={styles.outputBar}><span>{aiMode ? pageCopy.conceptTab : pageCopy.configurationTab}</span><span>{selectedProduct.name[locale]}</span></div>

          <div className={styles.previewPair}>
          <div className={styles.viewer} data-studio-viewer data-viewer-ready={viewerReady}>
            {(!aiMode || modelUrl) && webglState === 'checking' ? <div className={styles.modelLoader} role="status">{ui.loadingModel}</div> : (!aiMode || modelUrl) && (webglState === 'unavailable' || viewerFailed) ? viewerFallback : aiMode ? (
              modelUrl
                ? <ModelErrorBoundary key={`${modelUrl}:${viewerEpoch}`} onError={onViewerError} fallback={viewerFallback}><GeneratedModelViewer url={modelUrl} locale={locale} onContextLost={onViewerError} /></ModelErrorBoundary>
                : conceptImageUrl
                  ? <ConceptImagePreview imageUrl={conceptImageUrl} product={selectedProduct} locale={locale} />
                  : <StudioConceptExample locale={locale} />
            ) : (
              <ModelErrorBoundary key={`${selectedSku}:${viewerEpoch}`} onError={onViewerError} fallback={viewerFallback}>
                <ConfiguredModelViewer product={selectedProduct} specifications={specifications} color={selectedColor} finish={selectedFinish} logoDataUrl={logoDataUrl} printText={activePrintText} assemblyState={assemblyState} locale={locale} onCapture={onCaptureReady} onLoaded={onModelReady} onContextLost={onViewerError} />
              </ModelErrorBoundary>
            )}
            {aiMode && running && <div className={styles.processing}><span>{job?.progress ?? 0}%</span><p>{job ? getStudioStageCopy(job.status, locale) : ''}</p></div>}
            {!aiMode && assemblyInteraction && <div className={styles.assemblyControl} role="group" aria-label={ui.assemblyAria}>
              <span>{ui.assembly}</span>
              <button type="button" aria-pressed={assemblyState === 'closed'} onClick={() => setAssemblyState('closed')}>{ui.closed}</button>
              <button type="button" aria-pressed={assemblyState === 'open'} onClick={() => setAssemblyState('open')}>{ui.open}</button>
            </div>}
          </div>
          {!aiMode && selectedProduct.catalogImages && selectedProduct.source && <div className={styles.referenceDock}>
            <button type="button" className={styles.referenceToggle} aria-expanded={referenceOpen} onClick={() => setReferenceOpen((open) => !open)}>{referenceOpen ? panelCopy[locale].hideReference : panelCopy[locale].showReference} {referenceOpen ? '−' : '+'}</button>
            {referenceOpen && <figure className={styles.catalogReference}>
              {selectedProduct.catalogImages.retouched ? <a className={styles.catalogReferenceImage} href={selectedProduct.catalogImages.retouched} target="_blank" rel="noopener noreferrer" aria-label={`${catalogReferenceCopy[locale].title} · ${selectedProduct.name[locale]}`}>
                <Image src={selectedProduct.catalogImages.retouched} fill sizes="(max-width: 700px) 60vw, 260px" unoptimized alt={`${selectedProduct.sku} · ${selectedProduct.source.capacity} · ${catalogReferenceCopy[locale].title}`} />
              </a> : <div className={styles.catalogReferencePending} role="status"><span>{selectedProduct.sku}</span><b>{selectedProduct.source.totalCapacity ?? selectedProduct.source.capacity}</b><p>{catalogReferenceCopy[locale].pending}</p></div>}
              <figcaption className={styles.catalogReferenceCaption}>
                <div><b>{catalogReferenceCopy[locale].title}</b><small>{selectedProduct.sku} · {selectedProduct.source.totalCapacity ?? selectedProduct.source.capacity} · {selectedProduct.catalogImages.retouched ? catalogReferenceCopy[locale].retouched : `P${selectedProduct.source.page}`}</small></div>
                <a href={selectedProduct.catalogImages.original} target="_blank" rel="noopener noreferrer">{catalogReferenceCopy[locale].original} ↗</a>
              </figcaption>
            </figure>}
          </div>}
          </div>

          {aiMode ? (
            <div>
              <div className={styles.handoffRail}>
                <div className={conceptImage ? styles.handoffDone : styles.handoffCurrent}><span>01</span><div><b>{ui.approveShape}</b><small>{conceptImage ? ui.chosen : ui.startVisual}</small></div></div>
                <i aria-hidden="true">→</i>
                <div className={modelUrl ? styles.handoffDone : job ? styles.handoffCurrent : styles.handoff}><span>02</span><div><b>{ui.view3d}</b><small>{modelUrl ? ui.readyExplore : job ? getStudioStageCopy(job.status, locale) : ui.waitingApproval}</small></div></div>
              </div>
              {job && <div className={styles.productionRail}>
                <div className={styles.jobStatusLine}><b>{getStudioStageCopy(job.status, locale)}</b><span>{job.progress}%</span></div>
                <div className={styles.progressTrack}><span style={{width: `${job.progress}%`}} /></div>
              </div>}
            </div>
          ) : null}

          {!aiMode && <section className={styles.deliveryControls} aria-label={delivery.export}>
            <div><button type="button" onClick={() => setDownloadIntent('png')} disabled={!capture || !viewerReady || viewerFailed || deliveryBusy}>{deliveryBusy ? delivery.working : delivery.export}</button></div>
            {deliveryMessage && <p role="status">{deliveryMessage}</p>}
          </section>}
          {aiMode && requestError && job && <button type="button" onClick={() => { setRequestError(''); setPollRetry((value) => value + 1); }}>{({zh: '重新查询进度', en: 'Retry status check', fr: 'Réessayer le suivi', es: 'Reintentar consulta de estado', ru: 'Повторить проверку статуса', ar: 'إعادة التحقق من الحالة'})[locale]}</button>}
          {(requestError || job?.error) && <div className={styles.error} role="alert"><b>{ui.errorTitle}</b><p>{requestError || job?.error}</p></div>}

          {aiMode && <div className={styles.resultBar}>
            <div><span>{ui.status}</span><b>{aiMode ? (modelUrl ? ui.ready3d : conceptImage ? ui.conceptReady : healthChecking ? serviceCopy[locale].checking : !health?.image_ready || !health?.model_ready ? serviceCopy[locale].unavailable : ui.readyIdea) : ui.detailsSelected.replace('{count}', String(Object.keys(specifications).length))}</b></div>
            {aiMode ? (modelUrl ? <button type="button" className={styles.download} onClick={() => setDownloadIntent('model')}>{ui.download3d} <span>↓</span></button> : <span className={styles.downloadDisabled}>{conceptImage ? ui.readyFor3d : ui.createConceptFirst}</span>) : <a className={styles.download} href={configuredProductHref}>{ui.viewProduct} <span>↗</span></a>}
          </div>}
        </div>
        {downloadIntent && <DownloadLeadGate locale={locale} sku={selectedSku} configuration={JSON.stringify({specifications: inquirySpecifications, assemblyState})} design={{kind: aiMode ? 'generated' : 'existing', sku: selectedSku, specifications: inquirySpecifications, assemblyState, ...(job?.id ? {jobId: job.id} : {})}} capturePreview={!aiMode && capture ? capture : undefined} onClose={() => setDownloadIntent(null)} onComplete={() => {
        const intent = downloadIntent; setDownloadIntent(null);
        if (intent === 'png') void downloadPng();
        else if (modelUrl) {const anchor = document.createElement('a'); anchor.href = modelUrl; anchor.download = `${selectedSku}.glb`; anchor.click();}
      }} />}
    </section>

      <p className={styles.boundary}>{ui.boundary}</p>
    </Root>
  );
}

function StudioConceptExample({locale}: {locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.conceptExample}>
      <Image src={STUDIO_CONCEPT_EXAMPLE} width={1024} height={1536} sizes="(max-width: 820px) 100vw, 70vw" alt={ui.exampleAlt} priority />
      <div className={styles.posterLabel}><span>{ui.example}</span><b>{ui.exampleText}</b></div>
    </div>
  );
}

function ConceptImagePreview({imageUrl, product, locale}: {imageUrl: string; product: PackagingConcept; locale: Locale}) {
  const ui = studioUiCopy[locale];
  return (
    <div className={styles.conceptPreview}>
      <Image src={imageUrl} width={1024} height={1024} sizes="(max-width: 820px) 100vw, 70vw" unoptimized alt={`${product.name[locale]} — ${ui.visualAlt}`} />
      <div className={styles.posterLabel}><span>{ui.yourVisual}</span><b>{ui.selectedDirection}</b></div>
    </div>
  );
}

function ConfiguredModelViewer({product, specifications, color, finish, logoDataUrl, printText, assemblyState, locale, onCapture, onLoaded, onContextLost}: {product: PackagingConcept; specifications: Record<string, string>; color: string; finish: string; logoDataUrl: string | null; printText?: PackagingPrintText; assemblyState: ModelAssemblyState; locale: Locale; onCapture: (capture: () => Promise<Blob | null>) => void; onLoaded: () => void; onContextLost: () => void}) {
  const ui = studioUiCopy[locale];
  return (
    <Canvas dpr={[1, CONFIGURED_MODEL_VIEWER_POLICY.maxDpr]} frameloop="demand" shadows="basic" camera={{position: [...CONFIGURED_MODEL_VIEWER_POLICY.cameraPosition], fov: 36}} gl={{antialias: true, preserveDrawingBuffer: true}} onCreated={({gl}) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = CONFIGURED_MODEL_VIEWER_POLICY.exposure; }}>
      <color attach="background" args={['#ded9cf']} />
      <ambientLight intensity={CONFIGURED_MODEL_VIEWER_POLICY.ambientIntensity} />
      <directionalLight castShadow position={[4, 7, 5]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.keyIntensity} color="#fff7e7" />
      <directionalLight position={[-5, 2, -3]} intensity={CONFIGURED_MODEL_VIEWER_POLICY.fillIntensity} color="#aac8bf" />
      <Suspense fallback={<Html center><div className={styles.modelLoader}>{ui.loadingModel}</div></Html>}>
        <Bounds fit observe margin={1.35} maxDuration={0.35}><ConfiguredProductModel product={product} selections={specifications} color={color} finish={finish} logoDataUrl={logoDataUrl} printText={printText} assemblyState={assemblyState} onLoaded={onLoaded} /></Bounds>
        <Environment resolution={128} frames={1}><Lightformer intensity={3} position={[0, 5, -3]} scale={[8, 3, 1]} /><Lightformer intensity={2} position={[-5, 0, 2]} rotation={[0, Math.PI / 2, 0]} scale={[3, 6, 1]} /></Environment>
        <ContactShadows frames={1} resolution={256} position={[0, -1.7, 0]} opacity={0.3} scale={7} blur={2.8} far={5} />
      </Suspense>
      <CaptureBridge onReady={onCapture} />
      <ContextLossBridge onLost={onContextLost} />
      <OrbitControls makeDefault enablePan={false} minDistance={2.2} maxDistance={9} minPolarAngle={Math.PI / 4.2} maxPolarAngle={Math.PI / 1.72} />
    </Canvas>
  );
}

function GeneratedModelViewer({url, locale, onContextLost}: {url: string; locale: Locale; onContextLost: () => void}) {
  const ui = studioUiCopy[locale];
  return (
    <Canvas dpr={[1, GENERATED_VIEWER_POLICY.maxDpr]} frameloop={GENERATED_VIEWER_POLICY.frameloop} shadows="basic" camera={{position: [3.8, 2.6, 4.8], fov: 36}} gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = NeutralToneMapping; gl.toneMappingExposure = 1.05; }}>
      <color attach="background" args={['#e8e4dc']} />
      <ambientLight intensity={1.2} />
      <directionalLight castShadow position={[4, 7, 5]} intensity={3.4} color="#fff7e7" />
      <directionalLight position={[-5, 2, -3]} intensity={1.8} color="#aac8bf" />
      <Suspense fallback={<Html center><div className={styles.modelLoader}>{ui.opening3d}</div></Html>}>
        <Bounds fit margin={1.25} maxDuration={0.35}><GeneratedMesh url={url} /></Bounds>
        <ContactShadows frames={GENERATED_VIEWER_POLICY.shadowFrames} resolution={256} position={[0, -1.7, 0]} opacity={0.32} scale={7} blur={2.8} far={5} />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} autoRotate={GENERATED_VIEWER_POLICY.autoRotate} minDistance={GENERATED_VIEWER_POLICY.minDistance} maxDistance={GENERATED_VIEWER_POLICY.maxDistance} minPolarAngle={Math.PI / 4.2} maxPolarAngle={Math.PI / 1.72} />
      <ContextLossBridge onLost={onContextLost} />
    </Canvas>
  );
}

function GeneratedMesh({url}: {url: string}) {
  const {scene} = useGLTF(url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [scene]);
  return <primitive object={model} />;
}

function ContextLossBridge({onLost}: {onLost: () => void}) {
  const {gl} = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

class ModelErrorBoundary extends Component<{children: ReactNode; fallback: ReactNode; onError?: () => void}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
