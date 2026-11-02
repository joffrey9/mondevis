#!/usr/bin/env python3
"""
Mondevis — générateur de posts hebdomadaires au format CSV bulk Publer.

Génère N semaines de posts prêts à importer dans Publer (bulk import),
en réutilisant exactement le format de publer_bulk_mondevis.csv.

Usage :
    python3 generate_weekly_posts.py                          # 4 semaines, 3 posts/semaine
    python3 generate_weekly_posts.py --weeks 8                # 8 semaines
    python3 generate_weekly_posts.py --per-week 5             # 5 posts/semaine
    python3 generate_weekly_posts.py --start 2026-09-07       # commencer cette date (un lundi)
    python3 generate_weekly_posts.py --dry-run                # aperçu sans écrire de fichier
    python3 generate_weekly_posts.py --out publer_bulk_septembre.csv

Le CSV de sortie utilise exactement les colonnes de publer_bulk_mondevis.csv
et peut être importé directement dans Publer (Bulk import).
"""

import argparse
import csv
import random
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # mondevis/
DEFAULT_OUT_DIR = ROOT  # même dossier que publer_bulk_mondevis.csv (chemins médias relatifs)

CSV_HEADER = [
    "Date", "Text", "Link", "Media URL", "Title", "Label",
    "Alt text(s)", "Comment(s)", "Pin/Album/Cat", "Post Subtype", "CTA", "Reminder",
]

LINK = "https://mondedevis.eu"
DEFAULT_MEDIA = "post-annonce-1080x1350.png"  # média existant dans mondevis/
ALBUM = "@mondedevis (IG)"

# Créneaux de publication (jour de la semaine 0=lundi, heure)
SLOTS = [
    (0, "09:00"),  # lundi matin
    (2, "17:30"),  # mercredi soir
    (4, "11:00"),  # vendredi midi
    (5, "10:00"),  # samedi matin
    (1, "12:30"),  # mardi midi
    (3, "18:00"),  # jeudi soir
    (6, "18:00"),  # dimanche soir
]

HASHTAG_SETS = [
    "#artisan #devis #btp #menuiserie #plomberie #entrepreneur",
    "#artisan #devis #electricite #plomberie #chantier",
    "#artisanat #devis #renovation #btp #entrepreneur",
    "#artisan #facturation #devis #btp #autoentrepreneur",
    "#artisan #devis #peinture #menuiserie #couverture",
]

# Banque de thèmes : chaque thème = (titre, texte). Rotation sans répétition
# tant que la banque n'est pas épuisée.
THEMES = [
    ("Annonce de lancement",
     "📐 Voilà MonDevis.\n\nL'outil qui crée, envoie et fait signer tes devis en 2 minutes,\ndepuis ton téléphone, sur le chantier.\n\n3 devis/mois gratuits. 14 jours d'essai sans carte bancaire.\n\n→ mondedevis.eu"),
    ("Le problème du devis manuel",
     "Combien de temps tu passes sur un devis ? 1h ? 1h30 ?\n\nLe soir, après le chantier, sur Word ou Excel…\npendant que le client attend sa réponse.\n\nAvec MonDevis : 2 minutes, TVA auto, prêt à envoyer.\n→ mondedevis.eu"),
    ("Les bénéfices concrets",
     "Un devis envoyé dans la journée = un client qui te répond plus vite.\n\n· Devis en 2 minutes (mobile)\n· Signature électronique\n· Envoi email + WhatsApp\n· Relances automatiques\n\nEssaie gratuitement → mondedevis.eu"),
    ("Appel aux testeurs",
     "🧪 On cherche les 10 premiers artisans pour tester MonDevis en réel.\n\nEn échange d'un retour honnête : 14 jours complets offerts,\nsans carte bancaire, et un accompagnement perso.\n\n👉 Envoie-moi « DEVIS » en message privé (ou sur WhatsApp)."),
    ("FAQ simplicité",
     "« Et si je ne sais pas utiliser ce genre d'outil ? »\n\nPas de panique : si tu sais envoyer un WhatsApp, tu sais utiliser MonDevis.\n2 minutes, depuis ton téléphone, sans rien installer.\n\n3 devis/mois gratuits → mondedevis.eu"),
    ("TVA automatique",
     "TVA 20 % ? 10 % ? 5,5 % ?\n\nEn rénovation énergétique, le taux réduit s'applique —\nmais qui y pense le soir, fatigué, sur un devis ?\n\nMonDevis applique le bon taux automatiquement.\n→ mondedevis.eu"),
    ("Signature électronique",
     "Fini les devis imprimés, signés, scannés, renvoyés…\n\nTon client signe sur son téléphone, tu reçois le devis\nsigné directement. Zéro papier, zéro aller-retour.\n\nEssaie → mondedevis.eu"),
    ("Relances automatiques",
     "Un devis sans réponse, ce n'est pas un client perdu.\nC'est juste un devis sans relance.\n\nMonDevis relance automatiquement tes clients\nà J+3 et J+7. Toi, tu restes sur le chantier.\n→ mondedevis.eu"),
    ("Mobile sur le chantier",
     "Le client te demande un chiffrage « pour demain » ?\n\nSorte ton téléphone, décris les travaux, envoi.\nLe devis est prêt avant de quitter le chantier.\n\nmondedevis.eu"),
    ("Question engagement",
     "Question du jour : combien de temps tu passes\nsur un devis, toi ? 👇\n\n(Moi je dis 2 minutes, mais je suis partial :\nje travaille sur MonDevis 😄)\n→ mondedevis.eu"),
    ("Factures Peppol Belgique",
     "🇧🇪 Tu factures des entreprises en Belgique ?\n\nLa facturation électronique Peppol devient la norme B2B.\nMonDevis l'intègre : ta facture part directement\nsur le réseau, conforme UBL.\n\n→ mondedevis.eu"),
    ("Devis depuis le modèle",
     "Tu refais le même devis 10 fois par mois ?\n\nCrée ton modèle une fois (tes lignes, tes prix,\ntes conditions) — ensuite, chaque devis part\ndu bon modèle en 2 minutes.\n→ mondedevis.eu"),
    ("Gain de temps chiffré",
     "Le calcul est simple :\n\n1h30 de administratif × 5 devis/mois\n= 7h30 par mois derrière l'écran.\n\n7h30, c'est une journée de chantier.\nRécupère-la → mondedevis.eu"),
    ("Astuce TVA rénovation",
     "💡 Astuce artisan : en rénovation énergétique\n(isolation, pompe à chaleur…), le taux de TVA réduit\ns'applique — à condition de le mentionner correctement.\n\nMonDevis gère les taux pour toi. → mondedevis.eu"),
    ("Envoi WhatsApp du devis",
     "Ton client préfère WhatsApp ? Parfait.\n\nEnvoie le devis en PDF directement dans la conversation.\nIl le lit, il le signe, c'est réglé.\n\nmondedevis.eu"),
    ("Rappel essai 14 jours",
     "Rappel : l'essai MonDevis dure 14 jours complets,\nsans carte bancaire, sans engagement.\n\nLe seul risque, c'est de continuer à faire tes devis\nsur Word. 😉 → mondedevis.eu"),
    ("Fierté artisanale",
     "Derrière chaque devis, il y a un chantier.\nDerrière chaque chantier, ton savoir-faire.\n\nMonDevis s'occupe du papier, toi du bois (ou du carrelage,\ndes fils, de la peinture 😄).\n→ mondedevis.eu"),
    ("Soirée administrative",
     "Il est 21h. Le chantier est fini.\nEt il reste… les devis de la semaine. 😮‍💨\n\nOu pas : fais-les en 2 minutes chacun,\net garde ta soirée. → mondedevis.eu"),
    ("Signature = accord plus rapide",
     "Un devis signé le jour même, ça change tout :\nle client est chaud, le planning se remplit,\ntu commandes ton matériel plus tôt.\n\nSignature électronique intégrée → mondedevis.eu"),
    ("Témoignage recherché",
     "Artisans : qu'est-ce qui vous ferait adopter\nun outil de devis sur mobile ?\n\nDites-le nous en commentaire ou en message privé —\non construit MonDevis pour vous. 🙏\n→ mondedevis.eu"),
]


def next_monday(today):
    days_ahead = 7 - today.weekday()  # 0 = lundi
    if days_ahead == 7:
        days_ahead = 0
    return today + timedelta(days=days_ahead)


def build_schedule(start, weeks, per_week):
    """Liste de (datetime_string, slot_index) pour toutes les publications."""
    slots = SLOTS[:per_week]
    schedule = []
    for w in range(weeks):
        monday = start + timedelta(weeks=w)
        for weekday, hour in slots:
            day = monday + timedelta(days=(weekday - monday.weekday()) % 7)
            schedule.append((day, hour))
    return schedule


def build_posts(schedule, seed, link, media):
    rng = random.Random(seed)
    bank = list(THEMES)
    rng.shuffle(bank)
    hashtags = HASHTAG_SETS.copy()
    rng.shuffle(hashtags)

    posts = []
    for i, (day, hour) in enumerate(schedule):
        if not bank:  # on re-mélange une nouvelle passe
            bank = list(THEMES)
            rng.shuffle(bank)
        title, text = bank.pop()
        tags = hashtags[i % len(hashtags)]
        date_str = f"{day.strftime('%Y/%m/%d')} {hour}"
        label = f"mondevis-post{len(posts) + 1}"
        alt = f"Visuel MonDevis — {title.lower()}"
        posts.append({
            "Date": date_str,
            "Text": f"{text}\n{tags}",
            "Link": link,
            "Media URL": media,
            "Title": f"MonDevis — {title}",
            "Label": label,
            "Alt text(s)": alt,
            "Comment(s)": "",
            "Pin/Album/Cat": "@mondedevis (IG)",
            "Post Subtype": "Photo",
            "CTA": "",
            "Reminder": "TRUE",
        })
    return posts


def write_csv(posts, out_path):
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADER, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(posts)


def main():
    parser = argparse.ArgumentParser(description="Générateur de posts hebdomadaires Mondevis (CSV Publer)")
    parser.add_argument("--weeks", type=int, default=4, help="nombre de semaines (défaut 4)")
    parser.add_argument("--per-week", type=int, default=3, choices=range(1, 8), help="posts par semaine (défaut 3)")
    parser.add_argument("--start", help="date de début YYYY-MM-DD (défaut : prochain lundi)")
    parser.add_argument("--out", help="fichier CSV de sortie (défaut : publer_bulk_<start>_<N>sem.csv dans mondevis/)")
    parser.add_argument("--media", default=DEFAULT_MEDIA, help=f"média par défaut (défaut {DEFAULT_MEDIA})")
    parser.add_argument("--link", default=LINK, help=f"lien dans les posts (défaut {LINK})")
    parser.add_argument("--seed", type=int, default=42, help="graine aléatoire (reproductible)")
    parser.add_argument("--dry-run", action="store_true", help="aperçu sans écrire de fichier")
    args = parser.parse_args()

    today = date.today()
    start = date.fromisoformat(args.start) if args.start else next_monday(today)
    if start.weekday() != 0:
        print("⚠️  La date de début n'est pas un lundi — les créneaux suivent les jours de la semaine quand même.")

    schedule = build_schedule(start, args.weeks, args.per_week)
    posts = build_posts(schedule, args.seed, args.link, args.media)

    if args.dry_run:
        print(f"🔍 Aperçu — {len(posts)} posts sur {args.weeks} semaine(s), {args.per_week}/semaine\n")
        for p in posts:
            print(f"📅 {p['Date']}  ·  {p['Title']}")
        print("\n(dry-run — aucun fichier écrit)")
        return

    out_path = Path(args.out) if args.out else DEFAULT_OUT_DIR / f"publer_bulk_{start.isoformat()}_{args.weeks}sem.csv"
    write_csv(posts, out_path)
    print(f"✅ {len(posts)} posts écrits dans {out_path}")
    print(f"   Période : {start.isoformat()} → {(start + timedelta(weeks=args.weeks - 1)).isoformat()}")
    print(f"   Import : Publer → Bulk Import → {out_path.name}")
    print(f"   ⚠️  Le média « {args.media} » doit être présent dans le même dossier que le CSV ({DEFAULT_OUT_DIR}).")


if __name__ == "__main__":
    main()
