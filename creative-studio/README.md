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

## 🎙️ Voix off : edge-tts ou ElevenLabs

Edge-tts reste le choix gratuit par défaut, et c'est le seul qui propose une
voix **belge native** (`fr-BE-GerardNeural` homme, `fr-BE-CharlineNeural`
femme) sans clé ni coût. ElevenLabs s'ajoute en option pour la qualité de
synthèse, mais une clé est nécessaire et l'API consomme des crédits.

⚠️ **Limitation vérifiée sur une clé de niveau gratuit (2026-10)** : l'API
ElevenLabs ne retourne que **21 voix prédéfinies, toutes américaines ou
britanniques**. Les recherches `French`, `Belgian`, `France` et le filtre
`language=fr` renvoient **0 voix**. D'après la documentation ElevenLabs, les
voix françaises/belges de la Voice Library ne sont pas accessibles via l'API
sur l'offre gratuite. Autrement dit : **pas d'accent belge possible avec
ElevenLabs tant que la Voice Library n'est pas débloquée** — il faut alors
garder edge-tts pour la voix belge, ou passer sur une offre payante.

```bash
# Ajouter ELEVENLABS_API_KEY=... au .env racine (ne jamais la partager)
# Lister TOUTES les voix réellement accessibles avec la clé
python3 creative-studio/cli.py voice --list-eleven-voices

# Filtrer (affiche un message clair si rien ne correspond)
python3 creative-studio/cli.py voice --list-eleven-voices --eleven-search Belgian

# Comparer les deux MP3 avec exactement le même script
python3 creative-studio/cli.py voice --compare \
  --script "Bonjour, je suis artisan et je vous explique comment je travaille." \
  --eleven-voice-id JBFqnCBsd6RMkjVDRZzb --eleven-model eleven_multilingual_v2 \
  --voice fr-BE-GerardNeural --out-dir output/comparaison
# → output/comparaison/voice-edge.mp3 (belge, gratuit) et voice-elevenlabs.mp3

# Générer uniquement ElevenLabs, modèle haute qualité multilingue
python3 creative-studio/cli.py voice --engine elevenlabs \
  --eleven-voice-id ID_DE_LA_VOIX --script "Bonjour, voici mon atelier."

# Avatar Kling/Kie.ai : envoyer à Kling l'audio ElevenLabs choisi
python3 creative-studio/cli.py avatar --brand mondevis --kie-ai \
  --voice-engine elevenlabs --eleven-voice-id ID_DE_LA_VOIX \
  --script "Crée des devis pros en 2 minutes avec MonDevis."
```

Le modèle par défaut est `eleven_v4` (endpoint Text to Dialogue, une seule
voix), annoncé par ElevenLabs comme son modèle le plus expressif et de meilleure
qualité; teste aussi `eleven_multilingual_v2` pour une diction stable et
naturelle ou `eleven_v3` pour ses timings/sous-titres synchronisés. Les modèles
v4 n'exposent pas ces timings dans l'endpoint dialogue : `--captions` avec v4
est donc refusé plutôt que d'utiliser des sous-titres non alignés. Les voix
partagées de la Voice Library peuvent ne pas être accessibles via l'API sur
l'offre gratuite. Le tarif de l'API dépend du modèle et du forfait; vérifie-le
avant la comparaison. edge-tts reste accessible via `--engine edge` ou
`--voice-engine edge`. Pour choisir une voix française/belge, écoute l'aperçu
dans la Voice Library; la présence du label français ne garantit pas à elle
seule l'accent belge.

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

## 🎭 Avatars qui parlent (Google Veo ou Kling via Kie.ai)

La commande `avatar` génère ou réutilise un portrait et le fait parler face
caméra. Veo produit l'audio nativement. L'option Kie.ai utilise **Kling AI
Avatar Standard** : le script est synthétisé en MP3 avec le moteur vocal choisi, puis le
portrait et l'audio sont envoyés à Kie.ai; la commande attend le job et
récupère le MP4 final.

```bash
# Google Veo (comportement historique)
python3 creative-studio/cli.py avatar --brand mondevis \
  --script "Crée des devis pros en 2 minutes avec MonDevis."

# Kie.ai + Kling Standard (720p; consomme les crédits du compte Kie.ai)
python3 creative-studio/cli.py avatar --brand mondevis --kie-ai \
  --script "Crée des devis pros en 2 minutes avec MonDevis."

# Kling Pro (1080p, vérifier le tarif dans le compte Kie.ai avant lancement)
python3 creative-studio/cli.py avatar --brand mondevis --kie-ai \
  --kie-model kling/ai-avatar-pro \
  --script "Ton artisan de confiance, en ligne."

# Portrait existant pour garder le même personnage
python3 creative-studio/cli.py avatar --brand mondevis --kie-ai \
  --image posts_prets/personnage-mondevis.png \
  --script "Ton artisan de confiance, en ligne."

# Test local hors-ligne sans clé ni génération payante
python3 creative-studio/cli.py avatar --brand mondevis \
  --script "test" --mock
```

Pour Kie.ai, ajoute `KIE_API_KEY=...` dans le `.env` à la racine du workspace
(le fichier est ignoré par Git). La génération exige `edge-tts` (`pip install edge-tts`) par défaut; avec
`--voice-engine elevenlabs`, elle requiert aussi `ELEVENLABS_API_KEY` et
`--eleven-voice-id`. Les uploads Kie sont conservés
24 h et les vidéos générées 14 jours selon leur documentation; le MP4 est
immédiatement téléchargé dans `output/avatar-<marque>.mp4` (ou `--out`).
Vérifie le coût et les crédits dans ton compte Kie.ai avant de lancer
`--kie-ai` : contrairement à `--mock`, cette option soumet réellement un job.

Pour Veo, conserve `GOOGLE_AI_API_KEY` dans `.env` avec le billing Google
activé; Veo 3.1 génère des clips d'environ 8 s.

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
