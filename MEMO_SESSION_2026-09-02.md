# MEMO SESSION — 2026-09-02 (handoff : reprise prochaine session)

> **SCOPE** : `MonDevis` uniquement (le produit qu'on vend).

## 🎯 Objectif de la prochaine session

**Reprogrammer toutes les publications Publer MonDevis** : suite à la
réautorisation d'un compte social (il n'envoyait plus les publications),
Publer a **effacé toutes les publications à venir**. Il faut tout recréer.

## 🔍 Ce qui était programmé (à remettre dans Publer)

### 1. Teasers pré-lancement — semaine 31/08 → 06/09
Fichier source : **`publer_bulk_2026-08-31_Teasers.csv`**

| Date | Heure | Post |
|---|---|---|
| Lun 31/08 | 09:00 | Teaser 1 — le problème (déjà publié ? à vérifier) |
| Mer 02/09 | 17:30 | Teaser 2 — l'outil (aujourd'hui, déjà passé) |
| Ven 04/09 | 11:00 | Teaser 3 — l'appel aux testeurs **→ à reprogrammer** |

### 2. Lancement — 4 semaines, 12 posts (07/09 → 02/10)
Fichier source : **`publer_bulk_2026-09-07_4sem.csv`**

| J | Date | Heure | Post |
|---|---|---|---|
| 1 | Lun 07/09 | 09:00 | Appel aux testeurs |
| 2 | Mer 09/09 | 17:30 | Annonce de lancement |
| 3 | Ven 11/09 | 11:00 | Mobile sur le chantier |
| 4 | Lun 14/09 | 09:00 | Relances automatiques |
| 5 | Mer 16/09 | 17:30 | Fierté artisanale |
| 6 | Ven 18/09 | 11:00 | Bénéfices concrets |
| 7 | Lun 21/09 | 09:00 | Devis depuis le modèle |
| 8 | Mer 23/09 | 17:30 | Le problème du devis manuel |
| 9 | Ven 25/09 | 11:00 | Factures Peppol Belgique |
| 10 | Lun 28/09 | 09:00 | Soirée administrative |
| 11 | Mer 30/09 | 17:30 | Gain de temps chiffré |
| 12 | Ven 02/10 | 11:00 | Signature électronique |

Tous les posts : média unique `post-annonce-1080x1350.png` (présent ✅),
lien `https://mondedevis.eu`, réseaux **Facebook + Instagram**,
compte Instagram `@mondedevis (IG)`.

## 🛠️ Comment reprogrammer (2 options)

### Option A — Reprise automatique via l'API (si plan Business + clé API)
```bash
cd mondevis/
# vérifier les comptes connectés
python3 automation/publer_publish.py --list-accounts
# reprogrammer les 12 posts du lancement
python3 automation/publer_publish.py publer_bulk_2026-09-07_4sem.csv
# et les teasers
python3 automation/publer_publish.py publer_bulk_2026-08-31_Teasers.csv
```
Prérequis : `PUBLER_API_KEY` + `PUBLER_WORKSPACE_ID` (Settings → Access & Login → API Keys).
⚠️ L'API n'existe que sur le plan **Business**.

### Option B — Import manuel dans Publer (plan Free/Professional)
1. Publer → **Calendar / Planner** → bouton **Create** / **Bulk schedule**.
2. Importer le CSV concerné (colonnes Date, Text, Link, Media URL…).
3. Vérifier comptes Facebook + Instagram, ensuite valider.
4. Il faut peut-être **ré-uploader le média** `post-annonce-1080x1350.png`
   (l'import CSV référence le fichier local — soit le joindre à chaque post,
   soit l'avoir déjà dans la Mediatheque Publer).

## ✅ Fait aujourd'hui (02/09) — autre projet
Projet **BOT ETF** : reconfiguration Gotify terminée et pushée
(`feat(etf-bot): notifications push GoTify sur téléphone` — `2972ef0`).
Docker Desktop : démarrage auto au login activé (`AutoStart: true`).

## ⚠️ Rappels MonDevis à garder en tête
- **Règle anti-spam WhatsApp** : attendre les retours de Jo sur les envois
  du dimanche 30/08 avant toute nouvelle vague de messages batch.
- Prochain post critique : **Teaser 3 (ven 04/09 11:00)** — le premier qui
  tombe après la réautorisation. Priorité n°1 demain pour ne pas le rater.