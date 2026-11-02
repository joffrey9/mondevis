#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lip-sync de la prise 2 (P3 personnage) avec Wav2Lip.

Produit `output/p3-personnage-lips.mp4` : la scène fixe
`scene-artisan-bouche-fermee.png` (posée de face, lèvres fermées)
dont la bouche suit la voix off, à la même résolution et au même fps que le
montage (768x1344, 30 fps, 28 s). `build-p3-personnage.py` consomme ce fichier
comme source d'images : titre, QR et sous-titres sont ensuite posés par-dessus.

La voix est générée UNE fois dans `output/p3-voix.mp3` et réutilisée par le
montage : c'est ce qui garantit que la bouche reste synchro avec l'audio.

Lancer depuis mondevis/creative-studio :  python3 lipsync-p3.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

from studio import voiceover  # noqa: E402

DUR = 28
FPS = 30

SCENE = STUDIO_DIR / "output" / "scene-artisan-bouche-fermee.png"  # bouche fermée (02/11)
VOICE = STUDIO_DIR / "output" / "p3-voix.mp3"
WAV = Path("/tmp/p3-voix-28.wav")
OUT = STUDIO_DIR / "output" / "p3-personnage-lips.mp4"

WAV2LIP = STUDIO_DIR / "lipsync" / "Wav2Lip"
PY = STUDIO_DIR / "lipsync" / "venv" / "bin" / "python"
CKPT = "checkpoints/wav2lip_gan.pth"  # version GAN : bouche nettement plus nette

SCRIPT = (
    "Ce devis est signé. Je ne l'ai jamais facturé. "
    "Chaque année, les artisans laissent filer des milliers d'euros en devis oubliés : "
    "accepté à l'oral, jamais transformé en facture. "
    "Depuis que je fais mon devis sur mon téléphone, devant le client, "
    "il est signé avant même que je rentre à l'atelier. "
    "Ça s'appelle MonDevis. Tape mondedevis.eu, 14 jours gratuits."
)


def main() -> None:
    if not VOICE.is_file():
        print("🎙️  Voix off (une seule fois, réutilisée ensuite)…")
        voiceover.synthesize(SCRIPT, voiceover.DEFAULT_VOICE, VOICE)
    print(f"🎙️  Voix : {VOICE.name}")

    # Wav2Lip cale sa sortie sur la durée de l'audio : on complète par du
    # silence pour couvrir les 28 s du montage (bouche fermée à la fin).
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(VOICE),
         "-af", f"apad=whole_dur={DUR}", "-t", str(DUR), "-ar", "16000", "-ac", "1", str(WAV)],
        check=True,
    )

    print("👄 Lip-sync Wav2Lip (checkpoint GAN)…")
    tmp = WAV2LIP / "temp"
    tmp.mkdir(exist_ok=True)
    subprocess.run(
        [str(PY), "inference.py",
         "--checkpoint_path", CKPT,
         "--face", str(SCENE),
         "--audio", str(WAV),
         "--outfile", str(OUT),
         "--static", "True",
         "--fps", str(FPS),
         "--pads", "0", "10", "0", "0",
         "--out_height", "1344"],  # résolution native : aucun sur-échantillonnage
        cwd=WAV2LIP,
        check=True,
    )

    print(f"✅ {OUT} ({OUT.stat().st_size / 1e6:.1f} Mo)")


if __name__ == "__main__":
    main()
