/**
 * U.S. minor outlying areas & uninhabited territories in `country-state-city` use
 * ISO 3166-2 codes `UM` and `UM-##`. Cainiao / Yanwen economy products are priced
 * for ordinary U.S. delivery — these destinations are not serviceable on those lines.
 *
 * Checkout stores the state *value* as this code for United States (see
 * `getStateProvinceOptionsForCountry`).
 */
export function isUsStateExcludedFromEconomyCarriers(
  stateValue: string | null | undefined,
): boolean {
  const v = (stateValue ?? "").trim().toUpperCase();
  if (!v) return false;
  if (v === "UM") return true;
  return /^UM-\d{2}$/.test(v);
}
