"use client";

import Script from "next/script";

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Loads Cloudflare Turnstile once on storefront pages (Next.js Script, not dynamic inject).
 * Widgets poll for `window.turnstile` then call `render()`.
 */
export function TurnstileSdkScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (!siteKey) return null;

  return (
    <Script
      id="cf-turnstile-sdk"
      src={TURNSTILE_SRC}
      strategy="afterInteractive"
    />
  );
}
