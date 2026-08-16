#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CREATE WEBHOOK STRIPE LIVE — MonDevis
 * ─────────────────────────────────────────────────────────────────────────────
 * Crée (ou valide) l'endpoint webhook Stripe en mode LIVE via l'API :
 *   URL      : https://mondedevis.eu/api/webhooks/stripe
 *   Événements : checkout.session.completed, customer.subscription.updated,
 *                customer.subscription.deleted, invoice.payment_failed
 *
 * Le signing secret (whsec_…) retourné par Stripe est injecté DANS .env.local
 * sans jamais être affiché (empreinte masquée uniquement).
 *
 * Usage :
 *   cd ~/Desktop/MonDevis
 *   npx tsx scripts/create-webhook-live.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const WEBHOOK_URL =
  process.env.MONDEVIS_WEBHOOK_URL || "https://mondedevis.eu/api/webhooks/stripe";
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
];

function loadEnv() {
  const file = path.resolve(process.cwd(), ".env.local");
  const content = readFileSync(file, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

function fp(value: string) {
  return value.length > 12 ? `${value.slice(0, 7)}…${value.slice(-4)}` : "***";
}

function setEnv(key: string, value: string) {
  const file = path.resolve(process.cwd(), ".env.local");
  let env = readFileSync(file, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env) ? env.replace(re, `${key}=${value}`) : env + `\n${key}=${value}\n`;
  writeFileSync(file, env, { mode: 0o600 });
  console.log(`  ✅ ${key} injecté dans .env.local (${fp(value)})`);
}

async function main() {
  loadEnv();
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key.startsWith("sk_live_")) {
    console.error("❌ STRIPE_SECRET_KEY doit être une clé LIVE (sk_live_…). Abandon.");
    process.exit(1);
  }
  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });

  // 1. Chercher un endpoint existant avec cette URL
  let endpoint: Stripe.WebhookEndpoint | null = null;
  const listed = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of listed.data) {
    if (ep.url === WEBHOOK_URL) {
      endpoint = ep;
      break;
    }
  }

  if (!endpoint) {
    const created = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [...EVENTS],
    });
    console.log(`  ✅ Endpoint créé : ${created.id} → ${created.url}`);
    if (created.secret) {
      setEnv("STRIPE_WEBHOOK_SECRET", created.secret);
    } else {
      console.log("  ⚠️  Aucun secret retourné à la création (non attendu).");
    }
  } else {
    console.log(`  ♻️  Endpoint existant : ${endpoint.id} → ${endpoint.url} (status=${endpoint.status})`);
    const current = (endpoint.enabled_events ?? []) as Stripe.WebhookEndpointCreateParams.EnabledEvent[];
    const missing = EVENTS.filter((e) => !current.includes(e));
    if (missing.length) {
      const all: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = Array.from(new Set([...current, ...missing]));
      await stripe.webhookEndpoints.update(endpoint.id, {
        enabled_events: all,
      });
      console.log(`  ➕ Événements ajoutés : ${missing.join(", ")}`);
    }
  }

  // 2. Vérifier que .env.local a bien un STRIPE_WEBHOOK_SECRET non vide
  const env = readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
  const m = env.match(/^STRIPE_WEBHOOK_SECRET=(.*)$/m);
  const secret = m?.[1] || "";
  if (secret) {
    console.log(`  ✅ STRIPE_WEBHOOK_SECRET présent dans .env.local (${fp(secret)})`);
  } else {
    console.log("  ⚠️  STRIPE_WEBHOOK_SECRET vide — injecter via : pbpaste | node scripts/set-secret.mjs STRIPE_WEBHOOK_SECRET");
  }
  console.log("  → Puis reporter la valeur sur Vercel (Production + Preview).");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Erreur :", err?.message || err);
  process.exit(1);
});
