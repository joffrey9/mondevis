# 🌴 PAUSE 2 SEMAINES — point de reprise au retour (~01/10/2026)

> Dernière session : jeudi **17/09/2026**. Jo est absent ~2 semaines.
> **Au retour : ouvrir ce fichier et reprendre dans l'ordre du plan.**

---

## 📍 OÙ ON EN EST (au 17/09)

### Réalisations de la session du 17/09
- ✅ **Reel n°2 publié** (Instagram Reel + Facebook Reel + post feed FB) —
  vidéo V5 : `creative-studio/output/ugc-mondevis-avatar-reel2-v5-final.mp4`
  (avatar réel, voix belge, lip-sync réel, logo Mondevis bas droite, 1080×1920).
- ✅ Rituel IG : **Be-wood commenté** (3e confrère commenté en 2 jours :
  Ambiose → avait répondu « Merci. » · Olliswood · Be-wood).
- ✅ Chaîne de production avatar **rodée et réutilisable quasi gratuitement** :
  `prep-avatar-source.py` (nettoyage image) → Veo 3.1 Fast (vidéo muette 8 s)
  → Wav2Lip GAN en local CPU (~20 s, lèvres sur la vraie voix) →
  `finalize-avatar.py` (delogo + logo Mondevis + upscale 1080p).
  Tout est documenté dans `creative-studio/AVATAR-RUNBOOK.md`.

### État général du projet MonDevis
- **Vague 2 programmée dans Publer** le 14/09 (posts 11-13, cochés dans
  `PUBLIER-VAGUE2-A-COPIER.txt`).
- Bilan S1 (07→13/09) : followers stagnants — cause identifiée : rituel sortant
  non fait. Le rituel a **démarré le 16/09** → la S2 (14→20/09) est la première
  semaine mesurable, mais amputée par la pause.
- Captions/guides prêts : `PUBLICATION-CAPTION-REEL2.md`, `PUBLIER-REEL2-A-COPIER.txt`.

### 📊 Chiffres au 17/09 (avant pause — à compléter si 1 minute, sinon relevé au retour)
- Followers Instagram : ______
- Followers Facebook : ______
- Reel n°2 (vues / likes / commentaires) : ______

---

## 🤖 PENDANT L'ABSENCE — automatique, rien à faire

| Date | Quoi | Où |
|------|------|-----|
| Ven 18/09 11:00 | Post 7 « Bénéfices concrets » | Publer (auto) |
| Lun 28/09 09:00 | Post 11 « Soirée administrative » | Publer (auto) |
| Mer 30/09 17:30 | Post 12 « Gain de temps chiffré » | Publer (auto) |
| Ven 02/10 11:00 | Post 13 « Signature électronique » | Publer (auto) |

- Les 4 posts partent tout seuls — **vérifier une dernière fois Publer avant de partir**.
- Le Reel n°2 continue de tourner et d'accumuler des stats.

## 🚫 À NE PAS faire pendant l'absence
- Pas de rituel IG (normal, en pause) — les followers vont stagner, **c'est attendu,
  pas un échec**. On reprendra la mécanique au retour.
- Ne pas supprimer les commentaires reçus — on y répondra au retour (tard = pas grave).

---

## 🔜 PLAN DE REPRISE (au retour, dans l'ordre)

1. **Répondre aux commentaires accumulés** (Reel n°2 + posts 7, 11, 12) — même tard,
   chaque réponse = signal d'activité pour l'algorithme.
2. **Vérifier les réactions d'Ambiose / Olliswood / Be-wood** → si like/comment/suivi :
   DM tièdes autorisés (templates `dm-relances-avatar.md`, 3-5/jour max).
3. **Bilan S2 + stats de pause** : Reel n°2 (vues/likes/commentaires/abonnés gagnés),
   followers IG/FB avant-après (comparer aux chiffres notés ci-dessus),
   portée des 3-4 posts automatiques.
4. **Reprendre le rituel IG quotidien** : 2-3 commentaires + 10-15 follows/jour
   (15-20 min — modèles dans `COMMENTAIRES-TYPES-IG.md`).
5. **Reel n°3** : la chaîne est rodée (Veo → Wav2Lip → finalize) — ⚠️ vérifier les
   crédits Google AI à l'avance (https://ai.studio/projects) et choisir le script
   (variantes restantes ou nouveau). Image source prête : `avatar-source-clean.png`.
6. **Vague 3 de posts** (14→20/10) à préparer une fois le bilan fait.

---

## 🗂️ Fichiers clés (où tout se trouve)

| Fichier | Contenu |
|---------|---------|
| `creative-studio/AVATAR-RUNBOOK.md` | Chaîne avatar complète + commandes + historique V1→V5 |
| `creative-studio/output/` | V5 finale ⭐ + `avatar-source-clean.png` + VO edge-tts |
| `creative-studio/lipsync/Wav2Lip/` | Wav2Lip installé (checkpoint GAN retenu) |
| `PUBLIER-REEL2-A-COPIER.txt` | Guide publication Reel n°2 (cases cochées ✅) |
| `PUBLIER-VAGUE2-A-COPIER.txt` | Posts 11-13 programmés (cochés ✅) |
| `RITUEL-2026-09-17.md` | Dernier rituel (Be-wood ✅, 🅓🅔 + follows non faits) |
| `COMMENTAIRES-TYPES-IG.md` | 10 modèles de commentaires + règles anti-spam |
| `dm-relances-avatar.md` | Templates DM tièdes |
| `REPRISE-2026-09-16.md` / `REPRISE-2026-09-17.md` | Bilans des 2 dernières sessions |

**Bonnes vacances Jo 🌴 — on reprend tout ça à ton retour, rien n'est perdu.**
