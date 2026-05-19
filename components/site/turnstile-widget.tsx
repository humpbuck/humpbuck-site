"use client";

import { loadTurnstileScript } from "@/lib/turnstile-context";
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
  const [scriptReady, setScriptReady] = useState(false);
  const [mountError, setMountError] = useState(false);

  onTokenChangeRef.current = onTokenChange;

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    setScriptReady(false);
    setMountError(false);
    void loadTurnstileScript()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => {
        if (!cancelled) setMountError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

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

    if (typeof window.turnstile.ready === "function") {
      window.turnstile.ready(mount);
    } else {
      mount();
    }

    return () => {
      cancelled = true;
      widgetIdRef.current = null;
      const el = containerRef.current;
      if (el) el.replaceChildren();
    };
  }, [siteKey, scriptReady]);

  if (!siteKey) {
    return (
      <p className="text-xs leading-relaxed text-red-600/90">{unavailableMessage}</p>
    );
  }

  return (
    <>
      <div ref={containerRef} className={className} />
      {mountError ? (
        <p className="mt-2 text-xs text-red-600/90">{loadErrorMessage}</p>
      ) : null}
    </>
  );
}

