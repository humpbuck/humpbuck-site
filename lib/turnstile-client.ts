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

  useEffect(() => {
    if (!canRender || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile) {
      return;
    }
    if (widgetId) return;
    const rendered = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    setWidgetId(rendered);
  }, [canRender, siteKey, turnstileScriptLoaded, widgetId]);

  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* ignore */
        }
      }
    };
  }, [widgetId]);

  function resetWidget() {
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
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
