"use client";

import { useMemo, useState } from "react";
import { SHIPPING_DEFAULTS, shippingFeeCny } from "@/lib/shipping-fee";

const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2";

type Props = {
  initialPricePerKg: string;
  initialDeliveryFee: string;
  priceName?: string;
  deliveryName?: string;
  formId?: string;
  /** Optional: controlled externally; when omitted uses internal state. */
  showInlinePreview?: boolean;
  onPreviewChange?: (preview: number | null, pricePerKg: string, deliveryFee: string) => void;
};

export function ShippingFeePriceDeliveryFields({
  initialPricePerKg,
  initialDeliveryFee,
  priceName = "pricePerKg",
  deliveryName = "deliveryFee",
  formId,
  showInlinePreview = false,
  onPreviewChange,
}: Props) {
  const [pricePerKg, setPricePerKg] = useState(initialPricePerKg);
  const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);

  const preview = useMemo(() => {
    const pkg = Number(pricePerKg);
    const fee = Number(deliveryFee);
    if (![pkg, fee].every((n) => Number.isFinite(n) && n >= 0)) return null;
    return shippingFeeCny({ pricePerKg: pkg, deliveryFee: fee }, SHIPPING_DEFAULTS.watchWeightKg);
  }, [pricePerKg, deliveryFee]);

  function updatePrice(value: string) {
    setPricePerKg(value);
    const pkg = Number(value);
    const fee = Number(deliveryFee);
    const next =
      [pkg, fee].every((n) => Number.isFinite(n) && n >= 0)
        ? shippingFeeCny({ pricePerKg: pkg, deliveryFee: fee }, SHIPPING_DEFAULTS.watchWeightKg)
        : null;
    onPreviewChange?.(next, value, deliveryFee);
  }

  function updateDelivery(value: string) {
    setDeliveryFee(value);
    const pkg = Number(pricePerKg);
    const fee = Number(value);
    const next =
      [pkg, fee].every((n) => Number.isFinite(n) && n >= 0)
        ? shippingFeeCny({ pricePerKg: pkg, deliveryFee: fee }, SHIPPING_DEFAULTS.watchWeightKg)
        : null;
    onPreviewChange?.(next, pricePerKg, value);
  }

  return (
    <>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        ¥/kg
        <input
          form={formId}
          name={priceName}
          type="number"
          min="0"
          step="0.01"
          required
          value={pricePerKg}
          onChange={(e) => updatePrice(e.target.value)}
          className={`${fieldClass} mt-1`}
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        派送费
        <input
          form={formId}
          name={deliveryName}
          type="number"
          min="0"
          step="0.01"
          required
          value={deliveryFee}
          onChange={(e) => updateDelivery(e.target.value)}
          className={`${fieldClass} mt-1`}
        />
      </label>
      {showInlinePreview ? (
        <p className="text-sm text-muted md:col-span-full">
          1只表运费 ¥{preview == null ? "—" : preview.toFixed(2)} = {pricePerKg || "0"} ×{" "}
          {SHIPPING_DEFAULTS.watchWeightKg} + {deliveryFee || "0"}。结账按购物车数量计算。
        </p>
      ) : null}
    </>
  );
}

/** @deprecated table-cell layout — kept name for older imports */
export function ShippingFeeEditableFields(props: {
  initialPricePerKg: string;
  initialDeliveryFee: string;
  priceName?: string;
  deliveryName?: string;
  formId?: string;
  inputClassName: string;
}) {
  const [pricePerKg, setPricePerKg] = useState(props.initialPricePerKg);
  const [deliveryFee, setDeliveryFee] = useState(props.initialDeliveryFee);
  const preview = useMemo(() => {
    const pkg = Number(pricePerKg);
    const fee = Number(deliveryFee);
    if (![pkg, fee].every((n) => Number.isFinite(n) && n >= 0)) return null;
    return shippingFeeCny({ pricePerKg: pkg, deliveryFee: fee }, SHIPPING_DEFAULTS.watchWeightKg);
  }, [pricePerKg, deliveryFee]);

  return (
    <>
      <td className="px-4 py-3 align-top">
        <input
          form={props.formId}
          name={props.priceName ?? "pricePerKg"}
          type="number"
          min="0"
          step="0.01"
          required
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          className={props.inputClassName}
        />
      </td>
      <td className="px-4 py-3 align-top">
        <input
          form={props.formId}
          name={props.deliveryName ?? "deliveryFee"}
          type="number"
          min="0"
          step="0.01"
          required
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          className={props.inputClassName}
        />
      </td>
      <td className="px-4 py-3 align-top text-xs text-muted">
        {preview == null ? (
          "—"
        ) : (
          <>
            <span className="font-medium tabular-nums text-ink">1只表 ¥{preview.toFixed(2)}</span>
            <span className="mt-0.5 block">
              {pricePerKg || "0"} × {SHIPPING_DEFAULTS.watchWeightKg} + {deliveryFee || "0"}
            </span>
          </>
        )}
      </td>
    </>
  );
}
