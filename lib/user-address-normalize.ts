/**
 * Normalizes address payloads for `UserAddress` (account center + post-checkout sync).
 */

export type UserAddressPayload = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
};

/** Accepts account PATCH bodies or order `billingJson` / `shippingJson` objects. */
export function normalizeUserAddressInput(raw: unknown): UserAddressPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const line1 = String(o.line1 || "").trim();
  const city = String(o.city || "").trim();
  const postalCode = String(
    o.postalCode || o.zip || "",
  ).trim();
  const country = String(o.country || "").trim();
  if (!line1 || !city || !postalCode || !country) return null;
  return {
    line1,
    line2: o.line2 != null ? String(o.line2).trim() || null : null,
    city,
    state: o.state != null ? String(o.state).trim() || null : null,
    postalCode,
    country,
    phone: o.phone != null ? String(o.phone).trim() || null : null,
  };
}
