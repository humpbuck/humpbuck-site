"use client";

import Script from "next/script";
import { markTurnstileSdkReady, TURNSTILE_SCRIPT_SRC } from "@/lib/turnstile-client";

/** Load Cloudflare Turnstile once for the storefront (outside modals / error boundaries). */
export function TurnstileSiteScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (!siteKey) return null;

  return (
    <Script
      id="cf-turnstile-sdk"
      src={TURNSTILE_SCRIPT_SRC}
      strategy="afterInteractive"
      onLoad={markTurnstileSdkReady}
    />
  );
}
