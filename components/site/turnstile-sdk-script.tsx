"use client";

import Script from "next/script";

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Load Cloudflare Turnstile once for the whole storefront (contact + wholesale). */
export function TurnstileSdkScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (!siteKey) return null;

  return (
    <Script id="cf-turnstile-sdk" src={TURNSTILE_SRC} strategy="afterInteractive" />
  );
}
