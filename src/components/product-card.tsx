import Link from 'next/link';
import Image from 'next/image';
import type {Product} from '@/data/catalog';
import {localizedPath, type Locale} from '@/lib/routing';

export function ProductCard({product, locale, eager = false}: {product: Product; locale: Locale; eager?: boolean}) {
  const labels = {
    en: {record: 'PRODUCT', pending: 'Product image coming soon'},
    zh: {record: '产品', pending: '产品图片即将更新'},
    fr: {record: 'PRODUIT', pending: 'Visuel à venir'},
    es: {record: 'PRODUCTO', pending: 'Imagen disponible próximamente'}
  }[locale];

  return (
    <Link className="product-card" href={localizedPath(locale, `products/${product.slug}`)}>
      <div className="product-card__visual">
        {product.media?.imageStatus === 'available' && product.media.image
          ? <Image src={product.media.image} width={1536} height={1536} alt={product.media.alt[locale]} loading={eager ? 'eager' : 'lazy'} />
          : <div className="product-media-placeholder" data-category={product.category} role="img" aria-label={`${product.name[locale]} · ${labels.pending}`}><span>{labels.record}</span><strong>{product.productId}</strong><small>{labels.pending}</small></div>}
        <span className="product-card__mode">{labels.record}</span>
      </div>
      <div className="product-card__meta">
        <small>{product.eyebrow[locale]}</small>
        <h3>{product.name[locale]}</h3>
        <span aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}
