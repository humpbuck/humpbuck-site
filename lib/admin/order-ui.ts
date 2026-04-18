/** Admin order list & detail display helpers (no secrets). */

export function orderDisplayId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export function customerNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export type AdminStatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export function adminStatusMeta(status: string): {
  label: string;
  tone: AdminStatusTone;
} {
  switch (status) {
    case "pending_payment":
      return { label: "Pending payment", tone: "warning" };
    case "paid":
      return { label: "Paid", tone: "info" };
    case "processing":
      return { label: "Processing", tone: "info" };
    case "shipped":
      return { label: "Completed", tone: "success" };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
    case "refunded":
      return { label: "Refunded", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

/** Payment rail (Stripe / PayPal). */
export function paymentProviderLabel(provider: string): string {
  const p = provider.toLowerCase();
  if (p === "stripe") return "Stripe";
  if (p === "paypal") return "PayPal";
  if (!p) return "Unknown";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/** Traffic / acquisition source (how they found the site). */
export function trafficSourceLabel(slug: string | null | undefined): string {
  if (!slug || slug === "unknown") return "Unknown";
  const map: Record<string, string> = {
    direct: "Direct",
    google: "Google",
    bing: "Bing",
    duckduckgo: "DuckDuckGo",
    social: "Social",
    referral: "Referral",
    campaign: "Campaign",
  };
  if (map[slug]) return map[slug];
  return slug
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function parseShippingRecord(
  json: string | null,
): Record<string, string> | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as unknown;
    if (!o || typeof o !== "object") return null;
    return o as Record<string, string>;
  } catch {
    return null;
  }
}

/** Human-readable address lines from checkout `shipping` JSON (flexible keys). */
export function formatAddressLines(
  s: Record<string, string> | null,
): string[] {
  if (!s || Object.keys(s).length === 0) return [];
  const lines: string[] = [];
  const name =
    s.fullName ||
    [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
    s.name;
  if (name) lines.push(name);
  if (s.line1) lines.push(s.line1);
  if (s.line2) lines.push(s.line2);
  const cityLine = [s.city, s.state, s.postalCode || s.zip]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (s.country) lines.push(s.country);
  return lines;
}

export function adminStatusPillClass(tone: AdminStatusTone): string {
  switch (tone) {
    case "success":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200/80";
    case "info":
      return "bg-sky-100 text-sky-900 ring-sky-200/80";
    case "warning":
      return "bg-amber-100 text-amber-950 ring-amber-200/80";
    case "danger":
      return "bg-rose-100 text-rose-900 ring-rose-200/80";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-200/80";
  }
}
