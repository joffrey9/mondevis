import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "admin@mondevis.fr";
  const password = process.argv[3] ?? "Admin123!";
  const role = (process.argv[4] ?? "admin") as "admin" | "user" | "viewer";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  L'utilisateur ${email} existe déjà.`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name: email.split("@")[0], role },
  });
  await prisma.account.create({
    data: {
      userId: user.id, type: "credentials", provider: "credentials",
      providerAccountId: user.id, access_token: hash,
    },
  });

  console.log(`✅ Utilisateur créé :`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Role     : ${role}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
