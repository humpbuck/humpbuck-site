"use client";

import { useMemo } from "react";
import {
  CHINA_DOMESTIC_SF_CNY,
  CHINA_DOMESTIC_ZTO_CNY,
  CNY_PER_USD,
  PREMIUM_EXPRESS_BASE_CNY,
  PREMIUM_EXPRESS_INCLUDED_KG,
  PREMIUM_EXPRESS_PER_KG_CNY,
  type ShippingMethodId,
  isCheckoutCountryChina,
  isChinaDomesticMethod,
  isPremiumExpressMethod,
  quoteCheckoutShipping,
  type CheckoutShippingQuote,
} from "@/lib/checkout-shipping-quote";
import { countryLabelToIso2, getDestinationCoverage } from "@/lib/logistics-estimate";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

const INCLUDED_KG_LABEL =
  PREMIUM_EXPRESS_INCLUDED_KG % 1 === 0
    ? String(PREMIUM_EXPRESS_INCLUDED_KG)
    : String(PREMIUM_EXPRESS_INCLUDED_KG);

const INTL_METHODS: {
  id: ShippingMethodId;
  title: string;
  subtitle: string;
  recommend?: "primary" | "secondary";
}[] = [
  {
    id: "cainiao",
    title: "Cainiao International",
    subtitle: "Economy — choose this when Cainiao S5059 or OH is available.",
    recommend: "primary",
  },
  {
    id: "yanwen",
    title: "Yanwen Logistics",
    subtitle: "Economy — choose this when Yanwen 484 is available.",
    recommend: "secondary",
  },
  {
    id: "dhl",
    title: "DHL Express",
    subtitle: "Premium — fixed ¥500/票.",
  },
  {
    id: "fedex",
    title: "FedEx",
    subtitle: "Premium — fixed ¥500/票.",
  },
  {
    id: "ups",
    title: "UPS",
    subtitle: "Premium — fixed ¥500/票.",
  },
  {
    id: "usps",
    title: "USPS",
    subtitle: "Premium — fixed ¥500/票.",
  },
];

const CN_METHODS: {
  id: ShippingMethodId;
  title: string;
  subtitle: string;
  recommend?: "primary" | "secondary";
}[] = [
  {
    id: "china_zto",
    title: `ZTO Express — est. ¥${CHINA_DOMESTIC_ZTO_CNY} domestic leg`,
    subtitle:
      "Default domestic channel; checkout is free shipping — the merchant covers freight.",
    recommend: "primary",
  },
  {
    id: "china_sf",
    title: `SF Express — est. ¥${CHINA_DOMESTIC_SF_CNY} domestic leg`,
    subtitle:
      "Faster domestic channel; checkout is free shipping — the merchant covers freight.",
    recommend: "secondary",
  },
];

export function CheckoutShippingSection({
  countryLabel,
  shippingState,
  totalUnits,
  method,
  onMethodChange,
  shippingPostalCode,
}: {
  countryLabel: string;
  /** State/province from shipping address (US: ISO 3166-2 e.g. CA, UM-81). */
  shippingState?: string;
  totalUnits: number;
  method: ShippingMethodId;
  onMethodChange: (id: ShippingMethodId) => void;
  shippingPostalCode?: string | null;
}) {
  const iso2 = useMemo(
    () => countryLabelToIso2(countryLabel),
    [countryLabel],
  );
  const isCn = isCheckoutCountryChina(countryLabel);

  const visibleIntlMethods = useMemo(() => {
    return INTL_METHODS.filter((m) => {
      const q = quoteCheckoutShipping({
        countryLabel,
        totalUnits,
        method: m.id,
        state: shippingState?.trim() || null,
        postalCode: shippingPostalCode,
      });
      return q.ok;
    });
  }, [countryLabel, totalUnits, shippingState, shippingPostalCode]);

  const quote = useMemo(
    () =>
      quoteCheckoutShipping({
        countryLabel,
        totalUnits,
        method,
        state: shippingState?.trim() || null,
        postalCode: shippingPostalCode,
      }),
    [countryLabel, totalUnits, method, shippingPostalCode, shippingState],
  );

  const destinationOk = Boolean(countryLabel.trim()) && iso2 !== null;

  const servedByEconomy = visibleIntlMethods.some(
    (m) => m.id === "cainiao" || m.id === "yanwen",
  );
  const cainiaoMethodVisible = visibleIntlMethods.some((m) => m.id === "cainiao");
  const yanwenMethodVisible = visibleIntlMethods.some((m) => m.id === "yanwen");

  const methodQuotes = useMemo(() => {
    const map = new Map<ShippingMethodId, CheckoutShippingQuote>();
    for (const m of visibleIntlMethods) {
      map.set(
        m.id,
        quoteCheckoutShipping({
          countryLabel,
          totalUnits,
          method: m.id,
          state: shippingState?.trim() || null,
          postalCode: shippingPostalCode,
        }),
      );
    }
    return map;
  }, [visibleIntlMethods, countryLabel, totalUnits, shippingState, shippingPostalCode]);

  if (isCn && destinationOk) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Shipping method (China mainland)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Domestic legs are estimated at ¥{CHINA_DOMESTIC_ZTO_CNY} (ZTO) / ¥
            {CHINA_DOMESTIC_SF_CNY} (SF) for our internal reference. At checkout we
            offer <strong className="text-ink">free shipping</strong> — you are not
            charged extra.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">
            China mainland address: your order shows free shipping.
          </p>
          <p className="mt-1 text-xs opacity-90">
            Pick a dispatch channel for the warehouse. Questions?{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>

        <ul className="space-y-2">
          {CN_METHODS.map((m) => {
            const selected = method === m.id;
            const rec = m.recommend;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onMethodChange(m.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-ink bg-white shadow-sm ring-1 ring-ink/15"
                      : "border-line bg-white/70 hover:border-ink/25"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-ink bg-ink" : "border-line bg-paper"
                    }`}
                    aria-hidden
                  >
                    {selected ? (
                      <span className="h-2 w-2 rounded-full bg-paper" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{m.title}</span>
                      {rec === "primary" ? (
                        <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                          RECOMMENDED
                        </span>
                      ) : null}
                      {rec === "secondary" ? (
                        <span className="rounded-full bg-sky-800/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-900">
                          GOOD VALUE
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {m.subtitle}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-line bg-white/60 px-4 py-3 text-sm">
          {quote.ok && isChinaDomesticMethod(method) ? (
            <p className="text-ink/90">
              <span className="font-semibold text-ink">Shipping: </span>
              <span className="text-emerald-800">
                Free (¥{quote.shippingCny.toFixed(0)} domestic leg is internal reference
                only; not charged separately)
              </span>
            </p>
          ) : quote.ok ? null : (
            <p className="text-red-800" role="alert">
              {quote.error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl tracking-tight text-ink">
          Shipping method
        </h2>
        <p className="mt-1 text-sm text-muted">
          Shipping choices below are only shown when your address is supported for
          online checkout. Indicative premium quotes: about ¥{PREMIUM_EXPRESS_BASE_CNY}{" "}
          for the first ~{INCLUDED_KG_LABEL}
          kg, then about ¥{PREMIUM_EXPRESS_PER_KG_CNY}/kg — confirm before dispatch.
          FX ≈{CNY_PER_USD} CNY/USD. Need help?{" "}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
          .
        </p>
      </div>

      {!destinationOk ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Select a complete shipping country above to see which services apply.
        </p>
      ) : !servedByEconomy ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            We can&apos;t deliver to your address through online checkout.
          </p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">
            If you need another shipping option, contact us on{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              WhatsApp: {WHATSAPP_DISPLAY}
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
            <p className="font-medium">
              This address is supported for checkout — choose a shipping method below.
            </p>
            <p className="mt-1 text-xs opacity-90">
              Questions?{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
              .
            </p>
          </div>

          <ul className="space-y-2">
            {visibleIntlMethods.map((m) => {
              const selected = method === m.id;
              const rec = m.recommend;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onMethodChange(m.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-ink bg-white shadow-sm ring-1 ring-ink/15"
                        : "border-line bg-white/70 hover:border-ink/25"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-ink bg-ink" : "border-line bg-paper"
                      }`}
                      aria-hidden
                    >
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-paper" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{m.title}</span>
                        {rec === "primary" ? (
                          <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                            RECOMMENDED
                          </span>
                        ) : null}
                        {rec === "secondary" ? (
                          <span className="rounded-full bg-sky-800/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-900">
                            GOOD VALUE
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {m.subtitle}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">
                        Est. shipping: {(() => {
                          const q = methodQuotes.get(m.id);
                          if (!q || !q.ok) return "-";
                          if (q.shippingUsdCents === 0) return "$0.00";
                          return `$${(q.shippingUsdCents / 100).toFixed(2)} (≈¥${q.shippingCny.toFixed(0)})`;
                        })()}
                      </span>
                      {isPremiumExpressMethod(m.id) ? (
                        <span className="mt-1 block text-[11px] text-muted">
                          Indicative: ¥{PREMIUM_EXPRESS_BASE_CNY} from{" "}
                          {INCLUDED_KG_LABEL}
                          kg + ¥{PREMIUM_EXPRESS_PER_KG_CNY}/kg — final quote may
                          differ.
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-line bg-white/60 px-4 py-3 text-sm">
            {quote.ok ? (
              <p className="text-ink/90">
                <span className="font-semibold text-ink">Shipping: </span>
                {quote.shippingUsdCents === 0 ? (
                  <span className="text-emerald-800">$0.00 (no top-up)</span>
                ) : (
                  <span className="tabular-nums">
                    ${(quote.shippingUsdCents / 100).toFixed(2)} (≈¥
                    {quote.shippingCny.toFixed(0)})
                  </span>
                )}
                {isPremiumExpressMethod(method) ? (
                  <span className="text-muted"> — {quote.lineLabel}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-red-800" role="alert">
                {quote.error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
