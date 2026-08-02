<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MonDevis — Conventions & Workflow

## Migrations Prisma (IMPORTANT)

- **Toute modification de `prisma/schema.prisma` doit générer une migration** :
  `npx prisma migrate dev --name <description>` (jamais de `db push`)
- Le build Vercel exécute `prisma migrate deploy` : seul le SQL commité est appliqué en prod
- Si le schéma et la base dérivent sans migration commitée, le prochain déploiement restera désynchronisé
- Prisma CLI lit `.env` (pas `.env.local`) : source les variables avant toute commande
  (`set -a && source .env.local && set +a && npx prisma migrate dev --name ...`)
- L'historique de migrations vit dans `prisma/migrations/` (dialecte PostgreSQL)

## Envoi par email

- L'envoi de devis/factures utilise `RESEND_API_KEY`, avec fallback sur `AUTH_RESEND_KEY`
- Les PDF sont générés via `src/lib/pdf/` (builders partagés client/serveur — ne pas dupliquer dans les composants)

## Tests

- `npm test` (Vitest) — exécuté avant chaque push
- Les tests unitaires vivent dans `src/lib/__tests__/`
