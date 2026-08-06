import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatSubscriptionStatus } from "./format-subscription";
import { computeDevisQuota } from "./devis-quota";

/** Retourne l'abonnement actif (ou en essai / paiement en retard) de l'utilisateur. */
export async function getUserSubscription(userId?: string) {
  // Évite un 2e appel auth() quand l'appelant a déjà la session (ex: server action)
  let id = userId;
  if (!id) {
    const session = await auth();
    id = session?.user?.id;
  }
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

/**
 * Quota de devis mensuel de l'utilisateur (gating Pro).
 * Débutant : 3 devis / mois civil — Pro/Business : illimité.
 */
export async function getDevisQuota(userId?: string) {
  // Ne ré-appelle pas auth() quand un userId est fourni (l'appelant a déjà la session)
  let id = userId;
  if (!id) {
    const session = await auth();
    id = session?.user?.id;
  }
  if (!id) return null;

  const subscribed = await isSubscribed(id);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyCount = await prisma.devis.count({
    where: { userId: id, createdAt: { gte: startOfMonth } },
  });

  return computeDevisQuota({ subscribed, monthlyCount });
}

export { formatSubscriptionStatus };
