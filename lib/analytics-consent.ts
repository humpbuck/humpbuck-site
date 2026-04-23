/**
 * Google Consent Mode v2 + GA4 — storage key and consent payloads.
 * @see https://developers.google.com/tag-platform/security/guides/consent
 */

export const CONSENT_STORAGE_KEY = "humpbuck_cookie_consent_v1" as const;

export type StoredConsentChoice = "accepted" | "rejected";

/** Runs before gtag.js — all non-essential denied until user accepts (EU-safe default). */
export const GOOGLE_CONSENT_DEFAULT = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500,
} as const;

/** After user accepts analytics — adjust if you add Google Ads / remarketing. */
export const GOOGLE_CONSENT_UPDATE_ACCEPTED = {
  analytics_storage: "granted",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  personalization_storage: "denied",
} as const;
