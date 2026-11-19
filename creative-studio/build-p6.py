#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P6 « Ta facture Peppol en 30 secondes » — faceless, 100 % réel, ~26 s.

Angle : la démo. On montre le geste, pas la douleur. Trois étapes, chrono
mental, CTA dans la vidéo (pas seulement en bio — 0 vue de profil sur TikTok).

  1. le devis est accepté      → écran Devis DEV-BE-2026-0001
  2. transformer en facture    → écran Facture FAC-BE-2026-0002 (brouillon)
  3. cliquer « Envoyer via Peppol (B2B) » → le vrai bouton vert de l'app

Tous les écrans viennent de `demo-video/ecran-brut.mov` (capture réelle de
l'app) : aucun faux écran, aucun badge inventé. La vidéo ne prétend pas que
l'envoi a eu lieu — elle montre **le geste** qui déclenche l'envoi.

⚠️ La capture est un écran **d'ordinateur**, pas de téléphone : la voix ne dit
donc jamais « depuis ton téléphone ». Pour la version mobile, il faut une
capture d'écran de GSM (voir le pack de publication).

Sortie : output/p6-30secondes.mp4 (1080x1920, 30 fps)
         audio mesuré : ~-16,8 LUFS · crête -1,3 dBTP (loudnorm 2 passes —
         le limiteur de crête empêche d'atteindre -14 sur cette voix)
         output/cover-p6.png

Lancer depuis mondevis/creative-studio :  python3 build-p6.py
"""

from __future__ import annotations

import json
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

BG = (10, 10, 20)
RED = (244, 63, 63)
WHITE = (255, 255, 255)
GREY = (165, 180, 252)
GREEN = (22, 163, 74)
GREEN_LIGHT = (74, 222, 128)

MOV = STUDIO_DIR.parent / "demo-video" / "ecran-brut.mov"
SRC = STUDIO_DIR / "output" / "p6src"
OUT = STUDIO_DIR / "output" / "p6-30secondes.mp4"
COVER = STUDIO_DIR / "output" / "cover-p6.png"
MUSIC = STUDIO_DIR.parent / "audio" / "ambient_reel.mp3"
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

SCRIPT = (
    "Trente secondes pour envoyer ta facture Peppol. "
    "Un : le devis est accepté. "
    "Deux : tu le transformes en facture. "
    "Trois : tu cliques sur Envoyer via Peppol. "
    "Elle part au format obligatoire, sans rien installer. "
    "Tape mondedevis.eu."
)

# Écran source : (instant dans la capture, crop w/h/x/y)
CROPS = {
    "devis": (6, (1800, 490, 480, 150)),
    "facture": (108, (1800, 550, 480, 150)),
    "peppol": (102, (1045, 119, 416, 1862)),
    "liste": (114, (1900, 1000, 400, 150)),
}


# --------------------------------------------------------------------------
# Outils de composition (identiques aux builds P4 / P5)
# --------------------------------------------------------------------------
def text_img(text: str, size: int, color=WHITE, font=FONT_BOLD) -> Image.Image:
    f = ImageFont.truetype(font, size)
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    box = d.textbbox((0, 0), text, font=f)
    im = Image.new("RGBA", (box[2] - box[0] + 8, box[3] - box[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - box[0], 4 - box[1]), text, font=f, fill=color)
    return im


def card(src: Image.Image, target_w: int, radius: int = 18) -> Image.Image:
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


def ensure_assets() -> None:
    """Extrait les écrans de l'app depuis la capture brute (une seule fois)."""
    SRC.mkdir(parents=True, exist_ok=True)
    if not MOV.is_file():
        raise SystemExit(f"❌ capture source manquante : {MOV}")
    for name, (t, (w, h, x, y)) in CROPS.items():
        out = SRC / f"{name}.png"
        if out.is_file():
            continue
        print(f"   extraction {name} → t={t}s crop={w}x{h}+{x}+{y}")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(MOV),
             "-vf", f"crop={w}:{h}:{x}:{y}", "-frames:v", "1", "-y", str(out)],
            check=True,
        )


def shot(name: str) -> Image.Image:
    path = SRC / f"{name}.png"
    if not path.is_file():
        raise SystemExit(f"❌ écran source manquant : {path}")
    return Image.open(path).convert("RGB")


def background() -> Image.Image:
    bg = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(glow)
    d.ellipse((-260, 240, 700, 1200), fill=(20, 46, 100))
    d.ellipse((520, 760, 1420, 1660), fill=(20, 70, 50))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    return Image.blend(bg, glow, 0.55).convert("RGBA")


def number_badge(num: str, size: int = 170) -> Image.Image:
    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rounded_rectangle((0, 0, size - 1, size - 1), 42, fill=GREEN + (255,))
    glyph = text_img(num, int(size * 0.72), WHITE, FONT_BLACK)
    tile.alpha_composite(glyph, ((size - glyph.width) // 2, (size - glyph.height) // 2))
    return tile.rotate(-6, expand=True, resample=Image.BICUBIC)


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


# --------------------------------------------------------------------------
# Assets
# --------------------------------------------------------------------------
ensure_assets()

C_DEVIS = card(shot("devis"), 1000)
C_FACTURE = card(shot("facture"), 1000)
C_PEPPOL = card(shot("peppol"), 900, radius=16)
C_LISTE = card(shot("liste"), 1020)

B_1 = number_badge("1")
B_2 = number_badge("2")
B_3 = number_badge("3")

T_STEP = text_img("ÉTAPE", 40, GREY, FONT_BOLD)

# Hook
T_H_30 = text_img("30", 400, WHITE, FONT_BLACK)
T_H_SEC = text_img("SECONDES", 118, GREEN_LIGHT, FONT_BLACK)
T_H_L1 = text_img("POUR ENVOYER", 54, GREY, FONT_BOLD)
T_H_L2 = text_img("TA FACTURE PEPPOL", 58, WHITE, FONT_BOLD)
T_H_L3 = text_img("EN 3 CLICS", 56, GREY, FONT_BOLD)

# Étapes
E1_A = text_img("LE DEVIS EST", 60, WHITE, FONT_BLACK)
E1_B = text_img("ACCEPTÉ", 60, GREEN_LIGHT, FONT_BLACK)
E1_C = text_img("il n'attend plus que sa facture", 40, GREY, FONT_BOLD)

E2_A = text_img("TU LE TRANSFORMES", 52, WHITE, FONT_BLACK)
E2_B = text_img("EN FACTURE", 60, GREEN_LIGHT, FONT_BLACK)
E2_C = text_img("un bouton, rien à ressaisir", 40, GREY, FONT_BOLD)

E3_A = text_img("TU CLIQUES SUR", 54, WHITE, FONT_BLACK)
E3_B = text_img("ENVOYER VIA PEPPOL", 54, GREEN_LIGHT, FONT_BLACK)
E3_C = text_img("le bouton vert de l'app", 40, GREY, FONT_BOLD)

# Résultat
R_A = text_img("ELLE PART", 62, WHITE, FONT_BLACK)
R_B = text_img("AU FORMAT OBLIGATOIRE", 52, GREEN_LIGHT, FONT_BLACK)
R_C = text_img("sans rien installer", 40, GREY, FONT_BOLD)

# Carte finale
T_URL = text_img("mondedevis.eu", 96, WHITE, FONT_BLACK)
T_TRIAL = text_img("14 JOURS GRATUITS · SANS CARTE", 38, GREY, FONT_BOLD)
T_SCAN = text_img("SCANNE POUR OUVRIR", 40, GREY, FONT_BOLD)
T_END = text_img("Devis et factures, sur ton téléphone.", 40, (200, 205, 230))

QR_IMG = qr_tile("https://mondedevis.eu", 330)

LOGO_IMG = Image.open(LOGO).convert("RGBA")
LOGO_IMG = LOGO_IMG.resize((210, round(LOGO_IMG.height * 210 / LOGO_IMG.width)), Image.LANCZOS)
_logo_tile = Image.new("RGBA", (LOGO_IMG.width + 56, LOGO_IMG.height + 56), (255, 255, 255, 245))
_mask = Image.new("L", _logo_tile.size, 0)
ImageDraw.Draw(_mask).rounded_rectangle(
    (0, 0, _logo_tile.width - 1, _logo_tile.height - 1), 40, fill=255
)
_logo_tile.putalpha(_mask)
_logo_tile.alpha_composite(LOGO_IMG, (28, 28))
LOGO_IMG = _logo_tile

BG_IMG = background()

# Bornes de scènes (recalculées d'après la voix) : A=hook, B/C/D=étapes, E=résultat, F=fin
A, B, C, D, E, F, DUR = 0.0, 3.6, 8.6, 13.6, 18.6, 21.6, 24.0


def dots(frame: Image.Image, active: int, alpha: int = 255) -> None:
    w, h, gap = 96, 10, 18
    total = 3 * w + 2 * gap
    x = (W - total) // 2
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(3):
        color = GREEN_LIGHT + (alpha,) if i < active else (255, 255, 255, alpha // 4)
        d.rounded_rectangle((x + i * (w + gap), 150, x + i * (w + gap) + w, 150 + h), 5, fill=color)
    frame.alpha_composite(layer)


def step_scene(
    f: Image.Image,
    lt: float,
    badge: Image.Image,
    line_a: Image.Image,
    line_b: Image.Image,
    line_c: Image.Image,
    panel: Image.Image,
    active: int,
    panel_y: int = 1120,
) -> None:
    dots(f, active)
    k = ease_out(lt / 0.28)
    sc = 1.28 - 0.28 * k
    b = badge.resize((int(badge.width * sc), int(badge.height * sc)), Image.LANCZOS)
    paste(f, b, W // 2, 330, int(255 * k))
    paste(f, T_STEP, W // 2, 200, int(255 * min(1, lt / 0.2)))
    paste(f, line_a, W // 2, 555, int(255 * min(1, max(0, (lt - 0.1) / 0.25))))
    paste(f, line_b, W // 2, 630, int(255 * min(1, max(0, (lt - 0.2) / 0.25))))
    paste(f, line_c, W // 2, 715, int(255 * min(1, max(0, (lt - 0.45) / 0.25))))
    z = 1 + 0.03 * ease_io(lt / 4.5)
    sh = panel.resize((int(panel.width * z), int(panel.height * z)), Image.LANCZOS)
    paste(f, sh, W // 2, panel_y, int(255 * ease_out(max(0.0, (lt - 0.15)) / 0.35)))


def render_frame(t: float) -> Image.Image:
    f = BG_IMG.copy()

    if t < B:  # hook — mouvement dès la frame 0
        k = ease_out(t / 0.22)
        sc = 1.30 - 0.30 * k
        g = T_H_30.resize((int(T_H_30.width * sc), int(T_H_30.height * sc)), Image.LANCZOS)
        shake = int(random.uniform(-14, 14)) if t < 0.22 else 0
        paste(f, g, W // 2 + shake, 600)
        paste(f, T_H_SEC, W // 2, 860, int(255 * min(1, t / 0.12)))
        paste(f, T_H_L1, W // 2, 990, int(255 * min(1, max(0, (t - 0.18) / 0.2))))
        paste(f, T_H_L2, W // 2, 1060, int(255 * min(1, max(0, (t - 0.25) / 0.2))))
        paste(f, T_H_L3, W // 2, 1160, int(255 * min(1, max(0, (t - 0.45) / 0.25))))

    elif t < C:  # étape 1 — le devis est accepté
        step_scene(f, t - B, B_1, E1_A, E1_B, E1_C, C_DEVIS, 1)

    elif t < D:  # étape 2 — transformer en facture
        step_scene(f, t - C, B_2, E2_A, E2_B, E2_C, C_FACTURE, 2)

    elif t < E:  # étape 3 — le bouton Peppol
        lt = t - D
        dots(f, 3)
        paste(f, T_STEP, W // 2, 200, int(255 * min(1, lt / 0.2)))
        k = ease_out(lt / 0.28)
        sc = 1.28 - 0.28 * k
        b = B_3.resize((int(B_3.width * sc), int(B_3.height * sc)), Image.LANCZOS)
        paste(f, b, W // 2, 330, int(255 * k))
        paste(f, E3_A, W // 2, 555, int(255 * min(1, max(0, (lt - 0.1) / 0.25))))
        paste(f, E3_B, W // 2, 630, int(255 * min(1, max(0, (lt - 0.2) / 0.25))))
        paste(f, E3_C, W // 2, 715, int(255 * min(1, max(0, (lt - 0.45) / 0.25))))
        k = ease_out(lt / 0.3)
        z = 1.0 + 0.04 * ease_io(lt / (E - D))
        pb = C_PEPPOL.resize((int(900 * z), int(C_PEPPOL.height * z)), Image.LANCZOS)
        paste(f, pb, W // 2, 1080, int(255 * k))
        pulse = 0.5 + 0.5 * math.sin(lt * 4.2)
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ring).rounded_rectangle(
            (
                W // 2 - pb.width // 2 - 16,
                1080 - pb.height // 2 - 12,
                W // 2 + pb.width // 2 + 16,
                1080 + pb.height // 2 + 12,
            ),
            30,
            outline=GREEN_LIGHT + (int(110 + 90 * pulse),),
            width=8,
        )
        f.alpha_composite(ring)

    elif t < F:  # résultat
        lt = t - E
        dots(f, 3)
        paste(f, R_A, W // 2, 330, int(255 * min(1, lt / 0.25)))
        paste(f, R_B, W // 2, 420, int(255 * min(1, max(0, (lt - 0.1) / 0.3))))
        paste(f, R_C, W // 2, 505, int(255 * min(1, max(0, (lt - 0.4) / 0.3))))
        z = 1 + 0.02 * ease_io(lt / (F - E))
        sh = C_LISTE.resize((int(C_LISTE.width * z), int(C_LISTE.height * z)), Image.LANCZOS)
        paste(f, sh, W // 2, 1120, int(255 * ease_out(lt / 0.35)))

    else:  # carte finale
        lt = t - F
        k = ease_out(lt / 0.4)
        paste(f, LOGO_IMG, W // 2, 560, int(255 * k))
        paste(f, T_URL, W // 2, 820, int(255 * min(1, max(0, (lt - 0.1) / 0.3))))
        paste(f, T_TRIAL, W // 2, 910, int(255 * min(1, max(0, (lt - 0.3) / 0.3))))
        paste(f, QR_IMG, W // 2, 1170, int(255 * min(1, max(0, (lt - 0.4) / 0.35))))
        paste(f, T_SCAN, W // 2, 1405, int(255 * min(1, max(0, (lt - 0.6) / 0.3))))
        paste(f, T_END, W // 2, 1480, int(200 * min(1, max(0, (lt - 0.8) / 0.4))))

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


def _norm(word: str) -> str:
    return "".join(ch for ch in word.lower() if ch.isalpha())


def marks_from_voice(words: list[tuple[int, int, str]]) -> dict[str, float]:
    """Déduit les bornes de scènes des mots réellement prononcés."""
    norm = [_norm(w[2]) for w in words]

    def find(target: str, start: int = 0) -> float:
        for i in range(start, len(norm)):
            if norm[i] == target:
                return words[i][0] / 1000.0
        return -1.0

    i_un = find("un")
    i_deux = find("deux", max(0, int(i_un)))
    i_trois = find("trois", max(0, int(i_deux)))
    i_part = find("part", max(0, int(i_trois)))
    i_tape = find("tape", max(0, int(i_part)))

    for name, v in (("un", i_un), ("deux", i_deux), ("trois", i_trois),
                    ("part", i_part), ("tape", i_tape)):
        if v < 0:
            raise SystemExit(f"❌ repère de voix introuvable : {name}")

    return {"un": i_un, "deux": i_deux, "trois": i_trois, "part": i_part, "tape": i_tape}


def main() -> None:
    global A, B, C, D, E, F, DUR

    print("🖼️  Écrans de l'app…")
    ensure_assets()

    with tempfile.TemporaryDirectory(prefix="p6-") as tmp:
        tmp_dir = Path(tmp)

        print("🎙️  Voix off…")
        voice = voiceover.synthesize(SCRIPT, voiceover.DEFAULT_VOICE, tmp_dir / "voice.mp3")
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(voice)],
            capture_output=True, text=True, check=True,
        )
        voice_dur = float(probe.stdout.strip())
        words = voiceover._word_boundaries(SCRIPT, voiceover.DEFAULT_VOICE)  # noqa: SLF001
        m = marks_from_voice(words)
        print("   durée voix :", round(voice_dur, 2), "s · repères :",
              {k: round(v, 2) for k, v in m.items()})

        A = 0.0
        B = max(2.2, m["un"] - 0.10)
        C = max(B + 3.6, m["deux"] - 0.10)
        D = max(C + 3.6, m["trois"] - 0.10)
        E = max(D + 3.6, m["part"] - 0.12)
        F = max(E + 2.4, m["tape"] - 0.25)
        DUR = round(max(F + 3.4, voice_dur + 1.1), 2)
        print(f"   scènes : hook {A:.2f} · 1 {B:.2f} · 2 {C:.2f} · 3 {D:.2f} ·"
              f" résultat {E:.2f} · fin {F:.2f} · total {DUR:.2f}")

        print("🎞️  Rendu…")
        silent = tmp_dir / "video.mp4"
        build_video(silent)

        print("💬 Sous-titres…")
        captions = voiceover.captions_from_text(SCRIPT, voiceover.DEFAULT_VOICE)
        subbed = burn_captions(silent, captions, tmp_dir / "sub.mp4", size=(W, H))

        print("🎵 Mixage + normalisation loudnorm (2 passes)…")
        mixed = tmp_dir / "mixed.mp4"
        mux_audio_with_music(subbed, MUSIC, mixed, voice_path=voice, music_volume=0.12,
                             voice_delay_ms=0)

        # 1ʳᵉ passe : on mesure le mix réel (voix + musique) au lieu de supposer.
        measure = subprocess.run(
            ["ffmpeg", "-i", str(mixed), "-af",
             "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
             "-f", "null", "-"],
            capture_output=True, text=True,
        )
        err = measure.stderr
        try:
            meas = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
            filt = (
                "loudnorm=I=-14:TP=-1.5:LRA=11:"
                f"measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
                f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
                "linear=true:print_format=summary"
            )
            print("   mesure :", meas["input_i"], "LUFS ·", meas["input_tp"], "dBTP")
        except (ValueError, KeyError):
            print("   ⚠️ mesure loudnorm illisible → passe unique")
            filt = "loudnorm=I=-14:TP=-1.5:LRA=11"

        # 2ᵉ passe : application avec les valeurs mesurées.
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(mixed), "-c:v", "copy",
             "-af", filt, "-c:a", "aac", "-b:a", "192k", "-y", str(OUT)],
            check=True,
        )

        print("🖼️  Couverture…")
        render_frame(1.0).convert("RGB").save(COVER)

    print(f"✅ {OUT} ({OUT.stat().st_size / 1e6:.1f} Mo)")
    print(f"✅ {COVER}")


if __name__ == "__main__":
    main()
