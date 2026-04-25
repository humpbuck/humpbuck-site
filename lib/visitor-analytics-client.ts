"use client";

import { CONSENT_STORAGE_KEY } from "@/lib/analytics-consent";

const SESSION_KEY_STORAGE = "humpbuck_visitor_session_v1";
const SENT_KEYS_STORAGE = "humpbuck_visitor_sent_v1";

type TrackEventInput = {
  type:
    | "session_start"
    | "page_view"
    | "product_view"
    | "add_to_cart"
    | "checkout_start"
    | "purchase";
  path?: string;
  productSlug?: string;
  orderId?: string;
  source?: string;
  meta?: Record<string, string | number | boolean | null>;
};

function analyticsAllowed(): boolean {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

function makeSessionKey(): string {
  return `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorSessionKey(): string {
  if (typeof window === "undefined") return "vs_server";
  try {
    const existing = localStorage.getItem(SESSION_KEY_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,96}$/.test(existing)) return existing;
    const key = makeSessionKey();
    localStorage.setItem(SESSION_KEY_STORAGE, key);
    return key;
  } catch {
    return makeSessionKey();
  }
}

function loadSentKeys(): string[] {
  try {
    const raw = localStorage.getItem(SENT_KEYS_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(-200);
  } catch {
    return [];
  }
}

function saveSentKeys(keys: string[]) {
  try {
    localStorage.setItem(SENT_KEYS_STORAGE, JSON.stringify(keys.slice(-200)));
  } catch {
    /* ignore */
  }
}

export function trackVisitorEvent(
  payload: TrackEventInput,
  options?: { dedupeKey?: string },
): void {
  if (typeof window === "undefined") return;
  if (!analyticsAllowed()) return;

  const dedupeKey = options?.dedupeKey?.trim();
  if (dedupeKey) {
    const sent = loadSentKeys();
    if (sent.includes(dedupeKey)) return;
    sent.push(dedupeKey);
    saveSentKeys(sent);
  }

  const body = {
    ...payload,
    sessionKey: getVisitorSessionKey(),
    path:
      payload.path ??
      `${window.location.pathname}${window.location.search}`.slice(0, 512),
    referrer: document.referrer || null,
    utmSource: new URLSearchParams(window.location.search).get("utm_source"),
    utmMedium: new URLSearchParams(window.location.search).get("utm_medium"),
    utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign"),
  };

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    /* ignore */
  });
}
