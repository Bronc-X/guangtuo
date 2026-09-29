import {assessInboundMail} from '@/data/mail-agent';
import type {EmailDraft, InquiryInput, InboundMailDecision, Proposal, ProposalSections} from '@/lib/contracts';
import type {Locale} from '@/lib/routing';

function proposalSections(inquiry: InquiryInput, locale: Locale): ProposalSections {
  const selected = [inquiry.configuration.trim(), inquiry.efficacy, inquiry.productColor, inquiry.texture, inquiry.salesChannel, inquiry.salesPlatforms?.join(', '), inquiry.otherNeeds].filter(Boolean).join(' · ');
  const marketRequirements = inquiry.certificationConstraints.trim();

  if (locale === 'zh') return {
    needSummary: `${inquiry.company} 希望为 ${inquiry.market} 市场开发 ${inquiry.sku}：${inquiry.productGoal}。`,
    recommendedConfiguration: `${inquiry.packagingPreference} 已经成为这款产品的打样重点。${selected ? `您还希望保留：${selected}。` : '配方、膜型、净含量与包装仍可围绕品牌继续调整。'}`,
    missingInformation: `理想肤感、膜型、包装与标签要求，都可以继续调整。${marketRequirements ? `目标市场要求：${marketRequirements}。` : ''}`,
    commercialPlaceholders: '样品方向、预计数量与包装明确后，即可进一步确认起订量、报价和交期。',
    nextMaterials: '如有配方参考、尺寸或造型要求、品牌视觉与上市计划，也可一并提供。',
    suggestedReply: `希望以 ${inquiry.sku} 申请实物样品并获取报价，预计数量和上市时间如下：`
  };

  if (locale === 'fr') return {
    needSummary: `${inquiry.company} prévoit de développer ${inquiry.sku} pour le marché ${inquiry.market} : ${inquiry.productGoal}.`,
    recommendedConfiguration: `${inquiry.packagingPreference} est aujourd’hui la direction la plus proche. ${selected ? `Vous avez aussi indiqué : ${selected}.` : 'La formule, le format, le poids net et l’emballage peuvent encore être choisis.'}`,
    missingInformation: `Vous pouvez maintenant préciser l’effet recherché, le format, l’emballage et l’étiquetage.${marketRequirements ? ` Exigences du marché : ${marketRequirements}.` : ''}`,
    commercialPlaceholders: 'Une fois l’échantillon, la quantité et l’emballage choisis, un conseiller répondra avec le minimum, le prix et le délai.',
    nextMaterials: 'Vous pouvez aussi partager une orientation de formule, des dimensions ou formes, votre identité visuelle et le calendrier de lancement.',
    suggestedReply: `Je souhaite demander un échantillon et un devis pour ${inquiry.sku}. Voici la quantité et le calendrier envisagés :`
  };

  if (locale === 'es') return {
    needSummary: `${inquiry.company} planea desarrollar ${inquiry.sku} para el mercado ${inquiry.market}: ${inquiry.productGoal}.`,
    recommendedConfiguration: `${inquiry.packagingPreference} es la dirección más cercana por ahora. ${selected ? `También ha indicado: ${selected}.` : 'Todavía puede elegir la fórmula, el formato, el peso neto y el empaque.'}`,
    missingInformation: `Ahora puede añadir el efecto deseado, el formato, el empaque y el etiquetado.${marketRequirements ? ` Requisitos del mercado: ${marketRequirements}.` : ''}`,
    commercialPlaceholders: 'Cuando elija la muestra, la cantidad y el empaque, un asesor responderá con el mínimo, el precio y los plazos.',
    nextMaterials: 'También puede compartir una dirección de fórmula, medidas o formas, identidad visual y calendario de lanzamiento.',
    suggestedReply: `Quiero solicitar una muestra y una cotización de ${inquiry.sku}. Esta es la cantidad y los plazos previstos:`
  };

  if (locale === 'ru') return {
    needSummary: `${inquiry.company} планирует разработать ${inquiry.sku} для рынка ${inquiry.market}: ${inquiry.productGoal}.`,
    recommendedConfiguration: `${inquiry.packagingPreference} — наиболее близкое направление. ${selected ? `Также указано: ${selected}.` : 'Формулу, формат, массу нетто и упаковку ещё можно выбрать.'}`,
    missingInformation: `Далее можно уточнить желаемое ощущение, формат, упаковку и маркировку.${marketRequirements ? ` Требования рынка: ${marketRequirements}.` : ''}`,
    commercialPlaceholders: 'После выбора образца, количества и упаковки консультант подтвердит минимальный заказ, цену и сроки.',
    nextMaterials: 'Также можно отправить направление формулы, требования к размерам или форме, материалы бренда и план запуска.',
    suggestedReply: `Я хотел(а) бы запросить образец и цену для ${inquiry.sku}. Ожидаемые количество и срок запуска:`
  };

  if (locale === 'ar') return {
    needSummary: `تخطط ${inquiry.company} لتطوير ${inquiry.sku} لسوق ${inquiry.market}: ${inquiry.productGoal}.`,
    recommendedConfiguration: `${inquiry.packagingPreference} هو الاتجاه الأقرب حالياً. ${selected ? `كما طلبت: ${selected}.` : 'لا يزال بإمكانك اختيار التركيبة والتصميم والوزن الصافي والتغليف.'}`,
    missingInformation: `يمكنك بعد ذلك إضافة الإحساس المطلوب وتصميم المنتج والتغليف وتفضيلات الملصق.${marketRequirements ? ` متطلبات السوق: ${marketRequirements}.` : ''}`,
    commercialPlaceholders: 'يؤكد المستشار الحد الأدنى والسعر والموعد بعد اختيار العينة والكمية والتغليف.',
    nextMaterials: 'يمكنك أيضاً مشاركة اتجاه التركيبة ومتطلبات الحجم أو الشكل وملفات العلامة وخطة الإطلاق.',
    suggestedReply: `أرغب في طلب عينة وسعر للمنتج ${inquiry.sku}. الكمية وموعد الإطلاق المتوقعان هما:`
  };

  return {
    needSummary: `${inquiry.company} plans to develop ${inquiry.sku} for ${inquiry.market}: ${inquiry.productGoal}.`,
    recommendedConfiguration: `${inquiry.packagingPreference} is the closest direction for now. ${selected ? `You also asked for: ${selected}.` : 'Formula, format, net weight and pack details can still be chosen.'}`,
    missingInformation: `Next, you can add the skincare feel, product format, packaging and label preferences.${marketRequirements ? ` Market requirements: ${marketRequirements}.` : ''}`,
    commercialPlaceholders: 'Minimums, pricing and timing are confirmed with your advisor once the sample, quantity and packaging are chosen.',
    nextMaterials: 'You can also share any formula direction, size or shape requirements, brand artwork and launch plan.',
    suggestedReply: `I would like a sample and price for ${inquiry.sku}. My expected quantity and launch timing are:`
  };
}

export function buildProposalDraft(inquiry: InquiryInput, locale: Locale): Proposal {
  return {
    id: `preview-${inquiry.sku.toLowerCase()}`,
    status: 'completed',
    locale,
    sections: proposalSections({...inquiry, company: inquiry.company || inquiry.name, market: inquiry.market || (locale === 'zh' ? '待确认市场' : 'a market to confirm'), productGoal: inquiry.productGoal || inquiry.category, packagingPreference: inquiry.packagingPreference || (locale === 'zh' ? '包装待讨论' : 'Packaging to discuss')}, locale)
  };
}

export function buildEmailDraft(proposal: Proposal, inquiry: InquiryInput, locale: Locale): EmailDraft {
  const copy: Record<Locale, {subject: string; greeting: string; close: string}> = {
    en: {subject: `Showki Biotech | ${inquiry.sku} finished-product enquiry`, greeting: `Hello ${inquiry.name},`, close: 'An advisor will confirm samples, commercial terms and timing with you.'},
    zh: {subject: `修齐生物｜${inquiry.sku} 样品与报价需求`, greeting: `${inquiry.name}，您好：`, close: '感谢您的关注，我们会通过您留下的联系方式继续沟通。'},
    fr: {subject: `Showki Biotech | Demande produit fini ${inquiry.sku}`, greeting: `Bonjour ${inquiry.name},`, close: 'Un conseiller confirmera avec vous les échantillons, conditions commerciales et délais.'},
    es: {subject: `Showki Biotech | Consulta de producto terminado ${inquiry.sku}`, greeting: `Hola ${inquiry.name}:`, close: 'Un asesor confirmará contigo las muestras, condiciones comerciales y plazos.'},
    ru: {subject: `Showki Biotech | Запрос готового продукта ${inquiry.sku}`, greeting: `Здравствуйте, ${inquiry.name}!`, close: 'Консультант подтвердит образцы, коммерческие условия и сроки.'},
    ar: {subject: `Showki Biotech | استفسار عن المنتج الجاهز ${inquiry.sku}`, greeting: `مرحباً ${inquiry.name}،`, close: 'سيؤكد المستشار العينات والشروط التجارية والمواعيد معك.'}
  };
  const localized = copy[locale];
  const receipt: Record<Locale, string> = {
    en: `Thank you for your enquiry about ${inquiry.sku}. We have received your requirements.`,
    zh: `感谢您咨询 ${inquiry.sku}，我们已收到您的产品需求。`,
    fr: `Merci pour votre demande concernant ${inquiry.sku}. Nous avons bien reçu vos besoins.`,
    es: `Gracias por su consulta sobre ${inquiry.sku}. Hemos recibido sus requisitos.`,
    ru: `Спасибо за запрос о ${inquiry.sku}. Мы получили ваши требования.`,
    ar: `شكراً لاستفسارك عن ${inquiry.sku}. لقد تلقينا متطلباتك.`
  };
  return {
    to: inquiry.businessEmail,
    subject: localized.subject,
    body: [localized.greeting, '', receipt[locale], '', proposal.sections.nextMaterials, '', localized.close].join('\n'),
    status: 'pending_review'
  };
}

export function classifyInboundMail(message: {subject: string; body: string; hasAttachments: boolean}): InboundMailDecision {
  return assessInboundMail(message).decision;
}
