# 📧 Guide — Redirection `hello@mondedevis.eu` (OVH MX Plan)

> **But** : recevoir les emails envoyés à `hello@mondedevis.eu` sur
> `joffrey-menuiserie@hotmail.com`.
> **Statut** : ✅ **FONCTIONNEL** (vérifié le 17/08/2026).

---

## ✅ Configuration correcte (récapitulatif)

Le domaine `mondedevis.eu` utilise une offre **MX Plan** (pas l'offre gratuite
« Redirect »). C'est important : les deux systèmes n'ont **pas** les mêmes MX.

### Enregistrements MX (dans la Zone DNS)

| Priorité | Cible |
|---|---|
| 1 | `mx0.mail.ovh.net.` |
| 5 | `mx1.mail.ovh.net.` |
| 50 | `mx2.mail.ovh.net.` |
| 100 | `mx3.mail.ovh.net.` |
| 200 | `mx4.mail.ovh.net.` |

> ⚠️ **Ne pas** utiliser `redirect.ovh.net` (c'était le bug : les mails partaient
> vers la mauvaise offre et étaient rejetés en `521 No Redirect Entry`).

### Redirection (dans le MX Plan)

Chemin : **Web Cloud → Emails → `mondedevis.eu` → onglet `Emails` → `Gestion des redirections`** :

| Champ | Valeur |
|---|---|
| De | `hello@mondedevis.eu` |
| Vers | `joffrey-menuiserie@hotmail.com` |
| Mode de copie | Ne pas conserver de copie |

---

## 🧪 Tester

1. Depuis **un autre compte** (Gmail), envoyer un mail à **`hello@mondedevis.eu`**.
2. Vérifier `joffrey-menuiserie@hotmail.com` — **d'abord le dossier « Courrier indésirable »**.

> La 1re fois, le mail arrive en **spam** (normal : une redirection garde
> l'expéditeur d'origine mais passe par le serveur OVH → SPF en échec chez Hotmail).
> Marquer « légitime » + ajouter `mondedevis.eu` aux **expéditeurs approuvés**.

---

## 🛟 Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| `521 No Redirect Entry` (rebond) | MX pointe vers `redirect.ovh.net` au lieu du MX Plan | Mettre les MX `mx0…mx4.mail.ovh.net` |
| Rien n'arrive | Propagation MX (4-24 h) | `dig +short MX mondedevis.eu` → doit montrer `mx*.mail.ovh.net` |
| Arrive en spam | Redirection → SPF en échec chez Hotmail | Marquer légitime + expéditeur approuvé |
| Vérifier côté serveur | — | test SMTP : `RCPT TO hello@mondedevis.eu` sur `mx0.mail.ovh.net` doit répondre `250` |

---

*Rédigé le 17/08/2026 — correction du MX (passage de `redirect.ovh.net` au MX Plan).*
