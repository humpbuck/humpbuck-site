import isoRaw from "./data/iso-3166-countries.json";

type IsoRow = { name: string; "alpha-2": string };

function buildCheckoutCountries(): { value: string; label: string }[] {
  const rows = isoRaw as IsoRow[];
  return rows
    .map((r) => ({
      value: r.name,
      label:
        r["alpha-2"] === "US"
          ? "United States (US)"
          : `${r.name} (${r["alpha-2"]})`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value, "en"));
}

/** Full ISO 3166 list (~250 entries), alphabetical by English name. */
export const CHECKOUT_COUNTRIES: { value: string; label: string }[] =
  buildCheckoutCountries();

/** Default country `value` (matches ISO short name in our list). */
export const DEFAULT_CHECKOUT_COUNTRY = "United States of America";

export function isUnitedStates(country: string): boolean {
  const t = country.trim();
  return t === "United States" || t === "United States of America";
}
