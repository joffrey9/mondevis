#!/usr/bin/env python3
"""Logo MonDevis 1080x1080 — équerre noire réaliste avec graduations blanches, en 3D."""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W = H = 1080
IMG = Image.new("RGBA", (W, H))

# ── 1. Fond : dégradé vertical indigo-700 → violet-600 ────────────────────
TOP = (67, 56, 202)      # #4338CA
BOTTOM = (124, 58, 237)  # #7C3AED
for y in range(H):
    t = y / (H - 1)
    r = int(TOP[0] + (BOTTOM[0] - TOP[0]) * t)
    g = int(TOP[1] + (BOTTOM[1] - TOP[1]) * t)
    b = int(TOP[2] + (BOTTOM[2] - TOP[2]) * t)
    for x in range(W):
        IMG.putpixel((x, y), (r, g, b, 255))

# ── 2. Halo lumineux central ──────────────────────────────────────────────
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse([540 - 430, 430 - 430, 540 + 430, 430 + 430],
                             fill=(255, 255, 255, 40))
glow = glow.filter(ImageFilter.GaussianBlur(120))
IMG = Image.alpha_composite(IMG, glow)

draw = ImageDraw.Draw(IMG)


# ── helpers ───────────────────────────────────────────────────────────────
def lerp(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def load_font(size, bold=True):
    candidates = [
        ("/System/Library/Fonts/Helvetica.ttc", 1 if bold else 0),
        ("/System/Library/Fonts/HelveticaNeue.ttc", 1 if bold else 0),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
        ("/System/Library/Fonts/Supplemental/Arial.ttf", 0),
    ]
    for path, index in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                continue
    return ImageFont.load_default()


def fill_gradient_polygon(points, c1, c2, p_from, p_to):
    dirx = p_to[0] - p_from[0]
    diry = p_to[1] - p_from[1]
    denom = dirx * dirx + diry * diry or 1
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    for y in range(min(ys), max(ys) + 1):
        for x in range(min(xs), max(xs) + 1):
            if mask.getpixel((x, y)):
                tt = ((x - p_from[0]) * dirx + (y - p_from[1]) * diry) / denom
                tt = max(0.0, min(1.0, tt))
                IMG.putpixel((x, y), lerp(c1, c2, tt) + (255,))


def centered_text(y, text, font, fill, depth=0, depth_color=None):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    x = (W - w) / 2 - bbox[0]
    if depth and depth_color:
        for i in range(depth, -1, -1):
            tt = i / depth
            draw.text((x + i, y + i), text, font=font,
                      fill=lerp(depth_color, fill, 1 - tt) + (255,))
    else:
        draw.text((x, y), text, font=font, fill=fill + (255,))


# ── 3. Équerre noire réaliste 3D ──────────────────────────────────────────
A = (390, 330)   # haut-gauche
B = (390, 600)   # angle droit (bas-gauche)
C = (660, 600)   # bas-droit
TRI = [A, B, C]
DX, DY = 13, 16

# Ombre portée floue
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).polygon([(p[0] + 24, p[1] + 28) for p in TRI],
                               fill=(5, 4, 30, 170))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
IMG = Image.alpha_composite(IMG, shadow)
draw = ImageDraw.Draw(IMG)

# Extrusion (2 couches noires) puis face noire dégradée (réaliste)
draw.polygon([(p[0] + DX, p[1] + DY) for p in TRI], fill=(0, 0, 0, 255))
draw.polygon([(p[0] + DX // 2, p[1] + DY // 2) for p in TRI], fill=(10, 10, 12, 255))
fill_gradient_polygon(TRI, (86, 86, 92), (6, 6, 8), (400, 340), (650, 590))

# Graduations blanches (règle) sur les 2 côtés de l'angle droit
step = 16
# côté vertical (A→B)
y = B[1]
i = 0
while y > A[1] + 12:
    ln = 24 if i % 5 == 0 else 13
    wd = 3 if i % 5 == 0 else 2
    draw.line([(A[0] + 4, y), (A[0] + 4 + ln, y)], fill=(255, 255, 255, 235), width=wd)
    y -= step
    i += 1
# côté horizontal (B→C)
x = B[0]
i = 0
while x < C[0] - 12:
    ln = 24 if i % 5 == 0 else 13
    wd = 3 if i % 5 == 0 else 2
    draw.line([(x, B[1] - 4), (x, B[1] - 4 - ln)], fill=(255, 255, 255, 235), width=wd)
    x += step
    i += 1

# Reflet brillant (plastique) sur le bord haut-gauche
gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(gloss).polygon([(398, 336), (520, 336), (398, 460)],
                              fill=(255, 255, 255, 60))
gloss = gloss.filter(ImageFilter.GaussianBlur(8))
IMG = Image.alpha_composite(IMG, gloss)
draw = ImageDraw.Draw(IMG)

# Fine arête lumineuse sur l'hypoténuse (réalisme)
draw.line([A, C], fill=(255, 255, 255, 70), width=2)

# ── 3b. Appareils (smartphone + PC) ─────────────────────────────────────
def drop_shadow(box, radius):
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle(box, radius=radius, fill=(5, 4, 30, 130))
    return s.filter(ImageFilter.GaussianBlur(12))

# Smartphone (gauche)
IMG = Image.alpha_composite(IMG, drop_shadow([200, 382, 306, 558], 24))
draw = ImageDraw.Draw(IMG)
draw.rounded_rectangle([198, 376, 308, 558], radius=26, fill=(255, 255, 255, 255))
draw.rounded_rectangle([210, 396, 296, 516], radius=10, fill=(40, 36, 90, 255))
draw.ellipse([243, 528, 263, 548], fill=(205, 205, 215, 255))
draw.polygon([(224, 500), (224, 462), (262, 500)], fill=(255, 255, 255, 235))  # mini équerre

# PC / laptop (droite)
IMG = Image.alpha_composite(IMG, drop_shadow([758, 386, 900, 464], 14))
draw = ImageDraw.Draw(IMG)
draw.rounded_rectangle([756, 384, 900, 462], radius=14, fill=(255, 255, 255, 255))
draw.rounded_rectangle([766, 394, 890, 452], radius=8, fill=(40, 36, 90, 255))
draw.polygon([(758, 464), (898, 464), (916, 506), (740, 506)], fill=(255, 255, 255, 255))
draw.polygon([(792, 442), (792, 414), (822, 442)], fill=(255, 255, 255, 235))  # mini équerre

# ── 4. Wordmark extrudé 3D ────────────────────────────────────────────────
title_font = load_font(164, bold=True)
centered_text(648, "MonDevis", title_font, (255, 255, 255),
              depth=11, depth_color=(20, 20, 24))

# ── 5. Sous-titre ─────────────────────────────────────────────────────────
sub_font = load_font(48, bold=False)
centered_text(856, "devis & factures pour artisans", sub_font, (226, 220, 255))

OUT = os.path.join(os.path.dirname(__file__), "..", "logo-mondevis-1080.png")
IMG.convert("RGB").save(OUT, "PNG")
print("✅ Logo 3D (équerre noire + smartphone + PC) généré :", os.path.abspath(OUT))
