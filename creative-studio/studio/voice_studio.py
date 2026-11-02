"""VoiceStudio — studio vocal complet (TTS edge-tts gratuit).

Construit sur voiceover.py (synthèse + sous-titres SRT synchronisés) :

  - VOICES               : catalogue des voix (FR/BE/NL/EN, homme/femme)
  - speak()              : voix off MP3 seule
  - speak_with_captions(): MP3 + SRT synchronisé
  - batch()              : une voix off par ligne d'un fichier script (campagne)
  - mix_with_music()     : voix + musique de fond (ffmpeg, musique bouclée)

Tout est gratuit (edge-tts, aucune clé API) sauf le mixage qui requiert ffmpeg.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from . import providers, voiceover

# Catalogue de voix courantes (handle → (voice edge-tts, libellé, langue, genre))
VOICES = {
    "be-m": ("fr-BE-GerardNeural", "Belgique — homme (Gérard)", "fr-BE", "m"),
    "be-f": ("fr-BE-CharlineNeural", "Belgique — femme (Charline)", "fr-BE", "f"),
    "fr-m": ("fr-FR-HenriNeural", "France — homme (Henri)", "fr-FR", "m"),
    "fr-f": ("fr-FR-DeniseNeural", "France — femme (Denise)", "fr-FR", "f"),
    "nl-m": ("nl-NL-MaartenNeural", "Néerlandais — homme (Maarten)", "nl-NL", "m"),
    "nl-f": ("nl-NL-LauraNeural", "Néerlandais — femme (Laura)", "nl-NL", "f"),
    "en-m": ("en-US-GuyNeural", "Anglais US — homme (Guy)", "en-US", "m"),
    "en-f": ("en-US-JennyNeural", "Anglais US — femme (Jenny)", "en-US", "f"),
}

DEFAULT_VOICE = "be-m"  # homme belge par défaut (cohérent avec voiceover.py)


def resolve_voice(handle: str) -> str:
    """Résout un handle de voix ('be-m') ou accepte directement un nom edge-tts."""
    if handle in VOICES:
        return VOICES[handle][0]
    # Nom edge-tts complet passé directement (ex: fr-BE-GerardNeural)
    if re.match(r"^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$", handle):
        return handle
    known = ", ".join(sorted(VOICES))
    raise ValueError(f"Voix inconnue : {handle} — voix disponibles : {known}")


def voices_table() -> str:
    """Tableau lisible des voix disponibles (pour la CLI)."""
    lines = ["🎙️ Voix disponibles (handle — libellé — voice edge-tts) :"]
    for handle, (voice, label, _lang, _g) in sorted(VOICES.items()):
        star = " ← défaut" if handle == DEFAULT_VOICE else ""
        lines.append(f"  {handle:<6} {label:<32} {voice}{star}")
    return "\n".join(lines)


def _require_edge() -> None:
    if not voiceover.is_available():
        raise RuntimeError("edge-tts non installé — lance : pip install edge-tts")


def speak_elevenlabs(
    text: str,
    voice_id: str,
    out_path: str | Path = "voice-elevenlabs.mp3",
    model_id: str = providers.DEFAULT_ELEVENLABS_MODEL,
) -> Path:
    """Génère un MP3 ElevenLabs et le sauvegarde au chemin demandé."""
    audio, _alignment = providers.generate_elevenlabs_tts(text, voice_id, model_id)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return out


def speak(
    text: str,
    voice: str = DEFAULT_VOICE,
    out_path: str | Path = "voice.mp3",
) -> Path:
    """Génère une voix off MP3 seule. Retourne le chemin du fichier."""
    _require_edge()
    return voiceover.synthesize(text, resolve_voice(voice), out_path)


def speak_with_elevenlabs_captions(
    text: str,
    voice_id: str,
    out_dir: str | Path = ".",
    base_name: str = "voice",
    model_id: str = providers.DEFAULT_ELEVENLABS_MODEL,
    max_words: int = 4,
) -> tuple[Path, Path]:
    """Génère MP3 + SRT approximatif à partir des timings caractère ElevenLabs."""
    if model_id in ("eleven_v4", "eleven_v4_turbo"):
        raise providers.ProviderError(
            f"{model_id} ne fournit pas les timestamps par l'API TTS; "
            "utilise eleven_v3 pour générer les sous-titres synchronisés"
        )
    audio, alignment = providers.generate_elevenlabs_tts(
        text, voice_id, model_id, with_timestamps=True
    )
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    mp3 = out_dir / f"{base_name}.mp3"
    mp3.write_bytes(audio)
    srt = out_dir / f"{base_name}.srt"
    srt.write_text(_srt_from_alignment(text, alignment, max_words), encoding="utf-8")
    return mp3, srt


def _captions_from_alignment(
    alignment: dict | None, max_words: int = 4
) -> list[tuple[int, int, str]]:
    """Convertit l'alignement caractère ElevenLabs en groupes de mots (ms)."""
    if not alignment:
        return []
    chars = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    if not chars or len(chars) != len(starts) or len(chars) != len(ends):
        return []
    words: list[tuple[float, float, str]] = []
    current_chars: list[str] = []
    word_start: float | None = None
    word_end = 0.0
    for char, start, end in zip(chars, starts, ends):
        if str(char).isspace():
            if current_chars and word_start is not None:
                words.append((word_start, word_end, "".join(current_chars)))
                current_chars = []
                word_start = None
            continue
        if word_start is None:
            word_start = float(start)
        current_chars.append(str(char))
        word_end = float(end)
    if current_chars and word_start is not None:
        words.append((word_start, word_end, "".join(current_chars)))
    if max_words < 1:
        raise ValueError("max_words doit être supérieur ou égal à 1")

    chunks = [words[i:i + max_words] for i in range(0, len(words), max_words)]
    return [
        (max(0, round(group[0][0] * 1000)), max(0, round(group[-1][1] * 1000)),
         " ".join(word[2] for word in group))
        for group in chunks
    ]


def _srt_from_alignment(text: str, alignment: dict | None, max_words: int) -> str:
    """Encode l'alignement caractère en sous-titres SRT groupés par mots."""
    captions = _captions_from_alignment(alignment, max_words)

    def fmt(ms: int) -> str:
        h, rem = divmod(ms, 3_600_000)
        m, rem = divmod(rem, 60_000)
        s, milli = divmod(rem, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{milli:03d}"

    return "\n".join(
        f"{index}\n{fmt(start)} --> {fmt(end)}\n{caption}\n"
        for index, (start, end, caption) in enumerate(captions, 1)
    )


def speak_with_captions(
    text: str,
    voice: str = DEFAULT_VOICE,
    out_dir: str | Path = ".",
    base_name: str = "voice",
    max_words: int = 4,
) -> tuple[Path, Path]:
    """Génère MP3 + SRT synchronisé. Retourne (mp3, srt)."""
    _require_edge()
    v = resolve_voice(voice)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    mp3 = voiceover.synthesize(text, v, out_dir / f"{base_name}.mp3")
    srt = out_dir / f"{base_name}.srt"
    srt.write_text(voiceover.srt_from_text(text, v, max_words), encoding="utf-8")
    return mp3, srt


def batch(
    scripts_path: str | Path,
    out_dir: str | Path = "voices",
    voice: str = DEFAULT_VOICE,
    with_captions: bool = True,
) -> list[Path]:
    """Une voix off par ligne du fichier script (lignes vides et # ignorées).

    Chaque ligne devient `<NN>-<slug>.mp3` (+ `.srt` si with_captions).
    Retourne la liste des MP3 générés.
    """
    _require_edge()
    scripts = Path(scripts_path)
    if not scripts.is_file():
        raise FileNotFoundError(f"Fichier scripts introuvable : {scripts}")

    items: list[tuple[int, str]] = []
    for line in scripts.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        items.append((len(items) + 1, text))
    if not items:
        raise ValueError(f"Aucun script valide dans {scripts}")

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    generated: list[Path] = []
    for index, text in items:
        slug = re.sub(r"[^a-z0-9]+", "-", text.lower())[:24].strip("-") or "script"
        base = f"{index:02d}-{slug}"
        if with_captions:
            mp3, _srt = speak_with_captions(text, voice, out, base)
        else:
            mp3 = speak(text, voice, out / f"{base}.mp3")
        generated.append(mp3)
        print(f"  ✅ {mp3.name}")
    return generated


def _ffmpeg() -> str:
    binary = shutil.which("ffmpeg")
    if not binary:
        raise RuntimeError("ffmpeg introuvable — installe-le (brew install ffmpeg)")
    return binary


def mix_with_music(
    voice_path: str | Path,
    music_path: str | Path,
    out_path: str | Path,
    music_volume: float = 0.15,
) -> Path:
    """Mixe voix + musique de fond (musique bouclée sur la durée de la voix)."""
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    voice_path, music_path = Path(voice_path), Path(music_path)
    if not voice_path.is_file():
        raise FileNotFoundError(f"Voix introuvable : {voice_path}")
    if not music_path.is_file():
        raise FileNotFoundError(f"Musique introuvable : {music_path}")

    # Durée de la voix via ffprobe (0 → pas de boucle contrôlée, on passe tel quel)
    probe = shutil.which("ffprobe")
    duration = 0.0
    if probe:
        result = subprocess.run(
            [probe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nk=1:nw=1", str(voice_path)],
            capture_output=True, text=True,
        )
        try:
            duration = float(result.stdout.strip())
        except ValueError:
            duration = 0.0

    with tempfile.TemporaryDirectory(prefix="voice-mix-") as tmp:
        tmp_dir = Path(tmp)
        music_loop = tmp_dir / "music_loop.m4a"
        if duration > 0:
            subprocess.run(
                [_ffmpeg(), "-y", "-stream_loop", "-1", "-i", str(music_path),
                 "-t", f"{duration:.3f}", "-c:a", "aac", "-b:a", "192k", str(music_loop)],
                capture_output=True, text=True, check=True,
            )
        else:
            music_loop = music_path  # pas de ffprobe : musique non bouclée

        subprocess.run(
            [_ffmpeg(), "-y", "-i", str(voice_path), "-i", str(music_loop),
             "-filter_complex",
             f"[1:a]volume={music_volume}[m];[0:a][m]amix=inputs=2:duration=longest:normalize=0[a]",
             "-map", "[a]", "-c:a", "aac", "-b:a", "192k", str(out)],
            capture_output=True, text=True, check=True,
        )
    return out
