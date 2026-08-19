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

from studio import providers, voiceover  # noqa: E402
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
            if not voiceover.is_available():
                raise RuntimeError("edge-tts non installé — lance : pip install edge-tts")
            print(f"🎙️ Voix off ({voice})…")
            voice_mp3 = voiceover.synthesize(script, voice, tmp_dir / "voice.mp3")
            audio_dur = media_duration(voice_mp3)
            dur = max(duration, int(audio_dur) + 2)  # + marge de fin
            if with_captions:
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
    """Avatar UGC : image du personnage → Google Veo image→vidéo (il parle le script)."""
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
    if not providers.has_google_key():
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

    # 2. Veo image→vidéo : le personnage parle le script (audio natif + lip-sync).
    veo_prompt = (
        f"Le personnage de l'image parle face caméra, regard direct, en disant : "
        f"« {args.script} ». Lèvres parfaitement synchronisées, ton naturel et engageant."
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
    p_video.add_argument("--voice", default=voiceover.DEFAULT_VOICE, help="Voix edge-tts (défaut: fr-BE-GerardNeural, homme, accent belge)")
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

    p_avatar = sub.add_parser("avatar", help="Avatar UGC : personnage qui parle (Google Veo image→vidéo)")
    p_avatar.add_argument("--brand", required=True)
    p_avatar.add_argument("--script", required=True, help="Texte que l'avatar dit face caméra (audio natif Veo)")
    p_avatar.add_argument("--prompt", help="Contexte/description du personnage (défaut: portrait face caméra)")
    p_avatar.add_argument("--image", help="Chemin d'une image de personnage existante (pour la consistance)")
    p_avatar.add_argument("--headline", help="Titre affiché (mode mock uniquement)")
    p_avatar.add_argument("--format", choices=FORMATS.keys(), default="9x16")
    p_avatar.add_argument("--duration", type=int, default=8, help="Durée cible en secondes (Veo 3.1 = 8 s)")
    p_avatar.add_argument("--out", help="Chemin de sortie (défaut: output/avatar-<marque>.mp4)")
    p_avatar.add_argument("--mock", action="store_true", help="Test hors-ligne sans clé ni Veo")
    p_avatar.add_argument("--veo-fast", action="store_true", help="Utiliser Veo 3.1 Fast (2× moins cher, pour itérer)")
    p_avatar.add_argument("--provider", choices=["auto", "fal", "pollinations"], default="auto", help="Fournisseur pour l'image du personnage")
    p_avatar.set_defaults(func=cmd_avatar)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
