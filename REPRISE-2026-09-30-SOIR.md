# 📋 Point de reprise — mercredi 30/09 (soir)

> Session du 30/09 (matin + midi) · projet : MonDevis uniquement.
> **Au retour : ouvrir ce fichier et reprendre dans l'ordre du plan.**

---

## ✅ Ce qui a été fait aujourd'hui (tout est terminé et vérifié)

### 1. Vérification France/Peppol (ta question du matin)
- **Verdict : la France n'est PAS comme la Belgique.** Pas de Peppol en France :
  réforme « Plateformes Agréées » — réception obligatoire depuis le 01/09/2026,
  **émission TPE/PME seulement au 01/09/2027** (11 mois de marge pour attaquer
  le marché FR avec l'argument « sois prêt »).
- **L'application était déjà correcte** (bouton Peppol limité aux factures BE).
- Mentions marketing corrigées (FAQ + accueil). Typecheck OK, 23/23 tests OK.

### 2. Ton accès gratuit (fait et en ligne)
- Compte **joffreyfortemps@gmail.com** passé en rôle `admin` → **devis illimités
  à vie**, sans Stripe.
- ⚠️ Mot de passe posé sur ton compte (méthode Credentials) — **note-le dans un
  endroit sûr**, il n'est stocké nulle part dans le projet.

### 3. Déploiement prod (fait et vérifié)
- Déployé sur **mondedevis.eu** via Vercel (reconnexion CLI refaite, token expiré).
- Vérifié : toutes les pages HTTP 200, nouvelle FAQ visible, ancien texte disparu,
  2 comptes en base (toi + démo).

### 4. Compte démo B2B (créé en prod)
- **demo@mondevis.eu** / mot de passe transmis dans la session (recréable via
  `scripts/seed-demo.ts`).
- Contient : profil Menuiserie Fortemps — Démo, devis DEV-2026-0001 (cuisine,
  TVA 21 % BE), facture B2B FAC-2026-0001 (client pro → **bouton Peppol visible**).
- ⚠️ Ne pas envoyer vraiment la facture Peppol de la démo (client fictif).

### 5. Kit d'acquisition B2B complet (prêts à copier-coller)
- `MAILS-B2B-Prets-A-Envoyer.md` : post LinkedIn (Étape 0) + 3 mails nominatifs
  (Collee, Vander Auwera, Spadaro).
- `PLAN-B2B-2026.md` : tableau 10 fiduciaires avec noms vérifiés + checklist démo
  (presque tout cochée).
- `GROUPES-FB-PLAN-SEMAINE1.md` : plan jour par jour + 4 réponses prêtes à coller.
- ❌ **Canal « ton propre comptable » ÉCARTÉ** (ta décision, enregistrée
  définitivement) → remplacé par le post LinkedIn.

---

## 🔜 À ton retour — dans l'ordre (2 h dispo = parfait)

### Étape 1 — Les 3 clics de connexion (5 min) ✅ FAIT (30/09 soir)
- [x] Connexion perso OK + dashboard accessible.
- [x] Connexion démo OK (le blocage initial était une erreur de mot de passe,
      pas un bug). Vérifié aussi côté serveur : compte + hash OK, session OK.
- [x] Bouton « Envoyer via Peppol » **vérifié visible** sur FAC-2026-0001
      (Rénov'Bat SPRL) du compte démo. ⚠️ Ne pas cliquer (client fictif).
- ℹ️ Le bouton n'apparaît QUE sur les factures BE avec client pro (n° TVA) —
  comportement voulu. Les factures TEST / Mme Dubois (sans TVA) ne l'affichent pas.
- 🔐 Mots de passe perso + démo rangés dans le Trousseau d'accès macOS
  (service « MonDevis ») — rien dans les fichiers du projet (règle projet).
  Relecture : `security find-generic-password -s "MonDevis" -a "demo@mondevis.eu" -w`

### Étape 2 — Post LinkedIn (10 min) ✅ FAIT (01/10 matin)
> Meilleur créneau de la semaine — reporter au jeudi matin ne perd rien.
- [x] Post **publié le 01/10 matin** depuis le profil perso de Jo (texte de
      `MAILS-B2B-Prets-A-Envoyer.md`, Étape 0) + lien mondedevis.eu en 1er commentaire.
- [ ] Répondre aux commentaires/DM dans l'heure si possible (rester actif
      aujourd'hui — l'algorithme récompense l'engagement précoce).

### Étape 3 — Mail B2B n°1 ✅ FAIT (envoyé le 30/09 soir)
- [x] **Mail 1 envoyé à Pascale Collée (BCC Consult)** — info@fiduciaire-bcc.be,
      noté dans le tableau `PLAN-B2B-2026.md` (ligne 5). Relance J+3 = lun 05/10
      si pas de réponse (template n°2).
- ⚠️ Cible corrigée : fiduciaire-collee.be = ancien site → BCC Consult
      (même personne, même tél). Mail adapté dans `MAILS-B2B-Prets-A-Envoyer.md`.
- [x] **Mail 2 envoyé à Didier Vander Auwera (Profidgest)** — dvda@fidgest.be,
      le 01/10 après le post LinkedIn. Noté dans `PLAN-B2B-2026.md` (ligne 6).
      Relance J+3 = lun 05/10 si silence (template n°2). Rythme 1 mail/jour respecté.

### Étape 4 — Groupes Facebook (30-45 min)
- [ ] Rejoindre 3-4 groupes de la liste A dans
      `GROUPES-FACEBOOK-ARTISANS-2026.md` (Union des indépendants BE, artisans
      Namur, artisans du bâtiment, Recherche d'artisans BE).
- [ ] Lire les règles de chaque groupe → les noter dans
      `GROUPES-FB-PLAN-SEMAINE1.md`.
- [ ] **Ne rien publier** — observation 48 h (c'est prévu par le plan).

### Étape 5 — Démo vidéo (≈ 45 min : tournage 15 + ajustements 30)
> Nouvelle approche (décision Jo 30/09 soir) : pas d'appel imposé aux
> fiduciaires — une **démo vidéo de 3 min**, tournée une fois, envoyée sur
> demande (et réutilisable pour le post LinkedIn). Guide :
> `DEMO-VIDEO-GUIDE.md`.
- [x] Logo MonDevis vérifiable sur les PDF du compte démo (header des documents).
- [x] Captures de secours réalisées le 01/10 : PDF devis DEV-BE-2026-0001 +
      PDF facture FAC-BE-2026-0002 (à AirDroper sur le téléphone).
- [x] **Vidéo démo TOURNÉE ET MONTÉE le 01/10** — méthode 2 passes (voix
      Dictaphone bloc par bloc + écran muet QuickTime, assemblage ffmpeg)
      → `demo-video/demo-mondevis-3min.mp4` (2:07, 1080p). Reste à faire :
      hébergement YouTube non répertoriée + test du lien en navigation privée.

---

## 📅 Si tu ne fais que 3 choses demain : post LinkedIn → Mail 2 Vander Auwera → tournage démo vidéo.

> 🔁 **Récap décision Jo (30/09 soir)** : plus d'appels imposés aux fiduciaires →
> démo vidéo 3 min (guide `DEMO-VIDEO-GUIDE.md`). Le Mail 1 envoyé ce soir
> promet la vidéo « sur simple demande » → elle doit être tournée avant la
> relance J+3 (lun 05/10). Suite des étapes : demain ou vendredi.

## 🗓️ Rappels de la semaine
| Jour | Quoi |
|---|---|
| Jeu 01/10 | **Post LinkedIn 8h-10h** (lien en 1er commentaire) + Mail 2 — Vander Auwera (dvda@fidgest.be) + tournage démo vidéo (guide `DEMO-VIDEO-GUIDE.md`) |
| Ven 02/10 | Mail 3 — Spadaro + 1re réponse utile dans un groupe FB + héberger la vidéo (YouTube non répertoriée) si pas fait |
| Lun 05/10 | Relance J+3 de BCC Consult si pas de réponse (template n°2) |
| Dim 11/10 | Bilan semaine : réponses groupes + retours fiduciaires |

> Tout est enregistré : décision comptable écartée, accès admin, compte démo,
> cibles nominatives — dans la fiche projet et `PLAN-B2B-2026.md`.
> Rien d'autre à attendre : la prod tourne, les posts Publer continuent en auto.
