import type {LocalizedText} from '@/data/catalog';
import type {InboundMailDecision} from '@/lib/contracts';
import type {Locale} from '@/lib/routing';

export type MailAgentPreset = {
  id: string;
  category: 'catalogue' | 'configuration' | 'workflow' | 'files' | 'service';
  question: LocalizedText;
  answer: LocalizedText;
  keywords: string[];
};

const mailAgentTranslations: Record<string, {ru: string; ar: string}> = {
  'Which finished products can I browse?': {ru: 'Какие готовые продукты можно посмотреть?', ar: 'ما المنتجات الجاهزة التي يمكنني تصفحها؟'},
  'The catalogue covers face masks, eye masks and targeted hydrogel patches. Choose a product family or an exact SKU to begin.': {ru: 'В каталоге есть маски для лица, глаз и локальные гидрогелевые патчи. Для начала выберите категорию или точный SKU.', ar: 'يشمل الكتالوج أقنعة الوجه والعين ولصقات الهيدروجيل الموضعية. اختر فئة منتج أو SKU محدداً للبدء.'},
  'Which weights or sizes are available?': {ru: 'Какие массы и размеры доступны?', ar: 'ما الأوزان أو الأحجام المتاحة؟'},
  'Each product page lists its current net weight. Shape, dimensions and filling format are reviewed during sampling before any production commitment.': {ru: 'На странице продукта указана актуальная масса нетто. Форма, размеры и способ наполнения проверяются на образцах до обязательств по производству.', ar: 'تعرض كل صفحة الوزن الصافي الحالي. ويُراجع الشكل والأبعاد وتصميم التعبئة خلال العينات قبل أي التزام بالإنتاج.'},
  'Can the gel or mask substrate be customised?': {ru: 'Можно адаптировать гель или основу маски?', ar: 'هل يمكن تخصيص الجل أو خامة القناع؟'},
  'Formula direction, gel feel and mask substrate can be discussed for OEM/ODM development. Feasibility is confirmed through technical review and samples.': {ru: 'Для OEM/ODM можно обсудить формулу, ощущение геля и основу маски. Возможность подтверждается технической проверкой и образцами.', ar: 'يمكن مناقشة اتجاه التركيبة وملمس الجل وخامة القناع لتطوير OEM/ODM. وتُؤكد الجدوى بالمراجعة الفنية والعينات.'},
  'Can product colour be customised?': {ru: 'Можно изменить цвет продукта?', ar: 'هل يمكن تخصيص لون المنتج؟'},
  'Colour direction can be discussed where the formula and format allow it. The approved physical sample defines the production reference.': {ru: 'Если формула и формат позволяют, цвет можно обсудить. Утверждённый физический образец служит производственным эталоном.', ar: 'يمكن مناقشة اللون عندما تسمح التركيبة والتصميم. وتحدد العينة الفعلية المعتمدة مرجع الإنتاج.'},
  'Which finished-product formats can I explore?': {ru: 'Какие форматы готовой продукции доступны?', ar: 'ما تصاميم المنتجات الجاهزة المتاحة؟'},
  'The range includes natural, microporous cooling, polymer, composite and cream-mask systems for face, eye and targeted-area care. The exact construction is confirmed during development.': {ru: 'Линейка включает натуральные, микропористые охлаждающие, полимерные, композитные и кремовые системы для лица, глаз и локальных зон. Точная конструкция утверждается при разработке.', ar: 'تشمل المجموعة أنظمة طبيعية ومبردة دقيقة المسام وبوليمرية ومركبة وكريمية للوجه والعين والمناطق الموضعية. ويُعتمد البناء الدقيق خلال التطوير.'},
  'Which brand files should I prepare?': {ru: 'Какие файлы бренда подготовить?', ar: 'ما ملفات العلامة التي ينبغي تجهيزها؟'},
  'A vector logo, colour references and current label or pack artwork are useful. Sensitive files should only be shared through a confirmed private channel.': {ru: 'Полезны векторный логотип, образцы цветов и текущие макеты этикетки или упаковки. Конфиденциальные файлы передавайте только по подтверждённому закрытому каналу.', ar: 'يفيد الشعار المتجهي ومراجع الألوان وتصميم الملصق أو العبوة الحالي. ولا تُشارك الملفات الحساسة إلا عبر قناة خاصة مؤكدة.'},
  'Can label and logo placement be adapted?': {ru: 'Можно изменить расположение этикетки и логотипа?', ar: 'هل يمكن تعديل موضع الملصق والشعار؟'},
  'Brand placement can be reviewed with the selected pack and labelling requirements. Final size and position follow approved artwork.': {ru: 'Размещение бренда рассматривается с учётом упаковки и маркировки. Итоговые размер и позиция следуют утверждённому макету.', ar: 'يُراجع موضع العلامة مع التغليف ومتطلبات الملصق. ويتبع الحجم والموضع النهائيان التصميم المعتمد.'},
  'What does an optional 3D preview confirm?': {ru: 'Что подтверждает дополнительный 3D-просмотр?', ar: 'ماذا تؤكد المعاينة ثلاثية الأبعاد الاختيارية؟'},
  'A 3D preview can communicate a visual direction, but it is not an engineering drawing, formula approval, colour proof or production sample.': {ru: '3D-просмотр передаёт визуальное направление, но не заменяет инженерный чертёж, утверждение формулы, цветопробу или производственный образец.', ar: 'تنقل المعاينة ثلاثية الأبعاد اتجاهاً بصرياً لكنها ليست رسماً هندسياً أو اعتماداً للتركيبة أو إثبات لون أو عينة إنتاج.'},
  'What is the easiest way to begin?': {ru: 'Как проще всего начать?', ar: 'ما أسهل طريقة للبدء؟'},
  'Start with a product family or SKU, intended use, expected quantity, target market and launch timing. An advisor can organise the remaining questions.': {ru: 'Начните с категории или SKU, назначения, количества, рынка и срока запуска. Консультант поможет с остальными вопросами.', ar: 'ابدأ بفئة المنتج أو SKU والاستخدام والكمية والسوق وموعد الإطلاق. وسينظم المستشار بقية الأسئلة.'},
  'What should I prepare for an enquiry?': {ru: 'Что подготовить для запроса?', ar: 'ماذا أجهز للاستفسار؟'},
  'The target product, intended use, market, quantity and preferred launch date are enough to begin. References are helpful but optional.': {ru: 'Для начала достаточно продукта, назначения, рынка, количества и желаемой даты запуска. Референсы полезны, но необязательны.', ar: 'يكفي المنتج والاستخدام والسوق والكمية وتاريخ الإطلاق المفضل للبدء. والمراجع مفيدة لكنها اختيارية.'},
  'What happens after product selection?': {ru: 'Что происходит после выбора продукта?', ar: 'ماذا يحدث بعد اختيار المنتج؟'},
  'The project moves through brief review, formula and format definition, sampling, document review, production confirmation and delivery.': {ru: 'Проект проходит проверку брифа, определение формулы и формата, образцы, документы, подтверждение производства и доставку.', ar: 'يمر المشروع بمراجعة الموجز وتحديد التركيبة والتصميم والعينات والوثائق وتأكيد الإنتاج والتسليم.'},
  'Do product images show the approved result?': {ru: 'Изображения показывают утверждённый результат?', ar: 'هل تعرض صور المنتج النتيجة المعتمدة؟'},
  'Images help identify the product and intended presentation. Formula feel, dimensions, colour and pack details must be confirmed with approved samples and documents.': {ru: 'Изображения помогают определить продукт и направление оформления. Ощущение формулы, размеры, цвет и упаковка подтверждаются образцами и документами.', ar: 'تساعد الصور على تحديد المنتج والمظهر المقصود. ويجب تأكيد ملمس التركيبة والأبعاد واللون والتغليف بالعينات والوثائق المعتمدة.'},
  'Can I request product samples?': {ru: 'Можно запросить образцы?', ar: 'هل يمكنني طلب عينات؟'},
  'Yes. Include the exact SKU and what you want to evaluate. An advisor will confirm sample availability, cost and timing.': {ru: 'Да. Укажите точный SKU и что хотите оценить. Консультант подтвердит наличие, стоимость и сроки.', ar: 'نعم. أضف SKU المحدد وما تريد تقييمه. وسيؤكد المستشار توفر العينة وتكلفتها وموعدها.'},
  'Can the product be supplied for my target market?': {ru: 'Можно поставлять продукт на мой рынок?', ar: 'هل يمكن توريد المنتج لسوقي المستهدف؟'},
  'Tell us the market first. Formula, testing, labelling and documentation requirements must be reviewed by the relevant people before confirmation.': {ru: 'Сначала укажите рынок. Требования к формуле, испытаниям, маркировке и документам должны проверить специалисты.', ar: 'أخبرنا بالسوق أولاً. يجب أن يراجع المختصون متطلبات التركيبة والاختبارات والملصق والوثائق قبل التأكيد.'},
  'How are samples, price and timing confirmed?': {ru: 'Как подтверждаются образцы, цена и сроки?', ar: 'كيف تُؤكد العينات والسعر والموعد؟'},
  'A person reviews specifications, samples, minimum order, pricing, timing and market requirements. The website does not make commercial commitments.': {ru: 'Специалист проверяет характеристики, образцы, минимальный заказ, цену, сроки и требования рынка. Сайт не даёт коммерческих обязательств.', ar: 'يراجع مختص المواصفات والعينات والحد الأدنى والسعر والموعد ومتطلبات السوق. ولا يقدم الموقع التزامات تجارية.'},
  'How should confidential details be shared?': {ru: 'Как передавать конфиденциальные данные?', ar: 'كيف تُشارك التفاصيل السرية؟'},
  'Use the public form only for basic project details. Share sensitive files and confidential terms through a private channel confirmed by an advisor.': {ru: 'В публичной форме указывайте только основные данные. Чувствительные файлы и условия передавайте по закрытому каналу, подтверждённому консультантом.', ar: 'استخدم النموذج العام لتفاصيل المشروع الأساسية فقط. وشارك الملفات الحساسة والشروط السرية عبر قناة خاصة يؤكدها المستشار.'},
  'How long are enquiry details retained?': {ru: 'Как долго хранятся данные запроса?', ar: 'كم مدة الاحتفاظ بتفاصيل الاستفسار؟'},
  'Enquiry details are retained for 12 months to support follow-up. Contact us from the original business email if you want earlier removal.': {ru: 'Данные запроса хранятся 12 месяцев для сопровождения. Для досрочного удаления напишите с исходной рабочей почты.', ar: 'تُحفظ تفاصيل الاستفسار 12 شهراً للمتابعة. تواصل معنا من بريد العمل الأصلي إذا أردت حذفها مبكراً.'},
  'Can I update an enquiry after submitting?': {ru: 'Можно обновить запрос после отправки?', ar: 'هل يمكن تحديث الاستفسار بعد إرساله؟'},
  'Yes. Submit the updated SKU or requirements, or reply with the enquiry reference so an advisor can continue from the latest version.': {ru: 'Да. Отправьте обновлённый SKU или требования либо ответьте с номером запроса, чтобы консультант продолжил с последней версией.', ar: 'نعم. أرسل SKU أو المتطلبات المحدثة، أو رد بمرجع الاستفسار ليواصل المستشار من أحدث نسخة.'},
  'What if the enquiry status cannot load?': {ru: 'Что делать, если статус не загружается?', ar: 'ماذا لو لم تُحمّل حالة الاستفسار؟'},
  'Keep the enquiry reference and try the status link again. If it still fails, contact us so a person can continue the request.': {ru: 'Сохраните номер запроса и снова откройте ссылку статуса. Если ошибка останется, свяжитесь с нами для ручного продолжения.', ar: 'احتفظ بمرجع الاستفسار وجرّب رابط الحالة مرة أخرى. وإذا استمر الفشل فتواصل معنا ليتابع شخص الطلب.'},
  'How will an advisor contact me?': {ru: 'Как со мной свяжется консультант?', ar: 'كيف سيتواصل معي المستشار؟'},
  'After submission, an advisor will continue through the work email you provide and confirm samples, commercial terms and next steps.': {ru: 'После отправки консультант напишет на указанную рабочую почту и подтвердит образцы, условия и дальнейшие шаги.', ar: 'بعد الإرسال سيتابع المستشار عبر بريد العمل الذي تقدمه ويؤكد العينات والشروط التجارية والخطوات التالية.'}
};

const text = (en: string, zh: string, fr: string, es: string, ru = en, ar = en): LocalizedText => ({
  en,
  zh,
  fr,
  es,
  ru: ru === en ? (mailAgentTranslations[en]?.ru ?? en) : ru,
  ar: ar === en ? (mailAgentTranslations[en]?.ar ?? en) : ar
});
const localizedKeywords: Record<string, string[]> = {
  'product-range': ['продукт', 'каталог', 'маск', 'منتج', 'كتالوج', 'قناع', 'أقنعة'],
  'configurable-capacity': ['размер', 'объём', 'вес', 'габарит', 'حجم', 'وزن', 'أبعاد', 'سعة'],
  'configurable-material': ['материал', 'гидрогел', 'формул', 'مادة', 'هيدروجيل', 'تركيبة'],
  'configurable-colour': ['цвет', 'оттенок', 'لون', 'درجة اللون'],
  'finish-options': ['формат', 'текстур', 'نوع المنتج', 'قوام'],
  'logo-file': ['логотип', 'макет', 'вектор', 'شعار', 'ملف التصميم'],
  'logo-position': ['расположение логотипа', 'этикетк', 'موضع الشعار', 'ملصق'],
  'three-d-preview': ['3d', '360', 'визуализац', 'трёхмер', 'معاينة', 'ثلاثي الأبعاد'],
  'project-start': ['начать проект', 'с чего начать', 'بدء المشروع', 'كيف أبدأ'],
  'required-brief': ['что подготовить', 'техническое задание', 'ماذا أجهز', 'موجز'],
  'six-step-process': ['процесс', 'следующий шаг', 'العملية', 'الخطوة التالية'],
  'product-images': ['изображен', 'фото', 'صورة', 'صور'],
  'sample-reference': ['образец', 'пробник', 'عينة', 'عينات'],
  'market-use': ['целевой рынок', 'страна', 'السوق المستهدف', 'الدولة'],
  'human-review': ['проверит специалист', 'ручная проверка', 'مراجعة بشرية', 'مستشار'],
  confidentiality: ['конфиденциаль', 'nda', 'سري', 'سرية'],
  'privacy-retention': ['конфиденциальность', 'хранение данных', 'خصوصية', 'الاحتفاظ بالبيانات'],
  'revise-inquiry': ['изменить запрос', 'обновить запрос', 'تعديل الاستفسار', 'تحديث الطلب'],
  'job-status-retry': ['статус', 'повторить', 'الحالة', 'إعادة المحاولة'],
  'sales-follow-up': ['связаться со мной', 'консультант', 'تواصل معي', 'متابعة المبيعات']
};
const preset = (id: string, category: MailAgentPreset['category'], question: LocalizedText, answer: LocalizedText, keywords: string[]): MailAgentPreset => ({
  id,
  category,
  question,
  answer,
  keywords: [...keywords, ...(localizedKeywords[id] ?? [])]
});

export const mailAgentPresets: MailAgentPreset[] = [
  preset('product-range', 'catalogue',
    text('Which finished products can I browse?', '可以浏览哪些成品？', 'Quels produits finis puis-je consulter ?', '¿Qué productos terminados puedo consultar?'),
    text('The catalogue covers face masks, eye masks and targeted hydrogel patches. Choose a product family or an exact SKU to begin.', '现有产品覆盖面膜、眼膜，以及唇膜、颈膜、额头贴、法令纹贴与下颌贴等局部护理产品。每款均可查看成分、规格、包装和参考起订量。', 'Le catalogue comprend des masques visage, yeux et des patchs hydrogel ciblés. Commencez par une famille ou un SKU précis.', 'El catálogo incluye mascarillas faciales, de ojos y parches de hidrogel localizados. Empieza por una familia o SKU concreto.'),
    ['product range', 'products', 'catalogue', 'mask', '产品', '品类', 'produits', 'productos']),
  preset('configurable-capacity', 'configuration',
    text('Which weights or sizes are available?', '有哪些净含量或尺寸？', 'Quels poids ou formats sont disponibles ?', '¿Qué pesos o tamaños están disponibles?'),
    text('Each product page lists its current net weight. Shape, dimensions and filling format are reviewed during sampling before any production commitment.', '每款产品均列有参考净含量；膜体形状、尺寸与灌装方式，可在打样时结合品牌需求确认。', 'Chaque fiche indique le poids net actuel. La forme, les dimensions et le conditionnement sont revus lors de l’échantillonnage.', 'Cada ficha indica el peso neto actual. La forma, las dimensiones y el llenado se revisan durante el muestreo.'),
    ['capacity', 'capacities', 'size', 'sizes', 'weight', 'dimension', '容量', '尺寸', '净含量', 'format', 'tamaño']),
  preset('configurable-material', 'configuration',
    text('Can the gel or mask substrate be customised?', '凝胶或膜体可以定制吗？', 'Le gel ou le support du masque peut-il être personnalisé ?', '¿Se puede personalizar el gel o el soporte?'),
    text('Formula direction, gel feel and mask substrate can be discussed for OEM/ODM development. Feasibility is confirmed through technical review and samples.', '配方、凝胶触感与膜体材料均可围绕品牌需求沟通，具体可行性通过技术评估与实物样品确认。', 'La formule, la sensation du gel et le support peuvent être étudiés en OEM/ODM, sous réserve de revue technique et d’échantillons.', 'La fórmula, la sensación del gel y el soporte pueden estudiarse en OEM/ODM, sujetos a revisión técnica y muestras.'),
    ['material', 'substrate', 'hydrogel', 'formula', '材质', '膜布', '凝胶', 'support', 'sustrato']),
  preset('configurable-colour', 'configuration',
    text('Can product colour be customised?', '产品颜色可以定制吗？', 'La couleur du produit peut-elle être personnalisée ?', '¿Se puede personalizar el color?'),
    text('Colour direction can be discussed where the formula and format allow it. The approved physical sample defines the production reference.', '在配方与膜型允许的情况下，凝胶颜色可以结合品牌视觉调整，并以品牌确认的实物样品作为生产参考。', 'La couleur peut être étudiée si la formule et le format le permettent. L’échantillon approuvé sert de référence.', 'El color puede estudiarse si la fórmula y el formato lo permiten. La muestra aprobada define la referencia.'),
    ['color', 'colour', 'swatch', '颜色', '色样', 'couleur', 'color']),
  preset('finish-options', 'configuration',
    text('Which finished-product formats can I explore?', '可以了解哪些成品形态？', 'Quels formats de produits finis puis-je étudier ?', '¿Qué formatos de producto terminado puedo explorar?'),
    text('The range includes natural, microporous cooling, polymer, composite and cream-mask systems for face, eye and targeted-area care. The exact construction is confirmed during development.', '可选天然水凝胶、微孔冰导凝胶、高分子凝胶、复合凝胶与膏状膜。不同材质会带来不同的贴合、清凉、柔润与造型表现，最终可通过样品亲自比较。', 'La gamme couvre hydrogel naturel, gel microporeux frais, polymère, composite et masque crème pour le visage, les yeux et les zones ciblées.', 'La gama cubre hidrogel natural, gel microporoso frío, polimérico, compuesto y mascarilla en crema para rostro, ojos y zonas localizadas.'),
    ['format', 'finish', 'sheet', 'cream', 'hydrogel', '形态', '膏状', '片状', 'formato']),
  preset('logo-file', 'files',
    text('Which brand files should I prepare?', '需要准备哪些品牌文件？', 'Quels fichiers de marque dois-je préparer ?', '¿Qué archivos de marca debo preparar?'),
    text('A vector logo, colour references and current label or pack artwork are useful. Sensitive files should only be shared through a confirmed private channel.', '矢量 Logo、品牌色与现有标签或包装稿件有助于开始。敏感文件请通过确认的私密渠道提供。', 'Un logo vectoriel, les couleurs de marque et les fichiers d’étiquette sont utiles. Les fichiers sensibles passent par un canal privé confirmé.', 'Un logotipo vectorial, colores de marca y artes de etiqueta son útiles. Los archivos sensibles deben compartirse por un canal privado confirmado.'),
    ['logo file', 'artwork', 'vector', 'label', 'logo文件', '稿件', 'fichier', 'archivo']),
  preset('logo-position', 'configuration',
    text('Can label and logo placement be adapted?', '标签与 Logo 位置可以调整吗？', 'Le placement de l’étiquette et du logo peut-il être adapté ?', '¿Se puede adaptar la posición de etiqueta y logotipo?'),
    text('Brand placement can be reviewed with the selected pack and labelling requirements. Final size and position follow approved artwork.', '品牌位置会结合所选包装与标签要求评估，最终尺寸与位置以确认稿件为准。', 'Le placement est revu avec l’emballage et les exigences d’étiquetage. Les dimensions finales suivent le fichier approuvé.', 'La ubicación se revisa con el empaque y el etiquetado. El tamaño final sigue el arte aprobado.'),
    ['logo position', 'logo placement', 'label', 'logo位置', '标签', 'placement', 'posición']),
  preset('three-d-preview', 'configuration',
    text('What does an optional 3D preview confirm?', '可选 3D 预览能确认什么？', 'Que confirme un aperçu 3D optionnel ?', '¿Qué confirma una vista 3D opcional?'),
    text('A 3D preview can communicate a visual direction, but it is not an engineering drawing, formula approval, colour proof or production sample.', '3D 预览可用于沟通视觉方向，但不等同于工程图、配方批准、色样或量产样品。', 'Un aperçu 3D exprime une direction visuelle, sans remplacer un plan technique, une validation de formule, une épreuve couleur ou un échantillon.', 'Una vista 3D comunica una dirección visual, pero no sustituye un plano técnico, aprobación de fórmula, prueba de color o muestra.'),
    ['3d', '360', 'preview', 'render', '预览', '模型', 'aperçu', 'vista']),
  preset('project-start', 'workflow',
    text('What is the easiest way to begin?', '怎么开始最简单？', 'Quelle est la façon la plus simple de commencer ?', '¿Cuál es la forma más sencilla de empezar?'),
    text('Start with a product family or SKU, intended use, expected quantity, target market and launch timing. An advisor can organise the remaining questions.', '有产品类别、参考图片、预计数量或目标市场中的任意几项，就可以开始沟通。如果信息还不完整，我们会在回复中说明需要补充的内容。', 'Commencez par une famille ou un SKU, l’usage, la quantité, le marché et le calendrier.', 'Empieza por una familia o SKU, el uso, la cantidad, el mercado y los plazos.'),
    ['start project', 'begin', '开始项目', '怎么开始', 'commencer', 'empezar']),
  preset('required-brief', 'workflow',
    text('What should I prepare for an enquiry?', '询盘前需要准备什么？', 'Que dois-je préparer pour une demande ?', '¿Qué debo preparar para una consulta?'),
    text('The target product, intended use, market, quantity and preferred launch date are enough to begin. References are helpful but optional.', '产品类型、希望呈现的护理体验、目标市场、预计数量与上市时间，足以让顾问给出第一轮建议；没有参考图片也不影响沟通。', 'Le produit, l’usage, le marché, la quantité et la date souhaitée suffisent pour commencer.', 'El producto, uso, mercado, cantidad y fecha prevista son suficientes para empezar.'),
    ['information needed', 'prepare', 'brief', '需要资料', '准备什么', 'préparer', 'preparar']),
  preset('six-step-process', 'workflow',
    text('What happens after product selection?', '选好产品后会怎么进行？', 'Que se passe-t-il après la sélection ?', '¿Qué ocurre después de elegir el producto?'),
    text('The project moves through brief review, formula and format definition, sampling, document review, production confirmation and delivery.', '产品需求确认后，会形成配方与膜型方案并制作实物样品；品牌确认样品、包装与订单信息后，再进入生产、检查与交付。', 'Le projet passe par la revue du brief, la définition de formule et format, les échantillons, les documents, la production et la livraison.', 'El proyecto pasa por revisión, fórmula y formato, muestras, documentos, producción y entrega.'),
    ['process', 'workflow', 'next step', '流程', '下一步', 'processus', 'proceso']),
  preset('product-images', 'catalogue',
    text('Do product images show the approved result?', '产品图片是最终确认效果吗？', 'Les images montrent-elles le résultat approuvé ?', '¿Las imágenes muestran el resultado aprobado?'),
    text('Images help identify the product and intended presentation. Formula feel, dimensions, colour and pack details must be confirmed with approved samples and documents.', '产品图片呈现实物外观与包装参考；配方肤感、尺寸、颜色与包装细节，以品牌确认的样品和文件为准。', 'Les images identifient le produit. La sensation, les dimensions, la couleur et l’emballage suivent les échantillons approuvés.', 'Las imágenes identifican el producto. Sensación, dimensiones, color y empaque siguen las muestras aprobadas.'),
    ['image', 'photo', 'final result', '图片', '实拍', 'image', 'foto']),
  preset('sample-reference', 'workflow',
    text('Can I request product samples?', '可以申请产品样品吗？', 'Puis-je demander des échantillons ?', '¿Puedo solicitar muestras?'),
    text('Yes. Include the exact SKU and what you want to evaluate. An advisor will confirm sample availability, cost and timing.', '可以。欢迎提供产品编号和希望比较的内容，我们会确认可选样品、费用与时间。', 'Oui. Indiquez le SKU et les points à évaluer. Un conseiller confirmera disponibilité, coût et délai.', 'Sí. Indica el SKU y qué deseas evaluar. Un asesor confirmará disponibilidad, coste y plazos.'),
    ['sample', 'prototype', '样品', '打样', 'échantillon', 'muestra']),
  preset('market-use', 'service',
    text('Can the product be supplied for my target market?', '产品可以供应到目标市场吗？', 'Le produit peut-il être fourni sur mon marché cible ?', '¿Se puede suministrar el producto a mi mercado?'),
    text('Tell us the market first. Formula, testing, labelling and documentation requirements must be reviewed by the relevant people before confirmation.', '目标市场会影响配方、检测、标签与文件要求。提供计划销售的国家或地区后，相关要求会由对应人员评估确认。', 'Indiquez d’abord le marché. Formule, tests, étiquetage et documents doivent être revus avant confirmation.', 'Indica primero el mercado. La fórmula, pruebas, etiquetado y documentos deben revisarse antes de confirmar.'),
    ['target market', 'country', 'market use', '目标市场', '国家', 'marché', 'mercado']),
  preset('human-review', 'workflow',
    text('How are samples, price and timing confirmed?', '样品、价格与时间怎么确认？', 'Comment confirmer échantillons, prix et délais ?', '¿Cómo se confirman muestras, precio y plazos?'),
    text('A person reviews specifications, samples, minimum order, pricing, timing and market requirements. The website does not make commercial commitments.', '样品、起订量、价格、交期与目标市场要求，都需要结合具体产品核实，并以书面确认结果为准。', 'Une personne examine spécifications, échantillons, minimums, prix, délais et marché. Le site ne prend aucun engagement commercial.', 'Una persona revisa especificaciones, muestras, mínimos, precios, plazos y mercado. El sitio no asume compromisos comerciales.'),
    ['human review', 'manual review', '人工确认', '谁审核', 'validation humaine', 'revisión humana']),
  preset('confidentiality', 'service',
    text('How should confidential details be shared?', '保密资料应该如何提供？', 'Comment partager des informations confidentielles ?', '¿Cómo compartir información confidencial?'),
    text('Use the public form only for basic project details. Share sensitive files and confidential terms through a private channel confirmed by an advisor.', '公开表单只填写基础需求，敏感文件与保密条款请通过顾问确认的私密渠道传递。', 'Utilisez le formulaire public pour les informations de base et un canal privé confirmé pour les fichiers sensibles.', 'Usa el formulario público para datos básicos y un canal privado confirmado para archivos sensibles.'),
    ['confidential', 'nda', '保密', '机密', 'confidentiel', 'confidencial']),
  preset('privacy-retention', 'service',
    text('How long are enquiry details retained?', '询盘信息保留多久？', 'Combien de temps les demandes sont-elles conservées ?', '¿Cuánto tiempo se conservan las consultas?'),
    text('Enquiry details are retained for 12 months to support follow-up. Contact us from the original business email if you want earlier removal.', '询盘信息默认保留 12 个月以便跟进，如需提前删除，请使用原工作邮箱联系。', 'Les demandes sont conservées 12 mois. Utilisez l’e-mail professionnel d’origine pour demander une suppression anticipée.', 'Las consultas se conservan 12 meses. Usa el correo de trabajo original para solicitar una eliminación anticipada.'),
    ['privacy', 'retention', 'delete data', '隐私', '保留多久', 'confidentialité', 'privacidad']),
  preset('revise-inquiry', 'workflow',
    text('Can I update an enquiry after submitting?', '提交后可以修改询盘吗？', 'Puis-je modifier une demande après l’envoi ?', '¿Puedo modificar una consulta después de enviarla?'),
    text('Yes. Submit the updated SKU or requirements, or reply with the enquiry reference so an advisor can continue from the latest version.', '可以。您可以提交更新后的产品编号或需求，也可以凭询盘编号说明变更。', 'Oui. Envoyez le SKU ou les exigences mis à jour, ou répondez avec la référence de la demande.', 'Sí. Envía el SKU o requisitos actualizados, o responde con la referencia de la consulta.'),
    ['revise', 'change inquiry', 'update', '修改询盘', '更新', 'modifier', 'modificar']),
  preset('job-status-retry', 'workflow',
    text('What if the enquiry status cannot load?', '询盘状态无法加载怎么办？', 'Que faire si le statut ne se charge pas ?', '¿Qué hago si el estado no carga?'),
    text('Keep the enquiry reference and try the status link again. If it still fails, contact us so a person can continue the request.', '请保留询盘编号并重试状态链接。如仍失败，请联系我们由人工继续处理。', 'Conservez la référence et réessayez le lien. Si le problème persiste, contactez-nous.', 'Guarda la referencia y vuelve a probar el enlace. Si falla, contáctanos.'),
    ['status', 'retry', 'failed', '状态', '重试', '失败', 'statut', 'estado']),
  preset('sales-follow-up', 'service',
    text('How will an advisor contact me?', '顾问会如何联系我？', 'Comment un conseiller me contactera-t-il ?', '¿Cómo me contactará un asesor?'),
    text('After submission, an advisor will continue through the work email you provide and confirm samples, commercial terms and next steps.', '提交后，我们会通过您留下的工作邮箱联系，并确认样品、商务条件与后续安排。', 'Après l’envoi, un conseiller vous contactera par l’e-mail professionnel fourni.', 'Tras el envío, un asesor continuará por el correo de trabajo indicado.'),
    ['sales follow up', 'contact me', '顾问联系', '销售跟进', 'contact', 'contacto'])
];

export const escalationRules = [
  {id: 'pricing', pattern: /price|pricing|quotation|prix|precio|报价|价格|цен[аы]|стоимост|سعر|أسعار|عرض سعر/i},
  {id: 'discount', pattern: /discount|remise|descuento|折扣|优惠|скидк|خصم/i},
  {id: 'moq', pattern: /\bmoq\b|minimum order|quantité minimale|pedido mínimo|起订|минимальн.*заказ|الحد الأدنى.*طلب/i},
  {id: 'lead_time', pattern: /lead[ -]?time|delivery date|délai|plazo|交期|交货|срок|дата поставки|مدة التوريد|موعد التسليم/i},
  {id: 'payment', pattern: /payment|paiement|pago|付款|账期|оплат|دفع/i},
  {id: 'bank', pattern: /bank|banque|banco|account number|银行|账户|банк|банков|بنك|حساب/i},
  {id: 'contract', pattern: /contract|agreement|contrat|contrato|合同|协议|договор|контракт|عقد|اتفاق/i},
  {id: 'refund', pattern: /refund|chargeback|remboursement|reembolso|退款|возврат|استرداد/i},
  {id: 'legal', pattern: /legal|lawyer|lawsuit|juridique|abogado|法律|律师|诉讼|юрист|суд|محام|قانون/i},
  {id: 'certification', pattern: /certif|certificate|certificat|certificado|认证|证书|сертифик|شهاد/i},
  {id: 'efficacy_claim', pattern: /efficacy|claim|cure|treat|efficacité|curar|功效|宣称|治疗|эффектив|леч|فعالي|علاج/i},
  {id: 'prompt_injection', pattern: /ignore (all |any )?(previous|prior) instructions|reveal (the )?(system|developer) prompt|system prompt|忽略.*指令|泄露.*提示|系统提示|игнорируй.*инструкц|покажи.*системн.*промпт|تجاهل.*تعليمات|اعرض.*موجه.*النظام/i}
] as const;

export type MailAgentAssessment = {
  decision: InboundMailDecision;
  matchedPresetId?: string;
  notifyHuman: boolean;
  reasons: string[];
};

export type InboundMailReply = MailAgentAssessment & {subject: string; body: string};

export function assessInboundMail(message: {subject: string; body: string; hasAttachments: boolean; confidence?: number}): MailAgentAssessment {
  const content = `${message.subject}\n${message.body}`;
  const reasons = escalationRules.filter((rule) => rule.pattern.test(content)).map((rule) => rule.id as string);
  if (message.hasAttachments) reasons.push('attachment');
  if ((message.confidence ?? 1) < 0.82) reasons.push('low_confidence');
  if (reasons.length > 0) return {decision: 'safe_acknowledgement', notifyHuman: true, reasons};

  const normalized = content.toLocaleLowerCase();
  const match = mailAgentPresets
    .map((item) => ({item, score: item.keywords.filter((keyword) => normalized.includes(keyword.toLocaleLowerCase())).length}))
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
  if (!match) return {decision: 'safe_acknowledgement', notifyHuman: true, reasons: ['no_approved_preset']};
  return {decision: 'substantive_auto_reply', matchedPresetId: match.id, notifyHuman: false, reasons: []};
}

export function buildInboundMailReply(message: {subject: string; body: string; hasAttachments: boolean; confidence?: number}, locale: Locale): InboundMailReply {
  const assessment = assessInboundMail(message);
  const copy: Record<Locale, {received: string; followup: string; acknowledgement: string}> = {
    en: {received: 'Received', followup: 'An advisor will confirm final specifications, samples, commercial terms and timing with you.', acknowledgement: 'We received your email. A person will review the request and continue in the original thread.'},
    zh: {received: '已收到', followup: '我们会继续与您确认最终规格、样品、商务条件与时间。', acknowledgement: '我们已收到邮件，并会在原邮件中继续回复。'},
    fr: {received: 'Reçu', followup: 'Un conseiller confirmera avec vous les spécifications, échantillons, conditions commerciales et délais.', acknowledgement: 'Nous avons reçu votre e-mail. Une personne examinera la demande et poursuivra dans le fil initial.'},
    es: {received: 'Recibido', followup: 'Un asesor confirmará contigo las especificaciones, muestras, condiciones comerciales y plazos.', acknowledgement: 'Hemos recibido tu correo. Una persona revisará la solicitud y continuará en el hilo original.'},
    ru: {received: 'Получено', followup: 'Консультант подтвердит окончательные характеристики, образцы, коммерческие условия и сроки.', acknowledgement: 'Мы получили ваше письмо. Специалист рассмотрит запрос и продолжит общение в исходной переписке.'},
    ar: {received: 'تم الاستلام', followup: 'سيؤكد المستشار المواصفات النهائية والعينات والشروط التجارية والمواعيد معك.', acknowledgement: 'استلمنا رسالتك. سيراجع أحد المختصين الطلب ويتابع في المحادثة الأصلية.'}
  };
  const localized = copy[locale];
  const subject = `${localized.received} | ${message.subject.slice(0, 100)}`;
  if (assessment.decision === 'substantive_auto_reply' && assessment.matchedPresetId) {
    const selected = mailAgentPresets.find((item) => item.id === assessment.matchedPresetId);
    if (selected) return {...assessment, subject, body: `${selected.answer[locale]}\n\n${localized.followup}`};
  }
  return {...assessment, subject, body: localized.acknowledgement};
}
