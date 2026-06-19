"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  captureAffiliatePidAttribution,
  captureTrafficAttribution,
} from "@/lib/traffic-attribution";

/** First-touch UTM / referrer + affiliate pid for checkout (client storage only). */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureTrafficAttribution();
    captureAffiliatePidAttribution();
  }, []);

  useEffect(() => {
    captureAffiliatePidAttribution();
  }, [pathname, searchParams]);

  return null;
}
