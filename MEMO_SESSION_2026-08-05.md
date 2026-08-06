# MEMO REPRISE — 2026-08-05 (handoff : on reprend MonDevis)

> **SCOPE STRICT : `~/Desktop/MonDevis` uniquement.** ❌ NE PAS travailler sur DevisFlash / Freebuff / devis-generator (suspendu).

## État au moment de la coupure (03/08, tout commité)
- ✅ Stripe implémenté de bout en bout (checkout Pro 19€ / Business 49€, webhook signé, portail, carte abonnement dashboard)
- ✅ Test checkout réussi (carte 4242, plan Pro actif en base, webhook reçu)
- ✅ Clés Stripe TEST présentes dans `.env.local` (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, prix publiables)
- ✅ Git propre : derniers commits `facd9f2` + `e643e08` (stripe), `17a8aac` (landing)
- ✅ Peppol fonctionnel — **verrouillé, ne pas toucher**
- ✅ 17/17 tests vitest, tsc 0 erreur, eslint clean, build OK

## 📋 À faire (dans l'ordre)

### 1. Gating Pro — limite 3 devis/mois (code pur, priorité)
- Plan Débutant : bloquer à 3 devis/mois
- Plan Pro/Business (Subscription active en DB) : illimité
- Réutiliser `src/lib/subscription.ts` (getUserSubscription / isSubscribed — code mort actuellement)
- Migration Prisma si besoin (ex: compteur mensuel ou compter les Devis du mois)

### 2. Fix shell de login (DATABASE_URL vide)
- Le shell exporte `DATABASE_URL=` (vide) → Next.js ne surcharge pas → Prisma crash
- Fix temporaire : `/tmp/run-mondevis-dev.sh` (source .env.local avant npm run dev)
- À corriger proprement dans le profil shell

### 3. Bascule email mondedevis.eu (plan 45 min du mémo 02/08)
- Resend : Add Domain mondedevis.eu (+ retirer devisflash.net, plan Free = 1 domaine)
- OVH zone DNS : SPF resend, DKIM send._domainkey, DMARC
- `.env.local` MANUEL : EMAIL_FROM / AUTH_RESEND_FROM = noreply@mondedevis.eu
- Test : `npx tsx scripts/test-email-send.ts "email"` → dkim/spf/dmarc pass

### 4. Stripe LIVE (juste avant la vente)
- Créer produits/prix LIVE (voir SETUP-STRIPE.md §6)
- Remplacer clés TEST par LIVE dans .env.local (manuel)

## ⚠️ Pièges connus
- `.env.local` = secrets → modification manuelle uniquement, jamais commitée
- Stripe SDK v22 : champs période sur les items, pas au niveau racine
- Purger `.next` après modif de `.env.local` pendant que le serveur tourne
- Singleton Stripe lazy (build-safe)
