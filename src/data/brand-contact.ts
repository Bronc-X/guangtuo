import {brandDefaults} from './brand-defaults';
import {getPublishedPageOverride, publishedContent} from '@/lib/published-content';
export const aboutSettings = {...brandDefaults, ...getPublishedPageOverride('about')};
export const brandContact = {
  email: aboutSettings.contactEmail, whatsapp: aboutSettings.contactWhatsapp, wechat: aboutSettings.contactWechat,
  instagram: aboutSettings.contactInstagram, tiktok: aboutSettings.contactTiktok, facebook: aboutSettings.contactFacebook,
  wechatQr: aboutSettings.wechatQr ?? '/assets/contact/wechat-qr.png',
  whatsappQr: aboutSettings.whatsappQr ?? '/assets/contact/whatsapp-qr.png',
  tiktokQr: aboutSettings.tiktokQr ?? '/assets/contact/tiktok-qr.png'
};

export function getAboutSettings(locale: string) {
  const fallback = locale === 'zh' ? aboutSettings : {...aboutSettings, profileTitle: 'SHOWKI BIOTECH · skincare and hydrogel development', profileBody: 'Founded in 2015 in Guangzhou, SHOWKI BIOTECH develops skincare, hydrogel products and botanical extracts through OEM / ODM services. We work with brands on lotions, creams, cleansers, serums, masks and targeted patches, from formula and texture to packaging and samples.'};
  const override = getPublishedPageOverride('about', publishedContent, locale);
  return {...fallback, ...(locale === 'zh' || publishedContent.translations ? override : {})};
}
