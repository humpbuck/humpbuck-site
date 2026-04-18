import type { ValidatedLine } from "@/lib/order-lines";

export function parseOrderItemsJson(json: string): ValidatedLine[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is ValidatedLine =>
        x != null &&
        typeof x === "object" &&
        typeof (x as ValidatedLine).slug === "string" &&
        typeof (x as ValidatedLine).qty === "number",
    );
  } catch {
    return [];
  }
}
