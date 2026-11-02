/**
 * Définit (ou réinitialise) le mot de passe d'un utilisateur via le provider
 * Credentials (même structure que seed-user.ts : Account credentials avec
 * access_token = hash bcrypt).
 *
 * Usage : npx tsx scripts/set-password.ts <email> <motdepasse>
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage : npx tsx scripts/set-password.ts <email> <motdepasse>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("❌ Mot de passe trop court (8 caractères minimum).");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("❌ Utilisateur introuvable :", email);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, provider: "credentials" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { access_token: hash },
    });
    console.log("✅ Mot de passe mis à jour pour", email);
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
        access_token: hash,
      },
    });
    console.log("✅ Connexion par mot de passe activée pour", email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
