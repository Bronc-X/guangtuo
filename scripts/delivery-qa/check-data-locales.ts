import {writeFileSync} from 'node:fs';
import {products} from '../../src/data/catalog';
import {hydrogelFormats} from '../../src/data/hydrogel-formats';
import {legacyPackagingProducts} from '../../src/data/legacy-packaging-catalog';
import {locales} from '../../src/lib/routing';
import {listPublishedArticles} from '../../src/lib/published-content';

const results = locales.map(locale => ({
  locale, articles: listPublishedArticles(locale).length,
  productsWithEnglishName: products.filter(p=>locale!=='en'&&p.name[locale]===p.name.en).map(p=>p.name[locale]),
  formatsWithEnglishName: hydrogelFormats.filter(p=>locale!=='en'&&p.name[locale]===p.name.en).map(p=>p.name[locale]),
  packagingWithEnglishName: legacyPackagingProducts.filter(p=>locale!=='en'&&p.name[locale]===p.name.en).map(p=>p.name[locale])
}));
writeFileSync('output/delivery-qa-20260908/six-locale-data.json', JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
