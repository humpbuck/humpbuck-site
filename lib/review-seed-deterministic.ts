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

/** Fixed bounds — bump REVIEW_DATE_END when re-seeding so CI/production stay aligned. */
const REVIEW_DATE_START = new Date("2025-01-01T00:00:00.000Z");
const REVIEW_DATE_END = new Date("2026-06-30T23:59:59.000Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function reviewDateDayCount(): number {
  const start = REVIEW_DATE_START.getTime();
  const end = REVIEW_DATE_END.getTime();
  return Math.max(Math.floor((end - start) / MS_PER_DAY) + 1, 1);
}

/** Spread each review across 2025-01 … 2026-06 (day + time-of-day). Uses day index, not ms offset — hash is 32-bit and ms span overflows that. */
export function deterministicReviewDate(productSlug: string, index: number): Date {
  const dayIndex = hashString(`${productSlug}:date:${index}`) % reviewDateDayCount();
  const timeOfDayMs = hashString(`${productSlug}:time:${index}`) % MS_PER_DAY;
  return new Date(REVIEW_DATE_START.getTime() + dayIndex * MS_PER_DAY + timeOfDayMs);
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

/** Mostly 5 stars (~82%); remainder 4 stars — stable per product + index. */
export function deterministicRating(productSlug: string, index: number): 4 | 5 {
  return hashString(`${productSlug}:rating:${index}`) % 100 < 18 ? 4 : 5;
}
