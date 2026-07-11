export const CHECKOUT_PREFILL_STORAGE_KEY = "humpbuck-checkout-prefill";

export type CheckoutPrefillPayload = {
  source: "paypal-express";
  email?: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
};

export function readCheckoutPrefill(): CheckoutPrefillPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutPrefillPayload;
    if (parsed?.source !== "paypal-express") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCheckoutPrefill(payload: CheckoutPrefillPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_PREFILL_STORAGE_KEY, JSON.stringify(payload));
}

export function clearCheckoutPrefill(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECKOUT_PREFILL_STORAGE_KEY);
}
