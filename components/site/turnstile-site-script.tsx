"use client";

import Script from "next/script";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Load Cloudflare Turnstile once for contact + wholesale (outside modals / error boundaries). */
export function TurnstileSiteScript() {
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
