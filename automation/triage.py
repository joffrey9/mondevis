#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Triage assisté des interactions @mondedevis (Instagram / Facebook / WhatsApp).

Usage :
    python3 triage.py add          # ajouter une interaction (guidé, interactif)
    python3 triage.py add --quick 'canal;auteur;extrait;cat;reponse'   # sans interaction
    python3 triage.py list         # dernières interactions
    python3 triage.py stats        # synthèse globale
    python3 triage.py semaine      # synthèse de la semaine en cours
    python3 triage.py reponse R1   # afficher une réponse type à copier

Catégories : vert (intéressé), question, objection, beta, bruit, spam
Réponses    : R1 (intéressé), R2 (question), R3 (objection), R4 (bêta), R5 (bruit), R6 (refus poli), R7 (plus tard)
"""

import csv
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

CSV_PATH = Path(__file__).parent / "interactions.csv"

CATS = {
    "vert": "🟢 INTÉRESSÉ",
    "question": "❓ QUESTION",
    "objection": "🟡 OBJECTION",
    "beta": "🔵 BÊTA",
    "bruit": "⚪ BRUIT",
    "spam": "🔴 SPAM",
}

REPONSES = {
    "R1": """Merci [Prénom] 🙏 Tu peux tester gratuitement : 3 devis/mois gratuits,
14 jours d'essai complet sans CB → mondedevis.eu
Si tu bloques sur quelque chose, dis-le-moi, je suis l'artisan derrière l'outil.""",
    "R2": """Bonne question [Prénom] ! [RÉPONSE COURTE CI-DESSOUS]
Tout est détaillé sur mondedevis.eu — et tu peux tester gratuitement (sans CB).""",
    "R3": """Je comprends [Prénom] — j'étais pareil avant de créer l'outil 😄
Le vrai test : le prochain devis que tu dois faire, chronomètre-le sur
mondedevis.eu. S'il prend plus de 2 minutes, tu m'envoies la facture du temps perdu 😉""",
    "R4": """Top [Prénom] ! Je t'active l'accès bêta : 14 jours complets offerts,
sans CB, avec accompagnement perso (moi, directement).
Crée ton compte sur mondedevis.eu et dis-moi ton premier retour —
même négatif, ça m'aide 🙏""",
    "R5": "Merci 🙏",
    "R6": """Pas de souci [Prénom], merci de m'avoir répondu ! 🙏
Si un jour le devis à la main devient trop lourd, pense à mois :
le lien reste actif → mondedevis.eu
Bonne continuation sur les chantiers !""",
    "R7": """Compris [Prénom], pas de souci ! L'outil reste dispo quand tu veux :
mondedevis.eu — et l'essai gratuit (sans CB) est toujours là.
Bonne semaine et bon courage sur les chantiers 🙏""",
}

REPONSES_R2 = {
    "prix": "3 devis/mois gratuits. Au-delà : Pro 19 €/mois (devis illimités), Business 49 €/mois.",
    "tva": "Oui, TVA auto : FR 20/10/5,5 % · BE 21/12/6 %. Le taux réduit rénovation énergétique est géré.",
    "signature": "Ton client signe sur son téléphone, tu reçois le PDF signé direct. Zéro papier.",
    "peppol": "Oui, facturation électronique B2B belge Peppol intégrée (UBL 2.1 via e-invoice.be).",
    "whatsapp": "Oui, envoi du devis en PDF direct dans la conversation WhatsApp.",
}

FIELDS = ["date", "canal", "auteur", "extrait", "categorie", "reponse_envoyee", "suivi"]


def charger() -> list[dict]:
    if not CSV_PATH.exists():
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def sauvegarder(rows: list[dict]) -> None:
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def demander(clef: str, exemple: str = "") -> str:
    suffixe = f" (ex. {exemple})" if exemple else ""
    val = input(f"  {clef}{suffixe} : ").strip()
    return val


def cmd_add(quick: str | None) -> None:
    rows = charger()
    if quick:
        parts = quick.split(";")
        if len(parts) != 5:
            sys.exit("Format --quick : 'canal;auteur;extrait;catégorie;réponse'")
        canal, auteur, extrait, cat, rep = (p.strip() for p in parts)
    else:
        print("\n➕ Nouvelle interaction (Ctrl+C pour annuler)\n")
        canal = demander("Canal", "ig | fb | wa | autre")
        auteur = demander("Auteur (pseudo/prénom)")
        extrait = demander("Extrait du message")
        print(f"  Catégories : {', '.join(f'{k} = {v}' for k, v in CATS.items())}")
        cat = demander("Catégorie", " | ".join(CATS)).lower()
        rep = demander("Réponse envoyée (R1-R5 ou texte libre)")

    if cat not in CATS:
        sys.exit(f"Catégorie inconnue : {cat}. Choix : {', '.join(CATS)}")

    rows.append({
        "date": date.today().isoformat(),
        "canal": canal,
        "auteur": auteur,
        "extrait": extrait,
        "categorie": cat,
        "reponse_envoyee": rep,
        "suivi": "",
    })
    sauvegarder(rows)

    emoji = CATS[cat].split()[0]
    print(f"\n✅ Enregistré : {emoji} {auteur} ({canal}) le {date.today().isoformat()}")
    if cat in ("vert", "beta"):
        print("⚡ RÈGLE D'OR : réponds dans l'heure !")
        # Proposer la réponse type
        code = "R4" if cat == "beta" else "R1"
        print(f"\n📋 Réponse type à copier ({code}) :\n")
        print(REPONSES[code])


def cmd_list(limite: int = 15) -> None:
    rows = charger()
    if not rows:
        print("Aucune interaction enregistrée. Lance : python3 triage.py add")
        return
    print(f"\n📋 {len(rows)} interaction(s) — {limite} dernières :\n")
    for r in rows[-limite:]:
        emoji = CATS.get(r["categorie"], "❔").split()[0]
        suivi = f" → {r['suivi']}" if r["suivi"] else ""
        print(f"  {r['date']}  {emoji} [{r['canal']}] {r['auteur']} : {r['extrait'][:50]}{suivi}")


def _synthese(rows: list[dict], titre: str, depuis: date | None) -> None:
    if depuis:
        rows = [r for r in rows if r["date"] >= depuis.isoformat()]
    print(f"\n📈 {titre} ({len(rows)} interaction(s))\n")
    if not rows:
        print("  Rien à afficher.")
        return
    compte: dict[str, int] = {}
    for r in rows:
        compte[r["categorie"]] = compte.get(r["categorie"], 0) + 1
    for cle, label in CATS.items():
        n = compte.get(cle, 0)
        barre = "█" * n
        print(f"  {label:<15} {n:>3}  {barre}")
    chaud = compte.get("vert", 0) + compte.get("beta", 0)
    print(f"\n  🔥 Leads chauds (🟢+🔵) : {chaud}")
    if chaud:
        print("  ⚡ Vérifie que chacun a reçu une réponse dans l'heure !")


def cmd_semaine() -> None:
    lundi = date.today() - timedelta(days=date.today().weekday())
    _synthese(charger(), f"Semaine du {lundi.isoformat()}", lundi)


def cmd_stats() -> None:
    _synthese(charger(), "Synthèse globale", None)


def cmd_reponse(code: str) -> None:
    # R2-prix / R2-tva / ... : thème de question
    if code.upper().startswith("R2-"):
        cle = code.split("-", 1)[1].lower()
        if cle in REPONSES_R2:
            print(f"\n📋 R2 — thème « {cle} » :\n\n{REPONSES['R2'].replace('[RÉPONSE COURTE CI-DESSOUS]', REPONSES_R2[cle])}")
            return
    code = code.upper()
    if code in REPONSES:
        print(f"\n📋 Réponse {code} :\n\n{REPONSES[code]}")
        return
    if code.lower() in REPONSES_R2:
        cle = code.lower()
        print(f"\n📋 R2 — thème « {cle} » :\n\n{REPONSES['R2'].replace('[RÉPONSE COURTE CI-DESSOUS]', REPONSES_R2[cle])}")
        return
    print(f"Code inconnu. Réponses : {', '.join(REPONSES)} · thèmes R2 : {', '.join(REPONSES_R2)}")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "add":
        cmd_add(sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == "--quick" else None)
    elif cmd == "list":
        cmd_list()
    elif cmd == "stats":
        cmd_stats()
    elif cmd == "semaine":
        cmd_semaine()
    elif cmd == "reponse":
        if len(sys.argv) < 3:
            sys.exit("Usage : python3 triage.py reponse R1|R2-prix|tva|signature|peppol|whatsapp")
        cmd_reponse(sys.argv[2])
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
