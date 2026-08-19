"""Montage vidéo local — image animée (Ken Burns) + habillage charte statique.

Deux couches :
  1. fond : l'image générée (IA ou mock) animée en zoom lent via ffmpeg zoompan
  2. dessus : la couche d'habillage transparente (texte/CTA/logo) figée

Résultat : un MP4 "visuel de marque animé" sans coût IA vidéo, prêt pour les
Reels/Stories. Le mode clip IA (fal.ai) est branché dans cli.py.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter

from .brand import Brand
from .overlay import build_overlay_layer


def _ffmpeg() -> str:
    binary = shutil.which("ffmpeg")
    if not binary:
        raise RuntimeError("ffmpeg introuvable — installe-le (brew install ffmpeg)")
    return binary


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg a échoué :\n{result.stderr[-1200:]}")


def make_ken_burns_video(
    background: Image.Image,
    brand: Brand,
    headline: str,
    subtext: str | None = None,
    cta_label: str | None = None,
    whatsapp: str | None = None,
    benefits: list[str] | None = None,
    price: str | None = None,
    size: tuple[int, int] | None = None,
    duration: int = 10,
    fps: int = 30,
    out_path: str | Path = "output.mp4",
    zoom_max: float = 1.06,
) -> Path:
    """Construit un MP4 : fond en zoom lent + habillage charte statique."""
    width, height = size or brand.size("9x16")
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    # Netteté : on agrandit UNE seule fois vers la fenêtre couverte par le zoom
    # (jamais de double upscale), puis on renforce les contours APRÈS
    # l'agrandissement — c'est là que le flou apparaît, surtout quand la source
    # gratuite Pollinations est limitée à ~580×1015 pour le 9:16.
    target_w = max(int(width * zoom_max), width)
    target_h = max(int(height * zoom_max), height)
    bg = background.convert("RGB")
    if bg.width < target_w or bg.height < target_h:
        scale = max(target_w / bg.width, target_h / bg.height)
        new_w = max(int(bg.width * scale), width)
        new_h = max(int(bg.height * scale), height)
        new_w -= new_w % 2  # dimensions paires (compat zoompan / yuv420p)
        new_h -= new_h % 2
        bg = bg.resize((new_w, new_h), Image.LANCZOS)
    bg = bg.filter(ImageFilter.UnsharpMask(radius=2, percent=75, threshold=0))

    overlay = build_overlay_layer(
        brand,
        headline,
        subtext=subtext,
        cta_label=cta_label,
        whatsapp=whatsapp,
        benefits=benefits,
        price=price,
        size=(width, height),
    )

    with tempfile.TemporaryDirectory(prefix="creative-studio-") as tmp:
        tmp_dir = Path(tmp)
        bg_path = tmp_dir / "bg.png"
        overlay_path = tmp_dir / "overlay.png"
        bg_path.write_bytes(_png_bytes(bg))
        overlay_path.write_bytes(_png_bytes(overlay))

        bg_video = tmp_dir / "bg.mp4"
        frames = duration * fps
        # zoompan sur image unique : d = nombre de frames total
        vf = (
            f"zoompan=z='min(zoom+{(zoom_max - 1) / frames:.6f},{zoom_max})'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={frames}:s={width}x{height}:fps={fps}"
        )
        _run(
            [
                _ffmpeg(), "-y", "-i", str(bg_path),
                "-vf", vf,
                "-t", str(duration),
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(fps),
                str(bg_video),
            ]
        )

        _run(
            [
                _ffmpeg(), "-y", "-i", str(bg_video), "-i", str(overlay_path),
                "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p",
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                str(out),
            ]
        )
    return out


def media_duration(path: Path) -> float:
    """Durée (secondes) d'un média via ffprobe (0.0 si indisponible)."""
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return 0.0
    result = subprocess.run(
        [
            ffprobe, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nk=1:nw=1", str(path),
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def _caption_font(size: int):
    from PIL import ImageFont

    for path in (
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _wrap_caption(draw, text: str, font, max_width: int) -> list[str]:
    """Découpe un sous-titre en lignes qui tiennent dans max_width."""
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


def burn_captions(
    video_path: str | Path,
    captions: list[tuple[int, int, str]],
    out_path: str | Path,
    size: tuple[int, int] = (1080, 1920),
    font_size: int = 48,
) -> Path:
    """Brûle des sous-titres (rendus PIL) via `overlay` + `enable`, sans libass.

    `captions` : [(start_ms, end_ms, texte), ...]. Chaque sous-titre est rendu en
    PNG transparent (texte blanc + contour noir) puis superposé au bon moment.
    """
    from PIL import ImageDraw

    width, height = size
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    if not captions:
        shutil.copyfile(video_path, out)
        return out

    font = _caption_font(font_size)
    with tempfile.TemporaryDirectory(prefix="captions-") as tmp:
        cap_dir = Path(tmp)
        entries: list[tuple[Path, float, float]] = []
        for index, (start_ms, end_ms, text) in enumerate(captions):
            img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            lines = _wrap_caption(draw, text, font, width - 120)
            line_h = font.size + 10
            block_h = line_h * len(lines)
            y = height - 140 - block_h
            for line in lines:
                bbox = draw.textbbox((0, 0), line, font=font)
                x = (width - (bbox[2] - bbox[0])) // 2
                draw.text(
                    (x - bbox[0], y - bbox[1]),
                    line,
                    fill=(255, 255, 255, 255),
                    font=font,
                    stroke_width=3,
                    stroke_fill=(0, 0, 0, 255),
                )
                y += line_h
            p = cap_dir / f"cap_{index:03d}.png"
            img.save(p, format="PNG")
            entries.append((p, start_ms / 1000.0, end_ms / 1000.0))

        inputs = ["-i", str(video_path)]
        for p, _, _ in entries:
            inputs += ["-i", str(p)]

        prev = "[0:v]"
        parts: list[str] = []
        for i, (_, start_s, end_s) in enumerate(entries):
            src = f"[{i + 1}:v]"
            dst = f"[c{i}]" if i < len(entries) - 1 else "[vout]"
            enable = f"enable='between(t,{start_s:.3f},{end_s:.3f})'"
            parts.append(f"{prev}{src}overlay=0:0:{enable}{dst}")
            prev = dst

        _run(
            [
                _ffmpeg(), "-y", *inputs,
                "-filter_complex", ";".join(parts),
                "-map", "[vout]",
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                str(out),
            ]
        )
    return out


def mux_audio(
    video_path: str | Path,
    audio_path: str | Path,
    out_path: str | Path,
    audio_delay_ms: int = 400,
) -> Path:
    """Mixe la voix off dans la vidéo (délai d'entrée + silence comblé à la fin)."""
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    delay = f"adelay={audio_delay_ms}|{audio_delay_ms}," if audio_delay_ms else ""
    _run(
        [
            _ffmpeg(), "-y",
            "-i", str(video_path), "-i", str(audio_path),
            "-filter_complex", f"[1:a]{delay}apad[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-movflags", "+faststart",
            str(out),
        ]
    )
    return out


def _loop_audio(audio_path: str | Path, duration: float, out_path: Path) -> Path:
    """Boucle un fichier audio pour atteindre `duration` secondes."""
    _run(
        [
            _ffmpeg(), "-y", "-stream_loop", "-1", "-i", str(audio_path),
            "-t", f"{duration:.3f}",
            "-c:a", "aac", "-b:a", "192k", str(out_path),
        ]
    )
    return out_path


def mux_audio_with_music(
    video_path: str | Path,
    music_path: str | Path,
    out_path: str | Path,
    voice_path: str | Path | None = None,
    music_volume: float = 0.15,
    voice_delay_ms: int = 400,
) -> Path:
    """Mixe une musique de fond (bouclée sur la durée vidéo) + voix off optionnelle."""
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    duration = media_duration(Path(video_path))

    with tempfile.TemporaryDirectory(prefix="music-") as tmp:
        music_loop = Path(tmp) / "music_loop.m4a"
        _loop_audio(music_path, duration, music_loop)

        inputs = ["-i", str(video_path)]
        parts: list[str] = []
        if voice_path:
            inputs += ["-i", str(voice_path), "-i", str(music_loop)]
            parts.append(f"[1:a]adelay={voice_delay_ms}|{voice_delay_ms},volume=1.0[v]")
            parts.append(f"[2:a]volume={music_volume}[m]")
            parts.append("[v][m]amix=inputs=2:duration=longest:normalize=0[a]")
        else:
            inputs += ["-i", str(music_loop)]
            parts.append(f"[1:a]volume={music_volume}[a]")

        _run(
            [
                _ffmpeg(), "-y", *inputs,
                "-filter_complex", ";".join(parts),
                "-map", "0:v", "-map", "[a]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
                "-shortest", "-movflags", "+faststart", str(out),
            ]
        )
    return out


def _png_bytes(image: Image.Image) -> bytes:
    import io

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()
