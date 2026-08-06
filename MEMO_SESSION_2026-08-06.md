# MEMO SESSION — 2026-08-06 (handoff : reprise demain matin)

> **SCOPE** : `~/Desktop/MonDevis` uniquement (MonDevis = le produit qu'on vend).

## ✅ Fait aujourd'hui (tout commité sauf mémo + .env.local)

### 1. Serveur + Stripe Listen relancés
- Serveur dev : `http://localhost:3000` — tmux **`mondevis-server`** (Next.js 16.2.12, Turbopack)
- Webhooks Stripe : tmux **`mondevis-stripe`** → `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Wrapper de démarrage recréé : `/tmp/run-mondevis-dev.sh` (contourne `DATABASE_URL=` vide)
- `npm run dev:run` ajouté dans package.json (fait `unset DATABASE_URL` avant `next dev`)

### 2. Gating Pro — ✅ commité (`89f505c`)
- Plan Débutant : **3 devis / mois civil** — Pro/Business : illimité
- `src/lib/devis-quota.ts` (module pur + 4 tests) · `getDevisQuota()` dans `subscription.ts`
- Garde serveur dans `createDevis` (non contournable) + bandeau quota sur `/dashboard/devis`
- Vitest 21/21 · TSC 0 · ESLint 0 · Build OK

### 3. Fix shell `DATABASE_URL` vide — ✅ commité (`89f505c`)
- `~/.zshrc` + `~/.bash_profile` : `unset DATABASE_URL` si vide (backups `.bak-20260806-060457/8`)

### 4. Test checkout Stripe — ✅ validé + base nettoyée
- `scripts/test-checkout-flow.ts` : E2E signé (carte 4242 → webhook → DB actif) + mode `--url`
- **Test manuel réussi** : paiement 4242 sur la session test → `checkout.session.completed` reçu → abonnement `active` en base
- User test nettoyé (subscription + customer Stripe + user DB supprimés)

### 5. Bascule email `mondedevis.eu` — ✅ domain verified + envoi OK
- Resend : `devisflash.net` **supprimé** (slot Free) → `mondedevis.eu` **ajouté + VERIFIED** (endpoint `POST /domains/{id}/verify` utilisé)
- OVH : records ajoutés par Joffrey — DKIM `resend._domainkey`, MX `send` (prio 10), TXT `send` SPF, DMARC durci `p=quarantine`
- `.env.local` : `EMAIL_FROM` / `AUTH_RESEND_FROM` → `noreply@mondedevis.eu` (backup `.env.local.bak-email-20260806-063510`)
- **Test d'envoi réussi** vers joffrey-menuiserie@gmail.com (devis + facture PDF joints)
- ⏳ À confirmer demain : `dkim=pass spf=pass dmarc=pass` dans Gmail → « Afficher l'original »

## 📋 À faire demain matin (dans l'ordre)

1. **Confirmer la délivrabilité Gmail** : `dkim/spf/dmarc = pass` sur l'email de test → si OK, tâche 3 terminée
2. **Tester le magic link** : `/auth/signin` → email reçu depuis `noreply@mondedevis.eu` (NextAuth Resend)
3. **Committer ce mémo** (`git add MEMO_SESSION_2026-08-06.md && git commit`)
4. **Stripe LIVE** (tâche 4 du mémo 05/08, juste avant la vente) :
   - Créer produits/prix LIVE (Pro 19€ / Business 49€)
   - `.env.local` : clés `sk_live_` / `pk_live_` + price IDs live (manuel)
   - Webhook endpoint live dans le dashboard Stripe
5. **Vérifs avant vente** : tests vitest, TSC, build, test checkout en live

## ⚠️ Pièges / rappels
- **`.env.local` = secrets** → jamais committé (backups conservés)
- Stripe SDK v22 : `default_payment_method` à la racine de `subscriptions.create`, pas dans `payment_settings` ; sur `customers.update` → `invoice_settings.default_payment_method`
- Resend plan Free = **1 domaine** seulement
- Purger `.next` si modif `.env.local` pendant que le serveur tourne
- Sessions tmux actives (serveur + stripe listen) — visibles via `tmux ls`, logs dans `/tmp/mondevis-dev.log` et `/tmp/stripe-listen.log`

## 🧪 Commandes utiles
```bash
cd ~/Desktop/MonDevis
npm test                       # vitest 21/21
npx tsc --noEmit               # 0 erreur
npx tsx scripts/test-email-send.ts "ton@email.com"   # test email réel
npx tsx scripts/test-checkout-flow.ts                # E2E checkout signé
npx tsx scripts/test-checkout-flow.ts --url          # générer un lien 4242
tmux attach -t mondevis-server   # logs serveur
tmux attach -t mondevis-stripe   # logs webhooks Stripe
```
