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
  render?: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
    },
  ) => string;
};

function getTurnstileApi(): TurnstileApi | undefined {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

/** Resolves when `window.turnstile.render` is available. */
function whenTurnstileApiReady(timeoutMs = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      if (getTurnstileApi()?.render) resolve();
      else reject(new Error("Turnstile API missing"));
    };

    const api = getTurnstileApi();
    if (api?.render) {
      if (typeof api.ready === "function") api.ready(finish);
      else finish();
      return;
    }

    const deadline = window.setTimeout(() => {
      window.clearInterval(timer);
      reject(new Error("Turnstile API timeout"));
    }, timeoutMs);

    let attempts = 0;
    const timer = window.setInterval(() => {
      const live = getTurnstileApi();
      if (live?.render) {
        window.clearInterval(timer);
        window.clearTimeout(deadline);
        if (typeof live.ready === "function") live.ready(finish);
        else finish();
      } else if (attempts++ > 400) {
        window.clearInterval(timer);
        window.clearTimeout(deadline);
        reject(new Error("Turnstile API timeout"));
      }
    }, 50);
  });
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getTurnstileApi()?.render) return whenTurnstileApiReady(5_000);

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

/** Warm the script after idle so modals open faster. */
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

/** @deprecated Prefer `TurnstileWidget` in forms. */
export function TurnstileScriptProvider({ children }: { children: ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    setReady(false);

    void loadTurnstileScript().then(() => {
      if (!cancelled) markReady();
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
