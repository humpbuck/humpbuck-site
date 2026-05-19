"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      ready?: (cb: () => void) => void;
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

function clearTurnstileContainer(el: HTMLElement | null) {
  if (!el) return;
  el.replaceChildren();
}

/**
 * Waits for `window.turnstile` from the site-wide `TurnstileSiteScript`.
 * Times out with an error message when the SDK never becomes ready.
 */
export function useTurnstileScriptLoaded(
  enabled: boolean,
  errScriptLoad: string,
): { loaded: boolean; scriptError: string | null } {
  const [loaded, setLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      setScriptError(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tryMark = () => {
      const api = window.turnstile;
      if (!api?.render) return false;
      if (typeof api.ready === "function") {
        api.ready(() => {
          if (!cancelled) {
            setLoaded(true);
            setScriptError(null);
          }
        });
      } else if (!cancelled) {
        setLoaded(true);
        setScriptError(null);
      }
      return true;
    };

    if (tryMark()) {
      return () => {
        cancelled = true;
      };
    }

    const deadline = window.setTimeout(() => {
      if (!cancelled && !window.turnstile?.render) {
        setScriptError(errScriptLoad);
      }
    }, 25_000);

    let attempts = 0;
    timer = setInterval(() => {
      if (cancelled) return;
      if (tryMark() || attempts++ > 500) {
        if (timer) clearInterval(timer);
        if (!cancelled && attempts > 500 && !window.turnstile?.render) {
          setScriptError(errScriptLoad);
        }
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(deadline);
      if (timer) clearInterval(timer);
    };
  }, [enabled, errScriptLoad]);

  return { loaded, scriptError };
}

/**
 * @param mountKey Bump when the form is shown again (e.g. each email modal open).
 */
export function useTurnstileWidget(siteKey: string, mountKey = 0, errScriptLoad = "") {
  const canRender = Boolean(siteKey.trim());
  const { loaded: turnstileScriptLoaded, scriptError } = useTurnstileScriptLoaded(
    canRender,
    errScriptLoad,
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    widgetIdRef.current = null;
    setTurnstileToken("");
    clearTurnstileContainer(widgetRef.current);
  }, [mountKey, siteKey]);

  useEffect(() => {
    if (!canRender || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile?.render) {
      return;
    }
    if (widgetIdRef.current) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !widgetRef.current || !window.turnstile?.render || widgetIdRef.current) {
        return;
      }
      clearTurnstileContainer(widgetRef.current);
      try {
        const rendered = window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (!cancelled) setTurnstileToken(token);
          },
          "expired-callback": () => {
            if (!cancelled) setTurnstileToken("");
          },
          "error-callback": () => {
            if (!cancelled) setTurnstileToken("");
          },
        });
        widgetIdRef.current = rendered;
      } catch {
        /* Avoid taking down the route if Cloudflare is mid-teardown */
      }
    };

    if (typeof window.turnstile.ready === "function") {
      window.turnstile.ready(mount);
    } else {
      mount();
    }

    return () => {
      cancelled = true;
    };
  }, [canRender, siteKey, turnstileScriptLoaded, mountKey]);

  useEffect(() => {
    return () => {
      /** Never call turnstile.remove() — breaks client navigation to /wholesale. */
      widgetIdRef.current = null;
      clearTurnstileContainer(widgetRef.current);
    };
  }, []);

  const resetWidget = useCallback(() => {
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      try {
        window.turnstile.reset(id);
      } catch {
        widgetIdRef.current = null;
        clearTurnstileContainer(widgetRef.current);
      }
    } else {
      widgetIdRef.current = null;
      clearTurnstileContainer(widgetRef.current);
    }
    setTurnstileToken("");
  }, []);

  return {
    canRender,
    widgetRef,
    turnstileToken,
    scriptError,
    resetWidget,
  };
}
