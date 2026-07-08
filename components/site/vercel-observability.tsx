"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/** Loaded only when the root layout opts in (Vercel deploys). */
export function VercelObservabilityClient() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
