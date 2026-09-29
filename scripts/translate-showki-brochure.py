"""Produce reviewable, offline first-pass translations for the new brochure records.

Run with a local Python environment containing Argos Translate en→fr/es/ru/ar
packages. The source English and Chinese editorial copy remain in the catalog.
"""

import json
from pathlib import Path

from argostranslate.translate import translate


ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / 'src/data/showki-brochure-products.json').read_text(encoding='utf-8'))
translations = {}
for index, product in enumerate(source, start=1):
    translations[product['id']] = {
        locale: {
            'name': translate(product['name'].title(), 'en', locale),
            'effect': translate(product['effect'], 'en', locale),
        }
        for locale in ('fr', 'es', 'ru', 'ar')
    }
    print(f'{index}/{len(source)} {product["id"]}', flush=True)

(ROOT / 'src/data/showki-brochure-translations.json').write_text(
    json.dumps(translations, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)
