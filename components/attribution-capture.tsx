"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  captureTrafficAttribution,
  getTrafficSourceForCheckout,
} from "@/lib/traffic-attribution";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

/** Records first-touch traffic (UTM or referrer) for checkout attribution. */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureTrafficAttribution();
    trackVisitorEvent(
      {
        type: "session_start",
        source: getTrafficSourceForCheckout(),
      },
      { dedupeKey: "session_start_once" },
    );
  }, []);

  useEffect(() => {
    const q = searchParams?.toString() ?? "";
    const path = `${pathname}${q ? `?${q}` : ""}`;
    trackVisitorEvent(
      {
        type: "page_view",
        path,
        source: getTrafficSourceForCheckout(),
      },
      { dedupeKey: `page_view:${path}` },
    );
  }, [pathname, searchParams]);

  return null;
}
