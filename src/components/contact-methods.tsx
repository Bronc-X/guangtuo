import Image from 'next/image';
import {brandContact} from '@/data/brand-contact';
import type {Locale} from '@/lib/routing';

export function ContactMethods({locale, layout = 'compact'}: {locale: Locale; layout?: 'compact' | 'cards' | 'sidebar'}) {
  const {email, whatsapp, wechat, instagram, tiktok, facebook} = brandContact;
  const zh = locale === 'zh';
  const channels = [
    {name: zh ? '邮箱' : 'Email', account: email, href: `mailto:${email}`},
    {name: 'WhatsApp', account: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`, qr: brandContact.whatsappQr},
    {name: zh ? '微信' : 'WeChat', account: wechat, qr: brandContact.wechatQr},
    {name: 'TikTok', account: `@${tiktok}`, href: `https://www.tiktok.com/@${tiktok}`, qr: brandContact.tiktokQr},
    {name: 'Instagram', account: `@${instagram}`, href: `https://www.instagram.com/${instagram}/`},
    {name: 'Facebook', account: facebook}
  ];
  if (!email && !whatsapp && !wechat) return null;
  return <aside className={`contact-methods contact-methods--${layout}`} aria-label={zh ? '联系修齐' : 'Contact SHOWKI'}>
    <strong>{zh ? '直接联系修齐' : 'Contact SHOWKI directly'}</strong>
    <p className="contact-methods__intro">{zh ? '选择您习惯的方式，聊聊产品与合作。' : 'Choose your preferred way to discuss products and collaboration.'}</p>
    <div className="contact-methods__grid">
      {channels.map(channel => <article className="contact-channel" key={channel.name}>
        <div className="contact-channel__identity"><h3>{channel.name}</h3>{channel.href ? <a href={channel.href} target={channel.href.startsWith('https:') ? '_blank' : undefined} rel={channel.href.startsWith('https:') ? 'noopener noreferrer' : undefined}>{channel.account}<span aria-hidden="true"> ↗</span></a> : <p>{channel.account}</p>}</div>
        {channel.qr && (layout === 'compact' ? <details className="contact-channel__details"><summary>{zh ? '查看二维码' : 'View QR code'}</summary><Image className="contact-channel__qr" src={channel.qr} alt={`${channel.name} ${zh ? '联系二维码' : 'contact QR code'}`} width={180} height={180} /></details> : <Image className="contact-channel__qr" src={channel.qr} alt={`${channel.name} ${zh ? '联系二维码' : 'contact QR code'}`} width={180} height={180} />)}
      </article>)}
    </div>
  </aside>;
}
