"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function isInternalNavigation(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Thin top bar + wait cursor on internal navigations (App Router has no router events).
 * Complements route `loading.tsx` skeletons for perceived feedback on slow networks.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isInternalNavigation(anchor)) return;

      const current = `${window.location.pathname}${window.location.search}`;
      let next = "";
      try {
        const url = new URL(anchor.href);
        next = `${url.pathname}${url.search}`;
      } catch {
        return;
      }
      if (next === current) return;

      pendingRef.current = true;
      setVisible(true);
      setProgress(18);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    tickRef.current = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + (p < 50 ? 8 : 3)));
    }, 200);
    return () => {
      if (tickRef.current != null) window.clearInterval(tickRef.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    setProgress(100);
    const hide = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
    return () => window.clearTimeout(hide);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = "";
      return;
    }
    document.body.style.cursor = "wait";
    return () => {
      document.body.style.cursor = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-digital/20"
      role="progressbar"
      aria-hidden
    >
      <div
        className="h-full bg-digital shadow-[0_0_12px_rgb(34_211_238/0.55)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
