"""Render the product-photo area of the four PDF sample pages for Studio comparison.

Usage: python scripts/extract-packaging-reference.py path/to/manual.pdf
"""

from argparse import ArgumentParser
from pathlib import Path

import pymupdf


SAMPLES = {'HD-1267': 7, 'HD-1159': 13, 'HD-843': 21, 'HD-844': 31}
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/assets/packaging/reference'


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument('manual', type=Path)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with pymupdf.open(args.manual) as document:
        for sku, page_number in SAMPLES.items():
            page = document[page_number - 1]
            photo_area = pymupdf.Rect(35, 38, 450, 505) & page.rect
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.8, 1.8), clip=photo_area, alpha=False)
            output = OUTPUT / f'{sku.lower()}.png'
            pixmap.save(output)
            print(f'{sku}: manual page {page_number} -> {output}')


if __name__ == '__main__':
    main()
