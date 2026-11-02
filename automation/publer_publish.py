#!/usr/bin/env python3
"""
Mondevis — publieur automatique sur Publer via l'API.

Prend le CSV généré par generate_weekly_posts.py et programme les posts
directement dans Publer (sans import manuel), via l'API officielle
(POST /api/v1/posts/schedule, bulk jusqu'à 500 posts).

Prérequis :
  - Plan Publer **Business** (l'API n'existe pas sur Free/Professional).
  - Clé API avec scopes `posts`, `media`, `accounts` (Settings → Access & Login → API Keys).
  - Variables d'environnement :
      PUBLER_API_KEY        clé Bearer-API
      PUBLER_WORKSPACE_ID   id du workspace

Usage :
    python3 publer_publish.py ../publer_bulk_2026-09-07_4sem.csv            # programmer
    python3 publer_publish.py --list-accounts                               # voir les comptes
    python3 publer_publish.py --dry-run ../publer_bulk_2026-09-07_4sem.csv  # voir le payload
    python3 publer_publish.py --publish-now fichier.csv                     # publier tout de suite
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

API_BASE = "https://app.publer.com/api/v1"

# Réseaux cibles : le texte et le média partent sur les deux.
NETWORKS = ["facebook", "instagram"]


def api_request(method, path, api_key, workspace, body=None):
    url = f"{API_BASE}{path}"
    headers = {
        "Authorization": f"Bearer-API {api_key}",
        "Publer-Workspace-Id": workspace,
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8") or "{}")


def list_accounts(api_key, workspace):
    status, data = api_request("GET", "/accounts", api_key, workspace)
    if status != 200:
        print(f"❌ Erreur {status} en listant les comptes : {data}")
        sys.exit(1)
    return data if isinstance(data, list) else data.get("data", data.get("accounts", []))


def iso_at(date_str, tz="+02:00"):
    """'2026/09/07 09:00' → '2026-09-07T09:00:00+02:00' (Europe/Brussels en été)."""
    dt = datetime.strptime(date_str, "%Y/%m/%d %H:%M")
    return dt.isoformat() + tz


def build_payload(rows, account_ids, state):
    """Construit le payload bulk de /posts/schedule à partir des lignes du CSV."""
    posts = []
    for row in rows:
        scheduled_at = iso_at(row["Date"]) if state == "scheduled" else None
        networks = {}
        for net in NETWORKS:
            networks[net] = {
                "type": "status",
                "text": row["Text"],
            }
        accounts = []
        for acc_id in account_ids:
            acc = {"id": acc_id}
            if scheduled_at:
                acc["scheduled_at"] = scheduled_at
            accounts.append(acc)
        posts.append({"networks": networks, "accounts": accounts})
    return {"bulk": {"state": state, "posts": posts}}


def poll_job(api_key, workspace, job_id, max_wait=120):
    print(f"⏳ Job {job_id} en cours…")
    deadline = time.time() + max_wait
    while time.time() < deadline:
        status, data = api_request("GET", f"/job_status/{job_id}", api_key, workspace)
        job = data if isinstance(data, dict) else {}
        state = job.get("status") or job.get("state")
        print(f"   état : {state}")
        if state in ("completed", "success", "failed", "error"):
            return job
        time.sleep(3)
    print("⏰ Timeout en attendant le job")
    return None


def load_rows(csv_path):
    with open(csv_path, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        print("❌ Le CSV est vide")
        sys.exit(1)
    return rows


def main():
    parser = argparse.ArgumentParser(description="Publie le CSV hebdomadaire Mondevis sur Publer via l'API")
    parser.add_argument("csv", nargs="?", help="CSV généré par generate_weekly_posts.py")
    parser.add_argument("--list-accounts", action="store_true", help="lister les comptes du workspace")
    parser.add_argument("--publish-now", action="store_true", help="publier immédiatement au lieu de programmer")
    parser.add_argument("--dry-run", action="store_true", help="afficher le payload sans l'envoyer")
    args = parser.parse_args()

    api_key = os.environ.get("PUBLER_API_KEY")
    workspace = os.environ.get("PUBLER_WORKSPACE_ID")
    if not api_key or not workspace:
        print("❌ PUBLER_API_KEY / PUBLER_WORKSPACE_ID manquants dans l'environnement")
        print("   (Plan Business requis : Settings → Access & Login → API Keys, scopes posts/media/accounts)")
        sys.exit(1)

    if args.list_accounts:
        for acc in list_accounts(api_key, workspace):
            print(f"{acc.get('id')}  {acc.get('provider'):<12} {acc.get('name')}")
        return

    if not args.csv:
        parser.print_help()
        sys.exit(1)

    rows = load_rows(args.csv)
    print(f"📄 {len(rows)} posts lus depuis {args.csv}")

    accounts = list_accounts(api_key, workspace)
    if not accounts:
        print("❌ Aucun compte social connecté dans le workspace")
        sys.exit(1)
    account_ids = [a["id"] for a in accounts]
    print(f"👥 Comptes cibles : {', '.join(a.get('name') or a.get('provider') for a in accounts)}")

    state = "publish" if args.publish_now else "scheduled"
    payload = build_payload(rows, account_ids, state)

    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2)[:3000])
        print(f"\n🔍 Dry-run : {len(payload['bulk']['posts'])} posts, état={state}")
        return

    path = "/posts/schedule/publish" if args.publish_now else "/posts/schedule"
    status, data = api_request("POST", path, api_key, workspace, body=payload)
    if status != 200:
        print(f"❌ Erreur {status} : {json.dumps(data, ensure_ascii=False)[:500]}")
        sys.exit(1)

    job_id = (data.get("data") or {}).get("job_id") or data.get("job_id")
    print(f"✅ Accepté (HTTP {status}) · job_id={job_id}")
    if job_id:
        result = poll_job(api_key, workspace, job_id)
        if result and result.get("status") in ("completed", "success"):
            print(f"🎉 {len(rows)} posts {'publiés' if args.publish_now else 'programmés'} sur Publer")
        else:
            print("⚠️  Vérifie l'état du job dans le tableau de bord Publer")


if __name__ == "__main__":
    main()
