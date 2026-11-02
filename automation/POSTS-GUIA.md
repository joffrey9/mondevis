# 📅 Mondevis — Générateur de posts hebdomadaires (CSV Publer)

> Génère N semaines de posts prêts à importer dans **Publer → Bulk Import**,
> au format exact de `publer_bulk_mondevis.csv` (mêmes colonnes, même média).

## 🚀 Usage

```bash
cd mondevis/automation

# 4 semaines, 3 posts/semaine (lundi → vendredi), écrit publer_bulk_<date>_4sem.csv
python3 generate_weekly_posts.py

# Aperçu sans écrire de fichier
python3 generate_weekly_posts.py --dry-run

# 8 semaines, 5 posts/semaine, à partir du 07/09/2026
python3 generate_weekly_posts.py --weeks 8 --per-week 5 --start 2026-09-07

# Sortie personnalisée
python3 generate_weekly_posts.py --weeks 6 --out publer_bulk_septembre.csv
```

## 📊 Créneaux de publication (dans l'ordre)

| # | Jour | Heure | Pourquoi |
|---|------|-------|----------|
| 1 | Lundi | 09:00 | Début de semaine, forte consultation pro |
| 2 | Mercredi | 17:30 | Milieu de semaine, fin de journée |
| 3 | Vendredi | 11:00 | Avant le week-end, décision rapide |
| 4 | Samedi | 10:00 | (si 4+/semaine) artisans disponibles |
| 5 | Mardi | 12:30 | Pause déjeuner |
| 6 | Jeudi | 18:00 | Fin de journée |
| 7 | Dimanche | 18:00 | Veille de semaine |

## 🧠 Banque de thèmes (20 posts)

Le générateur pioche sans répétition dans 20 thèmes (annonce, problème du devis
manuel, TVA auto, signature électronique, relances auto, Peppol Belgique, astuces,
questions d'engagement…). Au-delà de 20 posts, la banque est re-mélangée — les
thèmes reviennent mais jamais deux fois dans la même passe.

Chaque texte se termine par un set de hashtags tournant (#artisan #devis #btp…).

## 📥 Import dans Publer

1. Ouvrir **Publer → Bulk Import** (ou Posts → New → Bulk).
2. Importer le CSV généré (`publer_bulk_<date>_<N>sem.csv` dans `mondevis/`).
3. Vérifier l'aperçu (dates, médias, comptes) puis **Schedule**.

## ⚠️ Médias

- Par défaut, chaque post référence `post-annonce-1080x1350.png` (déjà présent
  dans `mondevis/`) — le CSV et l'image doivent être dans le même dossier lors
  de l'import.
- Pour varier les visuels : générer des variantes avec
  `python3 ../scripts/generate-post-visuals.py` puis passer `--media <fichier>`.

## 🔧 Options

```
--weeks N        nombre de semaines (défaut 4)
--per-week 1..7  posts par semaine (défaut 3)
--start AAAA-MM-JJ  date de début (défaut : prochain lundi)
--out FICHIER    fichier CSV de sortie
--media FICHIER  média par défaut
--seed N         graine aléatoire (défaut 42, reproductible)
--dry-run        aperçu sans écrire de fichier
```

## 🤖 Publication automatique via l'API Publer (sans import manuel)

L'API Publer n'est disponible que sur le plan **Business** (~10-21 $/mois selon comptes).
Les plans Free et Professional **n'incluent pas d'API**.

**Setup (une fois) :**
1. Plan Business sur Publer.
2. Settings → Access & Login → API Keys → Create (scopes : `posts`, `media`, `accounts`).
3. Exporter les variables :
   ```bash
   export PUBLER_API_KEY="ta_cle"
   export PUBLER_WORKSPACE_ID="ton_workspace"
   ```

**Usage :**
```bash
cd mondevis/automation

# Voir les comptes connectés (IG @mondedevis, FB MonDevis)
python3 publer_publish.py --list-accounts

# Programmer le CSV hebdomadaire automatiquement (dates exactes du CSV)
python3 publer_publish.py ../publer_bulk_2026-09-07_4sem.csv

# Voir le payload sans l'envoyer
python3 publer_publish.py --dry-run ../publer_bulk_2026-09-07_4sem.csv

# Publier tout immédiatement (déconseillé pour une campagne)
python3 publer_publish.py --publish-now ../publer_bulk_2026-09-07_4sem.csv
```

Le script envoie un bulk `POST /api/v1/posts/schedule` (jusqu'à 500 posts par appel),
vers Facebook + Instagram, avec les dates/heures exactes du CSV, puis interroge le job
jusqu'à confirmation de la programmation.

> 💡 Sans plan Business, le flux manuel (Bulk Import du CSV) fonctionne exactement pareil.
