"""Render each slide of a PDF to WebP at a fixed width.

Usage:
    python scripts/slides_to_webp.py samples/speyer-1a/Lecture1a.pdf \
        public/course/lectures/speyer-1a/slides --width 1440
"""
import sys
from pathlib import Path

import pymupdf
from PIL import Image

src = Path(sys.argv[1])
outdir = Path(sys.argv[2])
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1440
outdir.mkdir(parents=True, exist_ok=True)

doc = pymupdf.open(src)
for i, page in enumerate(doc):
    scale = width / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    target = outdir / f"{i + 1:02d}.webp"
    img.save(target, "WEBP", quality=84, method=6)
    print(f"{target} {img.width}x{img.height} {target.stat().st_size // 1024}KB")
print(f"{doc.page_count} slides -> {outdir}")
