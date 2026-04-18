"use client";

import { useEffect } from "react";
import { captureTrafficAttribution } from "@/lib/traffic-attribution";

/** Records first-touch traffic (UTM or referrer) for checkout attribution. */
export function AttributionCapture() {
  useEffect(() => {
    captureTrafficAttribution();
  }, []);
  return null;
}
