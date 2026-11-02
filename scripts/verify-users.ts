/**
 * Vérification lecture seule : liste les comptes + rôles.
 * Usage : npx tsx scripts/verify-users.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("Nombre de comptes :", users.length);
  for (const u of users) {
    console.log(
      `- ${u.email} | nom: ${u.name ?? "—"} | role: ${u.role} | créé le ${u.createdAt.toISOString().slice(0, 10)}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
