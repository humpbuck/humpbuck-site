"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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

/** Waits for the shared layout script (`TurnstileSdkScript`) to expose `window.turnstile`. */
function useTurnstileScriptLoaded(enabled: boolean): boolean {
  const [loaded, setLoaded] = useState(false);

  const markLoaded = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tryMark = () => {
      const api = window.turnstile;
      if (!api) return false;
      if (typeof api.ready === "function") {
        api.ready(() => {
          if (!cancelled) markLoaded();
        });
      } else {
        markLoaded();
      }
      return true;
    };

    if (tryMark()) {
      return () => {
        cancelled = true;
      };
    }

    let attempts = 0;
    timer = setInterval(() => {
      if (cancelled) return;
      if (tryMark() || attempts++ > 200) {
        if (timer) clearInterval(timer);
      }
    }, 50);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled, markLoaded]);

  return loaded;
}

/**
 * @param mountKey Bump when the form is shown again (e.g. each email modal open) so Turnstile remounts cleanly.
 */
export function useTurnstileWidget(siteKey: string, mountKey = 0) {
  const canRender = Boolean(siteKey.trim());
  const turnstileScriptLoaded = useTurnstileScriptLoaded(canRender);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    widgetIdRef.current = widgetId;
  }, [widgetId]);

  useEffect(() => {
    widgetIdRef.current = null;
    setWidgetId(null);
    setTurnstileToken("");
    clearTurnstileContainer(widgetRef.current);
  }, [mountKey]);

  useLayoutEffect(() => {
    if (!canRender || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile) {
      return;
    }
    if (widgetIdRef.current) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !widgetRef.current || !window.turnstile || widgetIdRef.current) {
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
        setWidgetId(rendered);
      } catch {
        /* keep navigation alive if the SDK is between widgets */
      }
    };

    try {
      if (typeof window.turnstile.ready === "function") {
        window.turnstile.ready(mount);
      } else {
        mount();
      }
    } catch {
      mount();
    }

    return () => {
      cancelled = true;
    };
  }, [canRender, siteKey, turnstileScriptLoaded, mountKey]);

  useEffect(() => {
    return () => {
      /** Never call turnstile.remove() here — it breaks the next client route. */
      widgetIdRef.current = null;
      clearTurnstileContainer(widgetRef.current);
    };
  }, []);

  function resetWidget() {
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      try {
        window.turnstile.reset(id);
      } catch {
        widgetIdRef.current = null;
        setWidgetId(null);
        clearTurnstileContainer(widgetRef.current);
      }
    }
    setTurnstileToken("");
  }

  return {
    canRender,
    widgetRef,
    turnstileToken,
    turnstileScriptLoaded,
    resetWidget,
  };
}
