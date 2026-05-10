import { getShippingOhQuote } from "@/lib/shipping-oh";
import { getShippingYanwen484Quote } from "@/lib/shipping-yanwen484";

export type ShippingMethodId = "cainiao" | "yanwen" | "dhl" | "fedex" | "ups" | "usps" | "china_zto" | "china_sf";

export type CheckoutShippingQuote =
  | { ok: true; shippingCny: number; shippingUsdCents: number; lineLabel: string }
  | { ok: false; error: string };

export const CNY_PER_USD = 6.8;

export const PREMIUM_EXPRESS_BASE_CNY = 500;
export const PREMIUM_EXPRESS_INCLUDED_KG = 1;
export const PREMIUM_EXPRESS_PER_KG_CNY = 50;

export function premiumExpressLabel(method: "dhl" | "fedex" | "ups" | "usps"): string {
  return `${method.toUpperCase()} Express`;
}

export function isChinaDomesticMethod(method: ShippingMethodId): boolean {
  return method === "china_zto" || method === "china_sf";
}

export function isPremiumExpressMethod(method: ShippingMethodId): boolean {
  return method === "dhl" || method === "fedex" || method === "ups" || method === "usps";
}

export function isCheckoutCountryChina(countryLabel: string): boolean {
  const v = countryLabel.trim().toLowerCase();
  return v === "cn" || v === "china" || v === "china mainland";
}

function normalizeCountryIso2(countryLabel: string): string {
  const trimmed = countryLabel.trim();
  const match = trimmed.match(/\(([A-Za-z]{2})\)\s*$/);
  if (match) return match[1].toUpperCase();
  const direct = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(direct)) return direct;
  return direct;
}

export function getTaxIdRequirement(countryIso2: string | null): { label: string; description: string } | null {
  if (!countryIso2) return null;
  const iso = countryIso2.trim().toUpperCase();
  if (iso === "BR") return { label: "CPF/CNPJ", description: "Brazil tax ID is required." };
  if (iso === "MX") return { label: "RFC/CURP", description: "Mexico tax ID is required." };
  if (iso === "KR") return { label: "PCCC", description: "South Korea customs code may be required." };
  return null;
}

export function isCheckoutCountryChina(countryLabel: string): boolean {
  const v = countryLabel.trim().toLowerCase();
  return v === "cn" || v === "china" || v === "china mainland";
}

export function quoteCheckoutShipping(input: {
  countryLabel: string;
  totalUnits: number;
  method: ShippingMethodId;
  state?: string | null;
  postalCode?: string | null;
  weightKg?: number;
}): CheckoutShippingQuote {
  const countryIso2 = normalizeCountryIso2(input.countryLabel);

  if (input.method === "dhl" || input.method === "fedex" || input.method === "ups" || input.method === "usps") {
    return { ok: true, shippingCny: PREMIUM_EXPRESS_BASE_CNY, shippingUsdCents: Math.round((PREMIUM_EXPRESS_BASE_CNY / CNY_PER_USD) * 100), lineLabel: `${input.method.toUpperCase()} fixed 500 RMB` };
  }

  if (input.method === "yanwen") {
    const q = getShippingYanwen484Quote({ countryCode: countryIso2, postalCode: input.postalCode ?? undefined, weightKg: input.weightKg, quantity: input.totalUnits });
    if (!q) return { ok: false, error: "Yanwen 484 is not available for this destination." };
    return { ok: true, shippingCny: q.checkoutPriceRmb, shippingUsdCents: Math.round((q.checkoutPriceRmb / CNY_PER_USD) * 100), lineLabel: `Yanwen 484 · ${q.countryName}` };
  }

  const q = getShippingOhQuote({ countryCode: countryIso2, postalCode: input.postalCode ?? undefined, weightKg: input.weightKg, quantity: input.totalUnits });
  if (!q) return { ok: false, error: "Cainiao OH is not available for this destination." };
  const shippingCny = Math.max(0, q.checkoutPriceRmb);
  return {
    ok: true,
    shippingCny,
    shippingUsdCents: Math.round((shippingCny / CNY_PER_USD) * 100),
    lineLabel: q.checkoutDisplay === "Free Shipping" ? `Cainiao OH · Free Shipping` : `Cainiao OH · ${q.countryName}`,
  };
}
