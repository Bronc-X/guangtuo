"""Extract brochure model numbers with source pages for the visual audit queue.

Usage: python scripts/inventory-packaging-brochure.py path/to/catalog.pdf
This extracts labels only. Capacities and engineering dimensions need photo review.
"""

import json
import re
import sys
from pathlib import Path

import pymupdf


if len(sys.argv) != 2:
    raise SystemExit('Usage: inventory-packaging-brochure.py <catalog.pdf>')

document = pymupdf.open(sys.argv[1])
models = {}
for page_number, page in enumerate(document, start=1):
    for digits in re.findall(r'\bHD\s*[-－—–]?\s*(\d{2,5})\b', page.get_text(), re.I):
        sku = f'HD-{digits}'
        models.setdefault(sku, set()).add(page_number)

samples = {'HD-1267', 'HD-1159', 'HD-843', 'HD-844'}
inventory = {
    'source': Path(sys.argv[1]).name,
    'pageCount': len(document),
    'note': 'Text-layer model-number inventory. Capacity, material, visual variants and deduplication require image review.',
    'models': [
        {'sku': sku, 'sourcePages': sorted(pages), 'status': 'review-model-ready' if sku in samples else 'pending-photo-audit'}
        for sku, pages in sorted(models.items(), key=lambda item: (min(item[1]), item[0]))
    ],
}
output = Path(__file__).resolve().parents[1] / 'docs/packaging-brochure-inventory.json'
output.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(document)} pages, {len(models)} unique HD codes -> {output}')
