#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prépare l'image source de l'avatar avant le passage Veo.

Masque l'ancien logo / faux branding en bas à droite avec un patch flouté à
bords fondus (le flou reste flou après animation Veo — naturel pour le décor).

Usage :
    python3 prep-avatar-source.py "avatar mondedevis final.png" \
        -o output/avatar-source-clean.png

La zone masquée est réglable via --rect x0,y0,x1,y1 (fractions de l'image).
"""
from __future__ import annotations

import argparse
from PIL import Image, ImageFilter


def blur_patch(img: Image.Image, rect_px: tuple[int, int, int, int], feather: int = 24) -> Image.Image:
    """Applique un flou fort dans `rect_px`, avec fondu progressif sur les bords."""
    blurred = img.filter(ImageFilter.GaussianBlur(18))

    mask = Image.new("L", img.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).rectangle([rect_px[0], rect_px[1], rect_px[2], rect_px[3]], fill=255)
    # Bords fondus : on floute le masque lui-même
    mask = mask.filter(ImageFilter.GaussianBlur(feather))

    return Image.composite(blurred, img, mask)


def main() -> None:
    parser = argparse.ArgumentParser(description="Masque le faux logo de l'image avatar")
    parser.add_argument("image", help="image source (720x1280 recommandé)")
    parser.add_argument("-o", "--output", default="output/avatar-source-clean.png")
    parser.add_argument(
        "--rect",
        default="0.62,0.86,0.98,0.97",
        help="zone à masquer en fractions x0,y0,x1,y1 (défaut : coin bas droit)",
    )
    args = parser.parse_args()

    img = Image.open(args.image).convert("RGB")
    w, h = img.size
    x0, y0, x1, y1 = (float(v) for v in args.rect.split(","))
    rect_px = (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))

    clean = blur_patch(img, rect_px)
    clean.save(args.output)
    print(f"✅ Image nettoyée : {args.output} (zone masquée : {rect_px})")


if __name__ == "__main__":
    main()
