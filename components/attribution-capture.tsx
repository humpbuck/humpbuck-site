"use client";

import { useEffect } from "react";
import { captureTrafficAttribution } from "@/lib/traffic-attribution";

/** First-touch UTM / referrer for checkout (client storage only). */
export function AttributionCapture() {
  useEffect(() => {
    captureTrafficAttribution();
  }, []);

  return null;
}
