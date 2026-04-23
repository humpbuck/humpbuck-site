import { City, State } from "country-state-city";
import isoRaw from "./data/iso-3166-countries.json";
import stateSupplement from "./data/checkout-state-supplement.json";
import gbCheckoutCounties from "./data/gb-checkout-counties.json";

type IsoRow = { name: string; "alpha-2": string };

const NAME_TO_ISO2 = new Map<string, string>();
for (const row of isoRaw as IsoRow[]) {
  NAME_TO_ISO2.set(row.name, row["alpha-2"]);
}
/** Older checkout values */
NAME_TO_ISO2.set("United States", "US");

/**
 * Resolve ISO 3166-1 alpha-2 from the same English names used in checkout country list.
 */
export function countryNameToIso2(countryName: string): string | null {
  const t = countryName.trim();
  if (!t) return null;
  const direct = NAME_TO_ISO2.get(t);
  if (direct) return direct;
  const lower = t.toLowerCase();
  for (const [name, code] of NAME_TO_ISO2) {
    if (name.toLowerCase() === lower) return code;
  }
  return null;
}

const STATE_SUPPLEMENT = stateSupplement as Record<string, string[]>;

/** Locales where a blank town/city is acceptable (Woo-style exceptions). */
const CITY_OPTIONAL_ISO2 = new Set<string>(["HK"]);

const GB_COUNTY_OPTIONS = (gbCheckoutCounties as string[])
  .slice()
  .sort((a, b) => a.localeCompare(b, "en"))
  .map((name) => ({ value: name, label: name }));

function supplementStateOptions(
  iso2: string,
): { value: string; label: string }[] {
  const rows = STATE_SUPPLEMENT[iso2];
  if (!rows?.length) return [];
  return rows.map((name) => ({ value: name, label: name }));
}

/**
 * Dropdown options for state/province when the dataset has regions for that country.
 * US: value = USPS-style code (CA, NY) for compatibility with admin state expansion.
 * Other countries: value = full region name (matches typical international addresses).
 *
 * `country-state-city` omits many territories; those are filled from
 * `lib/data/checkout-state-supplement.json` (ISO-style islands / districts).
 */
export function getStateProvinceOptionsForCountry(
  countryName: string,
): { value: string; label: string }[] {
  const iso2 = countryNameToIso2(countryName);
  if (!iso2) return [];
  if (iso2 === "GB") {
    return GB_COUNTY_OPTIONS;
  }
  const states = State.getStatesOfCountry(iso2);
  if (states?.length) {
    return states
      .map((s) => ({
        value: iso2 === "US" ? s.isoCode : s.name,
        label: s.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "en"));
  }
  const extra = supplementStateOptions(iso2);
  return extra.sort((a, b) => a.label.localeCompare(b.label, "en"));
}

/** True when this country has a structured state/province dropdown. */
export function isStateRequiredForCountry(countryName: string): boolean {
  return getStateProvinceOptionsForCountry(countryName).length > 0;
}

/**
 * Town/city line required for shipping (WooCommerce default), except rare locales.
 */
export function isCityRequiredForCountry(countryName: string): boolean {
  const iso2 = countryNameToIso2(countryName);
  if (!iso2) return false;
  return !CITY_OPTIONAL_ISO2.has(iso2);
}

function resolveStateIso(iso2: string, stateValue: string): string | null {
  const v = stateValue.trim();
  if (!v) return null;
  const states = State.getStatesOfCountry(iso2);
  if (!states?.length) return null;
  if (iso2 === "US") {
    const u = v.toUpperCase();
    const byCode = states.find((s) => s.isoCode === u);
    if (byCode) return byCode.isoCode;
  }
  const byName = states.find((s) => s.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName.isoCode;
  const byCode = states.find((s) => s.isoCode.toUpperCase() === v.toUpperCase());
  return byCode?.isoCode ?? null;
}

/**
 * True when `country-state-city` has a city list for this region (optional type-ahead only).
 */
export function hasStructuredCitiesForState(
  countryName: string,
  stateValue: string,
): boolean {
  const iso2 = countryNameToIso2(countryName);
  if (!iso2 || !stateValue.trim()) return false;
  const stateIso = resolveStateIso(iso2, stateValue);
  if (!stateIso) return false;
  return Boolean(City.getCitiesOfState(iso2, stateIso)?.length);
}
