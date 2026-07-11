import Stripe from "stripe";

function getStripeSecretKey(): string | null {
  return (
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    process.env.STRIPE_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY?.trim() ||
    null
  );
}

function getStripe(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

type StripeCheckoutSessionResult = { id: string; url: string | null };

/**
 * Create a Checkout Session via Stripe REST API (Workers-safe).
 * The `stripe` Node SDK can hang on Cloudflare Workers; `fetch` does not.
 */
async function createStripeCheckoutSession(params: {
  totalUsd: number;
  returnUrl: string;
  cancelUrl: string;
  orderId: string;
}): Promise<StripeCheckoutSessionResult> {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error("Stripe not configured");
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.append("payment_method_types[]", "card");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][product_data][name]", "HUMPBUCK Order");
  body.set("line_items[0][price_data][unit_amount]", String(Math.round(params.totalUsd * 100)));
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", params.returnUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("client_reference_id", params.orderId);
  body.set("metadata[orderId]", params.orderId);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  };

  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || "Stripe checkout failed");
  }

  return { id: data.id, url: data.url ?? null };
}

type StripePaymentIntentResult = { id: string; clientSecret: string };

/**
 * Create a Payment Intent via Stripe REST API (Workers-safe).
 * Enables card, Apple Pay, and Google Pay through Payment Element.
 */
async function createStripePaymentIntent(params: {
  totalUsd: number;
  orderId: string;
  customerEmail?: string;
}): Promise<StripePaymentIntentResult> {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error("Stripe not configured");
  }

  const body = new URLSearchParams();
  body.set("amount", String(Math.round(params.totalUsd * 100)));
  body.set("currency", "usd");
  if (params.orderId && params.orderId !== "preview") {
    body.set("metadata[orderId]", params.orderId);
  }
  body.set("automatic_payment_methods[enabled]", "true");
  if (params.customerEmail?.trim()) {
    body.set("receipt_email", params.customerEmail.trim());
  }

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    client_secret?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.client_secret) {
    throw new Error(data.error?.message || "Stripe payment intent failed");
  }

  return { id: data.id, clientSecret: data.client_secret };
}

function getStripePublishableKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    null
  );
}

async function verifyStripePaymentIntentForOrder(
  paymentIntentId: string,
  orderId: string,
): Promise<boolean> {
  const key = getStripeSecretKey();
  if (!key) return false;

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      {
        headers: { Authorization: `Bearer ${key}` },
      },
    );
    const data = (await res.json()) as {
      metadata?: { orderId?: string };
      status?: string;
    };
    if (!res.ok) return false;
    return data.metadata?.orderId === orderId && data.status === "succeeded";
  } catch {
    return false;
  }
}

export { createStripeCheckoutSession, createStripePaymentIntent, getStripe, getStripePublishableKey, verifyStripePaymentIntentForOrder };
