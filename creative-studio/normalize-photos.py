#!/usr/bin/env python3
"""Normalise les photos avant génération vidéo (MoneyPrinterTurbo).

Les photos iPhone/Android contiennent une rotation dans les métadonnées EXIF.
L'outil vidéo ignore cette rotation -> photos à l'envers dans la vidéo.
Ce script applique la rotation dans les pixels et ré-écrit les fichiers.

Usage:
    python3 normalize-photos.py <dossier> [fichiers...]
    (sans fichier : tous les .jpg/.jpeg/.png du dossier)

Le script est appelé automatiquement par generate-video.sh avant chaque
lancement de génération vidéo.
"""
import os
import sys

from PIL import Image, ImageOps

folder = sys.argv[1] if len(sys.argv) > 1 else "."
files = sys.argv[2:] or sorted(
    f for f in os.listdir(folder)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
)

for name in files:
    p = os.path.join(folder, name)
    try:
        with Image.open(p) as im:
            if im.getexif().get(274, 1) == 1:
                print(f"OK   {name} (déjà droite)")
                continue
            im2 = ImageOps.exif_transpose(im)
            im2.save(p, "JPEG", quality=95)
            print(f"FIX  {name} -> {im2.size[0]}x{im2.size[1]}")
    except Exception as exc:
        print(f"ERR  {name}: {exc}")

print("Terminé.")