/**
 * Diagnostic lecture seule : méthodes de connexion liées au compte,
 * sessions récentes et jetons de vérification.
 * Usage : npx tsx scripts/diag-login.ts [email]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "joffreyfortemps@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerified: true, role: true },
  });
  if (!user) {
    console.log("❌ Compte introuvable pour", email);
    return;
  }
  console.log("Compte :", user.email, "| role:", user.role, "| email vérifié le:", user.emailVerified?.toISOString().slice(0, 10) ?? "JAMAIS");

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { provider: true, type: true },
  });
  console.log("\nMéthodes de connexion liées :");
  if (accounts.length === 0) console.log("  ⚠️ AUCUNE (ni Google, ni magic link utilisé, ni mot de passe)");
  for (const a of accounts) console.log(`  - ${a.provider} (${a.type})`);

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { expires: "desc" },
    take: 3,
    select: { sessionToken: true, expires: true },
  });
  console.log("\nDernières sessions :", sessions.length === 0 ? "aucune" : "");
  for (const s of sessions) {
    const expired = s.expires < new Date();
    console.log(`  - expire le ${s.expires.toISOString()} ${expired ? "(expirée)" : "(valide)"}`);
  }

  const devisCount = await prisma.devis.count({ where: { userId: user.id } });
  console.log("\nDevis créés (total) :", devisCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
