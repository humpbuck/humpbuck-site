import zipcodes from "zipcodes";
import adPostcodes from "@/lib/data/postcodes/AD.json";
import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator";
import {
  auNumericPostcodeBelongsToState,
  australianStateKeyFromFullName,
  getAustralianPostcodeOptions,
  isAustralianStateRecognized,
} from "@/lib/checkout-au-postcodes";
import {
  normalizeCanadianPostal,
  normalizeUsCaState,
  normalizeUsZip5,
} from "@/lib/checkout-zipcodes-helpers";
import {
  countryLabelToIso2,
  yanwenCountryUsesZones,
} from "@/lib/logistics-estimate";
import { parseAustraliaPostcodeNumeric } from "@/lib/yanwen-postcode-zones";
import type { CheckoutAddressForm } from "@/lib/checkout-address";

type ZipRow = { zip: string; city: string; state: string; country?: string };

function cityMatchesLookupRow(lookupCity: string, entered: string): boolean {
  const a = entered.trim().toLowerCase();
  if (!a) return true;
  const raw = lookupCity.trim().toLowerCase();
  const b = raw.split("(")[0]?.trim() ?? raw;
  if (b.includes(a) || a.includes(b)) return true;
  const ta = new Set(a.split(/[\s,/]+/).filter((x) => x.length > 1));
  const tb = new Set(b.split(/[\s,/]+/).filter((x) => x.length > 1));
  for (const x of ta) {
    if (tb.has(x)) return true;
  }
  return false;
}

/**
 * Static imports only — safe for client + server. Add a new `import` + entry when you
 * add `lib/data/postcodes/{ISO2}.json`.
 */
const BUNDLED_POSTCODES: Record<string, string[]> = {
  AD: (adPostcodes as string[]).map((x) => String(x)),
};

function postalInBundledList(iso2: string, postal: string): boolean {
  const list = BUNDLED_POSTCODES[iso2];
  if (!list?.length) return false;
  const key = postal.replace(/\s+/g, "").toUpperCase();
  return list.some((c) => c.replace(/\s+/g, "").toUpperCase() === key);
}

export type AddressConsistencyResult =
  | { ok: true }
  | { ok: false; error: string };

/** Stored on orders when the buyer has no usable postal code (only allowed where {@link allowsPostalNotApplicable}). */
export const POSTAL_NOT_APPLICABLE_SENTINEL = "N/A";

export function isPostalNotApplicableSentinel(v: string): boolean {
  return v.trim().toUpperCase() === POSTAL_NOT_APPLICABLE_SENTINEL;
}

/**
 * True when checkout may accept “no postal code” (sentinel). Never for AU/US/CA,
 * Yanwen lane-zoned countries, bundled postcode lists, or countries where
 * `postcode-validator` knows an official format (e.g. GB, DE).
 */
export function allowsPostalNotApplicable(iso2: string | null | undefined): boolean {
  if (!iso2) return false;
  if (["AU", "US", "CA"].includes(iso2)) return false;
  if (yanwenCountryUsesZones(iso2)) return false;
  if (BUNDLED_POSTCODES[iso2]?.length) return false;
  if (postcodeValidatorExistsForCountry(iso2)) return false;
  return true;
}

/**
 * True when checkout can show a postal / ZIP suggestion list for this country + state
 * (matches `/api/checkout/postcodes` behaviour).
 */
export function hasStructuredPostcodePicker(
  iso2: string | null | undefined,
  stateValue: string,
): boolean {
  if (!iso2) return false;
  const s = stateValue.trim();
  if (iso2 === "AU") {
    if (!s) return false;
    return getAustralianPostcodeOptions(s).length > 0;
  }
  if (iso2 === "US" || iso2 === "CA") {
    const abbr = normalizeUsCaState(iso2, s);
    if (!abbr) return false;
    const rows = zipcodes.lookupByState(abbr) as ZipRow[];
    return Boolean(rows?.length);
  }
  return Boolean(BUNDLED_POSTCODES[iso2]?.length);
}

/**
 * AU / US / CA: postcode suggestions are narrowed by town/city — gate postal until city when applicable.
 * Other countries (e.g. GB): postcode is independent; WooCommerce-style free text.
 */
export function hasStrictCityPostcodeChain(
  iso2: string | null | undefined,
  stateValue: string,
): boolean {
  if (!iso2) return false;
  const s = stateValue.trim();
  if (!s) return false;
  if (iso2 === "AU") {
    return getAustralianPostcodeOptions(s).length > 0;
  }
  if (iso2 === "US" || iso2 === "CA") {
    const abbr = normalizeUsCaState(iso2, s);
    if (!abbr) return false;
    const rows = zipcodes.lookupByState(abbr) as ZipRow[];
    return Boolean(rows?.length);
  }
  return false;
}

/**
 * Postal/ZIP is required when logistics needs it (Yanwen zones), when we expose a
 * structured picker, or when `postcode-validator` supports the country (so we can
 * validate format). Otherwise the buyer may leave it blank.
 */
export function isPostalRequiredForCheckout(
  iso2: string | null | undefined,
  stateValue: string,
): boolean {
  if (!iso2) return false;
  if (allowsPostalNotApplicable(iso2)) return false;
  if (yanwenCountryUsesZones(iso2)) return true;
  if (hasStructuredPostcodePicker(iso2, stateValue)) return true;
  return postcodeValidatorExistsForCountry(iso2);
}

/**
 * Ensures postal code matches region where we have authoritative data (AU / US / CA),
 * bundled ISO lists under `lib/data/postcodes`, or at least matches the country's postal
 * format (`postcode-validator`). City is cross-checked for US/CA when provided.
 */
export function validateAddressRecordConsistency(
  rec: Record<string, string>,
): AddressConsistencyResult {
  const country = (rec.country ?? "").trim();
  const iso = countryLabelToIso2(country);
  if (!iso) {
    return { ok: false, error: "Select a valid country / region." };
  }

  const state = (rec.state ?? "").trim();
  const city = (rec.city ?? "").trim();
  const postalRaw = (rec.postalCode ?? rec.zip ?? "").trim();
  if (!postalRaw) {
    if (!isPostalRequiredForCheckout(iso, state)) {
      return { ok: true };
    }
    return { ok: false, error: "Postal code is required." };
  }

  if (isPostalNotApplicableSentinel(postalRaw)) {
    if (!allowsPostalNotApplicable(iso)) {
      return {
        ok: false,
        error: "A postal code is required for this country.",
      };
    }
    return { ok: true };
  }

  if (iso === "AU") {
    if (!state) {
      return { ok: false, error: "State / province is required." };
    }
    if (!isAustralianStateRecognized(state)) {
      return { ok: false, error: "Choose a valid Australian state / territory." };
    }
    const key = australianStateKeyFromFullName(state);
    if (!key) {
      return { ok: false, error: "Choose a valid Australian state / territory." };
    }
    const n = parseAustraliaPostcodeNumeric(postalRaw);
    if (n == null) {
      return { ok: false, error: "Enter a valid Australian postcode (4 digits)." };
    }
    if (!auNumericPostcodeBelongsToState(n, key)) {
      return {
        ok: false,
        error: "This postcode does not match the selected state / territory.",
      };
    }
    return { ok: true };
  }

  if (iso === "US") {
    if (!state) {
      return { ok: false, error: "State / province is required." };
    }
    const zip5 = normalizeUsZip5(postalRaw);
    if (!zip5) {
      return { ok: false, error: "Enter a valid US ZIP code (at least 5 digits)." };
    }
    const row = zipcodes.lookup(zip5) as ZipRow | undefined;
    if (!row || row.country !== "US") {
      return { ok: false, error: "This ZIP code was not found." };
    }
    if (row.state.toUpperCase() !== state.trim().toUpperCase()) {
      return {
        ok: false,
        error: "This ZIP code does not match the selected state / province.",
      };
    }
    if (city && !cityMatchesLookupRow(row.city, city)) {
      const canon = row.city.split("(")[0]?.trim() ?? row.city;
      return {
        ok: false,
        error: `ZIP ${zip5} is for “${canon}” in ${row.state}. Change town/city to match (or pick another ZIP).`,
      };
    }
    return { ok: true };
  }

  if (iso === "CA") {
    if (!state) {
      return { ok: false, error: "Province is required." };
    }
    const normPostal = normalizeCanadianPostal(postalRaw);
    if (normPostal.length < 3) {
      return { ok: false, error: "Enter a valid Canadian postal code." };
    }
    const row = zipcodes.lookup(normPostal) as ZipRow | undefined;
    if (!row || row.country !== "Canada") {
      return { ok: false, error: "This postal code was not found." };
    }
    if (row.state.trim().toLowerCase() !== state.trim().toLowerCase()) {
      return {
        ok: false,
        error: "This postal code does not match the selected province.",
      };
    }
    if (city && !cityMatchesLookupRow(row.city, city)) {
      const canon = row.city.split("(")[0]?.trim() ?? row.city;
      return {
        ok: false,
        error: `This postal code is for “${canon}” in ${row.state}. Change town/city to match (or pick another code).`,
      };
    }
    return { ok: true };
  }

  const bundled = BUNDLED_POSTCODES[iso];
  if (bundled?.length) {
    if (!postalInBundledList(iso, postalRaw)) {
      return {
        ok: false,
        error: "Choose a postal code from the list for this country.",
      };
    }
    return { ok: true };
  }

  if (postcodeValidatorExistsForCountry(iso)) {
    if (!postcodeValidator(postalRaw, iso)) {
      return {
        ok: false,
        error: "Postal code format is not valid for this country.",
      };
    }
    return { ok: true };
  }

  if (postalRaw.length < 2 || postalRaw.length > 20) {
    return { ok: false, error: "Enter a postal code (2–20 characters)." };
  }
  return { ok: true };
}

/** Same rules as {@link validateAddressRecordConsistency} using the checkout form shape. */
export function validateCheckoutAddressForm(
  a: CheckoutAddressForm,
): AddressConsistencyResult {
  return validateAddressRecordConsistency({
    country: a.country,
    state: a.state,
    city: a.city,
    postalCode: a.postalCode,
  });
}
