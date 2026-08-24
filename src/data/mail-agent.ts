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

const text = (en: string, zh: string, fr: string, es: string): LocalizedText => ({en, zh, fr, es});
const preset = (id: string, category: MailAgentPreset['category'], question: LocalizedText, answer: LocalizedText, keywords: string[]): MailAgentPreset => ({id, category, question, answer, keywords});

export const mailAgentPresets: MailAgentPreset[] = [
  preset('product-range', 'catalogue',
    text('Which finished products can I browse?', '可以浏览哪些成品？', 'Quels produits finis puis-je consulter ?', '¿Qué productos terminados puedo consultar?'),
    text('The catalogue covers face masks, eye masks and neck masks. Choose a product family or an exact SKU to begin.', '目录包括面部面膜、眼膜与颈膜。您可以先选择产品系列或准确 SKU。', 'Le catalogue comprend des masques visage, yeux et cou. Commencez par une famille ou un SKU précis.', 'El catálogo incluye mascarillas faciales, de ojos y de cuello. Empieza por una familia o un SKU concreto.'),
    ['product range', 'products', 'catalogue', 'mask', '产品', '品类', 'produits', 'productos']),
  preset('configurable-capacity', 'configuration',
    text('Which weights or sizes are available?', '有哪些净含量或尺寸？', 'Quels poids ou formats sont disponibles ?', '¿Qué pesos o tamaños están disponibles?'),
    text('Each product page lists its current net weight. Shape, dimensions and filling format are reviewed during sampling before any production commitment.', '每个产品页都列出当前净含量。形状、尺寸与灌装形态会在打样阶段确认。', 'Chaque fiche indique le poids net actuel. La forme, les dimensions et le conditionnement sont revus lors de l’échantillonnage.', 'Cada ficha indica el peso neto actual. La forma, las dimensiones y el llenado se revisan durante el muestreo.'),
    ['capacity', 'capacities', 'size', 'sizes', 'weight', 'dimension', '容量', '尺寸', '净含量', 'format', 'tamaño']),
  preset('configurable-material', 'configuration',
    text('Can the gel or mask substrate be customised?', '凝胶或膜体可以定制吗？', 'Le gel ou le support du masque peut-il être personnalisé ?', '¿Se puede personalizar el gel o el soporte?'),
    text('Formula direction, gel feel and mask substrate can be discussed for OEM/ODM development. Feasibility is confirmed through technical review and samples.', '可以沟通配方方向、凝胶触感与膜体材料。可行性以技术评审与样品为准。', 'La formule, la sensation du gel et le support peuvent être étudiés en OEM/ODM, sous réserve de revue technique et d’échantillons.', 'La fórmula, la sensación del gel y el soporte pueden estudiarse en OEM/ODM, sujetos a revisión técnica y muestras.'),
    ['material', 'substrate', 'hydrogel', 'formula', '材质', '膜布', '凝胶', 'support', 'sustrato']),
  preset('configurable-colour', 'configuration',
    text('Can product colour be customised?', '产品颜色可以定制吗？', 'La couleur du produit peut-elle être personnalisée ?', '¿Se puede personalizar el color?'),
    text('Colour direction can be discussed where the formula and format allow it. The approved physical sample defines the production reference.', '在配方与形态允许的前提下可以沟通颜色方向，量产以确认的实物样为参考。', 'La couleur peut être étudiée si la formule et le format le permettent. L’échantillon approuvé sert de référence.', 'El color puede estudiarse si la fórmula y el formato lo permiten. La muestra aprobada define la referencia.'),
    ['color', 'colour', 'swatch', '颜色', '色样', 'couleur', 'color']),
  preset('finish-options', 'configuration',
    text('Which finished-product formats can I explore?', '可以了解哪些成品形态？', 'Quels formats de produits finis puis-je étudier ?', '¿Qué formatos de producto terminado puedo explorar?'),
    text('The range includes sheet, cream and hydrogel formats for face, eye and neck care. The exact construction is confirmed during development.', '目录包括面部、眼部与颈部护理的片状、膏状与凝胶形态，具体结构在开发中确认。', 'La gamme comprend des formats feuille, crème et hydrogel pour le visage, les yeux et le cou.', 'La gama incluye formatos de hoja, crema e hidrogel para rostro, ojos y cuello.'),
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
    text('Start with a product family or SKU, intended use, expected quantity, target market and launch timing. An advisor can organise the remaining questions.', '从产品系列或 SKU、预期用途、数量、目标市场与上市时间开始即可。', 'Commencez par une famille ou un SKU, l’usage, la quantité, le marché et le calendrier.', 'Empieza por una familia o SKU, el uso, la cantidad, el mercado y los plazos.'),
    ['start project', 'begin', '开始项目', '怎么开始', 'commencer', 'empezar']),
  preset('required-brief', 'workflow',
    text('What should I prepare for an enquiry?', '询盘前需要准备什么？', 'Que dois-je préparer pour une demande ?', '¿Qué debo preparar para una consulta?'),
    text('The target product, intended use, market, quantity and preferred launch date are enough to begin. References are helpful but optional.', '目标产品、预期用途、市场、数量与上市时间足以开始，参考资料不是必需。', 'Le produit, l’usage, le marché, la quantité et la date souhaitée suffisent pour commencer.', 'El producto, uso, mercado, cantidad y fecha prevista son suficientes para empezar.'),
    ['information needed', 'prepare', 'brief', '需要资料', '准备什么', 'préparer', 'preparar']),
  preset('six-step-process', 'workflow',
    text('What happens after product selection?', '选好产品后会怎么进行？', 'Que se passe-t-il après la sélection ?', '¿Qué ocurre después de elegir el producto?'),
    text('The project moves through brief review, formula and format definition, sampling, document review, production confirmation and delivery.', '项目依次经过需求审核、配方与形态确认、打样、资料审核、生产确认与交付。', 'Le projet passe par la revue du brief, la définition de formule et format, les échantillons, les documents, la production et la livraison.', 'El proyecto pasa por revisión, fórmula y formato, muestras, documentos, producción y entrega.'),
    ['process', 'workflow', 'next step', '流程', '下一步', 'processus', 'proceso']),
  preset('product-images', 'catalogue',
    text('Do product images show the approved result?', '产品图片是最终确认效果吗？', 'Les images montrent-elles le résultat approuvé ?', '¿Las imágenes muestran el resultado aprobado?'),
    text('Images help identify the product and intended presentation. Formula feel, dimensions, colour and pack details must be confirmed with approved samples and documents.', '图片用于识别产品与展示方向，配方触感、尺寸、颜色与包装细节以确认样品和文件为准。', 'Les images identifient le produit. La sensation, les dimensions, la couleur et l’emballage suivent les échantillons approuvés.', 'Las imágenes identifican el producto. Sensación, dimensiones, color y empaque siguen las muestras aprobadas.'),
    ['image', 'photo', 'final result', '图片', '实拍', 'image', 'foto']),
  preset('sample-reference', 'workflow',
    text('Can I request product samples?', '可以申请产品样品吗？', 'Puis-je demander des échantillons ?', '¿Puedo solicitar muestras?'),
    text('Yes. Include the exact SKU and what you want to evaluate. An advisor will confirm sample availability, cost and timing.', '可以。请提供准确 SKU 与希望评估的内容，顾问会确认样品可用性、费用与时间。', 'Oui. Indiquez le SKU et les points à évaluer. Un conseiller confirmera disponibilité, coût et délai.', 'Sí. Indica el SKU y qué deseas evaluar. Un asesor confirmará disponibilidad, coste y plazos.'),
    ['sample', 'prototype', '样品', '打样', 'échantillon', 'muestra']),
  preset('market-use', 'service',
    text('Can the product be supplied for my target market?', '产品可以供应到目标市场吗？', 'Le produit peut-il être fourni sur mon marché cible ?', '¿Se puede suministrar el producto a mi mercado?'),
    text('Tell us the market first. Formula, testing, labelling and documentation requirements must be reviewed by the relevant people before confirmation.', '请先提供目标市场。配方、检测、标签与资料要求需由相关人员审核后确认。', 'Indiquez d’abord le marché. Formule, tests, étiquetage et documents doivent être revus avant confirmation.', 'Indica primero el mercado. La fórmula, pruebas, etiquetado y documentos deben revisarse antes de confirmar.'),
    ['target market', 'country', 'market use', '目标市场', '国家', 'marché', 'mercado']),
  preset('human-review', 'workflow',
    text('How are samples, price and timing confirmed?', '样品、价格与时间怎么确认？', 'Comment confirmer échantillons, prix et délais ?', '¿Cómo se confirman muestras, precio y plazos?'),
    text('A person reviews specifications, samples, minimum order, pricing, timing and market requirements. The website does not make commercial commitments.', '顾问会人工审核规格、样品、起订量、价格、时间与市场要求，网站不作商务承诺。', 'Une personne examine spécifications, échantillons, minimums, prix, délais et marché. Le site ne prend aucun engagement commercial.', 'Una persona revisa especificaciones, muestras, mínimos, precios, plazos y mercado. El sitio no asume compromisos comerciales.'),
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
    text('Yes. Submit the updated SKU or requirements, or reply with the enquiry reference so an advisor can continue from the latest version.', '可以。请提交更新后的 SKU 或需求，也可以凭询盘编号说明变更。', 'Oui. Envoyez le SKU ou les exigences mis à jour, ou répondez avec la référence de la demande.', 'Sí. Envía el SKU o requisitos actualizados, o responde con la referencia de la consulta.'),
    ['revise', 'change inquiry', 'update', '修改询盘', '更新', 'modifier', 'modificar']),
  preset('job-status-retry', 'workflow',
    text('What if the enquiry status cannot load?', '询盘状态无法加载怎么办？', 'Que faire si le statut ne se charge pas ?', '¿Qué hago si el estado no carga?'),
    text('Keep the enquiry reference and try the status link again. If it still fails, contact us so a person can continue the request.', '请保留询盘编号并重试状态链接。如仍失败，请联系我们由人工继续处理。', 'Conservez la référence et réessayez le lien. Si le problème persiste, contactez-nous.', 'Guarda la referencia y vuelve a probar el enlace. Si falla, contáctanos.'),
    ['status', 'retry', 'failed', '状态', '重试', '失败', 'statut', 'estado']),
  preset('sales-follow-up', 'service',
    text('How will an advisor contact me?', '顾问会如何联系我？', 'Comment un conseiller me contactera-t-il ?', '¿Cómo me contactará un asesor?'),
    text('After submission, an advisor will continue through the work email you provide and confirm samples, commercial terms and next steps.', '提交后，顾问会通过您留下的工作邮箱联系，并确认样品、商务条件与后续步骤。', 'Après l’envoi, un conseiller vous contactera par l’e-mail professionnel fourni.', 'Tras el envío, un asesor continuará por el correo de trabajo indicado.'),
    ['sales follow up', 'contact me', '顾问联系', '销售跟进', 'contact', 'contacto'])
];

export const escalationRules = [
  {id: 'pricing', pattern: /price|pricing|quotation|prix|precio|报价|价格/i},
  {id: 'discount', pattern: /discount|remise|descuento|折扣|优惠/i},
  {id: 'moq', pattern: /\bmoq\b|minimum order|quantité minimale|pedido mínimo|起订/i},
  {id: 'lead_time', pattern: /lead[ -]?time|delivery date|délai|plazo|交期|交货/i},
  {id: 'payment', pattern: /payment|paiement|pago|付款|账期/i},
  {id: 'bank', pattern: /bank|banque|banco|account number|银行|账户/i},
  {id: 'contract', pattern: /contract|agreement|contrat|contrato|合同|协议/i},
  {id: 'refund', pattern: /refund|chargeback|remboursement|reembolso|退款/i},
  {id: 'legal', pattern: /legal|lawyer|lawsuit|juridique|abogado|法律|律师|诉讼/i},
  {id: 'certification', pattern: /certif|certificate|certificat|certificado|认证|证书/i},
  {id: 'efficacy_claim', pattern: /efficacy|claim|cure|treat|efficacité|curar|功效|宣称|治疗/i},
  {id: 'prompt_injection', pattern: /ignore (all |any )?(previous|prior) instructions|reveal (the )?(system|developer) prompt|system prompt|忽略.*指令|泄露.*提示|系统提示/i}
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
    zh: {received: '已收到', followup: '顾问将继续与您确认最终规格、样品、商务条件与时间。', acknowledgement: '我们已收到邮件，将由相关人员审核并在原邮件中继续回复。'},
    fr: {received: 'Reçu', followup: 'Un conseiller confirmera avec vous les spécifications, échantillons, conditions commerciales et délais.', acknowledgement: 'Nous avons reçu votre e-mail. Une personne examinera la demande et poursuivra dans le fil initial.'},
    es: {received: 'Recibido', followup: 'Un asesor confirmará contigo las especificaciones, muestras, condiciones comerciales y plazos.', acknowledgement: 'Hemos recibido tu correo. Una persona revisará la solicitud y continuará en el hilo original.'}
  };
  const localized = copy[locale];
  const subject = `${localized.received} | ${message.subject.slice(0, 100)}`;
  if (assessment.decision === 'substantive_auto_reply' && assessment.matchedPresetId) {
    const selected = mailAgentPresets.find((item) => item.id === assessment.matchedPresetId);
    if (selected) return {...assessment, subject, body: `${selected.answer[locale]}\n\n${localized.followup}`};
  }
  return {...assessment, subject, body: localized.acknowledgement};
}
