/**
 * First-touch traffic attribution (sessionStorage). Used at checkout only on the client.
 */

const STORAGE_KEY = "humpbuck_attr_v1";

function classifyReferrer(ref: string, siteHost: string): string {
  if (!ref) return "direct";
  try {
    const u = new URL(ref);
    const h = u.hostname.replace(/^www\./, "");
    if (h === siteHost) return "direct";
    if (h.includes("google.")) return "google";
    if (h === "bing.com" || h.endsWith(".bing.com")) return "bing";
    if (h.includes("duckduckgo")) return "duckduckgo";
    if (
      [
        "facebook.com",
        "m.facebook.com",
        "instagram.com",
        "t.co",
        "twitter.com",
        "x.com",
        "linkedin.com",
        "reddit.com",
        "pinterest.com",
        "youtube.com",
      ].some((d) => h === d || h.endsWith(`.${d}`))
    ) {
      return "social";
    }
    return "referral";
  } catch {
    return "unknown";
  }
}

function normalizeUtm(utm: string | null): string | null {
  if (!utm) return null;
  const u = utm.trim().toLowerCase().slice(0, 48);
  if (!u) return null;
  if (/^[a-z0-9][a-z0-9_-]*$/.test(u)) return u;
  return "campaign";
}

/** Record first-touch source once per session (utm_source wins over referrer). */
export function captureTrafficAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const fromUtm = normalizeUtm(params.get("utm_source"));
    if (fromUtm) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ source: fromUtm }));
      return;
    }
    const host = window.location.hostname;
    const source = classifyReferrer(document.referrer, host);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ source }));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Read stored slug for checkout API (client-only). */
export function getTrafficSourceForCheckout(): string {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return "unknown";
    const j = JSON.parse(raw) as { source?: string };
    const s = j.source;
    if (s && /^[a-z0-9][a-z0-9_-]*$/.test(s)) return s.slice(0, 64);
    return "unknown";
  } catch {
    return "unknown";
  }
}
