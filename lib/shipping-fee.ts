/** Fallback when a product has no merchant weight. Order weight is per-SKU kg × qty. */
export const WATCH_WEIGHT_KG = 0.3;
export const WATCH_WEIGHT_G = 300;

export const SHIPPING_DEFAULTS = {
  pricePerKg: 150,
  watchWeightKg: WATCH_WEIGHT_KG,
  deliveryFee: 40,
  dutyPercent: 4,
  deliveryTime: "7-14 Business Days",
} as const;

export function roundCny(value: number) {
  return Math.round(value * 100) / 100;
}

/** One SKU weight in kg. Invalid / missing values fall back to default watch weight. */
export function normalizeProductWeightKg(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return WATCH_WEIGHT_KG;
  return Math.round(n * 10000) / 10000;
}

export function gramsToKg(value: unknown): number {
  const grams = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(grams) || grams <= 0) return WATCH_WEIGHT_KG;
  return normalizeProductWeightKg(grams / 1000);
}

export function formatProductWeightGrams(kg: unknown): string {
  const grams = normalizeProductWeightKg(kg) * 1000;
  const rounded = Math.round(grams * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function shippingWeightKgFromLines(
  lines: readonly { weightKg?: number | null; quantity: number }[],
): number {
  return lines.reduce((sum, line) => {
    const qty = Number.isFinite(line.quantity) && line.quantity > 0 ? line.quantity : 0;
    return sum + normalizeProductWeightKg(line.weightKg) * qty;
  }, 0);
}

/** Shipping CNY = ¥/kg × total weight kg + 派送费 (delivery fee once per shipment). */
export function shippingFeeCny(
  rate: { pricePerKg: number; deliveryFee: number },
  weightKg: number,
) {
  const kg = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  return roundCny(rate.pricePerKg * kg + rate.deliveryFee);
}

/**
 * Tax/duty CNY — same as WatchSourceGo wholesale:
 * ((goodsCny + shippingCny) * dutyPercent) / 100
 */
export function dutyCny(goodsCny: number, shippingCny: number, dutyPercent: number) {
  const goods = Number.isFinite(goodsCny) && goodsCny > 0 ? goodsCny : 0;
  const shipping = Number.isFinite(shippingCny) && shippingCny > 0 ? shippingCny : 0;
  const percent = Number.isFinite(dutyPercent) && dutyPercent > 0 ? dutyPercent : 0;
  return roundCny(((goods + shipping) * percent) / 100);
}

export function parseNonNegativeNumber(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
