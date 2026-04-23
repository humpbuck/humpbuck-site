"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  CONSENT_STORAGE_KEY,
  type StoredConsentChoice,
} from "@/lib/analytics-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function readConsent(): StoredConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    /* private mode */
  }
  return null;
}

/**
 * GA4 measures the first full page load via gtag config; client-side navigations need
 * an additional config update so each route appears in reports.
 */
export function GoogleAnalyticsPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstNavigation = useRef(true);

  useEffect(() => {
    if (!GA_ID) return;
    if (readConsent() !== "accepted") return;
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;
    const gtag = w.gtag;

    const q = searchParams?.toString() ?? "";
    const pagePath = pathname + (q ? `?${q}` : "");

    if (isFirstNavigation.current) {
      isFirstNavigation.current = false;
      return;
    }

    gtag("config", GA_ID, {
      page_path: pagePath,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}
