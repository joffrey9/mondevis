import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatSubscriptionStatus } from "./format-subscription";

/** Retourne l'abonnement actif (ou en essai / paiement en retard) de l'utilisateur. */
export async function getUserSubscription(userId?: string) {
  const session = await auth();
  const id = userId ?? session?.user?.id;
  if (!id) return null;

  return prisma.subscription.findFirst({
    where: { userId: id, status: { in: ["active", "trialing", "past_due"] } },
    orderBy: { createdAt: "desc" },
  });
}

/** L'utilisateur est-il payant (actif ou en essai) ? */
export async function isSubscribed(userId?: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  return sub?.status === "active" || sub?.status === "trialing";
}

export { formatSubscriptionStatus };
