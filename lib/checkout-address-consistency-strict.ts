import { City, State } from "country-state-city";
import {
  validateAddressRecordConsistency,
  type AddressConsistencyResult,
} from "@/lib/checkout-address-consistency";
import { countryLabelToIso2 } from "@/lib/logistics-estimate";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  const byCode = states.find(
    (s) => s.isoCode.toUpperCase() === v.toUpperCase(),
  );
  return byCode?.isoCode ?? null;
}

function cityMatchesKnownList(known: string, input: string): boolean {
  const a = normalize(input);
  const b = normalize(known.split("(")[0] ?? known);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const at = new Set(a.split(" ").filter((x) => x.length > 1));
  const bt = new Set(b.split(" ").filter((x) => x.length > 1));
  for (const t of at) {
    if (bt.has(t)) return true;
  }
  return false;
}

/**
 * Strict server-side validation used before order creation.
 *
 * Adds state->city consistency checks where `country-state-city` has authoritative
 * data for the selected state. If no city list exists, falls back to baseline checks.
 */
export function validateAddressRecordConsistencyStrict(
  rec: Record<string, string>,
): AddressConsistencyResult {
  const base = validateAddressRecordConsistency(rec);
  if (!base.ok) return base;

  const country = String(rec.country ?? "").trim();
  const iso2 = countryLabelToIso2(country);
  if (!iso2) return { ok: false, error: "Select a valid country / region." };

  const state = String(rec.state ?? "").trim();
  const city = String(rec.city ?? "").trim();
  if (!state || !city) return { ok: true };

  const stateIso = resolveStateIso(iso2, state);
  if (!stateIso) return { ok: true };

  const cities = City.getCitiesOfState(iso2, stateIso);
  if (!cities?.length) return { ok: true };

  const ok = cities.some((c) => cityMatchesKnownList(c.name, city));
  if (!ok) {
    return {
      ok: false,
      error:
        "Town / city does not match the selected state / province for this country.",
    };
  }
  return { ok: true };
}
