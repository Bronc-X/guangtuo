import type {Locale} from '@/lib/routing';

// Delivery translations; keys normalize catalogue title capitalization without changing source claims.
const translations: Record<string, Partial<Record<Locale, string>>> = {
  "collagen gel face mask · blister pack": {
    "fr": "Masque visage au gel de collagène · blister",
    "es": "Mascarilla facial de gel de colágeno · blíster",
    "ru": "Коллагеновая гелевая маска для лица · блистер"
  },
  "white-to-transparent gel face mask": {
    "fr": "Masque gel visage passant du blanc au transparent",
    "es": "Mascarilla facial de gel que pasa de blanco a transparente",
    "ru": "Гелевая маска для лица, меняющая цвет с белого на прозрачный"
  },
  "human-like hydrogel face mask": {
    "fr": "Masque hydrogel visage biomimétique",
    "es": "Mascarilla facial de hidrogel biomimético",
    "ru": "Биомиметическая гидрогелевая маска для лица"
  },
  "microporous cooling conductive cream mask": {
    "fr": "Masque crème microporeux à effet frais",
    "es": "Mascarilla cremosa microporosa de efecto refrescante",
    "ru": "Микропористая охлаждающая кремовая маска"
  },
  "polymer gel face mask": {
    "fr": "Masque visage en gel polymère",
    "es": "Mascarilla facial de gel polimérico",
    "ru": "Полимерная гелевая маска для лица"
  },
  "cream face mask": {
    "fr": "Masque crème pour le visage",
    "es": "Mascarilla cremosa facial",
    "ru": "Кремовая маска для лица"
  },
  "oil cream face mask": {
    "fr": "Masque visage crème-huile",
    "es": "Mascarilla facial de crema y aceite",
    "ru": "Масляно-кремовая маска для лица"
  },
  "white-to-transparent butterfly eye mask": {
    "fr": "Masque yeux papillon passant du blanc au transparent",
    "es": "Mascarilla de ojos mariposa que pasa de blanco a transparente",
    "ru": "Маска-бабочка для глаз, меняющая цвет с белого на прозрачный"
  },
  "bottled gel eye mask · single colour": {
    "fr": "Patchs yeux en gel en pot · une couleur",
    "es": "Parches de ojos de gel en tarro · un color",
    "ru": "Гелевые патчи для глаз в банке · одноцветные"
  },
  "bottled gel eye mask · dual colour": {
    "fr": "Patchs yeux en gel en pot · deux couleurs",
    "es": "Parches de ojos de gel en tarro · dos colores",
    "ru": "Гелевые патчи для глаз в банке · двухцветные"
  },
  "bottled star eye mask": {
    "fr": "Patchs yeux étoile en pot",
    "es": "Parches de ojos en forma de estrella en tarro",
    "ru": "Патчи-звёзды для глаз в банке"
  },
  "eye-shaped gel patch · single pack": {
    "fr": "Patch gel contour des yeux · sachet individuel",
    "es": "Parche de gel con forma de ojo · envase individual",
    "ru": "Гелевый патч по контуру глаза · индивидуальная упаковка"
  },
  "crescent gel eye patch · individual pack": {
    "fr": "Patch gel yeux en croissant · sachet individuel",
    "es": "Parche de ojos de gel en media luna · envase individual",
    "ru": "Серповидный гелевый патч для глаз · индивидуальная упаковка"
  },
  "blister crescent eye patch": {
    "fr": "Patch yeux en croissant sous blister",
    "es": "Parche de ojos de media luna en blíster",
    "ru": "Серповидный патч для глаз в блистере"
  },
  "blister eye mask · patented shape a": {
    "fr": "Masque yeux sous blister · forme brevetée A",
    "es": "Mascarilla de ojos en blíster · forma patentada A",
    "ru": "Маска для глаз в блистере · запатентованная форма A"
  },
  "blister eye mask · patented shape b": {
    "fr": "Masque yeux sous blister · forme brevetée B",
    "es": "Mascarilla de ojos en blíster · forma patentada B",
    "ru": "Маска для глаз в блистере · запатентованная форма B"
  },
  "white-to-transparent eye mask": {
    "fr": "Masque yeux passant du blanc au transparent",
    "es": "Mascarilla de ojos que pasa de blanco a transparente",
    "ru": "Маска для глаз, меняющая цвет с белого на прозрачный"
  },
  "white-to-transparent e-shape eye mask": {
    "fr": "Masque yeux en E passant du blanc au transparent",
    "es": "Mascarilla de ojos en E que pasa de blanco a transparente",
    "ru": "E-образная маска для глаз, меняющая цвет с белого на прозрачный"
  },
  "microporous cooling conductive eye mask": {
    "fr": "Masque yeux microporeux à effet frais",
    "es": "Mascarilla de ojos microporosa de efecto refrescante",
    "ru": "Микропористая охлаждающая маска для глаз"
  },
  "polymer gel eye mask · eye-mask shape": {
    "fr": "Masque yeux en gel polymère · contour des yeux",
    "es": "Mascarilla de ojos de gel polimérico · contorno de ojos",
    "ru": "Полимерная гелевая маска · по форме глаз"
  },
  "polymer gel eye mask · crescent shape": {
    "fr": "Masque yeux en gel polymère · croissant",
    "es": "Mascarilla de ojos de gel polimérico · media luna",
    "ru": "Полимерная гелевая маска для глаз · серповидная"
  },
  "polymer gel cold-compress eye mask": {
    "fr": "Masque yeux compresse froide en gel polymère",
    "es": "Mascarilla de ojos de compresa fría de gel polimérico",
    "ru": "Полимерная гелевая маска — холодный компресс для глаз"
  },
  "polymer gel wrap eye mask": {
    "fr": "Masque enveloppant pour les yeux en gel polymère",
    "es": "Mascarilla envolvente de ojos de gel polimérico",
    "ru": "Обёртывающая полимерная гелевая маска для глаз"
  },
  "composite gel eye mask · crescent shape": {
    "fr": "Masque yeux en gel composite · croissant",
    "es": "Mascarilla de ojos de gel compuesto · media luna",
    "ru": "Маска для глаз из композитного геля · серповидная"
  },
  "composite printed gel eye patch": {
    "fr": "Patch yeux imprimé en gel composite",
    "es": "Parche de ojos de gel compuesto impreso",
    "ru": "Патч для глаз из композитного геля с печатью"
  },
  "composite gel eye mask · full eye shape": {
    "fr": "Masque yeux en gel composite · couverture complète",
    "es": "Mascarilla de ojos de gel compuesto · cobertura completa",
    "ru": "Маска из композитного геля · полное покрытие зоны глаз"
  },
  "composite gel eye mask · contour shape": {
    "fr": "Masque yeux en gel composite · forme profilée",
    "es": "Mascarilla de ojos de gel compuesto · forma contorneada",
    "ru": "Маска для глаз из композитного геля · контурная"
  },
  "cream eye mask": {
    "fr": "Masque crème pour les yeux",
    "es": "Mascarilla cremosa de ojos",
    "ru": "Кремовая маска для глаз"
  },
  "boxed hydrogel lip patch": {
    "fr": "Patch lèvres hydrogel en boîte",
    "es": "Parche labial de hidrogel en caja",
    "ru": "Гидрогелевые патчи для губ в коробке"
  },
  "individual hydrogel lip patch": {
    "fr": "Patch lèvres hydrogel individuel",
    "es": "Parche labial de hidrogel individual",
    "ru": "Гидрогелевый патч для губ в индивидуальной упаковке"
  },
  "individual hydrogel neck mask": {
    "fr": "Masque cou hydrogel individuel",
    "es": "Mascarilla de cuello de hidrogel individual",
    "ru": "Гидрогелевая маска для шеи в индивидуальной упаковке"
  },
  "microporous cooling conductive neck mask": {
    "fr": "Masque cou microporeux à effet frais",
    "es": "Mascarilla de cuello microporosa de efecto refrescante",
    "ru": "Микропористая охлаждающая маска для шеи"
  },
  "forehead & eye 2-in-1 anti-wrinkle patch": {
    "fr": "Patch lissant front et yeux 2-en-1",
    "es": "Parche alisador de frente y ojos 2 en 1",
    "ru": "Разглаживающий патч для лба и глаз 2 в 1"
  },
  "v-line lifting patch": {
    "fr": "Patch raffermissant contour en V",
    "es": "Parche reafirmante de contorno en V",
    "ru": "Подтягивающий патч для V-контура лица"
  },
  "double ear-hook v-line mask": {
    "fr": "Masque contour en V à double accroche aux oreilles",
    "es": "Mascarilla de contorno en V con doble sujeción a las orejas",
    "ru": "Маска для V-контура с двойным креплением за ушами"
  },
  "golf mask": {
    "fr": "Masque de soin pour le golf",
    "es": "Mascarilla de cuidado para golf",
    "ru": "Уходовая маска для гольфа"
  },
  "forehead patch": {
    "fr": "Patch pour le front",
    "es": "Parche para la frente",
    "ru": "Патч для лба"
  },
  "nasolabial folds patch": {
    "fr": "Patch pour les sillons nasogéniens",
    "es": "Parche para surcos nasolabiales",
    "ru": "Патч для носогубных складок"
  },
  "butterfly nasolabial folds patch": {
    "fr": "Patch papillon pour les sillons nasogéniens",
    "es": "Parche mariposa para surcos nasolabiales",
    "ru": "Патч-бабочка для носогубных складок"
  },
  "lifting line mask": {
    "fr": "Masque à lignes raffermissantes",
    "es": "Mascarilla de líneas reafirmantes",
    "ru": "Маска с подтягивающими линиями"
  },
  "composite forehead & eye 2-in-1 patch": {
    "fr": "Patch composite front et yeux 2-en-1",
    "es": "Parche compuesto de frente y ojos 2 en 1",
    "ru": "Композитный патч для лба и глаз 2 в 1"
  },
  "hydrating, moisturizing and soothing": {
    "fr": "Hydratation, maintien de l’humidité et apaisement",
    "es": "Hidratación, retención de humedad y efecto calmante",
    "ru": "Увлажнение, удержание влаги и успокаивающий уход"
  },
  "firming, anti-wrinkle and brightening-led care": {
    "fr": "Soin axé sur la fermeté, le lissage des rides et l’éclat",
    "es": "Cuidado orientado a firmeza, apariencia de arrugas y luminosidad",
    "ru": "Уход для упругости, разглаживания видимых морщин и сияния"
  },
  "firming, anti-wrinkle and brightening-led care; becomes thinner and clearer during wear": {
    "fr": "Soin fermeté, rides et éclat ; devient plus fin et transparent pendant la pose",
    "es": "Cuidado de firmeza, arrugas y luminosidad; se vuelve más fino y transparente durante el uso",
    "ru": "Уход для упругости, разглаживания морщин и сияния; становится тоньше и прозрачнее при использовании"
  },
  "hydrating, moisturizing, firming and brightening-led care": {
    "fr": "Soin hydratant axé sur la rétention d’eau, la fermeté et l’éclat",
    "es": "Cuidado hidratante orientado a retención de humedad, firmeza y luminosidad",
    "ru": "Увлажняющий уход для удержания влаги, упругости и сияния"
  },
  "cooling, contour-fitting, elasticity and firming-led care": {
    "fr": "Soin frais épousant les contours, axé sur l’élasticité et la fermeté",
    "es": "Cuidado refrescante y adaptable al contorno, orientado a elasticidad y firmeza",
    "ru": "Охлаждающий уход с прилеганием по контуру, для эластичности и упругости"
  },
  "hydrating, anti-wrinkle, firming and brightening-led care": {
    "fr": "Soin hydratant, lissant, raffermissant et éclat",
    "es": "Cuidado hidratante, alisador, reafirmante y de luminosidad",
    "ru": "Увлажняющий уход для разглаживания морщин, упругости и сияния"
  },
  "nourishing, repairing, firming and brightening-led care": {
    "fr": "Soin nourrissant axé sur la réparation, la fermeté et l’éclat",
    "es": "Cuidado nutritivo orientado a reparación, firmeza y luminosidad",
    "ru": "Питательный уход для восстановления, упругости и сияния"
  },
  "oil-rich moisturizing, repairing and firming-led care": {
    "fr": "Soin riche en huiles, hydratant, réparateur et raffermissant",
    "es": "Cuidado rico en aceites, hidratante, reparador y reafirmante",
    "ru": "Богатый маслами уход для увлажнения, восстановления и упругости"
  },
  "hydrating, moisturizing, anti-wrinkle, firming and brightening-led care": {
    "fr": "Soin hydratant avec rétention d’eau, lissage, fermeté et éclat",
    "es": "Cuidado hidratante con retención de humedad, alisado, firmeza y luminosidad",
    "ru": "Уход для увлажнения, удержания влаги, разглаживания морщин, упругости и сияния"
  },
  "hydrating, moisturizing, anti-wrinkle and firming-led care": {
    "fr": "Soin hydratant axé sur la rétention d’eau, les rides et la fermeté",
    "es": "Cuidado hidratante orientado a retención de humedad, arrugas y firmeza",
    "ru": "Уход для увлажнения, удержания влаги, разглаживания морщин и упругости"
  },
  "cooling, close-fitting, smoothing, brightening and hydrating-led care": {
    "fr": "Soin frais et ajusté, axé sur le lissage, l’éclat et l’hydratation",
    "es": "Cuidado refrescante y ajustado, orientado a alisado, luminosidad e hidratación",
    "ru": "Охлаждающий плотно прилегающий уход для гладкости, сияния и увлажнения"
  },
  "hydrating, fatigue-relief, brightening and firming-led care": {
    "fr": "Soin hydratant pour atténuer l’apparence de fatigue, améliorer l’éclat et la fermeté",
    "es": "Cuidado hidratante para el aspecto cansado, la luminosidad y la firmeza",
    "ru": "Увлажняющий уход против признаков усталости, для сияния и упругости"
  },
  "cooling, hydrating and eye-fatigue relief": {
    "fr": "Fraîcheur, hydratation et soin du contour des yeux fatigué",
    "es": "Frescor, hidratación y cuidado del aspecto cansado de los ojos",
    "ru": "Охлаждение, увлажнение и уход за уставшей зоной глаз"
  },
  "hydrating, intensive repair, anti-wrinkle, firming and brightening-led care": {
    "fr": "Soin hydratant et réparateur intensif, axé sur les rides, la fermeté et l’éclat",
    "es": "Cuidado hidratante y reparador intensivo, orientado a arrugas, firmeza y luminosidad",
    "ru": "Уход для увлажнения, интенсивного восстановления, разглаживания морщин, упругости и сияния"
  },
  "hydrating, soothing and exfoliating-led lip care": {
    "fr": "Soin des lèvres hydratant, apaisant et exfoliant",
    "es": "Cuidado labial hidratante, calmante y exfoliante",
    "ru": "Увлажняющий, успокаивающий и отшелушивающий уход для губ"
  },
  "hydrating and moisturizing-led lip care": {
    "fr": "Soin des lèvres axé sur l’hydratation et la rétention d’eau",
    "es": "Cuidado labial orientado a hidratación y retención de humedad",
    "ru": "Уход для увлажнения губ и удержания влаги"
  },
  "hydrating, anti-wrinkle, firming and brightening-led neck care": {
    "fr": "Soin du cou hydratant, lissant, raffermissant et éclat",
    "es": "Cuidado de cuello hidratante, alisador, reafirmante y de luminosidad",
    "ru": "Увлажняющий уход для шеи, разглаживания морщин, упругости и сияния"
  },
  "cooling, contour-fitting, smoothing and firming-led neck care": {
    "fr": "Soin frais du cou épousant les contours, lissant et raffermissant",
    "es": "Cuidado refrescante de cuello adaptable al contorno, alisador y reafirmante",
    "ru": "Охлаждающий уход для шеи с прилеганием по контуру, для гладкости и упругости"
  },
  "multi-zone anti-wrinkle, firming and repairing-led care": {
    "fr": "Soin multizone axé sur le lissage des rides, la fermeté et la réparation",
    "es": "Cuidado multizona orientado a alisado de arrugas, firmeza y reparación",
    "ru": "Многозональный уход для разглаживания морщин, упругости и восстановления"
  },
  "hydrating, nourishing, contour-firming and lifting-led care": {
    "fr": "Soin hydratant et nourrissant pour raffermir et tonifier les contours",
    "es": "Cuidado hidratante y nutritivo orientado a firmeza y elevación del contorno",
    "ru": "Увлажняющий и питательный уход для упругости и подтягивания контура"
  },
  "jawline firming, lifting and swelling-reduction-led care": {
    "fr": "Soin de l’ovale axé sur la fermeté, le tonus et l’apparence des gonflements",
    "es": "Cuidado de mandíbula orientado a firmeza, elevación y aspecto de hinchazón",
    "ru": "Уход для упругости и подтягивания линии челюсти, уменьшения видимой отёчности"
  },
  "sports care, long-lasting hydration and jawline firming-led care": {
    "fr": "Soin sportif, hydratation longue durée et fermeté de l’ovale",
    "es": "Cuidado deportivo, hidratación duradera y firmeza de la mandíbula",
    "ru": "Спортивный уход, длительное увлажнение и упругость линии челюсти"
  },
  "hydrating and forehead-line smoothing-led care": {
    "fr": "Soin hydratant et lissant pour les lignes du front",
    "es": "Cuidado hidratante y alisador de líneas de la frente",
    "ru": "Увлажняющий уход для разглаживания линий лба"
  },
  "smile-line and expression-line smoothing with firming and hydration-led care": {
    "fr": "Soin hydratant et raffermissant pour lisser les plis du sourire et d’expression",
    "es": "Cuidado hidratante y reafirmante para alisar líneas de sonrisa y expresión",
    "ru": "Увлажняющий и укрепляющий уход для разглаживания линий улыбки и мимики"
  },
  "eye-line, smile-line and nasolabial-fold smoothing-led care": {
    "fr": "Soin lissant des lignes des yeux, du sourire et des sillons nasogéniens",
    "es": "Cuidado alisador de líneas de ojos, sonrisa y surcos nasolabiales",
    "ru": "Уход для разглаживания линий вокруг глаз, улыбки и носогубных складок"
  },
  "intensive repair, firming and anti-wrinkle-led care": {
    "fr": "Soin réparateur intensif, raffermissant et lissant",
    "es": "Cuidado reparador intensivo, reafirmante y alisador",
    "ru": "Интенсивный восстанавливающий уход для упругости и разглаживания морщин"
  },
  "blister pack + film bag + outer box": {
    "fr": "Blister + sachet film + boîte extérieure",
    "es": "Blíster + bolsa de película + caja exterior",
    "ru": "Блистер + плёночный пакет + внешняя коробка"
  },
  "pure aluminum film bag + outer box": {
    "fr": "Sachet aluminium pur + boîte extérieure",
    "es": "Bolsa de aluminio puro + caja exterior",
    "ru": "Пакет из чистой алюминиевой фольги + внешняя коробка"
  },
  "wide-mouth jar + outer box": {
    "fr": "Pot à large ouverture + boîte extérieure",
    "es": "Tarro de boca ancha + caja exterior",
    "ru": "Банка с широким горлом + внешняя коробка"
  },
  "film bag + outer box": {
    "fr": "Sachet film + boîte extérieure",
    "es": "Bolsa de película + caja exterior",
    "ru": "Плёночный пакет + внешняя коробка"
  },
  "printed pvc top film + outer box": {
    "fr": "Film supérieur PVC imprimé + boîte extérieure",
    "es": "Película superior de PVC impreso + caja exterior",
    "ru": "Печатная верхняя плёнка ПВХ + внешняя коробка"
  },
  "natural hydrogel": {
    "fr": "Hydrogel naturel",
    "es": "Hidrogel natural",
    "ru": "Натуральный гидрогель"
  },
  "microporous cooling gel": {
    "fr": "Gel microporeux rafraîchissant",
    "es": "Gel microporoso refrescante",
    "ru": "Микропористый охлаждающий гель"
  },
  "polymer gel": {
    "fr": "Gel polymère",
    "es": "Gel polimérico",
    "ru": "Полимерный гель"
  },
  "composite gel": {
    "fr": "Gel composite",
    "es": "Gel compuesto",
    "ru": "Композитный гель"
  },
  "cream mask": {
    "fr": "Masque crème",
    "es": "Mascarilla cremosa",
    "ru": "Кремовая маска"
  },
  "collagen, gelatin, hyaluronic acid, chitosan and other naturally derived gel systems.": {
    "fr": "Systèmes de gel à base de collagène, gélatine, acide hyaluronique, chitosane et autres sources naturelles.",
    "es": "Sistemas de gel de colágeno, gelatina, ácido hialurónico, quitosano y otros derivados naturales.",
    "ru": "Гелевые системы из коллагена, желатина, гиалуроновой кислоты, хитозана и других природных компонентов."
  },
  "a layered cooling format developed for close fit, hydration and a fresh skin feel.": {
    "fr": "Format frais multicouche conçu pour épouser la peau, l’hydrater et lui apporter de la fraîcheur.",
    "es": "Formato refrescante en capas diseñado para ajustarse a la piel, hidratarla y aportar frescor.",
    "ru": "Многослойный охлаждающий формат для плотного прилегания, увлажнения и ощущения свежести."
  },
  "shape-flexible gel formats for face, eye, jawline and targeted-area patches.": {
    "fr": "Formats de gel souples pour le visage, les yeux, l’ovale et les zones ciblées.",
    "es": "Formatos de gel flexibles para rostro, ojos, mandíbula y zonas localizadas.",
    "ru": "Гибкие гелевые форматы для лица, глаз, линии челюсти и локальных участков."
  },
  "natural and synthetic polymer systems combined for shape, load and skin-contact performance.": {
    "fr": "Association de polymères naturels et synthétiques pour la forme, la capacité d’imprégnation et le contact cutané.",
    "es": "Combinación de polímeros naturales y sintéticos para la forma, la capacidad de carga y el contacto con la piel.",
    "ru": "Сочетание природных и синтетических полимеров для формы, удержания состава и контакта с кожей."
  },
  "nourishing cream and oil-cream formats for face and eye-area applications.": {
    "fr": "Formats nourrissants crème et crème-huile pour le visage et le contour des yeux.",
    "es": "Formatos nutritivos de crema y crema-aceite para rostro y contorno de ojos.",
    "ru": "Питательные кремовые и масляно-кремовые форматы для лица и зоны глаз."
  },
  "founded in guangzhou": {
    "fr": "Fondée à Guangzhou",
    "es": "Fundada en Guangzhou",
    "ru": "Основана в Гуанчжоу"
  },
  "recognised as a national high-tech enterprise": {
    "fr": "Reconnue comme entreprise nationale de haute technologie",
    "es": "Reconocida como empresa nacional de alta tecnología",
    "ru": "Признана национальным высокотехнологичным предприятием"
  },
  "patents stated in the supplied company profile": {
    "fr": "Brevets indiqués dans la présentation fournie",
    "es": "Patentes indicadas en el perfil de empresa facilitado",
    "ru": "Патенты, указанные в предоставленном профиле компании"
  },
  "daily skincare-product capacity stated in the supplied profile": {
    "fr": "Capacité quotidienne de soins indiquée dans la présentation fournie",
    "es": "Capacidad diaria de productos de cuidado según el perfil facilitado",
    "ru": "Суточная мощность производства средств ухода по предоставленному профилю"
  },
  "daily hydrogel face- and eye-mask capacity stated in the supplied profile": {
    "fr": "Capacité quotidienne de masques hydrogel visage et yeux selon la présentation fournie",
    "es": "Capacidad diaria de mascarillas hidrogel faciales y de ojos según el perfil facilitado",
    "ru": "Суточная мощность производства гидрогелевых масок для лица и глаз по предоставленному профилю"
  },
  "cosmetic gel-film cutting device": {
    "fr": "Dispositif de découpe de film gel cosmétique",
    "es": "Dispositivo de corte de película de gel cosmético",
    "ru": "Устройство резки косметической гелевой плёнки"
  },
  "supports controlled cutting within the hydrogel forming workflow.": {
    "fr": "Permet une découpe maîtrisée lors de la mise en forme de l’hydrogel.",
    "es": "Permite un corte controlado durante el proceso de formado del hidrogel.",
    "ru": "Поддерживает контролируемую резку при формовании гидрогеля."
  },
  "gel cosmetics production system": {
    "fr": "Système de production de cosmétiques en gel",
    "es": "Sistema de producción de cosméticos en gel",
    "ru": "Система производства гелевой косметики"
  },
  "covers an integrated system for gel-cosmetics production.": {
    "fr": "Concerne un système intégré de production de cosmétiques en gel.",
    "es": "Abarca un sistema integrado de producción de cosméticos en gel.",
    "ru": "Охватывает интегрированную систему производства гелевой косметики."
  },
  "eye-gel production colloid mill": {
    "fr": "Broyeur colloïdal pour gel contour des yeux",
    "es": "Molino coloidal para producción de gel de ojos",
    "ru": "Коллоидная мельница для производства геля для глаз"
  },
  "supports controlled eye-gel material preparation.": {
    "fr": "Permet une préparation maîtrisée des matières du gel contour des yeux.",
    "es": "Permite una preparación controlada del material de gel para ojos.",
    "ru": "Поддерживает контролируемую подготовку сырья для геля для глаз."
  },
  "fish-scale collagen eye-patch design": {
    "fr": "Design de patch yeux au collagène à motif d’écailles",
    "es": "Diseño de parche de ojos de colágeno con escamas",
    "ru": "Дизайн коллагенового патча для глаз с рисунком чешуи"
  },
  "an appearance-design patent for a distinctive collagen eye-patch format.": {
    "fr": "Brevet de design d’un format distinctif de patch yeux au collagène.",
    "es": "Patente de diseño de un formato distintivo de parche de ojos de colágeno.",
    "ru": "Патент на промышленный образец коллагенового патча для глаз характерной формы."
  },
  "gel-cosmetics coating device": {
    "fr": "Dispositif d’enduction pour cosmétiques en gel",
    "es": "Dispositivo de recubrimiento para cosméticos en gel",
    "ru": "Устройство нанесения покрытия для гелевой косметики"
  },
  "supports the coating stage before cooling and cutting.": {
    "fr": "Permet l’enduction avant le refroidissement et la découpe.",
    "es": "Permite la etapa de recubrimiento antes del enfriamiento y corte.",
    "ru": "Поддерживает этап нанесения покрытия перед охлаждением и резкой."
  },
  "gel powder pre-dispersion": {
    "fr": "Prédispersion de la poudre de gel",
    "es": "Predispersión del polvo de gel",
    "ru": "Предварительное диспергирование гелевого порошка"
  },
  "activation and dissolution": {
    "fr": "Activation et dissolution",
    "es": "Activación y disolución",
    "ru": "Активация и растворение"
  },
  "active ingredient addition": {
    "fr": "Ajout des actifs",
    "es": "Adición de ingredientes activos",
    "ru": "Добавление активных ингредиентов"
  },
  "insulation and filtration": {
    "fr": "Maintien en température et filtration",
    "es": "Mantenimiento de temperatura y filtración",
    "ru": "Поддержание температуры и фильтрация"
  },
  "vacuum degassing": {
    "fr": "Dégazage sous vide",
    "es": "Desgasificación al vacío",
    "ru": "Вакуумная дегазация"
  },
  "thin-layer flow guidance": {
    "fr": "Répartition en couche mince",
    "es": "Distribución en capa fina",
    "ru": "Распределение тонким слоем"
  },
  "uniform cooling": {
    "fr": "Refroidissement uniforme",
    "es": "Enfriamiento uniforme",
    "ru": "Равномерное охлаждение"
  },
  "cutting and forming": {
    "fr": "Découpe et mise en forme",
    "es": "Corte y formado",
    "ru": "Резка и формование"
  },
  "essence soaking": {
    "fr": "Imprégnation d’essence",
    "es": "Impregnación de esencia",
    "ru": "Пропитка эссенцией"
  },
  "bottling and bagging": {
    "fr": "Mise en pots et en sachets",
    "es": "Envasado en tarros y bolsas",
    "ru": "Фасовка в банки и пакеты"
  },
  "inspection": {
    "fr": "Contrôle",
    "es": "Inspección",
    "ru": "Контроль"
  },
  "boxing and packaging": {
    "fr": "Mise en boîte et emballage",
    "es": "Encajado y embalaje",
    "ru": "Укладка в коробки и упаковка"
  },
  "package colour": {
    "fr": "Couleur de l’emballage",
    "es": "Color del envase",
    "ru": "Цвет упаковки"
  },
  "deep green": {
    "fr": "Vert profond",
    "es": "Verde oscuro",
    "ru": "Тёмно-зелёный"
  },
  "ivory": {
    "fr": "Ivoire",
    "es": "Marfil",
    "ru": "Слоновая кость"
  },
  "copper brown": {
    "fr": "Brun cuivré",
    "es": "Marrón cobrizo",
    "ru": "Медно-коричневый"
  },
  "graphite": {
    "fr": "Gris graphite",
    "es": "Gris grafito",
    "ru": "Графитовый"
  },
  "finish": {
    "fr": "Finition",
    "es": "Acabado",
    "ru": "Отделка"
  },
  "satin": {
    "fr": "Satiné",
    "es": "Satinado",
    "ru": "Сатиновая"
  },
  "soft touch": {
    "fr": "Toucher doux",
    "es": "Tacto suave",
    "ru": "Софт-тач"
  },
  "high gloss": {
    "fr": "Brillant intense",
    "es": "Alto brillo",
    "ru": "Высокий глянец"
  },
  "logo decoration": {
    "fr": "Marquage du logo",
    "es": "Decoración del logotipo",
    "ru": "Нанесение логотипа"
  },
  "applied label": {
    "fr": "Étiquette adhésive",
    "es": "Etiqueta adhesiva",
    "ru": "Наклейка"
  },
  "screen print": {
    "fr": "Sérigraphie",
    "es": "Serigrafía",
    "ru": "Шелкография"
  },
  "foil detail": {
    "fr": "Détail métallisé",
    "es": "Detalle metalizado",
    "ru": "Тиснение фольгой"
  },
  "logo position": {
    "fr": "Emplacement du logo",
    "es": "Posición del logotipo",
    "ru": "Положение логотипа"
  },
  "front · upper": {
    "fr": "Avant · haut",
    "es": "Frontal · superior",
    "ru": "Спереди · сверху"
  },
  "front · centre": {
    "fr": "Avant · centre",
    "es": "Frontal · centro",
    "ru": "Спереди · по центру"
  },
  "front · lower": {
    "fr": "Avant · bas",
    "es": "Frontal · inferior",
    "ru": "Спереди · снизу"
  },
  "contour airless bottle": {
    "fr": "Flacon airless profilé",
    "es": "Frasco sin aire contorneado",
    "ru": "Контурный вакуумный флакон"
  },
  "botanical dropper bottle": {
    "fr": "Flacon compte-gouttes botanique",
    "es": "Frasco cuentagotas botánico",
    "ru": "Ботанический флакон с пипеткой"
  },
  "monolith cream jar": {
    "fr": "Pot de crème monolithe",
    "es": "Tarro de crema monolítico",
    "ru": "Монолитная банка для крема"
  },
  "single-piece sheet mask pack": {
    "fr": "Sachet pour masque en tissu monobloc",
    "es": "Envase de mascarilla de tejido de una pieza",
    "ru": "Упаковка цельной тканевой маски"
  },
  "two-piece hydrogel mask pack": {
    "fr": "Sachet pour masque hydrogel en deux parties",
    "es": "Envase de mascarilla de hidrogel de dos piezas",
    "ru": "Упаковка двухкомпонентной гидрогелевой маски"
  },
  "packaging concept": {
    "fr": "Concept d’emballage",
    "es": "Concepto de envase",
    "ru": "Концепция упаковки"
  },
  "a ready-to-customise packaging format for colour, finish and logo exploration.": {
    "fr": "Format d’emballage prêt à personnaliser pour explorer couleurs, finitions et logos.",
    "es": "Formato de envase listo para personalizar colores, acabados y logotipos.",
    "ru": "Готовый к адаптации формат упаковки для выбора цвета, отделки и логотипа."
  },
  "preview only; verify the final structure with a physical sample.": {
    "fr": "Aperçu uniquement ; validez la structure finale sur un échantillon physique.",
    "es": "Solo vista previa; confirme la estructura final con una muestra física.",
    "ru": "Только просмотр; подтвердите окончательную конструкцию физическим образцом."
  },
  "preview only; verify the final cut and pouch with a physical sample.": {
    "fr": "Aperçu uniquement ; validez la découpe et le sachet sur un échantillon physique.",
    "es": "Solo vista previa; confirme el corte y el sobre con una muestra física.",
    "ru": "Только просмотр; подтвердите окончательный крой и пакет физическим образцом."
  },
  "preview only; verify the final fit and pouch with a physical sample.": {
    "fr": "Aperçu uniquement ; validez l’ajustement et le sachet sur un échantillon physique.",
    "es": "Solo vista previa; confirme el ajuste y el sobre con una muestra física.",
    "ru": "Только просмотр; подтвердите прилегание и пакет физическим образцом."
  },
  "capacity": {
    "fr": "Contenance",
    "es": "Capacidad",
    "ru": "Объём"
  },
  "bottle material": {
    "fr": "Matière du flacon",
    "es": "Material del frasco",
    "ru": "Материал флакона"
  },
  "glass": {
    "fr": "Verre",
    "es": "Vidrio",
    "ru": "Стекло"
  },
  "flint glass": {
    "fr": "Verre transparent",
    "es": "Vidrio transparente",
    "ru": "Прозрачное стекло"
  },
  "amber glass": {
    "fr": "Verre ambré",
    "es": "Vidrio ámbar",
    "ru": "Янтарное стекло"
  },
  "frosted glass": {
    "fr": "Verre dépoli",
    "es": "Vidrio esmerilado",
    "ru": "Матовое стекло"
  },
  "collar / bottle finish": {
    "fr": "Finition de la bague / du flacon",
    "es": "Acabado del cuello / frasco",
    "ru": "Отделка воротника / флакона"
  },
  "satin collar": {
    "fr": "Bague satinée",
    "es": "Cuello satinado",
    "ru": "Сатиновый воротник"
  },
  "gloss collar": {
    "fr": "Bague brillante",
    "es": "Cuello brillante",
    "ru": "Глянцевый воротник"
  },
  "frosted body": {
    "fr": "Corps dépoli",
    "es": "Cuerpo esmerilado",
    "ru": "Матовый корпус"
  },
  "fill size": {
    "fr": "Quantité de remplissage",
    "es": "Cantidad de llenado",
    "ru": "Объём наполнения"
  },
  "jar material": {
    "fr": "Matière du pot",
    "es": "Material del tarro",
    "ru": "Материал банки"
  },
  "sheet size": {
    "fr": "Taille de la feuille",
    "es": "Tamaño de la lámina",
    "ru": "Размер полотна"
  },
  "small": {
    "fr": "Petit",
    "es": "Pequeño",
    "ru": "Малый"
  },
  "standard": {
    "fr": "Taille standard",
    "es": "Estándar",
    "ru": "Стандартный"
  },
  "large": {
    "fr": "Grand",
    "es": "Grande",
    "ru": "Большой"
  },
  "sheet material": {
    "fr": "Matière de la feuille",
    "es": "Material de la lámina",
    "ru": "Материал полотна"
  },
  "cotton fibre": {
    "fr": "Fibre de coton",
    "es": "Fibra de algodón",
    "ru": "Хлопковое волокно"
  },
  "lyocell": {
    "fr": "Fibre lyocell",
    "es": "Fibra de lyocell",
    "ru": "Лиоцелл"
  },
  "bio-cellulose": {
    "fr": "Biocellulose",
    "es": "Biocelulosa",
    "ru": "Биоцеллюлоза"
  },
  "sachet material": {
    "fr": "Matière du sachet",
    "es": "Material del sobre",
    "ru": "Материал саше"
  },
  "paper-look laminate": {
    "fr": "Complexe aspect papier",
    "es": "Laminado de aspecto papel",
    "ru": "Ламинат с фактурой бумаги"
  },
  "mask size": {
    "fr": "Taille du masque",
    "es": "Tamaño de mascarilla",
    "ru": "Размер маски"
  },
  "hydrogel thickness": {
    "fr": "Épaisseur d’hydrogel",
    "es": "Grosor de hidrogel",
    "ru": "Толщина гидрогеля"
  },
  "thin": {
    "fr": "Fin",
    "es": "Fino",
    "ru": "Тонкий"
  },
  "thick": {
    "fr": "Épais",
    "es": "Grueso",
    "ru": "Толстый"
  },
  "specialty patches": {
    "ru": "Локальные патчи"
  },
  "a full-face polymer gel format for hydrating, firming and brightening-led skincare concepts.": {
    "ru": "Полимерная гелевая маска на всё лицо для ухода, направленного на увлажнение, упругость и сияние."
  },
  "full-face coverage · polymer gel · shape customisation": {
    "ru": "Полное покрытие лица · полимерный гель · индивидуальная форма"
  },
  "format": {
    "ru": "Формат"
  },
  "individual aluminum film bag + outer box": {
    "ru": "Индивидуальный пакет из алюминиевой фольги + внешняя коробка"
  },
  "hydrating, anti-wrinkle, firming and brightening-led facial care": {
    "ru": "Увлажняющий уход за лицом для разглаживания морщин, упругости и сияния"
  },
  "a cooling polymer gel eye format developed for hydrating care and relief of tired-looking eye areas.": {
    "ru": "Охлаждающая полимерная гелевая маска для увлажнения и ухода за зоной глаз с признаками усталости."
  },
  "cooling feel · polymer gel · reusable-format development potential": {
    "ru": "Охлаждающее ощущение · полимерный гель · возможность разработки многоразового формата"
  },
  "cooling hydration and tired-eye care": {
    "ru": "Охлаждающее увлажнение и уход за уставшей зоной глаз"
  },
  "a lip-shaped hydrogel patch supplied in an individual blister format for moisturizing lip-care concepts.": {
    "ru": "Гидрогелевый патч по форме губ в индивидуальном блистере для увлажняющего ухода."
  },
  "lip contour fit · gel 4 g + essence 2 g · individual pack": {
    "ru": "Прилегание по контуру губ · гель 4 г + эссенция 2 г · индивидуальная упаковка"
  },
  "printed pvc blister + outer box": {
    "ru": "Печатный блистер ПВХ + внешняя коробка"
  },
  "polymer gel forehead patch": {
    "ru": "Полимерный гелевый патч для лба"
  },
  "a targeted forehead patch for hydrating care and concepts focused on the appearance of forehead lines.": {
    "ru": "Локальный патч для увлажняющего ухода за лбом и уменьшения видимости линий на лбу."
  },
  "targeted forehead coverage · polymer gel · lightweight format": {
    "ru": "Локальное покрытие лба · полимерный гель · лёгкий формат"
  },
  "hydration and forehead-line smoothing-led care": {
    "ru": "Уход для увлажнения и разглаживания линий лба"
  },
  "a paired local-area patch shaped for smile-line and nasolabial-fold care.": {
    "ru": "Парные локальные патчи для ухода за линиями улыбки и носогубными складками."
  },
  "paired contour shape · localized fit · polymer gel": {
    "ru": "Парная контурная форма · локальное прилегание · полимерный гель"
  },
  "smile-line and nasolabial-fold smoothing with firming and hydration-led care": {
    "ru": "Увлажняющий и укрепляющий уход для разглаживания линий улыбки и носогубных складок"
  },
  "polymer gel v-line lifting patch": {
    "ru": "Подтягивающий полимерный гелевый патч для V-контура"
  },
  "a lower-face contour patch developed for hydrating, nourishing and firming-led jawline concepts.": {
    "ru": "Патч по контуру нижней части лица для увлажняющего, питательного и укрепляющего ухода за линией челюсти."
  },
  "lower-face contour · polymer gel · ear-opening structure": {
    "ru": "Контур нижней части лица · полимерный гель · отверстия для ушей"
  },
  "hydrating, nourishing and contour-firming-led jawline care": {
    "ru": "Увлажняющий и питательный уход для укрепления контура челюсти"
  },
  "a one-piece format covering the forehead and eye area for multi-zone firming and smoothing-led care.": {
    "ru": "Цельный формат, покрывающий лоб и зону глаз, для многозонального укрепляющего и разглаживающего ухода."
  },
  "forehead + eye coverage · one-piece format · polymer gel": {
    "ru": "Покрытие лба и глаз · цельный формат · полимерный гель"
  },
  "double ear-hook jawline mask": {
    "ru": "Маска для линии челюсти с двойным креплением за ушами"
  },
  "a double ear-hook lower-face mask designed for close jawline fit and firming-led contour care.": {
    "ru": "Маска для нижней части лица с двойным креплением за ушами для плотного прилегания и укрепляющего ухода за контуром челюсти."
  },
  "double ear-hook structure · jawline coverage · polymer gel": {
    "ru": "Двойное крепление за ушами · покрытие линии челюсти · полимерный гель"
  },
  "face mask · 35 g": {
    "ru": "Маска для лица · 35 г"
  },
  "face mask · 29 g": {
    "ru": "Маска для лица · 29 г"
  },
  "face mask · 30 g": {
    "ru": "Маска для лица · 30 г"
  },
  "eye mask · 100 g": {
    "ru": "Маска для глаз · 100 г"
  },
  "eye mask · 10.5 g": {
    "ru": "Маска для глаз · 10.5 г"
  },
  "eye mask · 8 g": {
    "ru": "Маска для глаз · 8 г"
  },
  "specialty patch · 13.5 g": {
    "ru": "Локальный патч · 13.5 г"
  },
  "specialty patch · 15 g": {
    "ru": "Локальный патч · 15 г"
  },
  "specialty patch · 25 g": {
    "ru": "Локальный патч · 25 г"
  },
  "specialty patch · 3 g": {
    "ru": "Локальный патч · 3 г"
  },
  "specialty patch · 5 g": {
    "ru": "Локальный патч · 5 г"
  },
  "specialty patch · 6 g": {
    "ru": "Локальный патч · 6 г"
  }
};

export function deliveryTranslation(english: string, locale: Locale): string | undefined {
  return translations[english.toLowerCase()]?.[locale];
}
