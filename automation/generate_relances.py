#!/usr/bin/env python3
"""
Mondevis — générateur de relances (follow-ups) pour les leads WhatsApp.

Génère le message de relance de l'étape courante pour chaque lead concerné,
l'affiche prêt à copier/coller dans WhatsApp, puis met à jour leads.csv
(étape suivante + date du dernier contact).

Usage :
    python3 generate_relances.py --list          # liste des leads et étapes
    python3 generate_relances.py --stats         # résumé par étape/statut
    python3 generate_relances.py --due           # relances dues aujourd'hui (auto)
    python3 generate_relances.py --stage J+3     # forcer une étape précise
    python3 generate_relances.py --due --dry-run # aperçu sans mise à jour du CSV
"""

import argparse
import csv
import sys
from datetime import date, datetime
from pathlib import Path

LEADS_CSV = Path(__file__).parent / "leads.csv"

STAGES = ["initial", "J+3", "J+7", "conversion", "closed"]
SKIP_STATUS = {"converted", "refused", "excluded"}

# Délai (en jours) après last_contact avant que la relance suivante soit "due".
STAGE_DELAYS = {"initial": 3, "J+3": 7, "J+7": 7, "conversion": 14}

TRADE_LABELS = {
    "électricien": "électricien",
    "plombier": "plombier",
    "plombier-électricien": "plombier-électricien",
    "plombier-chauffagiste": "plombier-chauffagiste",
    "peintre": "peintre",
    "rénovation": "rénovation",
    "menuisier": "menuisier",
    "couvreur": "couvreur",
}

TEMPLATES = {
    "J+3": (
        "Salut {name}, je reviens vers toi 🙂\n"
        "Pas d'obligation : c'est gratuit (3 devis/mois sans engagement).\n"
        "Tu me dis ce que tu en penses, même si c'est pour me dire que ça ne sert à rien.\n"
        "→ mondedevis.eu"
    ),
    "J+7": (
        "Alors {name}, tu as eu le temps de jeter un œil à MonDevis ?\n\n"
        "Dis-moi franchement :\n"
        "1. Qu'est-ce qui te manque pour l'utiliser au quotidien ?\n"
        "2. Qu'est-ce qui te ferait dire « ça vaut 19 €/mois » ?\n\n"
        "Ton retour vaut plus que n'importe quelle pub. Merci 🙏"
    ),
    "conversion": (
        "Merci pour ton retour {name} 🙏\n\n"
        "Si tu veux continuer, le plan Pro est à 19 €/mois (devis illimités,\n"
        "signature, WhatsApp intégré, relances auto). Annulable à tout moment.\n\n"
        "Je peux te configurer ton compte perso si tu veux."
    ),
}

# Le message 'initial' vit dans messages-whatsapp-10-artisans.md (déjà envoyé).
INITIAL_NOTE = (
    "Le message 'initial' est déjà envoyé manuellement (voir "
    "messages-whatsapp-10-artisans.md). Utilise --due, --stage J+3 ou plus."
)


def load_leads():
    with LEADS_CSV.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def save_leads(leads, fieldnames):
    with LEADS_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(leads)


def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def days_since(value, today):
    d = parse_date(value)
    return (today - d).days if d else None


def next_stage(stage):
    i = STAGES.index(stage)
    nxt = i + 1
    if nxt >= len(STAGES) - 1:
        return "conversion"
    return STAGES[nxt]


def due_leads(leads, today):
    """Leads dont le délai de l'étape courante est dépassé."""
    due = []
    for lead in leads:
        if lead["status"] in SKIP_STATUS:
            continue
        stage = lead.get("stage")
        if stage not in STAGE_DELAYS:
            continue
        elapsed = days_since(lead.get("last_contact"), today)
        if elapsed is None:
            continue
        if elapsed >= STAGE_DELAYS[stage]:
            due.append((lead, elapsed))
    return due


def cmd_list(leads):
    print(f"{'#':<3} {'Nom':<12} {'Société':<24} {'Métier':<22} {'Étape':<12} {'Dernier contact':<16} Statut")
    print("-" * 100)
    for i, lead in enumerate(leads, 1):
        print(
            f"{i:<3} {lead.get('name', ''):<12} {lead.get('company', ''):<24} "
            f"{lead.get('trade', ''):<22} {lead.get('stage', ''):<12} "
            f"{lead.get('last_contact', ''):<16} {lead.get('status', '')}"
        )
    pending = [l for l in leads if l.get("status") == "pending"]
    print(f"\n{len(pending)} leads actifs · {len(leads) - len(pending)} fermés/exclus")


def cmd_stats(leads, today):
    by_stage, by_status = {}, {}
    for lead in leads:
        by_stage[lead.get("stage", "?")] = by_stage.get(lead.get("stage", "?"), 0) + 1
        by_status[lead.get("status", "?")] = by_status.get(lead.get("status", "?"), 0) + 1

    print("📊 Résumé des leads")
    print("-" * 40)
    print("Par statut :")
    for status, count in sorted(by_status.items()):
        print(f"  {status:<12} {count}")
    print("Par étape :")
    for stage, count in sorted(by_stage.items()):
        print(f"  {stage:<12} {count}")

    due = due_leads(leads, today)
    print(f"\n🔔 Relances dues aujourd'hui : {len(due)}")
    for lead, elapsed in due:
        nxt = next_stage(lead["stage"])
        print(f"  → {lead['name']} ({lead['company']}) — {lead['stage']} il y a {elapsed} j → relance : {nxt}")


def cmd_generate(leads, stage, today, dry_run):
    if stage not in TEMPLATES:
        print(INITIAL_NOTE if stage == "initial" else f"Étape inconnue : {stage}")
        sys.exit(1)

    fieldnames = list(leads[0].keys())
    today_iso = today.isoformat()
    generated = 0

    for lead in leads:
        if lead["status"] in SKIP_STATUS:
            continue
        if lead.get("stage") != stage:
            continue

        trade = TRADE_LABELS.get(lead.get("trade", ""), lead.get("trade", ""))
        message = TEMPLATES[stage].format(name=lead["name"], trade=trade, company=lead["company"])

        print("=" * 60)
        print(f"📱 {lead['name']} — {lead['company']} ({trade}, {lead['city']})")
        if lead.get("phone"):
            print(f"📞 https://wa.me/{lead['phone'].replace('+', '')}")
        print("-" * 60)
        print(message)
        print()

        if not dry_run:
            lead["stage"] = next_stage(stage)
            lead["last_contact"] = today_iso
        generated += 1

    if generated and not dry_run:
        save_leads(leads, fieldnames)
    print("=" * 60)
    if dry_run:
        print(f"🔍 {generated} messages générés (dry-run — leads.csv non modifié)")
    else:
        print(f"✅ {generated} messages générés · leads.csv mis à jour (étape + date {today_iso})")
        print("⚠️  Envoie-les un par un depuis ton WhatsApp personnel (pas d'envoi massif).")


def cmd_generate_due(leads, today, dry_run):
    """Génère les relances dues : pour chaque lead dû, on utilise le template
    de l'étape SUIVANTE (celle qu'on est en train de déclencher)."""
    fieldnames = list(leads[0].keys())
    today_iso = today.isoformat()
    due = due_leads(leads, today)
    generated = 0

    for lead, elapsed in due:
        current = lead["stage"]
        nxt = next_stage(current)
        if nxt not in TEMPLATES:
            continue

        trade = TRADE_LABELS.get(lead.get("trade", ""), lead.get("trade", ""))
        message = TEMPLATES[nxt].format(name=lead["name"], trade=trade, company=lead["company"])

        print("=" * 60)
        print(f"📱 {lead['name']} — {lead['company']} ({trade}, {lead['city']})")
        print(f"   {current} depuis {elapsed} j → relance « {nxt} »")
        if lead.get("phone"):
            print(f"📞 https://wa.me/{lead['phone'].replace('+', '')}")
        print("-" * 60)
        print(message)
        print()

        if not dry_run:
            lead["stage"] = nxt
            lead["last_contact"] = today_iso
        generated += 1

    if generated and not dry_run:
        save_leads(leads, fieldnames)
    print("=" * 60)
    if dry_run:
        print(f"🔍 {generated} relances dues (dry-run — leads.csv non modifié)")
    else:
        print(f"✅ {generated} relances générées · leads.csv mis à jour ({today_iso})")
        print("⚠️  Envoie-les un par un depuis ton WhatsApp personnel (pas d'envoi massif).")


def main():
    parser = argparse.ArgumentParser(description="Générateur de relances Mondevis")
    parser.add_argument("--list", action="store_true", help="lister les leads et étapes")
    parser.add_argument("--stats", action="store_true", help="résumé par étape/statut + relances dues")
    parser.add_argument("--due", action="store_true", help="générer les relances dues aujourd'hui (auto)")
    parser.add_argument("--stage", help="forcer une étape : J+3 | J+7 | conversion")
    parser.add_argument("--dry-run", action="store_true", help="aperçu sans modifier leads.csv")
    args = parser.parse_args()

    if not LEADS_CSV.exists():
        print(f"Introuvable : {LEADS_CSV}")
        sys.exit(1)

    leads = load_leads()
    today = date.today()

    if args.list:
        cmd_list(leads)
    elif args.stats:
        cmd_stats(leads, today)
    elif args.due:
        cmd_generate_due(leads, today, args.dry_run)
    elif args.stage:
        cmd_generate(leads, args.stage, today, args.dry_run)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
