import { Country } from "country-state-city";

export const AU_SHIPPING_RATE_KEY_ZONE_12 = "AU-Z1-2";
export const AU_SHIPPING_RATE_KEY_ZONE_34 = "AU-Z3-4";

export type ShippingFeeCountryOption = {
  value: string;
  label: string;
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

/** Same country list as checkout (`country-state-city`), plus AU postal zone rows. */
export function listShippingFeeCountryOptions(): ShippingFeeCountryOption[] {
  const countries = Country.getAllCountries()
    .filter((item) => item.isoCode !== "AU")
    .map((item) => ({
      value: item.isoCode,
      label: `${item.name} (${item.isoCode})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));

  return [
    {
      value: AU_SHIPPING_RATE_KEY_ZONE_12,
      label: "Australia Zone 1-2",
    },
    {
      value: AU_SHIPPING_RATE_KEY_ZONE_34,
      label: "Australia Zone 3-4",
    },
    ...countries,
  ];
}

export function countryNameForShippingRateKey(rateKey: string): string {
  return formatShippingRateKeyLabel(rateKey);
}
