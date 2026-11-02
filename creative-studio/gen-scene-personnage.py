#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère la scène « artisan sur chantier avec MonDevis » via Google Gemini image.

Le visage est ancré sur l'avatar existant (`avatar mondedevis final.png`) pour
garder la même personne. Nécessite GOOGLE_AI_API_KEY dans .env.

Usage : python3 gen-scene-personnage.py [nb_variantes]
Sortie : output/scene-artisan-1.png, -2.png, ...
"""

from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

import requests
from PIL import Image

STUDIO_DIR = Path(__file__).resolve().parent
ROOT = STUDIO_DIR.parent.parent
REF = STUDIO_DIR / "avatar mondedevis final.png"
OUT_DIR = STUDIO_DIR / "output"

MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

PROMPT = (
    "Photorealistic vertical photo (9:16 portrait orientation) of the SAME man as in the "
    "reference image: short messy dark hair, short beard, mid-thirties, friendly but focused. "
    "He is standing on a real construction site (raw plaster walls, wooden studs, sawdust, "
    "natural daylight coming from a window). He wears dark grey work trousers with tool "
    "pockets and a plain olive work t-shirt; his forearms and hands are a worker's hands. "
    "Framing from the knees up so the work trousers are clearly visible. "
    "He holds a smartphone in his right hand, slightly raised, and he is signing a quote on "
    "the screen with his right thumb, eyes on the screen. The phone screen shows a purple "
    "app with the white text 'MonDevis' and a document with a signature line. "
    "Shallow depth of field, realistic skin and fabric texture, documentary style, "
    "no text other than 'MonDevis'."
)


# Variante demandée par Jo le 02/11 : BOUCHE FERMÉE. C'est l'image de départ du
# lip-sync Wav2Lip (une bouche déjà ouverte produit un rendu « qui parle tout
# seul » et peu réaliste). Même pose que la prise 2 : téléphone tenu, index qui
# le montre.
PROMPT_CLOSED = (
    "Photorealistic vertical photo (9:16 portrait orientation) of the SAME man as in the "
    "reference image: short messy dark hair, short beard, mid-thirties. "
    "He is standing on a real construction site (raw plaster walls, wooden studs, sawdust, "
    "natural daylight coming from a window). He wears dark grey work trousers with tool "
    "pockets and a plain olive work t-shirt; his forearms and hands are a worker's hands. "
    "Framing from the knees up so the work trousers are clearly visible. "
    "He holds a smartphone in his right hand, slightly raised, and points at it with the "
    "index of his left hand, eyes on the screen. The phone screen shows a purple app with "
    "the white text 'MonDevis' and a document with a signature line. "
    "HIS MOUTH IS COMPLETELY CLOSED: lips together, relaxed neutral expression, no smile, "
    "no teeth visible, jaw relaxed. "
    "Shallow depth of field, realistic skin and fabric texture, documentary style, "
    "no text other than 'MonDevis'."
)


def load_key() -> str:
    key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if key:
        return key
    env = ROOT / ".env"
    for line in env.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("GOOGLE_AI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("❌ GOOGLE_AI_API_KEY absente")


def generate(key: str, out: Path, seed_note: str = "", prompt: str = PROMPT) -> None:
    ref_b64 = base64.b64encode(REF.read_bytes()).decode()
    payload = {
        "contents": [
            {
                "parts": [
                    {"inline_data": {"mime_type": "image/png", "data": ref_b64}},
                    {"text": prompt + (f" Variation: {seed_note}" if seed_note else "")},
                ]
            }
        ],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    r = requests.post(
        URL,
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=180,
    )
    if r.status_code != 200:
        raise SystemExit(f"❌ Google image HTTP {r.status_code}: {r.text[:300]}")

    data = r.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            out.write_bytes(base64.b64decode(inline["data"]))
            im = Image.open(out)
            print(f"✅ {out.name} — {im.width}x{im.height}")
            return
    raise SystemExit(f"❌ aucune image dans la réponse : {str(data)[:300]}")


def main() -> None:
    key = load_key()
    OUT_DIR.mkdir(exist_ok=True)

    if "--closed" in sys.argv:  # bouche fermée (base du lip-sync)
        generate(key, OUT_DIR / "scene-artisan-bouche-fermee.png", prompt=PROMPT_CLOSED)
        return

    n = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 2
    variations = [
        "",
        "his thumb clearly touching the signature line on the phone screen",
        "three-quarter view, phone held higher, signature line visible on screen",
    ]
    for i in range(n):
        out = OUT_DIR / f"scene-artisan-{i + 1}.png"
        generate(key, out, variations[i % len(variations)])


if __name__ == "__main__":
    main()
