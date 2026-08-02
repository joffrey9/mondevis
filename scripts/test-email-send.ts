// ─────────────────────────────────────────────────────────────────────────────
// MonDevis — Test d'envoi email (devis + facture avec PDF joints)
// -----------------------------------------------------------------------------
// Usage (le destinataire est OBLIGATOIRE — pas de boîte publique par défaut) :
//   DRY-RUN (par défaut, sans clé valide) :
//     npx tsx scripts/test-email-send.ts "destinataire@example.com"
//   ENVOI RÉEL (avec une clé Resend valide dans .env.local) :
//     npx tsx scripts/test-email-send.ts "destinataire@example.com"
//   Le destinataire peut aussi venir de la variable d'env TEST_EMAIL.
//
// Le script réutilise les VRAIS builders PDF (src/lib/pdf/*) et le vrai client
// Prisma : il charge le dernier devis + la dernière facture de la base, génère
// les deux PDF, construit le payload Resend exact (comme sendDevisByEmail /
// sendFactureByEmail), puis envoie OU simule selon la présence d'une clé.
// Une clé placeholder (trop courte) déclenche un dry-run automatique.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { buildFacturePdfDoc, facturePdfFilename } from "@/lib/pdf/facture-pdf";
import { buildDevisPdfDoc, devisPdfFilename } from "@/lib/pdf/devis-pdf";

// ── Charge .env.local (Next.js le fait automatiquement, pas un script Node) ──
// On surcharge une variable existante si elle est VIDE (certains shells exportent
// DATABASE_URL vide), mais on garde les valeurs non vides déjà présentes.
const envPath = resolve(".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const prisma = new PrismaClient();

// Une clé Resend valide fait >30 caractères (re_...). Les placeholders font ~11.
const apiKey = process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY;
const hasValidKey = Boolean(apiKey && apiKey.length >= 30);
const from = process.env.EMAIL_FROM || process.env.AUTH_RESEND_FROM || "noreply@mondedevis.eu";

function pdfHeader(buf: Buffer): string {
  return String.fromCharCode(buf[0], buf[1], buf[2], buf[3], buf[4]);
}

async function main() {
  // Destinataire obligatoire : jamais de boîte publique par défaut (confidentialité).
  const recipient = process.argv[2] || process.env.TEST_EMAIL;
  if (!recipient) {
    throw new Error("Spécifiez un destinataire : npx tsx scripts/test-email-send.ts \"email@exemple.com\"");
  }

  console.log("──────────────────────────────────────────────");
  console.log("MonDevis — test envoi email avec PDF joints");
  console.log("Destinataire :", recipient);
  console.log("Expéditeur   :", from);
  console.log("Clé Resend   :", hasValidKey ? "valide ✓" : `ABSENTE/placeholder (${apiKey?.length || 0} chars) → dry-run`);
  console.log("──────────────────────────────────────────────");

  // 1. Charge le dernier devis + la dernière facture réels (avec leurs lignes)
  const [devis, facture] = await Promise.all([
    prisma.devis.findFirst({ include: { lines: true }, orderBy: { createdAt: "desc" } }),
    prisma.facture.findFirst({ include: { lines: true }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!devis || !facture) {
    throw new Error("Aucun devis/facture en base — créez-en un d'abord.");
  }

  const user = devis.userId === facture.userId
    ? await prisma.user.findUnique({ where: { id: devis.userId } })
    : null;
  const companyName = user?.companyName || user?.name || "Mon Entreprise";

  // 2. Génère les PDF avec les vrais builders (partagés client/serveur)
  const devisDoc = await buildDevisPdfDoc(devis, { company: { name: companyName } });
  const devisBuf = Buffer.from(devisDoc.output("arraybuffer"));
  const factureDoc = await buildFacturePdfDoc(facture, { name: companyName });
  const factureBuf = Buffer.from(factureDoc.output("arraybuffer"));

  const devisFile = devisPdfFilename(devis);
  const factureFile = facturePdfFilename(facture);

  console.log("\n✓ Devis   :", devis.number, `→ ${devisFile}`);
  console.log("  PDF     :", devisBuf.length, "octets, header", pdfHeader(devisBuf));
  console.log("✓ Facture :", facture.number, `→ ${factureFile}`);
  console.log("  PDF     :", factureBuf.length, "octets, header", pdfHeader(factureBuf));

  if (pdfHeader(devisBuf) !== "%PDF-" || pdfHeader(factureBuf) !== "%PDF-") {
    throw new Error("Header PDF invalide — les builders ont un problème.");
  }

  const attachments = [
    { filename: factureFile, content: factureBuf },
    { filename: devisFile, content: devisBuf },
  ];

  // 3. Envoi réel si une clé valide existe, sinon dry-run
  if (!hasValidKey) {
    console.log("\nℹ DRY-RUN — clé Resend absente ou placeholder invalide, envoi simulé (aucun email émis).");
    console.log("  Pour un envoi réel : ajoutez une clé valide dans .env.local");
    console.log("  (RESEND_API_KEY ou AUTH_RESEND_KEY), puis relancez :");
    console.log(`  npx tsx scripts/test-email-send.ts "${recipient}"`);
    console.log("\n  ⚠ Rappels avant envoi réel :");
    console.log("  • L'expéditeur doit être un domaine vérifié chez Resend");
    console.log(`    (actuellement : ${from}) sinon l'envoi échouera en 403.`);
    console.log("  • Le PDF envoyé contient de vraies données clients —");
    console.log(`    ${devis.number} + ${facture.number} — utilisez votre propre adresse.`);
    console.log("\n  Payload Resend (hors envoi) :");
    console.log(`  from: ${from} | to: ${recipient}`);
    console.log(`  subject: [TEST] ${facture.number} + ${devis.number} — PDF joints`);
    console.log(`  attachments: ${attachments.map((a) => `${a.filename} (${a.content.length}o)`).join(", ")}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey!);
  const { error } = await resend.emails.send({
    from,
    to: recipient,
    subject: `[TEST] ${facture.number} + ${devis.number} — PDF joints`,
    html: `<p>Test d'envoi MonDevis avec PDF joints :</p>
      <ul>
        <li><b>${facture.number}</b> (${factureFile}, ${factureBuf.length} octets)</li>
        <li><b>${devis.number}</b> (${devisFile}, ${devisBuf.length} octets)</li>
      </ul>`,
    attachments,
  });
  if (error) throw new Error(`Envoi échoué : ${error.message}`);
  console.log("\n✓ ENVOYÉ avec succès à", recipient, "— vérifiez la boîte de réception.");
}

main()
  .catch((e) => {
    console.error("✗ Erreur :", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
