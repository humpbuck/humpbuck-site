import { intlLocaleFromAppLocale } from "@/lib/site-locale";

export function localizedCountryLabel(iso2: string, appLocale: string): string {
  const intlTag = intlLocaleFromAppLocale(appLocale);
  try {
    return new Intl.DisplayNames([intlTag], { type: "region" }).of(iso2) ?? iso2;
  } catch {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(iso2) ?? iso2;
    } catch {
      return iso2;
    }
  }
}

export function formatStoredCountryLabel(iso2: string, appLocale: string): string {
  return `${localizedCountryLabel(iso2, appLocale)} (${iso2})`;
}

/** Parse ISO2 from stored `Label (US)` or bare `US`. */
export function parseCountryIsoFromStored(value: string): string | null {
  const trimmed = value.trim();
  const paren = trimmed.match(/\(([A-Z]{2})\)$/);
  if (paren) return paren[1];
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}
