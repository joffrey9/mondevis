#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P4 « Facture B2B refusée » — Peppol, faceless, 100 % réel.

Le visuel vient de la VRAIE app MonDevis (`mondevis/demo-video/ecran-brut.mov`) :
la facture FAC-BE-2026-0003, le bloc client pro (« Professionnel · TVA BE ») et
le bouton vert « Envoyer via Peppol (B2B) ». Aucun visage, aucun chantier.

Angle : depuis le 01/01/2026, un PDF envoyé par mail ne suffit plus entre
entreprises en Belgique — le comptable du client peut refuser la facture.

Sortie : output/p4-peppol.mp4 (1080x1920, 30 fps, audio -14 LUFS).

Images sources à extraire une fois dans /tmp/p4src (/tmp est vidé au reboot) :
    cd mondevis/demo-video
    ffmpeg -ss 124 -i ecran-brut.mov -frames:v 1 -y /tmp/p4src/full124.png
    ffmpeg -ss 121 -i ecran-brut.mov -frames:v 1 -y /tmp/p4src/full121.png
    # puis les 4 découpes : invoice_card, factures_list, client_card, peppol_btn
    # (découpes relevées sur la capture 2588x2254)

Lancer depuis mondevis/creative-studio :  python3 build-p4.py
"""

from __future__ import annotations

import math
import random
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

from studio import voiceover  # noqa: E402
from studio.video import burn_captions, mux_audio_with_music  # noqa: E402

W, H = 1080, 1920
FPS = 30
DUR = 28.6

BG = (10, 10, 20)
RED = (244, 63, 63)
WHITE = (255, 255, 255)
GREY = (165, 180, 252)
GREEN = (22, 163, 74)
INDIGO = (99, 102, 241)

FRAMES = Path("/tmp/p4src")
OUT = STUDIO_DIR / "output" / "p4-peppol.mp4"
MUSIC = STUDIO_DIR.parent / "audio" / "ambient_reel.mp3"
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

SCRIPT = (
    "Depuis janvier 2026, ta facture B2B peut être refusée. "
    "En Belgique, la facture électronique Peppol est obligatoire entre entreprises. "
    "Tu envoies un PDF par mail à un client pro ? Son comptable peut le refuser. "
    "Chez moi, le bouton Peppol est directement sur la facture : j'accepte le devis, "
    "je le transforme, elle part au format obligatoire. "
    "Tape mondedevis.eu, 14 jours gratuits."
)

# Découpage calé sur la voix (27 s) : hook, problème, démo, CTA
A, B, C, D, E = 0.0, 4.0, 10.0, 14.0, 22.5


def img(name: str) -> Image.Image:
    path = FRAMES / f"{name}.png"
    if not path.is_file():
        raise SystemExit(f"❌ image source manquante : {path}")
    return Image.open(path).convert("RGB")


def text_img(text: str, size: int, color=WHITE, font=FONT_BOLD, spacing: int = 0) -> Image.Image:
    f = ImageFont.truetype(font, size)
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    box = d.textbbox((0, 0), text, font=f)
    im = Image.new("RGBA", (box[2] - box[0] + 8, box[3] - box[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - box[0], 4 - box[1]), text, font=f, fill=color)
    return im


def card(src: Image.Image, target_w: int, radius: int = 18) -> Image.Image:
    """Carte arrondie avec ombre douce."""
    w = target_w
    h = round(src.height * w / src.width)
    body = src.resize((w, h), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    body.putalpha(mask)

    pad = 40
    shadow = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sh_mask = Image.new("L", shadow.size, 0)
    ImageDraw.Draw(sh_mask).rounded_rectangle((pad, pad + 8, pad + w, pad + h + 8), radius, fill=170)
    sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(18))
    shadow.putalpha(sh_mask)
    shadow.alpha_composite(body, (pad, pad))
    return shadow


def paste(frame: Image.Image, im: Image.Image, cx: int, cy: int, alpha: int = 255) -> None:
    if alpha < 255:
        im = im.copy()
        a = im.getchannel("A").point(lambda v: v * alpha // 255)
        im.putalpha(a)
    frame.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def ease_io(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 0.5 - 0.5 * math.cos(math.pi * x)


# Cartes pré-rendues
C_INVOICE = card(img("invoice_card"), 1040)
C_LIST = card(img("factures_list"), 1010)
C_CLIENT = card(img("client_card"), 1010)
C_PEPPOL = card(img("peppol_btn"), 820, radius=12)


def qr_tile(url: str, size: int) -> Image.Image:
    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    im = qr.make_image(fill_color=(10, 10, 20), back_color="white").convert("RGBA")
    im = im.resize((size, size), Image.NEAREST)

    pad = 22
    tile = Image.new("RGBA", (size + pad * 2, size + pad * 2), (255, 255, 255, 255))
    mask = Image.new("L", tile.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.width - 1, tile.height - 1), 28, fill=255)
    tile.putalpha(mask)
    tile.alpha_composite(im, (pad, pad))
    return tile


STAMP = text_img("REFUSÉE", 96, RED, FONT_BLACK).rotate(-12, expand=True, resample=Image.BICUBIC)
_s_w, _s_h = STAMP.size
_box = Image.new("RGBA", (_s_w + 80, _s_h + 60), (0, 0, 0, 0))
_bd = ImageDraw.Draw(_box)
_bd.rounded_rectangle((8, 18, _s_w + 71, _s_h + 41), 16, outline=RED, width=9)
_box.alpha_composite(STAMP, (40, 30))
STAMP = _box

T_TOP = text_img("DEPUIS JANVIER 2026", 44, GREY, FONT_BOLD)
T_P1 = text_img("PEPPOL EST OBLIGATOIRE", 56, WHITE, FONT_BLACK)
T_P2 = text_img("ENTRE ENTREPRISES · BELGIQUE", 38, GREY, FONT_BOLD)
T_PDF = text_img("UN PDF PAR MAIL NE SUFFIT PLUS", 46)
T_CLIENT = text_img("CLIENT PRO = FORMAT OBLIGATOIRE", 44)
T_A2 = text_img("TA FACTURE B2B PEUT ÊTRE REFUSÉE", 42)
T_C2 = text_img("SON COMPTABLE PEUT LA REFUSER", 38, RED, FONT_BOLD)
T_BTN = text_img("LE BOUTON EST SUR LA FACTURE", 48)
T_FORMAT = text_img("ELLE PART AU FORMAT OBLIGATOIRE", 42)
T_URL = text_img("mondedevis.eu", 96, WHITE, FONT_BLACK)
T_TRIAL = text_img("14 JOURS GRATUITS · SANS CARTE", 38, GREY, FONT_BOLD)
T_END = text_img("Devis et factures, sur ton téléphone.", 40, (200, 205, 230))
T_SCAN = text_img("SCANNE POUR OUVRIR", 40, GREY, FONT_BOLD)

QR_IMG = qr_tile("https://mondedevis.eu", 330)

LOGO_IMG = Image.open(LOGO).convert("RGBA")
LOGO_IMG = LOGO_IMG.resize((210, round(LOGO_IMG.height * 210 / LOGO_IMG.width)), Image.LANCZOS)
_logo_tile = Image.new("RGBA", (LOGO_IMG.width + 56, LOGO_IMG.height + 56), (255, 255, 255, 245))
_mask = Image.new("L", _logo_tile.size, 0)
ImageDraw.Draw(_mask).rounded_rectangle((0, 0, _logo_tile.width - 1, _logo_tile.height - 1), 40, fill=255)
_logo_tile.putalpha(_mask)
_logo_tile.alpha_composite(LOGO_IMG, (28, 28))
LOGO_IMG = _logo_tile


def background() -> Image.Image:
    bg = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(glow)
    d.ellipse((-260, 240, 700, 1200), fill=(38, 32, 96))
    d.ellipse((520, 700, 1420, 1600), fill=(58, 22, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    return Image.blend(bg, glow, 0.55).convert("RGBA")


BG_IMG = background()


def ring(frame: Image.Image, cx: int, cy: int, half_w: int, half_h: int, alpha: int) -> None:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        (cx - half_w, cy - half_h, cx + half_w, cy + half_h), 28, outline=GREEN + (alpha,), width=7
    )
    frame.alpha_composite(layer)


def render_frame(t: float) -> Image.Image:
    f = BG_IMG.copy()

    if t < B:  # A — le hook : la facture refusée
        k = ease_out(t / 0.5)
        paste(f, T_TOP, W // 2, 240, int(255 * min(1, t / 0.25)))
        paste(f, C_INVOICE, W // 2, 760, int(255 * k))
        # le tampon s'abat
        p = ease_out((t - 0.35) / 0.25)
        sc = 2.3 - 1.5 * p
        st = STAMP.resize((int(STAMP.width * sc), int(STAMP.height * sc)), Image.LANCZOS)
        shake = int(random.uniform(-18, 18)) if 0.35 <= t < 0.6 else 0
        paste(f, st, W // 2 + 40 + shake, 790 + (int(random.uniform(-5, 5)) if t < 0.6 else 0), 240)
        paste(f, T_A2, W // 2, 1120, int(255 * min(1, max(0, (t - 0.9) / 0.35))))

    elif t < C:  # B — Peppol obligatoire + le PDF qui ne suffit plus
        lt = t - B
        paste(f, T_P1, W // 2, 250, int(255 * min(1, lt / 0.3)))
        paste(f, T_P2, W // 2, 330, int(255 * min(1, max(0, (lt - 0.15) / 0.3))))
        z = 1 + 0.04 * ease_io(lt / (C - B))
        cl = C_LIST.resize((int(1010 * z), int(C_LIST.height * z)), Image.LANCZOS)
        paste(f, cl, W // 2, 830, int(255 * ease_out(lt / 0.4)))
        paste(f, T_PDF, W // 2, 1180, int(255 * min(1, max(0, (lt - 1.2) / 0.35))))

    elif t < D:  # C — le client pro
        lt = t - C
        k = ease_out(lt / 0.4)
        paste(f, C_CLIENT, W // 2, 800, int(255 * k))
        paste(f, T_CLIENT, W // 2, 1090, int(255 * min(1, max(0, (lt - 0.5) / 0.35))))
        paste(f, T_C2, W // 2, 1160, int(255 * min(1, max(0, (lt - 1.1) / 0.35))))

    elif t < E:  # D — la démo : le bouton Peppol sur la facture
        lt = t - D
        k = ease_out(lt / 0.35)
        paste(f, T_BTN, W // 2, 380, int(255 * min(1, lt / 0.3)))
        z = 1.0 + 0.06 * ease_io(lt / (E - D))
        pb = C_PEPPOL.resize((int(820 * z), int(C_PEPPOL.height * z)), Image.LANCZOS)
        paste(f, pb, W // 2, 780, int(255 * k))
        # halo vert qui pulse sur le bouton
        pulse = 0.5 + 0.5 * math.sin(lt * 4.0)
        ring(f, W // 2, 780, int((pb.width / 2) + 14), int((pb.height / 2) + 10), int(110 + 90 * pulse))
        paste(f, T_FORMAT, W // 2, 1130, int(255 * min(1, max(0, (lt - 2.2) / 0.4))))

    else:  # E — carte finale
        lt = t - E
        k = ease_out(lt / 0.4)
        paste(f, LOGO_IMG, W // 2, 560, int(255 * k))
        paste(f, T_URL, W // 2, 820, int(255 * min(1, max(0, (lt - 0.15) / 0.3))))
        paste(f, T_TRIAL, W // 2, 910, int(255 * min(1, max(0, (lt - 0.35) / 0.3))))
        paste(f, QR_IMG, W // 2, 1170, int(255 * min(1, max(0, (lt - 0.5) / 0.35))))
        paste(f, T_SCAN, W // 2, 1405, int(255 * min(1, max(0, (lt - 0.7) / 0.3))))
        paste(f, T_END, W // 2, 1480, int(200 * min(1, max(0, (lt - 0.9) / 0.4))))

    return f


def build_video(video_out: Path) -> None:
    total = int(DUR * FPS)
    cmd = [
        "ffmpeg", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", str(video_out),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(total):
        frame = render_frame(i / FPS)
        proc.stdin.write(frame.convert("RGB").tobytes())
        if i % 150 == 0:
            print(f"   frame {i}/{total}")
    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit("❌ ffmpeg a échoué")


def main() -> None:
    print("🎞️  Rendu…")
    with tempfile.TemporaryDirectory(prefix="p4-") as tmp:
        tmp_dir = Path(tmp)
        silent = tmp_dir / "video.mp4"
        build_video(silent)

        print("🎙️  Voix off…")
        voice = voiceover.synthesize(SCRIPT, voiceover.DEFAULT_VOICE, tmp_dir / "voice.mp3")
        captions = voiceover.captions_from_text(SCRIPT, voiceover.DEFAULT_VOICE)

        print("💬 Sous-titres…")
        subbed = burn_captions(silent, captions, tmp_dir / "sub.mp4", size=(W, H))

        print("🎵 Mixage + normalisation -14 LUFS…")
        mixed = tmp_dir / "mixed.mp4"
        mux_audio_with_music(subbed, MUSIC, mixed, voice_path=voice, music_volume=0.12,
                             voice_delay_ms=0)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(mixed), "-c:v", "copy",
             "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k",
             "-y", str(OUT)],
            check=True,
        )

    print(f"✅ {OUT} ({OUT.stat().st_size / 1e6:.1f} Mo)")


if __name__ == "__main__":
    main()
