#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P7 « Ton client te demande encore la facture par mail » — faceless, ~22 s.

Angle : le **client**, pas l'artisan. P4/P5/P6 expliquaient la règle Peppol ;
P7 montre le blocage réel : le client réclame un PDF par mail, alors qu'entre
entreprises belges la facture passe par Peppol.

C'est aussi la 1ʳᵉ vidéo dont le CTA produit un **contact** (le seul chiffre
jamais bougé : 401 vues sur P5, 5 interactions, **0 DM**). Le CTA n'est pas
« lien en bio » mais un **mot-clé en message** : PEPPOL → réponse en DM avec le
texte prêt à envoyer au client (modèle dans `PUBLIER-P7-2026-11-12.md`).

Écrans de l'app : extraits de `demo-video/ecran-brut.mov` (capture réelle),
mêmes crops que P6 — aucun faux écran. La carte « mail » est un **graphique
illustratif** : elle représente la demande du client, pas l'app.

Voix : edge-tts (`fr-BE-GerardNeural`, la voix des P1-P6). Si le service est
injoignable, le script bascule sur la voix locale macOS (`say`, fr_FR) et sort
un fichier **-preview** — la version de travail, pas la version à publier.

Sortie : output/p7-facture-mail.mp4 (1080x1920, 30 fps)
         output/cover-p7.png

Lancer depuis mondevis/creative-studio :
    python3 build-p7.py            # edge-tts (voix de la marque)
    python3 build-p7.py --say      # voix locale, sortie *-preview.mp4
"""

from __future__ import annotations

import sys
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

from studio.video import burn_captions, mux_audio_with_music  # noqa: E402

W, H = 1080, 1920
FPS = 30

BG = (10, 10, 20)
RED = (244, 63, 63)
WHITE = (255, 255, 255)
GREY = (165, 180, 252)
GREEN = (22, 163, 74)
GREEN_LIGHT = (74, 222, 128)

USE_SAY = "--say" in sys.argv

MOV = STUDIO_DIR.parent / "demo-video" / "ecran-brut.mov"
SRC = STUDIO_DIR / "output" / "p7src"
NAME = "p7-facture-mail-preview" if USE_SAY else "p7-facture-mail"
OUT = STUDIO_DIR / "output" / f"{NAME}.mp4"
COVER = STUDIO_DIR / "output" / "cover-p7.png"
MUSIC = STUDIO_DIR.parent / "audio" / "ambient_reel.mp3"
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

# Une phrase = une scène. Le découpage pilote à la fois la voix et l'image :
# les bornes de scènes sont les débuts réels de chaque segment audio.
SEGMENTS = [
    "Ton client te demande encore la facture par mail.",
    "Depuis janvier, entre entreprises, un PDF ne suffit plus : "
    "il faut passer par Peppol.",
    "Avec MonDevis, tu prépares ta facture une fois,",
    "et elle part au bon format.",
    "Envoie-moi PEPPOL en message : "
    "je t'envoie le texte à envoyer à ton client.",
]

SEG_GAP = 0.22  # silence entre deux phrases

# Écran source : (instant dans la capture, crop w/h/x/y) — identiques à P6.
CROPS = {
    "devis": (6, (1800, 490, 480, 150)),
    "facture": (108, (1800, 550, 480, 150)),
    "peppol": (102, (1045, 119, 416, 1862)),
    "liste": (114, (1900, 1000, 400, 150)),
}


# --------------------------------------------------------------------------
# Outils de composition (identiques aux builds P4 / P5 / P6)
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
    return 0.5 - 0.5 * math_cos(x)


def math_cos(x: float) -> float:
    import math

    return math.cos(3.141592653589793 * x)


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


def chip(text: str, bg=(236, 239, 250), fg=(70, 80, 110), size: int = 34,
         pad_x: int = 26, pad_y: int = 14, radius: int = 18) -> Image.Image:
    label = text_img(text, size, fg, FONT_BOLD)
    tile = Image.new("RGBA", (label.width + pad_x * 2, label.height + pad_y * 2), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle(
        (0, 0, tile.width - 1, tile.height - 1), radius, fill=bg + (255,)
    )
    tile.alpha_composite(label, (pad_x, pad_y))
    return tile


def mail_card() -> Image.Image:
    """Graphique illustratif : la demande du client (pas une capture d'app)."""
    w, h = 980, 470
    tile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 34, fill=(255, 255, 255, 255))
    d.rounded_rectangle((0, 0, w - 1, 92), 34, fill=(232, 236, 250, 255))
    d.rectangle((0, 58, w - 1, 92), fill=(232, 236, 250, 255))

    head = text_img("TON CLIENT", 32, (108, 118, 152), FONT_BOLD)
    tile.alpha_composite(head, (40, 30))

    q1 = text_img("« Envoie-moi la facture", 52, (24, 26, 40), FONT_BOLD)
    q2 = text_img("par mail »", 52, (24, 26, 40), FONT_BOLD)
    tile.alpha_composite(q1, (40, 132))
    tile.alpha_composite(q2, (40, 200))

    att = chip("facture.pdf", bg=(244, 245, 250), fg=(120, 128, 152), size=30)
    tile.alpha_composite(att, (40, 316))
    return tile


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

C_FACTURE = card(shot("facture"), 1000)
C_PEPPOL = card(shot("peppol"), 900, radius=16)

MAIL = mail_card()
CHIP_JANVIER = chip("JANVIER 2026", bg=(22, 163, 74), fg=(255, 255, 255), size=40)

T_STEP = text_img("ÉTAPE", 40, GREY, FONT_BOLD)

# Hook — la phrase du client, en gros
T_H_Q1 = text_img("« ENVOIE-MOI", 78, WHITE, FONT_BLACK)
T_H_Q2 = text_img("LA FACTURE PAR MAIL »", 58, WHITE, FONT_BLACK)

# Scène 2 — depuis janvier
S2_A = text_img("UN PDF", 74, WHITE, FONT_BLACK)
S2_B = text_img("NE SUFFIT PLUS", 74, GREEN_LIGHT, FONT_BLACK)
S2_C = text_img("entre entreprises, la facture passe par Peppol", 38, GREY, FONT_BOLD)

# Scènes 3 / 4 — la solution, en 2 temps
S3_A = text_img("TU LA PRÉPARES", 58, WHITE, FONT_BLACK)
S3_B = text_img("UNE FOIS", 58, GREEN_LIGHT, FONT_BLACK)
S3_C = text_img("le devis accepté devient la facture", 40, GREY, FONT_BOLD)

S4_A = text_img("ELLE PART", 62, WHITE, FONT_BLACK)
S4_B = text_img("AU BON FORMAT", 62, GREEN_LIGHT, FONT_BLACK)
S4_C = text_img("le bouton Peppol de l'app", 40, GREY, FONT_BOLD)

# Carte finale — CTA mot-clé (contact, pas juste une vue)
T_CTA_1 = text_img("ENVOIE", 54, GREY, FONT_BOLD)
T_CTA_2 = text_img("PEPPOL", 148, GREEN_LIGHT, FONT_BLACK)
T_CTA_3 = text_img("EN MESSAGE", 54, WHITE, FONT_BOLD)
T_CTA_4 = text_img("je t'envoie le texte prêt pour ton client", 38, GREY, FONT_BOLD)
T_URL = text_img("mondedevis.eu", 82, WHITE, FONT_BLACK)
T_TRIAL = text_img("14 JOURS GRATUITS · SANS CARTE", 34, GREY, FONT_BOLD)

QR_IMG = qr_tile("https://mondedevis.eu", 300)

LOGO_IMG = Image.open(LOGO).convert("RGBA")
LOGO_IMG = LOGO_IMG.resize((180, round(LOGO_IMG.height * 180 / LOGO_IMG.width)), Image.LANCZOS)
_logo_tile = Image.new("RGBA", (LOGO_IMG.width + 50, LOGO_IMG.height + 50), (255, 255, 255, 245))
_mask = Image.new("L", _logo_tile.size, 0)
ImageDraw.Draw(_mask).rounded_rectangle(
    (0, 0, _logo_tile.width - 1, _logo_tile.height - 1), 36, fill=255
)
_logo_tile.putalpha(_mask)
_logo_tile.alpha_composite(LOGO_IMG, (25, 25))
LOGO_IMG = _logo_tile

BG_IMG = background()

# Bornes de scènes, recalculées depuis la voix dans main() :
# A=hook · B=règle · C=une fois · D=bon format · E=CTA
A, B, C, D, E, DUR = 0.0, 3.0, 6.4, 9.6, 12.6, 18.0


def dots(frame: Image.Image, active: int, n: int = 2, alpha: int = 255) -> None:
    w, h, gap = 96, 10, 18
    total = n * w + (n - 1) * gap
    x = (W - total) // 2
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(n):
        color = GREEN_LIGHT + (alpha,) if i < active else (255, 255, 255, alpha // 4)
        d.rounded_rectangle((x + i * (w + gap), 150, x + i * (w + gap) + w, 150 + h), 5, fill=color)
    frame.alpha_composite(layer)


def step_scene(
    f: Image.Image,
    lt: float,
    line_a: Image.Image,
    line_b: Image.Image,
    line_c: Image.Image,
    panel: Image.Image,
    active: int,
    panel_y: int = 1150,
) -> None:
    dots(f, active)
    paste(f, T_STEP, W // 2, 205, int(255 * min(1, lt / 0.2)))
    paste(f, line_a, W // 2, 330, int(255 * min(1, lt / 0.25)))
    paste(f, line_b, W // 2, 420, int(255 * min(1, max(0, (lt - 0.1) / 0.25))))
    paste(f, line_c, W // 2, 520, int(255 * min(1, max(0, (lt - 0.4) / 0.3))))
    z = 1 + 0.03 * ease_io(min(1.0, lt / 4.5))
    sh = panel.resize((int(panel.width * z), int(panel.height * z)), Image.LANCZOS)
    paste(f, sh, W // 2, panel_y, int(255 * ease_out(max(0.0, (lt - 0.15)) / 0.35)))


def render_frame(t: float) -> Image.Image:
    import random

    f = BG_IMG.copy()

    if t < B:  # hook — la demande du client
        lt = t
        k = ease_out(lt / 0.22)
        sc = 1.26 - 0.26 * k
        g1 = T_H_Q1.resize((int(T_H_Q1.width * sc), int(T_H_Q1.height * sc)), Image.LANCZOS)
        shake = int(random.uniform(-12, 12)) if t < 0.22 else 0
        paste(f, g1, W // 2 + shake, 430)
        paste(f, T_H_Q2, W // 2, 550, int(255 * min(1, max(0, (lt - 0.2) / 0.25))))
        y = 1090 - int(70 * (1 - ease_out(max(0.0, (lt - 0.3)) / 0.4)))
        paste(f, MAIL, W // 2, y, int(255 * min(1, max(0, (lt - 0.25) / 0.35))))

    elif t < C:  # depuis janvier — la règle
        lt = t - B
        paste(f, CHIP_JANVIER, W // 2, 320, int(255 * min(1, lt / 0.25)))
        paste(f, S2_A, W // 2, 540, int(255 * min(1, max(0, (lt - 0.15) / 0.25))))
        paste(f, S2_B, W // 2, 635, int(255 * min(1, max(0, (lt - 0.25) / 0.25))))
        paste(f, S2_C, W // 2, 760, int(255 * min(1, max(0, (lt - 0.55) / 0.3))))
        att = chip("facture.pdf", bg=(248, 238, 240), fg=(150, 70, 80), size=42, pad_x=34, pad_y=18)
        y = 1030
        paste(f, att, W // 2, y, int(255 * min(1, max(0, (lt - 0.8) / 0.3))))
        if lt > 1.0:
            k = ease_out((lt - 1.0) / 0.35)
            bar = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            x0 = W // 2 - att.width // 2 - 10
            x1 = x0 + int((att.width + 20) * k)
            ImageDraw.Draw(bar).line((x0, y, x1, y), fill=RED + (235,), width=10)
            f.alpha_composite(bar)

    elif t < D:  # tu la prépares une fois
        step_scene(f, t - C, S3_A, S3_B, S3_C, C_FACTURE, 1)

    elif t < E:  # elle part au bon format
        import math

        lt = t - D
        step_scene(f, lt, S4_A, S4_B, S4_C, C_PEPPOL, 2, panel_y=1140)
        pulse = 0.5 + 0.5 * math.sin(lt * 4.2)
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ring).rounded_rectangle(
            (
                W // 2 - C_PEPPOL.width // 2 - 16,
                1140 - C_PEPPOL.height // 2 - 12,
                W // 2 + C_PEPPOL.width // 2 + 16,
                1140 + C_PEPPOL.height // 2 + 12,
            ),
            30,
            outline=GREEN_LIGHT + (int(110 + 90 * pulse),),
            width=8,
        )
        f.alpha_composite(ring)

    else:  # carte finale — CTA mot-clé
        lt = t - E
        dots(f, 2)
        paste(f, LOGO_IMG, W // 2, 320, int(255 * ease_out(lt / 0.4)))
        paste(f, T_CTA_1, W // 2, 520, int(255 * min(1, max(0, (lt - 0.1) / 0.25))))
        k = ease_out(max(0.0, (lt - 0.2)) / 0.3)
        sc = 1.22 - 0.22 * k
        g = T_CTA_2.resize((int(T_CTA_2.width * sc), int(T_CTA_2.height * sc)), Image.LANCZOS)
        paste(f, g, W // 2, 640, int(255 * min(1, max(0, (lt - 0.2) / 0.25))))
        paste(f, T_CTA_3, W // 2, 790, int(255 * min(1, max(0, (lt - 0.35) / 0.25))))
        paste(f, T_CTA_4, W // 2, 880, int(255 * min(1, max(0, (lt - 0.5) / 0.3))))
        paste(f, QR_IMG, W // 2, 1180, int(255 * min(1, max(0, (lt - 0.6) / 0.35))))
        paste(f, T_URL, W // 2, 1410, int(255 * min(1, max(0, (lt - 0.75) / 0.3))))
        paste(f, T_TRIAL, W // 2, 1490, int(220 * min(1, max(0, (lt - 0.9) / 0.3))))

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


# --------------------------------------------------------------------------
# Voix : un fichier par phrase → bornes de scènes exactes
# --------------------------------------------------------------------------
def _dur(path: Path) -> float:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(probe.stdout.strip())


def _to_wav(src: Path, dst: Path) -> Path:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-ar", "44100", "-ac", "1",
         "-c:a", "pcm_s16le", "-y", str(dst)],
        check=True,
    )
    return dst


def _captions_proportional(text: str, start: float, dur: float) -> list[tuple[int, int, str]]:
    """Sous-titres approximatifs (repli sans WordBoundary) : 4 mots par carte."""
    words = text.split()
    weights = [max(3, len(w)) for w in words]
    total = sum(weights)
    out: list[tuple[int, int, str]] = []
    acc = 0.0
    for i in range(0, len(words), 4):
        group = words[i:i + 4]
        wsum = sum(weights[i:i + 4])
        t0 = start + dur * acc / total
        acc += wsum
        t1 = start + dur * acc / total
        out.append((int(t0 * 1000), int(t1 * 1000), " ".join(group)))
    return out


def synth_voice(tmp_dir: Path) -> tuple[Path, list[float], list[tuple[int, int, str]], str]:
    """Synthétise chaque phrase, concatène, et renvoie les débuts de scènes."""
    wav_dir = tmp_dir / "voice"
    wav_dir.mkdir(parents=True, exist_ok=True)

    starts: list[float] = []
    durations: list[float] = []
    captions: list[tuple[int, int, str]] = []
    engine = "say" if USE_SAY else "edge-tts"

    if not USE_SAY:
        try:
            from studio import voiceover
        except Exception as exc:  # pragma: no cover
            raise SystemExit(f"❌ voix indisponible ({exc}) — relance avec --say")

    cursor = 0.0
    for idx, text in enumerate(SEGMENTS):
        raw = tmp_dir / f"seg{idx}.src"
        if USE_SAY:
            # `say` n'accepte pas LEF32 en AIFF sur cette machine : WAV/LEI16.
            say_wav = tmp_dir / f"seg{idx}.say.wav"
            subprocess.run(
                ["say", "-v", "Jacques", "-o", str(say_wav),
                 "--data-format=LEI16@22050", text],
                check=True,
            )
            raw = say_wav
            seg_caps = None
        else:
            mp3 = tmp_dir / f"seg{idx}.mp3"
            voiceover.synthesize(text, "fr-FR-HenriNeural", mp3)
            raw = mp3
            seg_caps = voiceover._word_boundaries(text, "fr-FR-HenriNeural")  # noqa: SLF001

        wav = _to_wav(raw, wav_dir / f"seg{idx}.wav")
        d = _dur(wav)
        durations.append(d)
        starts.append(cursor)

        if seg_caps:
            captions.extend(
                (int((cursor * 1000) + s), int((cursor * 1000) + e), w)
                for s, e, w in _group_words(seg_caps)
            )
        else:
            captions.extend(_captions_proportional(text, cursor, d))

        cursor += d + SEG_GAP

    # piste complète : segments + silences, en PCM identique (concat demuxer)
    sil = wav_dir / "sil.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
         f"anullsrc=r=44100:cl=mono", "-t", str(SEG_GAP), "-c:a", "pcm_s16le",
         "-y", str(sil)],
        check=True,
    )
    listing = wav_dir / "list.txt"
    lines: list[str] = []
    for idx in range(len(SEGMENTS)):
        lines.append(f"file '{(wav_dir / f'seg{idx}.wav').as_posix()}'")
        if idx < len(SEGMENTS) - 1:
            lines.append(f"file '{sil.as_posix()}'")
    listing.write_text("\n".join(lines) + "\n", encoding="utf-8")

    full = tmp_dir / "voice_full.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-c:a", "pcm_s16le", "-y", str(full)],
        check=True,
    )
    return full, starts, captions, engine


def _group_words(words: list[tuple[int, int, str]], n: int = 4) -> list[tuple[int, int, str]]:
    groups = [words[i:i + n] for i in range(0, len(words), n)]
    return [(g[0][0], g[-1][1], " ".join(w[2] for w in g).strip()) for g in groups]


def main() -> None:
    global A, B, C, D, E, DUR

    print("🖼️  Écrans de l'app…")
    ensure_assets()

    with tempfile.TemporaryDirectory(prefix="p7-") as tmp:
        tmp_dir = Path(tmp)

        print("🎙️  Voix off…")
        voice, starts, captions, engine = synth_voice(tmp_dir)
        print(f"   moteur : {engine} · segments : {[round(s, 2) for s in starts]}")

        A = 0.0
        B = max(2.2, starts[1] - 0.10)
        C = max(B + 2.6, starts[2] - 0.10)
        D = max(C + 2.8, starts[3] - 0.12)
        E = max(D + 2.8, starts[4] - 0.25)
        DUR = round(E + (_dur(voice) - starts[4]) + 3.4, 2)
        print(f"   scènes : hook {A:.2f} · règle {B:.2f} · 1 {C:.2f} · 2 {D:.2f} ·"
              f" CTA {E:.2f} · total {DUR:.2f}")

        print("🎞️  Rendu…")
        silent = tmp_dir / "video.mp4"
        build_video(silent)

        print("💬 Sous-titres…")
        subbed = burn_captions(silent, captions, tmp_dir / "sub.mp4", size=(W, H))

        print("🎵 Mixage musique + voix…")
        mixed = tmp_dir / "mixed.mp4"
        mux_audio_with_music(subbed, MUSIC, mixed, voice_path=voice, music_volume=0.12,
                             voice_delay_ms=0)

        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(mixed), "-c:v", "copy",
             "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k",
             "-y", str(OUT)],
            check=True,
        )

        print("🖼️  Couverture…")
        render_frame(1.0).convert("RGB").save(COVER)

    print(f"✅ {OUT} ({OUT.stat().st_size / 1e6:.1f} Mo)")
    print(f"✅ {COVER}")


if __name__ == "__main__":
    main()
