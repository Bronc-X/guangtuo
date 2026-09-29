"""Audit model/capacity pairs from the Red Dot catalogue text layer.

The resulting list is a modelling queue, not a claim of engineering dimensions.
Photographs still need a visual audit before a model can be approved.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/packaging-brochure-variants.json'
COMPOSITE_CAPACITY = {
    'HD-1219': ('350ml', 'PET'),
    'HD-844': ('100ml×2', 'PETG'),
    'HD-845': ('75ml×2', 'PETG'),
    'HD-846': ('50ml×2', 'PETG'),
    'HD-847': ('30ml×2', 'PETG'),
    'HD-1004': ('150ml×2', 'PET'),
    'HD-948': ('250ml×2', 'PET'),
}
SPECIFICATION_NOTES = {
    'HD-1256': 'The page caption says 120 ml; the HD specification card says 120 g. Confirm with the supplier.',
    'HD-978': 'The page caption says 650 ml; the HD specification card says 650 g. Confirm with the supplier.',
}
CAPACITY = re.compile(r'^\d+(?:ml|g)$', re.I)
SKU = re.compile(r'^HD-\d+$', re.I)
MATERIAL = re.compile(r'^(?:PETG?|PP|AS|ABS|PMMA|PCR|PE)$', re.I)


def page_variants(page: pymupdf.Page, page_number: int) -> list[dict]:
    words = [(word[4], word[0], word[1]) for word in page.get_text('words')]
    codes = [(label.upper(), x, y) for label, x, y in words if SKU.fullmatch(label)]
    if not codes:
        return []
    table_top = min(y for _, _, y in codes)
    sizes = [(label.lower(), x, y) for label, x, y in words if CAPACITY.fullmatch(label) and y >= table_top + 12]
    materials = [(label.upper(), x, y) for label, x, y in words if MATERIAL.fullmatch(label) and y >= table_top + 12]
    result = []
    for sku, x, y in codes:
        # The specification cards place capacity roughly 40 pt right and 20 pt down
        # from the HD label. Use their geometry, not OCR reading order.
        ranked = sorted(sizes, key=lambda item: abs(item[1] - x - 40) + abs(item[2] - y - 20) * 5)
        closest = ranked[0] if ranked else None
        capacity = closest[0] if closest and abs(closest[1] - x - 40) < 38 and abs(closest[2] - y - 20) < 16 else None
        material = next((label for label, mx, my in materials if abs(mx - x - 40) < 38 and 27 <= my - y <= 56), None)
        result.append({'sku': sku, 'capacity': capacity, 'sourcePage': page_number, 'material': material})

    # A few cards use one HD code for several specified sizes, printed inline.
    if len(codes) == 1:
        inline = [value for value, _, y in sizes if abs(y - codes[0][2] - 20) < 16]
        if len(inline) > 1:
            result = [{**result[0], 'capacity': value} for value in dict.fromkeys(inline)]
    return result


def extract(path: Path) -> dict:
    with pymupdf.open(path) as document:
        rows = [row for number, page in enumerate(document, 1) for row in page_variants(page, number)]
    unique: dict[tuple[str, str | None], dict] = {}
    for row in rows:
        if row['sku'] in COMPOSITE_CAPACITY:
            row['capacity'], row['material'] = COMPOSITE_CAPACITY[row['sku']]
        unique.setdefault((row['sku'], row['capacity']), row)
    counts = Counter(row['sku'] for row in unique.values())
    variants = []
    for row in unique.values():
        sku, capacity = row['sku'], row['capacity']
        variant_id = sku if counts[sku] == 1 else f"{sku}-{(capacity or 'unspecified').upper()}"
        glb = ROOT / 'public/models/packaging' / f'{variant_id.lower()}.glb'
        blend = ROOT / 'artifacts/packaging-review' / f'{variant_id}.blend'
        variants.append({
            'id': variant_id,
            **row,
            'status': 'review-model-ready' if glb.is_file() and blend.is_file() else 'pending-photo-audit',
            **({'specificationNote': SPECIFICATION_NOTES[sku]} if sku in SPECIFICATION_NOTES else {}),
        })
    return {
        'source': path.name,
        'note': 'Photo-based selection reference only. Capacity/material text may be incomplete; do not infer millimetre dimensions.',
        'skuCount': len({row['sku'] for row in variants}),
        'variantCount': len(variants),
        'variants': variants,
    }


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/extract-packaging-variants.py manual.pdf')
    data = extract(Path(sys.argv[1]))
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    missing = [row['id'] for row in data['variants'] if row['capacity'] is None]
    print(f"{data['skuCount']} HD codes; {data['variantCount']} model/capacity records; {len(missing)} without parsed capacity")
    if missing:
        print('Capacity needs photo review:', ', '.join(missing))
