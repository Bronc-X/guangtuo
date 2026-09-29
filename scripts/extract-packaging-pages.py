"""Keep unedited source-page crops for model and Image-2 photo comparison.

These are source references only; they are not single-capacity retouched images.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/assets/packaging/reference'


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/extract-packaging-pages.py manual.pdf')
    pages = sorted({row['sourcePage'] for row in json.loads((ROOT / 'docs/packaging-brochure-variants.json').read_text(encoding='utf-8'))['variants']})
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with pymupdf.open(sys.argv[1]) as document:
        for number in pages:
            output = OUTPUT / f'p{number}-original.png'
            if output.is_file():
                continue
            page = document[number - 1]
            clip = pymupdf.Rect(35, 38, 450, 505) & page.rect
            page.get_pixmap(matrix=pymupdf.Matrix(1.8, 1.8), clip=clip, alpha=False).save(output)
    print(f'{len(pages)} photographed source pages available in {OUTPUT}')
