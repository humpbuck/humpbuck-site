"use client";

import { useMemo, useState } from "react";
import { ShippingFeeCountrySelect } from "@/components/admin/shipping-fee-country-select";
import { ShippingFeePriceDeliveryFields } from "@/components/admin/shipping-fee-row-preview";
import { formatShippingRateDisplay } from "@/lib/country-labels";
import {
  listShippingFeeCountryOptions,
  shippingRateMatchesQuery,
} from "@/lib/shipping-fee-country-options";
import { SHIPPING_DEFAULTS, shippingFeeCny } from "@/lib/shipping-fee";

export type ShippingFeeRateRow = {
  id: string;
  countryCode: string;
  countryName: string;
  pricePerKg: number;
  deliveryFee: number;
  dutyPercent: number;
  deliveryDaysLabel: string;
};

const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

const btnPrimary =
  "h-10 rounded-full bg-ink px-4 text-xs font-semibold uppercase tracking-widest text-paper disabled:opacity-50";

const btnDanger =
  "h-10 rounded-full bg-rose-50 px-4 text-xs font-semibold uppercase tracking-widest text-rose-700";

type Props = {
  rates: ShippingFeeRateRow[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

function oneWatchPreview(pricePerKg: number, deliveryFee: number) {
  return shippingFeeCny({ pricePerKg, deliveryFee }, SHIPPING_DEFAULTS.watchWeightKg);
}

function RateRow({
  rate,
  updateAction,
  deleteAction,
}: {
  rate: ShippingFeeRateRow;
  updateAction: Props["updateAction"];
  deleteAction: Props["deleteAction"];
}) {
  const [pricePerKg, setPricePerKg] = useState(String(rate.pricePerKg));
  const [deliveryFee, setDeliveryFee] = useState(String(rate.deliveryFee));
  const preview = useMemo(() => {
    const pkg = Number(pricePerKg);
    const fee = Number(deliveryFee);
    if (![pkg, fee].every((n) => Number.isFinite(n) && n >= 0)) return null;
    return oneWatchPreview(pkg, fee);
  }, [pricePerKg, deliveryFee]);

  const display = formatShippingRateDisplay(rate.countryCode, rate.countryName || undefined);

  return (
    <li className="border-t border-line px-5 py-4">
      <form
        action={updateAction}
        className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,0.8fr)_1fr_auto] md:items-end"
      >
        <input type="hidden" name="id" value={rate.id} />
        <input type="hidden" name="countryCode" value={rate.countryCode} />
        <p className="text-sm font-medium text-ink">
          {display}
          <span className="mt-1 block text-xs font-normal text-muted">
            1只表 ¥{preview == null ? "—" : preview.toFixed(2)} = {pricePerKg || "0"} ×{" "}
            {SHIPPING_DEFAULTS.watchWeightKg} + {deliveryFee || "0"}
          </span>
        </p>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          ¥/kg
          <input
            name="pricePerKg"
            type="number"
            min="0"
            step="0.01"
            required
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          派送费
          <input
            name="deliveryFee"
            type="number"
            min="0"
            step="0.01"
            required
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          税费 %
          <input
            name="dutyPercent"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={String(rate.dutyPercent)}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Delivery time
          <input
            name="deliveryDaysLabel"
            type="text"
            required
            defaultValue={rate.deliveryDaysLabel || SHIPPING_DEFAULTS.deliveryTime}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            Save
          </button>
          <button type="submit" formAction={deleteAction} className={btnDanger}>
            Delete
          </button>
        </div>
      </form>
    </li>
  );
}

export function ShippingFeesStandardPanel({
  rates,
  createAction,
  updateAction,
  deleteAction,
}: Props) {
  const [rateQuery, setRateQuery] = useState("");
  const [addPrice, setAddPrice] = useState(String(SHIPPING_DEFAULTS.pricePerKg));
  const [addDelivery, setAddDelivery] = useState(String(SHIPPING_DEFAULTS.deliveryFee));

  const options = useMemo(() => listShippingFeeCountryOptions(), []);
  const configuredCodes = useMemo(() => rates.map((r) => r.countryCode), [rates]);

  const visibleRates = useMemo(() => {
    const q = rateQuery.trim();
    if (!q) return rates;
    return rates.filter((rate) => {
      const option =
        options.find((item) => item.value === rate.countryCode) ??
        ({
          value: rate.countryCode,
          englishName: rate.countryName || rate.countryCode,
          zhLabel: "",
          label: formatShippingRateDisplay(rate.countryCode, rate.countryName || undefined),
        } as const);
      return shippingRateMatchesQuery(option, q);
    });
  }, [options, rateQuery, rates]);

  const addPreview = useMemo(() => {
    const pkg = Number(addPrice);
    const fee = Number(addDelivery);
    if (![pkg, fee].every((n) => Number.isFinite(n) && n >= 0)) return null;
    return oneWatchPreview(pkg, fee);
  }, [addPrice, addDelivery]);

  return (
    <>
      <section className="relative z-10 mt-8 overflow-visible rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Standard shipping — add country
          </h2>
        </div>
        <form
          action={createAction}
          className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_repeat(3,0.8fr)_1fr_auto] md:items-end"
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Country
            <div className="mt-1">
              <ShippingFeeCountrySelect name="countryCode" excludeCodes={configuredCodes} />
            </div>
          </label>
          <ShippingFeePriceDeliveryFields
            initialPricePerKg={String(SHIPPING_DEFAULTS.pricePerKg)}
            initialDeliveryFee={String(SHIPPING_DEFAULTS.deliveryFee)}
            onPreviewChange={(_preview, price, delivery) => {
              setAddPrice(price);
              setAddDelivery(delivery);
            }}
          />
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            税费 %
            <input
              name="dutyPercent"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={String(SHIPPING_DEFAULTS.dutyPercent)}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Delivery time
            <input
              name="deliveryDaysLabel"
              type="text"
              required
              defaultValue={SHIPPING_DEFAULTS.deliveryTime}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <button type="submit" className={btnPrimary}>
            Add country
          </button>
        </form>
        <p className="px-5 pb-4 text-sm text-muted">
          1只表运费 ¥{addPreview == null ? "—" : addPreview.toFixed(2)} = {addPrice || "0"} ×{" "}
          {SHIPPING_DEFAULTS.watchWeightKg} + {addDelivery || "0"}。结账按购物车数量计算。
        </p>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Standard shipping — country rates
            </h2>
            <p className="mt-2 max-w-3xl text-xs text-muted">
              Preview ignores 税费%. Most countries: ¥/kg × weight + 派送费. Japan / Kazakhstan
              (OH 首重续重) use live OH so 2+ watches can cost more than 1. Duty =
              (goods + shipping) × 税费%.
            </p>
          </div>
          {rates.length > 0 ? (
            <label className="block min-w-[16rem] flex-1 text-xs font-semibold uppercase tracking-wide text-muted md:max-w-sm">
              搜索已设国家
              <input
                value={rateQuery}
                onChange={(e) => setRateQuery(e.target.value)}
                placeholder="中文、英文或代号"
                className={`${fieldClass} mt-1`}
              />
            </label>
          ) : null}
        </div>
        {rates.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">
            No countries configured yet. Add at least one country (and both Australia zones if you
            ship to AU) before customers can choose Standard Shipping. You can also run{" "}
            <code className="rounded bg-paper px-1 py-0.5 text-[11px]">
              npx tsx scripts/sync-shipping-fees-from-oh.ts --target=d1-remote
            </code>{" "}
            after D1 has pricePerKg / deliveryFee / dutyPercent.
          </p>
        ) : visibleRates.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">没有匹配的国家。</p>
        ) : (
          <ul>
            {visibleRates.map((rate) => (
              <RateRow
                key={rate.id}
                rate={rate}
                updateAction={updateAction}
                deleteAction={deleteAction}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
