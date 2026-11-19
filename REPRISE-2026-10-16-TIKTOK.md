# 📋 REPRISE — 16/10/2026 — Vérification entreprise : 3ᵉ tentative

> Hier (15/10) : 1ᵉʳ rejet (`mismatch_of_company_info`, cf.
> `REPRISE-2026-10-14-TIKTOK.md`).
> Ce matin (16/10) : 2ᵉ tentative (nom KBO corrigé) → **2ᵉ rejet en quelques
> heures, même raison** (robot vs base KBO).
> **16/10 (en cours de journée)** : Jo renvoie une 3ᵉ fois avec **l'adresse
> légale complète** (rue + n° + CP + commune) → 🟡 **En cours d'examen**.
> Copie de chaque écran ci-dessous.

---

## 📸 Copie de l'écran — 16/10, matin

**Statut global** : « Vérifiez votre entreprise. » → 🟡 **En cours d'examen**

### Informations de base

| Champ | Valeur saisie |
|---|---|
| Adresse | Belgique, Wallonia, Brabant wallon, **1420** |
| Site Web de l'entreprise | `https://mondedevis.eu` |
| Secteur avec des restrictions de public | Non applicable |

### Vérification de l'entreprise

| Champ | Valeur saisie |
|---|---|
| Certification de l'entreprise | 2 documents uploadés ✅ (fichiers cochés verts, dont `list.pdf.png`) |
| Nom légal de l'entreprise | **Fortemps Joffrey** |
| Numéro de licence commerciale | **BE0891930638** |

---

## 🔍 Analyse (Buffy)

✅ **Points corrigés** par rapport au rejet du 15/10 :
- Nom légal = `Fortemps Joffrey` (l'entité BCE) au lieu de « Mondevis » →
  le mismatch principal est réglé.
- N° BCE `BE0891930638` = `0891.930.638` ✅ (statut Actif, clé 38 OK — déjà
  vérifié sur kbopub le 15/10).
- Documents justificatifs uploadés (2 fichiers acceptés, cochés verts).

⚠️ **Deux réserves** si c'est rejeté à nouveau :
1. **Adresse sans rue** — « Brabant wallon, 1420 » ne contient pas le n° de
   rue. KBO affiche l'adresse complète de la BCE → si rejet, renvoyer avec la
   **rue + n° exacts** de l'adresse BCE.
2. **Virgule** — KBO écrit `Fortemps, Joffrey` (avec virgule) ; saisi
   « Fortemps Joffrey ». TikTok tolère généralement la ponctuation, mais c'est
   le 2e point à tester en cas de 2e rejet.

## 📌 Ce que ça change (et ce que ça ne change pas)

| Élément | Impact |
|---|---|
| Badge « entreprise vérifiée » | En attente d'examen (constat du matin) ⚠️ **obsolète : rejeté le jour même, voir « 2ᵉ rejet » ci-dessous** |
| Champ **Site web du profil** (lien cliquable) | ⛔ **Toujours bloqué jusqu'à 1 000 abonnés** — la vérification ne le débloque pas. Le domaine s'affiche via le @ `@mondedevis.eu` |
| Publication des clips / stats / vente | Rien ne change — déjà OK |
| Bouton E-mail `hello@mondedevis.eu` | Recommandé toujours d'actualité (contact direct dès 0 abonné) |

**Décision (matin)** : ⏭ on laisse tourner, on re-checke dans 2-3 jours.
➡️ **Suite réelle de la journée** : 2ᵉ rejet en début d'après-midi (voir
« 2ᵉ rejet »), puis **3ᵉ tentative avec l'adresse complète** → en cours
d'examen (voir « 3ᵉ tentative »). La publication du **clip 2 à 18 h** reste
la priorité du jour (`A-FAIRE-DEMAIN-2026-10-16.md`), le badge est accessoire.

---

## 🔴 2ᵉ rejet (constaté le 16/10, en cours de matinée)

Écran TikTok : **« Vérifiez votre entreprise — Rejeté »**,
raison `oversea.reject_reason.mismatch_of_company_info` (identique au 15/10).

**Rejet automatique en quelques heures** → c'est un robot qui compare tes champs
avec le registre KBO, pas un examen humain. Ce matin on a corrigé le **nom**,
il reste donc des champs qui ne matchent pas :

| Hypothèse (par probabilité) | Explication |
|---|---|
| **1. Adresse sans rue** | Saisi « Belgique, Wallonia, Brabant wallon, 1420 » — le KBO a une **rue + n° + CP + commune**. Comparaison texte → mismatch quasi certain |
| **2. Type d'entité** | KBO : **personne physique** (eenmanszaak). TikTok « oversea » attend souvent une **entité immatriculée** (sarl/bv) avec certificat d'exploitation — le statut électronique de PP peut ne pas passer le filtre document |
| **3. Virgule** | KBO écrit `Fortemps, Joffrey` ; saisi `Fortemps Joffrey` — mineur, mais possible |

## 🟡 3ᵉ tentative (16/10, en cours de journée) — légitime, c'est l'hypothèse n°1

Jo renvoie une 3ᵉ fois, cette fois avec **l'adresse légale complète**.
Copie de l'écran (Business info) :

**Statut global** : « Vérifiez votre entreprise. » → 🟡 **En cours d'examen**

### Informations de base

| Champ | Valeur saisie |
|---|---|
| Adresse | Belgique, Wallonia, Brabant wallon, **Chaussée d'Ophain 333, 1420 Braine-l'Alleud** ⬅️ **rue + n° + CP + commune ajoutés** |
| Site Web de l'entreprise | `https://mondedevis.eu/` |
| Secteur avec des restrictions de public | Non applicable |

### Vérification de l'entreprise

| Champ | Valeur saisie |
|---|---|
| Certification de l'entreprise | 2 documents uploadés ✅ (dont `list.pdf.png`) |
| Nom légal de l'entreprise | **Fortemps Joffrey** |
| Numéro de licence commerciale | **BE0891930638** |

**Pourquoi cette 3ᵉ tentative est justifiée** (malgré la décision « on arrête
de renvoir » du midi) : elle ne répète pas les mêmes données — elle corrige
l'**hypothèse n°1**, la plus probable du rejet du matin (adresse sans rue).
Le robot comparait « 1420 » vs l'adresse complète KBO → mismatch certain.

⚠️ **Si 3ᵉ rejet** (= si même avec la rue ça ne passe pas) → conclusion
définitive : le problème n'est pas l'adresse, c'est le **type d'entité**
(personne physique vs entité immatriculée attendue par TikTok « oversea »).
Là : **on arrête pour de bon**, le badge attend la bv/sarl ou le nom
commercial MonDevis inscrit au KBO.

## ✅ Décision

- La 3ᵉ tentative est **justifiée** (adresse corrigée = hypothèse principale).
- **Pas de 4ᵉ tentative** avec les mêmes données, quelle qu'en soit l'issue.
- Le badge reste **optionnel** : il ne bloque ni la publication, ni les stats,
  ni la vente.
- **Vrai fix** (quand MonDevis a des clients payants) : **inscrire un nom
  commercial « MonDevis » au KBO** (activité secondaire) ou créer une
  **bv/sarl** : là le badge attesterait la marque.

## ✅ À faire

- [x] ~~Publier `clip2-devis-vers-peppol.mp4`~~ ✅ **PUBLIÉ le 16/10 au matin (~9 h)** (Jo a avancé la séance ; publié ce matin et non à 18 h) — stats à noter dans `SUIVI-TIKTOK.md`
- [x] ~~1) **IG Reel**~~ ✅ **FAIT le 16/10** (confirmé par Jo — bio IG avec `mondedevis.eu` déjà en place depuis longtemps) ✅
- [x] ~~2) **YouTube Short**~~ ✅ **FAIT le 16/10** (confirmé par Jo — publiée **Public**, audience « pas destinée aux enfants », description + lien cliquable `https://mondedevis.eu`)
- [x] ~~3) **Facebook Reel**~~ ✅ **FAIT le 16/10** (confirmé par Jo) — **journée de lancement bouclée : TikTok + IG + YouTube + Facebook, même clip, même jour** 🚀
- [ ] Revérifier le statut de la 3ᵉ demande **17 ou 18/10** (pas avant : le robot met quelques heures à 1-2 j)
- [x] ~~Mettre à jour `SUIVI-TIKTOK.md`~~ ✅ fait (à rafraîchir selon issue de la 3ᵉ tentative)
- [ ] **Si approuvé** : noter ici + dans `SUIVI-TIKTOK.md` → 🎉 le badge est posé
- [ ] **Si rejeté** : **on arrête définitivement** — reprise du badge uniquement après création bv/sarl ou inscription MonDevis au KBO
