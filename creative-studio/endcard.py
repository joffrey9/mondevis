#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Générateur de carte de fin (end card) 1080x1920 pour vidéos — multi-marques.

Usage :
    python3 endcard.py mondevis "mondedevis.eu" --cta "Essai gratuit · Devis en 2 min" -o output/endcard-mondevis.png
    python3 endcard.py fortemps "fortemps.be" --cta "Devis gratuit" -o output/endcard-fortemps.png

Le visuel reprend la charte brands/<marque>.json (couleurs + logo).
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

from studio.brand import load_brand_by_handle  # noqa: E402
from studio.overlay import _load_font, _rounded_cta, _corner_accents  # noqa: E402

SIZE = (1080, 1920)


def _vertical_gradient(size, top, bottom) -> Image.Image:
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    w, h = size
    for y in range(h):
        t = y / max(1, h - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=color)
    return img


def _rounded_logo(logo: Image.Image, size: int, radius: int) -> Image.Image:
    logo = logo.resize((size, size), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(logo, (0, 0), mask)
    return out


def build_endcard(brand_handle: str, site_url: str, cta: str | None = None, output: str | None = None) -> str:
    brands_dir = str(STUDIO_DIR / "brands")
    brand = load_brand_by_handle(brands_dir, brand_handle)
    if not brand.logo_path or not os.path.exists(brand.logo_path):
        print(f"ERREUR : logo introuvable pour {brand_handle} ({brand.logo_path})")
        sys.exit(1)

    # Fond dégradé sombre (bg_dark -> bg_mid), léger voile indigo/rose au centre bas
    top = brand.hex_to_rgb("bg_dark", "#0a0a14")
    bottom = brand.hex_to_rgb("bg_mid", "#14141f")
    card = _vertical_gradient(SIZE, top, bottom).convert("RGBA")

    glow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = SIZE[0] // 2, int(SIZE[1] * 0.42)
    accent = brand.hex_to_rgb("gold_mid", "#6366f1")
    for r in range(520, 0, -8):
        a = int(28 * (1 - r / 520))
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*accent, a))
    card = Image.alpha_composite(card, glow)

    draw = ImageDraw.Draw(card)
    _corner_accents(draw, SIZE[0], SIZE[1], brand)

    # Logo en pastille arrondie (app icon)
    logo_img = Image.open(brand.logo_path).convert("RGB")
    logo = _rounded_logo(logo_img, 360, 88)
    card.alpha_composite(logo, ((SIZE[0] - 360) // 2, 360))

    # Nom du site en grand
    url_font = _load_font(brand, 96)
    y = 820
    bbox = draw.textbbox((0, 0), site_url, font=url_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Adapter la taille si trop large (ex. longues URL)
    while tw > SIZE[0] - 120 and url_font.size > 40:
        url_font = _load_font(brand, url_font.size - 8)
        bbox = draw.textbbox((0, 0), site_url, font=url_font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    draw.text(
        ((SIZE[0] - tw) // 2 - bbox[0], y - bbox[1]),
        site_url,
        fill=brand.hex_to_rgb("white", "#FFFFFF"),
        font=url_font,
    )

    # Soulignement accent — placé SOUS le texte (jamais sur/à travers)
    underline_y = y + th + 24
    line_w = min(tw + 40, SIZE[0] - 200)
    draw.line(
        [(SIZE[0] - line_w) // 2, underline_y, (SIZE[0] + line_w) // 2, underline_y],
        fill=brand.hex_to_rgb("gold_mid", "#f472b6"),
        width=3,
    )

    # CTA optionnel
    if cta:
        cta_font = _load_font(brand, 40)
        _rounded_cta(draw, cta, underline_y + 90, SIZE[0], brand, cta_font)

    # Petite mention sous le CTA
    hint = "Disponible sur mobile · Devis en 2 minutes"
    hint_font = _load_font(brand, 26)
    hint_color = brand.hex_to_rgb("white_dim", "#a5b4fc")
    draw.text(
        ((SIZE[0] - draw.textbbox((0, 0), hint, font=hint_font)[2]) // 2, SIZE[1] - 150),
        hint,
        fill=hint_color,
        font=hint_font,
    )

    # Barre de marque bas
    bar_font = _load_font(brand, 22)
    brand_bar = brand.cta.get("brand_bar") or brand.name.upper()
    draw.text(
        ((SIZE[0] - draw.textbbox((0, 0), brand_bar, font=bar_font)[2]) // 2, SIZE[1] - 90),
        brand_bar,
        fill=brand.hex_to_rgb("copper", "#9ca3af"),
        font=bar_font,
    )

    output = output or f"output/endcard-{brand_handle}.png"
    card.convert("RGB").save(output, "PNG")
    print(f"Carte de fin générée : {output}")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Carte de fin vidéo (end card) 1080x1920")
    parser.add_argument("brand", help="marque (mondevis, fortemps, ...)")
    parser.add_argument("site", help="nom du site affiché (ex. mondedevis.eu)")
    parser.add_argument("--cta", default=None, help="texte du bouton CTA")
    parser.add_argument("-o", "--output", default=None)
    args = parser.parse_args()
    build_endcard(args.brand, args.site, cta=args.cta, output=args.output)
