# SETUP STRIPE — MonDevis (abonnements Pro / Business)

> **Statut** : ✅✅ **TEST RÉUSSI** (carte 4242 → plan Pro actif en base, webhook reçu, bandeau vert dashboard).
> ✅ Code implémenté (checkout + webhook + portal + UI pricing/dashboard).
> ✅ Produits & prix **créés en mode TEST** + clés configurées dans `.env.local`.
> 🔜 Reste : gating Pro, passage LIVE avant la vente (§6), test Portal annulation.

---

## 1. 🎯 Ce qui est déjà en place (code)

| Fichier | Rôle |
|---|---|
| `src/lib/stripe.ts` | Singleton Stripe paresseux (instancié à la 1ère utilisation — ne casse pas le build sans clé) |
| `src/lib/stripe-customer.ts` | `getOrCreateCustomer` : crée/récupère le customer Stripe de l'utilisateur |
| `src/lib/plans.ts` | `PRICE_IDS` (pro / business) lus depuis les variables d'env |
| `src/lib/subscription.ts` + `format-subscription.ts` | Helpers statut + libellés FR (module pur testable) |
| `src/app/actions/checkout.ts` | Server actions : `createCheckoutSession(plan)` + `createPortalSession()` |
| `src/app/api/webhooks/stripe/route.ts` | Webhook : signature vérifiée, upsert idempotent, retry si userId introuvable |
| `src/app/pricing/` | `CheckoutButton` + `PricingCard` + page serveur (détecte le plan actuel) |
| `src/app/dashboard/` | Carte abonnement + message de confirmation + bouton Portal |
| `prisma/schema.prisma` | Modèle `Subscription` + `User.stripeCustomerId` (migration `20260803060849_add-stripe` appliquée) |

---

## 2. 🔑 Variables à renseigner dans `.env.local` (MANUEL — fichier jamais committé)

```env
# Stripe (abonnements Pro / Business)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_1U0DU6RvirNv9z5kOuiOjpWr
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS=price_1U0DU7RvirNv9z5ktUlUG9vS
```

**Où trouver les clés** : Dashboard Stripe → Developers → API keys (sk_test_ + pk_test_).
**Webhook secret** : §4 (stripe listen en local, ou Dashboard → Webhooks en prod).
**⚠️ Les 2 price IDs ci-dessus sont déjà créés en mode TEST (19€/mois et 49€/mois)** — pas besoin de les recréer, mais vous pouvez les remplacer par les vôtres si vous préférez.

---

## 3. ✅ Produits & prix TEST créés (via CLI Stripe, mode test)

| Plan | Produit | Prix | Montant |
|---|---|---|---|
| Pro | `prod_V0DvK6Lvy5ZEzy` | `price_1U0DU6RvirNv9z5kOuiOjpWr` | 19,00 €/mois |
| Business | `prod_V0DvvFOqNcuoOO` | `price_1U0DU7RvirNv9z5ktUlUG9vS` | 49,00 €/mois |

Commandes utilisées :
```bash
stripe products create --name "MonDevis Pro" --description "Abonnement Pro - devis illimités"
stripe products create --name "MonDevis Business" --description "Abonnement Business - PME et équipes"
stripe prices create --product prod_xxx --unit-amount 1900 --currency eur "--recurring.interval=month"
stripe prices create --product prod_xxx --unit-amount 4900 --currency eur "--recurring.interval=month"
```

---

## 4. 🕸 Webhook — configuration

### En local (test)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
→ La CLI affiche `whsec_...` : copier dans `STRIPE_WEBHOOK_SECRET` (.env.local).

### En production (dashboard Stripe)
1. Dashboard → Developers → **Webhooks** → **Add endpoint**
2. URL : `https://<votre-domaine>/api/webhooks/stripe`
3. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copier le **Signing secret** (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.

---

## 5. 🧪 Test du checkout (mode test)

1. Renvoyer le serveur : `npm run dev`
2. Lancer l'écoute webhook : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Ouvrir `http://localhost:3000/pricing` → cliquer sur **Pro** ou **Business**
4. Se connecter (ou créer un compte)
5. Sur Stripe Checkout, utiliser la carte test : **4242 4242 4242 4242** (n'importe quel CVV/date future)
6. Retour sur `/dashboard?checkout=success` → bandeau vert + carte « Abonnement : ✅ Actif »
7. Tester le Portal : « Gérer mon abonnement » → annuler → le webhook passe le statut à ⛔ Résilié

> ✅ Vérifié en local (sans clé) : `/pricing` répond 200, le webhook répond proprement (`Webhook non configuré` = 500 attendu sans secret), `/dashboard` redirige vers l'auth.

> ✅✅ **TEST RÉUSSI le 2026-08-03** : souscription Pro active en base (`price_1U0DU6RvirNv9z5kOuiOjpWr`, échéance 2026-09-03), événement `checkout.session.completed` reçu par le webhook, bandeau vert sur le dashboard.
> 
> ⚠️ **Leçon test** : si `/pricing` crashe avec `DATABASE_URL vide` en runtime, c'est que le shell de login exporte `DATABASE_URL=` (vide) — Next.js ne surcharge pas une variable déjà présente. Lancer le serveur avec `/tmp/run-mondevis-dev.sh` (fait `source .env.local` avant `npm run dev`).

---

## 6. 🚀 Passage en production (LIVE) — juste avant la vente

> **Statut au 07/08/2026** : préparation live en cours.
> - ✅ Script prêt : `scripts/setup-stripe-live.ts` (idempotent — crée produits/prix live sans doublon, vérifie `charges_enabled`)
> - ⏳ Produits/prix LIVE **pas encore créés** (clé CLI restreinte sans `product_write`/`feature_write` OU en attente d'une `sk_live_` dans `.env.local`)
> - ✅ CLI Stripe connecté au compte `acct_1Ths6ORvirNv9z5k` (mode live dispo)

### 6.1. Créer les produits/prix LIVE

**Option A — CLI (après déblocage de la clé restreinte) :**
1. Activer sur la clé CLI (`mk_1TjBuGRvirNv9z5k3pNSgRXp`) : **Products → Write** + **Features → Write**
   Lien : https://dashboard.stripe.com/b/acct_1Ths6ORvirNv9z5k?destination=%2Fapikeys%2Fmk_1TjBuGRvirNv9z5k3pNSgRXp%2Fedit
2. Créer :
   ```bash
   stripe products create --live --name "MonDevis Pro" --description "Abonnement Pro - devis illimités"
   stripe prices create --live --product prod_xxx --unit-amount 1900 --currency eur --recurring.interval=month
   stripe products create --live --name "MonDevis Business" --description "Abonnement Business - PME et équipes"
   stripe prices create --live --product prod_xxx --unit-amount 4900 --currency eur --recurring.interval=month
   ```

**Option B — script avec `sk_live_` (recommandé, fiable) :**
1. Dans `.env.local` : `STRIPE_SECRET_KEY=sk_live_...` (Dashboard → Developers → API keys → mode **LIVE**)
2. `npx tsx scripts/setup-stripe-live.ts`
   → crée les 2 produits + prix, vérifie `charges_enabled`, affiche les lignes `.env.local` exactes à coller

### 6.2. Mettre à jour `.env.local` / Vercel (manuel, jamais commité)

- `STRIPE_SECRET_KEY=sk_live_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` / `NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS` → price IDs **LIVE**
- ⚠️ Purger `.next` si le serveur tourne pendant la modif (memo 06/08)
- En Vercel : cocher Production + Preview

### 6.3. Webhook LIVE (dashboard Stripe → Developers → Webhooks → Add endpoint)

- URL : `https://<domaine-prod>/api/webhooks/stripe`
- Événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copier le **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` (.env.local + Vercel)
- ⚠️ Les webhooks test et live sont séparés : recréer l'endpoint en mode **Live**

### 6.4. Test final live

1. Vraie carte (petit montant, remboursement immédiat via dashboard Stripe → Payments → Refund)
2. Vérifier : webhook reçu (logs Vercel), abonnement `active` en base Neon/Prisma, email de confirmation reçu
3. Le gating des fonctionnalités Pro (devis illimités vs 3/mois) se branche déjà sur `isSubscribed()`

### 6.5. Checklist LIVE

- [ ] Onboarding Stripe complet (`charges_enabled = true`)
- [ ] Produit + prix **Pro** live (19€/mois)
- [ ] Produit + prix **Business** live (49€/mois)
- [ ] `.env.local` : `sk_live_` + `pk_live_` + price IDs live
- [ ] Webhook endpoint **live** configuré + `whsec_` live dans `.env.local`
- [ ] Test paiement live réussi (carte réelle, refund après)
- [ ] Vitest + TSC + build OK avant la campagne

---

## 7. 📌 Rappels

- ❌ **Jamais de clé Stripe committée** (`.env.local` est gitignoré)
- ✅ Le plan Débutant (0€) n'utilise pas Stripe — inscription classique
- ✅ Les serveurs actions vérifient l'auth (`session.user.id`) avant toute création
- ✅ Le webhook vérifie la signature (`stripe-signature`) avant tout traitement
- 🔜 Le gating des fonctionnalités Pro (devis illimités vs 3/mois) sera à brancher sur `isSubscribed()` quand la vente démarre
