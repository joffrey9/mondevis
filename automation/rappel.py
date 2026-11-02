#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rappel de publication MonDevis — affiche quoi faire selon le jour.
Envoie aussi une notification macOS (Notification Center) si osascript dispo.

Usage :
    python3 rappel.py            # rappel du jour (+ notification macOS)
    python3 rappel.py --semaine  # vue des 7 prochains jours
    python3 rappel.py --quiet    # pas de notification, juste le texte
"""

import subprocess
import sys
from datetime import date, timedelta

# Posts programmés dans Publer : (date ISO, heure, description)
POSTS = [
    ("2026-09-07", "09:00", "Post 1 — Appel aux testeurs"),
    ("2026-09-09", "17:30", "Post 2 — Présentation produit"),
    ("2026-09-11", "11:00", "Post 3 — Mobile sur le chantier"),
    ("2026-09-14", "09:00", "Post 4 — Relances automatiques"),
    ("2026-09-16", "17:30", "Post 5 — Fierté artisanale"),
    ("2026-09-18", "11:00", "Post 6 — Bénéfices concrets"),
    ("2026-09-21", "09:00", "Post 7 — Devis depuis le modèle"),
    ("2026-09-23", "17:30", "Post 8 — Problème du devis manuel"),
    ("2026-09-25", "11:00", "Post 9 — Peppol Belgique"),
    ("2026-09-28", "09:00", "Post 10 — Soirée administrative"),
    ("2026-09-30", "17:30", "Post 11 — Gain de temps chiffré"),
    ("2026-10-02", "11:00", "Post 12 — Signature électronique"),
]


def notifier(titre: str, texte: str) -> None:
    """Notification macOS via osascript (silencieux si indisponible)."""
    try:
        texte = texte.replace('"', '\\"')
        titre = titre.replace('"', '\\"')
        script = f'display notification "{texte}" with title "{titre}" sound name "Glass"'
        subprocess.run(["osascript", "-e", script], timeout=5, capture_output=True)
    except Exception:
        pass  # pas bloquant si osascript échoue


def message_du_jour(today: date) -> tuple[str, str]:
    """Retourne (texte complet, résumé court pour notification)."""
    post_du_jour = None
    prochains = []

    for iso, heure, desc in POSTS:
        d = date.fromisoformat(iso)
        if d == today:
            post_du_jour = (heure, desc)
        elif d > today and len(prochains) < 2:
            jours = (d - today).days
            prochains.append(f"  · {d.strftime('%a %d/%m')} {heure} — {desc} (dans {jours} j)")

    out = [f"📅 Rappel MonDevis — {today.strftime('%A %d %B %Y').capitalize()}", ""]

    if post_du_jour:
        heure, desc = post_du_jour
        out.append(f"🎯 AUJOURD'HUI : {desc}")
        out.append(f"   → Programmer/publier à {heure} (Facebook + Instagram)")
        out.append("   → Texte : mondevis/POSTS-A-COPIER.txt")
        out.append("   → Image : mondevis/post-annonce-1080x1350.png")
        out.append("")
    else:
        out.append("Pas de post programmé aujourd'hui.")
        out.append("")

    out.append("Quotidien (5 min) :")
    out.append("  · Répondre aux messages IG/FB/WhatsApp dans l'heure")
    out.append("    → python3 triage.py add   (journalise + affiche la réponse)")
    out.append("  · Relances du jour : python3 generate_relances.py --due")
    if prochains:
        out.append("")
        out.append("Prochains posts :")
        out.extend(prochains)

    if post_du_jour:
        notif = f"🎯 {post_du_jour[1]} à {post_du_jour[0]}"
    else:
        notif = "Pas de post aujourd'hui — pense aux relances/messages"
    return "\n".join(out), notif


def vue_semaine(today: date) -> str:
    out = [f"📅 7 prochains jours à partir du {today.strftime('%d/%m')}", ""]
    for i in range(7):
        d = today + timedelta(days=i)
        marqueur = "👉" if i == 0 else "  "
        posts = [f"{h} {desc.split(' — ')[0]}" for iso, h, desc in POSTS if date.fromisoformat(iso) == d]
        contenu = " ; ".join(posts) if posts else "—"
        out.append(f"{marqueur} {d.strftime('%a %d/%m')} : {contenu}")
    return "\n".join(out)


def main() -> None:
    quiet = "--quiet" in sys.argv or "-q" in sys.argv
    if "--semaine" in sys.argv:
        print(vue_semaine(date.today()))
        return
    texte, notif = message_du_jour(date.today())
    print(texte)
    if not quiet:
        notifier("MonDevis — Rappel", notif)


if __name__ == "__main__":
    main()
