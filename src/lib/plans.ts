/** Prix Stripe des plans payants MonDevis (à renseigner dans .env.local). */
export const PRICE_IDS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? "",
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS ?? "",
} as const;
