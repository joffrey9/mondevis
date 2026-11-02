#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Creative Studio — générateur images/vidéo multi-marques (IA + charte).

Usage :
    python3 creative-studio/cli.py brands
    python3 creative-studio/cli.py image --brand fortemps --prompt "..." [--format 1x1|9x16] [--headline "…"] [--subtext "…"] [--mock]
    python3 creative-studio/cli.py video --brand fortemps --prompt "..." [--format 9x16] [--duration 10] [--mock]

    # Vidéo courte « faceless » complète (voix off + sous-titres + charte + musique) — GRATUIT :
    python3 creative-studio/cli.py video --brand fortemps --prompt "..." \
      --headline "Hook" --script "Texte de la voix off..." --captions \
      --music audio/ambient_reel.mp3

    # Pub produit (bénéfices + prix + voix off) :
    python3 creative-studio/cli.py video --brand fortemps --prompt "..." \
      --headline "Produit" --benefits "Avantage 1|Avantage 2" --price "19,99 €" \
      --script "..." --captions

    # Batch A/B testing : une vidéo par hook, même fond + même script :
    python3 creative-studio/cli.py batch --brand fortemps --prompt "..." \
      --script "..." --hooks "Hook A|Hook B|Hook C" --captions

    python3 creative-studio/cli.py video --brand fortemps --prompt "..." --clip-ia   # vidéo IA fal.ai (nécessite FAL_KEY)

Image : Pollinations gratuit par défaut (ou fal.ai si FAL_KEY + solde).
Vidéo locale : image animée + voix off edge-tts (gratuit) + sous-titres + musique + ffmpeg.
"""

from __future__ import annotations

import argparse
import io
import re
import shutil
import sys
import tempfile
from pathlib import Path

from PIL import Image

STUDIO_DIR = Path(__file__).resolve().parent
BRANDS_DIR = STUDIO_DIR / "brands"
sys.path.insert(0, str(STUDIO_DIR))

from studio import providers, voiceover, voice_studio  # noqa: E402
from studio.brand import BrandError, load_brand_by_handle, list_brands  # noqa: E402
from studio.overlay import apply_brand  # noqa: E402
from studio.video import (  # noqa: E402
    burn_captions,
    make_ken_burns_video,
    media_duration,
    mux_audio,
    mux_audio_with_music,
)

FORMATS = {"1x1": (1080, 1080), "9x16": (1080, 1920)}


def _brand_from_args(args) -> object:
    try:
        return load_brand_by_handle(str(BRANDS_DIR), args.brand)
    except BrandError as err:
        print(f"❌ {err}", file=sys.stderr)
        sys.exit(1)


def _with_character(brand, prompt: str, enabled: bool = True) -> str:
    """Préfixe le prompt avec le personnage par défaut de la charte (si défini).

    La charte peut définir un `character` (ex: mondevis → jeune artisan). Il est
    ajouté automatiquement devant le prompt sauf si l'utilisateur passe
    `--no-character` ou décrit déjà sa propre personne.
    """
    char = (getattr(brand, "character", "") or "").strip()
    if not enabled or not char:
        return prompt
    return f"{char}, {prompt}"


def _default_output(kind: str, brand_handle: str, fmt: str) -> Path:
    folder = Path(__file__).resolve().parent.parent / ("output" if kind == "video" else "posts_prets")
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{kind}-{brand_handle}-{fmt.replace('x', '-')}.png" if kind == "image" else folder / f"video-{brand_handle}-{fmt.replace('x', '-')}.mp4"


def _parse_benefits(raw: str | None) -> list[str] | None:
    """Parse `--benefits "A|B|C"` (ou `;` / retours à la ligne) en liste propre."""
    if not raw:
        return None
    parts = [p.strip() for p in raw.replace("|", "\n").replace(";", "\n").split("\n")]
    return [p for p in parts if p] or None


def _parse_hooks(raw: str | None) -> list[str]:
    """Parse `--hooks "A|B|C"` (ou `;` / retours à la ligne) en liste propre."""
    if not raw:
        return []
    return [h.strip() for h in raw.replace("|", "\n").replace(";", "\n").split("\n") if h.strip()]


def _provider_label_for(provider: str, mock: bool) -> str:
    if mock:
        return "MOCK"
    return {
        "auto": "fal.ai" if providers.has_api_key() else "pollinations (gratuit)",
        "fal": "fal.ai",
        "pollinations": "pollinations (gratuit)",
    }.get(provider, provider)


def _provider_label(args) -> str:
    return _provider_label_for(args.provider, args.mock)


def _slugify(text: str, max_len: int = 30) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len] or "variant"


def _captions_from_srt(path: Path) -> list[tuple[int, int, str]]:
    """Lit les sous-titres SRT ElevenLabs pour le brûlage vidéo."""
    import re

    text = path.read_text(encoding="utf-8")
    captions: list[tuple[int, int, str]] = []
    timestamp = re.compile(r"(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})")
    for block in text.strip().split("\n\n") if text.strip() else []:
        lines = block.splitlines()
        if len(lines) < 3:
            continue
        match = timestamp.fullmatch(lines[1])
        if not match:
            continue
        values = [int(value) for value in match.groups()]
        start = ((values[0] * 3600 + values[1] * 60 + values[2]) * 1000) + values[3]
        end = ((values[4] * 3600 + values[5] * 60 + values[6]) * 1000) + values[7]
        captions.append((start, end, " ".join(lines[2:])))
    return captions


def _build_local_video(
    brand,
    prompt: str,
    headline: str,
    *,
    subtext: str | None,
    cta_label: str | None,
    benefits: list[str] | None,
    price: str | None,
    script: str | None,
    voice: str,
    voice_engine: str,
    eleven_voice_id: str | None,
    eleven_model: str,
    with_captions: bool,
    provider: str,
    mock: bool,
    music: str | None,
    size: tuple[int, int],
    duration: int,
    out: Path,
) -> Path:
    """Construit une vidéo locale complète : image → Ken Burns → voix/sous-titres/musique."""
    print(f"🎬 {brand.name} — vidéo locale ({_provider_label_for(provider, mock)})")
    background = providers.generate_image(prompt, size=size, mock=mock, provider=provider)

    with tempfile.TemporaryDirectory(prefix="creative-studio-") as tmp:
        tmp_dir = Path(tmp)
        voice_mp3: Path | None = None
        captions: list[tuple[int, int, str]] = []
        dur = duration

        # 1. Voix off + sous-titres (si --script)
        if script:
            print(f"🎙️ Voix off ({voice_engine}: {voice if voice_engine == 'edge' else eleven_voice_id})…")
            if voice_engine == "elevenlabs" and not providers.has_elevenlabs_key():
                raise RuntimeError("ELEVENLABS_API_KEY manquante — ajoute-la dans .env")
            if voice_engine == "elevenlabs" and not eleven_voice_id:
                raise RuntimeError("--eleven-voice-id requis pour le moteur ElevenLabs")
            if voice_engine == "elevenlabs":
                if with_captions:
                    audio, alignment = providers.generate_elevenlabs_tts(
                        script, eleven_voice_id, eleven_model, with_timestamps=True
                    )
                    voice_mp3 = tmp_dir / "voice.mp3"
                    voice_mp3.write_bytes(audio)
                    captions = voice_studio._captions_from_alignment(alignment)
                else:
                    voice_mp3 = voice_studio.speak_elevenlabs(
                        script, eleven_voice_id, tmp_dir / "voice.mp3", eleven_model
                    )
            else:
                if not voiceover.is_available():
                    raise RuntimeError("edge-tts non installé — lance : pip install edge-tts")
                voice_mp3 = voiceover.synthesize(script, voice, tmp_dir / "voice.mp3")
            audio_dur = media_duration(voice_mp3)
            dur = max(duration, int(audio_dur) + 2)  # + marge de fin
            if with_captions and voice_engine == "edge":
                captions = voiceover.captions_from_text(script, voice)

        # 2. Montage Ken Burns (fond animé + charte)
        base = tmp_dir / "base.mp4"
        make_ken_burns_video(
            background,
            brand,
            headline,
            subtext=subtext,
            cta_label=cta_label,
            benefits=benefits,
            price=price,
            size=size,
            duration=dur,
            out_path=base,
        )

        current = base
        # 3. Sous-titres brûlés
        if captions:
            print("💬 Sous-titres brûlés…")
            current = burn_captions(current, captions, tmp_dir / "sub.mp4", size=size)

        # 4. Audio final (musique + voix, voix seule, ou sans audio)
        if music:
            if not Path(music).is_file():
                raise FileNotFoundError(f"Fichier musique introuvable : {music}")
            print("🎵 Mixage musique + voix…" if voice_mp3 else "🎵 Mixage musique…")
            mux_audio_with_music(current, music, out, voice_path=voice_mp3, music_volume=0.15)
        elif voice_mp3:
            print("🔊 Mixage audio…")
            mux_audio(current, voice_mp3, out)
        else:
            shutil.copyfile(current, out)
    return out


def cmd_image(args) -> None:
    brand = _brand_from_args(args)
    size = FORMATS.get(args.format, (1080, 1080))
    headline = args.headline or args.prompt
    prompt = _with_character(brand, args.prompt, not args.no_character)

    print(f"🎨 {brand.name} — image {args.format} ({_provider_label(args)})")
    print(f"   prompt : {prompt}")
    image = providers.generate_image(prompt, size=size, mock=args.mock, provider=args.provider)

    final = apply_brand(
        image,
        brand,
        headline,
        subtext=args.subtext,
        cta_label=args.cta or brand.cta.get("label"),
        benefits=_parse_benefits(args.benefits),
        price=args.price,
        size=size,
    )
    out = Path(args.out) if args.out else _default_output("image", brand.handle, args.format)
    out.parent.mkdir(parents=True, exist_ok=True)
    final.save(out, format="PNG")
    print(f"✅ Visuel généré : {out}")


def cmd_video(args) -> None:
    if args.script and args.voice_engine == "elevenlabs":
        if not providers.has_elevenlabs_key():
            raise SystemExit("❌ ELEVENLABS_API_KEY absente de .env.")
        if not args.eleven_voice_id:
            raise SystemExit("❌ --eleven-voice-id requis avec --voice-engine elevenlabs.")
        if args.captions and args.eleven_model in ("eleven_v4", "eleven_v4_turbo"):
            raise SystemExit("❌ Pour des sous-titres synchronisés, choisis --eleven-model eleven_v3 ou eleven_multilingual_v2.")
    elif args.script and not voiceover.is_available():
        raise SystemExit("❌ edge-tts non installé — lance : pip install edge-tts")
    brand = _brand_from_args(args)
    size = FORMATS.get(args.format, (1080, 1920))
    headline = args.headline or args.prompt
    benefits = _parse_benefits(args.benefits)
    prompt = _with_character(brand, args.prompt, not args.no_character)
    out = Path(args.out) if args.out else _default_output("video", brand.handle, args.format)

    if args.clip_ia and not args.mock:
        print(f"🎬 {brand.name} — clip IA fal.ai ({providers.DEFAULT_VIDEO_MODEL})")
        if not providers.has_api_key():
            print("❌ FAL_KEY manquante — utilise --mock pour un essai local.", file=sys.stderr)
            sys.exit(1)
        content = providers.generate_video(
            prompt, duration=args.duration, aspect_ratio=args.format.replace("x", ":")
        )
        providers.save_media(content, out)
        print(f"✅ Clip IA généré : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")
        return

    if args.clip_veo and not args.mock:
        model = providers.FAST_GOOGLE_VIDEO_MODEL if args.veo_fast else providers.DEFAULT_GOOGLE_VIDEO_MODEL
        print(f"🎬 {brand.name} — clip Google Veo ({model})")
        if not providers.has_google_key():
            print("❌ GOOGLE_AI_API_KEY manquante — ajoute-la dans .env (Google AI Studio + billing).", file=sys.stderr)
            sys.exit(1)
        content = providers.generate_google_video(
            prompt, aspect_ratio=args.format.replace("x", ":"), model=model
        )
        providers.save_media(content, out)
        print(f"✅ Clip Google généré : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")
        return

    _build_local_video(
        brand,
        prompt,
        headline,
        subtext=args.subtext,
        cta_label=args.cta or brand.cta.get("label"),
        benefits=benefits,
        price=args.price,
        script=args.script,
        voice=args.voice,
        voice_engine=args.voice_engine,
        eleven_voice_id=args.eleven_voice_id,
        eleven_model=args.eleven_model,
        with_captions=args.captions,
        provider=args.provider,
        mock=args.mock,
        music=args.music,
        size=size,
        duration=args.duration,
        out=out,
    )
    print(f"✅ Vidéo générée : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")


def cmd_batch(args) -> None:
    """Génère une vidéo par hook (A/B testing) : même fond + même script, hooks différents."""
    brand = _brand_from_args(args)
    size = FORMATS.get(args.format, (1080, 1920))
    benefits = _parse_benefits(args.benefits)
    prompt = _with_character(brand, args.prompt, not args.no_character)
    hooks = _parse_hooks(args.hooks)
    if not hooks:
        print('❌ --hooks requis (ex: --hooks "Hook A|Hook B|Hook C")', file=sys.stderr)
        sys.exit(1)
    if args.script and args.voice_engine == "elevenlabs":
        if not providers.has_elevenlabs_key() or not args.eleven_voice_id:
            raise SystemExit("❌ La vidéo batch ElevenLabs exige ELEVENLABS_API_KEY et --eleven-voice-id.")
        if args.captions and args.eleven_model in ("eleven_v4", "eleven_v4_turbo"):
            raise SystemExit("❌ Pour des sous-titres synchronisés, choisis --eleven-model eleven_v3 ou eleven_multilingual_v2.")
    elif args.script and not voiceover.is_available():
        raise SystemExit("❌ edge-tts non installé — lance : pip install edge-tts")

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"🎬 Batch {brand.name} — {len(hooks)} variantes (fond + script partagés)")
    for index, hook in enumerate(hooks, 1):
        out = out_dir / f"video-{brand.handle}-{index:02d}-{_slugify(hook)}.mp4"
        print(f"\n── Variante {index}/{len(hooks)} : « {hook} » ──")
        try:
            _build_local_video(
                brand,
                prompt,
                hook,
                subtext=args.subtext,
                cta_label=args.cta or brand.cta.get("label"),
                benefits=benefits,
                price=args.price,
                script=args.script,
                voice=args.voice,
                voice_engine=args.voice_engine,
                eleven_voice_id=args.eleven_voice_id,
                eleven_model=args.eleven_model,
                with_captions=args.captions,
                provider=args.provider,
                mock=args.mock,
                music=args.music,
                size=size,
                duration=args.duration,
                out=out,
            )
            print(f"✅ {out}")
        except Exception as err:  # noqa: BLE001 — on continue les autres variantes
            print(f"❌ Variante {index} échouée : {err}", file=sys.stderr)

    print(f"\n✅ Batch terminé → {out_dir}/")


def cmd_avatar(args) -> None:
    """Avatar UGC : image personnage → vidéo parlante via Veo ou Kling/Kie.ai."""
    brand = _brand_from_args(args)
    size = FORMATS.get(args.format, (1080, 1920))
    out = (
        Path(args.out)
        if args.out
        else STUDIO_DIR.parent / "output" / f"avatar-{brand.handle}.mp4"
    )
    out.parent.mkdir(parents=True, exist_ok=True)

    if args.mock:
        # Hors-ligne : image mock + montage local (aucune clé, aucun Veo).
        img = providers.mock_image(size[0], size[1], args.prompt or "avatar")
        make_ken_burns_video(
            img, brand, args.headline or "Avatar", size=size, duration=args.duration, out_path=out
        )
        print(f"✅ Avatar mock généré : {out}")
        return

    if not args.script:
        print("❌ --script requis (texte que l'avatar doit dire face caméra).", file=sys.stderr)
        sys.exit(1)
    if args.voice_engine == "elevenlabs" and not args.kie_ai:
        print("❌ --voice-engine elevenlabs s'utilise avec --kie-ai; Veo génère sa voix lui-même.", file=sys.stderr)
        sys.exit(1)
    if args.kie_ai:
        if not providers.has_kie_key():
            print("❌ KIE_API_KEY manquante — ajoute-la dans .env.", file=sys.stderr)
            sys.exit(1)
        if args.voice_engine == "elevenlabs":
            if not providers.has_elevenlabs_key():
                print("❌ ELEVENLABS_API_KEY manquante — ajoute-la dans .env.", file=sys.stderr)
                sys.exit(1)
            if not args.eleven_voice_id:
                print("❌ --eleven-voice-id requis avec --voice-engine elevenlabs.", file=sys.stderr)
                sys.exit(1)
        elif not voiceover.is_available():
            print("❌ edge-tts requis pour générer l'audio : pip install edge-tts", file=sys.stderr)
            sys.exit(1)
    elif not providers.has_google_key():
        print(
            "❌ GOOGLE_AI_API_KEY manquante — ajoute-la dans .env (Google AI Studio + billing requis).",
            file=sys.stderr,
        )
        sys.exit(1)

    # 1. Image du personnage : réutilise --image si fourni (consistance), sinon
    #    génère depuis le `character` de la charte via le fournisseur image.
    if args.image:
        char_img = Image.open(args.image).convert("RGB")
        print(f"🖼️ Personnage : {args.image}")
    else:
        char_prompt = _with_character(brand, args.prompt or "portrait face caméra, regard direct, fond neutre")
        print(f"🖼️ Personnage : {char_prompt}")
        char_img = providers.generate_image(char_prompt, size=size, mock=False, provider=args.provider)

    buf = io.BytesIO()
    char_img.save(buf, format="PNG")

    if args.kie_ai:
        # Kie/Kling demande un fichier audio uploadé séparément : le moteur choisi
        # synthétise localement, puis le fournisseur retourne le MP4 parlant.
        with tempfile.TemporaryDirectory(prefix="creative-studio-kie-") as tmp:
            audio_path = Path(tmp) / "avatar-voice.mp3"
            if args.voice_engine == "elevenlabs":
                voice_studio.speak_elevenlabs(
                    args.script, args.eleven_voice_id, audio_path, args.eleven_model
                )
            else:
                voiceover.synthesize(args.script, args.voice, audio_path)
            print(f"🎬 Kie.ai Kling AI Avatar ({args.kie_model}, voix {args.voice_engine}) — génération facturable…")
            content = providers.generate_kie_avatar(
                buf.getvalue(), audio_path.read_bytes(),
                "Natural direct-to-camera delivery, subtle facial expressions and head movement, "
                "stable framing, preserve the identity and appearance of the portrait.",
                model=args.kie_model,
            )
        providers.save_media(content, out)
        print(f"✅ Avatar Kie.ai généré : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")
        return

    # 2. Veo image→vidéo : le personnage parle le script (audio natif + lip-sync).
    #    Accent belge imposé (le modèle choisit sinon une voix québécoise) et
    #    arrière-plan/éclairage figés (sinon variations de luminosité en fin de clip).
    veo_prompt = (
        f"Le personnage de l'image parle face caméra, regard direct, en disant : "
        f"« {args.script} ». Lèvres parfaitement synchronisées, ton naturel et engageant. "
        f"Important : le personnage parle français avec un accent belge (voix masculine "
        f"de Belgique, pas québécoise). Garde l'arrière-plan, les objets et les couleurs "
        f"exactement identiques à l'image : ne génère aucun texte, logo ni marque "
        f"supplémentaire. Éclairage stable et constant pendant toute la séquence, "
        f"aucune variation de luminosité, plan fixe."
    )
    model = providers.FAST_GOOGLE_VIDEO_MODEL if args.veo_fast else providers.DEFAULT_GOOGLE_VIDEO_MODEL
    print(f"🎬 Google Veo image→vidéo (avatar qui parle, {args.format}, {model})…")
    content = providers.generate_google_video(
        veo_prompt,
        aspect_ratio=args.format.replace("x", ":"),
        image_bytes=buf.getvalue(),
        model=model,
    )
    providers.save_media(content, out)
    print(f"✅ Avatar généré : {out} ({out.stat().st_size / 1_048_576:.1f} Mo)")


def cmd_voice(args) -> None:
    """VoiceStudio : voix off edge-tts ou ElevenLabs (+ SRT)."""
    if args.list_voices:
        print(voice_studio.voices_table())
        return
    if args.list_eleven_voices:
        if not providers.has_elevenlabs_key():
            raise SystemExit("❌ ELEVENLABS_API_KEY absente de .env; configure-la d'abord.")
        voices = providers.elevenlabs_voices(search=args.eleven_search)
        scope = f" (recherche: {args.eleven_search})" if args.eleven_search else " (toutes les voix accessibles)"
        if not voices:
            if args.eleven_search:
                print(f"❌ Aucune voix ElevenLabs trouvée pour « {args.eleven_search} ».")
                print("   Essaie une autre recherche, ou retire --eleven-search pour voir toutes les voix.")
            else:
                print("❌ Aucune voix ElevenLabs accessible avec cette clé API.")
            print("   Note : sur l'offre gratuite, les voix françaises/belges de la Voice Library ne sont pas accessibles par l'API.")
            return
        print(f"🎙️ {len(voices)} voix ElevenLabs{scope} — voice_id<TAB>nom<TAB>accent<TAB>genre :")
        for item in voices:
            labels = item.get("labels") or {}
            print(f"{item.get('voice_id', '')}\t{item.get('name', '')}\t{labels.get('accent', '')}\t{labels.get('gender', '')}")
        return

    if args.batch:
        if args.compare:
            raise SystemExit("❌ --compare ne s'utilise pas avec --batch; choisis un seul script court pour l'écoute A/B.")
        if args.engine == "elevenlabs" and args.captions and args.eleven_model in ("eleven_v4", "eleven_v4_turbo"):
            raise SystemExit("❌ Pour les sous-titres batch synchronisés, choisis eleven_v3 ou eleven_multilingual_v2.")
        if args.engine == "edge":
            generated = voice_studio.batch(
                args.batch, out_dir=args.out_dir or "voices", voice=args.voice,
                with_captions=args.captions,
            )
        else:
            if not args.eleven_voice_id or not providers.has_elevenlabs_key():
                raise SystemExit("❌ Batch ElevenLabs exige ELEVENLABS_API_KEY et --eleven-voice-id.")
            scripts = Path(args.batch)
            if not scripts.is_file():
                raise SystemExit(f"❌ Fichier scripts introuvable : {scripts}")
            out = Path(args.out_dir or "voices")
            out.mkdir(parents=True, exist_ok=True)
            generated = []
            for index, line in enumerate(scripts.read_text(encoding="utf-8").splitlines(), 1):
                text = line.strip()
                if not text or text.startswith("#"):
                    continue
                name = f"{index:02d}-{_slugify(text, 24)}"
                if args.captions:
                    mp3, _srt = voice_studio.speak_with_elevenlabs_captions(
                        text, args.eleven_voice_id, out, name, args.eleven_model, args.max_words
                    )
                else:
                    mp3 = voice_studio.speak_elevenlabs(
                        text, args.eleven_voice_id, out / f"{name}.mp3", args.eleven_model
                    )
                generated.append(mp3)
        print(f"✅ Batch terminé : {len(generated)} voix off → {args.out_dir or 'voices'}/")
        return

    if not args.script:
        print('❌ --script requis (ou --batch / --list-voices). Ex : \
          voice --script "Bienvenue sur MonDevis" --voice be-m --captions', file=sys.stderr)
        sys.exit(1)

    base = args.base or "voice"
    out_dir = Path(args.out_dir or ".")
    if args.compare:
        if args.captions:
            raise SystemExit("❌ --compare produit deux MP3 sans sous-titres; retire --captions.")
        if not args.eleven_voice_id:
            raise SystemExit("❌ --eleven-voice-id requis avec --compare.")
        if not providers.has_elevenlabs_key():
            raise SystemExit("❌ ELEVENLABS_API_KEY absente de .env.")
        if not voiceover.is_available():
            raise SystemExit("❌ edge-tts requis pour comparer : pip install edge-tts")
        edge_path = voice_studio.speak(args.script, args.voice, out_dir / f"{base}-edge.mp3")
        eleven_path = voice_studio.speak_elevenlabs(
            args.script, args.eleven_voice_id, out_dir / f"{base}-elevenlabs.mp3", args.eleven_model
        )
        print(f"✅ Comparaison edge-tts : {edge_path}")
        print(f"✅ Comparaison ElevenLabs : {eleven_path}")
        return

    if args.engine == "elevenlabs":
        if args.captions and args.eleven_model in ("eleven_v4", "eleven_v4_turbo"):
            raise SystemExit("❌ Pour des sous-titres synchronisés, choisis --eleven-model eleven_v3 ou eleven_multilingual_v2.")
        if not args.eleven_voice_id:
            raise SystemExit("❌ --eleven-voice-id requis avec --engine elevenlabs.")
        if not providers.has_elevenlabs_key():
            raise SystemExit("❌ ELEVENLABS_API_KEY absente de .env.")
        if args.captions:
            mp3, srt = voice_studio.speak_with_elevenlabs_captions(
                args.script, args.eleven_voice_id, out_dir, base, args.eleven_model, args.max_words
            )
            print(f"✅ Voix off ElevenLabs : {mp3}")
            print(f"✅ Sous-titres : {srt}")
        else:
            mp3 = voice_studio.speak_elevenlabs(
                args.script, args.eleven_voice_id, out_dir / f"{base}.mp3", args.eleven_model
            )
            print(f"✅ Voix off ElevenLabs : {mp3}")
    elif args.captions:
        mp3, srt = voice_studio.speak_with_captions(
            args.script, args.voice, out_dir, base, max_words=args.max_words
        )
        print(f"✅ Voix off : {mp3}")
        print(f"✅ Sous-titres : {srt}")
    else:
        mp3 = voice_studio.speak(args.script, args.voice, out_dir / f"{base}.mp3")
        print(f"✅ Voix off : {mp3}")

    if args.music:
        out = Path(args.out_dir or ".") / f"{base}-mix.mp3"
        voice_studio.mix_with_music(mp3, args.music, out, music_volume=args.music_volume)
        print(f"✅ Mix voix + musique : {out}")


def cmd_brands(_args) -> None:
    for handle in list_brands(str(BRANDS_DIR)):
        try:
            brand = load_brand_by_handle(str(BRANDS_DIR), handle)
            print(f"• {brand.handle:<12} {brand.name} — {brand.description}")
        except BrandError as err:
            print(f"• {handle:<12} ⚠️ {err}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Générateur images/vidéo multi-marques (IA + charte)")
    sub = parser.add_subparsers(dest="command", required=True)

    p_brands = sub.add_parser("brands", help="Lister les marques disponibles")
    p_brands.set_defaults(func=cmd_brands)

    p_image = sub.add_parser("image", help="Générer une image (IA + habillage charte)")
    p_image.add_argument("--brand", required=True, help="Identifiant de marque (ex: fortemps)")
    p_image.add_argument("--prompt", required=True, help="Prompt de génération IA")
    p_image.add_argument("--headline", help="Titre affiché sur le visuel (défaut: prompt)")
    p_image.add_argument("--subtext", help="Sous-titre affiché")
    p_image.add_argument("--cta", help="Texte du bouton CTA (défaut: charte)")
    p_image.add_argument("--benefits", help="Bénéfices pub produit séparés par | (ex: \"A|B|C\")")
    p_image.add_argument("--price", help="Prix affiché (ex: \"19,99 €\")")
    p_image.add_argument("--format", choices=FORMATS.keys(), default="1x1")
    p_image.add_argument("--out", help="Chemin de sortie (défaut: posts_prets/)")
    p_image.add_argument("--mock", action="store_true", help="Visuel placeholder local sans IA")
    p_image.add_argument("--provider", choices=["auto", "fal", "pollinations"], default="auto", help="Fournisseur IA (auto: fal si clé, sinon Pollinations gratuit)")
    p_image.add_argument("--no-character", action="store_true", help="Ne pas ajouter le personnage par défaut de la charte au prompt")
    p_image.set_defaults(func=cmd_image)

    p_video = sub.add_parser("video", help="Générer une vidéo (image animée locale ou clip IA)")
    p_video.add_argument("--brand", required=True)
    p_video.add_argument("--prompt", required=True)
    p_video.add_argument("--headline", help="Titre affiché (défaut: prompt)")
    p_video.add_argument("--subtext", help="Sous-titre affiché")
    p_video.add_argument("--cta", help="Texte du bouton CTA (défaut: charte)")
    p_video.add_argument("--benefits", help="Bénéfices pub produit séparés par | (ex: \"A|B|C\")")
    p_video.add_argument("--price", help="Prix affiché (ex: \"19,99 €\")")
    p_video.add_argument("--script", help="Texte de la voix off (TTS edge-tts gratuit)")
    p_video.add_argument("--voice", default=voiceover.DEFAULT_VOICE, help="Voix edge-tts (défaut: fr-BE-GerardNeural)")
    p_video.add_argument("--voice-engine", choices=["edge", "elevenlabs"], default="edge", help="Moteur vocal (edge gratuit par défaut)")
    p_video.add_argument("--eleven-voice-id", help="Voice ID de ta voix ElevenLabs (API payante selon le forfait)")
    p_video.add_argument("--eleven-model", default=providers.DEFAULT_ELEVENLABS_MODEL, choices=["eleven_v4", "eleven_v4_turbo", "eleven_multilingual_v2", "eleven_v3", "eleven_flash_v2_5"], help="Modèle TTS ElevenLabs")
    p_video.add_argument("--captions", action="store_true", help="Brûler des sous-titres synchronisés (nécessite --script)")
    p_video.add_argument("--music", help="Fichier musique de fond (mp3/wav) bouclé à 15% sous la voix")
    p_video.add_argument("--format", choices=FORMATS.keys(), default="9x16")
    p_video.add_argument("--duration", type=int, default=10, help="Durée en secondes (min. si voix off plus longue)")
    p_video.add_argument("--clip-ia", action="store_true", help="Clip vidéo IA fal.ai (FAL_KEY requise)")
    p_video.add_argument("--clip-veo", action="store_true", help="Clip vidéo Google Veo 3.1 (GOOGLE_AI_API_KEY requise)")
    p_video.add_argument("--veo-fast", action="store_true", help="Utiliser Veo 3.1 Fast (2× moins cher, pour itérer)")
    p_video.add_argument("--out", help="Chemin de sortie (défaut: output/)")
    p_video.add_argument("--mock", action="store_true")
    p_video.add_argument("--provider", choices=["auto", "fal", "pollinations"], default="auto", help="Fournisseur IA pour l'image de fond (auto: fal si clé, sinon Pollinations gratuit)")
    p_video.add_argument("--no-character", action="store_true", help="Ne pas ajouter le personnage par défaut de la charte au prompt")
    p_video.set_defaults(func=cmd_video)

    p_batch = sub.add_parser("batch", help="Batch A/B testing : une vidéo par hook")
    p_batch.add_argument("--brand", required=True)
    p_batch.add_argument("--prompt", required=True)
    p_batch.add_argument("--hooks", required=True, help="Hooks séparés par | (ex: \"Hook A|Hook B|Hook C\")")
    p_batch.add_argument("--script", help="Texte voix off commun à toutes les variantes")
    p_batch.add_argument("--voice", default=voiceover.DEFAULT_VOICE)
    p_batch.add_argument("--voice-engine", choices=["edge", "elevenlabs"], default="edge")
    p_batch.add_argument("--eleven-voice-id")
    p_batch.add_argument("--eleven-model", default=providers.DEFAULT_ELEVENLABS_MODEL, choices=["eleven_v4", "eleven_v4_turbo", "eleven_multilingual_v2", "eleven_v3", "eleven_flash_v2_5"])
    p_batch.add_argument("--captions", action="store_true")
    p_batch.add_argument("--subtext", help="Sous-titre affiché (commun)")
    p_batch.add_argument("--cta", help="Texte du bouton CTA")
    p_batch.add_argument("--benefits", help="Bénéfices pub produit (communs)")
    p_batch.add_argument("--price", help="Prix affiché (commun)")
    p_batch.add_argument("--music", help="Fichier musique de fond (bouclée)")
    p_batch.add_argument("--format", choices=FORMATS.keys(), default="9x16")
    p_batch.add_argument("--duration", type=int, default=10)
    p_batch.add_argument("--out-dir", default="output", help="Dossier de sortie (défaut: output/)")
    p_batch.add_argument("--mock", action="store_true")
    p_batch.add_argument("--provider", choices=["auto", "fal", "pollinations"], default="auto")
    p_batch.add_argument("--no-character", action="store_true", help="Ne pas ajouter le personnage par défaut de la charte au prompt")
    p_batch.set_defaults(func=cmd_batch)

    p_voice = sub.add_parser("voice", help="Voix off MP3 edge-tts ou ElevenLabs (+ SRT)")
    p_voice.add_argument("--script", help="Texte de la voix off")
    p_voice.add_argument("--voice", default=voice_studio.DEFAULT_VOICE, help="Handle edge-tts (be-m, be-f, fr-m, fr-f, nl-m, nl-f, en-m, en-f) ou nom de voix")
    p_voice.add_argument("--engine", choices=["edge", "elevenlabs"], default="edge", help="Moteur vocal; edge gratuit par défaut")
    p_voice.add_argument("--eleven-voice-id", help="Voice ID ElevenLabs")
    p_voice.add_argument("--eleven-model", default=providers.DEFAULT_ELEVENLABS_MODEL, choices=["eleven_v4", "eleven_v4_turbo", "eleven_multilingual_v2", "eleven_v3", "eleven_flash_v2_5"])
    p_voice.add_argument("--compare", action="store_true", help="Générer le même script avec edge-tts et ElevenLabs pour comparaison")
    p_voice.add_argument("--list-eleven-voices", action="store_true", help="Lister les voix ElevenLabs accessibles (nécessite clé API)")
    p_voice.add_argument("--eleven-search", default="", help="Recherche de voix ElevenLabs (vide = toutes; ex: French, Belgian)")
    p_voice.add_argument("--list-voices", action="store_true", help="Lister les voix disponibles")
    p_voice.add_argument("--captions", action="store_true", help="Générer aussi le SRT synchronisé")
    p_voice.add_argument("--max-words", type=int, default=4, help="Mots par sous-titre (défaut: 4)")
    p_voice.add_argument("--batch", help="Fichier script : une voix off par ligne (campagne)")
    p_voice.add_argument("--music", help="Fichier musique de fond à mixer sous la voix")
    p_voice.add_argument("--music-volume", type=float, default=0.15, help="Volume musique (défaut: 0.15)")
    p_voice.add_argument("--out-dir", help="Dossier de sortie (défaut: ./ ou voices/ en batch)")
    p_voice.add_argument("--base", help="Nom de base des fichiers (défaut: voice)")
    p_voice.set_defaults(func=cmd_voice)

    p_avatar = sub.add_parser("avatar", help="Avatar UGC : personnage qui parle (Google Veo ou Kling/Kie.ai)")
    p_avatar.add_argument("--brand", required=True)
    p_avatar.add_argument("--script", required=True, help="Texte que l'avatar dit face caméra (audio natif Veo ou voix TTS avec Kie.ai)")
    p_avatar.add_argument("--prompt", help="Contexte/description du personnage (défaut: portrait face caméra)")
    p_avatar.add_argument("--image", help="Chemin d'une image de personnage existante (pour la consistance)")
    p_avatar.add_argument("--headline", help="Titre affiché (mode mock uniquement)")
    p_avatar.add_argument("--format", choices=FORMATS.keys(), default="9x16")
    p_avatar.add_argument("--duration", type=int, default=8, help="Durée cible en secondes (Veo 3.1 = 8 s)")
    p_avatar.add_argument("--out", help="Chemin de sortie (défaut: output/avatar-<marque>.mp4)")
    p_avatar.add_argument("--mock", action="store_true", help="Test hors-ligne sans clé ni Veo")
    p_avatar.add_argument("--veo-fast", action="store_true", help="Utiliser Veo 3.1 Fast (2× moins cher, pour itérer)")
    p_avatar.add_argument("--kie-ai", action="store_true", help="Utiliser Kling AI Avatar Standard via Kie.ai (consomme des crédits)")
    p_avatar.add_argument("--kie-model", choices=[providers.KIE_AVATAR_STANDARD, providers.KIE_AVATAR_PRO], default=providers.KIE_AVATAR_STANDARD, help="Modèle Kling Kie.ai (Standard 720p ou Pro 1080p)")
    p_avatar.add_argument("--voice", default=voiceover.DEFAULT_VOICE, help="Voix edge-tts (par défaut)")
    p_avatar.add_argument("--voice-engine", choices=["edge", "elevenlabs"], default="edge", help="Moteur TTS de l'avatar Kie.ai")
    p_avatar.add_argument("--eleven-voice-id", help="Voice ID ElevenLabs si --voice-engine elevenlabs")
    p_avatar.add_argument("--eleven-model", default=providers.DEFAULT_ELEVENLABS_MODEL, choices=["eleven_v4", "eleven_v4_turbo", "eleven_multilingual_v2", "eleven_v3", "eleven_flash_v2_5"])
    p_avatar.add_argument("--provider", choices=["auto", "fal", "pollinations"], default="auto", help="Fournisseur pour l'image du personnage")
    p_avatar.set_defaults(func=cmd_avatar)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
