// ─────────────────────────────────────────────────────────────────────────────
// MonDevis — Préparation Stripe LIVE (produits + prix Pro/Business)
// -----------------------------------------------------------------------------
// PRÉ-REQUIS (manuel, jamais commité) :
//   1. Dans `.env.local`, remplace STRIPE_SECRET_KEY par une clé sk_live_…
//      (Dashboard Stripe → Developers → API keys → mode Live)
//   2. Lance : npx tsx scripts/setup-stripe-live.ts
//
// Le script est IDEMPOTENT : il ne crée pas de doublon (recherche par nom de
// produit). Il affiche ensuite les lignes exactes à mettre dans .env.local
// (price IDs live) + la marche à suivre pour le webhook live.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

// ── Charge .env.local ──
const envPath = resolve(".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const key = process.env.STRIPE_SECRET_KEY || "";
if (!key.startsWith("sk_live_")) {
  console.error(
    "✗ STRIPE_SECRET_KEY n'est PAS une clé live (sk_live_…).\n" +
      "  1. Dashboard Stripe → Developers → API keys → bascule mode LIVE\n" +
      "  2. Copie la clé secrète sk_live_… dans .env.local (remplace sk_test_…)\n" +
      "  3. Relance ce script."
  );
  process.exit(1);
}

const stripe = new Stripe(key);
const PLANS = [
  { name: "MonDevis Pro", description: "Abonnement Pro - devis illimités", amount: 1900 },
  { name: "MonDevis Business", description: "Abonnement Business - PME et équipes", amount: 4900 },
];

async function main() {
  console.log("═".repeat(56));
  console.log("MonDevis — Setup Stripe LIVE");
  console.log("═".repeat(56));

  // 1. Vérif compte (charges_enabled ?)
  const account = await stripe.accounts.retrieveCurrent();
  console.log(`\n📋 Compte : ${account.id} (${account.email || "?"})`);
  console.log(
    `   Charges enabled : ${account.charges_enabled ? "✅ OUI — prêt à encaisser" : "❌ NON — onboarding incomplet"}`
  );
  if (!account.charges_enabled) {
    console.log("   → Complète l'onboarding : https://dashboard.stripe.com/account/onboarding");
  }
  if (account.requirements?.disabled_reason) {
    console.log("   ⚠️  requirements.disabled_reason :", account.requirements.disabled_reason);
  }

  // 2. Produits existants (éviter les doublons)
  const existing = await stripe.products.list({ limit: 100, active: true });
  console.log(`\n📦 Produits live existants : ${existing.data.length}`);

  const results: { name: string; productId: string; priceId: string; created: boolean }[] = [];

  for (const plan of PLANS) {
    let product = existing.data.find((p) => p.name === plan.name);
    let created = false;

    if (product) {
      console.log(`\n• Produit "${plan.name}" existe déjà (${product.id}) — prix vérifié`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { app: "mondevis" },
      });
      created = true;
      console.log(`\n• Produit "${plan.name}" créé → ${product.id}`);
    }

    // Prix récurrent mensuel actif existant ?
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });
    const existingPrice = prices.data.find(
      (p) =>
        p.unit_amount === plan.amount &&
        p.currency === "eur" &&
        p.recurring?.interval === "month"
    );

    let priceId: string;
    if (existingPrice) {
      priceId = existingPrice.id;
      console.log(`  • Prix ${(plan.amount / 100).toFixed(2)}€/mois existe → ${priceId}`);
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { app: "mondevis" },
      });
      priceId = price.id;
      console.log(`  • Prix ${(plan.amount / 100).toFixed(2)}€/mois créé → ${priceId}`);
    }

    results.push({ name: plan.name, productId: product.id, priceId, created });
  }

  // 3. Résumé + lignes .env.local
  console.log("\n" + "═".repeat(56));
  console.log("✅ LIGNES À COLLER DANS .env.local (manuel) :");
  console.log("═".repeat(56));
  for (const r of results) {
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_${r.name.includes("Business") ? "BUSINESS" : "PRO"}=${r.priceId}`);
  }
  console.log(`STRIPE_SECRET_KEY=sk_live_…          (déjà en place)`)
  console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…  (à copier depuis le dashboard)`)
  console.log(`STRIPE_WEBHOOK_SECRET=whsec_…        (après création du webhook, étape ci-dessous)`);

  // 4. Webhook live
  console.log("\n" + "═".repeat(56));
  console.log("🕸  WEBHOOK LIVE (dashboard Stripe) :");
  console.log("═".repeat(56));
  console.log("1. https://dashboard.stripe.com/webhooks → Add endpoint");
  console.log("2. URL : https://<domaine-prod>/api/webhooks/stripe");
  console.log("3. Événements : checkout.session.completed, customer.subscription.updated,");
  console.log("   customer.subscription.deleted, invoice.payment_failed");
  console.log("4. Copie le Signing secret (whsec_…) dans STRIPE_WEBHOOK_SECRET (.env.local)");
  console.log("5. Puis en prod : STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  console.log("   + les 2 NEXT_PUBLIC_STRIPE_PRICE_ID_* dans Vercel (Production+Preview)");

  console.log("\n✅ Setup Stripe live terminé.");
}

main().catch((err) => {
  console.error("✗ Erreur :", err?.message || err);
  process.exit(1);
});
