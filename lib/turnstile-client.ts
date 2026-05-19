"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
 * Tracks Turnstile script readiness. Handles the case where `next/script` onLoad
 * never runs because the script was already injected by another form on the page.
 */
export function useTurnstileScriptLoaded(enabled: boolean): [boolean, () => void] {
  const [loaded, setLoaded] = useState(false);
  const markLoaded = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!enabled || loaded) return;
    if (typeof window === "undefined") return;
    const api = window.turnstile;
    if (!api) return;
    if (typeof api.ready === "function") {
      api.ready(markLoaded);
    } else {
      markLoaded();
    }
  }, [enabled, loaded, markLoaded]);

  return [loaded, markLoaded];
}

export function useTurnstileWidget(siteKey: string) {
  const canRender = Boolean(siteKey.trim());
  const [turnstileScriptLoaded, markScriptLoaded] = useTurnstileScriptLoaded(canRender);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    widgetIdRef.current = widgetId;
  }, [widgetId]);

  useEffect(() => {
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
  }, [canRender, siteKey, turnstileScriptLoaded, widgetId]);

  useEffect(() => {
    return () => {
      /**
       * Do not call turnstile.remove() here — it breaks the shared SDK for the
       * next client navigation (e.g. contact modal → /wholesale).
       */
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
    markScriptLoaded,
    resetWidget,
  };
}
