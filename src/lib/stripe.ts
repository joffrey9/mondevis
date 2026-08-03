import Stripe from "stripe";

// Singleton Stripe paresseux : instancié à la première utilisation uniquement,
// pour que l'import de ce module ne casse pas le build quand STRIPE_SECRET_KEY
// n'est pas encore renseigné (ex : .env.local sans clé).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante — renseignez-la dans .env.local");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

