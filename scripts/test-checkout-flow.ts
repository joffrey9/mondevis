/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TEST E2E CHECKOUT — MonDevis (mode TEST Stripe)
 * ─────────────────────────────────────────────────────────────────────────────
 * Reproduit le flux complet d'un paiement réel SANS navigateur :
 *
 *   1. Crée un user test en base
 *   2. Crée le customer Stripe (comme getOrCreateCustomer)
 *   3. Attache une carte test 4242 (tok_visa) → subscription réelle ACTIVE
 *   4. Construit l'événement `checkout.session.completed` (comme Stripe)
 *   5. Le SIGNE avec STRIPE_WEBHOOK_SECRET (même algo HMAC que Stripe)
 *   6. POST → http://localhost:3000/api/webhooks/stripe
 *   7. Vérifie que l'abonnement est upserté en base (userId + status)
 *   8. Cleanup complet (user DB + subscription + customer Stripe)
 *
 * Pré-requis : serveur dev lancé (port 3000) + stripe listen actif
 *              (STRIPE_WEBHOOK_SECRET de .env.local = secret du listen).
 *
 * Exécution :
 *   cd ~/Desktop/MonDevis
 *   set -a && source .env.local && set +a && npx tsx scripts/test-checkout-flow.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

function loadEnv() {
  const file = path.resolve(process.cwd(), ".env.local");
  const content = readFileSync(file, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    // On écrase TOUJOURS la valeur (même si la variable existe déjà dans l'env) :
    // le shell de login exporte parfois DATABASE_URL= vide, ce qui casse Prisma
    // si on ne surcharge pas (.env.local est la source de vérité ici).
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}
function warn(msg: string) {
  console.log(`  ⚠️  ${msg}`);
}
function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
}

/** Signe un payload comme le fait Stripe (header `t=...,v1=...`). */
function signPayload(secret: string, payload: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const v1 = createHmac("sha256", secret).update(signed).digest("hex");
  return { timestamp, signature: `t=${timestamp},v1=${v1}` };
}

/**
 * Mode "url" : crée une VRAIE Checkout Session (comme createCheckoutSession)
 * pour un user test et affiche l'URL à ouvrir dans le navigateur (carte 4242).
 * Le paiement réel déclenchera checkout.session.completed → stripe listen → webhook.
 */
async function runCheckoutUrl(): Promise<number> {
  loadEnv();
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  if (!secret || !priceId) {
    fail("Variables manquantes (STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PRICE_ID_PRO)");
    return 1;
  }
  const stripe = new Stripe(secret, { apiVersion: "2026-06-24.dahlia" });
  const prisma = new PrismaClient();
  const testEmail = `checkout-url-${Date.now()}@test.mondevis.dev`;
  let userId = "";
  let customerId = "";
  try {
    const user = await prisma.user.create({
      data: { name: "Test Checkout URL", email: testEmail },
    });
    userId = user.id;
    const customer = await stripe.customers.create({
      email: testEmail,
      name: "Test Checkout URL",
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "http://localhost:3000/dashboard?checkout=success",
      cancel_url: "http://localhost:3000/pricing",
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    });
    if (!checkout.url) {
      fail("Pas d'URL de checkout retournée.");
      return 1;
    }
    console.log(`\n🧪 User test créé : ${testEmail} (${userId.slice(0, 8)}…)\n`);
    console.log(`🔗 URL DE CHECKOUT (carte 4242) :\n${checkout.url}\n`);
    console.log("Après paiement, vérifie le webhook (stripe listen) et le dashboard :");
    console.log("  tmux attach -t mondevis-stripe");
    console.log("Nettoyage manuel après test :");
    console.log(`  cd ~/Desktop/MonDevis && node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.delete({where:{id:'${userId}'}}).then(()=>p.\$disconnect())"`);
    return 0;
  } catch (err) {
    fail((err as Error).message);
    return 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function run(): Promise<number> {
  loadEnv();
  const webhookUrl = process.env.TEST_WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/stripe";

  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  if (!secret || !webhookSecret || !priceId) {
    fail("Variables manquantes (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / NEXT_PUBLIC_STRIPE_PRICE_ID_PRO)");
    return 1;
  }
  if (!secret.startsWith("sk_test_")) {
    fail(`Refus : ce test est codé pour sk_test_ (clé actuelle : ${secret.slice(0, 8)}…)`);
    return 1;
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-06-24.dahlia" });
  const prisma = new PrismaClient();

  const testEmail = `checkout-e2e-${Date.now()}@test.mondevis.dev`;
  let userId = "";
  let customerId = "";
  let subscriptionId = "";
  let pmId = "";

  try {
    console.log("\n═══════════════ TEST E2E CHECKOUT (mode TEST) ═══════════════\n");

    // ── 1. User test ──
    console.log("1️⃣  Création du user test…");
    const user = await prisma.user.create({
      data: { name: "Test Checkout E2E", email: testEmail },
    });
    userId = user.id;
    ok(`user ${user.email} (${user.id.slice(0, 8)}…)`);

    // ── 2. Customer Stripe (comme getOrCreateCustomer) ──
    console.log("2️⃣  Création du customer Stripe…");
    const customer = await stripe.customers.create({
      email: testEmail,
      name: "Test Checkout E2E",
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
    ok(`customer ${customerId}`);

    // ── 3. Carte test 4242 + subscription ACTIVE ──
    console.log("3️⃣  Carte test 4242 → subscription…");
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { token: "tok_visa" },
    });
    pmId = pm.id;
    await stripe.paymentMethods.attach(pmId, { customer: customerId });
    // SDK v22 : `default_payment_method` racine est déprécié sur customers.update
    // → passer par invoice_settings.default_payment_method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });
    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      // SDK v22 : default_payment_method est accepté à la racine de subscriptions.create
      default_payment_method: pmId,
      payment_settings: { save_default_payment_method: "on_subscription" },
    });
    subscriptionId = sub.id;
    ok(`subscription ${sub.id} (status: ${sub.status})`);

    // ── 4+5. Événement checkout.session.completed signé ──
    console.log("4️⃣  Construction + signature de l'événement…");
    const event = {
      id: `evt_test_e2e_${Date.now()}`,
      object: "event",
      api_version: "2026-05-27.dahlia",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_e2e_${Date.now()}`,
          object: "checkout.session",
          mode: "subscription",
          subscription: sub.id,
          customer: customerId,
          metadata: { userId },
        },
      },
      type: "checkout.session.completed",
    };
    const body = JSON.stringify(event);
    const { signature } = signPayload(webhookSecret, body);
    ok(`payload ${body.length} octets signé avec whsec_${webhookSecret.slice(0, 8)}…`);

    // ── 6. POST au webhook local ──
    console.log(`5️⃣  POST → ${webhookUrl}`);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      body,
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    ok(`HTTP ${res.status} ${json ? JSON.stringify(json) : ""}`);

    if (res.status !== 200) {
      fail("Le webhook a refusé l'événement signé.");
      return 1;
    }

    // ── 7. Vérification base ──
    console.log("6️⃣  Vérification en base…");
    await new Promise((r) => setTimeout(r, 1500)); // laisse l'upsert se propager
    const row = await prisma.subscription.findUnique({
      where: { stripeId: sub.id },
    });
    if (!row) {
      fail("Aucune ligne Subscription en base — l'upsert n'a pas eu lieu.");
      return 1;
    }
    ok(`Subscription en base : status=${row.status}, price=${row.stripePriceId.slice(0, 12)}…`);
    if (row.userId !== userId) {
      fail(`userId ne correspond pas (attendu ${userId.slice(0, 8)}…, reçu ${row.userId.slice(0, 8)}…).`);
      return 1;
    }
    ok(`userId résolu : ${row.userId.slice(0, 8)}… — lien user ↔ abonnement OK`);
    if (row.status === "active") {
      ok("🎉 Chaîne complète validée : carte 4242 → webhook signé → abonnement ACTIF en base");
    } else {
      warn(`status = "${row.status}" (attendu "active") — la chaîne fonctionne mais l'état Stripe diffère.`);
    }
    return 0;
  } catch (err) {
    fail((err as Error).message);
    return 1;
  } finally {
    // ── 8. Cleanup ──
    console.log("\n7️⃣  Cleanup…");
    try {
      if (subscriptionId) await stripe.subscriptions.cancel(subscriptionId);
      if (pmId) await stripe.paymentMethods.detach(pmId);
      if (customerId) await stripe.customers.del(customerId);
    } catch (e) {
      warn(`Cleanup Stripe partiel : ${(e as Error).message}`);
    }
    try {
      if (userId) {
        await prisma.subscription.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        ok("user test supprimé (DB)");
      }
    } catch (e) {
      warn(`Cleanup DB : ${(e as Error).message}`);
    }
    await prisma.$disconnect().catch(() => {});
  }
}

const isUrlMode = process.argv.includes("--url");
(isUrlMode ? runCheckoutUrl() : run()).then((code) => {
  console.log(code === 0 ? "\n✅ TERMINÉ" : "\n❌ EN ÉCHEC");
  process.exit(code);
});
