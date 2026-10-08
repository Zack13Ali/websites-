"""Generate neutral placeholder stock photos (used when real photos can't be downloaded)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
palettes = {
    "hero":   ((35, 65, 58), (164, 122, 60)),
    "about":  ((31, 58, 86), (217, 207, 192)),
    "work-1": ((90, 80, 70), (239, 231, 218)),
    "work-2": ((24, 48, 42), (227, 235, 230)),
    "work-3": ((21, 42, 64), (164, 122, 60)),
    "work-4": ((91, 83, 74), (247, 243, 236)),
}
W, H = 1600, 1067
for name, (a, b) in palettes.items():
    img = Image.new("RGB", (W, H), a)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t * 0.55) for i in range(3)))
    # simple "room" shapes so it reads as an interior, not a flat block
    d.rectangle([W * 0.08, H * 0.55, W * 0.92, H * 0.62], fill=tuple(min(255, c + 40) for c in a))
    d.rectangle([W * 0.62, H * 0.18, W * 0.86, H * 0.5], outline=tuple(min(255, c + 70) for c in a), width=10)
    d.rectangle([W * 0.14, H * 0.22, W * 0.4, H * 0.5], fill=tuple(min(255, c + 25) for c in a))
    img = img.filter(ImageFilter.GaussianBlur(3))
    img.save(out / f"{name}.jpg", quality=72, optimize=True, progressive=True)
    print("wrote", out / f"{name}.jpg")
