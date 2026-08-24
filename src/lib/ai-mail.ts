import {assessInboundMail} from '@/data/mail-agent';
import type {EmailDraft, InquiryInput, InboundMailDecision, Proposal, ProposalSections} from '@/lib/contracts';
import type {Locale} from '@/lib/routing';

function proposalSections(inquiry: InquiryInput, locale: Locale): ProposalSections {
  const selected = inquiry.configuration.trim();
  const marketRequirements = inquiry.certificationConstraints.trim();

  if (locale === 'zh') return {
    needSummary: `${inquiry.company} 希望为 ${inquiry.market} 市场开发 ${inquiry.sku}：${inquiry.productGoal}。`,
    recommendedConfiguration: `${inquiry.packagingPreference} 是目前最接近的产品方向。${selected ? `您还提出了：${selected}。` : '配方、形态、净含量与包装都可以继续选择。'}`,
    missingInformation: `接下来可以补充希望的功效感受、产品形态、包装与标签。${marketRequirements ? `目标市场要求：${marketRequirements}。` : ''}`,
    commercialPlaceholders: '选定样品、数量与包装后，产品顾问会回复起订量、价格与时间。',
    nextMaterials: '如果已有配方方向、尺寸或形状要求、品牌视觉与上市计划，也可以一起发送。',
    suggestedReply: `我想以 ${inquiry.sku} 申请样品与报价，预计数量和上市时间如下：`
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
    sections: proposalSections(inquiry, locale)
  };
}

export function buildEmailDraft(proposal: Proposal, inquiry: InquiryInput, locale: Locale): EmailDraft {
  const copy: Record<Locale, {subject: string; greeting: string; close: string}> = {
    en: {subject: `Guangtuo Bio | ${inquiry.sku} finished-product enquiry`, greeting: `Hello ${inquiry.name},`, close: 'An advisor will confirm samples, commercial terms and timing with you.'},
    zh: {subject: `广拓生物｜${inquiry.sku} 成品询价信息`, greeting: `${inquiry.name}，您好：`, close: '顾问将继续与您确认样品、商务条件与时间。'},
    fr: {subject: `Guangtuo Bio | Demande produit fini ${inquiry.sku}`, greeting: `Bonjour ${inquiry.name},`, close: 'Un conseiller confirmera avec vous les échantillons, conditions commerciales et délais.'},
    es: {subject: `Guangtuo Bio | Consulta de producto terminado ${inquiry.sku}`, greeting: `Hola ${inquiry.name}:`, close: 'Un asesor confirmará contigo las muestras, condiciones comerciales y plazos.'}
  };
  const localized = copy[locale];
  return {
    to: inquiry.businessEmail,
    subject: localized.subject,
    body: [localized.greeting, '', proposal.sections.suggestedReply, '', proposal.sections.commercialPlaceholders, '', localized.close].join('\n'),
    status: 'pending_review'
  };
}

export function classifyInboundMail(message: {subject: string; body: string; hasAttachments: boolean}): InboundMailDecision {
  return assessInboundMail(message).decision;
}
