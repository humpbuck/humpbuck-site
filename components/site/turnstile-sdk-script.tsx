"use client";

import Script from "next/script";
import { TURNSTILE_SCRIPT_SRC } from "@/lib/turnstile-context";

/** Load Cloudflare Turnstile once for the whole storefront (contact + wholesale). */
export function TurnstileSdkScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (!siteKey) return null;

  return (
    <Script
      id="cf-turnstile-sdk"
      src={TURNSTILE_SCRIPT_SRC}
      strategy="afterInteractive"
    />
  );
}
