import { City, State } from "country-state-city";
import auCityPrimary from "@/lib/data/au-city-primary-postcodes.json";
import raw from "@/lib/data/yanwen-postcode-zones.json";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";

type Range = { lo: number; hi: number; zone: number };

const RANGES = (raw as { au: { numericRanges: Range[] } }).au.numericRanges;

let servedNumericsCache: number[] | null = null;

/** Postcodes that appear in the Yanwen AU grid (carrier-served for zoning). */
export function servedAuPostcodeNumerics(): number[] {
  if (!servedNumericsCache) {
    const set = new Set<number>();
    for (const r of RANGES) {
      for (let n = r.lo; n <= r.hi; n++) set.add(n);
    }
    servedNumericsCache = Array.from(set).sort((a, b) => a - b);
  }
  return servedNumericsCache;
}

export function formatAuPostcode4(n: number): string {
  return String(n).padStart(4, "0");
}

/**
 * `value` from checkout state dropdown — full English name (country-state-city, non-US).
 */
const AU_STATE_FULL_NAME_TO_KEY = new Map<string, string>([
  ["New South Wales", "NSW"],
  ["Queensland", "QLD"],
  ["Victoria", "VIC"],
  ["Tasmania", "TAS"],
  ["South Australia", "SA"],
  ["Western Australia", "WA"],
  ["Northern Territory", "NT"],
  ["Australian Capital Territory", "ACT"],
]);

function inRange(n: number, lo: number, hi: number): boolean {
  return n >= lo && n <= hi;
}

/** Australian standard allocation (numeric 0–9999; 0200 stored as 200). */
export function auNumericPostcodeBelongsToState(
  n: number,
  stateKey: string,
): boolean {
  const act =
    inRange(n, 200, 299) ||
    inRange(n, 2600, 2618) ||
    inRange(n, 2900, 2920);

  if (stateKey === "ACT") return act;

  if (stateKey === "NSW") {
    if (act) return false;
    return (
      inRange(n, 1000, 1999) ||
      inRange(n, 2000, 2599) ||
      inRange(n, 2619, 2898) ||
      inRange(n, 2921, 2999)
    );
  }

  if (act) return false;

  switch (stateKey) {
    case "VIC":
      return inRange(n, 3000, 3999) || inRange(n, 8000, 8999);
    case "QLD":
      return inRange(n, 4000, 4999) || inRange(n, 9000, 9999);
    case "SA":
      return inRange(n, 5000, 5999);
    case "WA":
      return inRange(n, 6000, 6999);
    case "TAS":
      return inRange(n, 7000, 7999);
    case "NT":
      return inRange(n, 800, 899);
    default:
      return false;
  }
}

/**
 * Dropdown options: served postcodes in this state, label includes Yanwen/Cainiao lane zone.
 */
export function getAustralianPostcodeOptions(
  stateFullName: string,
): { value: string; label: string }[] {
  const key = AU_STATE_FULL_NAME_TO_KEY.get(stateFullName.trim());
  if (!key) return [];

  const out: { value: string; label: string }[] = [];
  for (const n of servedAuPostcodeNumerics()) {
    if (!auNumericPostcodeBelongsToState(n, key)) continue;
    const pc = formatAuPostcode4(n);
    const z = deriveYanwenLaneZoneDigit("AU", pc);
    const zPart = z ? ` · zone ${z}` : "";
    out.push({ value: pc, label: `${pc}${zPart}` });
  }
  return out;
}

type AuPrimaryMap = Record<string, Record<string, string[]>>;
const AU_PRIMARY = auCityPrimary as AuPrimaryMap;

function normAuCityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Melbourne CBD reference — used to drop inner-metro postcodes for distant VIC localities. */
const MELBOURNE_REF = { lat: -37.8136, lon: 144.9631 };

/**
 * Narrows AU dropdown options toward the selected locality: primary postcode table
 * (where present), else VIC distance heuristic vs Melbourne for metro band 3000–3210.
 */
export function narrowAustralianPostcodeOptionsForCity(
  stateFullName: string,
  cityName: string,
  opts: { value: string; label: string }[],
): { options: typeof opts; note?: string } {
  const key = AU_STATE_FULL_NAME_TO_KEY.get(stateFullName.trim());
  const cityTrim = cityName.trim();
  if (!key || !cityTrim || opts.length === 0) return { options: opts };

  const slug = normAuCityKey(cityTrim);
  const primaryList = AU_PRIMARY[key]?.[slug];
  if (primaryList?.length) {
    const allow = new Set(primaryList.map((p) => p.replace(/\s+/g, "").padStart(4, "0")));
    const hit = opts.filter((o) => allow.has(o.value));
    if (hit.length) {
      return {
        options: hit,
        note: "Showing postcodes that match this locality in our reference list.",
      };
    }
  }

  const states = State.getStatesOfCountry("AU");
  const st = states.find((s) => s.isoCode === key);
  if (!st) return { options: opts };

  const cities = City.getCitiesOfState("AU", st.isoCode);
  const row = cities.find((c) => normAuCityKey(c.name) === slug);
  if (!row?.latitude || !row?.longitude) return { options: opts };

  const lat = Number(row.latitude);
  const lon = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { options: opts };

  if (key === "VIC") {
    const dMelb = haversineKm(lat, lon, MELBOURNE_REF.lat, MELBOURNE_REF.lon);
    if (dMelb > 95) {
      const filtered = opts.filter((o) => {
        const n = Number.parseInt(o.value, 10);
        if (!Number.isFinite(n)) return true;
        if (n >= 3000 && n <= 3210) return false;
        return true;
      });
      if (filtered.length) {
        return {
          options: filtered,
          note: "Hiding inner Melbourne postcodes (zone 1 band) — not used for your area.",
        };
      }
    }
  }

  return { options: opts };
}

export function isAustralianStateRecognized(stateFullName: string): boolean {
  return AU_STATE_FULL_NAME_TO_KEY.has(stateFullName.trim());
}

/** Internal key (e.g. NSW) for validation, or null if unknown. */
export function australianStateKeyFromFullName(
  stateFullName: string,
): string | null {
  return AU_STATE_FULL_NAME_TO_KEY.get(stateFullName.trim()) ?? null;
}
