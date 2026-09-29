import type {Locale} from '@/lib/routing';
import {brochureSiteCopy} from '@/data/brochure-site-copy';

type SiteCopy = {
  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  primary: string;
  secondary: string;
  heroHighlights: string[];
  featured: string;
  featuredTitle: string;
  featureBody: string;
  viewAll: string;
  families: string;
  familiesTitle: string;
  modes: Array<[string, string, string]>;
  gelCapability: {eyebrow: string; title: string; body: string; items: Array<[string, string]>};
  factory: {eyebrow: string; title: string; body: string; captions: string[]};
  process: string;
  processTitle: string;
  evidence: string;
  evidenceTitle: string;
  evidenceBody: string;
  evidenceItems: Array<[string, string]>;
  partnership: {
    eyebrow: string;
    title: string;
    body: string;
    aside: string;
    markets: string[];
    cardEyebrow: string;
    cardTitle: string;
    caption: string;
  };
  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
};

const copy = {
  en: {
    eyebrow: 'HYDROGEL MASKS · GUANGZHOU',
    heroTitle: 'Made to fit the skin.\nMade to fit your brand.',
    heroBody: 'Explore 21 finished products and 41 documented hydrogel formats across face masks, eye masks and targeted-area patches. Then talk with us about formula, shape, packaging and samples.',
    primary: 'Browse 21 products',
    secondary: 'Request samples',
    heroHighlights: ['21 finished product concepts', '41 technical formats', '5 material systems', 'Samples & quotations'],
    featured: 'FEATURED MASKS',
    featuredTitle: 'Three popular ways to begin.',
    featureBody: 'Compare the product, ingredients, net weight and minimum order. When one feels close, we can help adapt it for your brand.',
    viewAll: 'See all 21 products',
    families: 'SHOP BY AREA',
    familiesTitle: 'Find the right format for the skin area you want to care for.',
    modes: [
      ['01', 'Face & cream masks', 'Collagen, soothing, brightening and cooling options for facial care.'],
      ['02', 'Eye masks', 'Hydrogel eye masks in red, gold, pink, blue and clear finishes.'],
      ['03', 'Targeted-area patches', 'Lip, neck, forehead, nasolabial, jawline and multi-zone hydrogel formats.']
    ],
    gelCapability: {
      eyebrow: 'HYDROGEL EXPERTISE',
      title: 'Soft, close-fitting gel with room for your own idea.',
      body: 'Showki develops 41 documented hydrogel formats for the face, eyes, lips, neck, forehead and jawline. Colour, shape and ingredient direction can be tailored and confirmed through samples.',
      items: [
        ['Formats', 'Face · eye · lip · neck · forehead · jawline'],
        ['Look & feel', 'Colour, shape, thickness and surface finish'],
        ['Formula direction', 'Hydration, soothing, firming and brightening options']
      ]
    },
    factory: {
      eyebrow: 'INSIDE SHOWKI',
      title: 'Hydrogel know-how, carried through to production.',
      body: 'Formulation, forming, filling, inspection and packing are brought together so your sample and finished order stay true to the same product idea.',
      captions: ['Production', 'Quality inspection', 'Packing & assembly']
    },
    process: 'WORKING TOGETHER',
    processTitle: 'From the first idea to a finished mask.',
    evidence: 'WHY SHOWKI',
    evidenceTitle: 'A focused hydrogel partner for skincare brands.',
    evidenceBody: 'Begin with an existing product or bring a new direction. Our team can help with the gel format, formula, packaging, samples and production.',
    evidenceItems: [
      ['Product choice', '21 finished products across three clear product groups.'],
      ['Hydrogel range', '41 documented formats across five material systems.'],
      ['Practical support', 'Samples, packaging discussion and quotation in one conversation.']
    ],
    partnership: {
      eyebrow: 'BUILT FOR BEAUTY BRANDS',
      title: 'Develop in Guangzhou. Launch in your market.',
      body: 'Tell us where you plan to sell and how you want the product to feel. We will help you choose a suitable mask, pack format and sample option.',
      aside: 'GUANGZHOU · CHINA\nGLOBAL BRAND SUPPORT',
      markets: ['North America', 'Europe', 'Asia', 'Oceania'],
      cardEyebrow: 'SHOWKI BIOTECH',
      cardTitle: 'Hydrogel masks for skincare brands',
      caption: 'GUANGZHOU · CHINA'
    },
    finalEyebrow: 'START YOUR MASK PROJECT',
    finalTitle: 'Which mask would you like to try first?',
    finalBody: 'Choose a product, request samples or send us a reference. We will continue from there.'
  },
  zh: {
    eyebrow: '水凝膜研发与生产 · 广州',
    heroTitle: '为您的品牌，做好每一款。',
    heroBody: '从面膜、眼膜到唇膜、颈膜和局部护理贴，膜型、配方、颜色与包装均可围绕品牌需求开发。欢迎申请样品，亲自感受贴合度、肤感与产品呈现。',
    primary: '浏览水凝膜产品',
    secondary: '申请产品样品',
    heroHighlights: ['柔软贴合的凝胶肤感', '多种护理部位与造型', '配方与包装可调整', '以实物样品确认'],
    featured: '人气水凝膜',
    featuredTitle: '让颜色、触感和贴合度，替产品留下第一印象。',
    featureBody: '胶原、积雪草、胜肽等成分方向，搭配不同凝胶颜色与膜型，让新品既有看得见的卖点，也有贴得出来的肤感。',
    viewAll: '查看全部 21 款产品',
    families: '覆盖不同护理部位',
    familiesTitle: '从全脸到局部，做出更准确的护理体验。',
    modes: [
      ['01', '面部与膏状面膜', '柔软贴合、清凉包裹或丰润滋养，让补水、舒缓、焕亮等卖点真正落到肤感上。'],
      ['02', '眼膜', '红、金、粉、蓝及透明凝胶，让眼周护理兼具肤感、造型与货架辨识度。'],
      ['03', '其他局部膜贴', '唇膜、颈膜、额头贴、法令纹贴与下颌贴，让护理部位本身成为产品亮点。']
    ],
    gelCapability: {
      eyebrow: '水凝胶专长',
      title: '好肤感，也有品牌辨识度。',
      body: '41 种膜型覆盖面部、眼周、唇部、颈部、额头与下颌等护理部位。颜色、形状、厚度和成分组合均可围绕产品需求沟通，并通过实物样品确认。',
      items: [
        ['护理部位', '面部 · 眼周 · 唇部 · 颈部 · 额头 · 下颌'],
        ['第一眼印象', '颜色、造型、厚度与表面效果'],
        ['贴敷体验', '贴合、清凉、柔润与精华承载感']
      ]
    },
    factory: {
      eyebrow: '走进修齐',
      title: '把品质，做好每一批。',
      body: '从凝胶配制、成型与灌装，到成品检查和包装，均围绕确认样品落实，让消费者收到的产品更接近品牌认可的质地与呈现。',
      captions: ['生产', '品质检查', '包装与组装']
    },
    process: '合作方式',
    processTitle: '先试样品，再决定配方、膜型与包装。',
    evidence: '为什么选择修齐',
    evidenceTitle: '选得出好样品，也做得稳每一批。',
    evidenceBody: '成熟产品让品牌尽早感受实物，丰富膜型为新品留下差异空间；确认样品也会继续作为生产与品质检查的重要参考。',
    evidenceItems: [
      ['看得见，摸得到', '21 款现有产品覆盖面膜、眼膜与其他局部膜贴，均可咨询实物样品。'],
      ['做出品牌差异', '41 种膜型横跨五类凝胶材质，让造型、肤感与护理部位拥有更多可能。'],
      ['合作更有把握', '从样品、规格和包装，到报价、交期与量产要求，都以双方确认结果为准。']
    ],
    partnership: {
      eyebrow: '服务美妆品牌',
      title: '从广州，走向您的市场。',
      body: '无论面向北美、欧洲、亚洲还是大洋洲，我们都会结合目标市场、销售场景与品牌表达，沟通更合适的产品、包装和样品方案。',
      aside: '中国 · 广州\n品牌项目支持',
      markets: ['北美', '欧洲', '亚洲', '大洋洲'],
      cardEyebrow: '修齐生物',
      cardTitle: '为护肤品牌开发水凝胶面膜',
      caption: '中国 · 广州'
    },
    finalEyebrow: '为品牌开发水凝膜',
    finalTitle: '想让下一款水凝膜，更像您的品牌？',
    finalBody: '欢迎申请现有产品样品，或分享希望实现的膜型、肤感与包装。带上预计数量和目标市场，即可进一步咨询报价与交期。'
  },
  fr: {
    eyebrow: 'MASQUES HYDROGEL · GUANGZHOU',
    heroTitle: 'Pensés pour la peau.\nCréés pour votre marque.',
    heroBody: 'Découvrez 21 produits finis et 41 formats hydrogel documentés pour le visage, les yeux et les zones ciblées. Échangeons ensuite sur la formule, la forme, l’emballage et les échantillons.',
    primary: 'Voir les 21 produits',
    secondary: 'Demander des échantillons',
    heroHighlights: ['21 concepts finis', '41 formats techniques', '5 systèmes matière', 'Échantillons et devis'],
    featured: 'MASQUES À DÉCOUVRIR',
    featuredTitle: 'Trois façons simples de commencer.',
    featureBody: 'Produit, ingrédients, poids net et quantité minimale sont indiqués clairement. Nous pouvons ensuite adapter le modèle choisi à votre marque.',
    viewAll: 'Voir les 21 produits',
    families: 'PAR ZONE DE SOIN',
    familiesTitle: 'Trouvez le format adapté à la zone que vous souhaitez choyer.',
    modes: [
      ['01', 'Masques visage et crème', 'Collagène, apaisement, éclat et fraîcheur pour le soin du visage.'],
      ['02', 'Patchs pour les yeux', 'Des hydrogels rouges, dorés, roses, bleus ou transparents.'],
      ['03', 'Patchs ciblés', 'Formats pour lèvres, cou, front, sillons nasogéniens, mâchoire et zones combinées.']
    ],
    gelCapability: {
      eyebrow: 'SAVOIR-FAIRE HYDROGEL',
      title: 'Un gel souple et confortable, à l’image de votre marque.',
      body: 'Showki documente 41 formats hydrogel pour le visage, les yeux, les lèvres, le cou, le front et la mâchoire. Couleur, forme et ingrédients sont confirmés sur échantillon.',
      items: [
        ['Formats', 'Visage · yeux · lèvres · cou · front · mâchoire'],
        ['Aspect & toucher', 'Couleur, forme, épaisseur et finition'],
        ['Orientation', 'Hydratation, apaisement, fermeté et éclat']
      ]
    },
    factory: {
      eyebrow: 'CHEZ SHOWKI',
      title: 'Le savoir-faire hydrogel, jusqu’à la production.',
      body: 'Formulation, mise en forme, remplissage, contrôle et conditionnement sont réunis pour préserver l’esprit du produit choisi.',
      captions: ['Production', 'Contrôle qualité', 'Conditionnement']
    },
    process: 'TRAVAILLER ENSEMBLE',
    processTitle: 'De la première idée au masque fini.',
    evidence: 'POURQUOI SHOWKI',
    evidenceTitle: 'Un partenaire hydrogel dédié aux marques de soin.',
    evidenceBody: 'Partez d’un produit existant ou apportez une nouvelle idée. Notre équipe vous accompagne sur le gel, la formule, l’emballage, les échantillons et la production.',
    evidenceItems: [
      ['Choix produits', '21 produits finis répartis en trois groupes.'],
      ['Gamme hydrogel', '41 formats documentés et cinq systèmes matière.'],
      ['Accompagnement', 'Échantillons, emballage et devis dans un même échange.']
    ],
    partnership: {
      eyebrow: 'POUR LES MARQUES DE BEAUTÉ',
      title: 'Développé à Guangzhou. Prêt pour votre marché.',
      body: 'Indiquez-nous votre marché et l’expérience recherchée. Nous vous aiderons à choisir le masque, l’emballage et les échantillons adaptés.',
      aside: 'GUANGZHOU · CHINE\nACCOMPAGNEMENT INTERNATIONAL',
      markets: ['Amérique du Nord', 'Europe', 'Asie', 'Océanie'],
      cardEyebrow: 'SHOWKI BIOTECH',
      cardTitle: 'Des masques hydrogel pour les marques de soin',
      caption: 'GUANGZHOU · CHINE'
    },
    finalEyebrow: 'VOTRE PROJET DE MASQUE',
    finalTitle: 'Quel masque souhaitez-vous essayer en premier ?',
    finalBody: 'Choisissez un produit, demandez des échantillons ou envoyez-nous une référence.'
  },
  es: {
    eyebrow: 'MASCARILLAS DE HIDROGEL · GUANGZHOU',
    heroTitle: 'Pensadas para la piel.\nCreadas para tu marca.',
    heroBody: 'Descubre 21 productos terminados y 41 formatos de hidrogel documentados para rostro, ojos y zonas localizadas. Después definimos fórmula, forma, envase y muestras.',
    primary: 'Ver los 21 productos',
    secondary: 'Solicitar muestras',
    heroHighlights: ['21 conceptos terminados', '41 formatos técnicos', '5 sistemas de material', 'Muestras y cotización'],
    featured: 'MASCARILLAS DESTACADAS',
    featuredTitle: 'Tres formas sencillas de empezar.',
    featureBody: 'Producto, ingredientes, peso neto y cantidad mínima aparecen de forma clara. Después podemos adaptar la opción elegida a tu marca.',
    viewAll: 'Ver los 21 productos',
    families: 'POR ZONA DE CUIDADO',
    familiesTitle: 'Encuentra el formato adecuado para la zona que quieres cuidar.',
    modes: [
      ['01', 'Mascarillas faciales y en crema', 'Colágeno, calma, luminosidad y frescor para el cuidado facial.'],
      ['02', 'Parches para ojos', 'Hidrogeles rojos, dorados, rosas, azules y transparentes.'],
      ['03', 'Parches localizados', 'Formatos para labios, cuello, frente, surcos nasolabiales, mandíbula y zonas combinadas.']
    ],
    gelCapability: {
      eyebrow: 'EXPERIENCIA EN HIDROGEL',
      title: 'Gel suave y adaptable, con el carácter de tu marca.',
      body: 'Showki documenta 41 formatos para rostro, ojos, labios, cuello, frente y mandíbula. Color, forma e ingredientes se confirman mediante muestras.',
      items: [
        ['Formatos', 'Rostro · ojos · labios · cuello · frente · mandíbula'],
        ['Aspecto & tacto', 'Color, forma, grosor y acabado'],
        ['Orientación', 'Hidratación, calma, firmeza y luminosidad']
      ]
    },
    factory: {
      eyebrow: 'DENTRO DE SHOWKI',
      title: 'Experiencia en hidrogel, llevada a producción.',
      body: 'Formulación, formado, llenado, control y envasado se integran para mantener la esencia del producto elegido.',
      captions: ['Producción', 'Control de calidad', 'Envasado']
    },
    process: 'TRABAJAR JUNTOS',
    processTitle: 'De la primera idea a la mascarilla terminada.',
    evidence: 'POR QUÉ SHOWKI',
    evidenceTitle: 'Un socio especializado en hidrogel para marcas de cuidado.',
    evidenceBody: 'Parte de un producto existente o trae una idea nueva. Nuestro equipo te acompaña con el gel, la fórmula, el envase, las muestras y la producción.',
    evidenceItems: [
      ['Opciones', '21 productos terminados en tres grupos.'],
      ['Gama hidrogel', '41 formatos documentados en cinco sistemas.'],
      ['Acompañamiento', 'Muestras, envase y cotización en una sola conversación.']
    ],
    partnership: {
      eyebrow: 'PARA MARCAS DE BELLEZA',
      title: 'Desarrollado en Guangzhou. Listo para tu mercado.',
      body: 'Cuéntanos dónde quieres vender y qué experiencia buscas. Te ayudaremos a elegir la mascarilla, el envase y las muestras adecuadas.',
      aside: 'GUANGZHOU · CHINA\nAPOYO INTERNACIONAL',
      markets: ['Norteamérica', 'Europa', 'Asia', 'Oceanía'],
      cardEyebrow: 'SHOWKI BIOTECH',
      cardTitle: 'Mascarillas de hidrogel para marcas de cuidado',
      caption: 'GUANGZHOU · CHINA'
    },
    finalEyebrow: 'TU PROYECTO DE MASCARILLA',
    finalTitle: '¿Qué mascarilla quieres probar primero?',
    finalBody: 'Elige un producto, solicita muestras o envíanos una referencia.'
  },
  ru: {
    eyebrow: 'ГИДРОГЕЛЕВЫЕ МАСКИ · ГУАНЧЖОУ',
    heroTitle: 'Идеально для кожи.\nИдеально для вашего бренда.',
    heroBody: 'Познакомьтесь с 21 готовым продуктом и 41 документированным гидрогелевым форматом для лица, глаз и локальных зон. Затем обсудим формулу, форму, упаковку и образцы.',
    primary: 'Смотреть 21 продукт',
    secondary: 'Запросить образцы',
    heroHighlights: ['21 готовая концепция', '41 технический формат', '5 систем материалов', 'Образцы и расчёт стоимости'],
    featured: 'ПОПУЛЯРНЫЕ МАСКИ',
    featuredTitle: 'Три популярных варианта для начала.',
    featureBody: 'Сравните продукт, ингредиенты, массу нетто и минимальный заказ. Если вариант вам подходит, мы поможем адаптировать его под ваш бренд.',
    viewAll: 'Смотреть все 21 продукт',
    families: 'ВЫБОР ПО ЗОНЕ УХОДА',
    familiesTitle: 'Найдите подходящий формат для нужной зоны кожи.',
    modes: [
      ['01', 'Маски для лица и крем-маски', 'Коллагеновые, успокаивающие, осветляющие и охлаждающие решения для лица.'],
      ['02', 'Патчи для глаз', 'Гидрогелевые патчи красного, золотого, розового, синего и прозрачного цвета.'],
      ['03', 'Локальные патчи', 'Форматы для губ, шеи, лба, носогубных складок, подбородка и комбинированных зон.']
    ],
    gelCapability: {
      eyebrow: 'ЭКСПЕРТИЗА В ГИДРОГЕЛЕ',
      title: 'Мягкий, плотно прилегающий гель — с вашей собственной идеей.',
      body: 'Showki документирует 41 гидрогелевый формат для лица, глаз, губ, шеи, лба и подбородка. Цвет, форма и ингредиенты подтверждаются на образцах.',
      items: [
        ['Форматы', 'Лицо · глаза · губы · шея · лоб · подбородок'],
        ['Внешний вид и ощущение', 'Цвет, форма, толщина и фактура поверхности'],
        ['Направление формулы', 'Увлажнение, успокаивающий эффект, упругость и сияние']
      ]
    },
    factory: {
      eyebrow: 'ВНУТРИ SHOWKI',
      title: 'Экспертиза в гидрогеле — от разработки до производства.',
      body: 'Подготовка формулы, формование, наполнение, контроль и упаковка объединены в один процесс, чтобы готовый заказ соответствовал утверждённому образцу.',
      captions: ['Производство', 'Контроль качества', 'Упаковка и сборка']
    },
    process: 'КАК МЫ РАБОТАЕМ',
    processTitle: 'От первой идеи до готовой маски.',
    evidence: 'ПОЧЕМУ SHOWKI',
    evidenceTitle: 'Специализированный партнёр по гидрогелю для косметических брендов.',
    evidenceBody: 'Начните с готового продукта или предложите новое направление. Наша команда поможет с форматом геля, формулой, упаковкой, образцами и производством.',
    evidenceItems: [
      ['Выбор продукта', '21 готовый продукт в трёх группах.'],
      ['Линейка гидрогелей', '41 формат в пяти системах материалов.'],
      ['Практическая поддержка', 'Образцы, обсуждение упаковки и расчёт стоимости в одном диалоге.']
    ],
    partnership: {
      eyebrow: 'ДЛЯ КОСМЕТИЧЕСКИХ БРЕНДОВ',
      title: 'Разработка в Гуанчжоу. Запуск на вашем рынке.',
      body: 'Расскажите, где планируете продавать продукт и каким он должен ощущаться. Мы поможем выбрать маску, формат упаковки и вариант образца.',
      aside: 'ГУАНЧЖОУ · КИТАЙ\nПОДДЕРЖКА БРЕНДОВ ПО ВСЕМУ МИРУ',
      markets: ['Северная Америка', 'Европа', 'Азия', 'Океания'],
      cardEyebrow: 'SHOWKI BIOTECH',
      cardTitle: 'Гидрогелевые маски для косметических брендов',
      caption: 'ГУАНЧЖОУ · КИТАЙ'
    },
    finalEyebrow: 'НАЧНИТЕ ПРОЕКТ МАСКИ',
    finalTitle: 'Какую маску вы хотели бы попробовать первой?',
    finalBody: 'Выберите продукт, запросите образцы или отправьте нам референс — и мы продолжим работу.'
  },
  ar: {
    eyebrow: 'أقنعة هيدروجيل · قوانغتشو',
    heroTitle: 'مصممة لتناسب البشرة.\nومصممة لتناسب علامتك.',
    heroBody: 'اكتشف 21 منتجاً جاهزاً و41 تصميماً موثقاً من الهيدروجيل للوجه والعين والمناطق الموضعية، ثم ناقش معنا التركيبة والشكل والتغليف والعينات.',
    primary: 'تصفح 21 منتجاً',
    secondary: 'طلب عينات',
    heroHighlights: ['21 نموذجاً جاهزاً', '41 تصميماً تقنياً', '5 أنظمة مواد', 'عينات وعروض أسعار'],
    featured: 'أقنعة مختارة',
    featuredTitle: 'ثلاث طرق شائعة للبدء.',
    featureBody: 'قارن المنتج والمكونات والوزن الصافي والحد الأدنى للطلب. وعندما تجد خياراً مناسباً، نساعدك على تكييفه مع علامتك.',
    viewAll: 'عرض المنتجات الـ21',
    families: 'تسوق حسب المنطقة',
    familiesTitle: 'اعثر على التصميم المناسب للمنطقة التي تريد العناية بها.',
    modes: [
      ['01', 'أقنعة الوجه والأقنعة الكريمية', 'خيارات بالكولاجين والتهدئة والإشراق والتبريد للعناية بالوجه.'],
      ['02', 'لصقات العين', 'لصقات هيدروجيل باللون الأحمر والذهبي والوردي والأزرق والشفاف.'],
      ['03', 'لصقات موضعية', 'تصاميم للشفاه والرقبة والجبهة والطيات الأنفية وخط الفك والمناطق المدمجة.']
    ],
    gelCapability: {
      eyebrow: 'خبرة في الهيدروجيل',
      title: 'جل ناعم ومحكم الالتصاق، مع مساحة لفكرتك الخاصة.',
      body: 'توثق Showki 41 تصميماً للوجه والعين والشفاه والرقبة والجبهة وخط الفك. ويؤكد اللون والشكل والمكونات من خلال العينات.',
      items: [
        ['التصاميم', 'الوجه · العين · الشفاه · الرقبة · الجبهة · خط الفك'],
        ['المظهر والملمس', 'اللون والشكل والسماكة وتشطيب السطح'],
        ['اتجاه التركيبة', 'خيارات للترطيب والتهدئة والتماسك والإشراق']
      ]
    },
    factory: {
      eyebrow: 'داخل SHOWKI',
      title: 'خبرة الهيدروجيل من التطوير حتى الإنتاج.',
      body: 'نجمع إعداد التركيبة والتشكيل والتعبئة والفحص والتغليف حتى يظل الطلب النهائي مطابقاً لفكرة العينة المعتمدة.',
      captions: ['الإنتاج', 'فحص الجودة', 'التغليف والتجميع']
    },
    process: 'العمل معاً',
    processTitle: 'من الفكرة الأولى إلى قناع جاهز.',
    evidence: 'لماذا SHOWKI',
    evidenceTitle: 'شريك متخصص في الهيدروجيل لعلامات العناية بالبشرة.',
    evidenceBody: 'ابدأ بمنتج قائم أو قدم اتجاهاً جديداً. يساعدك فريقنا في تصميم الجل والتركيبة والتغليف والعينات والإنتاج.',
    evidenceItems: [
      ['اختيار المنتج', '21 منتجاً جاهزاً ضمن ثلاث مجموعات.'],
      ['مجموعة الهيدروجيل', '41 تصميماً موثقاً ضمن خمسة أنظمة مواد.'],
      ['دعم عملي', 'العينات ومناقشة التغليف وعرض السعر في محادثة واحدة.']
    ],
    partnership: {
      eyebrow: 'مصمم لعلامات التجميل',
      title: 'التطوير في قوانغتشو. والإطلاق في سوقك.',
      body: 'أخبرنا أين تخطط للبيع وما الإحساس الذي تريده للمنتج. سنساعدك على اختيار القناع والتغليف والعينة المناسبة.',
      aside: 'قوانغتشو · الصين\nدعم العلامات عالمياً',
      markets: ['أمريكا الشمالية', 'أوروبا', 'آسيا', 'أوقيانوسيا'],
      cardEyebrow: 'SHOWKI BIOTECH',
      cardTitle: 'أقنعة هيدروجيل لعلامات العناية بالبشرة',
      caption: 'قوانغتشو · الصين'
    },
    finalEyebrow: 'ابدأ مشروع القناع',
    finalTitle: 'أي قناع تود تجربته أولاً؟',
    finalBody: 'اختر منتجاً أو اطلب عينات أو أرسل لنا مرجعاً، وسنكمل معك من هناك.'
  }
} satisfies Record<Locale, SiteCopy>;

export function getSiteCopy(locale: Locale): SiteCopy {
  return {...copy[locale], ...brochureSiteCopy[locale]};
}

export const steps = {
  en: ['Tell us what you want to make', 'Choose a product or share a reference', 'Select the formula and gel format', 'Try and confirm the sample', 'Choose packaging and quantity', 'Move into production'],
  zh: ['说说想做的产品', '找到合适的膜型', '拿到首轮样品', '亲自确认肤感', '定下包装与数量', '按样品标准生产'],
  fr: ['Présentez votre idée', 'Choisissez un produit ou une référence', 'Sélectionnez la formule et le gel', 'Testez et validez l’échantillon', 'Choisissez l’emballage et la quantité', 'Lancez la production'],
  es: ['Cuéntanos tu idea', 'Elige un producto o una referencia', 'Selecciona fórmula y gel', 'Prueba y confirma la muestra', 'Elige envase y cantidad', 'Inicia la producción'],
  ru: ['Расскажите, что хотите создать', 'Выберите продукт или поделитесь референсом', 'Определите формулу и формат геля', 'Испытайте и утвердите образец', 'Выберите упаковку и количество', 'Перейдите к производству'],
  ar: ['أخبرنا بما تريد تطويره', 'اختر منتجاً أو شارك مرجعاً', 'حدد التركيبة وتصميم الجل', 'جرّب العينة واعتمدها', 'اختر التغليف والكمية', 'ابدأ الإنتاج']
} satisfies Record<Locale, string[]>;
