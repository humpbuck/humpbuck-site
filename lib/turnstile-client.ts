"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_READY_EVENT = "humpbuck-turnstile-ready";

declare global {
  interface Window {
    __humpbuckTurnstileReady?: boolean;
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

function safeResetWidget(widgetId: string | null) {
  if (!widgetId || !window.turnstile) return;
  try {
    window.turnstile.reset(widgetId);
  } catch {
    /* shared SDK may be between widgets */
  }
}

/** Marks the Cloudflare SDK as ready (called from `TurnstileSiteScript` onLoad). */
export function markTurnstileSdkReady() {
  if (typeof window === "undefined") return;
  window.__humpbuckTurnstileReady = true;
  window.dispatchEvent(new Event(TURNSTILE_READY_EVENT));
}

/**
 * Tracks Turnstile script readiness from the site-wide script tag.
 * `markScriptLoaded` can also be passed to a per-form `<Script onLoad>` if needed.
 */
export function useTurnstileScriptLoaded(enabled: boolean): [boolean, () => void] {
  const [loaded, setLoaded] = useState(false);
  const markLoaded = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      return;
    }

    if (typeof window === "undefined") return;

    const tryMark = () => {
      const api = window.turnstile;
      if (!api?.render) return false;
      if (typeof api.ready === "function") {
        api.ready(markLoaded);
      } else {
        markLoaded();
      }
      return true;
    };

    if (window.__humpbuckTurnstileReady || tryMark()) {
      return;
    }

    const onReady = () => {
      tryMark();
    };
    window.addEventListener(TURNSTILE_READY_EVENT, onReady);

    let attempts = 0;
    const timer = window.setInterval(() => {
      if (tryMark() || attempts++ > 400) {
        window.clearInterval(timer);
      }
    }, 50);

    return () => {
      window.removeEventListener(TURNSTILE_READY_EVENT, onReady);
      window.clearInterval(timer);
    };
  }, [enabled, markLoaded]);

  return [loaded, markLoaded];
}

/**
 * @param mountKey Bump when the form is shown again (e.g. each email modal open).
 */
export function useTurnstileWidget(siteKey: string, mountKey = 0) {
  const canRender = Boolean(siteKey.trim());
  const [turnstileScriptLoaded, markScriptLoaded] = useTurnstileScriptLoaded(canRender);
  const [turnstileToken, setTurnstileToken] = useState("");
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    widgetIdRef.current = null;
    setTurnstileToken("");
    clearTurnstileContainer(widgetRef.current);
  }, [mountKey, siteKey]);

  useLayoutEffect(() => {
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
        widgetIdRef.current = null;
        clearTurnstileContainer(widgetRef.current);
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
      safeResetWidget(widgetIdRef.current);
      widgetIdRef.current = null;
      clearTurnstileContainer(widgetRef.current);
    };
  }, [canRender, siteKey, turnstileScriptLoaded, mountKey]);

  const resetWidget = useCallback(() => {
    safeResetWidget(widgetIdRef.current);
    widgetIdRef.current = null;
    clearTurnstileContainer(widgetRef.current);
    setTurnstileToken("");
  }, []);

  return {
    canRender,
    widgetRef,
    turnstileToken,
    turnstileScriptLoaded,
    markScriptLoaded,
    resetWidget,
  };
}
