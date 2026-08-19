# 🎨 Creative Studio — générateur images/vidéo multi-marques

Générateur **générique** (n'importe quelle marque via un fichier de charte JSON)
qui combine :

1. **IA générative** : image (FLUX via fal.ai **payant** ou **Pollinations gratuit**) ou clip vidéo (Kling/Veo via fal.ai) depuis un prompt ;
2. **Habillage charte graphique** : logo, couleurs, titre, CTA, WhatsApp, barre de marque appliqués automatiquement (PIL) ;
3. **Montage vidéo local** : image animée (zoom lent Ken Burns + charte statique) en MP4 via ffmpeg — zéro coût IA.

## ⚡ Démarrage rapide

```bash
# Lister les marques disponibles
python3 creative-studio/cli.py brands

# Image 1:1 avec la charte Fortemps (MOCK local, sans clé API)
python3 creative-studio/cli.py image --brand fortemps \
  --prompt "escalier en bois massif, lumière chaude du soir, atelier artisanal" \
  --headline "Un escalier, une œuvre d'art" \
  --subtext "Conception sur-mesure en bois massif" \
  --mock

# Image 9:16 (gratuite via Pollinations par défaut ; fal.ai si FAL_KEY + solde)
python3 creative-studio/cli.py image --brand fortemps --format 9x16 \
  --prompt "cuisine moderne en bois clair, photoréaliste" \
  --headline "Cuisines sur-mesure"

# Vidéo Reels 9:16 locale (image IA + zoom + charte) — MOCK sans clé
python3 creative-studio/cli.py video --brand fortemps \
  --prompt "atelier de menuiserie, copeaux de bois dorés" \
  --headline "30 ans de savoir-faire" --duration 10 --mock

# Vidéo courte « faceless » complète : voix off + sous-titres + musique + charte (GRATUIT)
python3 creative-studio/cli.py video --brand fortemps --format 9x16 \
  --prompt "atelier de menuiserie, copeaux de bois dorés" \
  --headline "Ce menuisier change tout" \
  --script "Tu cherches un escalier sur-mesure ? Découvre le savoir-faire Fortemps." \
  --captions --music audio/ambient_reel.mp3

# Pub produit (bénéfices + prix + voix off + sous-titres)
python3 creative-studio/cli.py video --brand fortemps --format 9x16 \
  --prompt "escalier en bois massif, lumière chaude" \
  --headline "L'escalier qui sublime ton intérieur" \
  --benefits "Bois massif|Sur-mesure|Pose incluse" --price "Dès 2 990 €" \
  --script "Un escalier en bois massif, conçu sur-mesure et posé chez toi." --captions

# Batch A/B testing : 3 variantes, un hook différent chacune, même fond + script
python3 creative-studio/cli.py batch --brand fortemps --format 9x16 \
  --prompt "atelier de menuiserie, copeaux de bois dorés" \
  --script "Découvre le savoir-faire Fortemps, en bois massif." \
  --hooks "Ce menuisier change tout|Le secret des menuisiers|Ton escalier sur-mesure" \
  --captions --music audio/ambient_reel.mp3

# Clip vidéo IA (fal.ai, FAL_KEY requise)
python3 creative-studio/cli.py video --brand fortemps \
  --prompt "cinematic shot of a carpenter working oak wood, warm light" \
  --clip-ia
```

## 🎙️ Voix off + sous-titres (gratuit)

Le mode vidéo locale peut narrer un script et brûler des sous-titres synchronisés,
sans clé ni coût :

- `--script "..."` → voix off neuronale Microsoft (**edge-tts**, gratuit).
- `--voice fr-BE-GerardNeural` → voix par défaut (homme, accent belge). Autres :
  `fr-BE-CharlineNeural` (femme), `fr-FR-HenriNeural` (homme, France), `en-US-...`.
- `--captions` → sous-titres synchronisés mot à mot, incrustés en bas.
- `--benefits "A|B|C"` + `--price "19,99 €"` → template pub produit.

Dépendance : `pip install edge-tts` (une seule fois). La durée de la vidéo
s'ajuste automatiquement à la voix off (+ marge de fin).

## 🎵 Musique de fond (optionnel)

`--music <fichier.mp3|wav>` boucle une musique de fond sur la vidéo à ~15 % de
volume, sous la voix off. Trois pistes libres de droits sont déjà dans `audio/` :
`ambient_reel.mp3` (recommandée), `acoustic_real.mp3`, `soundhelix.mp3`.

## 🔁 Batch A/B testing (hooks)

`batch` génère une vidéo par hook avec le même fond + script, pour tester
plusieurs accroches et voir laquelle performe :

```bash
python3 creative-studio/cli.py batch --brand mondevis --format 9x16 \
  --prompt "artisan dans son atelier" \
  --script "Crée des devis pros en 2 minutes avec MonDevis." \
  --hooks "Fini les devis papier|2 minutes chrono|Tes clients signent en ligne" \
  --captions --music audio/ambient_reel.mp3
```

Sorties : `output/video-<marque>-01-<hook>.mp4`, `-02-…`, etc.

## 🔑 Fournisseurs IA : gratuit (Pollinations) ou payant (fal.ai)

**Par défaut, l'image est gratuite** via **Pollinations.AI** (modèle `flux`,
aucune clé, aucune carte, aucune inscription) :

```bash
python3 creative-studio/cli.py image --brand fortemps \
  --prompt "escalier en bois massif, lumière chaude" --provider pollinations
```

Pour la qualité fal.ai (option payante) :

1. Crée un compte sur **fal.ai**, crédite un solde (prépayé, pas de version
   gratuite pérenne) et génère une clé : <https://fal.ai/dashboard/keys>
2. Ajoute-la dans `.env` à la racine du workspace :

```text
FAL_KEY=votre_cle_ici
```

3. Avec la clé, `--provider auto` (défaut) tente fal.ai puis **bascule
   automatiquement sur Pollinations gratuit** si le solde fal.ai est épuisé.
   `--provider fal` force fal.ai, `--provider pollinations` force le gratuit.
4. Sans clé ni `--mock`, l'image passe directement sur Pollinations.

Coût fal.ai indicatif : ~0,01–0,04 $ par image FLUX, quelques $ par clip vidéo
selon le modèle. Modèles configurables via `FAL_IMAGE_MODEL` / `FAL_VIDEO_MODEL`
(voir `studio/providers.py`).

## 🎭 Avatars qui parlent (Google Veo 3.1)

Pour l'UGC « personne face caméra », la commande `avatar` génère l'image du
personnage (charte `character`) puis l'anime via **Google Veo image→vidéo** : le
personnage **parle ton script** (audio natif + lèvres synchronisées, ~8 s).

```bash
# Avatar : le personnage MonDevis parle face caméra
python3 creative-studio/cli.py avatar --brand mondevis \
  --script "Crée des devis pros en 2 minutes avec MonDevis."

# Réutiliser une image de personnage existante (consistance entre vidéos)
python3 creative-studio/cli.py avatar --brand mondevis \
  --image posts_prets/personnage-mondevis.png \
  --script "Ton artisan de confiance, en ligne."

# Clip texte→vidéo (sans personnage fixe) via Google Veo
python3 creative-studio/cli.py video --brand mondevis \
  --prompt "drone shot d'un atelier, lumière chaude" --clip-veo

# Test hors-ligne sans clé ni Veo
python3 creative-studio/cli.py avatar --brand mondevis \
  --script "test" --mock
```

Prérequis : `GOOGLE_AI_API_KEY` dans `.env` + **billing activé** (l'API vidéo
Google n'a pas de tier gratuit, paiement à la seconde). Veo 3.1 génère des clips
de **8 s** (720p/1080p/4k, 9:16 ou 16:9).

## 🏷️ Ajouter une marque (2 min)

1. Copie `creative-studio/brands/exemple.json` → `creative-studio/brands/mamarque.json`
2. Renseigne : nom, logo (chemin relatif), couleurs (hex), polices, CTA WhatsApp, tailles
3. Lance : `python3 creative-studio/cli.py image --brand mamarque --prompt "..."`

Champs de la charte :

| Clé | Rôle |
|-----|------|
| `name` / `handle` | Nom affiché / identifiant CLI |
| `logo` | Chemin du logo (relatif au dossier brands/) |
| `colors` | `bg_dark`, `gold_mid`, `gold_light`, `copper`, `cta_bg`, `cta_text`, `white`, `white_dim` |
| `fonts` | Chemins de polices (fallback système) |
| `cta` | `label`, `whatsapp`, `brand_bar` |
| `overlay` | Tailles de texte, position/opacité du logo, opacité bande |
| `sizes` | Formats nommés (`1x1`, `9x16`) |
| `character` | *(optionnel)* Description du personnage ajoutée automatiquement devant le prompt |

### 🧑 Personnage par défaut (`character`)

Une charte peut définir un `character` : sa description est **préfixée au prompt**
automatiquement (ex. MonDevis → jeune artisan face caméra). Pour désactiver ce
préfixe ponctuellement, ajoute `--no-character` à la commande.

```bash
# Ajoute automatiquement le personnage MonDevis devant le contexte
python3 creative-studio/cli.py video --brand mondevis \
  --prompt "dans son atelier, lumière chaude" --script "..." --captions

# Sans le personnage (visuel produit pur)
python3 creative-studio/cli.py image --brand mondevis \
  --prompt "produit blanc sur fond épuré" --no-character
```

## 🧪 Tests

```bash
cd creative-studio && python3 -m unittest discover -s tests -v
```

## 🗂️ Arborescence

```
creative-studio/
├── cli.py                  # CLI : image / video / brands
├── brands/
│   ├── fortemps.json       # Charte Fortemps Menuiserie (réelle)
│   ├── mondevis.json       # Charte MonDevis (SaaS devis, gradient indigo→rose→orange)
│   ├── logo-mondevis.png   # Logo MonDevis
│   └── exemple.json        # Modèle générique pour une nouvelle marque
├── studio/
│   ├── brand.py            # Chargement/validation des chartes
│   ├── providers.py        # fal.ai (image + vidéo) + Pollinations + mode mock
│   ├── overlay.py          # Habillage charte PIL (couche transparente)
│   ├── video.py            # Montage Ken Burns + sous-titres + mixage audio (ffmpeg)
│   └── voiceover.py        # Voix off edge-tts + SRT synchronisé
└── tests/
    └── test_studio.py      # Tests unittest (stdlib, sans dépendance)
```

> ⚠️ Le studio génère des **visuels** : vérifie toujours les droits d'usage des
> contenus générés par IA et la charte de chaque marque avant publication.
