# MEMO SESSION — 2026-09-04 (handoff : reprise prochaine session)

> **SCOPE** : `MonDevis` uniquement.

## 🎯 Objectif de la session

Suite de la reprogrammation Publer après la réautorisation d'un compte social
(session du 02-03/09). Vérifier l'état réel des publications, créer ce qui manque.

## ✅ Fait aujourd'hui (04/09)

### 1. 🕵️ Vérification — les posts 1-4 étaient DÉJÀ programmés
Contrairement à ce que craignait le MEMO du 03/09 (Publer aurait tout effacé),
Jo a vérifié le calendrier Publer : **les publications existaient jusqu'au 11/09**.
- Teaser 1 (31/08 09:00) : ✅ passé
- Teaser 2 (02/09 17:30) : ✅ passé
- Teaser 3 (ven 04/09 11:00) : ✅ programmé (post 1)
- Post 2 (lun 07/09 09:00) : ✅ programmé
- Post 3 (mer 09/09 17:30) : ✅ programmé
- Post 4 (ven 11/09 11:00) : ✅ programmé
- Comptes cibles confirmés : IG @mondedevis + FB MonDevis (pas de mélange Fortemps)

### 2. ➕ Posts 5-10 créés par Jo (confirmé « les dix posts sont programmés »)
- Post 5 (lun 14/09 09:00) — Relances automatiques ✅
- Post 6 (mer 16/09 17:30) — Fierté artisanale ✅
- Post 7 (ven 18/09 11:00) — Bénéfices concrets ✅
- Post 8 (lun 21/09 09:00) — Devis depuis le modèle ✅
- Post 9 (mer 23/09 17:30) — Le problème du devis manuel ✅
- Post 10 (ven 25/09 11:00) — Factures Peppol Belgique ✅

### 3. 📄 Fichier suivi mis à jour
- `SUIVI-REPROGRAMMATION-2026-09-04.md` : cases 1-10 cochées ✅, progression 10/13.

## 🔍 À faire à la reprise

1. **Vague 2 (posts 11-13)** dès que des posts sont publiés (limite 10 du plan gratuit) :
   - Post 11 (lun 28/09 09:00) — Soirée administrative
   - Post 12 (mer 30/09 17:30) — Gain de temps chiffré
   - Post 13 (ven 02/10 11:00) — Signature électronique
   - Textes : `PUBLIER-REPRISE-2026-09-04.txt` (posts 11-13)
2. **Vérifier le Teaser 3** passé aujourd'hui 11:00 (historique Publer limité 24h sur plan gratuit)
   → à confirmer demain ou via les comptes IG/FB.
3. **Vidéo de lancement MonDevis** (`output/mondevis-hello-final-avec-endcard.mp4`, 35 s,
   script corrigé + carte de fin) : Publer a REFUSÉ la programmation (limite 10 posts
   programmés atteinte jusqu'au 25/09). Décision Jo : publier samedi 05/09 au matin
   via **« Post now »** (ne compte pas dans la limite) sur IG @mondedevis + FB MonDevis.
   → vérifier à la reprise que la vidéo est bien en ligne.
4. Lancement officiel lundi 07/09 → post 2 (appel testeurs) déjà en place.

## ⚠️ Rappels MonDevis à garder en tête
- **Plan Publer gratuit** : historique conservé 24 h seulement, 10 posts programmés max.
- Pas de clé API Publer/Meta dans `.env` → tout se fait à la main dans Publer.

## 🚫 Décision Jo (04/09) — WhatsApp froid EN PAUSE

- **Constat** : 0 réponse sur ~15 contacts froids WhatsApp (5 FR 17-19/08 + 10 BE 30/08).
- **Décision de Jo** : pause du démarchage WhatsApp à froid + **focus inbound**
  (posts programmés jusqu'au 02/10 + triage rapide des réponses IG/FB).
- WhatsApp reste un canal de **conversion** pour les intéressés (réponse « DEVIS »),
  pas de prospection à froid.
- Fichiers mis à jour : `profil-mondevis/SKILL.md` (décision), `messages-belgique.md`
  et `dm-relances-avatar.md` (bandeau ⛔ PAUSE). Ne PAS relancer sans décision de Jo.
- **Piste à creuser si Jo relance l'outbound** : email sur les leads belges avec
  adresse (Alan, Christophe, LD Wood…) — à valider avec Jo.
- Triage inbound : rituel 1×/jour (`triage.py` + réponses R1-R6 dans `triage-interactions.md`),
  répondre dans l'heure aux 🟢/🔵.

## 🚗 PISTE FUTURE — App BMW Service History (04/09, NON lancée)

- Jo veut **le même programme** que « AG Service History BMW MINI SERVICE » (lecture
  de l'historique d'entretien dans la voiture via ENET, sauvegarde locale par VIN, sans SSH).
- **Sa situation** : BMW 2020+ (iDrive 7/MGU, au-dessus de NBT Evo) + PC avec ISTA + boîtier ENET. Pour lui (pas un produit).
- **Open source trouvé** : `theDeniZ/ServiceManager` (gestion historique NBT, MIT),
  `uholeschak/ediabaslib` (lib .NET qui remplace EDIABAS, lit .GRP/.PRG, ENET),
  `jacobschaer/python-doipclient` (client DoIP pur Python).
- **Décisions Jo** : clone complet (périmètre B) + **Python**. Lancement : **session dédiée plus tard**.
- **Plan en 3 étapes** : 1) squelette app FR (dossiers VIN, entretiens, sauvegarde locale),
  2) connexion ENET + lecture VIN (DoIP) à tester sur sa voiture, 3) lecture historique MGU
  (moins documenté que NBT → tests itératifs avec son ISTA).
- 🔴 Attention : lecture historique iDrive 7 = partie incertaine, à valider sur le véhicule.

## 🎬 Générateur de vidéos — MoneyPrinterTurbo (04/09)

- **Installé** : `creative-studio/MoneyPrinterTurbo/` (Docker, config protégée du git).
  WebUI http://127.0.0.1:8501 · API sur 8081 (8080 occupé). LLM = Groq (clé `.env.local`),
  voix Edge TTS gratuite.
- **Test 1 validé** : vidéo 9:16 ~17 s, script IA + voix Henri + sous-titres,
  à partir de 3 photos de chantier Fortemps.
- **Bug corrigé (EXIF)** : photos iPhone à l'envers → `normalize-photos.py` applique
  la rotation dans les pixels.
- **✅ Procédure standard** (photos redressées automatiquement à chaque génération) :
  1. Déposer les photos dans `creative-studio/MoneyPrinterTurbo/storage/local_videos/`
  2. `cd creative-studio/MoneyPrinterTurbo && ./generate-video.sh "Sujet de la vidéo"`
     (option : lister les photos à utiliser à la suite)
  3. Vidéo finale dans `storage/tasks/<id>/final-*.mp4`
- **Source Pexels** (visuels de stock, ~2 min au lieu de 15) : clé API ajoutée dans
  `config.toml` (protégé). `--video-source pexels --video-terms "mot1,mot2,..."`.
  ⚠️ Bien guider le script IA : le sujet pilote le texte (1er test = description
  marketplace erronée — pas le positionnement réel de MonDevis).
- **Carte de fin (end card)** : `cd creative-studio && python3 endcard.py mondevis "mondedevis.eu" --cta "…"`
  puis `./add-endcard.sh video.mp4 output/endcard-mondevis.png 4`.
  ⚠️ Un fichier vidéo ne contient PAS de lien cliquable — le lien réel se met à
  la publication (sticker lien IG / description FB / bio).
- **Pistes** : lot de vidéos en série, sujets récurrents Fortemps/MonDevis,
  musique de fond (actuellement voix seule). Rendu image→clip ~3,5 min/photo.
