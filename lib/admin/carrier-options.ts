/**
 * Canonical carrier strings stored on Order.carrier (admin fulfillment dropdown).
 * Labels are shown in the UI; values are persisted and used by tracking-url.ts.
 */
export const FULFILLMENT_CARRIER_OPTIONS: { value: string; label: string }[] = [
  { value: "DHL", label: "DHL Express" },
  { value: "DHL eCommerce", label: "DHL eCommerce" },
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "USPS", label: "USPS" },
  { value: "SF Express", label: "SF Express" },
  { value: "EMS / China Post", label: "EMS / China Post" },
  { value: "Cainiao International", label: "Cainiao International" },
  { value: "Yanwen", label: "Yanwen" },
  { value: "4PX", label: "4PX" },
  { value: "YunExpress", label: "YunExpress" },
  { value: "__custom__", label: "Other…" },
];

const OPTION_VALUES = new Set(
  FULFILLMENT_CARRIER_OPTIONS.map((o) => o.value).filter((v) => v && v !== "__custom__"),
);

/** Maps saved carrier string → select value + optional custom text for "Other". */
export function parseCarrierForSelect(initial: string | null): {
  select: string;
  custom: string;
} {
  const raw = initial?.trim();
  if (!raw) return { select: "", custom: "" };
  if (OPTION_VALUES.has(raw)) return { select: raw, custom: "" };
  const lower = raw.toLowerCase();
  for (const v of OPTION_VALUES) {
    if (v.toLowerCase() === lower) return { select: v, custom: "" };
  }
  return { select: "__custom__", custom: raw };
}
