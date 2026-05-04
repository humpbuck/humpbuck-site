import {
  CNY_PER_USD,
  isShippingMethodId,
  premiumExpressLabel,
  quoteCheckoutShipping,
  type ShippingMethodId,
} from "@/lib/checkout-shipping-quote";
import {
  CAINIAO_S5059_MAX_CHARGEABLE_KG,
  estimateLogistics,
  yanwenCountryUsesZones,
} from "@/lib/logistics-estimate";

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

function cainiaoLineWithRemark(
  base: number | null,
  dest: number,
): string {
  if (base == null) return "—";
  if (dest <= 0) return `¥${base.toFixed(2)}`;
  const sum = Math.round((base + dest) * 100) / 100;
  return `¥${base.toFixed(2)} + ¥${dest.toFixed(2)} (备注) = ¥${sum.toFixed(2)}`;
}

function s5059AdminLine(
  est: {
    s5059InternationalCny: number | null;
    destinationFeesCny: number;
    chargeableKgCainiao: number | null;
  },
): string {
  const kg = est.chargeableKgCainiao;
  if (
    kg != null &&
    kg > CAINIAO_S5059_MAX_CHARGEABLE_KG + 1e-9
  ) {
    return `— (S5059 ≤${CAINIAO_S5059_MAX_CHARGEABLE_KG} kg · billable ${kg.toFixed(3)} kg → use OH)`;
  }
  return cainiaoLineWithRemark(
    est.s5059InternationalCny,
    est.destinationFeesCny,
  );
}

/** Admin: 国际段 + 国内 + 计费重(含最小计费). */
function yanwenAdminLine(est: {
  yanwen484InternationalCny: number | null;
  yanwenWithDomesticCny: number | null;
  chargeableKgYanwen: number | null;
  yanwenPreMinChargeKg: number | null;
  yanwenMinChargeFloorKg: number | null;
}): string {
  const intl = est.yanwen484InternationalCny;
  const withDom = est.yanwenWithDomesticCny;
  const kg = est.chargeableKgYanwen;
  const pre = est.yanwenPreMinChargeKg;
  const floor = est.yanwenMinChargeFloorKg;
  if (intl == null || withDom == null || kg == null) return "—";
  const preSeg = pre != null ? ` · 实重/泡重 ${pre.toFixed(3)} kg` : "";
  const floorSeg =
    floor != null ? ` · 最小计费 ≥ ${floor.toFixed(3)} kg` : "";
  return `¥${intl.toFixed(2)} + ¥5 (国内) · 计费重 ${kg.toFixed(3)} kg${preSeg}${floorSeg} → ¥${withDom.toFixed(2)}`;
}

export function LogisticsReferencePanel({
  shippingCountryLabel,
  shippingState,
  totalUnits,
  declaredGoodsCny,
  postalCode,
  yanwenZone,
  effectiveLaneZone,
  checkoutShippingMethod,
}: {
  shippingCountryLabel: string;
  /** State/province from order address (US: ISO 3166-2). */
  shippingState?: string | null;
  totalUnits: number;
  /** Order goods value in CNY (matches checkout / payment — actual line subtotal × FX). */
  declaredGoodsCny: number;
  postalCode?: string | null;
  /** Stored lane zone when present; postcode mapping fills gaps for AU/CA. */
  yanwenZone?: string | null;
  /** Postcode-first lane 1–4 for AU/CA (matches pricing; same as address table). */
  effectiveLaneZone?: string | null;
  /** From order `shippingJson.shippingMethod` — drives buyer top-up recalculation. */
  checkoutShippingMethod?: string | null;
}) {
  const est = estimateLogistics({
    countryLabel: shippingCountryLabel,
    totalUnits,
    state: shippingState ?? undefined,
    postalCode,
    yanwenZone: yanwenZone ?? undefined,
    declaredGoodsCny,
  });

  const methodRaw = String(checkoutShippingMethod ?? "").trim();
  const checkoutMethod = isShippingMethodId(methodRaw) ? methodRaw : null;
  const checkoutQuote =
    checkoutMethod && totalUnits > 0
      ? quoteCheckoutShipping({
          countryLabel: shippingCountryLabel,
          totalUnits,
          method: checkoutMethod,
          state: shippingState ?? null,
          postalCode,
          yanwenLogisticsZone: yanwenZone ?? null,
          declaredGoodsCny,
        })
      : null;

  const zoneSuffix =
    est.iso2 && yanwenCountryUsesZones(est.iso2) && effectiveLaneZone
      ? ` · Lane zone ${effectiveLaneZone}`
      : null;

  return (
    <aside className="rounded-2xl border border-line bg-zinc-50/90 p-5 text-sm ring-1 ring-zinc-200/80">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        Logistics reference
      </h3>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Estimates from embedded Cainiao (S5059 / OH) and Yanwen (484) tables —
        200g/unit, 11×10×9cm volumetric.{" "}
        <span className="text-zinc-800">
          Destination surcharges (备注/VAT) use this order&apos;s goods value in CNY (same
          basis as checkout payment).
        </span>{" "}
        If you declare lower at ship-out for customs, that is manual — figures here stay
        payment-aligned. Yanwen 484 is priced by{" "}
        <span className="text-zinc-800">weight bands + min billable kg</span> (see billable
        kg row); the Yanwen line below is int&apos;l + ¥5 domestic only.         Cainiao S5059 only applies when billable weight ≤ {CAINIAO_S5059_MAX_CHARGEABLE_KG}{" "}
        kg (one carton model); above that use OH. Rows show{" "}
        <span className="text-zinc-800">lane + 备注</span>. Yanwen row shows{" "}
        <span className="text-zinc-800">国际段 + ¥5 国内 + 计费重</span> (min billing weight in
        rate table). Compare with your live quote before shipping.
        {est.iso2 === "AU" ? (
          <>
            {" "}
            <span className="text-zinc-700">
              For Australia, Cainiao S5059/OH use the same 1–4 zone as Yanwen (Cainiao
              rate key{" "}
              <code className="rounded bg-zinc-200/80 px-1">澳大利亚/N区</code>), derived
              from the shipping postcode via the Yanwen workbook extract.
            </span>
          </>
        ) : null}
        {est.iso2 === "CA" ? (
          <>
            {" "}
            <span className="text-zinc-700">
              Canada Yanwen 484 uses zones 1–4 from the Canadian postal sheet in
              the same extract; checkout matches that mapping.
            </span>
          </>
        ) : null}
        {est.cainiaoUsedIsoFallback ? (
          <>
            {" "}
            <span className="text-amber-900">
              Cainiao S5059/OH use ISO fallback rows where the official XLSX has
              no destination line (e.g. HK) — see{" "}
              <code className="rounded bg-zinc-200/80 px-1">cainiaoIsoFallback</code>{" "}
              in logistics-rates.json.
            </span>
          </>
        ) : null}
      </p>
      {est.iso2 &&
      yanwenCountryUsesZones(est.iso2) &&
      yanwenZone &&
      effectiveLaneZone &&
      /^[1-4]$/.test(yanwenZone.trim()) &&
      yanwenZone.trim() !== effectiveLaneZone ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
          Order file has{" "}
          <code className="rounded bg-amber-100/90 px-1">logisticsZone</code>{" "}
          {yanwenZone.trim()}, but the postcode maps to zone {effectiveLaneZone}.
          All figures below use zone {effectiveLaneZone} (same as checkout).
        </p>
      ) : null}
      <dl className="mt-4 space-y-2.5 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Destination</dt>
          <dd className="text-right font-medium text-ink">
            {est.iso2 ?? "—"}
            {est.cainiaoZhCountry ? (
              <span className="text-muted"> · {est.cainiaoZhCountry}</span>
            ) : null}
            {zoneSuffix ? (
              <span className="text-muted">{zoneSuffix}</span>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Billable kg (Cn / Yw)</dt>
          <dd className="tabular-nums text-right text-ink">
            {est.chargeableKgCainiao != null
              ? est.chargeableKgCainiao.toFixed(3)
              : "—"}
            {" / "}
            {est.chargeableKgYanwen != null
              ? est.chargeableKgYanwen.toFixed(3)
              : "—"}
          </dd>
        </div>
        <div className="border-t border-line/80 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            International (CNY)
          </p>
          <ul className="mt-2 space-y-1.5 tabular-nums">
            <li className="flex justify-between gap-2">
              <span>Cainiao lightweight S5059</span>
              <span className="max-w-[min(100%,18rem)] text-right leading-snug">
                {s5059AdminLine(est)}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Cainiao registered OH</span>
              <span className="max-w-[min(100%,18rem)] text-right leading-snug">
                {cainiaoLineWithRemark(
                  est.ohInternationalCny,
                  est.destinationFeesCny,
                )}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Yanwen 484 + ¥5 domestic leg</span>
              <span className="max-w-[min(100%,18rem)] text-right leading-snug">
                {yanwenAdminLine(est)}
              </span>
            </li>
          </ul>
          {est.destinationFeesLines.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted">
              {est.destinationFeesLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex justify-between gap-3 border-t border-line/80 pt-2.5 font-medium">
          <dt className="text-muted">Policy</dt>
          <dd className="text-right text-ink">
            {est.preferCainiao
              ? "Prefer Cainiao (margin rule)"
              : "Yanwen cheaper (beyond margin)"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Intl + dest vs ¥50 (policy pick)</dt>
          <dd className="text-right">
            {est.freeInternational ? (
              <span className="text-emerald-800">No top-up (¥0)</span>
            ) : (
              <span className="text-amber-900">
                Top-up ¥{est.buyerSupplementCny.toFixed(2)}
              </span>
            )}
          </dd>
        </div>
        <div className="border-t border-line/80 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Checkout recalculation
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Same rules as live checkout (
            <code className="rounded bg-zinc-200/80 px-1">
              quoteCheckoutShipping
            </code>
            , FX ≈{CNY_PER_USD} CNY/USD).
          </p>
          {!checkoutMethod ? (
            <p className="mt-2 text-[11px] text-amber-900">
              No{" "}
              <code className="rounded bg-zinc-200/70 px-1">shippingMethod</code>{" "}
              on file — legacy order; table rates above still apply.
            </p>
          ) : checkoutQuote?.ok ? (
            <ul className="mt-2 space-y-1.5 tabular-nums text-[13px]">
              <li className="flex justify-between gap-2">
                <span className="text-muted">Buyer chose</span>
                <span className="text-right font-medium text-ink">
                  {checkoutMethodLabel(checkoutMethod)}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">{checkoutQuote.lineLabel}</span>
                <span className="text-right">
                  <span className="text-ink">
                    ${(checkoutQuote.shippingUsdCents / 100).toFixed(2)}
                  </span>
                  <span className="text-muted">
                    {" "}
                    (≈¥{checkoutQuote.shippingCny.toFixed(2)})
                  </span>
                </span>
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-amber-900" role="alert">
              {checkoutQuote?.error ?? "Cannot quote."}
            </p>
          )}
        </div>
      </dl>
      {est.summaryLines.length > 0 && (
        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          {est.summaryLines.join(" ")}
        </p>
      )}
    </aside>
  );
}
