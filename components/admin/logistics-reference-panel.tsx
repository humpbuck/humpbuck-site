"use client";

import { useState } from "react";

import {
  isShippingMethodId,
  premiumExpressLabel,
  quoteCheckoutShipping,
  type ShippingMethodId,
} from "@/lib/checkout-shipping-quote";
import { getShippingOhQuote } from "@/lib/shipping-oh";
import { getShippingYanwen484Quote } from "@/lib/shipping-yanwen484";

function checkoutMethodLabel(id: ShippingMethodId): string {
  switch (id) {
    case "cainiao":
      return "Cainiao";
    case "yanwen":
      return "Yanwen";
    case "china_zto":
      return "ZTO (domestic)";
    case "china_sf":
      return "SF (domestic)";
    case "dhl":
      return premiumExpressLabel("dhl");
    case "fedex":
      return premiumExpressLabel("fedex");
    case "ups":
      return premiumExpressLabel("ups");
    case "usps":
      return premiumExpressLabel("usps");
    default:
      return id;
  }
}

function money(v: number | null | undefined): string {
  return v == null ? "-" : `¥${v.toFixed(2)}`;
}

function usd(v: number): string {
  return `$${(v / 6.8).toFixed(2)}`;
}

function lineTotal(parts: Array<number | null | undefined>): number | null {
  const vals = parts.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100;
}

export function LogisticsReferencePanel({
  shippingCountryLabel,
  shippingState,
  totalUnits,
  postalCode,
  yanwenZone,
  effectiveLaneZone,
  checkoutShippingMethod,
}: {
  shippingCountryLabel: string;
  shippingState?: string | null;
  totalUnits: number;
  postalCode?: string | null;
  yanwenZone?: string | null;
  effectiveLaneZone?: string | null;
  checkoutShippingMethod?: string | null;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const countryCode = shippingCountryLabel.trim().toUpperCase() || null;
  const cainiaoQuote = countryCode
    ? getShippingOhQuote({
        countryCode,
        postalCode: postalCode ?? undefined,
        weightKg: totalUnits * 0.2,
        quantity: totalUnits,
      })
    : null;
  const yanwenQuoteData = countryCode
    ? getShippingYanwen484Quote({
        countryCode,
        postalCode: postalCode ?? undefined,
        weightKg: totalUnits * 0.2,
        quantity: totalUnits,
      })
    : null;
  const est: {
    iso2: string | null;
    cainiaoZhCountry: string;
    chargeableKgCainiao: number | null;
    chargeableKgYanwen: number | null;
    ohInternationalCny: number | null;
    destinationFeesCnyCainiao: number;
    yanwen484InternationalCny: number | null;
    destinationFeesCnyYanwen: number;
    freeInternational: boolean;
    buyerSupplementCny: number;
  } = {
    iso2: countryCode,
    cainiaoZhCountry: shippingCountryLabel,
    chargeableKgCainiao: cainiaoQuote?.billableWeightKg ?? null,
    chargeableKgYanwen: yanwenQuoteData?.billableWeightKg ?? null,
    ohInternationalCny: cainiaoQuote?.baseFreightRmb ?? null,
    destinationFeesCnyCainiao:
      cainiaoQuote != null
        ? Math.max(0, cainiaoQuote.checkoutPriceRmb - (cainiaoQuote.baseFreightRmb - 50))
        : 0,
    yanwen484InternationalCny: yanwenQuoteData?.baseFreightRmb ?? null,
    destinationFeesCnyYanwen:
      yanwenQuoteData != null
        ? Math.max(0, yanwenQuoteData.checkoutPriceRmb - (yanwenQuoteData.baseFreightRmb - 5 + 50))
        : 0,
    freeInternational: Boolean(cainiaoQuote && cainiaoQuote.checkoutPriceRmb <= 0),
    buyerSupplementCny: cainiaoQuote ? Math.max(0, cainiaoQuote.checkoutPriceRmb) : 0,
  };

  const methodRaw = String(checkoutShippingMethod ?? "").trim();
  const checkoutMethod = isShippingMethodId(methodRaw) ? methodRaw : null;

  const checkoutCainiaoQuote = quoteCheckoutShipping({
    countryLabel: shippingCountryLabel,
    totalUnits,
    method: "cainiao",
    state: shippingState ?? null,
    postalCode,
    weightKg: undefined,
  });
  const checkoutYanwenQuote = quoteCheckoutShipping({
    countryLabel: shippingCountryLabel,
    totalUnits,
    method: "yanwen",
    state: shippingState ?? null,
    postalCode,
    weightKg: undefined,
  });

  const cainiaoShipping = checkoutCainiaoQuote.ok ? checkoutCainiaoQuote.shippingCny : null;
  const yanwenShipping = checkoutYanwenQuote.ok ? checkoutYanwenQuote.shippingCny : null;
  const preferred =
    cainiaoShipping != null && yanwenShipping != null
      ? cainiaoShipping <= yanwenShipping
        ? { label: "Cainiao", price: cainiaoShipping }
        : { label: "Yanwen", price: yanwenShipping }
      : cainiaoShipping != null
        ? { label: "Cainiao", price: cainiaoShipping }
        : yanwenShipping != null
          ? { label: "Yanwen", price: yanwenShipping }
          : null;

  const zoneSuffix = effectiveLaneZone ? ` · Lane ${effectiveLaneZone}` : null;

  const yanwenTotal = lineTotal([
    est.yanwen484InternationalCny,
    5,
    est.destinationFeesCnyYanwen,
  ]);

  return (
    <aside className="w-full rounded-2xl border border-line bg-zinc-50/95 p-5 text-sm ring-1 ring-zinc-200/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Logistics summary
          </h3>
          <p className="mt-1 text-[11px] text-muted">
            Checkout recalculates live using the selected carrier.
          </p>
        </div>
        {preferred ? (
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 ring-1 ring-emerald-200">
            Recommended: {preferred.label}
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Selected</span>
          <span className="font-medium text-ink">{checkoutMethod ? checkoutMethodLabel(checkoutMethod) : "—"}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-muted">Best price</span>
          <span className="font-medium text-ink">{preferred ? `${preferred.label} · ${usd(preferred.price)}` : "—"}</span>
        </div>
      </div>

      {yanwenZone && effectiveLaneZone && /^[1-4]$/.test(yanwenZone.trim()) && yanwenZone.trim() !== effectiveLaneZone ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
          Order zone {yanwenZone.trim()} differs from postcode zone {effectiveLaneZone}. Using zone {effectiveLaneZone}.
        </p>
      ) : null}

      <dl className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-4 text-[13px]">
          <dt className="text-muted">Destination</dt>
          <dd className="font-medium text-ink">
            {est.iso2 ?? "—"}
            {est.cainiaoZhCountry ? <span className="text-muted"> · {est.cainiaoZhCountry}</span> : null}
            {zoneSuffix ? <span className="text-muted">{zoneSuffix}</span> : null}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 text-[13px]">
          <dt className="text-muted">Billable kg</dt>
          <dd className="tabular-nums text-ink">
            {est.chargeableKgCainiao != null ? est.chargeableKgCainiao.toFixed(3) : "—"}
            {" / "}
            {est.chargeableKgYanwen != null ? est.chargeableKgYanwen.toFixed(3) : "—"}
          </dd>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[13px] font-medium text-ink hover:bg-zinc-50"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>

        {showDetails ? (
          <div className="grid gap-3 border-t border-line/80 pt-3 md:grid-cols-2">
            <section className="rounded-xl bg-white p-3 ring-1 ring-zinc-200/80">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-ink">Cainiao OH</h4>
                <span className="text-xs text-muted">{cainiaoQuote.ok ? cainiaoQuote.lineLabel : "Unavailable"}</span>
              </div>
              <div className="mt-2 space-y-1 text-[13px] tabular-nums">
                <div className="flex justify-between gap-3"><span className="text-muted">Base</span><span>{money(est.ohInternationalCny)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Fees</span><span>{money(est.destinationFeesCnyCainiao)}</span></div>
                <div className="flex justify-between gap-3 border-t border-dashed border-zinc-200 pt-1 font-medium"><span>Total</span><span>{cainiaoShipping == null ? "-" : (cainiaoShipping <= 0 ? "Free Shipping" : usd(cainiaoShipping))}</span></div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-3 ring-1 ring-zinc-200/80">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-ink">Yanwen 484</h4>
                <span className="text-xs text-muted">{yanwenQuote.ok ? yanwenQuote.lineLabel : "Unavailable"}</span>
              </div>
              <div className="mt-2 space-y-1 text-[13px] tabular-nums">
                <div className="flex justify-between gap-3"><span className="text-muted">Base</span><span>{money(est.yanwen484InternationalCny)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Domestic</span><span>¥5.00</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Fees</span><span>{money(est.destinationFeesCnyYanwen)}</span></div>
                <div className="flex justify-between gap-3 border-t border-dashed border-zinc-200 pt-1 font-medium"><span>Total</span><span>{yanwenTotal == null ? "-" : (yanwenTotal <= 0 ? "Free Shipping" : usd(yanwenTotal))}</span></div>
              </div>
            </section>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-line/80 pt-3">
          <dt className="text-muted">Current checkout method</dt>
          <dd className="text-right font-medium text-ink">{checkoutMethod ? checkoutMethodLabel(checkoutMethod) : "—"}</dd>
        </div>

        <div className="flex items-center justify-between gap-3 text-[13px]">
          <dt className="text-muted">Policy</dt>
          <dd className="text-right">{est.freeInternational ? "No top-up" : `Top-up ¥${est.buyerSupplementCny.toFixed(2)}`}</dd>
        </div>
      </dl>
    </aside>
  );
}
