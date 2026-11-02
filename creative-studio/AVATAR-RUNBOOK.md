# 🎬 Avatar réel qui parle — runbook (clip Reel n°2 généré ✅ 17/09)

> **Objectif** : vidéo UGC 9:16 avec un avatar **réel** (image Pinterest/réelle) dont la
> **bouche bouge réellement** (lip-sync natif), disant le script Mondevis.
> ~~Bloqué sur : crédits de prépaiement Google AI épuisés~~ → **rechargés par Jo le 17/09**.

## ✅ Clip généré le 17/09/2026 — variante C

### ⭐ V5 FINALE — VALIDÉE PAR JO LE 17/09 — `output/ugc-mondevis-avatar-reel2-v5-final.mp4`
- **C'est la version retenue pour le Reel n°2.** Bouche nette (checkpoint GAN),
  lèvres synchronisées sur la voix belge edge-tts (`variante-C.mp3`),
  logo Mondevis 240 px bas droit, 1080×1920, 7,2 s.
- 🧹 Nettoyage du 17/09 (décision Jo) : toutes les anciennes versions supprimées
  (V1, V2 raw/final, V3, V4, intermédiaires lipsync) — **sauf `avatar-source-clean.png`**.
- Restent dans `output/` : V5 finale · `avatar-source-clean.png` (image source
  nettoyée, réutilisable) · `watermark-mondevis.png` (overlay logo, réutilisable)
  · VO edge-tts du 16/09 (référence voix/texte).
- Retour Jo sur la V4 : « les lèvres suivent bien, mais défaut au niveau de la bouche »
  (défaut classique du checkpoint de base).
- **Correction : checkpoint `wav2lip_gan.pth`** (version GAN du même modèle — bouche
  nettement plus nette, même lip-sync). Même chaîne : inference GAN → finalize.
- Si Jo valide : la V5 devient le Reel n°2. Les deux checkpoints restent dispo
  (base + GAN) pour les prochains clips.

### V4 (17/09, lip-sync réel, superceded) — `output/ugc-mondevis-avatar-reel2-v4-final.mp4`
- Retour Jo sur la V3 : « les lèvres ne suivent pas lorsqu'il parle » (VO posée
  après coup sur un lip-sync Veo synthétisé sur un autre audio).
- **Solution : vrai lip-sync local avec Wav2Lip** (gratuit, CPU Intel suffisant,
  ~20 s de calcul) — chaîne complète :
  1. `lipsync/Wav2Lip/inference.py` (fork justinjohn0306, venv `lipsync/venv`)
     sur la vidéo Veo V2 brute + `variante-C.mp3` (voix belge edge-tts) →
     **lèvres recalculées sur l'audio réel**, sortie 720×1280 (`--out_height 1280`,
     ne PAS laisser le défaut 480 = trop flou)
  2. `finalize-avatar.py` : delogo logo d'origine + upscale 1080×1920 + pastille
     Mondevis 240 px coin bas droit
- Poids téléchargés (dans `lipsync/Wav2Lip/`) : `checkpoints/wav2lip.pth` (416 Mo,
  HF numz/wav2lip_studio → chemin `Wav2lip/wav2lip.pth`),
  `checkpoints/mobilenet.pth` (1,7 Mo, HF cncbec/wav2lip),
  `face_detection/detection/sfd/s3fd.pth` (86 Mo, HF camenduru/Wav2Lip)
- ⚠️ Limite connue : la zone bouche est régénérée en 96 px par le modèle → léger
  adoucissement du contour des lèvres au zoom, invisible en lecture Reel.
- Chaîne réutilisable pour le prochain clip (commande complète dans l'historique
  de session du 17/09, runbook V2/V3 ci-dessous pour les étapes).

### V3 (17/09, superceded par V4) — `output/ugc-mondevis-avatar-reel2-v3-final.mp4`
- Retours Jo sur la V2 : voix **encore canadienne** (prompt non respecté par Veo) +
  logo pas assez bas (il doit **recouvrir** le logo d'origine).
- Corrections V3 (aucun nouveau passage Veo, zéro crédit dépensé) :
  - **Voix** : remplacement de l'audio Veo par la VO edge-tts **fr-BE-GerardNeural**
    validée par Jo (`output/variante-C.mp3`, 7,2 s sur 8 s) → **accent belge garanti**
  - **Delogo** : logo d'origine **gomé** de la vidéo (interpolation ffmpeg,
    zone 0.58,0.84 → 1.0,1.0 du cadre source)
  - **Logo Mondevis** : pastille **240 px** collée au coin bas droit (marge 30 px,
    position 810,1650) → recouvre l'emplacement du logo d'origine
- Commande : `python3 finalize-avatar.py output/ugc-mondevis-avatar-reel2-v2.mp4 --audio output/variante-C.mp3 -o output/ugc-mondevis-avatar-reel2-v3-final.mp4`
- ⏳ À valider par Jo : accent (garanti belge), lip-sync (VO posée après coup,
  légèrement décalée possible), position du logo.

### V2 (17/09, après retours Jo) — `output/ugc-mondevis-avatar-reel2-v2-final.mp4`
- Retours Jo sur la V1 : voix **canadienne** (Veo choisit sa voix librement) + image
  **saturée en fin de clip** + faux logo en bas à droite (venant de l'image source).
- Corrections appliquées :
  - `prep-avatar-source.py` : ancien logo **flouté** dans l'image source
    (`output/avatar-source-clean.png`, zone 446,1100 → 705,1241)
  - Prompt Veo (`cli.py`) : **accent belge imposé**, arrière-plan/éclairage figés,
    « aucun texte, logo ni marque supplémentaire »
  - `finalize-avatar.py` : upscale **1080×1920** + **vrai logo Mondevis** en pastille
    arrondie bas droite (au-dessus de l'UI IG)
- Chaîne complète : prep → Veo → finalize. Si l'accent n'est toujours pas belge :
  retenter (probabiliste), sinon remplacer l'audio par `output/variante-C.mp3`
  (edge-tts fr-BE-GerardNeural) au prix d'un lip-sync légèrement décalé.

### V1 (archivée) — `output/ugc-mondevis-avatar-reel2.mp4`

- Fichier : `output/ugc-mondevis-avatar-reel2.mp4` (2,4 Mo)
- Image utilisée : `avatar mondedevis final.png` · modèle `veo-3.1-fast-generate-preview`
- Script : variante C — « Ton client signe sur son téléphone, toi tu enchaînes le
  chantier. Devis pro en deux minutes avec MonDevis. »
- Checks : durée **8,00 s** ✅ · piste audio ✅ · 9:16 (720×1280) ✅
- ⏳ Reste à valider par Jo : **lip-sync visuel** (regarder la vidéo)
- Note : rendu en 720p (Veo fast). Si validé et qu'on veut du 1080p pour le final :
  régénérer sans `--veo-fast` (modèle standard) ou upscaler en post.

## ✅ Voix off (VO) prêtes — générées le 16/09/2026 (edge-tts, gratuit)

Fichiers dans `output/` (voix `fr-BE-GerardNeural`, homme belge) :

- `avatar-mondevis-vo.mp3` + `.srt` — **12,48 s**, script complet du runbook
  (version longue, pour montage Reel n°2 ou vidéo > 8 s)
- `avatar-mondevis-vo-8s.mp3` + `.srt` — **7,94 s** ✅ limite Veo 8 s respectée —
  script court : « Fini les devis jusqu'à minuit. Avec MonDevis, tes devis sont
  envoyés et signés en deux minutes, depuis ton téléphone. »

> ⚠️ Veo génère son propre audio en lip-sync : si l'avatar Veo est retenu,
> la VO edge-tts sert de **référence voix/texte** (ou de remplacement audio
> en post si le lip-sync natif déçoit). Pour un montage montage fait main :
> poser `avatar-mondevis-vo.mp3` sur les plans de `REEL-2-CHECKLIST-TOURNAGE.md`.

## Prérequis (déjà vérifiés)

- ✅ `GOOGLE_AI_API_KEY` présente et chargée par `providers.py` (`has_google_key() = True`)
- ✅ `cli.py avatar` accepte `--image` → passe l'image **existante** à Veo (pas de régénération IA du personnage)
- ✅ Image personnage prête : `mondevis/creative-studio/avatar mondedevis final.png` (1.4 Mo)
  — remplacer par l'image réelle copiée de Pinterest le moment venu (même commande, autre `--image`)
- ✅ Veo 3.1 fait le lip-sync **nativement** (audio généré par le modèle, bouche synchronisée) — pas de pipeline Wav2Lip/SadTalker séparé
- ✅ Modèle : `veo-3.1-fast-generate-preview` (2× moins cher que le standard, pour itérer)

## ⛔ L'erreur actuelle

```
Google Veo → HTTP 429: Your prepayment credits are depleted.
Please go to AI Studio at https://ai.studio/projects to manage your project and billing.
```

→ Recharger : https://ai.studio/projects → le projet de la clé → Billing / prépaiement.
Veo n'a pas de tier gratuit : facturation à la seconde. Veo 3.1 Fast ≈ quelques dizaines
de centimes par clip de 8 s.

## ▶️ Commande prête à lancer (dès crédits rechargés)

> **Texte CHOISI par Jo le 16/09** : variante C (7,2 s validée en VO edge-tts,
> voix `fr-BE-GerardNeural` — `output/variante-C.mp3`, écoutée et validée).

```bash
cd "/Users/macwdbsequoia/Desktop/dossier Freebuff/mondevis/creative-studio"

python3 cli.py avatar --brand mondevis --veo-fast --format 9x16 \
  --image "avatar mondedevis final.png" \
  --script "Ton client signe sur son téléphone, toi tu enchaînes le chantier. Devis pro en deux minutes avec MonDevis." \
  --out output/ugc-mondevis-avatar-reel2.mp4
```

> ⚠️ Script en français propre, **≤ 8 s** (limite Veo). Variantes A/B écartées le 16/09
> (Jo a retenu C après écoute) — MP3 de référence : `output/variante-A.mp3`,
> `output/variante-B.mp3`, `output/variante-C.mp3`.
> Pour utiliser une **image réelle copiée de Pinterest** : la télécharger, puis remplacer
> `--image "avatar mondedevis final.png"` par le chemin du fichier téléchargé.

## Après génération — vérifications

```bash
ffprobe -v error -show_entries format=duration -show_entries stream=codec_type \
  -of default=noprint_wrappers=1 output/ugc-mondevis-avatar-2min.mp4
```

- [ ] Durée ~8 s (limite Veo 3.1)
- [ ] Piste audio présente (`codec_type=audio`) — c'est l'audio natif Veo avec la voix de l'avatar
- [ ] Lip-sync visuellement correct (lire la vidéo)
- [ ] 9:16 (1080×1920)

## Enchaînement prévu (après validation de l'avatar)

1. Si le clip avatar est validé : l'utiliser comme Reel principal
   (guide : `mondevis/GUIDE-REEL-RELANCES.md`, remplace `avatar-mondevis-final.mp4`).
2. Sous-titres/CTA éventuels en post : réutiliser `burn_captions` du studio
   (`cli.py` ne brûle pas les captions sur le clip Veo — le faire en 2e passe si besoin).
3. Coûts : itérer en `--veo-fast`, ne passer au modèle standard que pour le final.
