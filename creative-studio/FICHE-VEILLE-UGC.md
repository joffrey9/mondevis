# 🧭 Fiche de veille UGC — inspiration (15 min/semaine)

> **Usage** : collecte **manuelle & légale** de vidéos virales pour t'inspirer
> des hooks / angles / formats et décliner des concepts **originalaux** via le
> Creative Studio (`cli.py`). Ne **jamais** télécharger/réutiliser les médias des
> autres (CGU + droits d'auteur) — on note, on s'inspire, on crée le sien.
> **⚠️ Pas de scraping automatisé** (ban + illégal pour une activité commerciale).
> **Sortie** : chaque concept retenu alimente `SCRIPTS-UGC-VIRAUX.md`.

## ⏱️ Routine hebdo (15 min)

1. **Ouvrir les sources gratuites** (ci-dessous), secteur par secteur.
2. Pour chaque vidéo marquante : copier le lien + remplir **une ligne** du journal.
3. Chaque semaine, en fin de session : repérer les 1-2 hooks qui se répètent
   → créer un script dans `SCRIPTS-UGC-VIRAUX.md` avec `cli.py`.

### Sources gratuites
- **TikTok Creative Center** → *Top ads / Tendances par secteur* (gratuit, par pays)
- **Instagram** → onglet **Tendances** (Reels) + recherche de ton secteur
- **YouTube** → playlists par niche, shorts tendance
- **Meta Ad Library** → voir les pubs vidéo que les marques de ta niche font tourner (très instructif)

---

## 🎨 Journal de veille — semaine du ____ / ____

> Colonnes : **Secteur | Titre/Lien | Hook (accroche) | Angle viral | Pourquoi ça marche | Décliner ?**

| Secteur | Titre / Lien | Hook | Angle viral | Pourquoi ça marche | À décliner ? |
|---|---|---|---|---|---|
| Beauté | [URL] | « Mon ennemie n°1 le matin… » | Avant/après | Révélation + suspens | ✅ → script sect. Beauté |
| Tech | [URL] | « Je teste LA fonctionnalité » | Démo bénéfice | Concret + démonstratif | reprendre angle |
| Mode | [URL] | « 3 façons de styliser… » | Lookbook | Polyvalence rapide | |
| Food | [URL] | « Le plat viral en 60 s » | Impossible→facile | Défi court, ASMR | |
| Sport | [URL] | « 30 jours de challenge » | Transformation mesurée | Chiffres = crédibilité | |
| Maison/Brico | [URL] | « Avant/après en un week-end » | Révélation satisfying | Retenir jusqu'au bout | |
| Artisanat/BTP | [URL] | « Le devis signé avant de partir » | Douleur→solution | Très proche de MonDevis | ⭐ priorité |
| SaaS/Prod | [URL] | « J'ai chronométré ma tâche » | Chiffre choc | Preuve chiffrée | |

*(sélection vide → remplir pendant la session)*

---

## 📝 Du journal au script (à chaque session suivante)

Pour chaque ligne cochée « À décliner ? » :

```bash
cd mondevis/creative-studio
python3 cli.py video --brand <marque> --prompt "<fond visuel>" \
  --headline "<Hook retenu>" --script "<voix off originale>" \
  --captions --format 9x16
```

Puis pérenniser le concept dans `SCRIPTS-UGC-VIRAUX.md` (structure : hook 0-3s → démo → CTA).

---

## ✅ Checklist légal & qualité (avant publication)

- [ ] Contenu **entièrement original** (pas de média scrapé/réutilisé)
- [ ] Musique libre de droits (`audio/`) ou tendance utilisée légalement
- [ ] Droits d'usage des visuels IA vérifiés
- [ ] Un seul message, un seul CTA, sous-titres, 9:16, ≤ 15 s, boucle propre