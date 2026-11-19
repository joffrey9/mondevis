# MEMO SESSION — 2026-08-31 (handoff : reprise prochaine session)

> **SCOPE** : `~/Desktop/MonDevis` uniquement (MonDevis = le produit qu'on vend).

## 🎯 Objectif de la session

Acquisition de clients Belgique : préparer les messages de contact pour
les leads des batches 2-4 et clôturer proprement la session.

## ✅ Fait aujourd'hui

### 1. 📨 Messages de contact batch 2-4 — CRÉÉS
- Nouveau fichier : **`messages-belgique-batch2-4.md`**
- 24 leads couverts (du #11 au #34), format identique à `messages-belgique.md`
  (signature Joffrey, angle TVA belge auto + Peppol, lien mondedevis.eu) :
  - **Batch 2 — Charleroi** (#11-#20) : 10 leads (plombiers / électriciens / chauffagiste)
  - **Batch 3 — Bruxelles** (#21-#25) : 5 électriciens — dont 4 avec téléphone ✅
  - **Batch 4 — Limbourg/Tournai** (#26-#34) : 9 menuisiers — dont 2 avec téléphone ✅
- 💡 **16 leads sans téléphone/email dans le CSV** — marqués « à chercher »
  (vérifier PagesJaunes / Google Maps / Meta avant envoi)

### 2. 📋 Réponses types WhatsApp + R6/R7 — PRÊTES
- `automation/triage.py` : réponses R1→R7 (intéressé / question / objection / bêta / bruit)
- **R6 (nouveau)** : refus poli — courtois, lien rappelé, porte laissée ouverte
- **R7 (nouveau)** : « pas maintenant, plus tard » — relance douce sans insister
- Appel : `python3 automation/triage.py reponse R6` (ou R1..R7, R2-prix/tva/...)
- Quand les retours WhatsApp arrivent : `python3 automation/triage.py add` affiche la réponse à copier

### 3. 🔗 Liens wa.me générés pour les téléphones disponibles
- #22 Le Cuivre Électrique → +32485755227
- #23 Houselec → +32473620091 (email info@houselec.be)
- #24 COSTI ELEC → +32489986209
- #25 Allo Electricien → +32465732348 (email info@allo-electricien.be)
- #26 Manu Pointtillieux → +32496346727 (email manu@pointtillieux.be)
- #34 Nemwood → +32489330544 (email contact@nemwood.be)

## 📋 À faire à la reprise (dans l'ordre)

> ⚠️ **CONSTRAINTE WhatsApp** (décision 31/08) : ne PAS envoyer de nouveaux messages batch
> tant que Jo n'a pas de retours sur les envois faits **dimanche 30/08** (vishe des 10 premiers leads
> belges). Ne pas relancer de vague avant d'avoir la réponse de Jo.

1. **Compléter les téléphones manquants** des 16 leads « à chercher »
   (PagesJaunes / Google Maps / site officiel) → mettre à jour les CSV
   `leads-batch2/3/4.csv` (colonnes phone/email)
2. **Vérifier les numéros** des 6 leads avec téléphone (confirmés ?)
3. **Publier les posts réseaux** — voir calendrier (§ calendrier) :
   premier post le **lundi 07/09 à 09:00** dans Publer
4. **Envoi WhatsApp** : vidéo d'abord + texte, espacé de 3-5 min,
   journaliser via `python3 triage.py add --quick`
5. **Relances J+3** après envoi : `python3 generate_relances.py --due`

## ⚠️ Pièges / rappels
- **Règle anti-spam** : 1 vidéo + 1 message par conversation, pas de relance avant 5-7 jours
- Vidéo avatar à joindre : `mondevis/output/avatar-mondevis-final.mp4`
- Les leads `sent/closed` sont exclus automatiquement des relances (generate_relances)
- `.env.local` = secrets → jamais committé

## ⏰ Rappel automatique
- LaunchAgent `eu.mondevis.rappel-quotidien` actif → notification macOS chaque matin 05:30
- `python3 automation/rappel.py --semaine` pour la vue des 7 prochains jours

## 🗓️ Calendrier de publication (Publer) — 2 premières semaines
| Date | Heure | Post |
|---|---|---|
| Lun 07/09 | 09:00 | Post 1 — Appel aux testeurs |
| Mer 09/09 | 17:30 | Post 2 — Présentation produit |
| Ven 11/09 | 11:00 | Post 3 — Mobile sur le chantier |
| Lun 14/09 | 09:00 | Post 4 — Relances automatiques |
| Mer 16/09 | 17:30 | Post 5 — Fierté artisanale |
| Ven 18/09 | 11:00 | Post 6 — Bénéfices concrets |
> Suite (posts 7-12) jusqu'au 02/10 : voir `rappel.py` / `publer_bulk_2026-09-07_4sem.csv`

## 🧪 Commandes utiles
```bash
cd ~/Desktop/MonDevis
python3 automation/rappel.py --semaine    # vue 7 jours
python3 automation/rappel.py --quiet      # rappel du jour
python3 automation/triage.py add          # journaliser une interactionpython3 automation/generate_relances.py       --due   # relances dues
```