import { loadStripe, type Stripe } from "@stripe/stripe-js";

let cachedPublishableKey: string | null = null;
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  if (cachedPublishableKey !== publishableKey || !stripePromise) {
    cachedPublishableKey = publishableKey;
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export function preloadStripe(publishableKey: string): void {
  void getStripePromise(publishableKey);
}
