/** Deterministic helpers so `npm run db:seed-reviews` produces identical rows on every machine. */

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deterministicShuffle<T>(arr: readonly T[], seed: string): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = hashString(`${seed}:${i}`) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Fixed upper bound keeps GitHub / CI / production seeds aligned (through 2026-06-21). */
const REVIEW_DATE_END = new Date("2026-06-21T23:59:59.000Z").getTime();
const REVIEW_DATE_START = new Date("2026-01-01T08:00:00.000Z").getTime();

export function deterministicReviewDate(productSlug: string, index: number): Date {
  const span = Math.max(REVIEW_DATE_END - REVIEW_DATE_START, 1);
  const offset = hashString(`${productSlug}:date:${index}`) % span;
  return new Date(REVIEW_DATE_START + offset);
}

export function deterministicReviewerOffset(productSlug: string): number {
  return hashString(`${productSlug}:reviewer-offset`) % 1000;
}

/** Per-product review count in [min, max], stable across re-runs for the same slug. */
export function deterministicReviewCount(
  productSlug: string,
  min = 10,
  max = 25,
): number {
  const span = max - min + 1;
  return min + (hashString(`${productSlug}:count`) % span);
}
