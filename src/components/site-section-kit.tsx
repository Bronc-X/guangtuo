import Image from 'next/image';
import Link from 'next/link';
import {localizedPath, type Locale} from '@/lib/routing';

export function PageIntro({eyebrow, title, body, meta}: {eyebrow: string; title: string; body: string; meta?: string[]}) {
  return (
    <header className="page-hero page-hero--complete">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
      <div className="page-hero__aside"><p>{body}</p>{meta && <div className="page-hero__meta">{meta.map((item) => <span key={item}>{item}</span>)}</div>}</div>
    </header>
  );
}

export function SectionTitle({eyebrow, title, body, dark = false}: {eyebrow: string; title: string; body?: string; dark?: boolean}) {
  return (
    <div className={dark ? 'section-heading section-heading--dark' : 'section-heading'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

export function VisualBentoCard({eyebrow, title, body, image, imageAlt, className = '', dark = false}: {eyebrow: string; title: string; body: string; image: string; imageAlt: string; className?: string; dark?: boolean}) {
  return (
    <article className={`radiant-card ${dark ? 'radiant-card--dark' : ''} ${className}`.trim()}>
      <div className="radiant-card__visual"><Image src={image} fill sizes="(max-width: 700px) 100vw, 50vw" alt={imageAlt} /></div>
      <div className="radiant-card__copy"><p className="eyebrow">{eyebrow}</p><h3>{title}</h3><p>{body}</p></div>
    </article>
  );
}

export function RadiantFrame({image, imageAlt, eyebrow, caption, className = '', imageClassName = '', priority = false, sizes = '(max-width: 700px) 100vw, 50vw', position}: {image: string; imageAlt: string; eyebrow: string; caption: string; className?: string; imageClassName?: string; priority?: boolean; sizes?: string; position?: string}) {
  return (
    <figure className={`radiant-frame ${className}`.trim()}>
      <Image
        className={`radiant-frame__image ${imageClassName}`.trim()}
        src={image}
        fill
        sizes={sizes}
        alt={imageAlt}
        priority={priority}
        style={position ? {objectPosition: position} : undefined}
      />
      <figcaption className="radiant-frame__caption"><span>{eyebrow}</span><strong>{caption}</strong></figcaption>
    </figure>
  );
}

export function ActionBand({locale, eyebrow, title, body, primaryPath = 'recommend', primaryHref, primaryLabel, secondaryPath = 'products', secondaryLabel}: {locale: Locale; eyebrow: string; title: string; body: string; primaryPath?: string; primaryHref?: string; primaryLabel: string; secondaryPath?: string; secondaryLabel: string}) {
  return (
    <section className="section section--dark action-band">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{body}</p></div>
      <div className="action-band__actions">
        <Link className="button button--light" href={primaryHref ?? localizedPath(locale, primaryPath)}>{primaryLabel}</Link>
        <Link className="button button--ghost" href={localizedPath(locale, secondaryPath)}>{secondaryLabel}</Link>
      </div>
    </section>
  );
}
