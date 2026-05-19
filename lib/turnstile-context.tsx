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

export const TURNSTILE_SCRIPT_SRC = `${TURNSTILE_SCRIPT_BASE}?render=explicit`;

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

/** Drop duplicate script tags; keep the layout `TurnstileSdkScript` tag. */
function removeStaleTurnstileScripts() {
  if (typeof document === "undefined" || getTurnstileApi()?.render) return;
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="turnstile/v0/api.js"]')
    .forEach((el) => {
      if (el.id === "cf-turnstile-sdk") return;
      el.remove();
    });
}

/** Resolves when `window.turnstile.render` is available. */
export function waitForTurnstileApi(timeoutMs = 20_000): Promise<void> {
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
let layoutScriptWait: Promise<void> | null = null;
let layoutScriptFailed = false;

/** Called from layout `<Script onLoad>` when Cloudflare SDK is ready. */
export function markTurnstileSdkLoaded() {
  layoutScriptFailed = false;
  void waitForTurnstileApi(5_000).catch(() => {});
}

/** Called from layout `<Script onError>` so forms can fall back without a long wait. */
export function markTurnstileSdkFailed() {
  layoutScriptFailed = true;
  layoutScriptWait = null;
}

/** Clear fallback loader state after a failed load so the user can retry. */
export function resetTurnstileScriptLoader() {
  scriptLoadPromise = null;
  layoutScriptWait = null;
  layoutScriptFailed = false;
  removeStaleTurnstileScripts();
}

function waitForLayoutScript(timeoutMs = 8_000): Promise<void> {
  if (layoutScriptFailed) {
    return Promise.reject(new Error("Turnstile layout script failed"));
  }
  if (getTurnstileApi()?.render) return waitForTurnstileApi(2_000);

  if (!layoutScriptWait) {
    layoutScriptWait = waitForTurnstileApi(timeoutMs).finally(() => {
      layoutScriptWait = null;
    });
  }
  return layoutScriptWait;
}

function injectTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const settle = () => {
      waitForTurnstileApi()
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
    script.id = "cf-turnstile-sdk-fallback";
    script.src = src;
    script.defer = true;
    script.onerror = () => fail();
    document.head.appendChild(script);
  });
}

/**
 * Wait for layout `TurnstileSdkScript` (onLoad), then fall back to a one-off inject.
 */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getTurnstileApi()?.render) return waitForTurnstileApi(2_000);

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = (async () => {
    if (document.getElementById("cf-turnstile-sdk")) {
      try {
        await waitForLayoutScript(8_000);
        return;
      } catch {
        /* layout script present but API never became ready — try fallback */
      }
    }
    await injectTurnstileScript();
  })().finally(() => {
    scriptLoadPromise = null;
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

/** @deprecated Prefer layout `TurnstileSdkScript` + `TurnstileWidget`. */
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
