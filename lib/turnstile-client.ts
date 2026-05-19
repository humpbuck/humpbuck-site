"use client";

import { useTurnstileScriptContext } from "@/lib/turnstile-context";
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

/** While mounted: reset or remove so a fresh widget can render. */
function resetTurnstileWidget(widgetId: string | null, el: HTMLElement | null) {
  if (widgetId && window.turnstile?.remove) {
    try {
      window.turnstile.remove(widgetId);
    } catch {
      /* ignore */
    }
  } else if (widgetId && window.turnstile) {
    try {
      window.turnstile.reset(widgetId);
    } catch {
      /* ignore */
    }
  }
  clearTurnstileContainer(el);
}

/**
 * On unmount / route change: only clear the container.
 * Calling remove() here breaks Turnstile for the next page in client navigations.
 */
function detachTurnstileContainer(el: HTMLElement | null) {
  clearTurnstileContainer(el);
}

export function useTurnstileScriptLoaded(enabled: boolean): [boolean, () => void] {
  const shared = useTurnstileScriptContext();
  const [localReady, setLocalReady] = useState(false);
  const markLocalReady = useCallback(() => setLocalReady(true), []);

  const useShared = Boolean(shared.siteKey) && enabled;

  useEffect(() => {
    if (!enabled || useShared || localReady) return;
    if (typeof window === "undefined") return;
    const api = window.turnstile;
    if (!api) return;
    if (typeof api.ready === "function") {
      api.ready(markLocalReady);
    } else {
      markLocalReady();
    }
  }, [enabled, useShared, localReady, markLocalReady]);

  if (useShared) {
    return [shared.ready, shared.markReady];
  }

  return [localReady, markLocalReady];
}

export function useTurnstileWidget(siteKey: string) {
  const shared = useTurnstileScriptContext();
  const resolvedKey = siteKey.trim() || shared.siteKey;
  const canRender = Boolean(resolvedKey);
  const [turnstileScriptLoaded, markScriptLoaded] = useTurnstileScriptLoaded(canRender);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [mountError, setMountError] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    widgetIdRef.current = widgetId;
  }, [widgetId]);

  useEffect(() => {
    if (!canRender || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile) {
      return;
    }
    if (widgetId) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !window.turnstile || !widgetRef.current) return;
      clearTurnstileContainer(widgetRef.current);
      try {
        const rendered = window.turnstile.render(widgetRef.current, {
          sitekey: resolvedKey,
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
        setMountError(false);
      } catch {
        if (!cancelled) setMountError(true);
      }
    };

    const frame = requestAnimationFrame(() => {
      if (typeof window.turnstile?.ready === "function") {
        window.turnstile.ready(mount);
      } else {
        mount();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [canRender, resolvedKey, turnstileScriptLoaded, widgetId]);

  useEffect(() => {
    return () => {
      widgetIdRef.current = null;
      detachTurnstileContainer(widgetRef.current);
    };
  }, []);

  function resetWidget() {
    const id = widgetIdRef.current;
    resetTurnstileWidget(id, widgetRef.current);
    widgetIdRef.current = null;
    setWidgetId(null);
    setTurnstileToken("");
  }

  return {
    canRender,
    widgetRef,
    turnstileToken,
    turnstileScriptLoaded,
    markScriptLoaded,
    resetWidget,
    mountError,
  };
}
