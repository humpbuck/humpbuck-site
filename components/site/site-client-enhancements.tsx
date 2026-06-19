"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
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

const LocaleSwitcherFab = dynamic(
  () =>
    import("@/components/site/LocaleSwitcherFab").then((m) => m.LocaleSwitcherFab),
  { ssr: false },
);

export function SiteClientEnhancements() {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const isHeavyCheckout =
    pathname != null &&
    (pathname.includes("/checkout") || pathname.includes("/cart"));

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

    const onIdle = () => {
      markReady();
    };
    const idleTimeoutMs = isHeavyCheckout ? 2200 : 1200;
    const fallbackMs = isHeavyCheckout ? 1200 : 800;
    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(() => onIdle(), { timeout: idleTimeoutMs });
    } else {
      timeoutId = window.setTimeout(onIdle, fallbackMs);
    }

    return () => {
      if (idleId != null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [isHeavyCheckout]);

  return (
    <>
      {ready ? (
        <>
          <SiteAnalyticsConsent />
          <GoogleAnalyticsPageviews />
          <AttributionCapture />
          <LocaleSwitcherFab />
          <SiteFloatingActions />
        </>
      ) : null}
    </>
  );
}
