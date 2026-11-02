/**
 * Passe le client du devis démo DEV-BE-2026-0001 de « particulier » à
 * « professionnel » (SPRL avec n° TVA BE fictif) pour permettre de montrer
 * la chaîne complète : devis accepté → Transformer en facture → bouton
 * Peppol visible (facture BE + client pro).
 * Usage : npx tsx scripts/update-demo-devis-client.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@mondevis.eu";
const DEVIS_NUMBER = "DEV-BE-2026-0001";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!user) throw new Error("Compte démo introuvable");

  const devis = await prisma.devis.findFirst({
    where: { userId: user.id, number: DEVIS_NUMBER },
    select: { id: true, number: true, clientName: true, clientSiret: true },
  });
  if (!devis) throw new Error(`Devis ${DEVIS_NUMBER} introuvable`);

  const updated = await prisma.devis.update({
    where: { id: devis.id },
    data: {
      clientName: "Charpentes & Associés SPRL",
      clientSiret: "BE 0876.543.210", // fictif, format BE+10 chiffres → détecté pro
      clientEmail: "contact@charpentes-associes-example.be",
      clientAddress: "Zone Industrielle du Petit-Roeulx 7, 1400 Nivelles",
    },
  });

  console.log("✅ Devis", updated.number, "mis à jour :");
  console.log("   Client :", updated.clientName, "(professionnel, TVA", updated.clientSiret, ")");
  console.log("   → Accepter le devis puis « Transformer en facture » : le bouton Peppol sera visible (client fictif : ne jamais envoyer).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
