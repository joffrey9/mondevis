# 📱 REPRISE — TikTok MonDevis (session du 14/10/2026)

> Pour Jo — **état au 15/10/2026 (mi-journée)** : compte **Pro terminé**
> (n° BCE `0891.930.638` saisi), **bio en ligne** (version 80 car.),
> **lien site web bloqué** (1 000 abonnés requis), **badge entreprise rejeté**
> (sans conséquence, cf. section dédiée).
> ⏭ **Reste cette session** : nom affiché → photo → **publier le clip 2**.
>
> (Historique 14/10 : conversion en cours, bloquée sur le numéro de licence.)

---

## ✅ Fait aujourd'hui

### 1. Clips TikTok — bug titres corrigé
- **Problème** : titre tronqué en haut des clips 1 et 3 (lignes de 1148 px et
  1140 px dans une frame de 1080 px — police fixe à 86).
- **Correction** : `demo-video/tiktok/make-titles.py` réécrit avec `fit_font()` —
  la taille de police s'auto-ajuste pour que la ligne la plus large tienne dans
  1020 px (marge 30 px/bord). Plus jamais de titre rogné.
- **Résultat vérifié** (frames exportés, pas seulement PNG) :
  - `clip1-devis-chantier.mp4` ✅ (marges 38/34 px) — 1080×1920, 50,5 s
  - `clip2-devis-vers-peppol.mp4` ✅ inchangé (titre déjà bon)
  - `clip3-pourquoi-mondevis.mp4` ✅ (marges 42/40 px) — 1080×1920, 16,3 s
- PNG de contrôle régénérés : `control-clip1.png`, `control-clip3.png`.

### 2. Compte TikTok créé
- **Pseudo obtenu : `@mondedevis.eu`** ✅ (14/10 — colle au domaine mondedevis.eu)
- Astuce retenue : **un second compte** a été créé (l'ancien compte vide
  « Menuiserie Fortemps Joffrey » sera supprimé plus tard, cf. plus bas).
- Nom affiché à mettre : `MonDevis — Devis & factures` (27 car. — **limite
  TikTok = 30 caractères**, la version longue du plan ne passe pas).

### 3. Docs mis à jour
- `TIKTOK-LANCEMENT.md` : Étape 1 mise à jour (pseudo obtenu, cas du second
  compte, nom affiché court).
- `PLAN-TIKTOK-2026.md` : nom affiché corrigé (30 car. max), pseudo confirmé.

---

## ✅ Compte Pro → Entreprise : TERMINÉ le 15/10

Champs enregistrés (vus sur l'écran « Informations de base ») :
- [x] Adresse de l'entreprise (Bruxelles-Capitale, 1000 — rue manquante pour
      la vérification, cf. section « badge rejeté »)
- [x] Site Web de l'entreprise : `https://mondedevis.eu`
- [x] Secteur : **Produit/Service** (pas de restriction concernée)
- [x] **Numéro de licence commerciale** : `BE0891930638` = n° d'entreprise
      BCE/KBO (`0891.930.638`, personne physique **Fortemps, Joffrey**,
      validé sur kbopub.economie.fgov.be — clé de contrôle OK, statut Actif)
- [ ] **Nom affiché** : toujours `mondedevis.eu` → passer en
      `MonDevis — Devis & factures`
- [ ] **Photo de profil** : AirDrop `logo-mondevis-1080.png`

> ℹ️ Rappel : le « Site Web » des infos entreprise **ne s'affiche pas en bio**
> (vérifié sur la page publique) — le champ Site web public est bloqué jusqu'à
> 1 000 abonnés.

---

## 🔎 Contrôle en direct du profil public (vérifié par Buffy le 15/10)

Page publique `tiktok.com/@mondedevis.eu` analysée (HTML anonyme) :

| Élément | État |
|---|---|
| Bio | ✅ en ligne — version courte (80 car.) bien appliquée |
| Nom affiché | ❌ toujours `mondedevis.eu` (= le pseudo) → à passer en `MonDevis — Devis & factures` |
| **Lien site web** | ⛔ **impossible pour l'instant** — TikTok exige **1 000 abonnés** avant le champ Site web (confirmé par Jo sur son app le 15/10). Le @ `@mondedevis.eu` affiche déjà le domaine sous le nom. |
| Posts | 0 (clips pas encore publiés — normal) |

→ **Ne pas chercher le champ « Site web »** (bloqué). À la place :
   a. **Bouton E-mail** (Modifier le profil → Contact → E-mail) :
      `hello@mondedevis.eu` — contact direct dès 0 abonné.
   b. **CTA vidéo** : dire + afficher « tape **mondedevis.eu** » (scripts 4/5 corrigés).
   c. **Liens cliquables** : bio Instagram + description YouTube Shorts.
   d. 📌 Dès **1 000 abonnés** → ajouter Site web `https://mondedevis.eu`.

## ❌ Vérification « entreprise » rejetée (constaté le 15/10)

Screenshot TikTok : **« Vérifiez votre entreprise — Rejeté »**,
raison `oversea.reject_reason.mismatch_of_company_info`.

**Diagnostic (vérifié sur kbopub.economie.fgov.be le 15/10)** — le numéro
`BE0891930638` = `0891.930.638` est **valide** (clé de contrôle 38 OK, statut
**Actif**) mais le registre dit :

| Champ KBO | Valeur officielle | Ce qui a été saisi sur TikTok |
|---|---|---|
| Type d'entité | **Personne physique** (pas une société) | — |
| Dénomination | **`Fortemps, Joffrey`** | `Mondevis` ⬅️ **le mismatch** |
| Adresse | rue + n° + CP + commune (sur les factures) | « Belgique, Région de Bruxelles-Capitale, 1000 » sans rue ⬅️ 2e mismatch |

→ TikTok compare avec le registre : « Mondevis » n'existe dans aucun registre
belge → rejet. **Ce n'est pas ton compte qui est rejeté** (Pro OK, publication
possible), seulement la demande de **badge de vérification**.

**Décision** : ⏭ **on ignore le badge pour l'instant** (optionnel, ne bloque
rien — ni les publications, ni les stats, ni la vente).

**Si un jour on veut le badge** : renvoyer avec les infos exactes KBO —
Nom légal `Fortemps, Joffrey` · numéro `0891.930.638` · adresse complète de la
BCE. Le badge attesterait alors l'**artisan**, pas la marque MonDevis (le @ et
le nom affiché restent MonDevis).

**Vrai fix (plus tard)** : entité (bv/sarl) ou nom commercial inscrit au KBO
au nom de MonDevis — à traiter quand MonDevis a des clients payants.

---

## ⏱️ Session de 30 min (découpée — reprendre à l'ordre 1)

| Bloc | Durée | Ce qu'on fait |
|---|---|---|
| 1. Compte Pro | ✅ fait | n° BCE saisi + infos de base enregistrées — badge de vérification rejeté, **ignoré volontairement** (cf. section ci-dessus) |
| 2. Fiche profil | 10 min | Nom affiché → photo → bio ✅ déjà faite → bouton E-mail → désactiver le bouton Contact |
| 3. Publication | 10 min | AirDrop `clip2-devis-vers-peppol.mp4` → publier avec la légende prête |
| 4. Suivi | 5 min | Vérifier en navigation privée + premières stats notées dans `SUIVI-TIKTOK.md` |

> ⏭ Si le temps manque : **la fiche profil passe avant la publication**
> (le CTA vidéo pointe vers mondedevis.eu — le profil doit être propre).

## 📋 Reste à faire (par ordre)

1. ~~Finir le compte Pro~~ ✅ **fait** — (n° `0891.930.638` saisi ; badge de
   vérification rejeté, sans conséquence, cf. section ci-dessus)
2. Nom affiché : `MonDevis — Devis & factures`
3. Photo de profil : AirDrop `logo-mondevis-1080.png` → importer
4. Bio (copier-coller) + lien — ⚠️ **limite bio TikTok non confirmée**
   (sources 2026 : 80 pour l'aide officiel, 160-180 selon les comptes).
   → **Coller d'abord la version longue** ; si TikTok refuse/tronque, coller
   la version courte ≤ 80 car. :
   ```
   🪵 Menuisier → j'ai créé l'outil que je voulais avoir
   Devis signés + factures Peppol, 100 % sur téléphone ⬇️
   ```
   *(107 car. — si refus →)*
   ```
   🪵 Menuisier → j'ai créé l'outil que je voulais avoir
   Devis + factures Peppol ⬇️
   ```
   *(79 car. — la ligne 1 = le hook « vrai artisan », on sacrifie la ligne 2,
   jamais l'inverse)*
   Lien : ⛔ **bloqué jusqu'à 1 000 abonnés** (confirmé le 15/10) → pas de temps
   perdu à chercher le champ. À la place : bouton E-mail
   `hello@mondedevis.eu` + CTA « tape mondedevis.eu » dans les vidéos + lien dans
   la bio Instagram et la description YouTube Shorts.
   📌 Dès 1 000 abonnés → ajouter Site web `https://mondedevis.eu` (sans UTM).
5. **Retirer le bouton Contact** si un numéro de tel a été saisi
   (Modifier le profil → Contact → désactiver) — vérifier en navigation privée
6. **Ouvrir `SUIVI-TIKTOK.md`** (semaine 1 : vues/likes/comm/DM par vidéo)
7. **Publier le clip 2** (`clip2-devis-vers-peppol.mp4`, le plus fort — Peppol
   = sujet d'actualité) avec la légende déjà prête dans `TIKTOK-LANCEMENT.md`
8. Puis clips 1 et 3 (**sam. 17/10, 18 h** / **lun. 19/10 ou mar. 20/10, 18 h** — légendes
   dans `TIKTOK-LANCEMENT.md`). Planning complet : `A-FAIRE-DEMAIN-2026-10-16.md`

---

## 🗑️ À faire plus tard (sans urgence)

- **Supprimer l'ancien compte « Menuiserie Fortemps Joffrey »** :
  flèche ▾ en haut du profil → basculer dessus → Paramètres → Gérer le compte →
  Supprimer le compte. ⚠️ **30 jours sans s'y reconnecter** (sinon réactivation)
  — le pseudo ancien ne se libère qu'après ce délai.

## 📌 Rappels utiles retenus aujourd'hui
- Pseudo TikTok : **1 seul changement par 30 jours** → bien le choisir au create.
- Nom affiché : **30 caractères max** ; pseudo @ : 24 car. max.
- Jamais de mots-clés dans le @ (ça ne sert pas au référencement TikTok).
- Le @ `@mondedevis.eu` est définitif — **ne plus y toucher**.
