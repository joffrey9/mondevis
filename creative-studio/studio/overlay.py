"""Habillage charte graphique sur une image (PIL) — générique multi-marques.

Reprend le langage visuel des scripts Fortemps existants (ligne dorée, coins
décoratifs, CTA pill, WhatsApp, barre de marque) mais piloté par la charte
brands/<marque>.json. La couche d'habillage est transparente et réutilisable
(image simple ou compositing vidéo 2 couches).
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont

from .brand import Brand

FONT_CANDIDATES = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
]


def _load_font(brand: Brand, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in brand.fonts or FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    """Découpe le texte en lignes qui tiennent dans max_width."""
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split(" ")
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            bbox = draw.textbbox((0, 0), trial, font=font)
            if bbox[2] - bbox[0] <= max_width or not current:
                current = trial
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def _center_text(
    draw: ImageDraw.ImageDraw, text: str, y: int, font, fill, width: int
) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (width - (bbox[2] - bbox[0])) // 2
    draw.text((x - bbox[0], y - bbox[1]), text, fill=fill, font=font)
    return bbox[3] - bbox[1]


def _rounded_cta(
    draw: ImageDraw.ImageDraw, text: str, y: int, width: int, brand: Brand, font
) -> int:
    """Bouton CTA arrondi centré (couleurs charte)."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 26, 12
    bx = (width - tw - pad_x * 2) // 2
    by = y - bbox[1]
    draw.rounded_rectangle(
        [bx, by, bx + tw + pad_x * 2, by + th + pad_y * 2],
        radius=10,
        fill=brand.hex_to_rgb("cta_bg", "#C9A84C"),
    )
    draw.text((bx + pad_x, by + pad_y), text, fill=brand.hex_to_rgb("cta_text", "#1C140E"), font=font)
    return th + pad_y * 2


def _corner_accents(draw: ImageDraw.ImageDraw, width: int, height: int, brand: Brand) -> None:
    """Coins décoratifs dorés (style Fortemps)."""
    color = brand.hex_to_rgb("gold_mid", "#C9A84C")
    size, margin, lw = 30, 20, 2
    for mx, my, sx, sy in (
        (margin, margin, 1, 1),
        (width - margin, margin, -1, 1),
        (margin, height - margin, 1, -1),
        (width - margin, height - margin, -1, -1),
    ):
        draw.line([(mx, my), (mx + size * sx, my)], fill=color, width=lw)
        draw.line([(mx, my), (mx, my + size * sy)], fill=color, width=lw)


def _gold_line(draw: ImageDraw.ImageDraw, y: int, width: int, brand: Brand, margin: int = 60) -> None:
    draw.line(
        [(margin, y), (width - margin, y)],
        fill=brand.hex_to_rgb("gold_mid", "#C9A84C"),
        width=2,
    )


def _add_logo(base: Image.Image, brand: Brand) -> None:
    """Colle le logo de la charte (position/opacité configurables)."""
    logo_path = brand.logo_path
    if not logo_path or not os.path.exists(logo_path):
        return
    overlay = brand.overlay
    logo_size = int(overlay.get("logo_size", 120))
    position = str(overlay.get("logo_position", "bottom-right"))
    opacity = float(overlay.get("logo_opacity", 0.85))
    try:
        logo = Image.open(logo_path).convert("RGBA").resize((logo_size, logo_size), Image.LANCZOS)
    except Exception:
        return
    if logo.mode == "RGBA":
        alpha = logo.split()[3].point(lambda p: int(p * opacity))
        logo.putalpha(alpha)
    w, h = base.size
    margin = 30
    if position == "bottom-right":
        x, y = w - logo_size - margin, h - logo_size - margin
    elif position == "bottom-left":
        x, y = margin, h - logo_size - margin
    elif position == "top-right":
        x, y = w - logo_size - margin, margin
    elif position == "top-left":
        x, y = margin, margin
    else:  # top-center
        x, y = (w - logo_size) // 2, margin
    base.alpha_composite(logo, (x, y))


def _dark_band(base: Image.Image, brand: Brand, height: int | None = None) -> Image.Image:
    """Bande dégradée sombre en bas pour la lisibilité du texte."""
    width, total = base.size
    band_h = height or int(total * 0.42)
    band = Image.new("RGBA", (width, band_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(band)
    opacity = int(255 * float(brand.overlay.get("band_opacity", 0.55)))
    for y in range(band_h):
        alpha = int(opacity * (0.25 + 0.75 * (y / band_h)))
        draw.line([(0, y), (width, y)], fill=(10, 8, 5, alpha))
    base.alpha_composite(band, (0, total - band_h))
    return base


def build_overlay_layer(
    brand: Brand,
    headline: str,
    subtext: str | None = None,
    cta_label: str | None = None,
    whatsapp: str | None = None,
    benefits: list[str] | None = None,
    price: str | None = None,
    size: tuple[int, int] | None = None,
) -> Image.Image:
    """Couche d'habillage transparente (bande, texte, CTA, logo) pour compositing."""
    width, height = size or brand.size("1x1")
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    layer = _dark_band(layer, brand)
    _corner_accents(ImageDraw.Draw(layer), width, height, brand)

    draw = ImageDraw.Draw(layer)
    overlay = brand.overlay

    title_font = _load_font(brand, int(overlay.get("headline_size", 42)))
    lines = _wrap_text(draw, headline, title_font, width - 120)
    line_h = title_font.size + 8
    block_h = line_h * len(lines)
    start_y = height - int(height * 0.40) - block_h // 2

    _gold_line(draw, start_y - 18, width, brand)

    y = start_y
    for line in lines:
        _center_text(draw, line, y, title_font, brand.hex_to_rgb("white", "#FFFFFF"), width)
        y += line_h

    if subtext:
        sub_font = _load_font(brand, int(overlay.get("subtext_size", 22)))
        for line in _wrap_text(draw, subtext, sub_font, width - 140):
            _center_text(
                draw, line, y, sub_font, brand.hex_to_rgb("gold_light", "#F4E4C1"), width
            )
            y += sub_font.size + 6

    if benefits:
        benefit_font = _load_font(brand, int(overlay.get("benefit_size", 24)))
        for benefit in benefits:
            for line in _wrap_text(draw, f"• {benefit}", benefit_font, width - 140):
                _center_text(
                    draw, line, y + 4, benefit_font, brand.hex_to_rgb("white", "#FFFFFF"), width
                )
                y += benefit_font.size + 6

    if price:
        price_font = _load_font(brand, int(overlay.get("price_size", 40)))
        _center_text(
            draw, price, y + 10, price_font, brand.hex_to_rgb("gold_mid", "#C9A84C"), width
        )
        y += price_font.size + 12

    if cta_label:
        cta_font = _load_font(brand, int(overlay.get("cta_size", 22)))
        _rounded_cta(draw, cta_label, y + 14, width, brand, cta_font)
        y += int(cta_font.size * 1.6) + 28

    whatsapp_text = whatsapp or brand.cta.get("whatsapp", "")
    if whatsapp_text:
        wa_font = _load_font(brand, int(overlay.get("whatsapp_size", 18)))
        _center_text(
            draw, f"WhatsApp : {whatsapp_text}", y + 6, wa_font,
            brand.hex_to_rgb("gold_light", "#F4E4C1"), width,
        )

    brand_bar = brand.cta.get("brand_bar") or brand.name.upper()
    bar_font = _load_font(brand, 14)
    _center_text(
        draw, brand_bar, height - 56, bar_font, brand.hex_to_rgb("copper", "#B8956A"), width
    )

    _add_logo(layer, brand)
    return layer


def apply_brand(
    image: Image.Image,
    brand: Brand,
    headline: str,
    subtext: str | None = None,
    cta_label: str | None = None,
    whatsapp: str | None = None,
    benefits: list[str] | None = None,
    price: str | None = None,
    size: tuple[int, int] | None = None,
) -> Image.Image:
    """Applique la charte de marque sur une image (couverture) et retourne le visuel final."""
    target = size or brand.size("1x1")
    canvas = Image.new("RGB", target, brand.hex_to_rgb("bg_dark", "#1C140E"))
    src = image.convert("RGB")
    scale = max(target[0] / src.width, target[1] / src.height)
    resized = src.resize(
        (int(src.width * scale) + 1, int(src.height * scale) + 1), Image.LANCZOS
    )
    x = (target[0] - resized.width) // 2
    y = (target[1] - resized.height) // 2
    canvas.paste(resized, (x, y))

    layer = build_overlay_layer(
        brand,
        headline,
        subtext=subtext,
        cta_label=cta_label,
        whatsapp=whatsapp,
        benefits=benefits,
        price=price,
        size=target,
    )
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(layer)
    return canvas.convert("RGB")
