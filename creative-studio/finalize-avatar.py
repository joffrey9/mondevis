#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Post-production du clip avatar Veo → Reel final.

1. Gomme le logo d'origine (delogo : interpolation des pixels voisins) —
   zone réglable en fractions via --delogo.
2. Passage en 1080x1920 (le modèle fast sort en 720x1280).
3. Incrustation du vrai logo Mondevis en pastille arrondie TOUT EN BAS À DROITE
   (pile sur l'emplacement du logo d'origine, qu'il recouvre).
4. --audio : remplace la voix Veo par une voix off MP3 (edge-tts fr-BE).

Usage :
    python3 finalize-avatar.py output/ugc-mondevis-avatar-reel2-v2.mp4 \
        --audio output/variante-C.mp3 \
        -o output/ugc-mondevis-avatar-reel2-v3-final.mp4
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

STUDIO_DIR = Path(__file__).resolve().parent
LOGO = STUDIO_DIR / "brands" / "logo-mondevis.png"
OUT_SIZE = (1080, 1920)


def video_size(path: Path) -> tuple[int, int]:
    """Résolution de la vidéo source via ffprobe."""
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    st = json.loads(res.stdout)["streams"][0]
    return int(st["width"]), int(st["height"])


def rounded_logo(path: Path, size: int, radius: int) -> Image.Image:
    logo = Image.open(path).convert("RGB").resize((size, size), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(logo, (0, 0), mask)
    return out


def build_watermark(overlay_path: Path, logo_size: int, margin: int) -> None:
    """PNG transparent 1080x1920, pastille logo collée au coin bas droit."""
    canvas = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
    logo = rounded_logo(LOGO, logo_size, logo_size // 4)
    x = OUT_SIZE[0] - margin - logo_size
    y = OUT_SIZE[1] - margin - logo_size
    canvas.alpha_composite(logo, (x, y))
    canvas.save(overlay_path)
    print(f"   pastille {logo_size}px → position ({x},{y}) (coin bas droit, marge {margin}px)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Finalise le clip avatar (delogo + 1080p + logo + VO)")
    parser.add_argument("video", help="clip Veo source (720x1280)")
    parser.add_argument("-o", "--output", default=None)
    parser.add_argument("--audio", default=None, help="MP3 de remplacement (voix belge edge-tts)")
    parser.add_argument("--logo-size", type=int, default=240, help="taille pastille (px, défaut 240)")
    parser.add_argument("--margin", type=int, default=30, help="marge droite/bas (px, défaut 30)")
    parser.add_argument(
        "--delogo",
        default="0.58,0.84,1.0,1.0",
        help="zone du logo d'origine à gommer, fractions x0,y0,x1,y1 du cadre source",
    )
    args = parser.parse_args()

    video = Path(args.video)
    out = Path(args.output or str(video.with_suffix("")) + "-final.mp4")

    iw, ih = video_size(video)
    x0, y0, x1, y1 = (float(v) for v in args.delogo.split(","))
    dl = (int(x0 * iw), int(y0 * ih), int(x1 * iw) - int(x0 * iw), int(y1 * ih) - int(y0 * ih))
    # delogo exige une zone strictement intérieure au cadre (marge 2 px)
    dl = (max(2, dl[0]), max(2, dl[1]), dl[2], dl[3])
    dl = (dl[0], dl[1], min(dl[2], iw - 2 - dl[0]), min(dl[3], ih - 2 - dl[1]))
    print(f"🔍 delogo sur source {iw}x{ih} : x={dl[0]} y={dl[1]} w={dl[2]} h={dl[3]}")

    overlay = STUDIO_DIR / "output" / "watermark-mondevis.png"
    build_watermark(overlay, args.logo_size, args.margin)

    fc = (
        f"[0:v]delogo=x={dl[0]}:y={dl[1]}:w={dl[2]}:h={dl[3]},"
        f"scale={OUT_SIZE[0]}:{OUT_SIZE[1]}:flags=lanczos,fps=30,format=yuv420p[base];"
        f"[base][1:v]overlay=0:0[v]"
    )
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(video), "-i", str(overlay)]
    if args.audio:
        cmd += ["-i", args.audio]
        cmd += [
            "-filter_complex", fc,
            "-map", "[v]", "-map", "2:a",
            "-af", "apad", "-t", "8.0",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
        ]
    else:
        cmd += [
            "-filter_complex", fc,
            "-map", "[v]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "copy",
        ]
    cmd.append(str(out))
    subprocess.run(cmd, check=True)
    print(f"✅ Vidéo finalisée : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")


if __name__ == "__main__":
    main()
