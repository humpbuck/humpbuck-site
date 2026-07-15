import { convertCnyCentsToUsdCents, getCnyUsdExchangeRate } from "@/lib/cny-usd-exchange";
import { parseCheckoutCountryIso2 } from "@/lib/checkout-postal-validation";
import { findPostalZone } from "@/lib/global-postal-zones";
import {
  AU_SHIPPING_RATE_KEY_ZONE_12,
  AU_SHIPPING_RATE_KEY_ZONE_34,
  countryNameForShippingRateKey,
  isValidShippingRateKey,
} from "@/lib/shipping-fee-country-options";
import { prisma } from "@/lib/prisma";
import {
  type ShippingMethodId,
  isShippingMethodId,
  quoteAllExpressMethods,
} from "@/lib/shipping-express-methods";

export type ShippingFeeQuote = {
  ok: true;
  rateKey: string;
  countryCode: string;
  countryName: string;
  /** Admin-configured amounts in CNY (stored in DB). */
  shippingFeeCnyCents: number;
  surchargeCnyCents: number;
  totalCnyCents: number;
  /** Buyer-facing amounts in USD (converted at cached FX rate). */
  shippingFeeUsdCents: number;
  surchargeUsdCents: number;
  totalUsdCents: number;
  cnyPerUsd: number;
  postalZone?: string | null;
  deliveryDaysLabel: string;
};

export type ShippingFeeQuoteResult =
  | ShippingFeeQuote
  | { ok: false; error: "country_required" | "postal_required" | "country_not_configured" };

export function normalizeShippingCountryCode(countryLabel: string): string {
  return parseCheckoutCountryIso2(countryLabel).trim().toUpperCase();
}

export function isValidCountryCode(code: string): boolean {
  return isValidShippingRateKey(code);
}

/** Parse admin form value in CNY yuan (e.g. 50.00 → 5000 cents). */
export function parseCnyToCents(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** @deprecated Use parseCnyToCents — DB amounts are CNY. */
export const parseUsdToCents = parseCnyToCents;

export function formatCountryDisplayName(countryCode: string, countryName?: string | null): string {
  const code = countryCode.trim().toUpperCase();
  const name = countryName?.trim();
  if (name) return name;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function australiaPostalZoneToRateKey(zone: string | null | undefined): string {
  if (zone === "澳大利亚-1区" || zone === "澳大利亚-2区") {
    return AU_SHIPPING_RATE_KEY_ZONE_12;
  }
  return AU_SHIPPING_RATE_KEY_ZONE_34;
}

export function resolveShippingRateKey(
  countryLabel: string,
  postalCode?: string | null,
): { rateKey: string; postalZone?: string | null } | null {
  const countryCode = normalizeShippingCountryCode(countryLabel);
  if (!countryCode) return null;

  if (countryCode !== "AU") {
    return { rateKey: countryCode };
  }

  const postal = postalCode?.trim();
  if (!postal) return null;

  const zoneMatch = findPostalZone("AU", postal);
  const postalZone = zoneMatch?.zone ?? "澳大利亚-3区";
  return {
    rateKey: australiaPostalZoneToRateKey(postalZone),
    postalZone,
  };
}

export async function getShippingFeeRateByKey(rateKey: string) {
  const key = rateKey.trim().toUpperCase();
  if (!isValidShippingRateKey(key)) return null;
  return prisma.shippingFeeRate.findUnique({ where: { countryCode: key } });
}

export async function getShippingFeeRateByCountryCode(countryCode: string) {
  return getShippingFeeRateByKey(countryCode);
}

export async function listShippingFeeRates() {
  return prisma.shippingFeeRate.findMany({
    orderBy: [{ countryName: "asc" }, { countryCode: "asc" }],
  });
}

export async function quoteShippingFeeForCheckout(
  countryLabel: string,
  postalCode?: string | null,
  cnyPerUsd?: number,
): Promise<ShippingFeeQuoteResult> {
  const resolved = resolveShippingRateKey(countryLabel, postalCode);
  if (!resolved) {
    const countryCode = normalizeShippingCountryCode(countryLabel);
    if (countryCode === "AU") return { ok: false, error: "postal_required" };
    return { ok: false, error: "country_required" };
  }

  const rate = await getShippingFeeRateByKey(resolved.rateKey);
  if (!rate) return { ok: false, error: "country_not_configured" };

  const shippingFeeCnyCents = Math.max(0, rate.shippingFeeCents);
  const surchargeCnyCents = Math.max(0, rate.surchargeCents);
  const totalCnyCents = shippingFeeCnyCents + surchargeCnyCents;

  const fx = cnyPerUsd && cnyPerUsd > 0 ? { cnyPerUsd } : await getCnyUsdExchangeRate();
  const shippingFeeUsdCents = convertCnyCentsToUsdCents(shippingFeeCnyCents, fx.cnyPerUsd);
  const surchargeUsdCents = convertCnyCentsToUsdCents(surchargeCnyCents, fx.cnyPerUsd);

  return {
    ok: true,
    rateKey: rate.countryCode,
    countryCode: normalizeShippingCountryCode(countryLabel),
    countryName: rate.countryName || countryNameForShippingRateKey(rate.countryCode),
    shippingFeeCnyCents,
    surchargeCnyCents,
    totalCnyCents,
    shippingFeeUsdCents,
    surchargeUsdCents,
    totalUsdCents: shippingFeeUsdCents + surchargeUsdCents,
    cnyPerUsd: fx.cnyPerUsd,
    postalZone: resolved.postalZone ?? null,
    deliveryDaysLabel: rate.deliveryDaysLabel?.trim() || "7-14 Business Days",
  };
}

export type CheckoutShippingMethodOption = {
  methodId: ShippingMethodId;
  label: string;
  deliveryDaysLabel: string;
  shippingFeeUsdCents: number;
  surchargeUsdCents: number;
  totalUsdCents: number;
  available: boolean;
  rateKey?: string;
  postalZone?: string | null;
};

export type CheckoutShippingMethodsResult =
  | { ok: true; methods: CheckoutShippingMethodOption[]; cnyPerUsd: number }
  | { ok: false; error: "country_required" | "postal_required" };

export async function listCheckoutShippingMethods(
  countryLabel: string,
  postalCode?: string | null,
): Promise<CheckoutShippingMethodsResult> {
  const countryCode = normalizeShippingCountryCode(countryLabel);
  if (!countryCode) return { ok: false, error: "country_required" };
  if (countryCode === "AU" && !postalCode?.trim()) {
    return { ok: false, error: "postal_required" };
  }

  const fx = await getCnyUsdExchangeRate();
  const standardQuote = await quoteShippingFeeForCheckout(countryLabel, postalCode, fx.cnyPerUsd);
  const expressQuotes = await quoteAllExpressMethods(fx.cnyPerUsd);

  const methods: CheckoutShippingMethodOption[] = [];

  if (standardQuote.ok) {
    methods.push({
      methodId: "standard",
      label: "Standard Shipping",
      deliveryDaysLabel: standardQuote.deliveryDaysLabel,
      shippingFeeUsdCents: standardQuote.shippingFeeUsdCents,
      surchargeUsdCents: standardQuote.surchargeUsdCents,
      totalUsdCents: standardQuote.totalUsdCents,
      available: true,
      rateKey: standardQuote.rateKey,
      postalZone: standardQuote.postalZone ?? null,
    });
  } else {
    methods.push({
      methodId: "standard",
      label: "Standard Shipping",
      deliveryDaysLabel: "7-14 Business Days",
      shippingFeeUsdCents: 0,
      surchargeUsdCents: 0,
      totalUsdCents: 0,
      available: false,
    });
  }

  for (const express of expressQuotes) {
    methods.push({
      methodId: express.methodId,
      label: express.label,
      deliveryDaysLabel: express.deliveryDaysLabel,
      shippingFeeUsdCents: express.totalUsdCents,
      surchargeUsdCents: 0,
      totalUsdCents: express.totalUsdCents,
      available: express.available,
    });
  }

  return { ok: true, methods, cnyPerUsd: fx.cnyPerUsd };
}

export type CheckoutShippingMethodQuote =
  | (CheckoutShippingMethodOption & {
      ok: true;
      shippingFeeCnyCents: number;
      surchargeCnyCents: number;
      cnyPerUsd: number;
    })
  | { ok: false; error: string };

export async function quoteCheckoutShippingMethod(
  methodId: string,
  countryLabel: string,
  postalCode?: string | null,
): Promise<CheckoutShippingMethodQuote> {
  if (!isShippingMethodId(methodId)) {
    return { ok: false, error: "invalid_method" };
  }

  const listed = await listCheckoutShippingMethods(countryLabel, postalCode);
  if (!listed.ok) return { ok: false, error: listed.error };
  const match = listed.methods.find((m) => m.methodId === methodId && m.available);
  if (!match) return { ok: false, error: "method_unavailable" };

  if (methodId === "standard") {
    const standard = await quoteShippingFeeForCheckout(countryLabel, postalCode);
    if (!standard.ok) return { ok: false, error: standard.error };
    return {
      ok: true,
      ...match,
      shippingFeeCnyCents: standard.shippingFeeCnyCents,
      surchargeCnyCents: standard.surchargeCnyCents,
      cnyPerUsd: standard.cnyPerUsd,
    };
  }

  const express = await quoteAllExpressMethods(listed.cnyPerUsd);
  const row = express.find((m) => m.methodId === methodId);
  if (!row || !row.available) return { ok: false, error: "method_unavailable" };
  return {
    ok: true,
    ...match,
    shippingFeeCnyCents: row.feeCnyCents,
    surchargeCnyCents: 0,
    cnyPerUsd: listed.cnyPerUsd,
  };
}

export function parseDeliveryDaysLabel(raw: FormDataEntryValue | null): string {
  const text = String(raw ?? "").trim();
  return text || "7-14 Business Days";
}

export async function quoteShippingFeeForCountryLabel(
  countryLabel: string,
  postalCode?: string | null,
): Promise<ShippingFeeQuoteResult> {
  return quoteShippingFeeForCheckout(countryLabel, postalCode);
}

export function computeCheckoutTotalCents(input: {
  subtotalCents: number;
  shippingFeeUsdCents: number;
  surchargeUsdCents: number;
  discountCents: number;
}): number {
  const subtotal = Math.max(0, input.subtotalCents);
  const shipping = Math.max(0, input.shippingFeeUsdCents);
  const surcharge = Math.max(0, input.surchargeUsdCents);
  const discount = Math.max(0, input.discountCents);
  return Math.max(0, subtotal + shipping + surcharge - discount);
}
