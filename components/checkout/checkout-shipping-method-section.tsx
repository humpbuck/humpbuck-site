"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ShippingMethodId } from "@/lib/shipping-express-methods";
import { parseCheckoutCountryIso2 } from "@/lib/checkout-postal-validation";

export type CheckoutShippingMethodSelection = {
  methodId: ShippingMethodId;
  label: string;
  deliveryDaysLabel: string;
  shippingFeeUsdCents: number;
  surchargeUsdCents: number;
  totalUsdCents: number;
  rateKey?: string;
  postalZone?: string | null;
};

type MethodOption = CheckoutShippingMethodSelection & { available: boolean };

type Props = {
  countryLabel: string;
  postalCode: string;
  methodId: ShippingMethodId;
  onMethodChange: (methodId: ShippingMethodId) => void;
  onSelectionChange: (selection: CheckoutShippingMethodSelection | null) => void;
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const POSTAL_DEBOUNCE_MS = 350;

export function CheckoutShippingMethodSection({
  countryLabel,
  postalCode,
  methodId,
  onMethodChange,
  onSelectionChange,
}: Props) {
  const t = useTranslations("CheckoutShippingMethod");
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const methodIdRef = useRef(methodId);
  methodIdRef.current = methodId;

  const countryIso2 = parseCheckoutCountryIso2(countryLabel);
  const needsPostal = countryIso2 === "AU";

  const [debouncedPostal, setDebouncedPostal] = useState(() =>
    needsPostal ? postalCode.trim() : "",
  );

  useEffect(() => {
    if (!needsPostal) {
      setDebouncedPostal("");
      return;
    }
    const handle = window.setTimeout(() => setDebouncedPostal(postalCode.trim()), POSTAL_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [postalCode, needsPostal]);

  useEffect(() => {
    const country = countryLabel.trim();
    if (!country) {
      setMethods([]);
      setError(null);
      onSelectionChange(null);
      return;
    }
    if (needsPostal && !debouncedPostal) {
      setMethods([]);
      setError(null);
      onSelectionChange(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ country });
        if (needsPostal && debouncedPostal) params.set("postalCode", debouncedPostal);
        const res = await fetch(`/api/checkout/shipping-rate?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as
          | { ok: true; methods: MethodOption[] }
          | { ok: false; error?: string };

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          setMethods([]);
          onSelectionChange(null);
          if (data.ok === false && data.error === "postal_required") {
            setError(t("postalRequired"));
          } else if (data.ok === false && data.error === "country_not_configured") {
            setError(t("notConfigured"));
          } else {
            setError(t("loadError"));
          }
          return;
        }

        setMethods(data.methods);
        const currentMethodId = methodIdRef.current;
        const firstAvailable = data.methods.find((m) => m.available);
        if (
          firstAvailable &&
          !data.methods.some((m) => m.methodId === currentMethodId && m.available)
        ) {
          onMethodChange(firstAvailable.methodId);
        }
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
        setMethods([]);
        onSelectionChange(null);
        setError(t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [countryLabel, debouncedPostal, needsPostal, onMethodChange, onSelectionChange, t]);

  const selected = useMemo(
    () => methods.find((m) => m.methodId === methodId && m.available) ?? null,
    [methods, methodId],
  );

  useEffect(() => {
    if (!selected) {
      onSelectionChange(null);
      return;
    }
    onSelectionChange({
      methodId: selected.methodId,
      label: selected.label,
      deliveryDaysLabel: selected.deliveryDaysLabel,
      shippingFeeUsdCents: selected.shippingFeeUsdCents,
      surchargeUsdCents: selected.surchargeUsdCents,
      totalUsdCents: selected.totalUsdCents,
      rateKey: selected.rateKey,
      postalZone: selected.postalZone,
    });
  }, [selected, onSelectionChange]);

  const hasAvailable = methods.some((m) => m.available);
  const showInitialLoading = loading && methods.length === 0;

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="text-sm font-semibold text-ink">{t("heading")}</h2>

      {needsPostal && !debouncedPostal ? (
        <p className="mt-4 text-sm text-muted">{t("postalRequired")}</p>
      ) : showInitialLoading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : error ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </p>
      ) : !hasAvailable ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("notConfigured")}
        </p>
      ) : (
        <div className={`mt-4 space-y-3 ${loading ? "opacity-70" : ""}`}>
          {methods.map((item) => {
            const active = methodId === item.methodId;
            const shippingOnlyUsdCents = item.shippingFeeUsdCents;
            const priceText = item.available ? formatUsd(shippingOnlyUsdCents) : t("unavailable");
            const lineLabel = `${item.label} (${item.deliveryDaysLabel})`;
            return (
              <button
                key={item.methodId}
                type="button"
                onClick={() => item.available && onMethodChange(item.methodId)}
                disabled={!item.available || loading}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${active ? "border-ink bg-ink/5" : "border-line bg-paper hover:border-ink/40"} ${!item.available ? "cursor-not-allowed opacity-55" : ""}`}
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm font-medium text-ink">
                    {lineLabel}
                    {item.available ? (
                      <span className="text-muted"> — {formatUsd(shippingOnlyUsdCents)}</span>
                    ) : null}
                  </div>
                  {!item.available ? (
                    <div className="mt-1 text-xs text-muted">{priceText}</div>
                  ) : null}
                </div>
                <div className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-ink bg-ink" : "border-line bg-white"}`}
                  >
                    {active ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
