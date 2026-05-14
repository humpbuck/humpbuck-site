/**
 * First-touch traffic attribution (sessionStorage). Used at checkout only on the client.
 */

const STORAGE_KEY = "humpbuck_attr_v1";
const AFFILIATE_STORAGE_KEY = "humpbuck_affiliate_attr_v1";
const AFFILIATE_ATTR_DAYS = 7;

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

function normalizePid(raw: string | null): string | null {
  const pid = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!pid) return null;
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(pid)) return null;
  return pid;
}

/**
 * Capture affiliate pid from URL query `?pid=...` and persist to localStorage
 * with an expiry window (cookie-duration equivalent for client attribution).
 */
export function captureAffiliatePidAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const pid = normalizePid(params.get("pid"));
    if (!pid) return;
    const expiresAt = Date.now() + AFFILIATE_ATTR_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      AFFILIATE_STORAGE_KEY,
      JSON.stringify({
        pid,
        expiresAt,
      }),
    );
  } catch {
    /* ignore private mode / quota */
  }
}

function readStoredAffiliatePid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { pid?: string; expiresAt?: number };
    const pid = normalizePid(j.pid ?? null);
    const expiresAt = Number(j.expiresAt ?? 0);
    if (!pid || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      localStorage.removeItem(AFFILIATE_STORAGE_KEY);
      return null;
    }
    return pid;
  } catch {
    return null;
  }
}

/** Read captured pid for checkout payload. */
export function getAffiliatePidForCheckout(): string | null {
  return readStoredAffiliatePid();
}

/** Read pid from the current URL or storage, whichever is available first. */
export function getAffiliatePidForCheckoutFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = normalizePid(new URLSearchParams(window.location.search).get("pid"));
    if (fromUrl) return fromUrl;
  } catch {
    /* ignore */
  }
  return readStoredAffiliatePid();
}
