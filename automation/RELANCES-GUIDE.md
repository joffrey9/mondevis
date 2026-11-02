# 🚀 Mondevis — Automatisation des relances (follow-up)

> **Objectif** : automatiser les relances des leads (WhatsApp / réseaux) du projet Mondevis.
> **État actuel** : 10 contacts initiaux envoyés (17/08) + relances J+3 (19/08) sans réponse.
> Ce kit automatise la génération des messages de relance par étape et met à jour le suivi.

## 📁 Fichiers

| Fichier | Rôle |
|---|---|
| `leads.csv` | Base des leads : contact, canal, statut, date du dernier contact, étape de relance |
| `generate_relances.py` | Génère les messages de relance de l'étape courante pour chaque lead concerné + met à jour `leads.csv` |
| `RELANCES-GUIDE.md` | Ce guide |

## 🚀 Usage

```bash
cd mondevis/automation
python3 generate_relances.py --stats          # résumé : qui relancer aujourd'hui
python3 generate_relances.py --due --dry-run  # aperçu des relances dues (ne modifie rien)
python3 generate_relances.py --due            # génère les relances dues + met à jour le CSV
python3 generate_relances.py --stage J+7      # forcer une étape précise
python3 generate_relances.py --list           # liste des leads et étapes
```

Sortie : les messages sont affichés prêts à copier/coller dans WhatsApp (un par un,
pour éviter le spam), avec le lien `wa.me` de chaque contact. Le CSV est mis à jour
(étape suivante + date).

## 📊 Étapes de relance

| Étape | Quand | Objectif |
|---|---|---|
| `initial` | Jour 0 | Premier contact (message type déjà envoyé) |
| `J+3` | 3 jours sans réponse | Rappel doux, sans pression |
| `J+7` | 7 jours | Demander un feedback honnête (2 questions) |
| `conversion` | après feedback positif | Offre Pro 19 €/mois + configuration |
| `closed` | — | Converti ou écarté (plus recontacté) |

## 📄 Format de `leads.csv`

```csv
name,company,trade,city,phone,channel,stage,last_contact,status
Jérôme,CLAU'ELEC,électricien,Nantes,+33619621550,whatsapp,initial,2026-08-19,pending
```

- `stage` : `initial | J+3 | J+7 | conversion | closed`
- `status` : `pending | interested | converted | refused | excluded`
- Les leads dont le `status` est `converted/refused/excluded` sont automatiquement ignorés.
- Les délais automatiques : `initial` → 3 j, `J+3` → 7 j, `J+7` → 7 j, `conversion` → 14 j.

## 🔁 Règles anti-spam (garanties par conception)

- Le script **n'envoie jamais** de messages : il **génère le texte**, c'est toi qui l'envoies depuis ton WhatsApp.
- Maximum 1 relance par étape par lead ; `generate_relances.py` avance l'étape après génération.
- Les leads `closed` sont exclus automatiquement de tous les cycles futurs.
