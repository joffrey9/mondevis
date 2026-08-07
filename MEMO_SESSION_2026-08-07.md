# MEMO SESSION — 2026-08-07 (handoff : reprise prochaine session)

> **SCOPE** : `~/Desktop/MonDevis` uniquement (MonDevis = le produit qu'on vend).

## ✅ Fait aujourd'hui (tout commité sauf mémo + .env.local)

### 1. 🔐 Magic Link — TESTÉ ET VALIDÉ
- Serveur dev relancé : tmux **`mondevis-server`** → http://localhost:3000 (Next.js 16.2.12, Turbopack)
- Envoi déclenché via l'API NextAuth Resend : `POST /api/auth/signin/resend` → **302 verify-request** (succès)
- 2 emails « Sign in to localhost:3000 » émis depuis `noreply@mondedevis.eu` (vérifiés dans le log Resend `emails.list`)
- **Validation finale par Joffrey** : magic link cliqué dans la boîte hotmail → connexion complète OK

### 2. 📬 Délivrabilité Gmail/Outlook — CONFIRMÉE
- Domaine Resend `mondedevis.eu` : **verified** (DKIM TXT, SPF `amazonses`, MX `feedback-smtp.eu-west-1`, DMARC `p=quarantine`)
- Emails de test reçus **en Inbox** (pas en spam) sur `joffrey-menuiserie@hotmail.com`
- ⚠️ **Note** : l'adresse de contact de Joffrey = **hotmail.com** (les tests envoyés sur @gmail.com sont hors-sujet, l'utiliser pour les tests futurs)

### 3. 💳 Stripe LIVE — PRÊT (produits/prix créés)
- **Compte** : `acct_1Ths6ORvirNv9z5k` (joffreyfortemps@gmail.com) → **`charges_enabled = OUI`** (prêt à encaisser)
- **Produits/prix LIVE créés** via `npx tsx scripts/setup-stripe-live.ts` :

| Plan | Produit | Prix live |
|---|---|---|
| MonDevis Pro | `prod_V1iuu8wPSxtmQZ` | 19€/mois → `price_1U1fSGRvirNv9z5kcxZyPNK7` |
| MonDevis Business | `prod_V1iuAesxVlMcmJ` | 49€/mois → `price_1U1fSHRvirNv9z5kG7HMn7ZU` |

- **`.env.local` (à jour, jamais commité)** :
  - `STRIPE_SECRET_KEY=sk_live_…` (clé créée via « Alimenter une intégration », nom *MonDevis prod*)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`
  - `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO/BUSINESS` → price IDs live
  - `STRIPE_WEBHOOK_SECRET` → **vide** (en attente du webhook live, cf. À faire)
- **Scripts ajoutés** :
  - `scripts/setup-stripe-live.ts` : idempotent (retrouve les produits, zéro doublon), vérifie `charges_enabled`, affiche les lignes .env.local + instructions webhook
  - `scripts/set-secret.mjs` : helper d'injection de secret depuis presse-papiers **sans jamais loguer** (`pbpaste | node scripts/set-secret.mjs KEY_NAME`, valide le format, affiche une empreinte masquée)
- **Doc** : `SETUP-STRIPE.md` §6 réécrit (options CLI/script, webhook live, checklist) + statut mis à jour avec les IDs réels

### 4. Vérifications
- Vitest **21/21** ✅ · TSC **0 erreur** ✅ · Idempotence du script live vérifiée ✅
- Git propre : 3 commits
  - `7ccf087` feat(stripe-live): script idempotent setup produits/prix live + doc section 6 LIVE
  - `ac4ce4d` docs(stripe-live): produits/prix live crees (Pro 19e, Business 49e) + statut a jour
  - `0d2e4d6` chore(scripts): helper securise d injection de secret dans .env.local

## 📋 À faire à la reprise (dans l'ordre)

1. **Déployer MonDevis en prod** (Vercel) avec les env vars (Production + Preview) :
   - `STRIPE_SECRET_KEY=sk_live_…` · `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO/BUSINESS` (IDs live) · `STRIPE_WEBHOOK_SECRET` (après §2)
   - Les autres vars (AUTH, RESEND, DATABASE_URL, PEPPOL…) à reporter aussi
2. **Webhook endpoint LIVE** : dashboard Stripe → Webhooks → Add endpoint
   - URL : `https://<domaine-prod>/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copier le **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET` (.env.local + Vercel)
   - Injection locale : `pbpaste | node scripts/set-secret.mjs STRIPE_WEBHOOK_SECRET`
3. **Test paiement LIVE** (juste avant la vente) : vraie carte → refund immédiat via dashboard
   - Vérifier : webhook reçu, abonnement `active` en DB, magic link toujours OK en prod
4. **AUTH_URL en prod** : penser à `https://<domaine-prod>` (en dev c'est `http://localhost:3000` — le sujet des emails dit « Sign in to localhost:3000 » en dev)

## ⚠️ Pièges / rappels
- **`.env.local` = secrets** → jamais committé (modifs manuelles ou via `scripts/set-secret.mjs`)
- Purger `.next` si le serveur tourne après modif de `.env.local`
- La **clé CLI restreinte** (`rk_live_…`, id `mk_1TjBuGRvirNv9z5k3pNSgRXp`) n'a **pas** les droits `product_write`/`feature_write` → ne peut pas créer de produits → utiliser le script avec `sk_live_` (clé complète)
- Adresse email de Joffrey pour les tests : **joffrey-menuiserie@hotmail.com**
- Resend plan Free = **1 domaine** (mondedevis.eu occupé — ne pas supprimer)
- Sessions tmux : `mondevis-server` actif · `mondevis-stripe` (stripe listen) à relancer si besoin

## 🧪 Commandes utiles
```bash
cd ~/Desktop/MonDevis
npm test                          # vitest 21/21
npx tsc --noEmit                  # 0 erreur
npm run dev:run                   # serveur dev (contourne DATABASE_URL vide)
npx tsx scripts/setup-stripe-live.ts                     # setup live (idempotent)
pbpaste | node scripts/set-secret.mjs STRIPE_WEBHOOK_SECRET  # injecter un secret
npx tsx scripts/test-checkout-flow.ts --url              # générer un lien checkout (test)
tmux attach -t mondevis-server    # logs serveur
tmux attach -t mondevis-stripe    # logs webhooks Stripe
```
