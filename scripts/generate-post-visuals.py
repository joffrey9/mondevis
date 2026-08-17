#!/usr/bin/env python3
"""Visuels du post d'annonce MonDevis : 1080x1350 (feed 4:5) + 1080x1920 (story 9:16).

Reprend le logo carré déjà généré (logo-mondevis-1080.png) et le compose sur un
fond dégradé indigo→violet avec accroche + offre + URL.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

TOP = (67, 56, 202)      # #4338CA
BOTTOM = (124, 58, 237)  # #7C3AED
BASE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(BASE, "..", "logo-mondevis-1080.png")


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


def gradient_bg(W, H):
    """Dégradé vertical rapide (1 colonne étirée) au lieu d'une boucle W×H."""
    grad = Image.new("RGB", (1, H))
    for y in range(H):
        grad.putpixel((0, y), lerp(TOP, BOTTOM, y / (H - 1)))
    return grad.resize((W, H)).convert("RGBA")


def halo(bg, cx, cy, r, alpha=40, blur=120):
    glow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([cx - r, cy - r, cx + r, cy + r],
                                 fill=(255, 255, 255, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(bg, glow)


def fit_font(text, max_w, size, bold=True):
    """Réduit la taille jusqu'à ce que le texte tienne dans max_w."""
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    while size > 18:
        f = load_font(size, bold)
        bb = probe.textbbox((0, 0), text, font=f)
        if bb[2] - bb[0] <= max_w:
            return f
        size -= 4
    return load_font(size, bold)


def render(W, H, out_name, logo_scale, logo_top, blocks):
    bg = gradient_bg(W, H)
    bg = halo(bg, W // 2, logo_top, int(W * 0.55))

    # Logo carré redimensionné, centré en haut
    logo = Image.open(LOGO).convert("RGBA")
    lw = int(W * logo_scale)
    lh = int(lw * logo.height / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    bg.alpha_composite(logo, ((W - lw) // 2, logo_top))

    draw = ImageDraw.Draw(bg)
    y = logo_top + lh + 36
    max_w = W - 160

    for text, size, bold, color, gap in blocks:
        font = fit_font(text, max_w, size, bold)
        bb = draw.textbbox((0, 0), text, font=font)
        x = (W - (bb[2] - bb[0])) / 2 - bb[0]
        draw.text((x, y), text, font=font, fill=color)
        y += (bb[3] - bb[1]) + gap

    out = os.path.join(BASE, "..", out_name)
    bg.convert("RGB").save(out, "PNG")
    print("✅", out_name, "→", os.path.abspath(out))


WHITE = (255, 255, 255, 255)
LILAC = (226, 220, 255, 255)

# ── Feed 4:5 (1080x1350) ────────────────────────────────────────────────
render(
    1080, 1350, "post-annonce-1080x1350.png",
    logo_scale=0.62, logo_top=130,
    blocks=[
        ("Tes devis en 2 minutes.", 96, True, WHITE, 26),
        ("Depuis ton téléphone, sur le chantier.", 46, False, LILAC, 30),
        ("3 devis/mois gratuits · 14 jours d'essai sans CB", 38, False, LILAC, 34),
        ("mondedevis.eu", 54, True, WHITE, 0),
    ],
)

# ── Story / Reel 9:16 (1080x1920) ────────────────────────────────────────
render(
    1080, 1920, "post-annonce-1080x1920.png",
    logo_scale=0.66, logo_top=230,
    blocks=[
        ("Tes devis en 2 minutes.", 100, True, WHITE, 30),
        ("Depuis ton téléphone, sur le chantier.", 48, False, LILAC, 34),
        ("3 devis/mois gratuits · 14 jours d'essai sans CB", 40, False, LILAC, 40),
        ("mondedevis.eu", 56, True, WHITE, 0),
    ],
)
