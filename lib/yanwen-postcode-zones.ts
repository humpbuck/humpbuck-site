import raw from "@/lib/data/yanwen-postcode-zones.json";

type AuRange = { lo: number; hi: number; zone: number };
type Doc = {
  au: { numericRanges: AuRange[] };
  ca: { postalKeysToZone: Record<string, number> };
};

const DOC = raw as Doc;

export type YanwenLaneZoneDigit = "1" | "2" | "3" | "4";

function digitFromZoneNum(z: number): YanwenLaneZoneDigit | null {
  if (z === 1) return "1";
  if (z === 2) return "2";
  if (z === 3) return "3";
  if (z === 4) return "4";
  return null;
}

/** Canadian postal: strip spaces/hyphens, uppercase (matches exporter). */
export function normalizeCanadianPostalKey(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

/** First 4-digit group in the string (Australian postcodes). */
export function parseAustraliaPostcodeNumeric(postalCode: string): number | null {
  const m = postalCode.match(/(\d{4})/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0 || n > 9999) return null;
  return n;
}

function lookupAuZone(n: number): number | null {
  for (const r of DOC.au.numericRanges) {
    if (n >= r.lo && n <= r.hi) return r.zone;
  }
  return null;
}

function lookupCaZone(postalCode: string): number | null {
  const norm = normalizeCanadianPostalKey(postalCode);
  if (norm.length < 3) return null;
  const map = DOC.ca.postalKeysToZone;
  const zFull = norm.length >= 6 ? map[norm.slice(0, 6)] : undefined;
  if (zFull != null) return zFull;
  const zExact = map[norm];
  if (zExact != null) return zExact;
  const fsa = norm.slice(0, 3);
  const zFsa = map[fsa];
  return zFsa ?? null;
}

/**
 * Lane zone 1–4 for Yanwen 484 and Cainiao AU (`澳大利亚/N区`), from the Yanwen
 * workbook extract in `yanwen-postcode-zones.json`.
 */
export function deriveYanwenLaneZoneDigit(
  iso2: string,
  postalCode: string,
): YanwenLaneZoneDigit | null {
  const pc = (postalCode ?? "").trim();
  if (!pc) return null;
  if (iso2 === "AU") {
    const n = parseAustraliaPostcodeNumeric(pc);
    if (n == null) return null;
    const z = lookupAuZone(n);
    return z != null ? digitFromZoneNum(z) : null;
  }
  if (iso2 === "CA") {
    const z = lookupCaZone(pc);
    return z != null ? digitFromZoneNum(z) : null;
  }
  return null;
}
