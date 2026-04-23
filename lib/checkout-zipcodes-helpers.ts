import zipcodes from "zipcodes";

/**
 * Normalize checkout state dropdown value for `zipcodes.lookupByState` (US + Canada).
 */
export function normalizeUsCaState(
  iso2: string,
  stateValue: string,
): string | null {
  if (!stateValue.trim()) return null;
  try {
    if (iso2 === "US") {
      const t = stateValue.trim().toUpperCase();
      if (t.length === 2) return zipcodes.states.normalize(t);
      return zipcodes.states.normalize(t.replace(/\s+/g, " "));
    }
    if (iso2 === "CA") {
      return zipcodes.states.normalize(
        stateValue.trim().toUpperCase().replace(/\s+/g, " "),
      );
    }
  } catch {
    return null;
  }
  return null;
}

/** US ZIP: first five digits (ignores ZIP+4 for lookup). */
export function normalizeUsZip5(postal: string): string | null {
  const m = postal.trim().match(/^(\d{5})/);
  return m ? m[1] : null;
}

export function normalizeCanadianPostal(postal: string): string {
  return postal.replace(/\s+/g, "").toUpperCase();
}

type ZipLookupRow = { city: string; state: string; country?: string };

/**
 * USPS-style primary city for a ZIP (first segment before “(”), when the ZIP
 * belongs to the selected state. Used to keep city + ZIP consistent in checkout.
 */
export function usZipPrimaryCity(
  zipRaw: string,
  stateValue: string,
): string | null {
  const zip5 = normalizeUsZip5(zipRaw);
  if (!zip5 || !stateValue.trim()) return null;
  const row = zipcodes.lookup(zip5) as ZipLookupRow | undefined;
  if (!row || row.country !== "US") return null;
  const expect = normalizeUsCaState("US", stateValue);
  if (!expect || row.state.toUpperCase() !== expect.toUpperCase()) return null;
  return row.city.split("(")[0]?.trim() ?? row.city.trim();
}

/**
 * Primary city from Canadian postal lookup when province matches checkout state
 * (full province name, same as `validateAddressRecordConsistency`).
 */
export function caPostalPrimaryCity(
  postalRaw: string,
  provinceName: string,
): string | null {
  const norm = normalizeCanadianPostal(postalRaw);
  if (norm.length < 3 || !provinceName.trim()) return null;
  const row = zipcodes.lookup(norm) as ZipLookupRow | undefined;
  if (!row || row.country !== "Canada") return null;
  if (
    row.state.trim().toLowerCase() !== provinceName.trim().toLowerCase()
  ) {
    return null;
  }
  return row.city.split("(")[0]?.trim() ?? row.city.trim();
}
