import {locales, localizedPath, type Locale} from '@/lib/routing';
import {getCompanyExtendedText} from '@/data/company-extended-translations';
import {getPublishedPageOverride, publishedContent} from '@/lib/published-content';

export type CompanyLocalizedText = Record<Locale, string>;

const localized = (en: string, zh: string, fr: string, es: string, ru = en, ar = en): CompanyLocalizedText => ({
  en,
  zh,
  fr,
  es,
  ru: ru === en ? getCompanyExtendedText('ru', en) : ru,
  ar: ar === en ? getCompanyExtendedText('ar', en) : ar
});

export const companyPageCopy = {
  customization: {
    seoTitle: localized('Custom Skincare Product Development', '护肤产品定制开发', 'Développement de soins sur mesure', 'Desarrollo de cosméticos a medida', 'Разработка косметики на заказ', 'تطوير منتجات العناية بالبشرة حسب الطلب'),
    seoDescription: localized(
      'Develop skincare, body care, sun care, makeup and hydrogel products across formula, format, packaging and brand presentation.',
      '围绕配方、产品形态、包材与品牌视觉，定制护肤、身体护理、防晒、底妆和水凝胶产品。',
      'Développez des soins, produits corps, solaires, maquillage et hydrogel : formule, format, emballage et identité de marque.',
      'Desarrolle cuidado facial y corporal, protección solar, maquillaje e hidrogel: fórmula, formato, envase e identidad de marca.',
      'Разрабатывайте средства для лица и тела, солнцезащитные средства, макияж и гидрогелевые продукты: формула, формат, упаковка и бренд.',
      'طوّر منتجات العناية بالبشرة والجسم والوقاية من الشمس والمكياج والهيدروجيل من حيث التركيبة والشكل والعبوة وهوية العلامة.'
    ),
    intro: {
      eyebrow: localized('CUSTOM DEVELOPMENT', '定制开发', 'DÉVELOPPEMENT SUR MESURE', 'DESARROLLO A MEDIDA'),
      title: localized('Make the product\nyour brand has in mind.', '把想法，做成好产品。', 'Créez le produit\nque votre marque imagine.', 'Cree el producto\nque imagina su marca.', 'Создайте продукт,\nкоторый задумал ваш бренд.', 'اصنع المنتج\nالذي تتصوره علامتك.'),
      body: localized(
        'Choose the formula, product format, fill and packaging. We bring those choices together in a physical sample you can assess.',
        '从配方、产品形态、质地与容量，到包材和品牌视觉，都可以通过实物样品确认。',
        'Choisissez la formule, le format, la contenance et l’emballage, puis évaluez un échantillon réel.',
        'Elija la fórmula, el formato, el contenido y el envase, y evalúe una muestra física.',
        'Выберите формулу, формат, объём и упаковку, а затем оцените физический образец.',
        'اختر التركيبة وشكل المنتج والحجم والعبوة، ثم قيّم عينة فعلية.'
      ),
      meta: [
        localized('Formula', '配方', 'Formule', 'Fórmula'),
        localized('Product format', '产品形态', 'Format produit', 'Formato del producto', 'Формат продукта', 'شكل المنتج'),
        localized('Texture & size', '质地与规格', 'Texture et format', 'Textura y tamaño', 'Текстура и размер', 'القوام والحجم'),
        localized('Fill volume', '内容量', 'Contenance', 'Contenido'),
        localized('Packaging', '包装', 'Emballage', 'Envase'),
        localized('Brand presentation', '品牌视觉', 'Présentation de marque', 'Presentación de marca')
      ]
    },
    scope: {
      eyebrow: localized('MAKE IT YOURS', '定制品牌产品', 'À VOTRE IMAGE', 'HÁGALO SUYO', 'ВАШ ПРОДУКТ', 'منتج يحمل هويتك'),
      title: localized('Six decisions that shape your product.', '从肤感到包装，逐一打磨。', 'Six choix qui définissent votre produit.', 'Seis decisiones que definen su producto.', 'Шесть решений, формирующих ваш продукт.', 'ستة قرارات تحدد هوية منتجك.'),
      headers: [
        localized('Development area', '可定制部分', 'Domaine', 'Área'),
        localized('What can be defined', '品牌可以调整', 'Éléments à définir', 'Qué se define'),
        localized('Why it matters', '带给消费者', 'Pourquoi', 'Por qué importa'),
        localized('What to share', '沟通时可参考', 'Ce que vous pouvez partager', 'Qué puede compartir')
      ],
      rows: [
        {
          title: localized('Formula direction', '配方与肤感', 'Orientation de formule', 'Dirección de fórmula'),
          choices: localized('Ingredient focus, texture, colour and sensorial profile', '成分重点、质地、颜色与使用感', 'Actifs, texture, couleur et profil sensoriel', 'Ingredientes, textura, color y perfil sensorial'),
          impact: localized('Aligns the product experience with its intended positioning', '让成分卖点与实际肤感相互呼应', 'Aligne l’expérience produit sur son positionnement', 'Alinea la experiencia del producto con su posicionamiento'),
          start: localized('Target use, market and reference formula', '目标用途、市场与参考配方', 'Usage, marché et formule de référence', 'Uso, mercado y fórmula de referencia')
        },
        {
          title: localized('Product format', '产品形态', 'Format produit', 'Formato del producto', 'Формат продукта', 'شكل المنتج'),
          choices: localized('Cleanser, serum, cream, sunscreen, makeup or hydrogel format', '洁面、精华、面霜、防晒、底妆或水凝胶等形态', 'Nettoyant, sérum, crème, solaire, maquillage ou hydrogel', 'Limpiador, sérum, crema, protector solar, maquillaje o hidrogel', 'Очищение, сыворотка, крем, SPF, макияж или гидрогель', 'غسول أو سيروم أو كريم أو واقي شمس أو مكياج أو هيدروجيل'),
          impact: localized('Shapes how the product is applied and experienced', '决定取用方式、涂抹体验与使用场景', 'Détermine l’application et l’expérience d’usage', 'Define la aplicación y la experiencia de uso', 'Определяет нанесение и опыт использования', 'يحدد طريقة التطبيق وتجربة الاستخدام'),
          start: localized('Preferred feel or a product reference', '期望触感或参考产品', 'Sensation souhaitée ou produit de référence', 'Sensación deseada o producto de referencia')
        },
        {
          title: localized('Texture & size', '质地与规格', 'Texture et format', 'Textura y tamaño', 'Текстура и размер', 'القوام والحجم'),
          choices: localized('Texture, application area, net content and product-specific dimensions', '质地、使用部位、净含量及对应产品所需尺寸', 'Texture, zone d’application, contenance et dimensions utiles', 'Textura, zona de aplicación, contenido y dimensiones necesarias', 'Текстура, область применения, объём и нужные размеры', 'القوام ومنطقة الاستخدام والمحتوى الصافي والأبعاد المناسبة'),
          impact: localized('Aligns the feel and amount with the intended use', '让质地与用量符合目标场景', 'Adapte la sensation et la quantité à l’usage prévu', 'Ajusta la textura y la cantidad al uso previsto', 'Соотносит текстуру и объём со способом применения', 'يوائم القوام والكمية مع الاستخدام المقصود'),
          start: localized('Target use and preferred size', '目标用途与期望规格', 'Usage et format souhaité', 'Uso y tamaño deseado', 'Назначение и желаемый размер', 'الاستخدام والحجم المطلوب')
        },
        {
          title: localized('Fill volume', '内容量', 'Contenance', 'Contenido'),
          choices: localized('Net content, fill weight and product count', '净含量、灌装量与产品数量', 'Contenance, poids de remplissage et nombre d’unités', 'Contenido neto, peso de llenado y unidades', 'Объём, масса наполнения и число единиц', 'المحتوى الصافي ووزن التعبئة وعدد الوحدات'),
          impact: localized('Defines use duration and packaging requirements', '影响使用次数、取用体验与包材选择', 'Détermine la durée d’usage et l’emballage', 'Define la duración de uso y el envase', 'Определяет длительность использования и упаковку', 'يحدد مدة الاستخدام ومتطلبات العبوة'),
          start: localized('Desired net content and use frequency', '期望净含量与使用频次', 'Contenu net et fréquence d’utilisation', 'Contenido neto y frecuencia de uso')
        },
        {
          title: localized('Packaging system', '包装组合', 'Système d’emballage', 'Sistema de envase'),
          choices: localized('Bottle, pump, jar, sachet, carton and set configuration', '瓶、泵、罐、袋、彩盒与套装组合', 'Flacon, pompe, pot, sachet, étui et coffret', 'Botella, dispensador, tarro, sobre, caja y conjunto', 'Флакон, помпа, банка, пакет, коробка и набор', 'زجاجة ومضخة وعبوة وكيْس وعلبة ومجموعة'),
          impact: localized('Protects the product and defines shelf presentation', '兼顾产品保护、取用方式与货架呈现', 'Protège le produit et structure sa présentation', 'Protege el producto y define su presentación'),
          start: localized('Pack count, sales channel and reference packaging', '装量、销售渠道与参考包装', 'Nombre d’unités, canal et emballage de référence', 'Cantidad, canal de venta y envase de referencia')
        },
        {
          title: localized('Brand presentation', '品牌视觉', 'Présentation de marque', 'Presentación de marca'),
          choices: localized('Colour, artwork, finish and multilingual label content', '颜色、图文、表面效果与多语言标签内容', 'Couleur, graphisme, finition et étiquetage multilingue', 'Color, diseño, acabado y etiquetado multilingüe'),
          impact: localized('Creates a coherent, market-ready product identity', '让消费者从第一眼就认出您的品牌', 'Crée une identité cohérente adaptée au marché visé', 'Crea una identidad coherente y adaptada al mercado'),
          start: localized('Logo files, brand guide and target markets', 'Logo 文件、品牌规范与目标市场', 'Logo, charte de marque et marchés cibles', 'Logotipo, guía de marca y mercados objetivo')
        }
      ]
    },
    faqTitle: localized('Questions before development begins', '开始开发前，您可能关心的问题', 'Questions avant de commencer', 'Preguntas antes de comenzar'),
    faq: [
      {
        question: localized('Can we begin from an existing product?', '可以从现有产品开始调整吗？', 'Peut-on partir d’un produit existant ?', '¿Podemos partir de un producto existente?'),
        answer: localized('Yes. Choose the closest product and tell us what you would change. That gives us a practical place to begin sampling.', '可以。现有产品能帮助您更快看见外观并体验肤感；需要调整的配方、形态或包装，可在打样时一并确认。', 'Oui. Choisissez le produit le plus proche et indiquez ce que vous souhaitez changer. C’est une base simple pour commencer les échantillons.', 'Sí. Elija el producto más cercano y díganos qué cambiaría. Es una forma práctica de empezar con las muestras.')
      },
      {
        question: localized('When is a sample needed?', '什么时候需要打样？', 'Quand faut-il réaliser un échantillon ?', '¿Cuándo se necesita una muestra?'),
        answer: localized('Sampling is used to confirm the physical format, fit, texture, fill and presentation before production details are approved.', '打样用于确认实物形态、贴合度、质地、内容量与包装呈现，再据此确认生产细节。', 'L’échantillonnage confirme le format physique, l’ajustement, la texture, le remplissage et la présentation avant validation de la production.', 'La muestra confirma el formato físico, el ajuste, la textura, el contenido y la presentación antes de aprobar la producción.')
      },
      {
        question: localized('How is the minimum order confirmed?', '起订量如何确认？', 'Comment la quantité minimale est-elle confirmée ?', '¿Cómo se confirma la cantidad mínima?'),
        answer: localized('Minimums depend on the formula, format, packaging and level of customisation. Share the product you like and we can confirm a realistic quantity.', '起订量取决于配方、产品形态、包材与定制程度。选好产品后，我们会结合实际需求确认数量。', 'Le minimum dépend de la formule, du format, de l’emballage et du niveau de personnalisation.', 'El mínimo depende de la fórmula, el formato, el envase y la personalización.', 'Минимальный заказ зависит от формулы, формата, упаковки и степени доработки.', 'تعتمد الكمية الدنيا على التركيبة وشكل المنتج والعبوة ومستوى التخصيص.')
      },
      {
        question: localized('What should we share at the start?', '开始时需要提供什么？', 'Que faut-il partager au départ ?', '¿Qué debemos compartir al empezar?'),
        answer: localized('Share the target use, preferred format, expected quantity, target market, timing and any product or packaging references you already have.', '建议提供目标用途、期望形态、预计数量、目标市场、时间计划，以及已有的产品或包装参考。', 'Précisez l’usage, le format souhaité, la quantité, le marché, le calendrier et vos références produit ou emballage.', 'Comparta el uso, el formato deseado, la cantidad, el mercado, el calendario y las referencias de producto o envase disponibles.')
      }
    ],
    action: {
      eyebrow: localized('START YOUR PRODUCT', '开始定制', 'COMMENCER VOTRE PRODUIT', 'EMPIECE SU PRODUCTO', 'НАЧНИТЕ ВАШ ПРОЕКТ', 'ابدأ منتجك'),
      title: localized('Tell us what you want to make.\nWe’ll take it from there.', '让我们为您的新品，\n准备一份看得见、摸得到的样品。', 'Dites-nous ce que vous imaginez.\nNous construirons la suite avec vous.', 'Cuéntenos qué quiere crear.\nLo desarrollaremos juntos.'),
      body: localized('Share the product type, quantity, market and timing. A product advisor will reply with the most useful next step.', '无论已经有完整方案，还是只有护理部位与参考图片，都可以开始。结合预计数量和目标市场，我们会给出可行的样品与报价建议。', 'Partagez le type de produit, la quantité, le marché et le calendrier. Un conseiller vous proposera la suite la plus utile.', 'Comparta el tipo de producto, la cantidad, el mercado y los plazos. Un asesor le propondrá el siguiente paso más útil.'),
      primary: localized('Start a custom product', '提交定制需求', 'Commencer un produit sur mesure', 'Empezar un producto a medida'),
      secondary: localized('Browse products', '浏览产品', 'Voir les produits', 'Ver productos', 'Смотреть продукты', 'تصفح المنتجات')
    }
  },
  process: {
    seoTitle: localized('Product Development Process', '产品开发流程', 'Processus de développement produit', 'Proceso de desarrollo de productos', 'Процесс разработки продукта', 'مراحل تطوير المنتج'),
    seoDescription: localized('See how skincare, body care, makeup and hydrogel products move from an idea to samples, production and delivery.', '了解护肤、身体护理、底妆与水凝胶产品如何从想法走向打样、生产与交付。', 'Découvrez comment les soins, le maquillage et l’hydrogel passent de l’idée à l’échantillon puis à la production.', 'Descubra cómo cosmética, maquillaje e hidrogel pasan de la idea a la muestra y la producción.', 'Узнайте, как косметика и гидрогелевые продукты проходят путь от идеи до образца и производства.', 'تعرّف كيف تنتقل منتجات العناية والمكياج والهيدروجيل من الفكرة إلى العينة والإنتاج.'),
    intro: {
      eyebrow: localized('DEVELOPMENT PROCESS', '开发流程', 'PROCESSUS DE DÉVELOPPEMENT', 'PROCESO DE DESARROLLO'),
      title: localized('An idea, a sample,\nthen a finished product.', '从品牌设想，\n到消费者拿在手里的成品。', 'Une idée, un échantillon,\npuis un produit fini.', 'Una idea, una muestra\ny después un producto terminado.', 'Идея, образец,\nготовый продукт.', 'فكرة، ثم عينة،\nثم منتج نهائي.'),
      body: localized('We shape the product with you, make a physical sample, prepare it for production and stay with it through delivery.', '贴合度、肤感、颜色与包装，都可以用实物亲自确认；满意的样品，也会继续作为生产、检查与交付的重要参考。', 'Nous façonnons le produit avec vous, réalisons un échantillon, préparons la production et suivons le projet jusqu’à la livraison.', 'Damos forma al producto con usted, preparamos una muestra, organizamos la producción y acompañamos el proyecto hasta la entrega.'),
      meta: [
        localized('Product idea', '产品想法', 'Idée produit', 'Idea de producto'),
        localized('Formula & format', '配方与形态', 'Formule et format', 'Fórmula y formato'),
        localized('Sampling', '打样', 'Échantillonnage', 'Muestras'),
        localized('Packaging details', '包装信息', 'Détails d’emballage', 'Detalles del envase'),
        localized('Production', '量产', 'Production', 'Producción'),
        localized('Delivery', '交付', 'Livraison', 'Entrega')
      ]
    },
    stepsTitle: localized('A straightforward way to get from idea to delivery.', '把需要调整的细节，留在量产之前解决。', 'Un chemin simple de l’idée à la livraison.', 'Un camino sencillo desde la idea hasta la entrega.'),
    steps: [
      {
        title: localized('Tell us about the product', '产品方向清楚，打样少走弯路', 'Parlez-nous du produit', 'Cuéntenos sobre el producto'),
        body: localized('Start with the area of use, target market, quantity, timing and the kind of experience you want to create.', '护理部位、目标市场、预计数量、上市时间和理想肤感，会帮助我们更准确地理解这款新品。', 'Commencez par la zone d’usage, le marché, la quantité, le calendrier et l’expérience recherchée.', 'Empiece por la zona de uso, el mercado, la cantidad, los plazos y la experiencia que desea crear.'),
        note: localized('A clear product direction', '品牌想要的产品体验', 'Une direction produit claire', 'Una dirección de producto clara')
      },
      {
        title: localized('Choose the feel and format', '配方与形态，落到真实样品', 'Choisir la texture et le format', 'Elegir la textura y el formato'),
        body: localized('Bring together the formula, product format, texture, fill and packaging.', '配方、产品形态、质地、内容量与包装，共同决定首轮样品的外观和使用感。', 'Réunissez la formule, le format, la texture, la contenance et l’emballage.', 'Combine fórmula, formato, textura, contenido y envase.', 'Согласуйте формулу, формат, текстуру, объём и упаковку.', 'اجمع بين التركيبة والشكل والقوام والكمية والعبوة.'),
        note: localized('A recipe for the first sample', '看得见的首轮样品', 'La base du premier échantillon', 'La base de la primera muestra')
      },
      {
        title: localized('Try the sample', '亲自贴、亲自看，再决定', 'Essayer l’échantillon', 'Probar la muestra'),
        body: localized('See how it feels, looks and handles. Adjust what matters before moving on.', '质地、颜色、肤感与取用方式都能被真实感受，重要细节在量产前得到调整。', 'Évaluez la sensation, l’aspect et l’utilisation, puis ajustez les détails.', 'Compruebe la sensación, el aspecto y el uso, y ajuste lo necesario.', 'Оцените ощущения, внешний вид и применение, затем внесите изменения.', 'قيّم الإحساس والمظهر وطريقة الاستخدام ثم عدّل ما يلزم.'),
        note: localized('A sample you are happy with', '品牌认可的实物样品', 'Un échantillon qui vous convient', 'Una muestra que le convence')
      },
      {
        title: localized('Finish the pack details', '包装与市场信息一起落定', 'Finaliser l’emballage', 'Completar los detalles del envase'),
        body: localized('Set the artwork, label content, pack count and any information needed for the destination market.', '品牌图文、标签内容、装量与目标市场要求，在量产前一并核对。', 'Définissez le graphisme, l’étiquetage, le nombre d’unités et les informations utiles au marché visé.', 'Defina el diseño, el etiquetado, la cantidad por envase y la información necesaria para el mercado de destino.'),
        note: localized('A pack ready to produce', '可以投产的包装', 'Un emballage prêt à produire', 'Un envase listo para producir')
      },
      {
        title: localized('Move into production', '按确认样品稳定生产', 'Passer en production', 'Pasar a producción'),
        body: localized('The agreed sample and pack details become the reference for preparation, forming, filling and packing.', '确认样品与包装细节成为配制、成型、灌装和包装的共同标准。', 'L’échantillon et l’emballage convenus servent de référence pour la préparation, le formage, le remplissage et le conditionnement.', 'La muestra y el envase acordados sirven de referencia para la preparación, el formado, el llenado y el empaque.'),
        note: localized('Your production batch', '品牌确认过的标准', 'Votre lot de production', 'Su lote de producción')
      },
      {
        title: localized('Pack and deliver', '完成检查，安心安排交付', 'Emballer et livrer', 'Empacar y entregar'),
        body: localized('After the agreed checks, finished products are packed and prepared for shipment.', '成品通过约定检查后完成包装，带着清晰批次信息准备出货。', 'Après les contrôles, les produits finis sont emballés pour l’expédition.', 'Después de los controles, los productos terminados se envasan para su envío.', 'После проверок готовые продукты упаковывают для отправки.', 'بعد الفحوصات تُغلف المنتجات النهائية للشحن.'),
        note: localized('Finished products on their way', '准备启程的品牌成品', 'Produits finis en route', 'Productos terminados en camino', 'Готовые продукты к отправке', 'المنتجات جاهزة للشحن')
      }
    ],
    controlsTitle: localized('Before production, three things need to be clear.', '量产依据越清楚，成品越接近您确认的样品。', 'Avant la production, trois points doivent être clairs.', 'Antes de producir, tres cosas deben quedar claras.'),
    controls: [
      {title: localized('The product', '产品本身', 'Le produit', 'El producto'), body: localized('Formula, format, dimensions, weight and fill match the sample you selected.', '配方、形态、尺寸、克重与内容量，以确认的样品为准。', 'La formule, le format, les dimensions, le poids et le remplissage correspondent à l’échantillon choisi.', 'La fórmula, el formato, las dimensiones, el peso y el contenido coinciden con la muestra elegida.')},
      {title: localized('The packaging', '包装呈现', 'L’emballage', 'El envase'), body: localized('Artwork, labels, pack count and finishes are ready for production.', '图文、标签、装量与表面效果均已准备好进入生产。', 'Le graphisme, les étiquettes, le nombre d’unités et les finitions sont prêts.', 'El diseño, las etiquetas, la cantidad y los acabados están listos.')},
      {title: localized('The order', '订单信息', 'La commande', 'El pedido'), body: localized('Quantity, timing and delivery details are agreed before the line starts.', '数量、时间与交付信息，在开线生产前确定。', 'La quantité, le calendrier et la livraison sont convenus avant le lancement.', 'La cantidad, los plazos y la entrega se acuerdan antes de iniciar la línea.')}
    ],
    faqTitle: localized('A few practical questions', '几个常见的实际问题', 'Quelques questions pratiques', 'Algunas preguntas prácticas'),
    faq: [
      {question: localized('Can we start before every detail is decided?', '信息还不完整，可以开始吗？', 'Peut-on commencer avant que tout soit décidé ?', '¿Podemos empezar antes de definirlo todo?'), answer: localized('Yes. The product type, target market, rough quantity and timing are enough for a first conversation.', '可以。已有的产品类型、目标市场、大致数量与时间，已经足够进行第一轮沟通。', 'Oui. Le type de produit, le marché, une quantité approximative et le calendrier suffisent pour un premier échange.', 'Sí. El tipo de producto, el mercado, una cantidad aproximada y los plazos bastan para una primera conversación.')},
      {question: localized('When can you confirm price and lead time?', '价格和交期何时可以确认？', 'Quand confirmez-vous le prix et le délai ?', '¿Cuándo se confirman el precio y el plazo?'), answer: localized('Once the product, quantity, packaging and amount of custom work are clear, we can give a useful quotation and schedule.', '产品、数量、包装与定制程度明确后，就可以提供有参考价值的报价与时间。', 'Lorsque le produit, la quantité, l’emballage et le niveau de personnalisation sont clairs, nous pouvons établir un devis et un calendrier utiles.', 'Cuando estén claros el producto, la cantidad, el envase y el grado de personalización, podremos ofrecer un precio y un calendario útiles.')},
      {question: localized('Can we change the product after seeing the sample?', '看到样品后还能调整吗？', 'Peut-on modifier le produit après l’échantillon ?', '¿Podemos cambiar el producto después de ver la muestra?'), answer: localized('Yes. Changes to formula, fit, fill or packaging can be tested in another sample before production.', '可以。配方、版型、内容量或包装的调整，都可以在量产前通过新样品确认。', 'Oui. Les changements de formule, d’ajustement, de remplissage ou d’emballage peuvent être testés sur un nouvel échantillon.', 'Sí. Los cambios de fórmula, ajuste, contenido o envase pueden probarse en otra muestra antes de producir.')},
      {question: localized('Should we tell you the destination market?', '需要说明目标市场吗？', 'Faut-il indiquer le marché de destination ?', '¿Debemos indicar el mercado de destino?'), answer: localized('Yes. It helps us discuss the label, pack information and testing questions that may matter for that market.', '需要。目标市场会影响标签、包装信息与相关检测要求，越早说明越好。', 'Oui. Cela aide à aborder l’étiquetage, les informations d’emballage et les essais qui peuvent compter sur ce marché.', 'Sí. Ayuda a tratar el etiquetado, la información del envase y las pruebas que pueden ser importantes en ese mercado.')}
    ],
    action: {
      eyebrow: localized('START WITH A SAMPLE', '从样品开始', 'COMMENCER PAR UN ÉCHANTILLON', 'EMPEZAR CON UNA MUESTRA'),
      title: localized('Ready to turn the idea\ninto something you can hold?', '把想法，变成一份\n可以亲自体验的样品。', 'Prêt à transformer l’idée\nen un produit à tenir en main ?', '¿Listo para convertir la idea\nen algo que pueda tener en sus manos?'),
      body: localized('Choose an existing product or tell us what you want to create. We’ll help you find the most useful first sample.', '选择现有产品，或分享希望实现的形态、肤感与包装。结合预计数量和目标市场，我们会推荐更值得先确认的样品。', 'Choisissez un produit existant ou décrivez ce que vous souhaitez créer. Nous aiderons à définir le premier échantillon.', 'Elija un producto existente o cuéntenos qué quiere crear. Le ayudaremos a definir la primera muestra.', 'Выберите существующий продукт или расскажите о своей идее, и мы предложим первый образец.', 'اختر منتجاً موجوداً أو أخبرنا بما تريد تطويره، وسنساعدك في تحديد أول عينة.'),
      primary: localized('Ask for a sample', '申请样品', 'Demander un échantillon', 'Solicitar una muestra'),
      secondary: localized('Explore custom development', '了解定制开发', 'Explorer le sur-mesure', 'Explorar el desarrollo a medida')
    }
  },
  factory: {
    seoTitle: localized('Manufacturing & Quality Controls', '制造与品控', 'Fabrication et contrôles qualité', 'Fabricación y controles de calidad'),
    seoDescription: localized('Explore formulation, filling, quality checks and packaging for skincare, body care, makeup and hydrogel products.', '了解护肤、身体护理、底妆与水凝胶产品的配制、灌装、品控和包装流程。', 'Découvrez la formulation, le remplissage, les contrôles et l’emballage des soins et produits hydrogel.', 'Descubra formulación, llenado, control y envasado de cosméticos e hidrogel.', 'Узнайте о разработке формул, розливе, контроле качества и упаковке косметики и гидрогелевых продуктов.', 'تعرّف على التركيبة والتعبئة وفحص الجودة والتغليف لمنتجات العناية بالبشرة والهيدروجيل.'),
    intro: {
      eyebrow: localized('MANUFACTURING & QUALITY', '制造与品控', 'FABRICATION ET QUALITÉ', 'FABRICACIÓN Y CALIDAD'),
      title: localized('Made with care.\nChecked as it moves.', '您确认过的样品，\n就是生产要守住的标准。', 'Fabriqué avec soin.\nContrôlé à chaque étape.', 'Fabricado con cuidado.\nControlado en cada paso.'),
      body: localized('The agreed sample sets the reference. Formula, fill, pack integrity and presentation are checked against the product-specific standard.', '确认样品是生产参考；配方、内容量、包装完整性与外观按对应产品标准检查。', 'L’échantillon validé sert de référence pour contrôler formule, remplissage, emballage et présentation.', 'La muestra aprobada guía la revisión de fórmula, contenido, integridad del envase y presentación.', 'Утверждённый образец служит эталоном для проверки формулы, наполнения, упаковки и внешнего вида.', 'تكون العينة المعتمدة مرجعاً لفحص التركيبة والكمية وسلامة العبوة والمظهر.'),
      meta: [localized('Formula preparation', '配方制备', 'Préparation de la formule', 'Preparación de la fórmula'), localized('Forming & filling', '成型与灌装', 'Formage et remplissage', 'Formado y llenado'), localized('Product checks', '成品检查', 'Contrôles produit', 'Controles del producto'), localized('Packing', '包装出货', 'Conditionnement', 'Empaque')]
    },
    stagesTitle: localized('From prepared materials to packed finished goods.', '每一批产品，都要守住样品确认的肤感与呈现。', 'Des matières préparées aux produits finis emballés.', 'De los materiales preparados al producto terminado y empacado.'),
    stages: [
      {title: localized('Prepare the formula', '配制内容物', 'Préparer la formule', 'Preparar la fórmula'), body: localized('Ingredients and materials are prepared according to the agreed sample and product details.', '根据确认的样品与产品信息，准备原料与材料。', 'Les ingrédients et matières sont préparés selon l’échantillon et les détails convenus.', 'Los ingredientes y materiales se preparan según la muestra y los detalles acordados.')},
      {title: localized('Form, fill and pack', '成型、灌装与包装', 'Former, remplir et emballer', 'Formar, llenar y envasar', 'Формование, розлив и упаковка', 'التشكيل والتعبئة والتغليف'), body: localized('The product is formed or filled and packed using the process suited to its format.', '根据产品形态选择对应的成型、灌装与包装流程。', 'Le produit est formé ou rempli et emballé selon son format.', 'El producto se forma o llena y envasa según su formato.', 'Продукт формуют или разливают и упаковывают в соответствии с форматом.', 'يُشكّل المنتج أو يُعبأ ويُغلف وفقاً لشكله.')},
      {title: localized('Check the finished product', '检查成品', 'Contrôler le produit fini', 'Comprobar el producto terminado', 'Проверка готового продукта', 'فحص المنتج النهائي'), body: localized('Appearance, content, pack integrity and presentation are compared with the agreed standard.', '对照确认标准，检查外观、内容量、包装完整性与呈现效果。', 'L’aspect, la contenance, l’intégrité de l’emballage et la présentation sont comparés à la référence.', 'Se comparan aspecto, contenido, integridad del envase y presentación con la referencia.', 'Внешний вид, объём, целостность упаковки и оформление сверяют с эталоном.', 'تُقارن الهيئة والمحتوى وسلامة العبوة والمظهر العام بالمعيار المتفق عليه.')},
      {title: localized('Pack for delivery', '包装并准备交付', 'Emballer pour la livraison', 'Empacar para la entrega'), body: localized('Finished goods are counted, packed and prepared for shipment with batch identification kept together.', '成品完成清点、装箱并准备出货，同时保留对应批次标识。', 'Les produits finis sont comptés, emballés et préparés pour l’expédition avec leur identification de lot.', 'Los productos terminados se cuentan, empacan y preparan para el envío con su identificación de lote.')}
    ],
    checksTitle: localized('A control plan can cover these product characteristics.', '从外观到批次信息，关键细节都有检查依据。', 'Le plan de contrôle peut couvrir ces caractéristiques.', 'El plan de control puede cubrir estas características.'),
    checks: [
      {title: localized('Appearance & dimensions', '外观与尺寸', 'Aspect et dimensions', 'Aspecto y dimensiones'), body: localized('Format, colour, cut, surface condition and dimensional consistency', '形态、颜色、裁切、表面状态与尺寸一致性', 'Format, couleur, découpe, état de surface et régularité dimensionnelle', 'Formato, color, corte, superficie y consistencia dimensional')},
      {title: localized('Weight & fill', '克重与内容量', 'Poids et remplissage', 'Peso y contenido'), body: localized('Material weight, net content and agreed tolerances', '材料克重、净含量与约定允差', 'Grammage, contenu net et tolérances convenues', 'Gramaje, contenido neto y tolerancias acordadas')},
      {title: localized('Integrity & handling', '完整性与取用', 'Intégrité et manipulation', 'Integridad y manejo'), body: localized('Seal condition, leakage checks and pack handling as applicable', '根据产品检查封口状态、泄漏风险与包装取用', 'État du scellage, contrôle des fuites et manipulation selon le produit', 'Estado del sellado, control de fugas y manejo según el producto')},
      {title: localized('Identity & records', '标识与记录', 'Identification et dossiers', 'Identidad y registros'), body: localized('Artwork version, coding, pack count and batch documentation', '图文版本、批次标识、装量与批次文件', 'Version graphique, codage, quantité et documentation de lot', 'Versión gráfica, codificación, cantidad y documentación de lote')}
    ],
    evidence: {
      eyebrow: localized('THE FACTORY IN VIEW', '看得见的生产现场', 'L’USINE EN IMAGES', 'LA FÁBRICA EN IMÁGENES'),
      title: localized('A closer look at production.', '走近产品的生产过程。', 'Un regard sur la production.', 'Una mirada a la producción.', 'Взгляд на производство.', 'نظرة على الإنتاج.'),
      body: localized('The images above show production, inspection and final assembly scenes from the materials supplied for this website.', '生产、检查与成品装配现场，让品牌在合作前更直观地了解产品如何被做出来。', 'Les images ci-dessus, issues des documents fournis pour ce site, montrent la production, le contrôle et l’assemblage final.', 'Las imágenes anteriores, facilitadas para este sitio, muestran escenas de producción, control y ensamblaje final.')
    },
    action: {
      eyebrow: localized('MAKE YOUR PRODUCT', '开始制作您的产品', 'FABRIQUER VOTRE PRODUIT', 'FABRICAR SU PRODUCTO', 'СОЗДАЙТЕ СВОЙ ПРОДУКТ', 'اصنع منتجك'),
      title: localized('Have a sample in mind?\nLet’s talk about production.', '样品已经满意？\n让我们继续确认量产安排。', 'Vous avez un échantillon en tête ?\nParlons production.', '¿Tiene una muestra en mente?\nHablemos de producción.'),
      body: localized('Share the product, expected quantity, packaging and preferred timing. We can discuss a practical way forward.', '提供产品、预计数量、包装与期望时间，即可进一步确认起订量、报价、排产与交期。', 'Partagez le produit, la quantité, l’emballage et le calendrier souhaité. Nous pourrons envisager une suite concrète.', 'Comparta el producto, la cantidad, el envase y los plazos deseados. Podemos hablar de una forma práctica de avanzar.'),
      primary: localized('Discuss production', '沟通生产需求', 'Parler de production', 'Hablar de producción'),
      secondary: localized('View the development process', '查看开发流程', 'Voir le processus', 'Ver el proceso')
    }
  },
  about: {
    seoTitle: localized('About Showki Biotech', '关于修齐生物', 'À propos de Showki Biotech', 'Acerca de Showki Biotech'),
    seoDescription: localized('Founded in Guangzhou in 2015, Showki Biotech develops skincare, body care, makeup and hydrogel products for OEM/ODM partners.', '修齐生物于 2015 年在广州成立，为品牌开发护肤、身体护理、底妆与水凝胶产品。', 'Fondée à Guangzhou en 2015, Showki Biotech développe des soins, du maquillage et des produits hydrogel pour les marques.', 'Fundada en Guangzhou en 2015, Showki Biotech desarrolla cosmética, maquillaje e hidrogel para marcas.', 'Основанная в Гуанчжоу в 2015 году компания Showki Biotech разрабатывает для брендов косметику, средства для тела, макияж и гидрогелевые продукты.', 'تأسست شوكي بيوتك في قوانغتشو عام 2015، وتطور للعلامات التجارية منتجات العناية بالبشرة والجسم والمكياج والهيدروجيل.'),
    intro: {
      eyebrow: localized('ABOUT SHOWKI', '关于修齐', 'À PROPOS DE SHOWKI', 'ACERCA DE SHOWKI'),
      title: localized('Skincare products,\nmade for your brand.', '从产品构想，到品牌成品。', 'Des soins créés\npour votre marque.', 'Cosmética creada\npara tu marca.'),
        body: localized('Founded in Guangzhou in 2015, we develop and produce skincare, body care, makeup and hydrogel products for brands. Our OEM/ODM work connects formulation, packaging, samples and production.', '2015 年成立于广州，我们为品牌开发并生产护肤、身体护理、底妆与水凝胶产品，让配方、包材、样品和量产衔接起来。', 'Fondée à Guangzhou en 2015, nous développons des soins, du maquillage et des produits hydrogel pour les marques.', 'Desde 2015 en Guangzhou, desarrollamos cosmética, maquillaje e hidrogel para marcas.', 'С 2015 года мы разрабатываем и производим в Гуанчжоу косметику, средства для тела, макияж и гидрогелевые продукты, связывая рецептуру, упаковку, образцы и производство.', 'منذ عام 2015 نطور وننتج في قوانغتشو منتجات العناية بالبشرة والجسم والمكياج والهيدروجيل، ونربط بين التركيبة والعبوة والعينة والإنتاج.'),
      meta: [localized('Guangzhou · Since 2015', '广州 · 始于 2015', 'Guangzhou · Depuis 2015', 'Guangzhou · Desde 2015'), localized('Skincare · body care · makeup', '护肤 · 身体护理 · 底妆', 'Soins · corps · maquillage', 'Cuidado facial · corporal · maquillaje'), localized('Hydrogel know-how', '水凝胶经验', 'Savoir-faire hydrogel', 'Experiencia en hidrogel'), localized('Sample to production', '从样品到生产', 'De l’échantillon à la production', 'De la muestra a la producción')]
    },
    belief: {
      eyebrow: localized('HOW WE WORK', '工作方式', 'NOTRE APPROCHE', 'CÓMO TRABAJAMOS'),
      title: localized('A good product starts with how it should feel.', '好产品，从真实肤感出发。', 'Un bon produit commence par la sensation recherchée.', 'Un buen producto empieza por la experiencia de uso.', 'Хороший продукт начинается с желаемых ощущений.', 'يبدأ المنتج الجيد من تجربة استخدامه.'),
      body: localized('Texture, application, fragrance and packaging all shape the experience. We use samples to confirm those details before production.', '质地、取用方式、香型与包装，都会影响消费者对产品的判断。修齐用实物样品，让这些感受在量产前得到确认。', 'Texture, application, parfum et emballage façonnent l’expérience. Les échantillons permettent de les vérifier avant la production.', 'Textura, aplicación, fragancia y envase definen la experiencia. Las muestras ayudan a confirmarlos antes de producir.', 'Текстура, нанесение, аромат и упаковка определяют впечатление. Образцы помогают согласовать детали до производства.', 'يحدد القوام وطريقة الاستخدام والرائحة والعبوة التجربة. وتساعد العينات على تأكيدها قبل الإنتاج.')
    },
    practicesTitle: localized('How we bring a product to life.', '从肤感出发，也把品质落实到成品。', 'Comment nous concrétisons un produit.', 'Cómo damos vida a un producto.', 'Как мы воплощаем продукт в жизнь.', 'كيف نحول الفكرة إلى منتج.'),
    practices: [
      {title: localized('Start with the experience', '消费者感受优先', 'Partir de l’expérience', 'Empezar por la experiencia'), body: localized('Tell us how the product is used, how it should feel and what customers should notice first.', '使用场景、理想触感与消费者最先感受到的卖点，共同定义产品体验。', 'Décrivez l’usage, la sensation recherchée et le premier bénéfice perçu.', 'Describa el uso, la sensación deseada y el primer beneficio percibido.', 'Расскажите о применении, желаемых ощущениях и ключевом впечатлении.', 'أخبرنا بطريقة الاستخدام والإحساس المطلوب وأول ما يلاحظه العميل.')},
      {title: localized('Make it tangible', '让实物样品说话', 'Rendre l’idée tangible', 'Hacer tangible la idea'), body: localized('A physical sample lets you judge colour, texture, fill and presentation together.', '颜色、质地、内容量与包装呈现，都能通过实物样品一起判断。', 'Un échantillon permet de juger ensemble couleur, texture, contenance et présentation.', 'Una muestra permite valorar color, textura, contenido y presentación.', 'Образец позволяет оценить цвет, текстуру, объём и оформление.', 'تتيح العينة تقييم اللون والقوام والكمية والمظهر معاً.')},
      {title: localized('Carry it through production', '确认标准贯穿量产', 'L’accompagner en production', 'Llevarla a producción'), body: localized('The chosen sample becomes the reference as the product is made, checked and packed.', '品牌认可的样品，会继续作为生产、检查与包装的共同参考。', 'L’échantillon choisi sert de référence pendant la fabrication, le contrôle et l’emballage.', 'La muestra elegida sirve de referencia durante la fabricación, el control y el envasado.', 'Утверждённый образец остаётся эталоном при производстве, проверке и упаковке.', 'تبقى العينة المعتمدة مرجعاً أثناء التصنيع والفحص والتغليف.')}
    ],
    trustTitle: localized('What we bring to the table.', '让每次合作，有据可依。', 'Ce que nous apportons à votre projet.', 'Lo que aportamos a su proyecto.'),
    trust: [
      {title: localized('A broad product range', '丰富而聚焦的产品线', 'Une large gamme de produits', 'Una amplia gama de productos', 'Широкая линейка продуктов', 'مجموعة واسعة من المنتجات'), body: localized('Twelve care ranges span cleansing, repair, body care, sun care and makeup, alongside hydrogel formats.', '十二个业务系列覆盖清洁、修护、身体护理、防晒与底妆，并保留水凝胶专长。', 'Douze gammes couvrent nettoyage, réparation, corps, solaire et maquillage, avec des formats hydrogel.', 'Doce gamas incluyen limpieza, reparación, cuerpo, protección solar y maquillaje, además de hidrogel.', 'Двенадцать направлений охватывают очищение, восстановление, тело, SPF и макияж, включая гидрогель.', 'تشمل اثنتا عشرة فئة التنظيف والإصلاح والعناية بالجسم والوقاية من الشمس والمكياج إلى جانب الهيدروجيل.')},
      {title: localized('Hydrogel experience', '水凝胶工艺积累', 'Expérience hydrogel', 'Experiencia en hidrogel'), body: localized('Our materials and process knowledge support cooling, flexible and close-fitting gel formats.', '材料与工艺经验，支撑清凉、柔韧、贴合等不同凝胶体验。', 'Notre connaissance des matières et procédés soutient des formats gel frais, souples et bien ajustés.', 'Nuestro conocimiento de materiales y procesos permite formatos de gel frescos, flexibles y ceñidos.')},
      {title: localized('Real samples', '实物样品确认', 'Des échantillons réels', 'Muestras reales'), body: localized('The product is judged in the hand and on the skin, not from copy alone.', '颜色、肤感、贴合度与取用体验，由品牌亲自拿在手里、贴在皮肤上判断。', 'Le produit se juge en main et sur la peau, pas seulement sur le papier.', 'El producto se valora en la mano y sobre la piel, no solo con palabras.')},
      {title: localized('Production follow-through', '样品标准贯穿生产', 'Suivi de production', 'Seguimiento de producción'), body: localized('The agreed sample stays at the centre as the order moves through making, checking and packing.', '订单进入制作、检查与包装后，确认样品仍是重要参考。', 'L’échantillon convenu reste la référence pendant la fabrication, le contrôle et l’emballage.', 'La muestra acordada sigue siendo la referencia durante la fabricación, el control y el empaque.')}
    ],
    action: {
      eyebrow: localized('DISCUSS YOUR PRODUCT', '沟通产品项目', 'ÉCHANGER SUR VOTRE PRODUIT', 'HABLAR DE SU PRODUCTO', 'ОБСУДИТЬ ПРОДУКТ', 'ناقش منتجك'),
      title: localized('Start with the product\nyour brand wants to make.', '一起做出品牌的下一款。', 'Commencez par le produit\nque votre marque souhaite créer.', 'Empiece por el producto\nque su marca quiere crear.'),
      body: localized('Share the product type, target market, expected quantity and timing. We’ll help you choose the most useful place to start.', '提供产品类型、目标市场、预计数量与上市时间，我们会推荐更合适的现有产品与样品方向。', 'Partagez le type de produit, le marché, la quantité et le calendrier. Nous vous aiderons à choisir le meilleur point de départ.', 'Comparta el tipo de producto, el mercado, la cantidad y los plazos. Le ayudaremos a elegir el mejor punto de partida.'),
      primary: localized('Discuss your product', '沟通产品需求', 'Parler de votre produit', 'Hablar de su producto'),
      secondary: localized('View products', '查看产品', 'Voir les produits', 'Ver productos', 'Смотреть продукты', 'تصفح المنتجات')
    }
  },
  contact: {
    seoTitle: localized('Contact Showki Biotech', '联系修齐生物', 'Contacter Showki Biotech', 'Contactar con Showki Biotech'),
    seoDescription: localized('Contact Showki Biotech about skincare, body care, makeup and hydrogel products, samples, custom development and pricing.', '联系修齐生物，咨询护肤、身体护理、底妆与水凝胶产品、样品、定制开发和报价。', 'Contactez Showki Biotech pour les soins, le maquillage, l’hydrogel, les échantillons et les devis.', 'Contacte con Showki Biotech sobre cosmética, maquillaje, hidrogel, muestras y presupuestos.', 'Свяжитесь с Showki Biotech по вопросам косметики, макияжа, гидрогеля, образцов и цен.', 'تواصل مع شوكي بيوتك بشأن منتجات العناية والمكياج والهيدروجيل والعينات والأسعار.'),
    intro: {
      eyebrow: localized('CONTACT US', '联系我们', 'NOUS CONTACTER', 'CONTACTO'),
      title: localized('Start with a product,\na sample, or a question.', '聊聊您的\n下一款产品。', 'Commencez par un produit,\nun échantillon ou une question.', 'Empiece con un producto,\nuna muestra o una pregunta.'),
      body: localized('Browse the range, ask for samples or tell us what you want to make. A product advisor will continue with you by email.', '想比较现有产品、申请样品，或开发新的配方与包装，都欢迎来聊。样品、报价与交期会通过工作邮箱继续确认。', 'Parcourez la gamme, demandez des échantillons ou décrivez ce que vous souhaitez créer. Un conseiller poursuivra l’échange par e-mail.', 'Explore la gama, solicite muestras o cuéntenos qué quiere crear. Un asesor continuará la conversación por correo.'),
      meta: [localized('Product catalogue', '产品目录', 'Catalogue produits', 'Catálogo de productos'), localized('Samples', '样品', 'Échantillons', 'Muestras'), localized('Pricing', '报价', 'Tarifs', 'Precios')]
    },
    pathsTitle: localized('Three simple ways to begin.', '想看产品、拿样品，还是询报价？都可以直接聊。', 'Trois façons simples de commencer.', 'Tres formas sencillas de empezar.'),
    paths: [
      {title: localized('Browse products', '浏览现有产品', 'Voir les produits', 'Ver productos', 'Смотреть продукты', 'تصفح المنتجات'), body: localized('Compare product formats, ingredients and packaging before choosing a direction to discuss.', '查看产品的形态、成分、功效方向和包装，找到值得进一步了解的款式。', 'Comparez formats, ingrédients et emballages avant de choisir une direction.', 'Compare formatos, ingredientes y envases antes de elegir.', 'Сравните форматы, ингредиенты и упаковку перед выбором.', 'قارن الأشكال والمكونات والعبوات قبل اختيار المنتج.'), path: 'products', label: localized('View the catalogue', '浏览产品目录', 'Voir le catalogue', 'Ver el catálogo')},
      {title: localized('Request samples', '申请产品样品', 'Demander des échantillons', 'Solicitar muestras'), body: localized('Tell us which products or qualities you want to compare. We’ll reply with available options, cost and timing.', '用实物比较颜色、质地、肤感与包材，并确认可选样品、费用与寄送时间。', 'Indiquez les produits ou qualités à comparer. Nous répondrons avec les options, le coût et le délai.', 'Indique qué productos o cualidades desea comparar. Le responderemos con opciones, coste y plazos.'), path: 'inquiry', label: localized('Ask for samples', '申请产品样品', 'Demander des échantillons', 'Solicitar muestras')},
      {title: localized('Ask for pricing', '获取产品报价', 'Demander un tarif', 'Solicitar precios'), body: localized('Share the product, quantity, market and preferred timing so we can prepare a useful quotation.', '提交感兴趣的产品、预计数量、目标市场与上市时间，获取更有参考价值的报价。', 'Indiquez le produit, la quantité, le marché et le calendrier souhaité afin que nous puissions préparer un devis utile.', 'Indique el producto, la cantidad, el mercado y los plazos para que podamos preparar una cotización útil.'), path: 'inquiry', label: localized('Share order details', '提交需求并获取报价', 'Partager les détails', 'Compartir los detalles')}
    ],
    prepareTitle: localized('A few details help us answer well.', '有这些信息，样品与报价会更接近您的真实计划。', 'Quelques détails nous aident à bien répondre.', 'Unos pocos datos nos ayudan a responder mejor.'),
    prepare: [
      {title: localized('Product', '产品', 'Produit', 'Producto'), body: localized('Product area, preferred format and intended use', '使用部位、期望形态与目标用途', 'Zone, format souhaité et usage', 'Zona, formato deseado y uso')},
      {title: localized('Change or reference', '希望调整的内容', 'Modification ou référence', 'Cambio o referencia'), body: localized('Existing product, desired change or visual reference', '现有产品、希望调整的细节或视觉参考', 'Produit existant, modification souhaitée ou référence visuelle', 'Producto existente, cambio deseado o referencia visual')},
      {title: localized('Quantity', '数量', 'Quantité', 'Cantidad'), body: localized('Expected first order or an approximate range', '首批预计数量或大致范围', 'Première commande prévue ou fourchette', 'Primer pedido previsto o rango aproximado')},
      {title: localized('Market & timing', '市场与时间', 'Marché et calendrier', 'Mercado y calendario'), body: localized('Destination market and preferred launch or delivery period', '目标市场与期望上市或交付时间', 'Marché de destination et période de lancement ou livraison', 'Mercado de destino y periodo de lanzamiento o entrega')}
    ],
    nextTitle: localized('What happens next.', '一次有效回复，应该把产品、样品与商务条件说得更清楚。', 'Ce qui se passe ensuite.', 'Qué ocurre después.'),
    next: [
      {title: localized('We read your message', '更合适的产品方向', 'Nous lisons votre message', 'Leemos su mensaje'), body: localized('A product advisor looks at the product, quantity, market and timing you shared.', '结合使用场景、理想肤感与目标市场，给出更值得比较的产品方向。', 'Un conseiller regarde le produit, la quantité, le marché et le calendrier indiqués.', 'Un asesor revisa el producto, la cantidad, el mercado y los plazos que compartió.')},
      {title: localized('We ask what matters', '可执行的样品建议', 'Nous posons les questions utiles', 'Preguntamos lo importante'), body: localized('If a detail is needed for samples or pricing, we will ask for it clearly.', '说明可选样品、需要确认的配方或包装细节，以及相应费用和时间。', 'Si un détail est nécessaire pour les échantillons ou le prix, nous vous le demanderons clairement.', 'Si hace falta algún dato para las muestras o el precio, se lo pediremos con claridad.')},
      {title: localized('We reply by email', '更清楚的商务条件', 'Nous répondons par e-mail', 'Respondemos por correo'), body: localized('The conversation continues through the business email supplied in the form.', '起订量、报价、排产与交期，会结合具体产品和数量通过工作邮箱确认。', 'L’échange se poursuit via l’adresse professionnelle indiquée dans le formulaire.', 'La conversación continúa por el correo profesional indicado en el formulario.')}
    ],
    action: {
      eyebrow: localized('SHARE YOUR PRODUCT PLAN', '分享产品计划', 'PARTAGER VOTRE PROJET', 'COMPARTIR SU PROYECTO'),
      title: localized('Tell us what you want to make.\nWe’ll reply with a useful next step.', '新品还没有完全定型，\n也可以现在开始沟通。', 'Dites-nous ce que vous souhaitez créer.\nNous vous proposerons la suite.', 'Cuéntenos qué quiere crear.\nLe propondremos el siguiente paso.'),
      body: localized('It is fine if every detail is not decided yet. Share what you know and what you would like help with.', '有产品想法、参考图片或预计数量中的任意一项，就可以开始。我们会结合目标市场，进一步沟通样品、报价与待确认细节。', 'Ce n’est pas grave si tout n’est pas encore décidé. Partagez ce que vous savez et l’aide que vous recherchez.', 'No pasa nada si aún no está todo decidido. Comparta lo que sabe y en qué le gustaría recibir ayuda.'),
      primary: localized('Contact the product team', '提交产品需求', 'Contacter l’équipe produit', 'Contactar con el equipo de producto'),
      secondary: localized('Browse the catalogue', '浏览产品目录', 'Voir le catalogue', 'Ver el catálogo')
    }
  },
  patents: {
    seoTitle: localized('Hydrogel Mask Patents & Qualifications', '水凝胶面膜专利与资质', 'Brevets et qualifications pour masques hydrogel', 'Patentes y cualificaciones para mascarillas de hidrogel'),
    seoDescription: localized('View selected patent certificates covering hydrogel production, mask forming, coating equipment and collagen eye-patch design.', '查看与水凝胶生产、面膜成型、涂布设备及胶原眼贴外观相关的部分专利证书。', 'Découvrez une sélection de brevets sur la production d’hydrogel, le formage des masques, l’enduction et le design des patchs au collagène.', 'Vea una selección de patentes sobre producción de hidrogel, formado de mascarillas, recubrimiento y diseño de parches de colágeno.'),
    intro: {
      eyebrow: localized('PATENTS & QUALIFICATIONS', '专利与资质', 'BREVETS ET QUALIFICATIONS', 'PATENTES Y CUALIFICACIONES'),
      title: localized('From hydrogel making\nto the finished patch.', '看得见的专利，\n让水凝膜能力更有依据。', 'De la fabrication de l’hydrogel\nau patch fini.', 'De la producción de hidrogel\nal parche terminado.'),
      body: localized('The supplied archive includes patents for gel production, coating, mask forming and the appearance of collagen eye patches.', '相关证书覆盖凝胶生产、涂布、面膜成型与胶原眼贴外观设计，为修齐的水凝膜研发和生产积累提供可核对的证明。', 'Le dossier fourni couvre la production de gel, l’enduction, le formage des masques et le dessin de patchs contour des yeux au collagène.', 'El archivo facilitado reúne patentes de producción de gel, recubrimiento, formado de mascarillas y diseño de parches de colágeno.'),
      meta: [localized('Hydrogel production', '凝胶生产', 'Production d’hydrogel', 'Producción de hidrogel'), localized('Forming equipment', '成型设备', 'Équipements de formage', 'Equipos de formado'), localized('Product design', '产品外观', 'Design produit', 'Diseño de producto')]
    },
    areasTitle: localized('The collection follows the product from preparation to final form.', '从凝胶制备到成品外观，关键工艺均有积累。', 'La collection suit le produit, de la préparation à sa forme finale.', 'La colección acompaña el producto desde la preparación hasta su forma final.'),
    areas: [
      {title: localized('Gel preparation', '凝胶制备', 'Préparation du gel', 'Preparación del gel'), body: localized('Production systems, mixing and milling equipment support a consistent gel base before forming.', '生产系统、混合与研磨设备，为后续成型准备稳定的凝胶基质。', 'Les systèmes de production, de mélange et de broyage préparent une base gel régulière avant le formage.', 'Los sistemas de producción, mezcla y molienda preparan una base de gel uniforme antes del formado.')},
      {title: localized('Forming and coating', '成型与涂布', 'Formage et enduction', 'Formado y recubrimiento'), body: localized('Forming trays, coating devices and cutting structures bring the gel into a repeatable mask shape.', '成型托盘、涂布装置与裁切结构，让凝胶稳定形成面膜或眼贴形态。', 'Les plateaux, dispositifs d’enduction et systèmes de découpe donnent au gel une forme de masque régulière.', 'Las bandejas, los equipos de recubrimiento y los sistemas de corte dan al gel una forma de mascarilla uniforme.')},
      {title: localized('Fit and appearance', '贴合与外观', 'Ajustement et apparence', 'Ajuste y apariencia'), body: localized('Design patents capture recognisable surface patterns and shapes for the finished eye patch.', '外观设计专利呈现眼贴成品可识别的纹理与轮廓。', 'Les brevets de dessin protègent les motifs et les formes reconnaissables du patch fini.', 'Las patentes de diseño recogen patrones y formas reconocibles del parche terminado.')}
    ],
    reviewTitle: localized('Practical ideas for a working production line.', '专利价值，最终要体现在产品稳定性上。', 'Des idées concrètes pour une ligne de production.', 'Ideas prácticas para una línea de producción.'),
    review: [
      {title: localized('Make the gel evenly', '让凝胶更均匀', 'Préparer un gel régulier', 'Preparar un gel uniforme'), body: localized('Mixing, milling and temperature control help build a stable starting point for the product.', '混合、研磨与温度控制共同帮助凝胶保持稳定状态。', 'Le mélange, le broyage et la maîtrise de la température contribuent à la stabilité du gel.', 'La mezcla, la molienda y el control de temperatura ayudan a mantener estable el gel.')},
      {title: localized('Form with consistency', '稳定成型', 'Former avec régularité', 'Formar con regularidad'), body: localized('Dedicated trays and forming structures keep shape and handling more consistent from unit to unit.', '专用托盘与成型结构帮助产品保持一致的形状与取用体验。', 'Des plateaux et structures dédiés rendent la forme et la manipulation plus régulières.', 'Las bandejas y estructuras específicas mantienen una forma y manipulación más uniformes.')},
      {title: localized('Cut cleanly', '利落裁切', 'Découper proprement', 'Cortar con precisión'), body: localized('Purpose-built cutting devices support clean edges and repeatable dimensions.', '专用裁切装置有助于形成整齐边缘与稳定尺寸。', 'Des dispositifs de découpe dédiés assurent des bords nets et des dimensions régulières.', 'Los dispositivos de corte específicos favorecen bordes limpios y dimensiones uniformes.')},
      {title: localized('Finish with character', '形成产品识别', 'Donner du caractère', 'Dar carácter al producto'), body: localized('Surface pattern, fit and pack presentation give the finished mask its recognisable look.', '纹理、贴合轮廓与包装呈现，共同形成成品面膜的辨识度。', 'Le motif, l’ajustement et la présentation donnent au masque fini son identité visuelle.', 'El patrón, el ajuste y la presentación dan identidad visual a la mascarilla terminada.')}
    ],
    publicationTitle: localized('The essential facts stay visible on every certificate.', '专利是否可信，证书原件最有说服力。', 'Les informations essentielles restent visibles sur chaque certificat.', 'Los datos esenciales permanecen visibles en cada certificado.'),
    publication: [
      {title: localized('Patent title', '专利名称', 'Titre du brevet', 'Título de la patente'), body: localized('The full title appears on the document and beside its image.', '完整名称清楚标示，便于识别专利所覆盖的技术或设计。', 'Le titre complet figure sur le certificat et à côté de son image.', 'El título completo aparece en el certificado y junto a su imagen.')},
      {title: localized('Patent number', '专利号', 'Numéro de brevet', 'Número de patente'), body: localized('Each card carries the number printed on the corresponding certificate.', '专利号可与证书原件逐字核对。', 'Chaque carte reprend le numéro imprimé sur le certificat.', 'Cada tarjeta muestra el número impreso en el certificado.')},
      {title: localized('Named rightsholder', '证书记载权利人', 'Titulaire indiqué', 'Titular indicado'), body: localized('The rightsholder is stated exactly as shown on the supplied document.', '权利人按证书记载呈现，避免含糊表述。', 'Le titulaire est indiqué tel qu’il apparaît dans le document fourni.', 'El titular se indica tal como aparece en el documento facilitado.')},
      {title: localized('Original document image', '证书原图', 'Image du document original', 'Imagen del documento original'), body: localized('The source image remains available for direct visual comparison.', '原件保留完整画面，合作前即可核验关键信息。', 'L’image source reste visible pour une comparaison directe.', 'La imagen original permanece visible para su comprobación directa.')}
    ],
    action: {
      eyebrow: localized('TALK TO THE HYDROGEL TEAM', '咨询水凝胶产品', 'PARLER À L’ÉQUIPE HYDROGEL', 'HABLAR CON EL EQUIPO DE HIDROGEL'),
      title: localized('Have a mask idea?\nLet’s talk about how to make it.', '想做出更有辨识度的水凝膜？', 'Vous avez une idée de masque ?\nVoyons comment la fabriquer.', '¿Tiene una idea de mascarilla?\nHablemos de cómo fabricarla.'),
      body: localized('Tell us the product type, market and quantity you have in mind. We can discuss suitable materials, formats and sampling options.', '提供产品类型、目标市场与预计数量，我们会结合材料、膜型与工艺经验，推荐合适的样品与开发方向。', 'Indiquez le type de produit, le marché et la quantité envisagés. Nous pourrons échanger sur les matières, formats et échantillons.', 'Indique el tipo de producto, mercado y cantidad. Podemos hablar de materiales, formatos y opciones de muestra.'),
      primary: localized('Discuss your product', '沟通产品需求', 'Parler de votre produit', 'Hablar de su producto'),
      secondary: localized('View finished masks', '查看成品面膜', 'Voir les masques finis', 'Ver mascarillas terminadas')
    }
  }
} as const;

const managedChineseText = new WeakMap<object, Partial<Record<Locale, string>>>();
for (const pageId of ['customization', 'process', 'factory', 'about', 'contact', 'patents'] as const) {
  const override = getPublishedPageOverride(pageId);
  if (!override) continue;
  const activeLocales = publishedContent.translations ? locales : ['zh'] as const;
  managedChineseText.set(companyPageCopy[pageId].intro.title, Object.fromEntries(activeLocales.map(locale => [locale, getPublishedPageOverride(pageId, publishedContent, locale)!.heroTitle])));
  managedChineseText.set(companyPageCopy[pageId].intro.body, Object.fromEntries(activeLocales.map(locale => [locale, getPublishedPageOverride(pageId, publishedContent, locale)!.heroBody])));
  managedChineseText.set(companyPageCopy[pageId].seoTitle, managedChineseText.get(companyPageCopy[pageId].intro.title)!);
  managedChineseText.set(companyPageCopy[pageId].seoDescription, managedChineseText.get(companyPageCopy[pageId].intro.body)!);
}

export function companyText(locale: Locale, text: CompanyLocalizedText): string {
  return managedChineseText.get(text)?.[locale] ?? text[locale];
}

export function companyPageAlternates(path: string): Record<string, string> {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, localizedPath(locale, path)]),
    ['x-default', localizedPath('en', path)]
  ]);
}
