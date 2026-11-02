#!/bin/bash
# ============================================================
#  Ajoute une carte de fin (end card) à une vidéo, avec fondu.
#
#  Usage :
#    ./add-endcard.sh <video.mp4> <endcard.png> [durée_carte]
#    (durée par défaut : 4 secondes)
#
#  Résultat : <video>-avec-endcard.mp4 (à côté de la vidéo source)
# ============================================================
set -e
cd "$(dirname "$0")"

VIDEO="$1"
ENDCARD="$2"
DUR="${3:-4}"

[ -f "$VIDEO" ] || { echo "ERREUR : vidéo introuvable : $VIDEO"; exit 1; }
[ -f "$ENDCARD" ] || { echo "ERREUR : carte de fin introuvable : $ENDCARD"; exit 1; }

OUT="${VIDEO%.mp4}-avec-endcard.mp4"

echo "==> Ajout de la carte de fin (${DUR}s) à $(basename "$VIDEO")..."

# 1) Durée de la vidéo source
VDUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO")

# 2) Fondu sortant sur la fin de la vidéo (0,5 s vers le noir), puis carte
#    avec fondu entrant depuis le noir -> transition douce.
ffmpeg -y -v error \
  -i "$VIDEO" \
  -loop 1 -t "$DUR" -i "$ENDCARD" \
  -filter_complex "\
    [0:v]fps=30,format=yuv420p,fade=t=out:st=$(echo "$VDUR - 0.5" | bc):d=0.5[vmain];\
    [1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,format=yuv420p,fade=t=in:st=0:d=0.6[vcard];\
    [vmain][vcard]concat=n=2:v=1:a=0[vout]" \
  -map "[vout]" -map 0:a \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy \
  "$OUT"

echo "==> Terminé : $OUT"
