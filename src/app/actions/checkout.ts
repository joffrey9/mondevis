"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/stripe-customer";
import { PRICE_IDS } from "@/lib/plans";

const ORIGIN = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Essai gratuit Stripe : 14 jours sans prélèvement (aligné sur le marketing du site).
const TRIAL_PERIOD_DAYS = 14;

/** Crée une session Checkout d'abonnement (mode: subscription). */
export async function createCheckoutSession(plan: "pro" | "business") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error("Prix Stripe non configuré (NEXT_PUBLIC_STRIPE_PRICE_ID_" + plan.toUpperCase() + ")");

  const customerId = await getOrCreateCustomer(session.user.id);

  const checkout = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${ORIGIN}/dashboard?checkout=success`,
    cancel_url: `${ORIGIN}/pricing`,
    metadata: { userId: session.user.id, plan },
    // Propager le userId sur la souscription elle-même : la Checkout Session
    // ne transmet PAS ses metadata à l'objet Subscription, mais le webhook
    // reçoit l'abonnement. Sans ça, la résolution du userId repose uniquement
    // sur le fallback stripeCustomerId.
    subscription_data: {
      metadata: { userId: session.user.id },
      trial_period_days: TRIAL_PERIOD_DAYS,
    },
  });

  return { url: checkout.url };
}

/** Crée une session Customer Portal (gérer l'abonnement : changement, annulation). */
export async function createPortalSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) throw new Error("Aucun compte Stripe associé");

  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${ORIGIN}/dashboard`,
  });

  return { url: portal.url };
}
