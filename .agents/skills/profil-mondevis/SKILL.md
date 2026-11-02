---
name: profil-mondevis
description: Profil du projet MonDevis — SaaS de devis et factures pour artisans, projet prioritaire de Jo.
---

# Profil projet : MonDevis

## Règles d'utilisation

- Ce profil contient uniquement des informations confirmées par Jo.
- Ne jamais enregistrer de mots de passe, clés API, tokens, données bancaires ou autres données sensibles.
- Le profil est évolutif : une préférence ou une décision peut être modifiée ou supprimée à la demande de Jo.
- Ce projet est indépendant de Fortemps, DevisFlash, BOT ETF et Vidéos UGC. Ne pas mélanger leurs contextes, fichiers ou décisions.
- Projet commercial : Jo souhaite recevoir de l'aide pour le développer et générer des revenus.

## Identité

- **Nom** : MonDevis
- **Rôle** : vendre un service de devis et factures aux artisans de tous métiers.
- **Dossier** : `/Users/macwdbsequoia/Desktop/dossier Freebuff/mondevis/`
- **Priorité** : projet prioritaire actuel de Jo.

## Stack technique

- **Next.js 16** (App Router) + React 19 + TypeScript strict
- **Prisma 6** — base PostgreSQL (Neon)
- **NextAuth v5** (Google OAuth + Magic Link Resend + Credentials)
- **Resend** — emails transactionnels
- **jsPDF** — génération PDF (devis & factures)
- **Stripe** — abonnements (Checkout, Webhook, Customer Portal)
- **Peppol** (e-invoice.be) — facturation électronique B2B belge
- **Vitest** — tests unitaires

## Objectif

Application web SaaS permettant aux artisans de créer, signer et envoyer des devis et factures professionnels. Modèle de revenus : abonnement (Stripe).

## Statut

- **Version utilisable** — fonctionnelle, déployée sur Vercel.
- Authentification, création de devis/factures, envoi email, Stripe opérationnels.
- En recherche active de clients.
- **Comptes IG/FB MonDevis récents (confirmé par Jo le 04/09/2026)** : créés
  récemment, **aucune audience seedée** — Jo n'a pas partagé les posts avec ses
  amis/connaissances. Conséquence : portée organique ~0 au départ, inbound
  quasi nul les premières semaines → ne pas interpréter un triage vide comme un
  échec ; travailler la portée (follows ciblés, engagement, éventuel boost) avant
  d'attendre des réponses.

- **Cap TikTok (décision Jo 13/10/2026)** — voir Décisions importantes.

## Priorités

1. **Acquisition via groupes Facebook d'artisans** (décision 30/09/2026) — 15-20 min/jour, kit prêt (`GROUPES-FACEBOOK-ARTISANS-2026.md` + `REPONSES-GROUPES-FACEBOOK.md`).
2. **Partenariats B2B fiduciaires** (décision 30/09/2026) — 5 contacts/semaine, objectif 1-2 partenaires actifs fin octobre (`PLAN-B2B-2026.md` + `MESSAGES-B2B-2026.md`).
3. **Test TikTok (décision 13/10/2026)** — 3 vidéos/semaine pendant 4 semaines, décision finale 09/11 (voir Décisions importantes).
4. Posts organiques IG/FB : maintenance uniquement (Publer auto).
5. Améliorer la rétention et la conversion.
6. Relances WhatsApp : uniquement en conversion (jamais à froid).

## Prochaines étapes

- [ ] Campagne d'acquisition (posts réseaux, WhatsApp, Meta Ads).
- [ ] Suivi des testeurs et retours utilisateurs.
- [ ] Optimisation du tunnel de conversion (landing → inscription → abonnement).

## Contraintes

- **Migrations Prisma obligatoires** : toute modification de `prisma/schema.prisma` doit générer une migration (`prisma migrate dev`), jamais de `db push`.
- Prisma CLI lit `.env` (pas `.env.local`) : sourcer les variables avant chaque commande.
- Le build Vercel exécute `prisma migrate deploy` automatiquement.
- Respecter les conventions Next.js du dossier `node_modules/next/dist/docs/`.

## Décisions importantes

- **Cap TikTok (décision Jo 13/10/2026)** : IG, LinkedIn, YouTube et FB organiques
  = ~0 retour confirmé → **test structuré de 4 semaines sur TikTok** (haut de
  tunnel : visibilité + DM, pas vente directe). Angle : « menuisier qui aide les
  autres artisans » — Jo = vrai artisan = crédibilité. Plan : `PLAN-TIKTOK-2026.md` ·
  lancement + scripts : `TIKTOK-LANCEMENT.md` · 3 clips 9:16 déjà générés depuis la
  démo (`demo-video/tiktok/`, script `build-tiktok.sh` reproductible). Cadence
  3 vidéos/semaine (mar/jeu/sam 18-20 h) + re-post Reels/Shorts. **Décision finale
  09/11/2026** : continuer si 1 vidéo > 1 000 vues ou ≥ 2 DM qualifiés, sinon le
  temps bascule sur le B2B fiduciaires. ⚠️ L'installation ffmpeg locale n'a PAS de
  filter `drawtext` → titres générés en PNG via PIL (`make-titles.py`), filter_complex
  sur une seule ligne (multi-lignes = binding error sur ffmpeg 8.1.1).
- **Démarchage WhatsApp à froid : EN PAUSE (décision 04/09/2026)** — 0 réponse sur ~15 contacts froids
  (5 FR 17-19/08 + 10 BE 30/08). Focus déplacé sur l'**inbound** : posts programmés jusqu'au 02/10
  (vague 1 = 10/10 en place) + triage rapide des réponses IG/FB. WhatsApp reste un canal de
  **conversion** pour les gens déjà intéressés (ceux qui répondent « DEVIS »), pas un canal de
  prospection à froid. Ne pas relancer de vague WhatsApp sans nouvelle décision de Jo.
- **Base de données** : PostgreSQL via Neon (serverless).
- **Authentification** : NextAuth v5 avec Google OAuth + Magic Link + Credentials.
- **Emails** : Resend pour tous les envois (auth + devis/factures).
- **Paiements** : Stripe Checkout + Webhooks + Customer Portal.
- **Facturation B2B** : Peppol via e-invoice.be pour la Belgique.
- **France ≠ Peppol (vérifié le 30/09/2026)** : la réforme française passe par les
  Plateformes Agréées + PPF — réception obligatoire depuis le 01/09/2026, émission
  TPE/PME au 01/09/2027. Le bouton Peppol reste volontairement limité aux factures BE.
  UBL (générateur `src/lib/ubl.ts`) fait partie des 3 formats FR autorisés (UBL/CII/Factur-X).
  Mentions marketing corrigées le 30/09 (FAQ + accueil : précision BE uniquement + calendrier FR).
- **Pas de duplication PDF** : builders partagés client/serveur dans `src/lib/pdf/`.
- **Bilan stats 30/09/2026 (retour de vacances)** : IG 28 j = 267 vues (+92 %), 3 interactions, 0 follower ; FB = 92 vues, 15 contenus partagés, 0 follower. Cause : rituel sortant tourné 2 j/28 + audience de départ nulle (attendu, pas un échec).
- **Nouveau cap acquisition (décision 30/09/2026)** : l'organique pur jugé trop lent → priorité aux **groupes FB artisans** (demandes qualifiées) et aux **partenariats B2B** (fiduciaires = dizaines d'artisans d'un coup, argument Peppol obligatoire depuis 01/2026). Boost Meta Ads et rituel IG : non retenus pour l'instant. Objectif B2B : 1-2 partenaires actifs fin octobre.
- **Accès fondateur gratuit (décision 30/09/2026)** : Jo utilise MonDevis gratuitement —
  compte `joffreyfortemps@gmail.com` passé en `role: "admin"` en base ; `isSubscribed()`
  (`src/lib/subscription.ts`) traite le rôle admin comme abonné (quota devis illimité,
  futures fonctions Pro incluses), sans abonnement Stripe. Script de vérification :
  `scripts/verify-users.ts` (lecture seule). Prend effet en prod au prochain déploiement Vercel.
- **Aucune commission d'affiliation promise sans validation de Jo** (phrase « on discute » uniquement).
- **Canal « propre comptable » ÉCARTÉ (décision Jo 30/09/2026)** : ne jamais suggérer
  de solliciter le comptable de Jo pour le B2B — relation pro à préserver, projet séparé
  de la menuiserie. Remplacement : post LinkedIn d'annonce + confrères en opportuniste.
- **Déploiement du 30/09/2026** : corrections Peppol marketing + accès admin déployés en prod
  via `vercel --prod` (alias mondedevis.eu vérifié). Reconnexion Vercel CLI refaite (token expiré).
- **Compte démo B2B (30/09/2026)** : `demo@mondevis.eu` (mot de passe transmis à Jo, non stocké ici),
  profil Menuiserie Fortemps — Démo, devis DEV-2026-0001 (cuisine, TVA 21 % BE) et facture B2B
  FAC-2026-0001 (client pro TVA BE → bouton Peppol visible). Recréable via `scripts/seed-demo.ts`.
- **Cibles B2B nominatives (30/09)** : Pascale Collée (**BCC Consult**, Rixensart —
  a quitté fiduciaire-collee.be, canal info@fiduciaire-bcc.be, même tél = même personne),
  Didier Vander Auwera (Profidgest, dvda@fidgest.be), Alessandro Spadaro (Consultop) —
  voir tableau `PLAN-B2B-2026.md`.
- **Mots de passe dans le Trousseau d'accès macOS (30/09)** : service « MonDevis »,
  comptes joffreyfortemps@gmail.com et demo@mondevis.eu. Jamais dans les fichiers du
  projet (règle confirmée). Lecture : `security find-generic-password -s "MonDevis" -a <email> -w`.
- **Bouton Peppol : affichage vérifié en prod (30/09 soir)** — visible uniquement sur
  factures BE avec client pro (n° TVA). Jo a validé l'étape 1 du plan du soir : connexion
  perso + démo OK, bouton vu sur FAC-2026-0001 (Rénov'Bat SPRL, compte démo).
  Ne jamais cliquer « Envoyer via Peppol » sur la démo (client fictif).
- **Pas d'appels imposés aux fiduciaires (décision Jo 30/09 soir)** : Jo n'est pas à
  l'aise avec les échanges de vive voix — le kit B2B propose désormais une **démo vidéo
  de 3 min** envoyée sur simple demande (tournée une fois, réutilisable), un appel
  restant possible uniquement si le partenaire le demande. Guide :
  `DEMO-VIDEO-GUIDE.md`. Tous les templates ajustés (3 mails, relance J+3, réponse
  intéressé, post LinkedIn).
- **1er contact B2B envoyé (30/09 soir)** : Mail 1 → Pascale Collée (BCC Consult,
  info@fiduciaire-bcc.be). Relance J+3 le lun 05/10 si silence. Prévu : post LinkedIn
  jeu 01/10 matin (lien en 1er commentaire), Mail 2 Vander Auwera jeudi, Mail 3 Spadaro
  vendredi, tournage démo vidéo jeudi/vendredi.
- **Post LinkedIn publié (01/10 matin)** + **Mail 2 Vander Auwera envoyé (01/10)** —
  relances J+3 des deux le **lun 05/10** (template n°2). Mail 3 Spadaro prévu ven 02/10.
- **Démo vidéo terminée et validée par Jo (01/10)** : méthode « 2 passes » (voix au
  Dictaphone bloc par bloc + écran muet QuickTime, montage ffmpeg) —
  `demo-video/demo-mondevis-3min.mp4` (2:07, 1080p, 10 Mo). Voix -13,5 LUFS
  (compression + limiteur) + musique de fond libre de droits synthétisée localement.
  Structure : carte intro → devis **DEV-BE-2026-0001** (client pro fictif Charpentes &
  Associés SPRL, TVA BE 0876.543.210 fictive) → PDF en zoom lent → accepter →
  « Transformer en facture » (FAC-BE-2026-0002) → bouton Peppol montré SANS cliquer
  (~1:10-1:27) → carte de fin. ⚠️ Reste à faire : upload YouTube « non répertoriée » +
  test du lien en navigation privée. Téléprompteur : `TELEPROMPTEUR-DEMO-VIDEO.md`.
  Assemblage réutilisable : `demo-video/assemble-demo.mjs` (⚠️ toujours `-y` sur les
  écritures ffmpeg : sans lui, ffmpeg refuse d'écraser avec code de sortie 0 →
  fichiers périmés silencieux, bug corrigé le 01/10). Compte fal.ai verrouillé (TOP_UP).