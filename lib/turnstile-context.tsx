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

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const win = window as Window & { turnstile?: { ready?: (cb: () => void) => void } };
  if (win.turnstile) return Promise.resolve();

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SRC}"]`,
    );
    if (existing) {
      if (win.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/** Load Turnstile only under forms that need it (contact modal, wholesale). */
export function TurnstileScriptProvider({ children }: { children: ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const api = (
          window as Window & { turnstile?: { ready?: (cb: () => void) => void } }
        ).turnstile;
        if (api && typeof api.ready === "function") {
          api.ready(markReady);
        } else {
          markReady();
        }
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
