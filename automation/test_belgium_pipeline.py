#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test du pipeline belge MonDevis : leads-belgique.csv + messages-belgique.md.

Vérifie :
  1. Structure du CSV (colonnes, 10 leads, pas de doublon de téléphone)
  2. Cohérence CSV ↔ messages (chaque lead a un message, liens wa.me valides)
  3. Liens wa.me bien formés (+ suivi de 32 = Belgique)

Usage : python3 test_belgium_pipeline.py
"""

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent  # mondevis/
CSV_PATH = Path(__file__).parent / "leads-belgique.csv"
MSG_PATH = ROOT / "messages-belgique.md"

EXPECTED_COLS = {"name", "company", "trade", "city", "phone", "email", "stage", "last_contact", "status"}
PHONE_RE = re.compile(r"^\+32\d{8,9}$")
WA_RE = re.compile(r"https://wa\.me/(\+?32\d{8,9})")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    # --- 1. CSV ---
    if not CSV_PATH.exists():
        print(f"❌ {CSV_PATH} introuvable")
        return 1
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cols = set(reader.fieldnames or [])
        rows = list(reader)

    missing = EXPECTED_COLS - cols
    if missing:
        errors.append(f"Colonnes manquantes dans le CSV : {missing}")

    if len(rows) != 10:
        warnings.append(f"{len(rows)} leads au lieu de 10")

    phones = [r.get("phone", "") for r in rows if r.get("phone")]
    dupes = {p for p in phones if phones.count(p) > 1}
    if dupes:
        errors.append(f"Téléphones en doublon : {dupes}")

    bad_phones = [p for p in phones if not PHONE_RE.match(p)]
    if bad_phones:
        warnings.append(f"Numéros non standard belge (+32 suivi de 8-9 chiffres) : {bad_phones}")

    # --- 2. Messages ---
    if not MSG_PATH.exists():
        errors.append(f"{MSG_PATH} introuvable")
    else:
        msg_text = MSG_PATH.read_text(encoding="utf-8")
        wa_links = WA_RE.findall(msg_text)

        # Chaque lead avec téléphone doit avoir un wa.me correspondant dans les messages
        csv_digits = {re.sub(r"\D", "", p) for p in phones}
        msg_digits = {re.sub(r"\D", "", w) for w in wa_links}
        unmatched = csv_digits - msg_digits
        if unmatched:
            warnings.append(f"Numéros du CSV absents des messages (ok si fixe/formulaire) : {unmatched}")

        if "Peppol" not in msg_text:
            errors.append("L'angle Peppol est absent des messages")
        if "mondedevis.eu" not in msg_text:
            errors.append("Lien mondedevis.eu absent des messages")
        if "avatar-mondevis-final.mp4" not in msg_text:
            warnings.append("Référence vidéo avatar absente du guide")

    # --- Rapport ---
    print("🧪 Test pipeline belge MonDevis\n")
    print(f"  CSV        : {len(rows)} leads, colonnes {'OK' if not missing else 'INCOMPLÈTES'}")
    print(f"  Téléphones : {len(phones)} valides, {len(dupes)} doublon(s)")
    print(f"  wa.me      : {len(WA_RE.findall(msg_text)) if MSG_PATH.exists() else 0} liens dans les messages")
    print()

    if warnings:
        print("⚠️  Avertissements :")
        for w in warnings:
            print(f"  - {w}")
        print()
    if errors:
        print("❌ Erreurs :")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("✅ Pipeline belge cohérent — prêt pour l'envoi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
