import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    process.env.STRIPE_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

export { getStripe };
