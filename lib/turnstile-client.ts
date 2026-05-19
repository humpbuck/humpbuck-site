"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTurnstileSlot, type TurnstileSlot } from "@/lib/turnstile-slot";

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

function injectTurnstileScript() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cf-turnstile-sdk")) return;

  const script = document.createElement("script");
  script.id = "cf-turnstile-sdk";
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.onload = () => markTurnstileSdkReady();
  script.onerror = () => {
    window.dispatchEvent(new Event(TURNSTILE_READY_EVENT));
  };
  document.head.appendChild(script);
}

/**
 * Tracks Turnstile script readiness from the site-wide script tag (or injected fallback).
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

    let cancelled = false;

    const tryMark = () => {
      if (cancelled) return false;
      const api = window.turnstile;
      if (!api?.render) return false;
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

    injectTurnstileScript();

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
      cancelled = true;
      window.removeEventListener(TURNSTILE_READY_EVENT, onReady);
      window.clearInterval(timer);
    };
  }, [enabled, markLoaded]);

  return [loaded, markLoaded];
}

function containerIsVisible(el: HTMLElement | null): boolean {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * @param mountKey Bump when the form is shown again (e.g. each email modal open).
 * @param slot Coordinates with the other form so only one widget mounts at a time.
 */
export function useTurnstileWidget(
  siteKey: string,
  mountKey = 0,
  slot: TurnstileSlot = "wholesale",
) {
  const canRender = Boolean(siteKey.trim());
  const { slotReady, cooldownSec } = useTurnstileSlot(slot, canRender);
  const mountAllowed = canRender && slotReady;
  const [turnstileScriptLoaded] = useTurnstileScriptLoaded(mountAllowed);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [mountError, setMountError] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [layoutPass, setLayoutPass] = useState(0);

  useEffect(() => {
    widgetIdRef.current = null;
    setTurnstileToken("");
    setMountError(false);
    clearTurnstileContainer(widgetRef.current);
  }, [mountKey, siteKey, slotReady]);

  useEffect(() => {
    if (!mountAllowed || !turnstileScriptLoaded) return;

    const el = widgetRef.current;
    if (!el) return;

    if (containerIsVisible(el)) {
      setLayoutPass((n) => n + 1);
      return;
    }

    const observer = new ResizeObserver(() => {
      if (containerIsVisible(el)) {
        setLayoutPass((n) => n + 1);
      }
    });
    observer.observe(el);

    const retry = window.setInterval(() => {
      if (containerIsVisible(el)) {
        setLayoutPass((n) => n + 1);
        window.clearInterval(retry);
      }
    }, 200);

    return () => {
      observer.disconnect();
      window.clearInterval(retry);
    };
  }, [mountAllowed, turnstileScriptLoaded, mountKey]);

  useLayoutEffect(() => {
    if (!mountAllowed || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile?.render) {
      return;
    }
    if (!containerIsVisible(widgetRef.current)) {
      return;
    }
    if (widgetIdRef.current) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !widgetRef.current || !window.turnstile?.render || widgetIdRef.current) {
        return;
      }
      if (!containerIsVisible(widgetRef.current)) return;

      clearTurnstileContainer(widgetRef.current);
      try {
        const rendered = window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (!cancelled) {
              setMountError(false);
              setTurnstileToken(token);
            }
          },
          "expired-callback": () => {
            if (!cancelled) setTurnstileToken("");
          },
          "error-callback": () => {
            if (!cancelled) setTurnstileToken("");
          },
        });
        widgetIdRef.current = rendered;
        setMountError(false);
      } catch {
        widgetIdRef.current = null;
        clearTurnstileContainer(widgetRef.current);
        if (!cancelled) setMountError(true);
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
  }, [mountAllowed, siteKey, turnstileScriptLoaded, mountKey, layoutPass]);

  const resetWidget = useCallback(() => {
    safeResetWidget(widgetIdRef.current);
    widgetIdRef.current = null;
    clearTurnstileContainer(widgetRef.current);
    setTurnstileToken("");
    setMountError(false);
    setLayoutPass((n) => n + 1);
  }, []);

  return {
    canRender,
    slotReady,
    cooldownSec,
    mountError,
    widgetRef,
    turnstileToken,
    turnstileScriptLoaded: turnstileScriptLoaded && mountAllowed,
    resetWidget,
  };
}
