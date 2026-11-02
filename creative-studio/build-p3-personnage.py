#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P3 bis — variante « personnage » : l'artisan en pantalon de travail, sur son
chantier, signe son devis sur le téléphone (app MonDevis).

Mise en page choisie le 02/11 (demande de Jo) : le titre et le lien sont posés
**en haut de l'image**, dans la zone vide (mur/plafond), pour ne jamais couper
le personnage. Dégradé sombre en haut pour la lisibilité, sous-titres en bas.

Image de base : `output/scene-artisan-2.png` (prise 2, choisie par Jo le 02/11 :
le personnage tient son téléphone et le montre du doigt, bouche bien dégagée).
Les lèvres bougent : `output/p3-personnage-lips.mp4` (Wav2Lip, voir
`lipsync-p3.py`) fournit les images, le montage se contente de les habiller.
Sortie : output/p3-personnage.mp4 (1080x1920, 28 s, -14 LUFS).
Lancer depuis mondevis/creative-studio :  python3 build-p3-personnage.py
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont

STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

from studio import voiceover  # noqa: E402
from studio.video import burn_captions, mux_audio_with_music  # noqa: E402

W, H = 1080, 1920
FPS = 30
DUR = 28

SCENE = STUDIO_DIR / "output" / "scene-artisan-bouche-fermee.png"
LIPS = STUDIO_DIR / "output" / "p3-personnage-lips.mp4"  # produit par lipsync-p3.py
VOICE = STUDIO_DIR / "output" / "p3-voix.mp3"            # voix utilisée par le lip-sync
OUT = STUDIO_DIR / "output" / "p3-personnage.mp4"
MUSIC = STUDIO_DIR.parent / "audio" / "ambient_reel.mp3"
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"

WATERMARK_CROP = 80  # le filigrane du générateur vit dans les 80 px du bas
HEADLINE = "IL SIGNE SON DEVIS"
CTA = "mondedevis.eu"

# QR code affiché sur la fin (aucune plateforme n'accepte de lien cliquable
# incrusté dans la vidéo) : placé juste SOUS le smartphone (~1 cm), dans la
# zone mur libre — jamais sur le personnage ni sur le téléphone.
QR_URL = "https://mondedevis.eu"
QR_SIZE = 220          # réduit le 02/11 (250 -> 220, demande de Jo)
QR_Y = 590             # à hauteur du téléphone, dans le vide à sa gauche
QR_CENTER_X = 200      # fond de chantier libre : ni le personnage ni l'écran
QR_START = 19.3

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

SCRIPT = (
    "Ce devis est signé. Je ne l'ai jamais facturé. "
    "Chaque année, les artisans laissent filer des milliers d'euros en devis oubliés : "
    "accepté à l'oral, jamais transformé en facture. "
    "Depuis que je fais mon devis sur mon téléphone, devant le client, "
    "il est signé avant même que je rentre à l'atelier. "
    "Ça s'appelle MonDevis. Tape mondedevis.eu, 14 jours gratuits."
)


def text_img(text: str, size: int, color=(255, 255, 255), font=FONT_BLACK) -> Image.Image:
    f = ImageFont.truetype(font, size)
    tmp = Image.new("RGBA", (10, 10))
    box = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=f)
    img = Image.new("RGBA", (box[2] - box[0] + 12, box[3] - box[1] + 12), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((6 - box[0], 6 - box[1]), text, font=f, fill=color)
    return img


def pill(text: str, size: int = 40, pad_x: int = 40, pad_y: int = 20) -> Image.Image:
    f = ImageFont.truetype(FONT_BOLD, size)
    tw = ImageDraw.Draw(Image.new("RGBA", (10, 10))).textbbox((0, 0), text, font=f)
    w, h = tw[2] - tw[0] + pad_x * 2, tw[3] - tw[1] + pad_y * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=(99, 102, 241, 255))
    d.text((pad_x - tw[0], pad_y - tw[1]), text, font=f, fill=(255, 255, 255, 255))
    return img


def base_at(t: float, frame) -> Image.Image:
    """Cadre 1080x1920 : image lip-sync recadrée (filigrane retiré) + zoom lent."""
    img = STILL.copy() if frame is None else Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    img = img.crop((0, 0, img.width, img.height - WATERMARK_CROP))

    z = 1.0 + 0.07 * (t / DUR)  # zoom lent centré (1.00 -> 1.07)
    scale = max(W / img.width, H / img.height) * z
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (img.width - W) // 2
    top = (img.height - H) // 2
    return img.crop((left, top, left + W, top + H))


STILL = Image.open(SCENE).convert("RGB")

# Dégradé haut : garantit la lisibilité du titre sur un mur clair
TOP_GRAD = Image.new("RGBA", (W, 520), (0, 0, 0, 0))
_gd = ImageDraw.Draw(TOP_GRAD)
for y in range(520):
    _gd.line([(0, y), (W, y)], fill=(0, 0, 0, int(190 * (1 - y / 520) ** 1.6)))

def qr_tile(url: str, size: int, caption: str = "") -> Image.Image:
    """Carte blanche arrondie : QR + légende sombre dessous (bordure = zone de silence)."""
    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(10, 10, 20), back_color="white").convert("RGBA")
    img = img.resize((size, size), Image.NEAREST)  # NEAREST : modules nets

    pad = 18
    font = ImageFont.truetype(FONT_BOLD, 26)
    box = ImageDraw.Draw(Image.new("RGBA", (10, 10))).textbbox((0, 0), caption, font=font) if caption else (0, 0, 0, 0)
    cap_w = box[2] - box[0] if caption else 0
    cap_h = (box[3] - box[1]) + 14 if caption else 0

    tile_w = max(size + pad * 2, cap_w + pad * 2)
    tile = Image.new("RGBA", (tile_w, pad + size + cap_h + pad), (255, 255, 255, 255))
    mask = Image.new("L", tile.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.width - 1, tile.height - 1), 22, fill=255)
    tile.putalpha(mask)
    tile.alpha_composite(img, ((tile_w - size) // 2, pad))
    if caption:
        d = ImageDraw.Draw(tile)
        d.text(((tile_w - cap_w) // 2 - box[0], pad + size + 10 - box[1]),
               caption, font=font, fill=(10, 10, 20, 255))
    return tile


TITLE = text_img(HEADLINE, 62, (255, 255, 255), FONT_BLACK)
QR_IMG = qr_tile(QR_URL, QR_SIZE, "SCANNE POUR OUVRIR")
QR_X = QR_CENTER_X - QR_IMG.width // 2
CTA_PILL = pill(CTA)
LOGO_IMG = Image.open(LOGO).convert("RGBA")
LOGO_IMG = LOGO_IMG.resize((110, round(LOGO_IMG.height * 110 / LOGO_IMG.width)), Image.LANCZOS)
_tile = Image.new("RGBA", (LOGO_IMG.width + 24, LOGO_IMG.height + 24), (255, 255, 255, 235))
_m = Image.new("L", _tile.size, 0)
ImageDraw.Draw(_m).rounded_rectangle((0, 0, _tile.width - 1, _tile.height - 1), 20, fill=255)
_tile.putalpha(_m)
_tile.alpha_composite(LOGO_IMG, (12, 12))
LOGO_IMG = _tile


def frame_at(t: float, frame=None) -> Image.Image:
    f = base_at(t, frame).convert("RGBA")

    f.alpha_composite(TOP_GRAD, (0, 0))

    # titre + lien en haut, centrés, au-dessus de la tête
    f.alpha_composite(TITLE, ((W - TITLE.width) // 2, 60))
    f.alpha_composite(CTA_PILL, ((W - CTA_PILL.width) // 2, 150))

    f.alpha_composite(LOGO_IMG, (W - LOGO_IMG.width - 46, H - LOGO_IMG.height - 46))

    # QR en fin de vidéo (fondu d'apparition sur 0,35 s)
    a = min(1.0, max(0.0, (t - QR_START) / 0.35))
    if a > 0:
        qr = QR_IMG.copy()
        qr.putalpha(qr.getchannel("A").point(lambda v: int(v * a)))
        f.alpha_composite(qr, (QR_X, QR_Y))
    return f


def build_video(silent: Path) -> None:
    total = int(DUR * FPS)
    cmd = [
        "ffmpeg", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", str(silent),
    ]
    cap = cv2.VideoCapture(str(LIPS)) if LIPS.is_file() else None
    if cap is None:
        print("   ⚠️  pas de lip-sync : image fixe (lancer lipsync-p3.py pour animer)")
    else:
        print(f"   👄 lip-sync : {LIPS.name}")

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    last = None
    for i in range(total):
        frame = None
        if cap is not None:
            ok, frame = cap.read()
            if not ok or frame is None:
                frame = last  # fin de piste : on tient la dernière image
            else:
                last = frame
        proc.stdin.write(frame_at(i / FPS, frame).convert("RGB").tobytes())
        if i % 200 == 0:
            print(f"   frame {i}/{total}")
    if cap is not None:
        cap.release()
    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit("❌ ffmpeg a échoué")


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="p3p-") as tmp:
        tmp_dir = Path(tmp)

        print("🎞️  Rendu (zoom lent + titre en haut)…")
        silent = tmp_dir / "video.mp4"
        build_video(silent)

        # Voix : on réutilise le fichier qui a servi au lip-sync (sinon la bouche
        # ne serait plus synchro). On ne re-synthétise que s'il n'existe pas.
        if VOICE.is_file():
            print(f"🎙️  Voix off : {VOICE.name} (celle du lip-sync)")
            voice = VOICE
        else:
            print("🎙️  Voix off (nouvelle synthèse)…")
            voice = voiceover.synthesize(SCRIPT, voiceover.DEFAULT_VOICE, VOICE)
        captions = voiceover.captions_from_text(SCRIPT, voiceover.DEFAULT_VOICE)

        print("💬 Sous-titres…")
        subbed = burn_captions(silent, captions, tmp_dir / "sub.mp4", size=(W, H))

        print("🎵 Mixage + normalisation -14 LUFS…")
        mixed = tmp_dir / "mixed.mp4"
        # voice_delay_ms=0 IMPÉRATIF : Wav2Lip a calé la bouche sur une voix qui
        # démarre à 0. Le défaut du mixeur (400 ms) décalait la bouche vers
        # l'avant (« les lèvres vont plus vite que le texte », constaté le 02/11).
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
