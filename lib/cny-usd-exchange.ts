import { unstable_cache } from "next/cache";

/** Used when the live rate API is unavailable. */
export const FALLBACK_CNY_PER_USD = 6.8;

export type CnyUsdExchangeRate = {
  /** How many CNY for 1 USD (e.g. 7.24). */
  cnyPerUsd: number;
  /** Inverse: USD per 1 CNY. */
  usdPerCny: number;
  fetchedAt: string;
  source: "frankfurter" | "fallback";
};

async function fetchFrankfurterCnyPerUsd(): Promise<number | null> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=CNY", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { CNY?: number } };
    const rate = data.rates?.CNY;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
    return Math.round(rate * 10000) / 10000;
  } catch {
    return null;
  }
}

const getCachedExchangeRate = unstable_cache(
  async (): Promise<CnyUsdExchangeRate> => {
    const live = await fetchFrankfurterCnyPerUsd();
    const cnyPerUsd = live ?? FALLBACK_CNY_PER_USD;
    return {
      cnyPerUsd,
      usdPerCny: 1 / cnyPerUsd,
      fetchedAt: new Date().toISOString(),
      source: live ? "frankfurter" : "fallback",
    };
  },
  ["cny-usd-exchange-rate"],
  { revalidate: 3600, tags: ["cny-usd-exchange"] },
);

/** Cached ~1 hour — not called on every checkout keystroke. */
export async function getCnyUsdExchangeRate(): Promise<CnyUsdExchangeRate> {
  return getCachedExchangeRate();
}

export function convertCnyCentsToUsdCents(cnyCents: number, cnyPerUsd: number): number {
  if (!Number.isFinite(cnyCents) || cnyPerUsd <= 0) return 0;
  return Math.max(0, Math.round((cnyCents / cnyPerUsd / 100) * 100));
}

export function formatCny(cnyCents: number): string {
  return `¥${(cnyCents / 100).toFixed(2)}`;
}

export function formatExchangeRateSummary(rate: CnyUsdExchangeRate): string {
  return `1 USD = ¥${rate.cnyPerUsd.toFixed(4)}`;
}
