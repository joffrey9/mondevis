import { prisma } from "@/lib/db";
import { getStripe } from "./stripe";

/** Crée ou récupère le customer Stripe lié à un utilisateur MonDevis. */
export async function getOrCreateCustomer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await getStripe().customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
