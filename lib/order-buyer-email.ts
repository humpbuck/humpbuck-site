const DEFAULT_MERCHANT_EMAIL = "humpbuck@outlook.com";

export function merchantNotifyInboxEmail(): string {
  return process.env.MERCHANT_NOTIFY_EMAIL?.trim() || DEFAULT_MERCHANT_EMAIL;
}

export function normalizeOrderEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isMerchantNotifyInbox(email: string): boolean {
  const e = normalizeOrderEmail(email);
  return e.length > 0 && e === normalizeOrderEmail(merchantNotifyInboxEmail());
}

/**
 * Buyer-facing transactional email. Returns null when the address is empty or
 * the merchant notify inbox (avoids duplicating buyer receipts in the store inbox).
 */
export function buyerTransactionalEmail(orderEmail: string): string | null {
  const trimmed = orderEmail.trim();
  if (!trimmed || !trimmed.includes("@")) return null;
  if (isMerchantNotifyInbox(trimmed)) return null;
  return trimmed;
}

export function stripeSessionBuyerEmail(session: {
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
}): string | null {
  const raw =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    "";
  if (!raw || !raw.includes("@")) return null;
  return normalizeOrderEmail(raw);
}

/** PayPal Orders v2 capture or order details (`payer.email_address`). */
export function paypalOrderBuyerEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const payer = (payload as { payer?: { email_address?: string } }).payer;
  const raw = payer?.email_address?.trim() ?? "";
  if (!raw || !raw.includes("@")) return null;
  return normalizeOrderEmail(raw);
}
