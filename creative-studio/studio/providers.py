"""Fournisseurs de génération IA — fal.ai (payant) + Pollinations (gratuit) + mock.

Image : fal.ai (FAL_KEY, payant) ou Pollinations.AI (gratuit, sans clé ni carte).
Vidéo : fal.ai / Google Veo / Kie.ai (avatar UGC) ou montage local ffmpeg.
Sans clé ni réseau, le mode mock génère un visuel déterministe hors-ligne.
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageFont

def _load_env() -> None:
    """Charge un .env minimal (racine workspace + creative-studio) sans dépendance.

    python-dotenv n'est pas installé dans le workspace : ce mini-chargeur évite
    d'ajouter une dépendance tout en lisant FAL_KEY depuis .env (gitignoré).
    L'environnement shell garde la priorité (on n'écrase pas une var déjà définie).
    """
    here = Path(__file__).resolve()
    candidates = [
        here.parents[2] / ".env",   # racine du workspace
        here.parents[1] / ".env",   # creative-studio/
    ]
    for env_file in candidates:
        if not env_file.is_file():
            continue
        for raw in env_file.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'\"")
            if key and key not in os.environ:
                os.environ[key] = value


_load_env()

FAL_KEY = os.environ.get("FAL_KEY", "").strip()
KIE_API_KEY = os.environ.get("KIE_API_KEY", "").strip()
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"
DEFAULT_ELEVENLABS_MODEL = "eleven_v4"
KIE_API_BASE = "https://api.kie.ai"
KIE_UPLOAD_URL = "https://kieai.redpandaai.co/api/file-stream-upload"
KIE_AVATAR_STANDARD = "kling/ai-avatar-standard"
KIE_AVATAR_PRO = "kling/ai-avatar-pro"
FAL_QUEUE_BASE = "https://queue.fal.run"
POLLINATIONS_IMAGE_BASE = "https://image.pollinations.ai"

DEFAULT_IMAGE_MODEL = "fal-ai/flux/dev"
DEFAULT_FREE_IMAGE_MODEL = "flux"
DEFAULT_VIDEO_MODEL = "fal-ai/kling-video/v1/standard/text-to-video"

# Google Veo 3.1 via Gemini API (payant à la seconde, billing requis, pas de tier gratuit).
GOOGLE_VIDEO_BASE = "https://generativelanguage.googleapis.com/v1beta"
GOOGLE_AI_API_KEY = (
    os.environ.get("GOOGLE_AI_API_KEY", "")
    or os.environ.get("GEMINI_API_KEY", "")
    or os.environ.get("GOOGLE_API_KEY", "")
).strip()
DEFAULT_GOOGLE_VIDEO_MODEL = "veo-3.1-generate-preview"
FAST_GOOGLE_VIDEO_MODEL = "veo-3.1-fast-generate-preview"  # 2× moins cher, pour itération


class ProviderError(Exception):
    """Erreur de génération (réseau, clé API, modèle…)."""


def has_api_key() -> bool:
    return bool(FAL_KEY)


def has_kie_key() -> bool:
    return bool(KIE_API_KEY)


def has_elevenlabs_key() -> bool:
    return bool(ELEVENLABS_API_KEY)


def elevenlabs_voices(search: str = "French", page_size: int = 50) -> list[dict]:
    """Retourne les voix ElevenLabs accessibles à la clé (filtre langue française)."""
    if not ELEVENLABS_API_KEY:
        raise ProviderError("ELEVENLABS_API_KEY manquante — ajoute-la dans .env")
    response = requests.get(
        f"https://api.elevenlabs.io/v2/voices",
        headers={"xi-api-key": ELEVENLABS_API_KEY},
        params={"search": search, "page_size": min(max(page_size, 1), 100)},
        timeout=30,
    )
    if response.status_code != 200:
        raise ProviderError(f"ElevenLabs liste des voix → HTTP {response.status_code}: {response.text[:400]}")
    try:
        body = response.json()
        voices = body["voices"]
    except (ValueError, KeyError, TypeError) as err:
        raise ProviderError("ElevenLabs liste des voix → réponse inattendue") from err
    if not isinstance(voices, list):
        raise ProviderError("ElevenLabs liste des voix → format invalide")
    return [voice for voice in voices if isinstance(voice, dict)]


def generate_elevenlabs_tts(
    text: str,
    voice_id: str,
    model_id: str = DEFAULT_ELEVENLABS_MODEL,
    *,
    with_timestamps: bool = False,
) -> tuple[bytes, dict | None]:
    """Génère du MP3 via ElevenLabs; renvoie aussi l'alignement si demandé."""
    if not ELEVENLABS_API_KEY:
        raise ProviderError("ELEVENLABS_API_KEY manquante — ajoute-la dans .env")
    if not text.strip() or not voice_id.strip():
        raise ProviderError("ElevenLabs nécessite un script et un voice ID non vides")
    max_chars = {
        "eleven_v4": 2_000,  # limite pratique Text to Dialogue, une voix
        "eleven_v4_turbo": 2_000,
        "eleven_v3": 5_000,
        "eleven_multilingual_v2": 10_000,
        "eleven_flash_v2_5": 40_000,
    }.get(model_id, 10_000)
    if len(text) > max_chars:
        raise ProviderError(f"Script trop long pour {model_id} (maximum {max_chars:,} caractères)")
    if model_id in ("eleven_v4", "eleven_v4_turbo"):
        if with_timestamps:
            raise ProviderError(
                f"{model_id} ne fournit pas les timings via Text to Dialogue; "
                "choisis eleven_v3 ou eleven_multilingual_v2 pour les sous-titres synchronisés"
            )
        url = f"{ELEVENLABS_API_BASE}/text-to-dialogue"
        payload = {"inputs": [{"text": text, "voice_id": voice_id}], "model_id": model_id}
    else:
        endpoint = "with-timestamps" if with_timestamps else ""
        url = f"{ELEVENLABS_API_BASE}/text-to-speech/{voice_id}"
        if endpoint:
            url += f"/{endpoint}"
        payload = {"text": text, "model_id": model_id}
    response = requests.post(
        url,
        params={"output_format": "mp3_44100_128"},
        headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    if response.status_code != 200:
        raise ProviderError(
            f"ElevenLabs synthèse → HTTP {response.status_code}: {response.text[:500]}"
        )
    if with_timestamps:
        try:
            body = response.json()
            audio = base64.b64decode(body["audio_base64"], validate=True)
            alignment = body.get("alignment") or body.get("normalized_alignment")
        except (ValueError, KeyError, TypeError) as err:
            raise ProviderError("ElevenLabs synthèse → audio ou alignement absent/invalide") from err
        if not audio:
            raise ProviderError("ElevenLabs synthèse → audio vide")
        return audio, alignment
    if not response.content:
        raise ProviderError("ElevenLabs synthèse → audio vide")
    return response.content, None


def has_google_key() -> bool:
    return bool(GOOGLE_AI_API_KEY)


def _fal_headers() -> dict[str, str]:
    if not FAL_KEY:
        raise ProviderError(
            "FAL_KEY manquante — ajoute-la dans .env ou utilise --mock pour un essai hors-ligne"
        )
    return {"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"}


def _queue_submit(model: str, payload: dict) -> str:
    """Soumet un job à la queue fal.ai et attend la fin, retourne l'URL du résultat."""
    response = requests.post(f"{FAL_QUEUE_BASE}/{model}", json=payload, headers=_fal_headers(), timeout=60)
    if response.status_code != 200:
        raise ProviderError(f"fal.ai {model} → HTTP {response.status_code}: {response.text[:300]}")
    request_id = response.json().get("request_id")
    if not request_id:
        raise ProviderError(f"fal.ai {model} → réponse sans request_id: {response.text[:300]}")

    deadline = time.time() + 600  # 10 min max
    while time.time() < deadline:
        status_resp = requests.get(
            f"{FAL_QUEUE_BASE}/{model}/requests/{request_id}/status",
            headers=_fal_headers(),
            timeout=30,
        )
        if status_resp.status_code != 200:
            raise ProviderError(f"fal.ai status → HTTP {status_resp.status_code}")
        status = status_resp.json()
        if status.get("status") == "COMPLETED":
            return status["result"]
        if status.get("status") == "FAILED":
            raise ProviderError(f"fal.ai {model} → échec du job: {status.get('error', 'inconnu')}")
        time.sleep(4)
    raise ProviderError(f"fal.ai {model} → timeout après 10 min")


def _download(url: str) -> bytes:
    response = requests.get(url, timeout=120)
    if response.status_code != 200:
        raise ProviderError(f"Téléchargement impossible (HTTP {response.status_code}) : {url}")
    return response.content


# ─── Image ───────────────────────────────────────────────────────────


def mock_image(width: int, height: int, prompt: str, seed: int = 42) -> Image.Image:
    """Visuel placeholder déterministe (dégradé + texte du prompt)."""
    import random

    rng = random.Random(seed)
    base = (28, 20, 14)
    accent = (201, 168, 76)
    img = Image.new("RGB", (width, height), base)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / height
        color = tuple(int(base[i] + (accent[i] - base[i]) * (0.15 + 0.2 * t)) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    for _ in range(24):
        x = rng.randint(0, width)
        y = rng.randint(0, height)
        r = rng.randint(2, 10)
        draw.ellipse([x - r, y - r, x + r, y + r], outline=accent, width=1)
    # Texte du prompt en filigrane
    font = None
    for path in (
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ):
        try:
            font = ImageFont.truetype(path, 22)
            break
        except Exception:
            continue
    words = prompt[:90] + ("…" if len(prompt) > 90 else "")
    draw.text((40, height - 80), f"MOCK — {words}", fill=(244, 228, 193), font=font)
    return img


def pollinations_image(
    prompt: str,
    size: tuple[int, int] = (1080, 1080),
    model: str = DEFAULT_FREE_IMAGE_MODEL,
    seed: int | None = None,
) -> Image.Image:
    """Image gratuite via Pollinations.AI (aucune clé, aucune carte requise)."""
    width, height = size
    params: dict = {"width": width, "height": height, "model": model}
    if seed is not None:
        params["seed"] = seed
    url = f"{POLLINATIONS_IMAGE_BASE}/prompt/{quote(prompt)}"
    response = requests.get(url, params=params, timeout=120)
    if response.status_code != 200:
        raise ProviderError(f"Pollinations → HTTP {response.status_code}: {response.text[:200]}")
    return Image.open(io.BytesIO(response.content)).convert("RGB")


def _fal_image(prompt: str, size: tuple[int, int], model: str) -> Image.Image:
    """Image via fal.ai (FAL_KEY + solde crédité requis)."""
    width, height = size
    result = _queue_submit(
        model,
        {
            "prompt": prompt,
            "image_size": {"width": width, "height": height},
            "num_images": 1,
        },
    )
    try:
        url = result["images"][0]["url"]
    except (KeyError, IndexError, TypeError) as err:
        raise ProviderError(f"fal.ai {model} → format de réponse inattendu: {str(result)[:300]}") from err
    return Image.open(io.BytesIO(_download(url))).convert("RGB")


def generate_image(
    prompt: str,
    size: tuple[int, int] = (1080, 1080),
    model: str = DEFAULT_IMAGE_MODEL,
    mock: bool = False,
    provider: str = "auto",
) -> Image.Image:
    """Génère une image : fal.ai (payant), Pollinations (gratuit) ou mock.

    provider:
      - "auto"         : fal.ai si FAL_KEY présente, sinon Pollinations (gratuit).
                         Si fal.ai échoue (ex: solde épuisé), bascule sur Pollinations.
      - "fal"          : fal.ai uniquement (lève ProviderError en cas d'échec).
      - "pollinations" : Pollinations gratuit, sans clé.
    """
    width, height = size
    if mock:
        return mock_image(width, height, prompt)
    use_fal = provider == "fal" or (provider == "auto" and has_api_key())
    if use_fal:
        try:
            return _fal_image(prompt, size, model)
        except ProviderError as err:
            if provider == "fal":
                raise
            print(
                f"⚠️ fal.ai indisponible ({err}) — bascule sur Pollinations (gratuit).",
                file=sys.stderr,
            )
    return pollinations_image(prompt, size)


# ─── Vidéo ───────────────────────────────────────────────────────────


def generate_video(
    prompt: str,
    duration: int = 5,
    aspect_ratio: str = "9:16",
    model: str = DEFAULT_VIDEO_MODEL,
    mock: bool = False,
) -> bytes:
    """Génère un clip vidéo IA (fal.ai) et retourne son contenu MP4.

    En mode mock, appelle le pipeline local (Ken Burns sur image mock) — voir cli.py.
    """
    if mock or not has_api_key():
        raise ProviderError("Mode mock vidéo : utilise le pipeline local image → MP4 (cli.py video)")
    result = _queue_submit(
        model,
        {
            "prompt": prompt,
            "duration": str(duration),
            "aspect_ratio": aspect_ratio,
        },
    )
    try:
        url = result["video"]["url"]
    except (KeyError, TypeError) as err:
        raise ProviderError(f"fal.ai {model} → format de réponse inattendu: {str(result)[:300]}") from err
    return _download(url)


# ─── Vidéo Google (Veo 3.1) ─────────────────────────────────────────


def _google_instance(prompt: str, image_bytes: bytes | None, mime_type: str = "image/png") -> dict:
    """Construit l'instance Veo (text-to-video ou image-to-video) pour test unitaire."""
    instance: dict = {"prompt": prompt}
    if image_bytes is not None:
        instance["image"] = {
            "bytesBase64Encoded": base64.b64encode(image_bytes).decode("ascii"),
            # L'API exige mimeType AVEC bytesBase64Encoded (sinon HTTP 400 INVALID_ARGUMENT).
            "mimeType": mime_type,
        }
    return instance


def generate_google_video(
    prompt: str,
    aspect_ratio: str = "9:16",
    image_bytes: bytes | None = None,
    model: str = DEFAULT_GOOGLE_VIDEO_MODEL,
) -> bytes:
    """Génère une vidéo via Google Veo 3.1 (text-to-video ou image-to-video).

    L'API est asynchrone : on soumet (`predictLongRunning`), on poll l'opération
    jusqu'à `done`, puis on télécharge le MP4 (audio natif inclus). Nécessite
    GOOGLE_AI_API_KEY + billing (pas de tier gratuit vidéo).
    """
    if not has_google_key():
        raise ProviderError(
            "GOOGLE_AI_API_KEY manquante — ajoute-la dans .env (Google AI Studio + billing requis)"
        )
    headers = {"x-goog-api-key": GOOGLE_AI_API_KEY, "Content-Type": "application/json"}
    body = {
        "instances": [_google_instance(prompt, image_bytes)],
        # aspectRatio se place dans `parameters`, PAS dans l'instance (sinon HTTP 400).
        "parameters": {"aspectRatio": aspect_ratio},
    }

    submit = requests.post(
        f"{GOOGLE_VIDEO_BASE}/models/{model}:predictLongRunning",
        json=body,
        headers=headers,
        timeout=60,
    )
    if submit.status_code != 200:
        hint = (
            " — quota/billing : active le billing sur le projet Google Cloud de la clé "
            "(Veo n'a pas de tier gratuit, paiement à la seconde)"
            if submit.status_code == 429
            else ""
        )
        raise ProviderError(f"Google Veo → HTTP {submit.status_code}: {submit.text[:400]}{hint}")
    operation_name = submit.json().get("name")
    if not operation_name:
        raise ProviderError(f"Google Veo → pas de nom d'opération : {submit.text[:300]}")

    deadline = time.time() + 600  # 10 min max (Veo peut prendre 1-2 min)
    status: dict = {}
    while time.time() < deadline:
        poll = requests.get(f"{GOOGLE_VIDEO_BASE}/{operation_name}", headers=headers, timeout=30)
        if poll.status_code != 200:
            raise ProviderError(f"Google Veo status → HTTP {poll.status_code}")
        status = poll.json()
        if status.get("done"):
            break
        time.sleep(5)
    else:
        raise ProviderError("Google Veo → timeout après 10 min")

    try:
        samples = status["response"]["generateVideoResponse"]["generatedSamples"]
        video_uri = samples[0]["video"]["uri"]
    except (KeyError, IndexError, TypeError) as err:
        raise ProviderError(f"Google Veo → réponse inattendue : {str(status)[:400]}") from err

    video_resp = requests.get(video_uri, headers={"x-goog-api-key": GOOGLE_AI_API_KEY}, timeout=120)
    if video_resp.status_code != 200:
        raise ProviderError(f"Google Veo → téléchargement HTTP {video_resp.status_code}")
    return video_resp.content


def _kie_json(response: requests.Response, operation: str) -> dict:
    """Valide HTTP + l'enveloppe JSON Kie (qui peut échouer avec HTTP 200)."""
    if response.status_code != 200:
        raise ProviderError(f"Kie.ai {operation} → HTTP {response.status_code}: {response.text[:400]}")
    try:
        body = response.json()
    except (ValueError, requests.exceptions.JSONDecodeError) as err:
        raise ProviderError(f"Kie.ai {operation} → réponse JSON invalide") from err
    if not isinstance(body, dict):
        raise ProviderError(f"Kie.ai {operation} → réponse inattendue")
    code = body.get("code", 200)
    if code != 200:
        detail = body.get("msg", "erreur inconnue")
        hint = " (crédits insuffisants)" if code == 402 else ""
        raise ProviderError(f"Kie.ai {operation} → code {code}: {detail}{hint}")
    return body


def _kie_upload(content: bytes, filename: str, mime_type: str) -> str:
    """Envoie un média binaire à l'API d'upload Kie et retourne son URL temporaire."""
    if not KIE_API_KEY:
        raise ProviderError("KIE_API_KEY manquante — ajoute-la dans .env")
    response = requests.post(
        KIE_UPLOAD_URL,
        headers={"Authorization": f"Bearer {KIE_API_KEY}"},
        data={"uploadPath": "creative-studio/avatars"},
        files={"file": (filename, content, mime_type)},
        timeout=180,
    )
    body = _kie_json(response, "upload")
    download_url = (body.get("data") or {}).get("downloadUrl")
    if not body.get("success") or not download_url:
        raise ProviderError(f"Kie.ai upload → URL de fichier absente: {body.get('msg', '')}")
    return str(download_url)


def generate_kie_avatar(
    image_bytes: bytes,
    audio_bytes: bytes,
    prompt: str,
    *,
    model: str = KIE_AVATAR_STANDARD,
    poll_timeout: int = 900,
) -> bytes:
    """Crée un avatar parlant avec Kling via Kie.ai; retourne le MP4 final.

    Les fichiers source sont uploadés, puis createTask est pollé jusqu'à un
    état terminal. Aucun retry automatique de createTask (évite les doubles coûts).
    """
    if not KIE_API_KEY:
        raise ProviderError("KIE_API_KEY manquante — ajoute-la dans .env")
    if model not in (KIE_AVATAR_STANDARD, KIE_AVATAR_PRO):
        raise ProviderError(f"Modèle Kie.ai non pris en charge: {model}")
    if not image_bytes or not audio_bytes or not prompt.strip():
        raise ProviderError("Kie.ai avatar nécessite une image, un audio et un prompt non vide")
    if len(prompt) > 5000:
        raise ProviderError("Kie.ai avatar: le prompt ne peut pas dépasser 5 000 caractères")

    image_url = _kie_upload(image_bytes, "avatar.png", "image/png")
    audio_url = _kie_upload(audio_bytes, "voice.mp3", "audio/mpeg")
    submit = requests.post(
        f"{KIE_API_BASE}/api/v1/jobs/createTask",
        headers={"Authorization": f"Bearer {KIE_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": model,
            "input": {"image_url": image_url, "audio_url": audio_url, "prompt": prompt},
        },
        timeout=60,
    )
    body = _kie_json(submit, "création du job")
    task_id = (body.get("data") or {}).get("taskId")
    if not task_id:
        raise ProviderError("Kie.ai création du job → taskId absent")

    deadline = time.monotonic() + max(1, poll_timeout)
    interval = 2.0
    while time.monotonic() < deadline:
        status_response = requests.get(
            f"{KIE_API_BASE}/api/v1/jobs/recordInfo",
            headers={"Authorization": f"Bearer {KIE_API_KEY}"},
            params={"taskId": task_id},
            timeout=30,
        )
        status_body = _kie_json(status_response, "consultation du job")
        task = status_body.get("data") or {}
        state = task.get("state")
        if state == "fail":
            raise ProviderError(
                f"Kie.ai avatar échoué ({task.get('failCode', 'inconnu')}): "
                f"{task.get('failMsg', 'aucun détail')}"
            )
        if state == "success":
            try:
                result = task.get("response")
                if not isinstance(result, dict):
                    result_json = task.get("resultJson")
                    result = json.loads(result_json) if isinstance(result_json, str) else result_json
                result_urls = result["resultUrls"]
                video_url = result_urls[0]
            except (KeyError, IndexError, TypeError, ValueError) as err:
                raise ProviderError("Kie.ai avatar terminé sans URL vidéo exploitable") from err
            video_response = requests.get(str(video_url), timeout=180)
            if video_response.status_code != 200:
                raise ProviderError(f"Kie.ai téléchargement vidéo → HTTP {video_response.status_code}")
            if not video_response.content:
                raise ProviderError("Kie.ai téléchargement vidéo → fichier vide")
            return video_response.content
        if state not in ("waiting", "queuing", "generating"):
            raise ProviderError(f"Kie.ai état de job inattendu: {state!r}")
        time.sleep(interval)
        interval = min(interval * 1.5, 10.0)
    raise ProviderError(f"Kie.ai avatar → timeout après {poll_timeout} s (taskId {task_id})")


def save_media(content: bytes, out_path: str | Path) -> Path:
    """Écrit un binaire (MP4) sur disque."""
    path = Path(out_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return path
