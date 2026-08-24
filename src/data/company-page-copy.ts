import {locales, localizedPath, type Locale} from '@/lib/routing';

export type CompanyLocalizedText = Record<Locale, string>;

const localized = (en: string, zh: string, fr: string, es: string): CompanyLocalizedText => ({en, zh, fr, es});

export const companyPageCopy = {
  customization: {
    seoTitle: localized('Custom Finished Mask Development', '成品面膜定制开发', 'Développement de masques finis sur mesure', 'Desarrollo de mascarillas terminadas a medida'),
    seoDescription: localized(
      'Develop finished facial, eye and neck masks across formula, format, dimensions, fill weight, packaging and brand presentation.',
      '围绕配方、膜材与凝胶形态、尺寸克重、内容量、包装和品牌视觉开发面部、眼部与颈部成品面膜。',
      'Développez des masques finis pour le visage, les yeux et le cou : formule, format, dimensions, poids, emballage et identité de marque.',
      'Desarrolle mascarillas terminadas para rostro, ojos y cuello: fórmula, formato, dimensiones, peso, envase e identidad de marca.'
    ),
    intro: {
      eyebrow: localized('CUSTOM DEVELOPMENT', '定制开发', 'DÉVELOPPEMENT SUR MESURE', 'DESARROLLO A MEDIDA'),
      title: localized('Make the mask\nyour brand has in mind.', '把品牌想要的面膜，\n一步步做出来。', 'Créez le masque\nque votre marque imagine.', 'Cree la mascarilla\nque imagina su marca.'),
      body: localized(
        'Choose the formula, material, fit, fill and packaging. We bring those choices together in a sample you can see and feel.',
        '配方、材质、版型、内容量与包装都可以一起调整，并通过实物样品确认最终体验。',
        'Choisissez la formule, la matière, la coupe, le remplissage et l’emballage. Nous réunissons ces choix dans un échantillon à voir et à toucher.',
        'Elija la fórmula, el material, el ajuste, el contenido y el envase. Reunimos esas elecciones en una muestra que puede ver y tocar.'
      ),
      meta: [
        localized('Formula', '配方', 'Formule', 'Fórmula'),
        localized('Sheet or gel', '膜材或凝胶', 'Support ou gel', 'Soporte o gel'),
        localized('Fit & weight', '尺寸与克重', 'Coupe et poids', 'Ajuste y peso'),
        localized('Fill volume', '内容量', 'Contenance', 'Contenido'),
        localized('Packaging', '包装', 'Emballage', 'Envase'),
        localized('Brand presentation', '品牌视觉', 'Présentation de marque', 'Presentación de marca')
      ]
    },
    scope: {
      eyebrow: localized('MAKE IT YOURS', '打造品牌专属产品', 'À VOTRE IMAGE', 'HÁGALA SUYA'),
      title: localized('Six details that make the mask feel like yours.', '六个细节，让面膜真正属于您的品牌。', 'Six détails qui donnent au masque votre identité.', 'Seis detalles que hacen suya la mascarilla.'),
      headers: [
        localized('Development area', '开发内容', 'Domaine', 'Área'),
        localized('What can be defined', '可确认内容', 'Éléments à définir', 'Qué se define'),
        localized('Why it matters', '影响', 'Pourquoi', 'Por qué importa'),
        localized('What to share', '您可以提供', 'Ce que vous pouvez partager', 'Qué puede compartir')
      ],
      rows: [
        {
          title: localized('Formula direction', '配方方向', 'Orientation de formule', 'Dirección de fórmula'),
          choices: localized('Ingredient focus, texture, colour and sensorial profile', '成分重点、质地、颜色与使用感', 'Actifs, texture, couleur et profil sensoriel', 'Ingredientes, textura, color y perfil sensorial'),
          impact: localized('Aligns the product experience with its intended positioning', '让产品体验与定位保持一致', 'Aligne l’expérience produit sur son positionnement', 'Alinea la experiencia del producto con su posicionamiento'),
          start: localized('Target use, market and reference formula', '目标用途、市场与参考配方', 'Usage, marché et formule de référence', 'Uso, mercado y fórmula de referencia')
        },
        {
          title: localized('Sheet or gel format', '膜材与凝胶形态', 'Support ou format gel', 'Soporte o formato de gel'),
          choices: localized('Sheet substrates, hydrogel, cream mask and microporous cooling formats', '片状膜材、水凝胶、膏状面膜与微孔冷感形态', 'Supports textiles, hydrogel, masque crème et formats microporeux frais', 'Tejidos, hidrogel, mascarilla en crema y formatos microporosos refrescantes'),
          impact: localized('Shapes fit, handling and the application experience', '影响贴合度、取用方式与贴敷体验', 'Détermine l’ajustement, la manipulation et l’application', 'Define el ajuste, la manipulación y la experiencia de uso'),
          start: localized('Preferred feel or a product reference', '期望触感或参考产品', 'Sensation souhaitée ou produit de référence', 'Sensación deseada o producto de referencia')
        },
        {
          title: localized('Dimensions & weight', '尺寸与克重', 'Dimensions et poids', 'Dimensiones y peso'),
          choices: localized('Facial, eye or neck fit, cut dimensions and material weight', '面部、眼部或颈部版型、裁切尺寸与材料克重', 'Coupe visage, yeux ou cou, dimensions et grammage', 'Ajuste facial, ocular o de cuello, dimensiones y gramaje'),
          impact: localized('Controls coverage, comfort and handling', '影响覆盖范围、舒适度与取用感受', 'Détermine la couverture, le confort et la manipulation', 'Determina la cobertura, la comodidad y el manejo'),
          start: localized('Target area and preferred coverage', '目标部位与覆盖范围', 'Zone cible et couverture souhaitée', 'Zona objetivo y cobertura deseada')
        },
        {
          title: localized('Fill volume', '内容量', 'Contenance', 'Contenido'),
          choices: localized('Essence quantity, net weight and product count', '精华液量、净含量与产品数量', 'Quantité d’essence, poids net et nombre d’unités', 'Cantidad de esencia, peso neto y número de unidades'),
          impact: localized('Defines the application experience and packaging requirements', '影响贴敷体验与包装适配', 'Définit l’expérience d’application et les besoins d’emballage', 'Define la experiencia de uso y los requisitos del envase'),
          start: localized('Desired net content and use frequency', '期望净含量与使用频次', 'Contenu net et fréquence d’utilisation', 'Contenido neto y frecuencia de uso')
        },
        {
          title: localized('Packaging system', '包装组合', 'Système d’emballage', 'Sistema de envase'),
          choices: localized('Sachet, jar, tray, carton and set configuration', '袋装、罐装、托盘、彩盒与套装组合', 'Sachet, pot, plateau, étui et coffret', 'Sobre, tarro, bandeja, estuche y conjunto'),
          impact: localized('Protects the product and defines shelf presentation', '保护产品并形成终端陈列方式', 'Protège le produit et structure sa présentation', 'Protege el producto y define su presentación'),
          start: localized('Pack count, sales channel and reference packaging', '装量、销售渠道与参考包装', 'Nombre d’unités, canal et emballage de référence', 'Cantidad, canal de venta y envase de referencia')
        },
        {
          title: localized('Brand presentation', '品牌视觉', 'Présentation de marque', 'Presentación de marca'),
          choices: localized('Colour, artwork, finish and multilingual label content', '颜色、图文、表面效果与多语言标签内容', 'Couleur, graphisme, finition et étiquetage multilingue', 'Color, diseño, acabado y etiquetado multilingüe'),
          impact: localized('Creates a coherent, market-ready product identity', '形成统一且适配目标市场的产品识别', 'Crée une identité cohérente adaptée au marché visé', 'Crea una identidad coherente y adaptada al mercado'),
          start: localized('Logo files, brand guide and target markets', 'Logo 文件、品牌规范与目标市场', 'Logo, charte de marque et marchés cibles', 'Logotipo, guía de marca y mercados objetivo')
        }
      ]
    },
    faqTitle: localized('Questions before development begins', '开始开发前，您可能关心的问题', 'Questions avant de commencer', 'Preguntas antes de comenzar'),
    faq: [
      {
        question: localized('Can we begin from an existing product?', '可以从现有产品开始调整吗？', 'Peut-on partir d’un produit existant ?', '¿Podemos partir de un producto existente?'),
        answer: localized('Yes. Choose the closest product and tell us what you would change. That gives us a practical place to begin sampling.', '可以。先选择最接近的现有产品，再告诉我们希望调整什么，就能更快进入打样。', 'Oui. Choisissez le produit le plus proche et indiquez ce que vous souhaitez changer. C’est une base simple pour commencer les échantillons.', 'Sí. Elija el producto más cercano y díganos qué cambiaría. Es una forma práctica de empezar con las muestras.')
      },
      {
        question: localized('When is a sample needed?', '什么时候需要打样？', 'Quand faut-il réaliser un échantillon ?', '¿Cuándo se necesita una muestra?'),
        answer: localized('Sampling is used to confirm the physical format, fit, texture, fill and presentation before production details are approved.', '打样用于确认实物形态、贴合度、质地、内容量与包装呈现，再据此确认生产细节。', 'L’échantillonnage confirme le format physique, l’ajustement, la texture, le remplissage et la présentation avant validation de la production.', 'La muestra confirma el formato físico, el ajuste, la textura, el contenido y la presentación antes de aprobar la producción.')
      },
      {
        question: localized('How is the minimum order confirmed?', '起订量如何确认？', 'Comment la quantité minimale est-elle confirmée ?', '¿Cómo se confirma la cantidad mínima?'),
        answer: localized('Minimums depend on the mask format, packaging and level of customisation. Share the product you like and we can confirm a realistic quantity.', '起订量取决于面膜形态、包装方式与定制程度。选好产品后，我们会结合实际需求确认数量。', 'Le minimum dépend du format, de l’emballage et du niveau de personnalisation. Indiquez le produit qui vous plaît pour obtenir une quantité réaliste.', 'El mínimo depende del formato, el envase y el grado de personalización. Indique el producto que le interesa y podremos confirmar una cantidad realista.')
      },
      {
        question: localized('What should we share at the start?', '开始时需要提供什么？', 'Que faut-il partager au départ ?', '¿Qué debemos compartir al empezar?'),
        answer: localized('Share the target use, preferred format, expected quantity, target market, timing and any product or packaging references you already have.', '建议提供目标用途、期望形态、预计数量、目标市场、时间计划，以及已有的产品或包装参考。', 'Précisez l’usage, le format souhaité, la quantité, le marché, le calendrier et vos références produit ou emballage.', 'Comparta el uso, el formato deseado, la cantidad, el mercado, el calendario y las referencias de producto o envase disponibles.')
      }
    ],
    action: {
      eyebrow: localized('START YOUR MASK', '开始定制', 'COMMENCER VOTRE MASQUE', 'EMPIECE SU MASCARILLA'),
      title: localized('Tell us what you want to make.\nWe’ll take it from there.', '告诉我们想做什么，\n接下来一起完成。', 'Dites-nous ce que vous imaginez.\nNous construirons la suite avec vous.', 'Cuéntenos qué quiere crear.\nLo desarrollaremos juntos.'),
      body: localized('Share the product type, quantity, market and timing. A product advisor will reply with the most useful next step.', '告诉我们产品类型、预计数量、目标市场与时间计划，产品顾问会给出合适的下一步建议。', 'Partagez le type de produit, la quantité, le marché et le calendrier. Un conseiller vous proposera la suite la plus utile.', 'Comparta el tipo de producto, la cantidad, el mercado y los plazos. Un asesor le propondrá el siguiente paso más útil.'),
      primary: localized('Start a custom product', '开始定制产品', 'Commencer un produit sur mesure', 'Empezar un producto a medida'),
      secondary: localized('Browse finished masks', '浏览成品面膜', 'Voir les masques finis', 'Ver mascarillas terminadas')
    }
  },
  process: {
    seoTitle: localized('Finished Mask Development Process', '成品面膜开发流程', 'Processus de développement des masques finis', 'Proceso de desarrollo de mascarillas terminadas'),
    seoDescription: localized('See how a facial, eye or neck mask moves from the first idea to samples, production and delivery.', '了解面部、眼部与颈部面膜如何从产品想法走向打样、生产与交付。', 'Découvrez comment un masque visage, yeux ou cou passe de l’idée aux échantillons, à la production puis à la livraison.', 'Descubra cómo una mascarilla facial, ocular o de cuello pasa de la idea a las muestras, la producción y la entrega.'),
    intro: {
      eyebrow: localized('DEVELOPMENT PROCESS', '开发流程', 'PROCESSUS DE DÉVELOPPEMENT', 'PROCESO DE DESARROLLO'),
      title: localized('An idea, a sample,\nthen a finished mask.', '一个想法，一份样品，\n再到成品面膜。', 'Une idée, un échantillon,\npuis un masque fini.', 'Una idea, una muestra\ny después una mascarilla terminada.'),
      body: localized('We shape the product with you, make a physical sample, prepare it for production and stay with it through delivery.', '我们与您一起完善产品、制作实物样品、准备量产，并持续跟进到交付。', 'Nous façonnons le produit avec vous, réalisons un échantillon, préparons la production et suivons le projet jusqu’à la livraison.', 'Damos forma al producto con usted, preparamos una muestra, organizamos la producción y acompañamos el proyecto hasta la entrega.'),
      meta: [
        localized('Product idea', '产品想法', 'Idée produit', 'Idea de producto'),
        localized('Formula & format', '配方与形态', 'Formule et format', 'Fórmula y formato'),
        localized('Sampling', '打样', 'Échantillonnage', 'Muestras'),
        localized('Packaging details', '包装信息', 'Détails d’emballage', 'Detalles del envase'),
        localized('Production', '量产', 'Production', 'Producción'),
        localized('Delivery', '交付', 'Livraison', 'Entrega')
      ]
    },
    stepsTitle: localized('A straightforward way to get from idea to delivery.', '从想法走向交付，过程清楚而直接。', 'Un chemin simple de l’idée à la livraison.', 'Un camino sencillo desde la idea hasta la entrega.'),
    steps: [
      {
        title: localized('Tell us about the product', '聊聊想做的产品', 'Parlez-nous du produit', 'Cuéntenos sobre el producto'),
        body: localized('Start with the area of use, target market, quantity, timing and the kind of experience you want to create.', '先说说使用部位、目标市场、预计数量、时间，以及希望带来的使用感受。', 'Commencez par la zone d’usage, le marché, la quantité, le calendrier et l’expérience recherchée.', 'Empiece por la zona de uso, el mercado, la cantidad, los plazos y la experiencia que desea crear.'),
        note: localized('A clear product direction', '明确产品方向', 'Une direction produit claire', 'Una dirección de producto clara')
      },
      {
        title: localized('Choose the feel and format', '选择质地与形态', 'Choisir la texture et le format', 'Elegir la textura y el formato'),
        body: localized('Bring together the formula, sheet or gel structure, dimensions, weight and fill.', '把配方、膜材或凝胶结构、尺寸、克重与内容量组合起来。', 'Réunissez la formule, le support ou le gel, les dimensions, le poids et le remplissage.', 'Combine la fórmula, el soporte o gel, las dimensiones, el peso y el contenido.'),
        note: localized('A recipe for the first sample', '首轮打样依据', 'La base du premier échantillon', 'La base de la primera muestra')
      },
      {
        title: localized('Try the sample', '体验实物样品', 'Essayer l’échantillon', 'Probar la muestra'),
        body: localized('See how it fits, feels, looks and handles. Adjust what matters before moving on.', '亲自感受贴合度、质地、颜色与取用方式，在量产前调整重要细节。', 'Observez l’ajustement, le toucher, l’apparence et la manipulation, puis ajustez ce qui compte.', 'Compruebe el ajuste, el tacto, el aspecto y el manejo, y ajuste lo que importe antes de continuar.'),
        note: localized('A sample you are happy with', '满意的样品', 'Un échantillon qui vous convient', 'Una muestra que le convence')
      },
      {
        title: localized('Finish the pack details', '完善包装细节', 'Finaliser l’emballage', 'Completar los detalles del envase'),
        body: localized('Set the artwork, label content, pack count and any information needed for the destination market.', '确定图文、标签内容、装量，以及目标市场所需的信息。', 'Définissez le graphisme, l’étiquetage, le nombre d’unités et les informations utiles au marché visé.', 'Defina el diseño, el etiquetado, la cantidad por envase y la información necesaria para el mercado de destino.'),
        note: localized('A pack ready to produce', '可进入生产的包装方案', 'Un emballage prêt à produire', 'Un envase listo para producir')
      },
      {
        title: localized('Move into production', '进入量产', 'Passer en production', 'Pasar a producción'),
        body: localized('The agreed sample and pack details become the reference for preparation, forming, filling and packing.', '确认后的样品与包装细节，成为配制、成型、灌装与包装的依据。', 'L’échantillon et l’emballage convenus servent de référence pour la préparation, le formage, le remplissage et le conditionnement.', 'La muestra y el envase acordados sirven de referencia para la preparación, el formado, el llenado y el empaque.'),
        note: localized('Your production batch', '您的生产批次', 'Votre lot de production', 'Su lote de producción')
      },
      {
        title: localized('Pack and deliver', '包装并交付', 'Emballer et livrer', 'Empacar y entregar'),
        body: localized('After the agreed checks, the finished masks are packed and prepared for shipment.', '完成约定检查后，成品面膜会完成包装并准备出货。', 'Après les contrôles convenus, les masques finis sont emballés et préparés pour l’expédition.', 'Después de los controles acordados, las mascarillas se empacan y se preparan para el envío.'),
        note: localized('Finished masks on their way', '成品面膜启程交付', 'Les masques sont en route', 'Las mascarillas están en camino')
      }
    ],
    controlsTitle: localized('Before production, three things need to be clear.', '进入量产前，三件事需要说清楚。', 'Avant la production, trois points doivent être clairs.', 'Antes de producir, tres cosas deben quedar claras.'),
    controls: [
      {title: localized('The product', '产品本身', 'Le produit', 'El producto'), body: localized('Formula, format, dimensions, weight and fill match the sample you selected.', '配方、形态、尺寸、克重与内容量，以确认的样品为准。', 'La formule, le format, les dimensions, le poids et le remplissage correspondent à l’échantillon choisi.', 'La fórmula, el formato, las dimensiones, el peso y el contenido coinciden con la muestra elegida.')},
      {title: localized('The packaging', '包装呈现', 'L’emballage', 'El envase'), body: localized('Artwork, labels, pack count and finishes are ready for production.', '图文、标签、装量与表面效果均已准备好进入生产。', 'Le graphisme, les étiquettes, le nombre d’unités et les finitions sont prêts.', 'El diseño, las etiquetas, la cantidad y los acabados están listos.')},
      {title: localized('The order', '订单信息', 'La commande', 'El pedido'), body: localized('Quantity, timing and delivery details are agreed before the line starts.', '数量、时间与交付信息，在开线生产前确定。', 'La quantité, le calendrier et la livraison sont convenus avant le lancement.', 'La cantidad, los plazos y la entrega se acuerdan antes de iniciar la línea.')}
    ],
    faqTitle: localized('A few practical questions', '几个常见的实际问题', 'Quelques questions pratiques', 'Algunas preguntas prácticas'),
    faq: [
      {question: localized('Can we start before every detail is decided?', '信息还不完整，可以开始吗？', 'Peut-on commencer avant que tout soit décidé ?', '¿Podemos empezar antes de definirlo todo?'), answer: localized('Yes. The product type, target market, rough quantity and timing are enough for a first conversation.', '可以。先提供产品类型、目标市场、大致数量与时间，就能开始沟通。', 'Oui. Le type de produit, le marché, une quantité approximative et le calendrier suffisent pour un premier échange.', 'Sí. El tipo de producto, el mercado, una cantidad aproximada y los plazos bastan para una primera conversación.')},
      {question: localized('When can you confirm price and lead time?', '价格和交期何时可以确认？', 'Quand confirmez-vous le prix et le délai ?', '¿Cuándo se confirman el precio y el plazo?'), answer: localized('Once the product, quantity, packaging and amount of custom work are clear, we can give a useful quotation and schedule.', '产品、数量、包装与定制程度明确后，就可以提供有参考价值的报价与时间。', 'Lorsque le produit, la quantité, l’emballage et le niveau de personnalisation sont clairs, nous pouvons établir un devis et un calendrier utiles.', 'Cuando estén claros el producto, la cantidad, el envase y el grado de personalización, podremos ofrecer un precio y un calendario útiles.')},
      {question: localized('Can we change the product after seeing the sample?', '看到样品后还能调整吗？', 'Peut-on modifier le produit après l’échantillon ?', '¿Podemos cambiar el producto después de ver la muestra?'), answer: localized('Yes. Changes to formula, fit, fill or packaging can be tested in another sample before production.', '可以。配方、版型、内容量或包装的调整，都可以在量产前通过新样品确认。', 'Oui. Les changements de formule, d’ajustement, de remplissage ou d’emballage peuvent être testés sur un nouvel échantillon.', 'Sí. Los cambios de fórmula, ajuste, contenido o envase pueden probarse en otra muestra antes de producir.')},
      {question: localized('Should we tell you the destination market?', '需要说明目标市场吗？', 'Faut-il indiquer le marché de destination ?', '¿Debemos indicar el mercado de destino?'), answer: localized('Yes. It helps us discuss the label, pack information and testing questions that may matter for that market.', '需要。目标市场会影响标签、包装信息与相关检测要求，越早说明越好。', 'Oui. Cela aide à aborder l’étiquetage, les informations d’emballage et les essais qui peuvent compter sur ce marché.', 'Sí. Ayuda a tratar el etiquetado, la información del envase y las pruebas que pueden ser importantes en ese mercado.')}
    ],
    action: {
      eyebrow: localized('START WITH A SAMPLE', '从样品开始', 'COMMENCER PAR UN ÉCHANTILLON', 'EMPEZAR CON UNA MUESTRA'),
      title: localized('Ready to turn the idea\ninto something you can hold?', '准备好把想法，\n变成拿在手里的样品了吗？', 'Prêt à transformer l’idée\nen un produit à tenir en main ?', '¿Listo para convertir la idea\nen algo que pueda tener en sus manos?'),
      body: localized('Choose a finished mask or tell us what you want to create. We’ll help you find the most useful first sample.', '可以先选择一款现有面膜，也可以直接告诉我们想做什么，我们会一起找到合适的首轮样品。', 'Choisissez un masque existant ou décrivez ce que vous souhaitez créer. Nous vous aiderons à définir le premier échantillon le plus utile.', 'Elija una mascarilla existente o cuéntenos qué quiere crear. Le ayudaremos a definir la primera muestra más útil.'),
      primary: localized('Ask for a sample', '申请样品', 'Demander un échantillon', 'Solicitar una muestra'),
      secondary: localized('Explore custom development', '了解定制开发', 'Explorer le sur-mesure', 'Explorar el desarrollo a medida')
    }
  },
  factory: {
    seoTitle: localized('Manufacturing & Quality Controls', '制造与品控', 'Fabrication et contrôles qualité', 'Fabricación y controles de calidad'),
    seoDescription: localized('See how finished facial, eye and neck masks are prepared, formed, filled, checked and packed.', '了解面部、眼部与颈部成品面膜如何完成配制、成型、灌装、检查与包装。', 'Découvrez comment les masques visage, yeux et cou sont préparés, formés, remplis, contrôlés et emballés.', 'Descubra cómo se preparan, forman, llenan, controlan y empacan las mascarillas faciales, oculares y de cuello.'),
    intro: {
      eyebrow: localized('MANUFACTURING & QUALITY', '制造与品控', 'FABRICATION ET QUALITÉ', 'FABRICACIÓN Y CALIDAD'),
      title: localized('Made with care.\nChecked as it moves.', '认真生产，\n每一步都看得见。', 'Fabriqué avec soin.\nContrôlé à chaque étape.', 'Fabricado con cuidado.\nControlado en cada paso.'),
      body: localized('The sample sets the standard. Materials, forming, fill, sealing and packing are checked as the order moves through production.', '样品就是标准。订单进入生产后，材料、成型、内容量、封口与包装都会逐步检查。', 'L’échantillon donne la référence. Les matières, le formage, le remplissage, le scellage et l’emballage sont contrôlés au fil de la production.', 'La muestra marca la referencia. Los materiales, el formado, el contenido, el sellado y el empaque se comprueban durante la producción.'),
      meta: [localized('Formula preparation', '配方制备', 'Préparation de la formule', 'Preparación de la fórmula'), localized('Forming & filling', '成型与灌装', 'Formage et remplissage', 'Formado y llenado'), localized('Product checks', '成品检查', 'Contrôles produit', 'Controles del producto'), localized('Packing', '包装出货', 'Conditionnement', 'Empaque')]
    },
    stagesTitle: localized('From prepared materials to packed finished goods.', '从备料到成品包装。', 'Des matières préparées aux produits finis emballés.', 'De los materiales preparados al producto terminado y empacado.'),
    stages: [
      {title: localized('Prepare the formula', '配制内容物', 'Préparer la formule', 'Preparar la fórmula'), body: localized('Ingredients and materials are prepared according to the agreed sample and product details.', '根据确认的样品与产品信息，准备原料与材料。', 'Les ingrédients et matières sont préparés selon l’échantillon et les détails convenus.', 'Los ingredientes y materiales se preparan según la muestra y los detalles acordados.')},
      {title: localized('Form, fill and seal', '成型、灌装与封口', 'Former, remplir et sceller', 'Formar, llenar y sellar'), body: localized('The mask is formed or filled, sealed and coded with the process suited to its format.', '根据产品形态完成成型或灌装、封口与批次标识。', 'Le masque est formé ou rempli, scellé et codé selon le procédé adapté à son format.', 'La mascarilla se forma o llena, se sella y se codifica según el proceso adecuado para su formato.')},
      {title: localized('Check the finished mask', '检查成品面膜', 'Contrôler le masque fini', 'Comprobar la mascarilla terminada'), body: localized('Appearance, dimensions, weight, seal and pack presentation are compared with the agreed standard.', '对照确认标准，检查外观、尺寸、重量、封口与包装呈现。', 'L’aspect, les dimensions, le poids, le scellage et la présentation sont comparés à la référence convenue.', 'El aspecto, las dimensiones, el peso, el sellado y la presentación se comparan con la referencia acordada.')},
      {title: localized('Pack for delivery', '包装并准备交付', 'Emballer pour la livraison', 'Empacar para la entrega'), body: localized('Finished goods are counted, packed and prepared for shipment with batch identification kept together.', '成品完成清点、装箱并准备出货，同时保留对应批次标识。', 'Les produits finis sont comptés, emballés et préparés pour l’expédition avec leur identification de lot.', 'Los productos terminados se cuentan, empacan y preparan para el envío con su identificación de lote.')}
    ],
    checksTitle: localized('A control plan can cover these product characteristics.', '品控计划可覆盖这些产品特征。', 'Le plan de contrôle peut couvrir ces caractéristiques.', 'El plan de control puede cubrir estas características.'),
    checks: [
      {title: localized('Appearance & dimensions', '外观与尺寸', 'Aspect et dimensions', 'Aspecto y dimensiones'), body: localized('Format, colour, cut, surface condition and dimensional consistency', '形态、颜色、裁切、表面状态与尺寸一致性', 'Format, couleur, découpe, état de surface et régularité dimensionnelle', 'Formato, color, corte, superficie y consistencia dimensional')},
      {title: localized('Weight & fill', '克重与内容量', 'Poids et remplissage', 'Peso y contenido'), body: localized('Material weight, net content and agreed tolerances', '材料克重、净含量与约定允差', 'Grammage, contenu net et tolérances convenues', 'Gramaje, contenido neto y tolerancias acordadas')},
      {title: localized('Integrity & handling', '完整性与取用', 'Intégrité et manipulation', 'Integridad y manejo'), body: localized('Seal condition, leakage checks and pack handling as applicable', '根据产品检查封口状态、泄漏风险与包装取用', 'État du scellage, contrôle des fuites et manipulation selon le produit', 'Estado del sellado, control de fugas y manejo según el producto')},
      {title: localized('Identity & records', '标识与记录', 'Identification et dossiers', 'Identidad y registros'), body: localized('Artwork version, coding, pack count and batch documentation', '图文版本、批次标识、装量与批次文件', 'Version graphique, codage, quantité et documentation de lot', 'Versión gráfica, codificación, cantidad y documentación de lote')}
    ],
    evidence: {
      eyebrow: localized('THE FACTORY IN VIEW', '看得见的生产现场', 'L’USINE EN IMAGES', 'LA FÁBRICA EN IMÁGENES'),
      title: localized('A closer look at how finished masks are made.', '走近成品面膜的生产过程。', 'Un regard plus proche sur la fabrication des masques finis.', 'Una mirada más cercana a la fabricación de mascarillas terminadas.'),
      body: localized('The images above show production, inspection and final assembly scenes from the materials supplied for this website.', '上方图片来自本项目提供的资料，展示生产、检查与成品装配场景。', 'Les images ci-dessus, issues des documents fournis pour ce site, montrent la production, le contrôle et l’assemblage final.', 'Las imágenes anteriores, facilitadas para este sitio, muestran escenas de producción, control y ensamblaje final.')
    },
    action: {
      eyebrow: localized('MAKE YOUR MASK', '开始制作您的面膜', 'FABRIQUER VOTRE MASQUE', 'FABRICAR SU MASCARILLA'),
      title: localized('Have a sample in mind?\nLet’s talk about production.', '已经有样品方向？\n接下来聊聊生产。', 'Vous avez un échantillon en tête ?\nParlons production.', '¿Tiene una muestra en mente?\nHablemos de producción.'),
      body: localized('Share the product, expected quantity, packaging and preferred timing. We can discuss a practical way forward.', '告诉我们产品、预计数量、包装与期望时间，我们可以继续沟通可行的生产安排。', 'Partagez le produit, la quantité, l’emballage et le calendrier souhaité. Nous pourrons envisager une suite concrète.', 'Comparta el producto, la cantidad, el envase y los plazos deseados. Podemos hablar de una forma práctica de avanzar.'),
      primary: localized('Discuss production', '沟通生产需求', 'Parler de production', 'Hablar de producción'),
      secondary: localized('View the development process', '查看开发流程', 'Voir le processus', 'Ver el proceso')
    }
  },
  about: {
    seoTitle: localized('About Guangtuo Bio', '关于广拓生物', 'À propos de Guangtuo Bio', 'Acerca de Guangtuo Bio'),
    seoDescription: localized('Founded in Guangzhou in 2015, Guangtuo Bio develops and produces finished facial, eye and neck masks with a focus on hydrogel formats.', '广拓生物于 2015 年在广州成立，专注面部、眼部与颈部成品面膜开发与生产，尤其擅长水凝胶形态。', 'Fondée à Guangzhou en 2015, Guangtuo Bio développe et produit des masques finis pour le visage, les yeux et le cou, avec un savoir-faire hydrogel.', 'Fundada en Guangzhou en 2015, Guangtuo Bio desarrolla y produce mascarillas faciales, oculares y de cuello, con especial atención al hidrogel.'),
    intro: {
      eyebrow: localized('ABOUT GUANGTUO', '关于广拓', 'À PROPOS DE GUANGTUO', 'ACERCA DE GUANGTUO'),
      title: localized('Hydrogel masks\nare what we know best.', '水凝胶面膜，\n是我们熟悉的领域。', 'Les masques hydrogel,\nc’est notre spécialité.', 'Las mascarillas de hidrogel\nson nuestra especialidad.'),
      body: localized('Founded in Guangzhou in 2015, we make finished facial, eye and neck masks for brands looking for a product they can shape and call their own.', '2015 年成立于广州，我们为希望打造自有产品的品牌开发并生产面部、眼部与颈部成品面膜。', 'Fondée à Guangzhou en 2015, nous fabriquons des masques finis visage, yeux et cou pour les marques qui souhaitent créer un produit à leur image.', 'Fundada en Guangzhou en 2015, fabricamos mascarillas faciales, oculares y de cuello para marcas que desean crear un producto propio.'),
      meta: [localized('Guangzhou · Since 2015', '广州 · 始于 2015', 'Guangzhou · Depuis 2015', 'Guangzhou · Desde 2015'), localized('Facial, eye & neck masks', '面膜 · 眼贴 · 颈膜', 'Visage, yeux et cou', 'Rostro, ojos y cuello'), localized('Hydrogel know-how', '水凝胶经验', 'Savoir-faire hydrogel', 'Experiencia en hidrogel'), localized('Sample to production', '从样品到生产', 'De l’échantillon à la production', 'De la muestra a la producción')]
    },
    belief: {
      eyebrow: localized('HOW WE WORK', '工作方式', 'NOTRE APPROCHE', 'CÓMO TRABAJAMOS'),
      title: localized('A good mask starts with how it should feel on skin.', '一款好面膜，从上脸感受开始。', 'Un bon masque commence par la sensation sur la peau.', 'Una buena mascarilla empieza por cómo se siente en la piel.'),
      body: localized('Fit, texture, cooling feel, serum level and handling all matter. We use samples to turn those details into something real before production.', '贴合度、质地、清凉感、精华液量与取用体验都很重要，我们会通过样品把这些细节变成真实产品。', 'L’ajustement, la texture, la fraîcheur, la quantité de sérum et la manipulation comptent. Les échantillons rendent ces détails concrets avant la production.', 'El ajuste, la textura, la sensación fresca, la cantidad de sérum y el manejo importan. Las muestras convierten esos detalles en algo real antes de producir.' )
    },
    practicesTitle: localized('How we bring a mask to life.', '一款面膜如何从想法走向成品。', 'Comment nous donnons vie à un masque.', 'Cómo damos vida a una mascarilla.'),
    practices: [
      {title: localized('Start with the experience', '从使用体验出发', 'Partir de l’expérience', 'Empezar por la experiencia'), body: localized('Tell us where the mask is used, how it should feel and what your customer should notice first.', '告诉我们面膜用于哪里、希望是什么触感，以及消费者最先感受到什么。', 'Dites-nous où le masque s’utilise, quelle sensation il doit offrir et ce que le client doit remarquer d’abord.', 'Díganos dónde se usa, qué sensación debe ofrecer y qué debería notar primero el cliente.')},
      {title: localized('Make it tangible', '把想法做成样品', 'Rendre l’idée tangible', 'Hacer tangible la idea'), body: localized('A physical sample lets you judge the fit, colour, texture, fill and presentation together.', '通过实物样品，可以同时判断贴合度、颜色、质地、内容量与包装呈现。', 'Un échantillon physique permet de juger ensemble l’ajustement, la couleur, la texture, le remplissage et la présentation.', 'Una muestra física permite valorar a la vez el ajuste, el color, la textura, el contenido y la presentación.')},
      {title: localized('Carry it through production', '把样品落实到生产', 'L’accompagner en production', 'Llevarla a producción'), body: localized('The chosen sample becomes the reference as the mask is made, checked and packed.', '选定样品会成为生产、检查与包装过程中的参考。', 'L’échantillon choisi sert de référence pendant la fabrication, le contrôle et l’emballage.', 'La muestra elegida sirve de referencia durante la fabricación, el control y el empaque.')}
    ],
    trustTitle: localized('What we bring to the table.', '我们能为产品带来什么。', 'Ce que nous apportons à votre projet.', 'Lo que aportamos a su proyecto.'),
    trust: [
      {title: localized('A focused mask range', '专注面膜品类', 'Une gamme centrée sur les masques', 'Una gama centrada en mascarillas'), body: localized('Facial, eye and neck formats give brands a practical place to start.', '面部、眼部与颈部产品，为品牌提供丰富而清晰的选择。', 'Les formats visage, yeux et cou donnent aux marques une base concrète.', 'Los formatos faciales, oculares y de cuello ofrecen a las marcas una base práctica.')},
      {title: localized('Hydrogel experience', '水凝胶经验', 'Expérience hydrogel', 'Experiencia en hidrogel'), body: localized('Our materials and process knowledge support cooling, flexible and close-fitting gel formats.', '材料与工艺经验支持清凉、柔韧、贴合的凝胶产品形态。', 'Notre connaissance des matières et procédés soutient des formats gel frais, souples et bien ajustés.', 'Nuestro conocimiento de materiales y procesos permite formatos de gel frescos, flexibles y ceñidos.')},
      {title: localized('Real samples', '实物样品', 'Des échantillons réels', 'Muestras reales'), body: localized('The product is judged in the hand and on the skin, not from copy alone.', '产品要拿在手里、贴在皮肤上体验，而不是只看文字。', 'Le produit se juge en main et sur la peau, pas seulement sur le papier.', 'El producto se valora en la mano y sobre la piel, no solo con palabras.')},
      {title: localized('Production follow-through', '生产跟进', 'Suivi de production', 'Seguimiento de producción'), body: localized('The agreed sample stays at the centre as the order moves through making, checking and packing.', '订单进入制作、检查与包装后，确认样品始终作为核心参考。', 'L’échantillon convenu reste la référence pendant la fabrication, le contrôle et l’emballage.', 'La muestra acordada sigue siendo la referencia durante la fabricación, el control y el empaque.')}
    ],
    action: {
      eyebrow: localized('DISCUSS A FINISHED MASK PROJECT', '沟通成品面膜项目', 'ÉCHANGER SUR UN PROJET DE MASQUE FINI', 'HABLAR DE UN PROYECTO DE MASCARILLA'),
      title: localized('Start with the product\nyour brand wants to make.', '从品牌希望完成的产品开始。', 'Commencez par le produit\nque votre marque souhaite créer.', 'Empiece por el producto\nque su marca quiere crear.'),
      body: localized('Share the product type, target market, expected quantity and timing. We’ll help you choose the most useful place to start.', '告诉我们产品类型、目标市场、预计数量与时间，我们会一起找到合适的起点。', 'Partagez le type de produit, le marché, la quantité et le calendrier. Nous vous aiderons à choisir le meilleur point de départ.', 'Comparta el tipo de producto, el mercado, la cantidad y los plazos. Le ayudaremos a elegir el mejor punto de partida.'),
      primary: localized('Discuss your product', '沟通产品需求', 'Parler de votre produit', 'Hablar de su producto'),
      secondary: localized('View finished masks', '查看成品面膜', 'Voir les masques finis', 'Ver mascarillas terminadas')
    }
  },
  contact: {
    seoTitle: localized('Contact Guangtuo Bio', '联系广拓生物', 'Contacter Guangtuo Bio', 'Contactar con Guangtuo Bio'),
    seoDescription: localized('Contact Guangtuo Bio about finished facial, eye and neck masks, samples, custom products and pricing.', '联系广拓生物，咨询面部、眼部与颈部成品面膜、样品、定制产品与报价。', 'Contactez Guangtuo Bio pour des masques finis visage, yeux et cou, des échantillons, du sur-mesure et des prix.', 'Contacte con Guangtuo Bio sobre mascarillas faciales, oculares y de cuello, muestras, productos a medida y precios.'),
    intro: {
      eyebrow: localized('CONTACT US', '联系我们', 'NOUS CONTACTER', 'CONTACTO'),
      title: localized('Start with a product,\na sample, or a question.', '从一款产品、一个样品，\n或一个问题开始。', 'Commencez par un produit,\nun échantillon ou une question.', 'Empiece con un producto,\nuna muestra o una pregunta.'),
      body: localized('Browse the range, ask for samples or tell us what you want to make. A product advisor will continue with you by email.', '可以先浏览产品、申请样品，也可以直接告诉我们想做什么，产品顾问会通过邮件继续沟通。', 'Parcourez la gamme, demandez des échantillons ou décrivez ce que vous souhaitez créer. Un conseiller poursuivra l’échange par e-mail.', 'Explore la gama, solicite muestras o cuéntenos qué quiere crear. Un asesor continuará la conversación por correo.'),
      meta: [localized('Product catalogue', '产品目录', 'Catalogue produits', 'Catálogo de productos'), localized('Samples', '样品', 'Échantillons', 'Muestras'), localized('Pricing', '报价', 'Tarifs', 'Precios')]
    },
    pathsTitle: localized('Three simple ways to begin.', '三种简单的开始方式。', 'Trois façons simples de commencer.', 'Tres formas sencillas de empezar.'),
    paths: [
      {title: localized('Browse finished masks', '浏览成品面膜', 'Voir les masques finis', 'Ver mascarillas terminadas'), body: localized('Compare facial, eye and neck formats before choosing a product to discuss.', '比较面部、眼部与颈部产品，再选择希望进一步沟通的款式。', 'Comparez les formats visage, yeux et cou avant de sélectionner un produit.', 'Compare formatos faciales, oculares y de cuello antes de elegir un producto.'), path: 'products', label: localized('View the catalogue', '查看产品目录', 'Voir le catalogue', 'Ver el catálogo')},
      {title: localized('Request samples', '申请样品', 'Demander des échantillons', 'Solicitar muestras'), body: localized('Tell us which products or qualities you want to compare. We’ll reply with available options, cost and timing.', '告诉我们希望比较哪些产品或特征，我们会回复可选样品、费用与时间。', 'Indiquez les produits ou qualités à comparer. Nous répondrons avec les options, le coût et le délai.', 'Indique qué productos o cualidades desea comparar. Le responderemos con opciones, coste y plazos.'), path: 'inquiry', label: localized('Ask for samples', '申请样品', 'Demander des échantillons', 'Solicitar muestras')},
      {title: localized('Ask for pricing', '咨询报价', 'Demander un tarif', 'Solicitar precios'), body: localized('Share the product, quantity, market and preferred timing so we can prepare a useful quotation.', '提供产品、数量、目标市场与期望时间，我们会据此准备有参考价值的报价。', 'Indiquez le produit, la quantité, le marché et le calendrier souhaité afin que nous puissions préparer un devis utile.', 'Indique el producto, la cantidad, el mercado y los plazos para que podamos preparar una cotización útil.'), path: 'inquiry', label: localized('Share order details', '提交订单信息', 'Partager les détails', 'Compartir los detalles')}
    ],
    prepareTitle: localized('A few details help us answer well.', '提供几个信息，回复会更准确。', 'Quelques détails nous aident à bien répondre.', 'Unos pocos datos nos ayudan a responder mejor.'),
    prepare: [
      {title: localized('Product', '产品', 'Produit', 'Producto'), body: localized('Product area, preferred format and intended use', '使用部位、期望形态与目标用途', 'Zone, format souhaité et usage', 'Zona, formato deseado y uso')},
      {title: localized('Change or reference', '调整方向或参考', 'Modification ou référence', 'Cambio o referencia'), body: localized('Existing product, desired change or visual reference', '现有产品、希望调整的内容或视觉参考', 'Produit existant, modification souhaitée ou référence visuelle', 'Producto existente, cambio deseado o referencia visual')},
      {title: localized('Quantity', '数量', 'Quantité', 'Cantidad'), body: localized('Expected first order or an approximate range', '首批预计数量或大致范围', 'Première commande prévue ou fourchette', 'Primer pedido previsto o rango aproximado')},
      {title: localized('Market & timing', '市场与时间', 'Marché et calendrier', 'Mercado y calendario'), body: localized('Destination market and preferred launch or delivery period', '目标市场与期望上市或交付时间', 'Marché de destination et période de lancement ou livraison', 'Mercado de destino y periodo de lanzamiento o entrega')}
    ],
    nextTitle: localized('What happens next.', '接下来会发生什么。', 'Ce qui se passe ensuite.', 'Qué ocurre después.'),
    next: [
      {title: localized('We read your message', '我们查看您的信息', 'Nous lisons votre message', 'Leemos su mensaje'), body: localized('A product advisor looks at the product, quantity, market and timing you shared.', '产品顾问会查看您提供的产品、数量、市场与时间信息。', 'Un conseiller regarde le produit, la quantité, le marché et le calendrier indiqués.', 'Un asesor revisa el producto, la cantidad, el mercado y los plazos que compartió.')},
      {title: localized('We ask what matters', '我们补充关键问题', 'Nous posons les questions utiles', 'Preguntamos lo importante'), body: localized('If a detail is needed for samples or pricing, we will ask for it clearly.', '如果样品或报价还需要某项信息，我们会直接说明。', 'Si un détail est nécessaire pour les échantillons ou le prix, nous vous le demanderons clairement.', 'Si hace falta algún dato para las muestras o el precio, se lo pediremos con claridad.')},
      {title: localized('We reply by email', '我们通过邮件回复', 'Nous répondons par e-mail', 'Respondemos por correo'), body: localized('The conversation continues through the business email supplied in the form.', '后续沟通会通过表单中填写的工作邮箱继续。', 'L’échange se poursuit via l’adresse professionnelle indiquée dans le formulaire.', 'La conversación continúa por el correo profesional indicado en el formulario.')}
    ],
    action: {
      eyebrow: localized('SHARE YOUR PRODUCT PLAN', '分享产品计划', 'PARTAGER VOTRE PROJET', 'COMPARTIR SU PROYECTO'),
      title: localized('Tell us what you want to make.\nWe’ll reply with a useful next step.', '告诉我们想做什么，\n我们会给出合适的下一步。', 'Dites-nous ce que vous souhaitez créer.\nNous vous proposerons la suite.', 'Cuéntenos qué quiere crear.\nLe propondremos el siguiente paso.'),
      body: localized('It is fine if every detail is not decided yet. Share what you know and what you would like help with.', '信息还没完全确定也没关系，先告诉我们已知内容，以及希望获得哪些帮助。', 'Ce n’est pas grave si tout n’est pas encore décidé. Partagez ce que vous savez et l’aide que vous recherchez.', 'No pasa nada si aún no está todo decidido. Comparta lo que sabe y en qué le gustaría recibir ayuda.'),
      primary: localized('Contact the product team', '联系产品顾问', 'Contacter l’équipe produit', 'Contactar con el equipo de producto'),
      secondary: localized('Browse the catalogue', '浏览产品目录', 'Voir le catalogue', 'Ver el catálogo')
    }
  },
  patents: {
    seoTitle: localized('Hydrogel Mask Patents & Qualifications', '水凝胶面膜专利与资质', 'Brevets et qualifications pour masques hydrogel', 'Patentes y cualificaciones para mascarillas de hidrogel'),
    seoDescription: localized('View selected patent certificates covering hydrogel production, mask forming, coating equipment and collagen eye-patch design.', '查看与水凝胶生产、面膜成型、涂布设备及胶原眼贴外观相关的部分专利证书。', 'Découvrez une sélection de brevets sur la production d’hydrogel, le formage des masques, l’enduction et le design des patchs au collagène.', 'Vea una selección de patentes sobre producción de hidrogel, formado de mascarillas, recubrimiento y diseño de parches de colágeno.'),
    intro: {
      eyebrow: localized('PATENTS & QUALIFICATIONS', '专利与资质', 'BREVETS ET QUALIFICATIONS', 'PATENTES Y CUALIFICACIONES'),
      title: localized('From hydrogel making\nto the finished patch.', '从凝胶制备，\n到成型眼贴。', 'De la fabrication de l’hydrogel\nau patch fini.', 'De la producción de hidrogel\nal parche terminado.'),
      body: localized('The supplied archive includes patents for gel production, coating, mask forming and the appearance of collagen eye patches.', '现有资料涵盖凝胶生产、涂布、面膜成型，以及胶原眼贴外观设计等方向。', 'Le dossier fourni couvre la production de gel, l’enduction, le formage des masques et le dessin de patchs contour des yeux au collagène.', 'El archivo facilitado reúne patentes de producción de gel, recubrimiento, formado de mascarillas y diseño de parches de colágeno.'),
      meta: [localized('Hydrogel production', '凝胶生产', 'Production d’hydrogel', 'Producción de hidrogel'), localized('Forming equipment', '成型设备', 'Équipements de formage', 'Equipos de formado'), localized('Product design', '产品外观', 'Design produit', 'Diseño de producto')]
    },
    areasTitle: localized('The collection follows the product from preparation to final form.', '这些资料贯穿产品从制备到成型的不同环节。', 'La collection suit le produit, de la préparation à sa forme finale.', 'La colección acompaña el producto desde la preparación hasta su forma final.'),
    areas: [
      {title: localized('Gel preparation', '凝胶制备', 'Préparation du gel', 'Preparación del gel'), body: localized('Production systems, mixing and milling equipment support a consistent gel base before forming.', '生产系统、混合与研磨设备，为后续成型准备稳定的凝胶基质。', 'Les systèmes de production, de mélange et de broyage préparent une base gel régulière avant le formage.', 'Los sistemas de producción, mezcla y molienda preparan una base de gel uniforme antes del formado.')},
      {title: localized('Forming and coating', '成型与涂布', 'Formage et enduction', 'Formado y recubrimiento'), body: localized('Forming trays, coating devices and cutting structures bring the gel into a repeatable mask shape.', '成型托盘、涂布装置与裁切结构，让凝胶稳定形成面膜或眼贴形态。', 'Les plateaux, dispositifs d’enduction et systèmes de découpe donnent au gel une forme de masque régulière.', 'Las bandejas, los equipos de recubrimiento y los sistemas de corte dan al gel una forma de mascarilla uniforme.')},
      {title: localized('Fit and appearance', '贴合与外观', 'Ajustement et apparence', 'Ajuste y apariencia'), body: localized('Design patents capture recognisable surface patterns and shapes for the finished eye patch.', '外观设计专利呈现眼贴成品可识别的纹理与轮廓。', 'Les brevets de dessin protègent les motifs et les formes reconnaissables du patch fini.', 'Las patentes de diseño recogen patrones y formas reconocibles del parche terminado.')}
    ],
    reviewTitle: localized('Practical ideas for a working production line.', '让创新真正落在生产线上。', 'Des idées concrètes pour une ligne de production.', 'Ideas prácticas para una línea de producción.'),
    review: [
      {title: localized('Make the gel evenly', '让凝胶更均匀', 'Préparer un gel régulier', 'Preparar un gel uniforme'), body: localized('Mixing, milling and temperature control help build a stable starting point for the product.', '混合、研磨与温度控制共同帮助凝胶保持稳定状态。', 'Le mélange, le broyage et la maîtrise de la température contribuent à la stabilité du gel.', 'La mezcla, la molienda y el control de temperatura ayudan a mantener estable el gel.')},
      {title: localized('Form with consistency', '稳定成型', 'Former avec régularité', 'Formar con regularidad'), body: localized('Dedicated trays and forming structures keep shape and handling more consistent from unit to unit.', '专用托盘与成型结构帮助产品保持一致的形状与取用体验。', 'Des plateaux et structures dédiés rendent la forme et la manipulation plus régulières.', 'Las bandejas y estructuras específicas mantienen una forma y manipulación más uniformes.')},
      {title: localized('Cut cleanly', '利落裁切', 'Découper proprement', 'Cortar con precisión'), body: localized('Purpose-built cutting devices support clean edges and repeatable dimensions.', '专用裁切装置有助于形成整齐边缘与稳定尺寸。', 'Des dispositifs de découpe dédiés assurent des bords nets et des dimensions régulières.', 'Los dispositivos de corte específicos favorecen bordes limpios y dimensiones uniformes.')},
      {title: localized('Finish with character', '形成产品识别', 'Donner du caractère', 'Dar carácter al producto'), body: localized('Surface pattern, fit and pack presentation give the finished mask its recognisable look.', '纹理、贴合轮廓与包装呈现，共同形成成品面膜的辨识度。', 'Le motif, l’ajustement et la présentation donnent au masque fini son identité visuelle.', 'El patrón, el ajuste y la presentación dan identidad visual a la mascarilla terminada.')}
    ],
    publicationTitle: localized('The essential facts stay visible on every certificate.', '每张证书都保留最重要的原始信息。', 'Les informations essentielles restent visibles sur chaque certificat.', 'Los datos esenciales permanecen visibles en cada certificado.'),
    publication: [
      {title: localized('Patent title', '专利名称', 'Titre du brevet', 'Título de la patente'), body: localized('The full title appears on the document and beside its image.', '证书原图与页面卡片均展示完整专利名称。', 'Le titre complet figure sur le certificat et à côté de son image.', 'El título completo aparece en el certificado y junto a su imagen.')},
      {title: localized('Patent number', '专利号', 'Numéro de brevet', 'Número de patente'), body: localized('Each card carries the number printed on the corresponding certificate.', '每张卡片均标注与证书一致的专利号。', 'Chaque carte reprend le numéro imprimé sur le certificat.', 'Cada tarjeta muestra el número impreso en el certificado.')},
      {title: localized('Named rightsholder', '证书记载权利人', 'Titulaire indiqué', 'Titular indicado'), body: localized('The rightsholder is stated exactly as shown on the supplied document.', '权利人信息按项目提供的证书记载展示。', 'Le titulaire est indiqué tel qu’il apparaît dans le document fourni.', 'El titular se indica tal como aparece en el documento facilitado.')},
      {title: localized('Original document image', '证书原图', 'Image du document original', 'Imagen del documento original'), body: localized('The source image remains available for direct visual comparison.', '保留完整证书画面，方便直接对照。', 'L’image source reste visible pour une comparaison directe.', 'La imagen original permanece visible para su comprobación directa.')}
    ],
    action: {
      eyebrow: localized('TALK TO THE HYDROGEL TEAM', '咨询水凝胶产品', 'PARLER À L’ÉQUIPE HYDROGEL', 'HABLAR CON EL EQUIPO DE HIDROGEL'),
      title: localized('Have a mask idea?\nLet’s talk about how to make it.', '有面膜产品想法？\n一起聊聊怎么实现。', 'Vous avez une idée de masque ?\nVoyons comment la fabriquer.', '¿Tiene una idea de mascarilla?\nHablemos de cómo fabricarla.'),
      body: localized('Tell us the product type, market and quantity you have in mind. We can discuss suitable materials, formats and sampling options.', '告诉我们产品类型、目标市场与预计数量，我们可以继续沟通合适的材料、形态与打样方式。', 'Indiquez le type de produit, le marché et la quantité envisagés. Nous pourrons échanger sur les matières, formats et échantillons.', 'Indique el tipo de producto, mercado y cantidad. Podemos hablar de materiales, formatos y opciones de muestra.'),
      primary: localized('Discuss your product', '沟通产品需求', 'Parler de votre produit', 'Hablar de su producto'),
      secondary: localized('View finished masks', '查看成品面膜', 'Voir les masques finis', 'Ver mascarillas terminadas')
    }
  }
} as const;

export function companyText(locale: Locale, text: CompanyLocalizedText): string {
  return text[locale];
}

export function companyPageAlternates(path: string): Record<string, string> {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, localizedPath(locale, path)]),
    ['x-default', localizedPath('en', path)]
  ]);
}
