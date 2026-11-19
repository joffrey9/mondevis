# 📋 Point de reprise — jeudi 01/10 (soir)

> Session du 01/10 · projet : MonDevis uniquement.
> **Au retour : ouvrir ce fichier et reprendre dans l'ordre du plan.**

---

## ✅ Ce qui a été fait aujourd'hui (tout est vérifié)

### 1. Post LinkedIn — PUBLIÉ ✅
- Publié le 01/10 matin depuis le profil perso, lien mondedevis.eu en 1er commentaire.
- Texte : `MAILS-B2B-Prets-A-Envoyer.md` (Étape 0).
- ⚠️ Répondre aux commentaires/DM dans les 24-48 h (l'algorithme récompense l'engagement précoce).

### 2. Mail 2 — Vander Auwera ENVOYÉ ✅
- Envoyé le 01/10 à Didier Vander Auwera (Profidgest, dvda@fidgest.be).
- Noté dans le tableau `PLAN-B2B-2026.md` (ligne 6). Relance J+3 = **lun 05/10** si silence.

### 3. Vidéo démo — TOURNÉE, MONTÉE ET VALIDÉE ✅ 🎬
- **Méthode 2 passes** (décision du jour) : voix au Dictaphone bloc par bloc
  (6 fichiers) + écran muet QuickTime → assemblage ffmpeg par Buffy.
- **Fichier final : `demo-video/demo-mondevis-3min.mp4`** (2:07, 1080p, 10 Mo).
- Structure : carte intro → devis DEV-BE-2026-0001 (blocs 1-2) → PDF du devis en
  zoom lent (bloc 3) → Accepter → Transformer en facture → **bouton Peppol
  visible ~1:10-1:27 sans cliquer** (bloc 4) → bénéfices fiduciaire (bloc 5) →
  carte de fin « mondedevis.eu · essai gratuit 14 jours · sans CB » (bloc 6).
- Audio masterisé : voix **-13,5 LUFS** (compression douce + limiteur) + **musique
  de fond libre de droits** (nappe locale, -26 LUFS sous la parole, +7 dB sur les
  cartes intro/fin) → ensemble -13,9 LUFS. Validé par Jo.
- Outils créés (réutilisables) : `TELEPROMPTEUR-DEMO-VIDEO.md`,
  `demo-video/assemble-demo.mjs` (régénère tout en 2 min),
  `demo-video/synth-music.sh`, `demo-video/make-cards.py`, `demo-video/render-pdf.swift`.
- 🐛 Bug corrigé au passage : ffmpeg refuse d'écraser un fichier existant **avec
  code de sortie 0** si `-y` manque → fichiers périmés silencieux. Tous les sh()
  d'écriture ont maintenant `-y`.

### 4. Compte démo enrichi ✅
- Nouveau devis type **DEV-BE-2026-0001** « Menuiseries extérieures » (fenêtres +
  porte, 3 600 € HT / 4 356 € TTC, TVA 21 %) — client **professionnel fictif**
  Charpentes & Associés SPRL (TVA BE 0876.543.210 fictive).
- La vidéo montre la **chaîne complète** : devis accepté → « Transformer en
  facture » → facture **FAC-BE-2026-0002** avec bouton Peppol visible.
- ⚠️ Règle inchangée : ne JAMAIS cliquer « Envoyer via Peppol » (clients fictifs).
- Captures de secours faites : PDF devis + PDF facture (sur le Mac — à AirDropper
  sur le téléphone).

### 5. FAL ⚠️
- Compte fal.ai **verrouillé (TOP_UP)** — génération musique IA indisponible.
  La musique utilisée est synthétisée localement (libre de droits). Si Jo veut
  une musique IA pro : recharger le compte (quelques €) → relancer le script.

---

## 🔜 Demain vendredi 02/10 — dans l'ordre

### Étape 1 — Upload YouTube « non répertoriée » (10 min) ⏳ LE PLUS URGENT
- [ ] youtube.com → icône caméra « Créer » → « Importer une vidéo »
- [ ] Glisser `demo-video/demo-mondevis-3min.mp4` (révélé dans le Finder par Buffy)
- [ ] Titre : `MonDevis — Démo en 3 minutes : du devis signé à la facture Peppol`
- [ ] Description : `MonDevis (mondedevis.eu) : l'outil de devis et factures pour artisans. Devis créé et signé sur le chantier depuis le téléphone, facture électronique Peppol B2B conforme, TVA belge automatique. Essai gratuit 14 jours, sans carte bancaire.`
- [ ] Audience : « Non, cette vidéo n'est pas conçue pour les enfants »
- [ ] Visibilité : **« Non répertoriée »** (pas publique !)
- [ ] **Tester le lien en navigation privée** (Cmd+Maj+N) : doit se lancer sans compte
- [ ] Donner le lien à Buffy → noté dans le suivi

### Étape 2 — Mail 3 — Alessandro Spadaro (Consultop) (5 min) ⏳
- [ ] Via le formulaire www.consultop.be — texte prêt dans `MAILS-B2B-Prets-A-Envoyer.md` (Mail 3)
- [ ] Noter la date dans le tableau `PLAN-B2B-2026.md` (ligne 4) → relance J+3 = lun/mar 05-06/10

### Étape 3 — LinkedIn : commentaires et MP (10 min) ⏳
- [ ] Répondre aux commentaires du post d'hier (même un « Merci ! »)
- [ ] MP demandant la démo → dès que le lien YouTube est prêt, coller le lien + phrase type

### Étape 4 — Groupes Facebook (30-45 min) ⏳
- [ ] Rejoindre 3-4 groupes de la liste A dans `GROUPES-FACEBOOK-ARTISANS-2026.md`
- [ ] Lire les règles de chaque groupe → les noter dans `GROUPES-FB-PLAN-SEMAINE1.md`
- [ ] **Ne rien publier** — observation 48 h (prévu par le plan)

---

## 📅 Si tu ne fais que 3 choses : upload YouTube → Mail 3 Spadaro → groupes FB.

## 🗓️ Rappels de la semaine
| Jour | Quoi |
|---|---|
| Ven 02/10 | **Upload YouTube non répertoriée + test lien** · Mail 3 — Spadaro · commentaires LinkedIn · groupes FB (observation) |
| Lun 05/10 | **Relances J+3** : BCC Consult (Pascale Collée) + Vander Auwera (Profidgest) si silence — template n°2 dans `MESSAGES-B2B-2026.md`. La vidéo est prête pour ces relances |
| Dim 11/10 | Bilan semaine : réponses groupes + retours fiduciaires |

> 🎯 **La vidéo démo est prête** — elle était la condition de la relance J+3 de
> lundi (les 2 mails promettent « la démo vidéo sur simple demande »). Une fois
> hébergée, chaque demande « envoyez-moi la démo » = le lien + une phrase.
> Toutes les infos sont notées dans `PLAN-B2B-2026.md` et la fiche projet.
