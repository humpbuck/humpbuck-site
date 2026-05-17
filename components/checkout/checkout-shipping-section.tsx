"use client";

import { useEffect, useMemo, useState } from "react";
import { quoteCheckoutShipping, type ShippingMethodId } from "@/lib/checkout-shipping-quote";

type Props = {
  countryLabel: string;
  shippingState: string;
  totalUnits: number;
  method: ShippingMethodId;
  onMethodChange: (method: ShippingMethodId) => void;
  shippingPostalCode: string;
};

const METHODS: Array<{
  id: ShippingMethodId;
  label: string;
  badge?: string;
}> = [
  { id: "cainiao", label: "Cainiao International", badge: "RECOMMENDED" },
  { id: "yanwen", label: "Yanwen Logistics", badge: "GOOD VALUE" },
  { id: "dhl", label: "DHL Express" },
  { id: "fedex", label: "FedEx" },
  { id: "ups", label: "UPS" },
  { id: "usps", label: "USPS" },
];

export function CheckoutShippingSection({
  countryLabel,
  shippingState,
  totalUnits,
  method,
  onMethodChange,
  shippingPostalCode,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const quotes = useMemo(
    () => ({
      cainiao: quoteCheckoutShipping({ countryLabel, totalUnits, method: "cainiao", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
      yanwen: quoteCheckoutShipping({ countryLabel, totalUnits, method: "yanwen", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
      dhl: quoteCheckoutShipping({ countryLabel, totalUnits, method: "dhl", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
      fedex: quoteCheckoutShipping({ countryLabel, totalUnits, method: "fedex", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
      ups: quoteCheckoutShipping({ countryLabel, totalUnits, method: "ups", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
      usps: quoteCheckoutShipping({ countryLabel, totalUnits, method: "usps", state: shippingState, postalCode: shippingPostalCode, weightKg: totalUnits * 0.2 }),
    }),
    [countryLabel, shippingPostalCode, shippingState, totalUnits],
  );

  const quoteFor = (id: ShippingMethodId) => quotes[id as keyof typeof quotes];

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-line bg-white/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Shipping Fee</h2>
            <p className="mt-1 text-xs text-muted">Loading shipping options…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Choose shipping route</h2>
          <p className="mt-1 text-xs text-muted">
            Pick the route the customer will actually use. Country: {countryLabel || "—"} · State: {shippingState || "—"} · Units: {totalUnits} · Postal code: {shippingPostalCode || "—"}
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-muted">
        Selected route will be saved with the order and used for recalculation.
      </div>

      <div className="mt-4 space-y-3">
        {METHODS.map((item) => {
          const active = method === item.id;
          const quote = quoteFor(item.id);
          const priceText = quote.ok
            ? quote.shippingUsdCents <= 0
              ? "Free Shipping"
              : `Shipping Fee: $${(quote.shippingUsdCents / 100).toFixed(2)}`
            : "Shipping Fee: Unavailable";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onMethodChange(item.id)}
              disabled={!quote.ok}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${active ? "border-ink bg-ink/5" : "border-line bg-paper hover:border-ink/40"} ${!quote.ok ? "cursor-not-allowed opacity-55" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-ink">{item.label}</div>
                  {item.badge ? (
                    <span
                      className={`inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${item.badge === "RECOMMENDED" ? "bg-[#e7f1ed] text-[#0f5c4e]" : "bg-[#e8eff4] text-[#165d87]"}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted">{priceText}</div>
                {!quote.ok ? <div className="mt-1 text-[11px] text-amber-800">Not available for this destination.</div> : null}
              </div>
              <div className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-ink bg-ink" : "border-line bg-white"}`}>
                  {active ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
