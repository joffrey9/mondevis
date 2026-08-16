#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MonDevis — Synchronise les variables d'env vers Vercel (Production + Preview)
# -----------------------------------------------------------------------------
# - Lit .env.local (source de vérité locale) SANS jamais afficher les valeurs
# - Récupère via `vercel env pull` les vars existantes absentes de .env.local
#   (ex: MISTRAL_API_KEY) pour les reporter aussi en Preview
# - Force AUTH_URL sur https://mondedevis.eu (prod) et AUTH_TRUST_HOST=true
# - Affiche uniquement les NOMS + statut (✓/✗), aucune valeur
#
# Usage : bash scripts/sync-vercel-env.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

ENVFILE=".env.local"
PULLED="/tmp/mondevis-pulled.env"
PROD_URL="https://mondedevis.eu"

# 1. Récupérer les vars actuelles de Vercel (production) pour les vars absentes
#    de .env.local — ne jamais les afficher.
vercel env pull "$PULLED" --environment=production --yes >/dev/null 2>&1
if [ -f "$PULLED" ]; then
  echo "ℹ️  Base de récupération Vercel : OK (${PULLED})"
else
  echo "⚠️  vercel env pull a échoué — vars Vercel-only seront sautées."
fi

read_env() { # $1 = var name → echo la valeur (quotes retirées), vide si absente
  local name="$1" val=""
  val=$(grep -E "^${name}=" "$ENVFILE" 2>/dev/null | head -1 | cut -d= -f2-)
  if [ -z "$val" ] && [ -f "$PULLED" ]; then
    val=$(grep -E "^${name}=" "$PULLED" 2>/dev/null | head -1 | cut -d= -f2-)
  fi
  val=${val%$'\r'}
  val=${val#\"}; val=${val%\"}
  printf '%s' "$val"
}

set_var() { # $1 = name, $2 = value → rm + add sur Production + Preview
  local name="$1" val="$2"
  if [ -z "$val" ]; then
    echo "  ⚠️  $name : vide → ignoré"
    return
  fi
  # Suppression idempotente (les 2 envs), tolère l'absence
  vercel env rm "$name" production --yes >/dev/null 2>&1
  vercel env rm "$name" preview --yes >/dev/null 2>&1
  # Ajout Production puis Preview (valeur par stdin, --yes pour le git branch)
  local ok=1
  printf '%s' "$val" | vercel env add "$name" production >/dev/null 2>&1 || ok=0
  printf '%s' "$val" | vercel env add "$name" preview --yes >/dev/null 2>&1 || ok=0
  if [ "$ok" = 1 ]; then
    echo "  ✅ $name (production + preview)"
  else
    echo "  ❌ $name : échec vercel env add"
  fi
}

# 2. Liste des variables à synchroniser
VARS=(
  DATABASE_URL DIRECT_URL
  AUTH_SECRET AUTH_TRUST_HOST AUTH_URL
  AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET
  AUTH_RESEND_FROM AUTH_RESEND_KEY
  RESEND_API_KEY EMAIL_FROM EMAIL_CONTACT
  PEPPOL_API_KEY PEPPOL_API_URL PEPPOL_SENDER_ID
  STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS
  STRIPE_WEBHOOK_SECRET MISTRAL_API_KEY
)

for name in "${VARS[@]}"; do
  set_var "$name" "$(read_env "$name")"
done

# 3. AUTH_URL forcé sur l'URL de production (le .env.local contient localhost)
echo "→ AUTH_URL forcé sur $PROD_URL"
vercel env rm AUTH_URL production --yes >/dev/null 2>&1
vercel env rm AUTH_URL preview --yes >/dev/null 2>&1
if printf '%s' "$PROD_URL" | vercel env add AUTH_URL production >/dev/null 2>&1 && printf '%s' "$PROD_URL" | vercel env add AUTH_URL preview --yes >/dev/null 2>&1; then
  echo "  ✅ AUTH_URL = $PROD_URL (production + preview)"
else
  echo "  ❌ AUTH_URL : échec"
fi

# 4. Nettoyage du fichier temporaire (contient des secrets)
rm -f "$PULLED"
echo "✅ Fin de synchronisation — vérifier avec : vercel env ls"
