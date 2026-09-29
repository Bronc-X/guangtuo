import type {Locale} from '@/lib/routing';

export const pageLabels: Record<Locale, {home: string; form: string; evidence: string; production: string; faq: string; unavailable: string; articles: string}> = {
  en: {home: 'Showki Biotech home', form: 'Enquiry details', evidence: 'Evidence', production: 'Hydrogel production', faq: 'Frequently asked questions', unavailable: 'This article is not available in this language yet. You can browse the available articles below.', articles: 'Published articles'},
  zh: {home: '修齐生物首页', form: '产品需求详情', evidence: '信任依据', production: '水凝膜生产', faq: '常见问题', unavailable: '这篇文章暂时没有当前语言的译文。您可以浏览下方已发布的文章。', articles: '已发布文章'},
  fr: {home: 'Accueil Showki Biotech', form: 'Détails de la demande', evidence: 'Nos références', production: 'Production hydrogel', faq: 'Questions fréquentes', unavailable: 'Cet article n’est pas encore disponible dans cette langue. Consultez les articles disponibles ci-dessous.', articles: 'Articles publiés'},
  es: {home: 'Inicio de Showki Biotech', form: 'Detalles de la consulta', evidence: 'Nuestras referencias', production: 'Producción de hidrogel', faq: 'Preguntas frecuentes', unavailable: 'Este artículo aún no está disponible en este idioma. Consulta los artículos disponibles a continuación.', articles: 'Artículos publicados'},
  ru: {home: 'Главная Showki Biotech', form: 'Сведения о запросе', evidence: 'Подтверждающие материалы', production: 'Производство гидрогеля', faq: 'Частые вопросы', unavailable: 'Эта статья пока недоступна на выбранном языке. Ниже можно посмотреть опубликованные материалы.', articles: 'Опубликованные статьи'},
  ar: {home: 'الصفحة الرئيسية لشركة Showki Biotech', form: 'تفاصيل الاستفسار', evidence: 'أدلة الثقة', production: 'إنتاج الهيدروجيل', faq: 'الأسئلة الشائعة', unavailable: 'هذه المقالة غير متاحة بهذه اللغة بعد. يمكنك تصفح المقالات المتاحة أدناه.', articles: 'المقالات المنشورة'}
};

const articlePageCopy = {
  en: {
    index: 'Hydrogel insights', author: 'Showki Biotech', reading: 'Article details', points: 'Practical notes',
    pointsTitle: 'Details to check when selecting a product and approving a sample.',
    pointsBody: 'Review the care area, desired skin feel and packaging plan to find a suitable sample.',
    action: 'Explore the products', actionTitle: 'Ready to apply these ideas to your product?',
    actionBody: 'Share your target care area, reference images and expected quantity to discuss formats and samples.',
    samples: 'Request samples', products: 'Browse products', all: 'View all articles',
    homeTitle: 'Choose a format, review a sample and see how the product is made.',
    homeBody: 'Product selection, sample approval, manufacturing and quality checks are useful starting points for a new product.'
  },
  zh: {
    index: '水凝膜知识', author: '修齐生物', reading: '阅读信息', points: '实用要点',
    pointsTitle: '选产品、确认样品时，可以先看这些细节。',
    pointsBody: '结合您的护理部位、目标肤感和包装计划，逐项核对更容易找到合适的样品。',
    action: '继续了解产品', actionTitle: '想把文章里的判断用到您的产品上？',
    actionBody: '带上目标护理部位、参考图片和预计数量，我们可以继续沟通膜型与样品。',
    samples: '申请产品样品', products: '浏览水凝膜产品', all: '查看全部文章',
    homeTitle: '选膜型、看样品，也了解产品怎样做出来。',
    homeBody: '产品选择、样品确认、制造与品控，都是开发新品时值得提前了解的细节。'
  },
  fr: {
    index: 'Conseils sur l’hydrogel', author: 'Showki Biotech', reading: 'Informations sur l’article', points: 'Conseils pratiques',
    pointsTitle: 'Les détails à vérifier pour choisir un produit et approuver un échantillon.',
    pointsBody: 'Examinez la zone de soin, le toucher souhaité et l’emballage pour trouver un échantillon adapté.',
    action: 'Découvrir les produits', actionTitle: 'Prêt à appliquer ces idées à votre produit ?',
    actionBody: 'Partagez la zone de soin, les images de référence et la quantité prévue pour discuter des formats et échantillons.',
    samples: 'Demander des échantillons', products: 'Voir les produits', all: 'Voir tous les articles',
    homeTitle: 'Choisissez un format, examinez un échantillon et découvrez sa fabrication.',
    homeBody: 'Sélection, approbation des échantillons, fabrication et contrôle qualité : des points utiles pour développer un nouveau produit.'
  },
  es: {
    index: 'Guías sobre hidrogel', author: 'Showki Biotech', reading: 'Información del artículo', points: 'Consejos prácticos',
    pointsTitle: 'Detalles que conviene revisar al seleccionar un producto y aprobar una muestra.',
    pointsBody: 'Revise la zona de cuidado, el tacto deseado y el plan de envase para encontrar una muestra adecuada.',
    action: 'Explorar los productos', actionTitle: '¿Quiere aplicar estas ideas a su producto?',
    actionBody: 'Comparta la zona de cuidado, imágenes de referencia y cantidad prevista para hablar de formatos y muestras.',
    samples: 'Solicitar muestras', products: 'Ver productos', all: 'Ver todos los artículos',
    homeTitle: 'Elija un formato, revise una muestra y conozca cómo se fabrica.',
    homeBody: 'La selección, aprobación de muestras, fabricación y control de calidad son puntos útiles al desarrollar un producto nuevo.'
  },
  ru: {
    index: 'Материалы о гидрогеле', author: 'Showki Biotech', reading: 'Информация о статье', points: 'Практические рекомендации',
    pointsTitle: 'Что проверить при выборе продукта и утверждении образца.',
    pointsBody: 'Сопоставьте зону ухода, желаемые ощущения на коже и упаковку, чтобы выбрать подходящий образец.',
    action: 'Изучить продукцию', actionTitle: 'Хотите применить эти идеи к своему продукту?',
    actionBody: 'Укажите зону ухода, примеры изображений и ожидаемое количество для обсуждения форматов и образцов.',
    samples: 'Запросить образцы', products: 'Смотреть продукцию', all: 'Все статьи',
    homeTitle: 'Выберите формат, оцените образец и узнайте, как его производят.',
    homeBody: 'Выбор продукта, утверждение образца, производство и контроль качества важны при разработке новинки.'
  },
  ar: {
    index: 'معرفة الهيدروجيل', author: 'Showki Biotech', reading: 'معلومات المقالة', points: 'نقاط عملية',
    pointsTitle: 'تفاصيل للمراجعة عند اختيار المنتج واعتماد العينة.',
    pointsBody: 'راجع منطقة العناية وملمس البشرة المطلوب وخطة التغليف للعثور على عينة مناسبة.',
    action: 'استكشف المنتجات', actionTitle: 'هل ترغب في تطبيق هذه الأفكار على منتجك؟',
    actionBody: 'شارك منطقة العناية المستهدفة والصور المرجعية والكمية المتوقعة لمناقشة التصاميم والعينات.',
    samples: 'طلب عينات', products: 'تصفح المنتجات', all: 'عرض جميع المقالات',
    homeTitle: 'اختر التصميم وراجع العينة وتعرف على كيفية صنع المنتج.',
    homeBody: 'اختيار المنتج واعتماد العينة والتصنيع وفحص الجودة خطوات تستحق المراجعة عند تطوير منتج جديد.'
  }
};

export function getArticlePageCopy(locale: Locale) {
  return articlePageCopy[locale];
}
