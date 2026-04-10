from PIL import Image
import os

BASE = os.path.dirname(__file__)
SRC = os.path.join(BASE, "generated-final")
OUT = os.path.join(BASE, "theme-replacement")
os.makedirs(OUT, exist_ok=True)

# Source -> target hash name
mapping = [
    ("card4_family_day.png",       "698468333f1e2a898431a26f_D184D0BED182D0BE201404x.png"),
    ("card5_cosmonautics_day.png", "698d7d5ddffeffed1bad5345_D0A4D0BED182D0BE2402x.png"),
    ("card1_rainbow_padel.jpeg",   "698d7d61940a4b35ecbbe51b_D0A4D0BED182D0BE402x.png"),
]

MAX_SIZE = 900  # square
QUALITY = 82

for src, tgt in mapping:
    path = os.path.join(SRC, src)
    img = Image.open(path).convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_SIZE:
        scale = MAX_SIZE / max(w, h)
        img = img.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
    out_path = os.path.join(OUT, tgt)
    # Save as JPEG content but with .png extension (browsers handle it)
    img.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"{tgt}: {img.size} {size_kb:.0f} KB")
