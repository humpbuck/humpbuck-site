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

/** Fixed bounds — bump when re-seeding so CI/production stay aligned. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Months to spread seed review dates across (UTC).
 * September stops at “today” so timestamps stay in the past.
 */
const REVIEW_DATE_MONTHS: ReadonlyArray<{ year: number; month: number; lastDay: number }> = [
  { year: 2026, month: 6, lastDay: 30 },
  { year: 2026, month: 7, lastDay: 31 },
  { year: 2026, month: 8, lastDay: 31 },
  { year: 2026, month: 9, lastDay: 3 },
];

/** Spread each review across Jun–Sep 2026 with roughly even months, then day + time-of-day. */
export function deterministicReviewDate(productSlug: string, index: number): Date {
  const monthMeta =
    REVIEW_DATE_MONTHS[hashString(`${productSlug}:month:${index}`) % REVIEW_DATE_MONTHS.length]!;
  const day = 1 + (hashString(`${productSlug}:day:${index}`) % monthMeta.lastDay);
  const timeOfDayMs = hashString(`${productSlug}:time:${index}`) % MS_PER_DAY;
  const iso = `${monthMeta.year}-${String(monthMeta.month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`;
  return new Date(new Date(iso).getTime() + timeOfDayMs);
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
