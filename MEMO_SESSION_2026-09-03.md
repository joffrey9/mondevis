# MEMO SESSION — 2026-09-03 (handoff : reprise prochaine session)

> **SCOPE** : `MonDevis` uniquement.

## 🎯 Objectif (rapporté de la session du 02/09)

Reprogrammer toutes les publications Publer MonDevis après la réautorisation
d'un compte social : **Publer a effacé toutes les publications à venir**.

## ✅ Fait aujourd'hui (03/09)

### 1. 🖼️ Question de l'image — RÉSOLUE
- Jo a confirmé que **l'image apparaît dans la section Médias de Publer**.
- **Conclusion : pas besoin de ré-uploader le fichier depuis l'ordinateur.**
- Dans chaque post : « Upload Media » → Médiathèque → `post-annonce-1080x1350.png`.
- Le CSV référence `post-annonce-1080x1350.png` (nom local) : Publer ne lit pas
  un fichier local — d'où l'importance de prendre l'image dans la Médiathèque.
- L'image n'est pas accessible publiquement (`mondedevis.eu/...png` → 404) — non bloquant.

### 2. 📅 Méthode retenue — MANUELLE (pas de bulk)
- **Plan gratuit Publer** : pas d'import CSV en masse ni d'API (Jo l'a confirmé).
- **Limite : 10 posts programmés max par compte** → 13 posts > 10.
  → Faire en **2 vagues** : posts 1-10 (04/09 → 25/09) puis 11-13 dès publications.
- Seul le **Teaser 3 (ven 04/09 11:00)** reste des teasers (1 et 2 : dates passées).

### 3. 📄 Fichiers préparés (dossier `mondevis/`)
| Fichier | Rôle |
|---|---|
| `PUBLIER-REPRISE-2026-09-04.txt` | **Texte complet à coller** pour chacun des 13 posts (date/heure + caption) |
| `SUIVI-REPROGRAMMATION-2026-09-04.md` | Tableau récap des 13 posts avec cases ✅ à cocher |
| `CHECKLIST-POST-PUBLER-2026-09-04.md` | Étapes pas-à-pas (comptes IG+FB, image, lien, date/heure) + erreurs à éviter |
| `publer_bulk_2026-09-04_reprise.csv` | Version CSV fusionnée (Teaser 3 + 12 posts) — si un jour passage au bulk |

### 4. 🕵️ Teaser 1 & 2 — non vérifiables depuis les fichiers locaux
- Aucune trace locale (logs/CSV/MEMO) ne confirme leur publication effective.
- Aucun token Publer/Meta dans `.env` → impossible de vérifier par script.
- **À vérifier visuellement demain** : calendrier Publer (ou historique 24 h —
  limité sur free) ou directement les comptes IG (@mondedevis) / FB (MonDevis).

## 🔍 À faire à la reprise (dans l'ordre)

1. **Vérifier si teaser 1 (31/08 09:00) et teaser 2 (02/09 17:30) sont passés**
   → regarder le fil IG @mondedevis et la page FB MonDevis.
   → S'ils ne sont PAS passés : les publier maintenant (textes dans `publer_bulk_2026-08-31_Teasers.csv`).
2. **Créer le post 1 — Teaser 3 (ven 04/09 11:00)** : c'est le premier post
   critique après la réautorisation (aujourd'hui = 03/09, il tombe demain matin).
3. **Créer les posts 2-10** (vague 1) puis **11-13** (vague 2) avec le fichier
   `PUBLIER-REPRISE-2026-09-04.txt`, en cochant `SUIVI-REPROGRAMMATION-2026-09-04.md`.

## ⚠️ Rappels MonDevis à garder en tête
- **Règle anti-spam WhatsApp** : attendre les retours de Jo sur les envois du
  dimanche 30/08 avant toute nouvelle vague de messages batch.
- Lancement du produit officiellement lundi 07/09 → posts 07/09→02/10 en place.
