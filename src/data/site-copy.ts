import type {Locale} from '@/lib/routing';

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
    heroBody: 'Explore 13 face, eye and neck masks from Guangtuo Bio. Choose the care direction you like, then talk with us about colour, shape, packaging and samples.',
    primary: 'Browse 13 products',
    secondary: 'Request samples',
    heroHighlights: ['13 finished mask concepts', 'Face, eye & neck care', 'Custom colour & shape', 'Samples & quotations'],
    featured: 'FEATURED MASKS',
    featuredTitle: 'Three popular ways to begin.',
    featureBody: 'Compare the product, ingredients, net weight and minimum order. When one feels close, we can help adapt it for your brand.',
    viewAll: 'See all 13 products',
    families: 'SHOP BY AREA',
    familiesTitle: 'Find the right format for the skin area you want to care for.',
    modes: [
      ['01', 'Face & cream masks', 'Collagen, soothing, brightening and cooling options for facial care.'],
      ['02', 'Eye masks', 'Hydrogel eye masks in red, gold, pink, blue and clear finishes.'],
      ['03', 'Neck masks', 'A cooling collagen format shaped for close, comfortable neck coverage.']
    ],
    gelCapability: {
      eyebrow: 'HYDROGEL EXPERTISE',
      title: 'Soft, close-fitting gel with room for your own idea.',
      body: 'Guangtuo develops hydrogel formats for the face, eyes, lips and neck. Colour, shape and ingredient direction can be tailored and confirmed through samples.',
      items: [
        ['Formats', 'Face · eye · lip · neck'],
        ['Look & feel', 'Colour, shape, thickness and surface finish'],
        ['Formula direction', 'Hydration, soothing, firming and brightening options']
      ]
    },
    factory: {
      eyebrow: 'INSIDE GUANGTUO',
      title: 'Hydrogel know-how, carried through to production.',
      body: 'Formulation, forming, filling, inspection and packing are brought together so your sample and finished order stay true to the same product idea.',
      captions: ['Production', 'Quality inspection', 'Packing & assembly']
    },
    process: 'WORKING TOGETHER',
    processTitle: 'From the first idea to a finished mask.',
    evidence: 'WHY GUANGTUO',
    evidenceTitle: 'A focused hydrogel partner for skincare brands.',
    evidenceBody: 'Begin with an existing product or bring a new direction. Our team can help with the gel format, formula, packaging, samples and production.',
    evidenceItems: [
      ['Product choice', 'Thirteen current face, eye and neck mask options.'],
      ['Hydrogel range', 'Formats for the face, eyes, lips and neck.'],
      ['Practical support', 'Samples, packaging discussion and quotation in one conversation.']
    ],
    partnership: {
      eyebrow: 'BUILT FOR BEAUTY BRANDS',
      title: 'Develop in Guangzhou. Launch in your market.',
      body: 'Tell us where you plan to sell and how you want the product to feel. We will help you choose a suitable mask, pack format and sample option.',
      aside: 'GUANGZHOU · CHINA\nGLOBAL BRAND SUPPORT',
      markets: ['North America', 'Europe', 'Asia', 'Oceania'],
      cardEyebrow: 'GUANGTUO BIO',
      cardTitle: 'Hydrogel masks for skincare brands',
      caption: 'GUANGZHOU · CHINA'
    },
    finalEyebrow: 'START YOUR MASK PROJECT',
    finalTitle: 'Which mask would you like to try first?',
    finalBody: 'Choose a product, request samples or send us a reference. We will continue from there.'
  },
  zh: {
    eyebrow: '水凝胶面膜 · 广州',
    heroTitle: '贴合肌肤，\n也贴合你的品牌。',
    heroBody: '这里有广拓生物 13 款面部、眼部与颈部面膜。先挑选喜欢的护理方向，再一起沟通颜色、形状、包装和样品。',
    primary: '浏览 13 款产品',
    secondary: '申请样品',
    heroHighlights: ['13 款成品面膜', '面部 · 眼部 · 颈部', '颜色与形状可定制', '支持样品与报价'],
    featured: '精选面膜',
    featuredTitle: '先从三款代表产品看起。',
    featureBody: '产品、成分、净含量和起订量都清楚列出。找到接近的款式后，我们可以继续按品牌需求调整。',
    viewAll: '查看全部 13 款产品',
    families: '按护理部位浏览',
    familiesTitle: '从想护理的部位，找到合适的面膜形态。',
    modes: [
      ['01', '面部与膏状面膜', '胶原、舒缓、焕亮与冷感等面部护理选择。'],
      ['02', '眼膜', '红、金、粉、蓝及透明等不同外观的水凝胶眼膜。'],
      ['03', '颈膜', '贴合颈部轮廓的胶原微孔冷感颈膜。']
    ],
    gelCapability: {
      eyebrow: '水凝胶专长',
      title: '柔软贴合的凝胶，也能呈现品牌自己的想法。',
      body: '广拓可开发面膜、眼膜、唇膜与颈膜等水凝胶产品。颜色、形状和成分方向均可沟通，并通过样品确认。',
      items: [
        ['产品形态', '面膜 · 眼膜 · 唇膜 · 颈膜'],
        ['外观与触感', '颜色、形状、厚度与表面效果'],
        ['配方方向', '补水、舒缓、紧致与焕亮等选择']
      ]
    },
    factory: {
      eyebrow: '走进广拓',
      title: '从水凝胶经验，到稳定生产。',
      body: '配制、成型、灌装、检查与包装衔接在一起，让确认过的样品和最终订单保持同一产品方向。',
      captions: ['生产', '品质检查', '包装与组装']
    },
    process: '合作方式',
    processTitle: '从一个想法，到一款可以上市的面膜。',
    evidence: '为什么选择广拓',
    evidenceTitle: '专注水凝胶，为护肤品牌提供完整支持。',
    evidenceBody: '可以从现有产品开始，也可以带着新的想法来。团队可协助凝胶形态、配方、包装、样品与生产。',
    evidenceItems: [
      ['产品选择', '现有 13 款面部、眼部与颈部面膜。'],
      ['水凝胶范围', '覆盖面部、眼部、唇部与颈部。'],
      ['实际支持', '样品、包装沟通与报价一次对接。']
    ],
    partnership: {
      eyebrow: '服务美妆品牌',
      title: '在广州开发，走向你的目标市场。',
      body: '欢迎告诉我们计划销售的市场和希望呈现的产品感受，我们会协助选择面膜、包装方式与样品安排。',
      aside: '中国 · 广州\n品牌项目支持',
      markets: ['北美', '欧洲', '亚洲', '大洋洲'],
      cardEyebrow: '广拓生物',
      cardTitle: '为护肤品牌开发水凝胶面膜',
      caption: '中国 · 广州'
    },
    finalEyebrow: '开始你的面膜项目',
    finalTitle: '想先试哪一款面膜？',
    finalBody: '可以选择产品、申请样品，也可以直接发来参考图，我们会继续与你沟通。'
  },
  fr: {
    eyebrow: 'MASQUES HYDROGEL · GUANGZHOU',
    heroTitle: 'Pensés pour la peau.\nCréés pour votre marque.',
    heroBody: 'Découvrez 13 masques visage, yeux et cou de Guangtuo Bio. Choisissez l’effet recherché, puis échangeons sur la couleur, la forme, l’emballage et les échantillons.',
    primary: 'Voir les 13 produits',
    secondary: 'Demander des échantillons',
    heroHighlights: ['13 concepts finis', 'Visage · yeux · cou', 'Couleur et forme sur mesure', 'Échantillons et devis'],
    featured: 'MASQUES À DÉCOUVRIR',
    featuredTitle: 'Trois façons simples de commencer.',
    featureBody: 'Produit, ingrédients, poids net et quantité minimale sont indiqués clairement. Nous pouvons ensuite adapter le modèle choisi à votre marque.',
    viewAll: 'Voir les 13 produits',
    families: 'PAR ZONE DE SOIN',
    familiesTitle: 'Trouvez le format adapté à la zone que vous souhaitez choyer.',
    modes: [
      ['01', 'Masques visage et crème', 'Collagène, apaisement, éclat et fraîcheur pour le soin du visage.'],
      ['02', 'Patchs pour les yeux', 'Des hydrogels rouges, dorés, roses, bleus ou transparents.'],
      ['03', 'Masques pour le cou', 'Un format frais au collagène, conçu pour épouser le cou.']
    ],
    gelCapability: {
      eyebrow: 'SAVOIR-FAIRE HYDROGEL',
      title: 'Un gel souple et confortable, à l’image de votre marque.',
      body: 'Guangtuo développe des hydrogels pour le visage, les yeux, les lèvres et le cou. Couleur, forme et orientation des ingrédients peuvent être adaptées puis confirmées sur échantillon.',
      items: [
        ['Formats', 'Visage · yeux · lèvres · cou'],
        ['Aspect & toucher', 'Couleur, forme, épaisseur et finition'],
        ['Orientation', 'Hydratation, apaisement, fermeté et éclat']
      ]
    },
    factory: {
      eyebrow: 'CHEZ GUANGTUO',
      title: 'Le savoir-faire hydrogel, jusqu’à la production.',
      body: 'Formulation, mise en forme, remplissage, contrôle et conditionnement sont réunis pour préserver l’esprit du produit choisi.',
      captions: ['Production', 'Contrôle qualité', 'Conditionnement']
    },
    process: 'TRAVAILLER ENSEMBLE',
    processTitle: 'De la première idée au masque fini.',
    evidence: 'POURQUOI GUANGTUO',
    evidenceTitle: 'Un partenaire hydrogel dédié aux marques de soin.',
    evidenceBody: 'Partez d’un produit existant ou apportez une nouvelle idée. Notre équipe vous accompagne sur le gel, la formule, l’emballage, les échantillons et la production.',
    evidenceItems: [
      ['Choix produits', 'Treize masques visage, yeux et cou.'],
      ['Gamme hydrogel', 'Formats visage, yeux, lèvres et cou.'],
      ['Accompagnement', 'Échantillons, emballage et devis dans un même échange.']
    ],
    partnership: {
      eyebrow: 'POUR LES MARQUES DE BEAUTÉ',
      title: 'Développé à Guangzhou. Prêt pour votre marché.',
      body: 'Indiquez-nous votre marché et l’expérience recherchée. Nous vous aiderons à choisir le masque, l’emballage et les échantillons adaptés.',
      aside: 'GUANGZHOU · CHINE\nACCOMPAGNEMENT INTERNATIONAL',
      markets: ['Amérique du Nord', 'Europe', 'Asie', 'Océanie'],
      cardEyebrow: 'GUANGTUO BIO',
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
    heroBody: 'Descubre 13 mascarillas faciales, de ojos y de cuello de Guangtuo Bio. Elige el cuidado que buscas y hablemos de color, forma, envase y muestras.',
    primary: 'Ver los 13 productos',
    secondary: 'Solicitar muestras',
    heroHighlights: ['13 conceptos terminados', 'Rostro · ojos · cuello', 'Color y forma a medida', 'Muestras y cotización'],
    featured: 'MASCARILLAS DESTACADAS',
    featuredTitle: 'Tres formas sencillas de empezar.',
    featureBody: 'Producto, ingredientes, peso neto y cantidad mínima aparecen de forma clara. Después podemos adaptar la opción elegida a tu marca.',
    viewAll: 'Ver los 13 productos',
    families: 'POR ZONA DE CUIDADO',
    familiesTitle: 'Encuentra el formato adecuado para la zona que quieres cuidar.',
    modes: [
      ['01', 'Mascarillas faciales y en crema', 'Colágeno, calma, luminosidad y frescor para el cuidado facial.'],
      ['02', 'Parches para ojos', 'Hidrogeles rojos, dorados, rosas, azules y transparentes.'],
      ['03', 'Mascarillas para cuello', 'Un formato refrescante con colágeno que se adapta al cuello.']
    ],
    gelCapability: {
      eyebrow: 'EXPERIENCIA EN HIDROGEL',
      title: 'Gel suave y adaptable, con el carácter de tu marca.',
      body: 'Guangtuo desarrolla hidrogeles para rostro, ojos, labios y cuello. Se pueden adaptar color, forma e ingredientes y confirmarlos mediante muestras.',
      items: [
        ['Formatos', 'Rostro · ojos · labios · cuello'],
        ['Aspecto & tacto', 'Color, forma, grosor y acabado'],
        ['Orientación', 'Hidratación, calma, firmeza y luminosidad']
      ]
    },
    factory: {
      eyebrow: 'DENTRO DE GUANGTUO',
      title: 'Experiencia en hidrogel, llevada a producción.',
      body: 'Formulación, formado, llenado, control y envasado se integran para mantener la esencia del producto elegido.',
      captions: ['Producción', 'Control de calidad', 'Envasado']
    },
    process: 'TRABAJAR JUNTOS',
    processTitle: 'De la primera idea a la mascarilla terminada.',
    evidence: 'POR QUÉ GUANGTUO',
    evidenceTitle: 'Un socio especializado en hidrogel para marcas de cuidado.',
    evidenceBody: 'Parte de un producto existente o trae una idea nueva. Nuestro equipo te acompaña con el gel, la fórmula, el envase, las muestras y la producción.',
    evidenceItems: [
      ['Opciones', 'Trece mascarillas faciales, de ojos y de cuello.'],
      ['Gama hidrogel', 'Formatos para rostro, ojos, labios y cuello.'],
      ['Acompañamiento', 'Muestras, envase y cotización en una sola conversación.']
    ],
    partnership: {
      eyebrow: 'PARA MARCAS DE BELLEZA',
      title: 'Desarrollado en Guangzhou. Listo para tu mercado.',
      body: 'Cuéntanos dónde quieres vender y qué experiencia buscas. Te ayudaremos a elegir la mascarilla, el envase y las muestras adecuadas.',
      aside: 'GUANGZHOU · CHINA\nAPOYO INTERNACIONAL',
      markets: ['Norteamérica', 'Europa', 'Asia', 'Oceanía'],
      cardEyebrow: 'GUANGTUO BIO',
      cardTitle: 'Mascarillas de hidrogel para marcas de cuidado',
      caption: 'GUANGZHOU · CHINA'
    },
    finalEyebrow: 'TU PROYECTO DE MASCARILLA',
    finalTitle: '¿Qué mascarilla quieres probar primero?',
    finalBody: 'Elige un producto, solicita muestras o envíanos una referencia.'
  }
} satisfies Record<Locale, SiteCopy>;

export function getSiteCopy(locale: Locale): SiteCopy {
  return copy[locale];
}

export const steps = {
  en: ['Tell us what you want to make', 'Choose a product or share a reference', 'Select the formula and gel format', 'Try and confirm the sample', 'Choose packaging and quantity', 'Move into production'],
  zh: ['说说你想做的产品', '选择产品或提供参考', '确定配方与凝胶形态', '试用并确认样品', '选择包装与数量', '进入生产'],
  fr: ['Présentez votre idée', 'Choisissez un produit ou une référence', 'Sélectionnez la formule et le gel', 'Testez et validez l’échantillon', 'Choisissez l’emballage et la quantité', 'Lancez la production'],
  es: ['Cuéntanos tu idea', 'Elige un producto o una referencia', 'Selecciona fórmula y gel', 'Prueba y confirma la muestra', 'Elige envase y cantidad', 'Inicia la producción']
} satisfies Record<Locale, string[]>;
