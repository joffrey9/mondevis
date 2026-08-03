import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Interface locale minimale (structure plate des événements Stripe).
// Le SDK v22 a déplacé certains champs (current_period_* sur les items,
// subscription sur invoice_details) : on typote seulement ce qu'on lit.
interface SubscriptionPayload {
  id: string;
  status: string;
  customer?: string | null;
  metadata?: Record<string, string>;
  cancel_at_period_end?: boolean;
  current_period_start?: number | null;
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      price?: { id?: string };
      current_period_start?: number | null;
      current_period_end?: number | null;
    }>;
  };
}

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Stripe — synchronise les abonnements dans la base MonDevis.
// Événements gérés :
//   checkout.session.completed          → crée/maj l'abonnement
//   customer.subscription.updated       → maj statut / période / renouvellement
//   customer.subscription.deleted       → marque canceled
//   invoice.payment_failed              → marque past_due (alerte relance)
// ─────────────────────────────────────────────────────────────────────────────

/** Enregistre l'abonnement Stripe dans la DB (upsert par stripeId). */
async function upsertSubscription(sub: SubscriptionPayload) {
  const priceId = sub.items?.data?.[0]?.price?.id ?? "";
  const userId = sub.metadata?.userId;
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  // Si le userId n'est pas dans la metadata, on le retrouve via le customer Stripe.
  let resolvedUserId = userId;
  if (!resolvedUserId && sub.customer) {
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: sub.customer as string },
      select: { id: true },
    });
    resolvedUserId = user?.id;
  }
  if (!resolvedUserId) {
    // On ne droppe pas silencieusement : sans userId on ne peut pas lier
    // l'abonnement à un compte MonDevis. Lever une erreur → Stripe rejoue
    // l'événement (l'upsert est idempotent, donc le retry est sûr).
    throw new Error("Impossible de résoudre le userId pour la souscription " + sub.id);
  }

  await prisma.subscription.upsert({
    where: { stripeId: sub.id },
    update: {
      status: sub.status,
      stripePriceId: priceId,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    create: {
      userId: resolvedUserId,
      stripeId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !sig) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { mode?: string; subscription?: string };
      if (session.mode === "subscription" && session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(sub as unknown as SubscriptionPayload);
      }
      break;
    }
    case "customer.subscription.updated": {
      await upsertSubscription(event.data.object as SubscriptionPayload);
      break;
    }
    case "customer.subscription.deleted": {
      await upsertSubscription(event.data.object as SubscriptionPayload);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as {
        subscription?: string | null;
        invoice_details?: { subscription?: string | null };
      };
      const subscriptionId =
        invoice.subscription ?? invoice.invoice_details?.subscription;
      if (subscriptionId) {
        const sub = await getStripe().subscriptions.retrieve(subscriptionId);
        await upsertSubscription(sub as unknown as SubscriptionPayload);
      }
      break;
    }
    default:
      // Événements non gérés : on ignore proprement.
      break;
  }

  return NextResponse.json({ received: true });
}
