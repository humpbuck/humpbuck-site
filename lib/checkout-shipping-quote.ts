import {
  countryLabelToIso2,
  estimateLogistics,
  getDestinationCoverage,
  yanwenCountryUsesZones,
} from "@/lib/logistics-estimate";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";

/** Public USD/CNY display; override via env for live FX. */
export const CNY_PER_USD = Number(
  process.env.NEXT_PUBLIC_CNY_PER_USD ?? "7.2",
);

/**
 * Optional offline-only helpers for customs-declaration scenarios (e.g. spreadsheets).
 * Live checkout and APIs use {@link declaredGoodsCnyForShippingFees} for VAT-style
 * destination math — not these defaults.
 */
export function declaredCifUsdForDestinationFees(): number {
  const raw = process.env.NEXT_PUBLIC_DECLARED_CIF_USD?.trim();
  const n = raw != null && raw !== "" ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return 5;
}

export function declaredGoodsCnyForDestinationFees(): number {
  return (
    Math.round(declaredCifUsdForDestinationFees() * CNY_PER_USD * 100) / 100
  );
}

/**
 * USD “declared goods” proxy for **shipping quotes only** (VAT / destination fee bands).
 * Default **1.2**. PayPal/Stripe line items still use the buyer’s **actual** cart prices.
 * Server env: `LOGISTICS_SHIPPING_DECLARED_CIF_USD`, or legacy `LOGISTICS_ADMIN_DECLARED_CIF_USD`.
 */
export function shippingDeclaredCifUsd(): number {
  const raw =
    process.env.LOGISTICS_SHIPPING_DECLARED_CIF_USD?.trim() ||
    process.env.LOGISTICS_ADMIN_DECLARED_CIF_USD?.trim();
  const n = raw != null && raw !== "" ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return 1.2;
}

/** @deprecated Use {@link shippingDeclaredCifUsd} */
export const adminLogisticsDeclaredCifUsd = shippingDeclaredCifUsd;

export function declaredGoodsCnyForShippingFees(): number {
  return (
    Math.round(shippingDeclaredCifUsd() * CNY_PER_USD * 100) / 100
  );
}

/** @deprecated Use {@link declaredGoodsCnyForShippingFees} */
export const declaredGoodsCnyForAdminLogisticsEstimate =
  declaredGoodsCnyForShippingFees;

export function cnyToUsdCents(cny: number): number {
  if (cny <= 0) return 0;
  return Math.max(1, Math.round((cny / CNY_PER_USD) * 100));
}

/**
 * Indicative premium express (DHL / FedEx / UPS / USPS): ¥500 covers the first
 * ~0.2kg; each additional kg adds ~¥120. Confirmed with carrier quotes — not
 * live API rates.
 */
export const PREMIUM_EXPRESS_BASE_CNY = 500;
export const PREMIUM_EXPRESS_INCLUDED_KG = 0.2;
export const PREMIUM_EXPRESS_PER_KG_CNY = 120;

export function premiumExpressTotalCny(billableKg: number): number {
  const extraKg = Math.max(0, billableKg - PREMIUM_EXPRESS_INCLUDED_KG);
  return (
    Math.round((PREMIUM_EXPRESS_BASE_CNY + extraKg * PREMIUM_EXPRESS_PER_KG_CNY) * 100) /
    100
  );
}

/** Mainland China domestic leg (merchant cost; checkout shows free shipping / $0). */
export const CHINA_DOMESTIC_ZTO_CNY = 5;
export const CHINA_DOMESTIC_SF_CNY = 15;

export function isCheckoutCountryChina(countryLabel: string): boolean {
  return countryLabelToIso2(countryLabel) === "CN";
}

export const SHIPPING_METHOD_IDS = [
  "china_zto",
  "china_sf",
  "cainiao",
  "yanwen",
  "dhl",
  "fedex",
  "ups",
  "usps",
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHOD_IDS)[number];

const PREMIUM_IDS: ShippingMethodId[] = ["dhl", "fedex", "ups", "usps"];

export function isShippingMethodId(s: string): s is ShippingMethodId {
  return (SHIPPING_METHOD_IDS as readonly string[]).includes(s);
}

export function isPremiumExpressMethod(id: ShippingMethodId): boolean {
  return PREMIUM_IDS.includes(id);
}

export function isChinaDomesticMethod(id: ShippingMethodId): boolean {
  return id === "china_zto" || id === "china_sf";
}

export function premiumExpressLabel(id: ShippingMethodId): string {
  switch (id) {
    case "dhl":
      return "DHL Express";
    case "fedex":
      return "FedEx";
    case "ups":
      return "UPS";
    case "usps":
      return "USPS (via partner)";
    default:
      return "Express";
  }
}

export type CheckoutShippingQuote =
  | {
      ok: true;
      shippingCny: number;
      shippingUsdCents: number;
      lineLabel: string;
    }
  | { ok: false; error: string };

export function quoteCheckoutShipping(input: {
  countryLabel: string;
  totalUnits: number;
  method: ShippingMethodId;
  /** State/province (US: ISO 3166-2 code) — excludes minor outlying areas from economy quotes. */
  state?: string | null;
  /** Shipping ZIP/postal — AU/CA zones are derived from this + country. */
  postalCode?: string | null;
  /** Legacy: only used if postcode does not map to a zone. */
  yanwenLogisticsZone?: string | null;
}): CheckoutShippingQuote {
  if (isCheckoutCountryChina(input.countryLabel)) {
    if (!isChinaDomesticMethod(input.method)) {
      return {
        ok: false,
        error: "For China addresses, choose ZTO or SF (domestic — shown as free).",
      };
    }
    const cny =
      input.method === "china_sf"
        ? CHINA_DOMESTIC_SF_CNY
        : CHINA_DOMESTIC_ZTO_CNY;
    const lineLabel =
      input.method === "china_sf"
        ? "Domestic shipping (SF Express) — complimentary"
        : "Domestic shipping (ZTO Express) — complimentary";
    return {
      ok: true,
      shippingCny: cny,
      shippingUsdCents: 0,
      lineLabel,
    };
  }

  if (isChinaDomesticMethod(input.method)) {
    return {
      ok: false,
      error: "ZTO/SF apply to mainland China addresses only.",
    };
  }

  const coverage = getDestinationCoverage(input.countryLabel, {
    state: input.state ?? null,
  });
  if (!coverage.cainiao && !coverage.yanwen) {
    return {
      ok: false,
      error: `This address is not available for online checkout. For other shipping options, contact us on WhatsApp: ${WHATSAPP_DISPLAY}.`,
    };
  }

  const est = estimateLogistics({
    countryLabel: input.countryLabel,
    totalUnits: input.totalUnits,
    state: input.state,
    postalCode: input.postalCode,
    yanwenZone: input.yanwenLogisticsZone,
    declaredGoodsCny: declaredGoodsCnyForShippingFees(),
  });
  if (!est.iso2) {
    return { ok: false, error: "Choose a valid shipping country." };
  }

  if (
    (input.method === "yanwen" || input.method === "cainiao") &&
    yanwenCountryUsesZones(est.iso2)
  ) {
    const z = deriveYanwenLaneZoneDigit(
      est.iso2,
      String(input.postalCode ?? "").trim(),
    );
    if (!z) {
      return {
        ok: false,
        error:
          "Enter a valid postal code so we can determine your shipping zone (Australia: 4-digit postcode; Canada: postal code).",
      };
    }
  }

  if (input.method === "cainiao") {
    if (est.iso2 !== "KW" && (est.baseFee == null || est.policyInternationalCny == null)) {
      return { ok: false, error: "Shipping Unavailable for this destination" };
    }
    const sup = est.iso2 === "KW" ? 41.43 : est.buyerSupplementCny;
    return {
      ok: true,
      shippingCny: sup,
      shippingUsdCents: cnyToUsdCents(sup),
      lineLabel: "International shipping (Cainiao International / OH)",
    };
  }

  if (input.method === "yanwen") {
    if (est.iso2 === "KW" || est.baseFee == null || est.policyInternationalCny == null) {
      return {
        ok: false,
        error: "Shipping Unavailable for this destination",
      };
    }
    const sup = est.buyerSupplementCny;
    const result: CheckoutShippingQuote = {
      ok: true,
      shippingCny: sup,
      shippingUsdCents: cnyToUsdCents(sup),
      lineLabel: "International shipping (Yanwen Logistics 484)",
    };
    return result;
  }

  if (isPremiumExpressMethod(input.method)) {
    const full = PREMIUM_EXPRESS_BASE_CNY;
    return {
      ok: true,
      shippingCny: full,
      shippingUsdCents: cnyToUsdCents(full),
      lineLabel: `International shipping (${premiumExpressLabel(input.method)})`,
    };
  }

  return { ok: false, error: "Invalid shipping method." };
}
