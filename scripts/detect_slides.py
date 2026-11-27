"""Detect slide transitions in a screen-recorded lecture.

Samples one frame per second, crops the slide area (excluding the speaker
PiP and burned-in captions), and reports the largest frame-to-frame
changes, which are slide flips or step-by-step builds.

Usage:
    python scripts/detect_slides.py .cache/frames .cache/frames.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

FRAMES = Path(sys.argv[1] if len(sys.argv) > 1 else ".cache/frames")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ".cache/frames.json")
CROP = (185, 95, 945, 640)  # slide area inside the 1152x720 video

paths = sorted(FRAMES.glob("*.jpg"))
prev = None
rows = []
for i, p in enumerate(paths):
    img = Image.open(p).convert("L").crop(CROP).resize((96, 72))
    arr = np.asarray(img, dtype=np.float32)
    if prev is not None:
        rows.append({"t": i + 1, "diff": float(np.abs(arr - prev).mean())})
    prev = arr

rows_sorted = sorted(rows, key=lambda r: r["diff"], reverse=True)
print("top 20 transitions (t in seconds):")
for r in rows_sorted[:20]:
    print(f"  t={r['t']:4d}s  diff={r['diff']:.2f}")

# Keep peaks at least 5s apart.
peaks = []
for r in rows_sorted:
    if all(abs(r["t"] - q["t"]) > 5 for q in peaks):
        peaks.append(r)
    if len(peaks) >= 14:
        break
peaks.sort(key=lambda r: r["t"])
print("\nseparated peaks:")
for r in peaks:
    print(f"  t={r['t']:4d}s  diff={r['diff']:.2f}")

# Contact sheet: three frames per peak (t-2, t, t+2) for eyeballing.
thumb_w, thumb_h = 288, 180
cols = 3
sheet = Image.new("RGB", (thumb_w * cols, thumb_h * len(peaks)), "white")
draw = ImageDraw.Draw(sheet)
for row, r in enumerate(peaks):
    for col, off in enumerate((-2, 0, 2)):
        t = max(1, min(len(paths), r["t"] + off))
        img = Image.open(paths[t - 1]).convert("RGB").resize((thumb_w, thumb_h))
        sheet.paste(img, (col * thumb_w, row * thumb_h))
        draw.text((col * thumb_w + 6, row * thumb_h + 6), f"t={t}s", fill="red")
sheet.save(".cache/peaks.png")

OUT.write_text(
    json.dumps({"crop": CROP, "diffs": rows, "peaks": peaks}, indent=1),
    encoding="utf-8",
)
print(f"\nwrote {OUT} and .cache/peaks.png")
