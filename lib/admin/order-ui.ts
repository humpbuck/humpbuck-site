/** Admin order list & detail display helpers (no secrets). */

export function orderDisplayId(id: string): string {
  return id.slice(-6).toUpperCase();
}

/** Public / email order label: custom merchant code, or last 6 of id. */
export function orderDisplayCode(order: {
  id: string;
  merchantOrderCode?: string | null;
}): string {
  const c = order.merchantOrderCode?.trim();
  if (c) return c;
  return orderDisplayId(order.id);
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

/** US state/territory abbreviations → full names for admin display. */
const US_STATE_FULL: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
  PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
};

export function expandStateFullName(state: string | undefined): string {
  if (!state?.trim()) return "—";
  const t = state.trim();
  if (t.length > 2) return t;
  const up = t.toUpperCase();
  return US_STATE_FULL[up] ?? t;
}

export type StructuredShippingAddress = {
  name: string;
  company: string;
  streetAddress: string;
  city: string;
  stateFullName: string;
  zip: string;
  country: string;
};

export function parseStructuredShipping(
  s: Record<string, string> | null,
): StructuredShippingAddress | null {
  if (!s || Object.keys(s).length === 0) return null;
  const name =
    s.fullName ||
    [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
    s.name ||
    "";
  const company = s.company?.trim() ?? "";
  const line1 = s.line1?.trim() ?? "";
  const line2 = s.line2?.trim() ?? "";
  const streetAddress = [line1, line2].filter(Boolean).join(", ");
  const city = s.city?.trim() ?? "";
  const rawState = s.state?.trim() ?? "";
  const zip = (s.postalCode || s.zip || "").trim();
  const country = s.country?.trim() ?? "";
  const stateFullName = expandStateFullName(rawState);
  if (
    !name &&
    !company &&
    !streetAddress &&
    !city &&
    !rawState &&
    !zip &&
    !country
  ) {
    return null;
  }
  return {
    name: name || "—",
    company: company || "—",
    streetAddress: streetAddress || "—",
    city: city || "—",
    stateFullName,
    zip: zip || "—",
    country: country || "—",
  };
}

/**
 * Display + tel: href for phone. US 10-digit → +1; numbers already starting with + preserved.
 */
export function formatPhoneInternational(
  phone: string | undefined | null,
  countryHint?: string,
): { display: string; telHref: string } | null {
  if (!phone?.trim()) return null;
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    const telHref = `tel:+${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) {
      const n10 = digits.slice(1);
      return {
        display: `+1 ${n10.slice(0, 3)} ${n10.slice(3, 6)} ${n10.slice(6)}`,
        telHref,
      };
    }
    return { display: raw.replace(/\s+/g, " "), telHref };
  }

  const c = (countryHint || "").toLowerCase();
  const usLike =
    !c ||
    c.includes("united states") ||
    c === "us" ||
    c === "usa" ||
    c === "united states of america";
  if (usLike && digits.length === 10) {
    return {
      display: `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
      telHref: `tel:+1${digits}`,
    };
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const n10 = digits.slice(1);
    return {
      display: `+1 ${n10.slice(0, 3)} ${n10.slice(3, 6)} ${n10.slice(6)}`,
      telHref: `tel:+${digits}`,
    };
  }
  return {
    display: raw,
    telHref: digits ? `tel:${digits}` : "#",
  };
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
  if (s.company?.trim()) lines.push(s.company.trim());
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
