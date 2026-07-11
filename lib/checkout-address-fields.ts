/** Countries where checkout shows a state/province combobox (suggestions + free text, required). */
const STATE_COMBOBOX_ISO2 = new Set(["US", "CA", "AU", "BR", "MX"]);

export function isStateComboboxCountry(countryIso2: string | null | undefined): boolean {
  if (!countryIso2) return false;
  return STATE_COMBOBOX_ISO2.has(countryIso2.trim().toUpperCase());
}

/** Required only for {@link isStateComboboxCountry}; optional plain text elsewhere. */
export function isStateRequiredForCountry(countryIso2: string | null | undefined): boolean {
  return isStateComboboxCountry(countryIso2);
}
