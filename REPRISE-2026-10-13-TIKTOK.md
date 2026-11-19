# 📋 Point de reprise — mardi 13/10 (session TikTok)

> Session 13/10 : **cap TikTok lancé** (décision Jo — IG/LI/YT/FB = ~0 retour).
> 3 clips générés, plan + guide écrits, fiche projet mise à jour.
> **Jo a fait un aperçu → quelques MODIFICATIONS aux clips à faire**
> (détail à préciser par Jo à la prochaine session). **Ouvrir ce fichier, lire
> les retours de Jo, ajuster les clips, puis publier.**

---

## ✅ Fait le 13/10

### 1. Décision + docs 📝
- **Cap TikTok validé par Jo** — test structuré 4 semaines, décision finale **09/11**.
- `PLAN-TIKTOK-2026.md` : angle (« menuisier qui aide les artisans »), bio prête,
  10 idées de vidéos, plan 4 semaines, hashtags, anti-ban, seuil de décision.
- `TIKTOK-LANCEMENT.md` : check-list compte Pro + légendes des 3 clips +
  scripts vidéos 4 et 5 (« Le devis oublié », « POV devis chantier »).
- Fiche `profil-mondevis/SKILL.md` : priorité n°3 = test TikTok + décision détaillée.

### 2. 3 clips TikTok générés ✅ (specs vérifiées ffprobe)
Dans `demo-video/tiktok/` — 1080×1920, 30 fps, AAC 48 kHz, fond flou + titres :
| Fichier | Durée | Sujet |
|---|---|---|
| `clip2-devis-vers-peppol.mp4` ⭐ | 43 s | Peppol obligatoire (à publier en 1er) |
| `clip1-devis-chantier.mp4` | 50 s | Devis fait sur le chantier |
| `clip3-pourquoi-mondevis.mp4` | 16 s | Pourquoi MonDevis |

### 3. Scripts reproductibles 🔁
- `demo-video/tiktok/build-tiktok.sh` (+ `make-titles.py`) : régénère les clips
  en 1 commande (titres/durées/segments modifiables).
- ⚠️ Notes techniques : ffmpeg local **sans filter `drawtext`** → titres en PNG
  via PIL ; `filter_complex` **sur une seule ligne** (multi-lignes = binding
  error sur ffmpeg 8.1.1).

---

## ⏳ EN ATTENTE — modifications clips (retours Jo à préciser)

- [ ] **Jo détaille les modifications souhaitées** (titres ? cadrage ? durée ? son ?) — prochaine session
- [ ] Ajuster `make-titles.py` / `build-tiktok.sh` et **régénérer** les clips touchés
- [ ] **Jo valide visuellement** chaque clip régénéré (aperçu fait le 13/10, non final)
- [ ] AirDrop sur téléphone → publication selon `TIKTOK-LANCEMENT.md`
      (clip Peppol en 1er, puis clip 1 mar., clip 3 jeu. — 18 h)

---

## 🚀 Ensuite

- [ ] Créer le compte Pro TikTok si pas encore fait (étape 1 de `TIKTOK-LANCEMENT.md`)
- [ ] Re-poster chaque clip en Reels IG + Shorts YouTube
- [ ] Ouvrir `SUIVI-TIKTOK.md` (stats hebdo) à la fin de la semaine 1
- [ ] Décision finale : **09/11/2026** (1 vidéo > 1 000 vues ou ≥ 2 DM qualifiés
      → continuer ; sinon le temps bascule sur le B2B fiduciaires)
