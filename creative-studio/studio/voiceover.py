"""Voix off (TTS) gratuite via edge-tts + sous-titres synchronisés (SRT).

edge-tts = voix neuronales Microsoft, gratuites, sans clé API. Si le paquet
n'est pas installé, is_available() est False et les fonctions lèvent une
RuntimeError explicite. Utilisé par cli.py pour narrer une vidéo et brûler
des sous-titres synchronisés sur le MP4.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

try:
    import edge_tts
except ImportError:  # pragma: no cover - dépendance optionnelle
    edge_tts = None  # type: ignore[assignment]

# Voix par défaut : homme, accent belge. Autres options :
# fr-BE-CharlineNeural (femme), fr-FR-DeniseNeural (femme, France),
# fr-FR-HenriNeural (homme, France), en-US-... pour l'anglais.
DEFAULT_VOICE = "fr-BE-GerardNeural"

# 1 tick edge-tts = 100 nanosecondes → 10 000 ticks = 1 milliseconde.
_TICKS_TO_MS = 10_000


def is_available() -> bool:
    return edge_tts is not None


def _require() -> None:
    if edge_tts is None:
        raise RuntimeError("edge-tts non installé — lance : pip install edge-tts")


def synthesize(
    text: str,
    voice: str = DEFAULT_VOICE,
    out_path: str | Path = "voiceover.mp3",
) -> Path:
    """Génère la voix off MP3 (edge-tts) et retourne le chemin du fichier."""
    _require()
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    async def _run() -> None:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out))

    asyncio.run(_run())
    return out


def _fmt_ts(ms: int) -> str:
    """Formate un instant (ms) en horodatage SRT `HH:MM:SS,mmm`."""
    ms = max(0, int(ms))
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, milli = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{milli:03d}"


def _word_boundaries(text: str, voice: str) -> list[tuple[int, int, str]]:
    """Renvoie [(start_ms, end_ms, mot), ...] depuis les frontières edge-tts."""

    async def _collect() -> list[tuple[int, int, str]]:
        communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")
        words: list[tuple[int, int, str]] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "WordBoundary":
                start_ms = chunk["offset"] // _TICKS_TO_MS
                end_ms = (chunk["offset"] + chunk["duration"]) // _TICKS_TO_MS
                words.append((start_ms, end_ms, str(chunk["text"]).strip()))
        return words

    return asyncio.run(_collect())


def captions_from_text(
    text: str,
    voice: str = DEFAULT_VOICE,
    max_words: int = 4,
) -> list[tuple[int, int, str]]:
    """Renvoie [(start_ms, end_ms, caption), ...] synchronisés (groupe de mots)."""
    _require()
    words = _word_boundaries(text, voice)
    if not words:
        return []

    groups: list[list[tuple[int, int, str]]] = []
    current: list[tuple[int, int, str]] = []
    for word in words:
        current.append(word)
        if len(current) >= max_words:
            groups.append(current)
            current = []
    if current:
        groups.append(current)

    return [
        (group[0][0], group[-1][1], " ".join(word[2] for word in group).strip())
        for group in groups
    ]


def srt_from_text(
    text: str,
    voice: str = DEFAULT_VOICE,
    max_words: int = 4,
) -> str:
    """Construit un SRT synchronisé à partir des sous-titres groupés."""
    captions = captions_from_text(text, voice, max_words)
    lines = [
        f"{index}\n{_fmt_ts(start)} --> {_fmt_ts(end)}\n{caption}\n"
        for index, (start, end, caption) in enumerate(captions, 1)
    ]
    return "\n".join(lines)
