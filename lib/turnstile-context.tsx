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

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  ready?: (cb: () => void) => void;
};

function getTurnstileApi(): TurnstileApi | undefined {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

/** Resolves when `window.turnstile` is callable (not only when the script tag loaded). */
function whenTurnstileApiReady(): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => resolve();
    const api = getTurnstileApi();
    if (api) {
      if (typeof api.ready === "function") api.ready(finish);
      else finish();
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(() => {
      const live = getTurnstileApi();
      if (live) {
        window.clearInterval(timer);
        if (typeof live.ready === "function") live.ready(finish);
        else finish();
      } else if (attempts++ > 120) {
        window.clearInterval(timer);
        finish();
      }
    }, 50);
  });
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getTurnstileApi()) return whenTurnstileApiReady();

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const finish = () => whenTurnstileApiReady().then(resolve).catch(reject);
    const fail = () => {
      scriptLoadPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("error", () => fail(), { once: true });
      void whenTurnstileApiReady().then(resolve).catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => finish();
    script.onerror = () => fail();
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/** Warm the script after idle so modals open faster (does not wrap the layout tree). */
export function preloadTurnstileScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (!siteKey) return;
  void loadTurnstileScript().catch(() => {});
}

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

/** Load Turnstile only under forms that need it (contact modal, wholesale). */
export function TurnstileScriptProvider({ children }: { children: ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    setReady(false);

    loadTurnstileScript()
      .then(() => {
        if (!cancelled) markReady();
      })
      .catch(() => {
        /* form shows mountError / verifyUnavailable */
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey, markReady]);

  const value = useMemo(
    () => ({ siteKey, ready, markReady }),
    [siteKey, ready, markReady],
  );

  return (
    <TurnstileScriptContext.Provider value={value}>
      {children}
    </TurnstileScriptContext.Provider>
  );
}
