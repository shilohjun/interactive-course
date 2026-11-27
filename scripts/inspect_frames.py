"""Build a contact sheet of lecture frames at chosen seconds.

Usage:
    python scripts/inspect_frames.py .cache/frames .cache/sheet.png 100 140 170
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

frames = Path(sys.argv[1])
out = Path(sys.argv[2])
times = [int(value) for value in sys.argv[3:]]

cols = 3
thumb_w, thumb_h = 384, 240
rows = (len(times) + cols - 1) // cols
sheet = Image.new("RGB", (thumb_w * cols, thumb_h * rows), "white")
draw = ImageDraw.Draw(sheet)

for index, seconds in enumerate(times):
    path = frames / f"{seconds:04d}.jpg"
    image = Image.open(path).convert("RGB").resize((thumb_w, thumb_h))
    x = (index % cols) * thumb_w
    y = (index // cols) * thumb_h
    sheet.paste(image, (x, y))
    draw.text((x + 8, y + 8), f"t={seconds}s", fill="red")

sheet.save(out)
print(out)
