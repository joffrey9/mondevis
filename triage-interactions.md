# 🧯 Triage assisté — Commentaires & DM MonDevis (@mondedevis)

> **Mode** : triage manuel assisté (pas d'API Meta). Tu colles le commentaire/DM
> reçu, tu coches la catégorie, et tu copies la réponse type correspondante.
> **Mise à jour** : 2×/jour (matin ~8 h + fin d'après-midi ~18 h), 5 min par passage.
> **Ground truth** : ta boîte IG/FB + tes notifications.
>
> ⚡ **Version scriptée** : `automation/triage.py` journalise tout dans
> `automation/interactions.csv` et affiche les réponses types :
>
> ```bash
> cd mondevis/automation
> python3 triage.py add            # journaliser une interaction (guidé) + voir la réponse type
> python3 triage.py list           # dernières interactions
> python3 triage.py semaine       # synthèse de la semaine
> python3 triage.py stats         # synthèse globale
> python3 triage.py reponse R2-tva  # réponse type sur un thème précis
> ```

---

## 🔁 Rituel quotidien (2 passages de 5 min : ~8 h et ~18 h)

1. **Ouvre les boîtes** : IG (Messages + demandes + commentaires sur tes posts)
   et FB Page (Messenger + notifications + commentaires).
2. **Classe chaque interaction** (codes R1-R6, §1 ci-dessous).
3. **Règle d'or — réponds dans l'heure** aux 🟢 intéressés et 🔵 bêta
   (vitesse de réponse = 1er facteur de conversion). Réponse type : `triage.py reponse R1` / `R4`.
4. **Journalise** chaque interaction : `python3 triage.py add`
   (ou `--quick 'canal;auteur;extrait;cat;reponse'`).
5. **Si rien** : c'est un résultat, pas un échec — ne force pas de contenu.
6. **Dimanche (2 min)** : `python3 triage.py semaine` → reporte la synthèse
   dans le tableau hebdo (§4) et note la portée des posts de la semaine.

> ⚠️ **Comptes récents (sept. 2026)** : l'audience IG/FB MonDevis démarre ~à 0
> (Jo n'a pas partagé les posts avec amis/connaissances). Les premières semaines,
> le triage sera **souvent vide — c'est normal**. Le rituel sert à être prêt et
> rapide quand les réponses arrivent, et à **mesurer** (stats hebdo) plutôt
> qu'à espérer du volume immédiat. La priorité des premières semaines : la
> **portée** (voir les pistes de croissance dans le profil projet).

---

## 1️⃣ Classifier en 10 secondes

| Code | Catégorie | Signal | Réponse type |
|---|---|---|---|
| 🟢 | **INTÉRESSÉ** | « ça a l'air bien », « comment ça marche ? », « je teste » | R1 (essai gratuit + lien) |
| ❓ | **QUESTION** | prix, TVA, Peppol, signature, compatibilité | R2 (réponse ciblée + lien) |
| 🟡 | **OBJECTION** | « c'est payant ? », « j'ai déjà Excel », « pas le temps » | R3 (anti-objection) |
| 🔵 | **BÊTA** | répond « DEVIS » au MP, veut tester en échange de retour | R4 (onboarding bêta) |
| ⚪ | **BRUIT** | emojis seuls, « bravo », hors-sujet | R5 (like + merci court) |
| 🔴 | **SPAM/TOXIQUE** | pub concurrente, insultes, bots | R6 (ignorer/supprimer) |

---

## 2️⃣ Réponses types (copier-coller, personnalise le prénom)

### R1 — Intéressé
```
Merci [Prénom] 🙏 Tu peux tester gratuitement : 3 devis/mois gratuits,
14 jours d'essai complet sans CB → mondedevis.eu
Si tu bloques sur quelque chose, dis-le-moi, je suis l'artisan derrière l'outil.
```

### R2 — Question (adapter la partie entre crochets)
```
Bonne question [Prénom] ! [RÉPONSE COURTE CI-DESSOUS]
Tout est détaillé sur mondedevis.eu — et tu peux tester gratuitement (sans CB).
```
Réponses courtes par thème :
- **Prix** : « 3 devis/mois gratuits. Au-delà : Pro 19 €/mois (devis illimités), Business 49 €/mois. »
- **TVA** : « Oui, TVA auto : FR 20/10/5,5 % · BE 21/12/6 %. Le taux réduit rénovation énergétique est géré. »
- **Signature** : « Ton client signe sur son téléphone, tu reçois le PDF signé direct. Zéro papier. »
- **Peppol** : « Oui, facturation électronique B2B belge Peppol intégrée (UBL 2.1 via e-invoice.be). »
- **WhatsApp** : « Oui, envoi du devis en PDF direct dans la conversation WhatsApp. »

### R3 — Objection
```
Je comprends [Prénom] — j'étais pareil avant de créer l'outil 😄
Le vrai test : le prochain devis que tu dois faire, chronomètre-le sur
mondedevis.eu. S'il prend plus de 2 minutes, tu m'envoies la facture du temps perdu 😉
```

### R4 — Bêta
```
Top [Prénom] ! Je t'active l'accès bêta : 14 jours complets offerts,
sans CB, avec accompagnement perso (moi, directement).
Crée ton compte sur mondedevis.eu et dis-moi ton premier retour —
même négatif, ça m'aide 🙏
```

### R5 — Bruit
```
Merci 🙏
```
(+ like. Rien d'autre.)

### R6 — Spam/Toxique
- Supprimer le commentaire (ou ignorer le DM).
- Ne JAMAIS répondre. Noter le pseudo dans la liste noire ci-dessous.

---

## 3️⃣ Journal de tri (à remplir au fil de l'eau)

| Date | Canal | Auteur | Extrait | Cat. | Réponse envoyée | Suivi |
|---|---|---|---|---|---|---|
| | | | | | | |

## 🚫 Liste noire (spam/bots récurrents)

| Pseudo | Raison | Date |
|---|---|---|

## 📈 Synthèse hebdomadaire (dimanche, 2 min)

| Semaine | 🟢 Intéressé | ❓ Questions | 🟡 Objections | 🔵 Bêta | ⚪ Bruit | 🔴 Spam | Comptes créés |
|---|---|---|---|---|---|---|---|
| S35 | | | | | | | |

> 💡 **Règle d'or** : tout 🟢 ou 🔵 reçoit une réponse **dans l'heure** si possible —
> la vitesse de réponse est le premier facteur de conversion sur les réseaux.
