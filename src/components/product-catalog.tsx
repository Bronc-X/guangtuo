'use client';

import {useMemo, useState} from 'react';
import {ProductCard} from '@/components/product-card';
import type {Product} from '@/data/catalog';
import type {Locale} from '@/lib/routing';

export function ProductCatalog({products, locale}: {products: Product[]; locale: Locale}) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState('all');
  const forms = useMemo(() => [...new Set(products.map((product) => product.productForm?.[locale]).filter((value): value is string => Boolean(value)))].sort(), [products, locale]);
  const shown = useMemo(() => products.filter((product) => {
    const search = query.trim().toLocaleLowerCase();
    return (!search || `${product.name[locale]} ${product.name.en} ${product.sku}`.toLocaleLowerCase().includes(search))
      && (form === 'all' || product.productForm?.[locale] === form);
  }), [products, locale, query, form]);
  const copy = {
    zh: {search: '搜索名称或编号', form: '全部产品形态', results: '款产品', empty: '没有符合条件的产品，请调整搜索或形态。'},
    en: {search: 'Search name or reference', form: 'All product forms', results: 'products', empty: 'No products match. Adjust the search or form.'},
    fr: {search: 'Rechercher un produit', form: 'Tous les formats', results: 'produits', empty: 'Aucun produit trouvé.'},
    es: {search: 'Buscar producto', form: 'Todos los formatos', results: 'productos', empty: 'No se encontraron productos.'},
    ru: {search: 'Поиск продукта', form: 'Все формы', results: 'продуктов', empty: 'Продукты не найдены.'},
    ar: {search: 'ابحث عن منتج', form: 'جميع الأشكال', results: 'منتج', empty: 'لم يتم العثور على منتجات.'}
  }[locale];
  return <>
    <div className="catalog-tools">
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-label={copy.search} />
      <select value={form} onChange={(event) => setForm(event.target.value)} aria-label={copy.form}>
        <option value="all">{copy.form}</option>
        {forms.map((value) => <option value={value} key={value}>{value}</option>)}
      </select>
      <span role="status">{shown.length} {copy.results}</span>
    </div>
    {shown.length ? <div className="product-grid">{shown.map((product, index) => <ProductCard key={product.sku} product={product} locale={locale} eager={index === 0} />)}</div> : <p role="status">{copy.empty}</p>}
  </>;
}
