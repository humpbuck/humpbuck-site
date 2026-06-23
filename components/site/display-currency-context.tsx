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
    void fetch("/api/display-fx")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { rates?: UsdFxRates };
      })
      .then((data) => {
        if (!cancelled && data?.rates) {
          setRates(data.rates);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
