# 🎬 Démo vidéo MonDevis — 3 minutes (angle fiduciaire)

> **Décision Jo du 30/09 soir** : pas d'appel imposé aux fiduciaires.
> À la place : **une démo vidéo de 3 minutes**, enregistrée **une seule fois**,
> envoyée sur simple demande (mail, LinkedIn, DM groupes FB).
> Réutilisée aussi pour le post LinkedIn (1er commentaire).
> Matériel : **le Mac seulement** (QuickTime est déjà installé, gratuit).
> 🎙️ **Téléprompteur prêt à lire pendant le tournage : `TELEPROMPTEUR-DEMO-VIDEO.md`**
> (texte exact à dire + actions écran, minute par minute).

---

## 🎯 L'idée en une phrase

La fiduciaire **voit** une facture Peppol partir en 3 minutes — au lieu de
te demander 15 minutes d'appel. Zéro engagement de sa part, un simple
« oui » par mail et la vidéo part.

---

## 🛠️ Préparation (10 min)

- [ ] **Notifications coupées** : Réglages Mac → Concentration → « Ne pas
      déranger » activé (une notification de message perso dans la vidéo
      et c'est fichu).
- [ ] **Navigateur épuré** : une fenêtre seule, onglets fermés, session
      connectée au compte **démo uniquement** (demo@mondevis.eu — mot de
      passe dans le Trousseau d'accès macOS).
- [ ] **Test son de 10 secondes** : enregistre, réécoute. Si le micro du
      Mac suffit, garde-le ; si la voix sonne loin, un casque filaire
      change tout.
- [ ] Fermer les autres applis (le Mac tourne plus vite, la vidéo ne
      saccade pas).

---

## 🎥 MÉTHODE RETENUE (01/10) : tournage en 2 passes — voix d'abord, écran muet ensuite

> Décision Jo : parler ET cliquer en même temps = trop dur. On sépare.
> **C'est la méthode des pros et elle est plus simple.** Buffy fait l'assemblage.

**Passe 1 — La voix seule (10 min, 6 petits fichiers)**
1. QuickTime → Fichier → **Nouvel enregistrement audio** (juste le micro).
2. Options → Micro : casque ou intégré → Qualité : Maximale.
3. Enregistrer **bloc par bloc** : 6 fichiers `bloc-1.m4a` → `bloc-6.m4a`
   (texte dans `TELEPROMPTEUR-DEMO-VIDEO.md`). Un bloc raté = on refait
   SEULEMENT ce bloc. Laisser 2 s de silence avant/après chaque bloc.
4. Tout ranger dans `demo-video/`.

**Passe 2 — L'écran muet (10 min, un seul fichier)**
1. QuickTime → **Nouvel enregistrement de l'écran** → portion = fenêtre navigateur.
2. Options → **Micro : Aucun** (sinon souffle parasite).
3. Suivre les `[ACTION ÉCRAN]` du téléprompteur, dans l'ordre, SANS parler.
   Filmer chaque scène **plus longtemps que nécessaire** avec 2-3 s d'arrêt
   entre chaque (points de coupe pour le montage).
4. Exporter 1080p → `demo-video/video-ecran.mov`.

**Passe 3 — Buffy** : assemble voix + écran, coupe les silences, ajoute
le titre d'intro et la carte de fin, exporte `demo-mondevis-3min.mp4`.

---

## 🎥 (Ancienne méthode, si besoin) Le tournage en une prise avec QuickTime

1. **QuickTime Player** → Fichier → **Nouvel enregistrement de l'écran**.
2. Dans la barre d'outils : choisir **« Enregistrer une portion »** →
   cadre la fenêtre du navigateur (évite le bureau et les autres écrans).
3. Options → **Micro** : casque ou micro intégré.
4. **Démarrer** → déroule le scénario ci-dessous → bouton **Arrêter**.
5. Fichier → **Exporter sous** → 1080p → `demo-mondevis-3min.mp4`.

> ⚠️ **Règle d'or** : 2-3 prises max, garde la meilleure. Un petit défaut
> de diction rend le truc authentique — vise « correct et naturel », pas
> « studio ». Si tu te trompes en plein milieu : souffle, reprends la
> phrase, tu couperas au montage (ou pas — personne ne chronomètre).

---

## 📝 Le scénario (3 minutes, chronométrées)

| Temps | À l'écran | Ce que tu dis |
|---|---|---|
| 0:00–0:20 | Accueil mondedevis.eu | « Je suis menuisier indépendant à Bruxelles. J'ai construit un outil pour mes confrères artisans : MonDevis. Je vous montre en 3 minutes ce que vos clients vont émettre. » |
| 0:20–1:00 | Dashboard → devis **DEV-BE-2026-0001** (menuiseries extérieures, client pro : Charpentes & Associés SPRL) | « Voici un devis type : lignes de prix, TVA belge automatique — ici 21 %, les taux réduits rénovation sont gérés aussi — acompte et délai de paiement réglés d'office. » |
| 1:00–1:40 | Bouton **Télécharger PDF** | « Le client reçoit ça en 2 minutes, sur le chantier, et signe en ligne. Plus de devis Excel le soir à la maison. » |
| 1:40–2:30 | Facture **FAC-2026-0001** (Rénov'Bat) → montrer le bouton Peppol **sans cliquer** | « Et depuis janvier 2026, toute facture B2B doit partir via Peppol. Ici, c'est intégré : la facture part en UBL conforme sur le réseau, en un clic. Vos clients sont conformes, vous recevez des pièces propres. » |
| 2:30–3:00 | Page tarifs ou accueil | « L'essai est gratuit 14 jours, sans carte bancaire, et je configure chaque client moi-même — zéro effort pour vous comme pour lui. mondedevis.eu. » |

⚠️ **Ne JAMAIS cliquer « Envoyer via Peppol »** dans la démo : les clients
Rénov'Bat et Charpentes & Associés sont fictifs. On montre le bouton,
on n'appuie pas.
⚠️ Compte démo uniquement à l'écran — jamais ton compte perso ni de
vraies données client.

💡 **Option « chaîne complète »** (démo encore plus convaincante) : sur le
devis DEV-BE-2026-0001, cliquer « ✅ Accepter » (sans risque : simple
changement de statut, aucun mail envoyé) puis « Transformer en facture » →
la facture créée (client pro, TVA BE) affiche le bouton « Envoyer via
Peppol ». Ça remplace l'étape 1:40–2:30 (FAC-2026-0001) ou la complète.

---

## ☁️ Hébergement (5 min, au choix)

| Option | Avantage | Pour qui |
|---|---|---|
| **YouTube « non répertoriée »** ⭐ recommandé | Joue directement dans LinkedIn et les mails, pas de téléchargement | Post LinkedIn + mails |
| Google Drive, lien « tous avec le lien » | Plus discret, pas de page publique | Si tu préfères éviter YouTube |

Dans les deux cas : **teste le lien dans une fenêtre de navigation privée**
(il doit être accessible sans aucun compte).

---

## ♻️ Réutilisation (une fois la vidéo prête)

- **Mail 1 (BCC Consult)** : la phrase « j'ai préparé une courte vidéo de
  démo (3 minutes)… » est déjà dans le template → colle le lien.
- **Post LinkedIn** : lien en 1er commentaire.
- **Groupes FB / DM tièdes** : quand quelqu'un demande « ça donne quoi ? »
  → la vidéo répond à ta place.
- **Relance J+3** : « je vous avais parlé d'une démo vidéo — la voici »
  si la 1re réponse n'a pas demandé le lien.

---

## ✅ Checklist avant d'envoyer le lien

- [ ] Vidéo ≤ 3 min 15 (au-delà, les gens décrochent)
- [ ] Son clair, notifications coupées, rien de perso à l'écran
- [ ] Compte démo uniquement (client fictif, bouton Peppol montré sans cliquer)
- [ ] Lien testé en navigation privée
- [ ] Vidéo rangée (fichier + lien) notée dans la fiche reprise
