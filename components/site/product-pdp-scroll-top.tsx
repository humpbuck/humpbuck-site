"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Force PDP entry to the top of the page.
 * iOS Safari can otherwise land mid-page (often on Product showcase video).
 */
export function ProductPdpScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    const previous = history.scrollRestoration;
    try {
      history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }

    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    toTop();
    const raf = window.requestAnimationFrame(toTop);
    const t = window.setTimeout(toTop, 50);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      try {
        history.scrollRestoration = previous;
      } catch {
        /* ignore */
      }
    };
  }, [pathname]);

  return null;
}
