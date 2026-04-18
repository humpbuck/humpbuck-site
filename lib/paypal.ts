function apiBase(): string {
  return process.env.PAYPAL_MODE === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function paypalAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("PayPal credentials not configured");
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "PayPal authentication failed");
  }
  return data.access_token;
}

export async function paypalCreateOrder(
  totalUsd: string,
  returnUrl: string,
  cancelUrl: string,
): Promise<{ id: string; approvalUrl: string }> {
  const token = await paypalAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalUsd,
          },
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });
  const data = (await res.json()) as {
    id?: string;
    links?: { rel: string; href: string }[];
    message?: string;
  };
  if (!res.ok || !data.id) {
    throw new Error(data.message || "PayPal order creation failed");
  }
  const approvalUrl = data.links?.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) {
    throw new Error("PayPal approval URL missing");
  }
  return { id: data.id, approvalUrl };
}

export async function paypalCaptureOrder(orderId: string): Promise<unknown> {
  const token = await paypalAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message || "PayPal capture failed",
    );
  }
  return data;
}
