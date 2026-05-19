"use client";

import Script from "next/script";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TurnstileScriptContextValue = {
  siteKey: string;
  ready: boolean;
  markReady: () => void;
};

const TurnstileScriptContext = createContext<TurnstileScriptContextValue>({
  siteKey: "",
  ready: false,
  markReady: () => {},
});

export function useTurnstileScriptContext() {
  return useContext(TurnstileScriptContext);
}

/** One shared Turnstile script + context for contact modal and wholesale form. */
export function TurnstileScriptProvider({ children }: { children: ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!siteKey) return;
    if (ready) return;
    const api = window.turnstile;
    if (!api) return;
    if (typeof api.ready === "function") {
      api.ready(markReady);
    } else {
      markReady();
    }
  }, [siteKey, ready, markReady]);

  useEffect(() => {
    if (!siteKey) return;
    if (ready) return;
    const timer = window.setTimeout(() => {
      if (window.turnstile) markReady();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [siteKey, ready, markReady]);

  const value = useMemo(
    () => ({ siteKey, ready, markReady }),
    [siteKey, ready, markReady],
  );

  return (
    <TurnstileScriptContext.Provider value={value}>
      {siteKey ? (
        <Script
          id="cf-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onLoad={markReady}
        />
      ) : null}
      {children}
    </TurnstileScriptContext.Provider>
  );
}
