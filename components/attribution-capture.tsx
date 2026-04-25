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

  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible") return;
      trackVisitorEvent({ type: "heartbeat" });
    };
    sendHeartbeat();
    const id = window.setInterval(sendHeartbeat, 30000);
    document.addEventListener("visibilitychange", sendHeartbeat);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, []);

  return null;
}
