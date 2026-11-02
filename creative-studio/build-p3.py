#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P3 « Le devis oublié » — montage punchy, 100 % faceless, 100 % réel.

Le visuel vient de la VRAIE app MonDevis (`mondevis/demo-video/ecran-brut.mov`) :
gros plan sur le Total TTC 4 356 €, tampon rouge « JAMAIS FACTURÉE », écran
Factures (0 envoyée / 2 brouillons), bouton « Présenter au client pour
signature ». Aucun visage, aucune photo de chantier : MonDevis ne parle que de
devis et de factures.

Sortie : output/p3-devis-oublie-v2.mp4 (1080x1920, 30 s, audio -14 LUFS).
Lancer depuis mondevis/creative-studio :  python3 build-p3.py
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
DUR = 28.0

BG = (10, 10, 20)
RED = (244, 63, 63)
WHITE = (255, 255, 255)
GREY = (165, 180, 252)
INDIGO = (99, 102, 241)

SRC = Path("/Users/macwdbsequoia/Desktop/dossier Freebuff/mondevis/demo-video")
FRAMES = Path("/tmp/p3src")
OUT = STUDIO_DIR / "output" / "p3-devis-oublie-v2.mp4"
MUSIC = STUDIO_DIR.parent / "audio" / "ambient_reel.mp3"
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

SCRIPT = (
    "Ce devis est signé. Je ne l'ai jamais facturé. "
    "Chaque année, les artisans laissent filer des milliers d'euros en devis oubliés : "
    "accepté à l'oral, jamais transformé en facture. "
    "Depuis que je fais mon devis sur mon téléphone, devant le client, "
    "il est signé avant même que je rentre à l'atelier. "
    "Ça s'appelle MonDevis. Tape mundedevis.eu, 14 jours gratuits."
).replace("mundedevis.eu", "mondedevis.eu")

# Scènes calées sur la voix off
A, B, C, D, E, F = 0.0, 2.0, 5.3, 11.0, 15.1, 18.8


def crop(name: str, box: tuple[float, float, float, float]) -> Image.Image:
    path = FRAMES / f"{name}.png"
    if not path.is_file():
        raise SystemExit(f"❌ image source manquante : {path} (extrait de ecran-brut.mov)")
    im = Image.open(path).convert("RGB")
    w, h = im.size
    return im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


# Découpes relevées sur la capture (fractions de l'image 2588 x 2254)
CARD_DEVIS = crop("f5", (0.02, 0.06, 0.98, 0.60))
CARD_TOTAL = crop("f5", (0.52, 0.485, 0.99, 0.60))
CARD_BOARD = crop("f120", (0.02, 0.08, 0.98, 0.55))
CARD_BTN = crop("f30", (0.50, 0.885, 0.90, 0.945))


def text_img(text: str, size: int, color=WHITE, font=FONT_BOLD, spacing: int = 0) -> Image.Image:
    f = ImageFont.truetype(font, size)
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    box = d.textbbox((0, 0), text, font=f)
    img = Image.new("RGBA", (box[2] - box[0] + 8, box[3] - box[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((4 - box[0], 4 - box[1]), text, font=f, fill=color)
    return img


def card(src: Image.Image, target_w: int, radius: int = 18) -> Image.Image:
    """Carte arrondie avec ombre douce, prête à être collée."""
    w = target_w
    h = round(src.height * w / src.width)
    body = src.resize((w, h), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    body.putalpha(mask)

    pad = 40
    shadow = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sh_mask = Image.new("L", shadow.size, 0)
    ImageDraw.Draw(sh_mask).rounded_rectangle(
        (pad, pad + 8, pad + w, pad + h + 8), radius, fill=170
    )
    sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(18))
    shadow.putalpha(sh_mask)
    shadow.alpha_composite(body, (pad, pad))
    return shadow


def paste(frame: Image.Image, img: Image.Image, cx: int, cy: int, alpha: int = 255) -> None:
    if alpha < 255:
        img = img.copy()
        a = img.getchannel("A").point(lambda v: v * alpha // 255)
        img.putalpha(a)
    frame.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def ease_io(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 0.5 - 0.5 * math.cos(math.pi * x)


# Cartes pré-rendues à leur taille d'affichage
C_DEVIS = card(CARD_DEVIS, 980)
C_BOARD = card(CARD_BOARD, 1010)
C_BTN = card(CARD_BTN, 1010)
C_TOTAL = card(CARD_TOTAL, 900, radius=12)

def qr_tile(url: str, size: int) -> Image.Image:
    """QR code sur tuile blanche arrondie (zone de silence = bordure du QR)."""
    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(10, 10, 20), back_color="white").convert("RGBA")
    img = img.resize((size, size), Image.NEAREST)  # NEAREST : garde les modules nets

    pad = 22
    tile = Image.new("RGBA", (size + pad * 2, size + pad * 2), (255, 255, 255, 255))
    mask = Image.new("L", tile.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.width - 1, tile.height - 1), 28, fill=255)
    tile.putalpha(mask)
    tile.alpha_composite(img, (pad, pad))
    return tile


STAMP = text_img("JAMAIS FACTURÉE", 74, RED, FONT_BLACK).rotate(-13, expand=True, resample=Image.BICUBIC)
_st_w, _st_h = STAMP.size
_box = Image.new("RGBA", (_st_w + 60, _st_h + 40), (0, 0, 0, 0))
_bd = ImageDraw.Draw(_box)
_bd.rounded_rectangle((6, 14, _st_w + 53, _st_h + 25), 14, outline=RED, width=7)
_box.alpha_composite(STAMP, (30, 20))
STAMP = _box

T_TAG = text_img("CE DEVIS EST SIGNÉ", 40, GREY)
T_BIG = text_img("4 356 €", 210, RED, FONT_BLACK)
T_SUB = text_img("JAMAIS FACTURÉE", 62, WHITE, FONT_BOLD)
T_HOOK = text_img("0 ENVOYÉE", 132, RED, FONT_BLACK)
T_HOOK2 = text_img("2 BROUILLONS", 62, WHITE, FONT_BOLD)
T_D = text_img("DEVIS FAIT DEVANT LE CLIENT", 52, WHITE)
T_E = text_img("SIGNÉ SUR PLACE", 96, WHITE, FONT_BLACK)
T_URL = text_img("mondedevis.eu", 96, WHITE, FONT_BLACK)
T_TRIAL = text_img("14 JOURS GRATUITS · SANS CARTE", 38, GREY)
T_END = text_img("Devis et factures, sur ton téléphone.", 40, (200, 205, 230))
T_SCAN = text_img("SCANNE POUR OUVRIR", 40, GREY)

# QR code de la carte finale : compense l'impossibilité d'avoir un lien cliquable
# dans la vidéo (TikTok/IG/FB/Shorts n'autorisent pas de lien cliquable en overlay).
QR_URL = "https://mondedevis.eu"
QR_SIZE = 330  # px : lisible après compression des plateformes
QR_IMG = qr_tile(QR_URL, QR_SIZE)

LOGO_IMG = Image.open(LOGO).convert("RGBA")
LOGO_IMG = LOGO_IMG.resize((210, round(LOGO_IMG.height * 210 / LOGO_IMG.width)), Image.LANCZOS)
# le PNG a un fond blanc : on l'insère dans une tuile arrondie, comme une icône d'app
_logo_tile = Image.new("RGBA", (LOGO_IMG.width + 56, LOGO_IMG.height + 56), (255, 255, 255, 245))
_mask = Image.new("L", _logo_tile.size, 0)
ImageDraw.Draw(_mask).rounded_rectangle((0, 0, _logo_tile.width - 1, _logo_tile.height - 1), 40, fill=255)
_logo_tile.putalpha(_mask)
_logo_tile.alpha_composite(LOGO_IMG, (28, 28))
LOGO_IMG = _logo_tile


def background() -> Image.Image:
    """Fond sombre avec un halo indigo discret (charte MonDevis)."""
    bg = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(glow)
    d.ellipse((-260, 240, 700, 1200), fill=(38, 32, 96))
    d.ellipse((520, 700, 1420, 1600), fill=(58, 22, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    return Image.blend(bg, glow, 0.55).convert("RGBA")


BG_IMG = background()


def render_frame(t: float) -> Image.Image:
    f = BG_IMG.copy()

    if t < B:  # A — le montant qui pique
        k = ease_out(t / 0.45)
        paste(f, T_TAG, W // 2, 210, int(255 * min(1, t / 0.3)))
        scale = 1.0 + 0.06 * ease_io(t / B)
        cd = C_DEVIS.resize((int(980 * scale), int(C_DEVIS.height * scale)), Image.LANCZOS)
        paste(f, cd, W // 2, 620, int(255 * k))
        pop = 1 + 0.35 * (1 - ease_out((t - 0.35) / 0.35))
        big = T_BIG.resize((int(T_BIG.width * pop), int(T_BIG.height * pop)), Image.LANCZOS)
        paste(f, big, W // 2, 1250, int(255 * min(1, max(0, (t - 0.35) / 0.3))))
        paste(f, T_SUB, W // 2, 1450, int(255 * min(1, max(0, (t - 0.75) / 0.3))))

    elif t < C:  # B — le tampon qui s'abat
        lt = t - B
        zoom = 1.12 + 0.04 * ease_io(lt / (C - B))
        cd = C_DEVIS.resize((int(980 * zoom), int(C_DEVIS.height * zoom)), Image.LANCZOS)
        paste(f, cd, W // 2, 900)
        # slam
        p = ease_out(lt / 0.22)
        sc = 2.2 - 1.4 * p  # 2.2 -> 0.8
        st = STAMP.resize((int(STAMP.width * sc), int(STAMP.height * sc)), Image.LANCZOS)
        shake = 0
        if lt < 0.30:
            amp = 26 * (1 - lt / 0.30)
            shake = int(random.uniform(-amp, amp))
        paste(f, st, W // 2 + shake, 880 + int(random.uniform(-6, 6)) if lt < 0.3 else 880, 235)

    elif t < D:  # C — l'écran Factures : 0 envoyée
        lt = t - C
        k = ease_out(lt / 0.35)
        z = 1 + 0.05 * ease_io(lt / (D - C))
        cb = C_BOARD.resize((int(1010 * z), int(C_BOARD.height * z)), Image.LANCZOS)
        paste(f, cb, W // 2, 860, int(255 * k))
        paste(f, T_HOOK, W // 2, 250, int(255 * min(1, lt / 0.25)))
        paste(f, T_HOOK2, W // 2, 380, int(255 * min(1, max(0, (lt - 0.2) / 0.25))))

    elif t < E:  # D — le devis fait devant le client
        lt = t - D
        zoom = 1.06 - 0.06 * ease_io(lt / (E - D))
        cd = C_DEVIS.resize((int(1040 * zoom), int(C_DEVIS.height * zoom)), Image.LANCZOS)
        paste(f, cd, W // 2, 800)
        paste(f, T_D, W // 2, 1330, int(255 * min(1, lt / 0.3)))

    elif t < F:  # E — signature
        lt = t - E
        zoom = 1.0 + 0.10 * ease_io(lt / (F - E))
        cb = C_BTN.resize((int(900 * zoom), int(C_BTN.height * zoom)), Image.LANCZOS)
        paste(f, cb, W // 2, 1000)
        paste(f, T_E, W // 2, 680, int(255 * min(1, lt / 0.25)))

    else:  # F — carte finale (titre, lien, QR code)
        lt = t - F
        k = ease_out(lt / 0.4)
        paste(f, LOGO_IMG, W // 2, 600, int(255 * k))
        paste(f, T_URL, W // 2, 860, int(255 * min(1, max(0, (lt - 0.15) / 0.3))))
        paste(f, T_TRIAL, W // 2, 950, int(255 * min(1, max(0, (lt - 0.35) / 0.3))))
        # QR affiché tôt pour laisser ~9 s de scan
        paste(f, QR_IMG, W // 2, 1200, int(255 * min(1, max(0, (lt - 0.5) / 0.35))))
        paste(f, T_SCAN, W // 2, 1435, int(255 * min(1, max(0, (lt - 0.7) / 0.3))))
        paste(f, T_END, W // 2, 1510, int(200 * min(1, max(0, (lt - 0.9) / 0.4))))

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
    print("🎞️  Rendu des 30 s (900 frames)…")
    with tempfile.TemporaryDirectory(prefix="p3-") as tmp:
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
        # voice_delay_ms=0 : les sous-titres sont calés sur l'horodatage de la voix
        # (edge-tts). Le défaut du mixeur (400 ms) les faisait apparaître en avance.
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
