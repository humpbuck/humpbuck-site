import { unstable_cache } from "next/cache";
import {
  DISPLAY_CURRENCY_CODES,
  type DisplayCurrencyCode,
} from "@/lib/display-currency";

export type UsdFxRates = Record<DisplayCurrencyCode, number>;

async function fetchFrankfurterRates(): Promise<UsdFxRates> {
  const targets = DISPLAY_CURRENCY_CODES.filter((code) => code !== "USD");
  const url = `https://api.frankfurter.app/latest?from=USD&to=${targets.join(",")}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`Frankfurter rates failed: ${res.status}`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates = { USD: 1 } as UsdFxRates;
  for (const code of targets) {
    const rate = data.rates?.[code];
    if (typeof rate === "number" && rate > 0) {
      rates[code] = rate;
    }
  }
  return rates;
}

/** USD → display currency multipliers; cached server-side (~24h). */
export const getUsdFxRates = unstable_cache(
  fetchFrankfurterRates,
  ["humpbuck-usd-fx-rates"],
  { revalidate: 86400 },
);
