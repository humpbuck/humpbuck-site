"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SiteAnalyticsConsent = dynamic(
  () =>
    import("@/components/analytics/site-analytics-consent").then(
      (m) => m.SiteAnalyticsConsent,
    ),
  { ssr: false },
);

const GoogleAnalyticsPageviews = dynamic(
  () =>
    import("@/components/analytics/google-analytics-pageviews").then(
      (m) => m.GoogleAnalyticsPageviews,
    ),
  { ssr: false },
);

const AttributionCapture = dynamic(
  () =>
    import("@/components/attribution-capture").then(
      (m) => m.AttributionCapture,
    ),
  { ssr: false },
);

const SiteFloatingActions = dynamic(
  () =>
    import("@/components/site/SiteFloatingActions").then(
      (m) => m.SiteFloatingActions,
    ),
  { ssr: false },
);

export function SiteClientEnhancements() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const markReady = () => setReady(true);
    const win = window as Window & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        opts?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(() => markReady(), { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(markReady, 800);
    }

    return () => {
      if (idleId != null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <SiteAnalyticsConsent />
      <GoogleAnalyticsPageviews />
      <AttributionCapture />
      <SiteFloatingActions />
    </>
  );
}
