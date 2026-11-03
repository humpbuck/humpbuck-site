"use client";

import { useMemo, useState } from "react";
import { SHIPPING_DEFAULTS, shippingFeeCny } from "@/lib/shipping-fee";

type Props = {
  initialPricePerKg: string;
  initialDeliveryFee: string;
  /** When true, bind to named inputs inside the same form via form attribute + name. */
  priceName?: string;
  deliveryName?: string;
  formId?: string;
  inputClassName: string;
};

export function ShippingFeeEditableFields({
  initialPricePerKg,
  initialDeliveryFee,
  priceName = "pricePerKg",
  deliveryName = "deliveryFee",
  formId,
  inputClassName,
}: Props) {
  const [pricePerKg, setPricePerKg] = useState(initialPricePerKg);
  const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);

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
          form={formId}
          name={priceName}
          type="number"
          min="0"
          step="0.01"
          required
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          className={inputClassName}
        />
      </td>
      <td className="px-4 py-3 align-top">
        <input
          form={formId}
          name={deliveryName}
          type="number"
          min="0"
          step="0.01"
          required
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          className={inputClassName}
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
