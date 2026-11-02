/**
 * Ajoute un NOUVEAU devis type sur le compte démo B2B (sans rien supprimer) :
 * DEV-BE-2026-XXXX « menuiseries extérieures » (fenêtres + porte d'entrée),
 * client particulier BE, TVA 21 %, statut envoyé.
 *
 * Contrairement à seed-demo.ts (qui recrée tout le compte), ce script ne fait
 * qu'AJOUTER un devis au compte demo@mondevis.eu existant.
 * Usage : npx tsx scripts/add-demo-devis.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@mondevis.eu";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error("Compte démo introuvable — lancer d'abord scripts/seed-demo.ts");
  }

  // Numérotation alignée sur l'app : préfixe BE = DEV-BE, compteur par année
  const last = await prisma.devis.findFirst({
    where: { userId: user.id, number: { startsWith: "DEV-BE-2026-" } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let nextNum = 1;
  if (last) {
    const match = last.number.match(/-(\d{4})$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const number = `DEV-BE-2026-${String(nextNum).padStart(4, "0")}`;

  const lines = [
    {
      description:
        "Fourniture et pose de 3 fenêtres alu laqué RAL 7016, double vitrage (1,20 × 1,15 m)",
      quantity: 3,
      unitPrice: 620,
      tvaRate: 21,
      totalHt: 1860,
    },
    {
      description:
        "Porte d'entrée alu isolée, serrure 3 points (pose comprise)",
      quantity: 1,
      unitPrice: 1450,
      tvaRate: 21,
      totalHt: 1450,
    },
    {
      description: "Reprises d'étanchéité et finitions intérieures (forfait)",
      quantity: 1,
      unitPrice: 290,
      tvaRate: 21,
      totalHt: 290,
    },
  ];

  const totalHt = lines.reduce((sum, l) => sum + l.totalHt, 0); // 3600
  const totalTtc = Math.round(totalHt * 1.21 * 100) / 100; // 4356

  const devis = await prisma.devis.create({
    data: {
      userId: user.id,
      clientName: "M. Laurent Vandermeulen",
      clientEmail: "laurent.vandermeulen@example.be",
      clientAddress: "Rue de la Station 34, 1400 Nivelles",
      country: "BE",
      profession: "Menuiserie",
      number,
      status: "sent",
      sentAt: new Date(),
      acomptePct: 30,
      delaiPaiement: 30,
      notes: "Remplacement des menuiseries extérieures — devis valable 30 jours.",
      totalHt,
      totalTtc,
      lines: { create: lines },
    },
  });

  console.log("✅ Devis démo ajouté :", devis.number);
  console.log(`   Client : ${devis.clientName} (particulier, BE)`);
  console.log(`   Total HT : ${totalHt} € · TVA 21 % · TTC : ${totalTtc} €`);
  console.log("   Rien d'autre n'a été modifié (facture B2B et ancien devis intacts).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
