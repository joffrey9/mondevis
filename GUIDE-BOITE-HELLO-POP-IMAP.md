# 📥 Guide — Boîte `hello@` relevée en IMAP depuis Hotmail (anti-spam)

> **But** : recevoir `hello@mondedevis.eu` dans Hotmail **sans passer par le spam**
> (élimine le souci SPF de la redirection).
> **Principe** : au lieu de *rediriger* (ré-expédition → SPF en échec), on crée une
> **vraie boîte** `hello@` chez OVH, et Hotmail va **la relever** en IMAP.

> ⚠️ **Optionnel** : la redirection actuelle + « expéditeur approuvé » suffit déjà.
> Fais ceci uniquement si tu veux éliminer le spam à 100 %.

---

## Étape 1 — Créer la boîte `hello@` (OVH, 2 min)

1. **Web Cloud → Emails → `mondedevis.eu` → onglet `Emails`**
2. Bouton **« Créer une adresse e-mail »** (ou « Ajouter un compte »).
3. Adresse : `hello@mondedevis.eu` · mot de passe fort (note-le).
4. Valider.

> Le MX Plan inclut un quota de boîtes (souvent 5/10). Créer `hello@` est gratuit
> tant que le quota le permet.

## Étape 2 — Supprimer l'ancienne redirection (OVH)

1. **Emails → `mondedevis.eu` → `Gestion des redirections`**
2. Supprimer la ligne `hello@ → joffrey-menuiserie@hotmail.com`.

> Si on garde la redirection **en plus** de la boîte, le mail arrivera 2 fois
> (1 dans la boîte + 1 redirigé vers Hotmail, en spam).

## Étape 3 — Relever la boîte depuis Hotmail (IMAP)

1. **Hotmail → ⚙ Paramètres → Courrier → « Synchroniser les e-mails » (comptes connectés)**
2. **Ajouter un compte** → saisir `hello@mondedevis.eu`.
3. Choisir **IMAP** et remplir manuellement :

| Champ | Valeur |
|---|---|
| Serveur entrant (IMAP) | `ssl0.ovh.net` |
| Port | `993` |
| Chiffrement | SSL/TLS |
| Nom d'utilisateur | `hello@mondedevis.eu` (adresse complète) |
| Mot de passe | celui défini à l'étape 1 |

4. Valider. Hotmail relève la boîte toutes les ~15-30 min.

## Étape 4 — Tester

1. Depuis Gmail, envoyer un mail à `hello@mondedevis.eu`.
2. Attendre la synchronisation (≤ 30 min) → le mail apparaît dans Hotmail,
   **directement en boîte de réception** (pas en spam).

---

## Réglages OVH de référence (MX Plan)

| Protocole | Serveur | Port | Chiffrement |
|---|---|---|---|
| IMAP (entrant) | `ssl0.ovh.net` | 993 | SSL/TLS |
| POP3 (entrant) | `ssl0.ovh.net` | 995 | SSL/TLS |
| SMTP (sortant) | `ssl0.ovh.net` | 465 | SSL/TLS |

> Nom d'utilisateur = adresse complète (`hello@mondedevis.eu`).

---

*Rédigé le 17/08/2026.*
