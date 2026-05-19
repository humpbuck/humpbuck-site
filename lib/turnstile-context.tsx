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

export const TURNSTILE_SCRIPT_BASE =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

const TURNSTILE_ONLOAD_CALLBACK = "__humpbuckTurnstileSdkOnload";

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

function removeStaleTurnstileScripts() {
  if (typeof document === "undefined" || getTurnstileApi()) return;
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="turnstile/v0/api.js"]')
    .forEach((el) => el.remove());
}

/** Resolves when `window.turnstile.render` is available. */
function whenTurnstileApiReady(timeoutMs = 15_000): Promise<void> {
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
      } else if (attempts++ > 200) {
        window.clearInterval(timer);
        window.clearTimeout(deadline);
        reject(new Error("Turnstile API timeout"));
      }
    }, 50);
  });
}

let scriptLoadPromise: Promise<void> | null = null;

/** Clear loader state after a failed load so the user can retry. */
export function resetTurnstileScriptLoader() {
  scriptLoadPromise = null;
  removeStaleTurnstileScripts();
}

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getTurnstileApi()?.render) return whenTurnstileApiReady();

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const settle = () => {
      whenTurnstileApiReady()
        .then(resolve)
        .catch((err) => {
          scriptLoadPromise = null;
          removeStaleTurnstileScripts();
          reject(err);
        });
    };

    const fail = () => {
      scriptLoadPromise = null;
      removeStaleTurnstileScripts();
      reject(new Error("Turnstile script failed to load"));
    };

    removeStaleTurnstileScripts();

    (window as unknown as Record<string, () => void>)[TURNSTILE_ONLOAD_CALLBACK] =
      () => settle();

    const src = `${TURNSTILE_SCRIPT_BASE}?render=explicit&onload=${TURNSTILE_ONLOAD_CALLBACK}`;
    const script = document.createElement("script");
    script.id = "cf-turnstile-sdk";
    script.src = src;
    script.defer = true;
    script.onerror = () => fail();
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/** Optional warm-up; failures are ignored and stale tags are cleared on the next form load. */
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
