---
name: profil-ugc
description: Profil du projet Vidéos UGC — studio de création de courtes vidéos publicitaires pour les marques, destiné à la vente sur les réseaux sociaux.
---

# Profil projet : Vidéos UGC

## Règles d'utilisation

- Ce profil contient uniquement des informations confirmées par Jo.
- Ne jamais enregistrer de mots de passe, clés API, tokens, données bancaires ou autres données sensibles.
- Le profil est évolutif : une préférence ou une décision peut être modifiée ou supprimée à la demande de Jo.
- Ce projet est indépendant de Fortemps, Mondevis, DevisFlash et BOT ETF. Ne pas mélanger leurs contextes, fichiers ou décisions.
- Projet commercial : Jo souhaite recevoir de l'aide pour le développer et générer des revenus.

## Identité

- **Nom** : Vidéos UGC (Creative Studio)
- **Rôle** : produire des courtes vidéos UGC (10 à 15 secondes), style professionnel, pour faire de la publicité et les vendre sur les réseaux sociaux.
- **Dossier** : `/Users/macwdbsequoia/Desktop/dossier Freebuff/mondevis/creative-studio/`
- **Type** : studio générique multi-marques (toute marque via un fichier de charte JSON).

## Objectif

Créer et vendre des vidéos UGC courtes et percutantes pour des marques, diffusables sur Instagram, TikTok, Facebook — avec un rendu professionnel (voix off, sous-titres, musique, charte graphique). Générer des revenus via la production de contenu publicitaire.

## Format cible

- **Durée** : 10 à 15 secondes.
- **Style** : vidéos « faceless » avec voix off + sous-titres + musique de fond, ou avatars qui parlent face caméra (Veo).
- **Livrables** : MP4 9:16 (Reels/Stories/TikTok) ou 1:1 (Feed).

## Capacités techniques

- **Image IA** : FLUX (fal.ai payant) ou Pollinations (gratuit, par défaut).
- **Vidéo IA** : Kling/Veo (fal.ai/Google, payant) ou montage local Ken Burns (gratuit).
- **Voix off** : edge-tts (Microsoft, gratuit), voix homme belge par défaut.
- **Sous-titres** : synchronisés mot à mot, incrustés automatiquement.
- **Musique de fond** : pistes libres de droits dans `audio/`.
- **Batch A/B testing** : plusieurs variantes avec hooks différents.
- **Avatars qui parlent** : Google Veo 3.1 image→vidéo, personnage face caméra.
- **Habillage** : logo, couleurs, titre, CTA WhatsApp, barre de marque (PIL).

## Statut

- **Opérationnel** — toutes les fonctionnalités décrites dans le README fonctionnent.
- Marques existantes : Fortemps, MonDevis.
- Extensible à toute nouvelle marque via un fichier JSON de charte.

## Priorités

1. Définir une offre commerciale claire (forfaits vidéos UGC).
2. Trouver des premiers clients (marques, artisans, commerçants).
3. Créer un portfolio de vidéos de démonstration.
4. Automatiser la production pour scaler.

## Prochaines étapes

- [ ] Créer 3 à 5 vidéos portfolio par marque (Fortemps + MonDevis).
- [ ] Définir les tarifs et forfaits.
- [ ] Démarcher des prospects (artisans, petites marques).
- [ ] Ajouter de nouvelles marques à la demande.

## Décisions — veille & inspiration

- **Pas de scraping vidéo automatisé** (CGU + droit d'auteur + dépendance payante/cassante). Décision Jo (31/08).
- La veille de tendances/vidéos se fait **manuellement**, 15 min/semaine, via les sources gratuites de la fiche `creative-studio/FICHE-VEILLE-UGC.md`.
- Chaque concept viral retenu est décliné en vidéo **originale** via `cli.py` et pérennisé dans `SCRIPTS-UGC-VIRAUX.md`. Jamais de réutilisation des médias d'autrui.

## Contraintes

- **Par défaut, gratuit** : Pollinations pour les images, montage local pour les vidéos. Les options payantes (fal.ai, Veo) sont activables si le client a un budget.
- Voix off gratuite via edge-tts (Microsoft), pas de dépendance à une API payante.
- Les musiques de fond sont libres de droits.
- Vérifier les droits d'usage des contenus générés par IA avant publication.

## Décisions importantes

- **Fournisseur image par défaut** : Pollinations (gratuit, modèle `flux`).
- **Voix par défaut** : `fr-BE-GerardNeural` (homme, accent belge).
- **Format prioritaire** : 9:16 (vertical, Reels/Stories/TikTok).
- **Marques existantes** : Fortemps (`fortemps.json`) et MonDevis (`mondevis.json`).
- **Architecture** : Python (CLI `cli.py` + modules `studio/`) + ffmpeg pour le montage.