"use client";

import { useDeferredValue, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  badge?: "RECOMMENDED" | "GOOD_VALUE";
}> = [
  { id: "cainiao", badge: "RECOMMENDED" },
  { id: "yanwen", badge: "GOOD_VALUE" },
  { id: "dhl" },
  { id: "fedex" },
  { id: "ups" },
  { id: "usps" },
];

export function CheckoutShippingSection({
  countryLabel,
  shippingState,
  totalUnits,
  method,
  onMethodChange,
  shippingPostalCode,
}: Props) {
  const t = useTranslations("CheckoutShipping");
  const deferredCountry = useDeferredValue(countryLabel);
  const deferredState = useDeferredValue(shippingState);
  const deferredPostal = useDeferredValue(shippingPostalCode);
  const deferredUnits = useDeferredValue(totalUnits);
  const weightKg = deferredUnits * 0.2;

  const quotes = useMemo(
    () => ({
      cainiao: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "cainiao", state: deferredState, postalCode: deferredPostal, weightKg }),
      yanwen: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "yanwen", state: deferredState, postalCode: deferredPostal, weightKg }),
      dhl: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "dhl", state: deferredState, postalCode: deferredPostal, weightKg }),
      fedex: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "fedex", state: deferredState, postalCode: deferredPostal, weightKg }),
      ups: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "ups", state: deferredState, postalCode: deferredPostal, weightKg }),
      usps: quoteCheckoutShipping({ countryLabel: deferredCountry, totalUnits: deferredUnits, method: "usps", state: deferredState, postalCode: deferredPostal, weightKg }),
    }),
    [deferredCountry, deferredPostal, deferredState, deferredUnits, weightKg],
  );

  const quoteFor = (id: ShippingMethodId) => quotes[id as keyof typeof quotes];

  const methodLabel = (id: ShippingMethodId) => {
    switch (id) {
      case "cainiao":
        return t("methodCainiao");
      case "yanwen":
        return t("methodYanwen");
      case "dhl":
        return t("methodDhl");
      case "fedex":
        return t("methodFedex");
      case "ups":
        return t("methodUps");
      case "usps":
        return t("methodUsps");
      default:
        return id;
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t("chooseRoute")}</h2>
          <p className="mt-1 text-xs text-muted">
            {t("routeMeta", {
              country: countryLabel || "—",
              state: shippingState || "—",
              units: totalUnits,
              postal: shippingPostalCode || "—",
            })}
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-muted">
        {t("saveNote")}
      </div>

      <div className="mt-4 space-y-3">
        {METHODS.map((item) => {
          const active = method === item.id;
          const quote = quoteFor(item.id);
          const priceText = quote.ok
            ? quote.shippingUsdCents <= 0
              ? t("freeShipping")
              : t("shippingFee", {
                  amount: `$${(quote.shippingUsdCents / 100).toFixed(2)}`,
                })
            : t("shippingUnavailable");
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
                  <div className="text-sm font-medium text-ink">{methodLabel(item.id)}</div>
                  {item.badge ? (
                    <span
                      className={`inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${item.badge === "RECOMMENDED" ? "bg-[#e7f1ed] text-[#0f5c4e]" : "bg-[#e8eff4] text-[#165d87]"}`}
                    >
                      {item.badge === "RECOMMENDED"
                        ? t("badgeRecommended")
                        : t("badgeGoodValue")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted">{priceText}</div>
                {!quote.ok ? (
                  <div className="mt-1 text-[11px] text-amber-800">{t("notForDestination")}</div>
                ) : null}
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
