#!/usr/bin/env python3
"""Génère icon-192.png / icon-512.png (dégradé + calendrier) et versionne le service worker."""
import re, sys, time, pathlib
root = pathlib.Path(__file__).parent

def icons():
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        sys.exit("pip install pillow")
    for size in (192, 512):
        img = Image.new("RGB", (size, size))
        px = img.load()
        for y in range(size):
            for x in range(size):
                t = (x + y) / (2 * size)
                px[x, y] = (int(79 + 130 * t), int(140 - 80 * t), int(255 - 70 * t))
        m = img.convert("RGBA")
        d = ImageDraw.Draw(m)
        s = size / 512
        d.rounded_rectangle([96*s, 120*s, 416*s, 416*s], 48*s, fill="white")
        d.rounded_rectangle([96*s, 120*s, 416*s, 206*s], 48*s, fill="#4f8cff")
        d.rectangle([96*s, 160*s, 416*s, 206*s], fill="#4f8cff")
        for cx in (160, 324):
            d.rounded_rectangle([cx*s, 84*s, (cx+28)*s, 154*s], 14*s, fill="white")
        try:
            f = ImageFont.truetype("DejaVuSans-Bold.ttf", int(170*s))
        except OSError:
            f = ImageFont.load_default()
        d.text((256*s, 330*s), "T", font=f, fill="#a142f4", anchor="mm")
        m.convert("RGB").save(root / f"icon-{size}.png")
        print("✔", f"icon-{size}.png")

def stamp():
    sw = root / "sw.js"
    sw.write_text(re.sub(r"talcocal-v[\w.]+", f"talcocal-v{int(time.time())}", sw.read_text(), count=1))
    print("✔ cache SW versionné")

if __name__ == "__main__":
    icons(); stamp()
