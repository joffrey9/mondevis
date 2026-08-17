#!/usr/bin/env node
/**
 * send-whatsapp-artisans.js — Envoi des messages WhatsApp aux artisans bêta MonDevis
 * via CallMeBot (le message part depuis TON numéro WhatsApp, enregistré sur CallMeBot).
 *
 * USAGE :
 *   node scripts/send-whatsapp-artisans.js                    → dry-run (affiche, n'envoie rien)
 *   node scripts/send-whatsapp-artisans.js --send             → envoi réel (1 par 1, délai 15 s)
 *   node scripts/send-whatsapp-artisans.js --only=3           → dry-run du contact #3 seulement
 *   node scripts/send-whatsapp-artisans.js --send --only=1    → envoi réel du contact #1
 *
 * PRÉREQUIS : .env doit contenir CALLMEBOT_API_KEY (et CALLMEBOT_PHONE, ton numéro).
 *
 * ⚠️ Numéros vérifiés le 17/08/2026 (Google Maps / PagesJaunes / sites officiels).
 *    Le contact #10 (L'Artisan Français, Tours) est INTROUVABLE → volontairement exclu.
 *    Cold WhatsApp à des pros = risque de signalement spam si envoyé en masse.
 *    Envoie d'abord en --dry-run, puis un seul --only=1 pour tester.
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

// Charger .env.local puis .env depuis la racine du projet (sans dépendance dotenv)
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m && !(m[1] in process.env)) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
        }
      }
    } catch (_) {
      /* fichier absent → on essaie le suivant */
    }
  }
}
loadEnv();

// ── Les 9 contacts vérifiés (le 10ᵉ, L'Artisan Français Tours, est exclu) ──
const ARTISANS = [
  { name: 'Jérôme',   entreprise: "CLAU'ELEC",              metier: 'électricien',          ville: 'Nantes',      phone: '+33619621550' },
  { name: 'Ylann',    entreprise: 'Plobylec',               metier: 'plombier-électricien', ville: 'Rennes',      phone: '+33666013009' },
  { name: 'Sébastien', entreprise: "PRO'DECO",              metier: 'peintre',              ville: 'Grenoble',    phone: '+33666010553' },
  { name: 'Florent',  entreprise: 'Delagrange Florent',     metier: 'électricien',          ville: 'Montpellier', phone: '+33755605880' },
  { name: 'Bruno',    entreprise: 'BS Sani Chauf',          metier: 'plombier-chauffagiste',ville: 'Orléans',     phone: '+33666791323' },
  { name: 'Nicolas',  entreprise: 'Nice Travaux Rénovation', metier: 'rénovation',          ville: 'Nice',        phone: '+33633631867' },
  { name: 'Jean',     entreprise: "L'Atelier de Plomberie", metier: 'plombier',             ville: 'Marseille',   phone: '+33413940932' },
  { name: 'Axel',     entreprise: 'Du Sol au Plafond',      metier: 'peintre',              ville: 'Marseille',   phone: '+33617143164' },
  { name: 'Repartim Rouen', entreprise: 'Repartim (agence)', metier: 'rénovation',          ville: 'Rouen',       phone: '+33970821718', corporate: true },
];

function messageFor(a) {
  const salut = a.corporate ? "Bonjour, c'est Joffrey 👋" : `Salut ${a.name}, c'est Joffrey 👋`;
  let contexte;
  if (a.corporate) {
    contexte = `Comme vous faites de la ${a.metier} à ${a.ville}, j'aimerais votre avis : vous testez`;
  } else if (a.metier === 'rénovation') {
    contexte = `Comme tu fais de la rénovation à ${a.ville}, j'aimerais ton avis : tu testes`;
  } else {
    contexte = `Comme tu es ${a.metier} à ${a.ville}, j'aimerais ton avis : tu testes`;
  }
  return (
    `${salut}\n\n` +
    `Je lance MonDevis, un outil pour créer et envoyer ses devis en 2 minutes ` +
    `depuis le téléphone (TVA auto, signature électronique).\n\n` +
    `${contexte} gratuitement 14 jours, sans carte bancaire ?\n\n` +
    `→ mondedevis.eu`
  );
}

function callmebotSend(phone, text) {
  return new Promise((resolve) => {
    const params = querystring.stringify({
      phone,
      text,
      apikey: process.env.CALLMEBOT_API_KEY,
    });
    https.get(`https://api.callmebot.com/whatsapp.php?${params}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const doSend = args.includes('--send');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? parseInt(onlyArg.split('=')[1], 10) : null;

  if (!process.env.CALLMEBOT_API_KEY) {
    console.error('❌ CALLMEBOT_API_KEY manquant dans .env — configure CallMeBot d’abord.');
    process.exit(1);
  }

  const targets = ARTISANS.map((a, i) => ({ ...a, idx: i + 1 }))
    .filter((a) => only == null || a.idx === only);

  console.log(doSend ? '🚀 ENVOI RÉEL (CallMeBot)' : '🔍 DRY-RUN — aucun envoi réel');
  console.log(`   ${targets.length} contact(s) ciblé(s)\n`);

  for (const a of targets) {
    const msg = messageFor(a);
    console.log(`── ${a.idx}/${ARTISANS.length} · ${a.name} (${a.entreprise}) → ${a.phone}`);
    console.log(msg.split('\n').map((l) => '   ' + l).join('\n'));

    if (doSend) {
      const res = await callmebotSend(a.phone, msg);
      const statut = res.error
        ? `❌ ${res.error}`
        : res.status === 200
          ? '✅ OK'
          : `⚠️ ${res.status} ${res.body}`;
      console.log(`   ↳ envoi : ${statut}`);
      await new Promise((r) => setTimeout(r, 15000)); // 15 s entre chaque envoi
    }
    console.log('');
  }

  console.log(
    doSend
      ? '✅ Terminé.'
      : '✅ Dry-run terminé. Relance avec --send pour envoyer réellement (conseillé : --send --only=1 d’abord).'
  );
}

main();
