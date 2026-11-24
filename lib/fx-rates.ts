import { unstable_cache } from "next/cache";
import {
  DISPLAY_CURRENCY_CODES,
  type DisplayCurrencyCode,
} from "@/lib/display-currency";

const FX_REVALIDATE_SECONDS = 86_400;
const FX_REVALIDATE_MS = FX_REVALIDATE_SECONDS * 1000;

export type UsdFxRates = Record<DisplayCurrencyCode, number>;

/** Frankfurter (ECB) omits some display currencies, e.g. AED and SAR. */
const FX_FALLBACK_URL = "https://open.er-api.com/v6/latest/USD";

async function fetchFallbackUsdRates(
  codes: DisplayCurrencyCode[],
): Promise<Partial<Record<DisplayCurrencyCode, number>>> {
  if (codes.length === 0) return {};
  const res = await fetch(FX_FALLBACK_URL, { next: { revalidate: FX_REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new Error(`FX fallback rates failed: ${res.status}`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  const out: Partial<Record<DisplayCurrencyCode, number>> = {};
  for (const code of codes) {
    const rate = data.rates?.[code];
    if (typeof rate === "number" && rate > 0) {
      out[code] = rate;
    }
  }
  return out;
}

async function fetchFrankfurterRates(): Promise<UsdFxRates> {
  const targets = DISPLAY_CURRENCY_CODES.filter((code) => code !== "USD");
  const url = `https://api.frankfurter.app/latest?from=USD&to=${targets.join(",")}`;
  const res = await fetch(url, { next: { revalidate: FX_REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new Error(`Frankfurter rates failed: ${res.status}`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates = { USD: 1 } as UsdFxRates;
  const missing: DisplayCurrencyCode[] = [];
  for (const code of targets) {
    const rate = data.rates?.[code];
    if (typeof rate === "number" && rate > 0) {
      rates[code] = rate;
    } else {
      missing.push(code);
    }
  }
  if (missing.length > 0) {
    try {
      const fallback = await fetchFallbackUsdRates(missing);
      for (const code of missing) {
        const rate = fallback[code];
        if (typeof rate === "number" && rate > 0) {
          rates[code] = rate;
        }
      }
    } catch {
      // Keep Frankfurter rates when the supplemental source is unavailable.
    }
  }
  return rates;
}

const loadUsdFxRates = unstable_cache(
  fetchFrankfurterRates,
  ["humpbuck-usd-fx-rates"],
  { revalidate: FX_REVALIDATE_SECONDS },
);

let isolateRates: { value: UsdFxRates; fetchedAt: number } | null = null;

/** USD → display currency multipliers; isolate + server cache (~24h). */
export async function getUsdFxRates(): Promise<UsdFxRates> {
  const now = Date.now();
  if (isolateRates && now - isolateRates.fetchedAt < FX_REVALIDATE_MS) {
    return isolateRates.value;
  }
  const value = await loadUsdFxRates();
  isolateRates = { value, fetchedAt: now };
  return value;
}
