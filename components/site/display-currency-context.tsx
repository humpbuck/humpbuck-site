"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import {
  DISPLAY_FX_STORAGE_KEY,
  DISPLAY_FX_TTL_MS,
  formatConvertedAmount,
  inferDisplayCurrencyFromLocale,
  readDisplayCurrencyCookie,
  writeDisplayCurrencyCookie,
  type DisplayCurrencyCode,
} from "@/lib/display-currency";
import type { UsdFxRates } from "@/lib/fx-rates";

type DisplayCurrencyContextValue = {
  currency: DisplayCurrencyCode;
  setCurrency: (code: DisplayCurrencyCode) => void;
  ratesReady: boolean;
  formatReference: (usd: number) => string | null;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

function readStoredRates(): UsdFxRates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISPLAY_FX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rates?: UsdFxRates; fetchedAt?: number };
    if (!parsed?.rates || typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt >= DISPLAY_FX_TTL_MS) return null;
    if (typeof parsed.rates.USD !== "number") return null;
    return parsed.rates;
  } catch {
    return null;
  }
}

function writeStoredRates(rates: UsdFxRates) {
  try {
    window.localStorage.setItem(
      DISPLAY_FX_STORAGE_KEY,
      JSON.stringify({ rates, fetchedAt: Date.now() }),
    );
  } catch {
    /* private mode / quota */
  }
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [currency, setCurrencyState] = useState<DisplayCurrencyCode>(() =>
    inferDisplayCurrencyFromLocale(locale),
  );
  const [rates, setRates] = useState<UsdFxRates | null>(null);

  useEffect(() => {
    const fromCookie = readDisplayCurrencyCookie();
    if (fromCookie) {
      setCurrencyState(fromCookie);
    } else {
      setCurrencyState(inferDisplayCurrencyFromLocale(locale));
    }
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredRates();
    if (stored) {
      setRates(stored);
      return;
    }
    // Cookie may not have been applied yet; USD needs no Worker FX request.
    const cookieCurrency = readDisplayCurrencyCookie();
    const effective = cookieCurrency ?? currency;
    if (effective === "USD") return;

    void fetch("/api/display-fx", { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { rates?: UsdFxRates };
      })
      .then((data) => {
        if (cancelled || !data?.rates) return;
        writeStoredRates(data.rates);
        setRates(data.rates);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const setCurrency = useCallback((code: DisplayCurrencyCode) => {
    setCurrencyState(code);
    writeDisplayCurrencyCookie(code);
  }, []);

  const ratesReady = rates != null && typeof rates[currency] === "number";

  const formatReference = useCallback(
    (usd: number): string | null => {
      if (currency === "USD" || !rates) return null;
      const rate = rates[currency];
      if (typeof rate !== "number" || rate <= 0) return null;
      return formatConvertedAmount(usd, currency, rate);
    },
    [currency, rates],
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      ratesReady,
      formatReference,
    }),
    [currency, setCurrency, ratesReady, formatReference],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error("useDisplayCurrency must be used within DisplayCurrencyProvider");
  }
  return ctx;
}

export function useDisplayCurrencyOptional(): DisplayCurrencyContextValue | null {
  return useContext(DisplayCurrencyContext);
}
