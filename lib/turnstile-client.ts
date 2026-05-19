"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const SCRIPT_TAG_ID = "cf-turnstile-sdk-explicit-storefront";

/** `window.turnstile` may appear ticks after `<script>` `load`; reused tags do not replay `load`. */
const WAIT_TURNSTILE_MS = 20_000;
const POLL_MS = 50;

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

function waitUntilTurnstileGlobalsReady(): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tick(): void {
      const api = window.turnstile;
      if (api) {
        if (typeof api.ready === "function") {
          api.ready(() => resolve());
        } else {
          resolve();
        }
        return;
      }
      if (Date.now() - start >= WAIT_TURNSTILE_MS) {
        reject(new Error("Turnstile API timeout"));
        return;
      }
      window.setTimeout(tick, POLL_MS);
    }
    tick();
  });
}

export function injectTurnstileScriptOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (scriptInjectPromise) return scriptInjectPromise;

  scriptInjectPromise = new Promise<void>((resolve, reject) => {
    let aborted = false;
    function abort(err: Error) {
      if (aborted) return;
      aborted = true;
      reject(err);
    }

    let globalsWait: Promise<void> | null = null;
    function startGlobalsWait(): void {
      if (aborted) return;
      if (!globalsWait) globalsWait = waitUntilTurnstileGlobalsReady();
      globalsWait.then(resolve, reject);
    }

    const existingSdk =
      (document.getElementById(SCRIPT_TAG_ID) instanceof HTMLScriptElement &&
        document.getElementById(SCRIPT_TAG_ID)) ||
      (document.querySelector(
        `script[src^="https://challenges.cloudflare.com/turnstile"]`,
      ) as HTMLScriptElement | null);

    if (existingSdk) {
      existingSdk.addEventListener(
        "error",
        () => abort(new Error("Turnstile script load failed")),
        { once: true },
      );
      existingSdk.addEventListener("load", () => startGlobalsWait(), { once: true });
      queueMicrotask(() => startGlobalsWait());
      return;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_TAG_ID;
    s.src = TURNSTILE_SCRIPT_SRC;
    s.async = true;
    s.addEventListener("error", () => abort(new Error("Turnstile script load failed")), {
      once: true,
    });
    s.addEventListener("load", () => startGlobalsWait(), { once: true });
    document.head.appendChild(s);
    queueMicrotask(() => startGlobalsWait());
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
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const widgetContainerRef = useCallback((node: HTMLDivElement | null) => {
    widgetRef.current = node;
    setContainerEl(node);
  }, []);

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
    if (!canRender || !turnstileScriptLoaded || !containerEl || !window.turnstile) {
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
      widgetIdRef.current = null;
    };
  }, [canRender, siteKey, turnstileScriptLoaded, containerEl]);

  useEffect(() => {
    return () => {
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
        clearTurnstileContainer(widgetRef.current);
      }
    }
    setTurnstileToken("");
  }

  return {
    canRender,
    widgetContainerRef,
    turnstileToken,
    turnstileScriptLoaded,
    turnstileScriptError,
    resetWidget,
  };
}
