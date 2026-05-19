"use client";

import { useEffect, useRef, useState } from "react";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const SCRIPT_TAG_ID = "cf-turnstile-sdk-explicit-storefront";

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

/** Single-flight script inject (avoids `next/script` quirks with dynamic + hard refresh). */
let scriptInjectPromise: Promise<void> | null = null;

function waitForTurnstileApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const api = window.turnstile;
    if (!api) {
      reject(new Error("Turnstile API missing"));
      return;
    }
    if (typeof api.ready === "function") {
      api.ready(() => resolve());
      return;
    }
    resolve();
  });
}

export function injectTurnstileScriptOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (window.turnstile) {
    return waitForTurnstileApi();
  }

  if (scriptInjectPromise) return scriptInjectPromise;

  scriptInjectPromise = new Promise<void>((resolve, reject) => {
    const finalize = () => {
      waitForTurnstileApi().then(resolve).catch(reject);
    };

    const existingById = document.getElementById(SCRIPT_TAG_ID);
    const existingSdk =
      existingById instanceof HTMLScriptElement
        ? existingById
        : (document.querySelector(
            `script[src^="https://challenges.cloudflare.com/turnstile"]`,
          ) as HTMLScriptElement | null);

    if (existingSdk) {
      if (window.turnstile) {
        finalize();
        return;
      }
      existingSdk.addEventListener("load", () => finalize(), { once: true });
      existingSdk.addEventListener(
        "error",
        () => {
          reject(new Error("Turnstile script load failed"));
        },
        { once: true },
      );
      return;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_TAG_ID;
    s.src = TURNSTILE_SCRIPT_SRC;
    s.async = true;
    s.addEventListener("load", () => finalize(), { once: true });
    s.addEventListener(
      "error",
      () => {
        reject(new Error("Turnstile script load failed"));
      },
      { once: true },
    );
    document.head.appendChild(s);
  }).catch((err) => {
    scriptInjectPromise = null;
    throw err;
  });

  return scriptInjectPromise;
}

function clearTurnstileContainer(el: HTMLElement | null) {
  if (!el) return;
  el.replaceChildren();
}

export function useTurnstileWidget(siteKey: string) {
  const canRender = Boolean(siteKey.trim());
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);
  const [turnstileScriptError, setTurnstileScriptError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canRender) {
      setTurnstileScriptLoaded(false);
      setTurnstileScriptError(false);
      return;
    }

    let cancelled = false;

    injectTurnstileScriptOnce()
      .then(() => {
        if (!cancelled) {
          setTurnstileScriptLoaded(true);
          setTurnstileScriptError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTurnstileScriptLoaded(false);
          setTurnstileScriptError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canRender]);

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
  }, [canRender, siteKey, turnstileScriptLoaded]);

  useEffect(() => {
    return () => {
      /**
       * Do not call turnstile.remove() or setState here — both break client
       * navigation and hard refresh (Strict Mode runs cleanup while remounting).
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
    turnstileScriptError,
    resetWidget,
  };
}
