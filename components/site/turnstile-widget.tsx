"use client";

import {
  loadTurnstileScript,
  resetTurnstileScriptLoader,
  waitForTurnstileApi,
} from "@/lib/turnstile-context";
import { useEffect, useRef, useState } from "react";

type TurnstileWidgetProps = {
  siteKey?: string;
  onTokenChange: (token: string) => void;
  className?: string;
  unavailableMessage?: string;
  loadErrorMessage?: string;
};

export function TurnstileWidget({
  siteKey: siteKeyProp,
  onTokenChange,
  className = "min-h-[65px] w-full min-w-[300px]",
  unavailableMessage = "Verification is unavailable right now.",
  loadErrorMessage = "Verification failed to load. Please refresh and try again.",
}: TurnstileWidgetProps) {
  const siteKey =
    siteKeyProp?.trim() ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    "";
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [sdkReady, setSdkReady] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  onTokenChangeRef.current = onTokenChange;

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    setSdkReady(false);
    setMountError(false);

    void (async () => {
      try {
        if (window.turnstile?.render) {
          await waitForTurnstileApi();
        } else {
          await waitForTurnstileApi(8_000).catch(() => loadTurnstileScript());
        }
        if (!cancelled) setSdkReady(true);
      } catch {
        if (!cancelled) setMountError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [siteKey, loadAttempt]);

  useEffect(() => {
    if (!siteKey || !sdkReady || !containerRef.current) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile?.render) return;
      if (widgetIdRef.current) return;

      const prevId = widgetIdRef.current;
      if (prevId && window.turnstile.remove) {
        try {
          window.turnstile.remove(prevId);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
      containerRef.current.replaceChildren();

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenChangeRef.current(token),
          "expired-callback": () => onTokenChangeRef.current(""),
          "error-callback": () => onTokenChangeRef.current(""),
        });
        widgetIdRef.current = id;
        setMountError(false);
      } catch {
        if (!cancelled) setMountError(true);
      }
    };

    if (typeof window.turnstile?.ready === "function") {
      window.turnstile.ready(mount);
    } else {
      mount();
    }

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id && window.turnstile?.remove) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* ignore */
        }
      }
      if (containerRef.current) containerRef.current.replaceChildren();
    };
  }, [siteKey, sdkReady]);

  if (!siteKey) {
    return (
      <p className="text-xs leading-relaxed text-red-600/90">{unavailableMessage}</p>
    );
  }

  return (
    <>
      <div ref={containerRef} className={className} />
      {mountError ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-red-600/90">{loadErrorMessage}</p>
          <button
            type="button"
            onClick={() => {
              onTokenChangeRef.current("");
              resetTurnstileScriptLoader();
              setLoadAttempt((n) => n + 1);
            }}
            className="text-xs font-medium text-ink underline underline-offset-2 hover:text-ink/80"
          >
            Try again
          </button>
        </div>
      ) : null}
    </>
  );
}
