import { Country } from "country-state-city";
import { countryLabel, formatShippingRateDisplay } from "@/lib/country-labels";

export const AU_SHIPPING_RATE_KEY_ZONE_12 = "AU-Z1-2";
export const AU_SHIPPING_RATE_KEY_ZONE_34 = "AU-Z3-4";

export type ShippingFeeCountryOption = {
  value: string;
  label: string;
  /** English / official name for search. */
  englishName: string;
  /** Chinese label for search / display. */
  zhLabel: string;
};

function displayCountryName(iso2: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

export function isValidShippingRateKey(key: string): boolean {
  const normalized = key.trim().toUpperCase();
  if (normalized === AU_SHIPPING_RATE_KEY_ZONE_12 || normalized === AU_SHIPPING_RATE_KEY_ZONE_34) {
    return true;
  }
  return /^[A-Z]{2}$/.test(normalized);
}

export function formatShippingRateKeyLabel(rateKey: string): string {
  const key = rateKey.trim().toUpperCase();
  if (key === AU_SHIPPING_RATE_KEY_ZONE_12) return "Australia Zone 1-2";
  if (key === AU_SHIPPING_RATE_KEY_ZONE_34) return "Australia Zone 3-4";
  return displayCountryName(key);
}

function buildOption(value: string, englishName: string): ShippingFeeCountryOption {
  const zhLabel =
    value === AU_SHIPPING_RATE_KEY_ZONE_12 || value === AU_SHIPPING_RATE_KEY_ZONE_34
      ? "澳大利亚"
      : countryLabel(value);
  return {
    value,
    englishName,
    zhLabel,
    label: formatShippingRateDisplay(value, englishName),
  };
}

/** Same country list as checkout (`country-state-city`), plus AU postal zone rows. */
export function listShippingFeeCountryOptions(): ShippingFeeCountryOption[] {
  const countries = Country.getAllCountries()
    .filter((item) => item.isoCode !== "AU")
    .map((item) => buildOption(item.isoCode, item.name))
    .sort((a, b) => a.englishName.localeCompare(b.englishName, "en"));

  return [
    buildOption(AU_SHIPPING_RATE_KEY_ZONE_12, "Australia Zone 1-2"),
    buildOption(AU_SHIPPING_RATE_KEY_ZONE_34, "Australia Zone 3-4"),
    ...countries,
  ];
}

export function countryNameForShippingRateKey(rateKey: string): string {
  return formatShippingRateKeyLabel(rateKey);
}

export function shippingRateMatchesQuery(
  option: Pick<ShippingFeeCountryOption, "value" | "englishName" | "zhLabel" | "label">,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (option.value.toLowerCase().includes(q)) return true;
  if (option.englishName.toLowerCase().includes(q)) return true;
  if (option.zhLabel.toLowerCase().includes(q)) return true;
  if (option.label.toLowerCase().includes(q)) return true;
  return false;
}
