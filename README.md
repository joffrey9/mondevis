# MonDevis 🇫🇷🇧🇪

Application web de devis & factures pour artisans : création, PDF, envoi par email (Resend), WhatsApp, et facturation électronique B2B belge via Peppol.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript strict
- **Prisma 6** — base **PostgreSQL (Neon)** en production
- **NextAuth v5** (Google OAuth + Magic Link Resend + Credentials)
- **Resend** — emails transactionnels
- **jsPDF** — génération des PDF (devis & factures), partagée client/serveur
- **Vitest** — tests unitaires

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

Ouvrir http://localhost:3000

## Variables d'environnement

| Variable | Usage |
|---|---|
| `DATABASE_URL` | URL de connexion (pooler Neon en prod) |
| `DIRECT_URL` | URL directe (requise par Prisma CLI / migrations) |
| `AUTH_SECRET` | Secret NextAuth |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google |
| `AUTH_RESEND_KEY` | Clé Resend pour le Magic Link (NextAuth) |
| `RESEND_API_KEY` | Clé Resend pour l'envoi de devis/factures (fallback sur `AUTH_RESEND_KEY`) |
| `EMAIL_FROM` / `AUTH_RESEND_FROM` | Expéditeur des emails |
| `PEPPOL_API_KEY` | Clé API e-invoice.be (envoi B2B belge) |

## Migrations de base de données 🗄️

Le schéma est géré par **Prisma Migrate** (plus de `db push`).

### Workflow pour toute modification du schéma

1. **Modifier** `prisma/schema.prisma`
2. **Générer une migration** :
   ```bash
   npx prisma migrate dev --name nom_de_la_modification
   ```
   (crée un dossier `prisma/migrations/<timestamp>_<nom>/` avec le SQL)
3. **Committer** le dossier de migration généré
4. **Déployer** : le build Vercel exécute `prisma migrate deploy`, qui applique
   automatiquement les migrations en attente sur la base de production

### Commandes utiles

| Commande | Rôle |
|---|---|
| `npx prisma migrate dev` | Génère + applique une migration (dev) |
| `npx prisma migrate deploy` | Applique les migrations commitées (prod) — exécuté au build |
| `npx prisma migrate status` | Vérifie la synchronisation base/migrations |
| `npx prisma migrate resolve --applied <nom>` | Marque une migration comme appliquée (baseline) |
| `npx prisma studio` | UI d'inspection des données |

### Historique actuel

- `20260801000000_init` — baseline complète du schéma (PostgreSQL)

> ⚠️ Prisma CLI lit `.env`, pas `.env.local`. Pour les commandes migrations en local :
> `set -a && source .env.local && set +a && npx prisma migrate status`

## Envoi par email

- **Devis** : bouton « ✉️ Envoyer par email » sur la page devis → email HTML + **PDF joint**
- **Factures privées** : bouton « ✉️ Envoyer par email » → email HTML + **PDF joint**
- **Factures B2B belges** : bouton « 🇪🇺 Envoyer via Peppol » → XML UBL 2.1 envoyé sur le réseau Peppol (e-invoice.be)

Les PDF sont générés côté serveur via `src/lib/pdf/` (partagé avec le téléchargement client).

## Tests

```bash
npm test
```

## Déploiement

Vercel : `npm run build` (exécute `prisma migrate deploy && prisma generate && next build`).
