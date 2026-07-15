import { convertCnyCentsToUsdCents, formatCny } from "@/lib/cny-usd-exchange";
import { countryNameForShippingRateKey } from "@/lib/shipping-fee-country-options";
import { findPostalZone } from "@/lib/global-postal-zones";

function formatUsd(cents: number | null | undefined): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function extractCountryIso(label: string): string | null {
  const trimmed = label.trim();
  const match = trimmed.match(/\(([A-Za-z]{2})\)\s*$/);
  if (match) return match[1].toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

export function OrderShippingFeePanel({
  shippingCountryLabel,
  postalCode,
  shippingRateKey,
  shippingFeeCnyCents,
  surchargeCnyCents,
  shippingFeeUsdCents,
  surchargeUsdCents,
  cnyPerUsd,
  postalZone,
}: {
  shippingCountryLabel: string;
  postalCode?: string | null;
  shippingRateKey?: string | null;
  shippingFeeCnyCents?: number | null;
  surchargeCnyCents?: number | null;
  shippingFeeUsdCents?: number | null;
  surchargeUsdCents?: number | null;
  cnyPerUsd?: number | null;
  postalZone?: string | null;
}) {
  const countryIso = extractCountryIso(shippingCountryLabel);
  const resolvedPostalZone =
    postalZone?.trim() ||
    (countryIso === "AU" && postalCode?.trim()
      ? findPostalZone("AU", postalCode)?.zone ?? null
      : null);
  const rateLabel = shippingRateKey?.trim()
    ? countryNameForShippingRateKey(shippingRateKey)
    : null;
  const fx = cnyPerUsd && cnyPerUsd > 0 ? cnyPerUsd : null;
  const derivedShippingUsd =
    shippingFeeUsdCents ??
    (shippingFeeCnyCents != null && fx
      ? convertCnyCentsToUsdCents(shippingFeeCnyCents, fx)
      : null);
  const derivedSurchargeUsd =
    surchargeUsdCents ??
    (surchargeCnyCents != null && fx
      ? convertCnyCentsToUsdCents(surchargeCnyCents, fx)
      : null);

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h3 className="text-sm font-semibold text-ink">Shipping fee / Duty</h3>
      <p className="mt-1 text-xs text-muted">Admin rates in ¥; buyer paid USD at checkout FX.</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Destination</dt>
          <dd className="text-right text-ink">{shippingCountryLabel || "—"}</dd>
        </div>
        {postalCode ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Postcode</dt>
            <dd className="text-right font-mono text-xs text-ink">{postalCode}</dd>
          </div>
        ) : null}
        {resolvedPostalZone ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">AU postcode zone</dt>
            <dd className="text-right text-ink">{resolvedPostalZone}</dd>
          </div>
        ) : null}
        {rateLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Rate row</dt>
            <dd className="text-right text-ink">{rateLabel}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-line pt-2">
          <dt className="text-muted">Shipping fee</dt>
          <dd className="text-right tabular-nums text-ink">
            {shippingFeeCnyCents != null ? formatCny(shippingFeeCnyCents) : "—"}
            {derivedShippingUsd != null ? (
              <span className="mt-0.5 block text-[11px] text-muted">
                Paid {formatUsd(derivedShippingUsd)}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Duty (¥)</dt>
          <dd className="text-right tabular-nums text-ink">
            {surchargeCnyCents != null ? formatCny(surchargeCnyCents) : "—"}
            {derivedSurchargeUsd != null ? (
              <span className="mt-0.5 block text-[11px] text-muted">
                Paid {formatUsd(derivedSurchargeUsd)}
              </span>
            ) : null}
          </dd>
        </div>
        {fx ? (
          <p className="text-[11px] text-muted">FX at checkout: 1 USD = ¥{fx.toFixed(4)}</p>
        ) : null}
      </dl>
    </div>
  );
}
