#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// MonDevis — Helper d'injection de secret dans .env.local (sans jamais loguer)
// -----------------------------------------------------------------------------
// Usage : pbpaste | node scripts/set-secret.mjs STRIPE_SECRET_KEY
//   → lit le presse-papiers, valide le format, met à jour .env.local,
//     n'affiche qu'une empreinte masquée (début + fin).
// Codes de sortie : 0 = OK, 1 = erreur (format invalide, clipboard vide…)
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const keyName = process.argv[2];
if (!keyName) {
  console.error("Usage : pbpaste | node scripts/set-secret.mjs KEY_NAME");
  process.exit(1);
}

const value = readFileSync(0, "utf8").trim();
if (!value) {
  console.error("✗ Presse-papiers vide — copie d'abord la valeur (Cmd+C).");
  process.exit(1);
}

// Validations de format connues (on ne vérifie que le préfixe, jamais la valeur)
const validators = {
  STRIPE_SECRET_KEY: /^sk_(test|live)_/,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: /^pk_(test|live)_/,
  STRIPE_WEBHOOK_SECRET: /^whsec_/,
  RESEND_API_KEY: /^re_/,
  AUTH_RESEND_KEY: /^re_/,
  AUTH_SECRET: /^[A-Za-z0-9]{16,}$/,
};
const ok = validators[keyName] ? validators[keyName].test(value) : value.length >= 10;
if (!ok) {
  console.error(`✗ Format invalide pour ${keyName} — vérifie que tu as bien copié la bonne clé.`);
  process.exit(1);
}

const path = resolve(".env.local");
if (!existsSync(path)) {
  console.error("✗ .env.local introuvable dans le dossier courant.");
  process.exit(1);
}
let env = readFileSync(path, "utf8");
const re = new RegExp(`^${keyName}=.*$`, "m");
if (re.test(env)) {
  env = env.replace(re, `${keyName}=${value}`);
} else {
  env += `\n${keyName}=${value}\n`;
}
writeFileSync(path, env, { mode: 0o600 });

// Empreinte uniquement (début + fin), jamais la valeur complète
const fp = value.length > 12 ? `${value.slice(0, 7)}…${value.slice(-4)}` : "***";
console.log(`✓ ${keyName} mis à jour dans .env.local (${fp}, ${value.length} chars)`);
