import { countryLabelToIso2 } from "@/lib/logistics-estimate";

type CountryFieldRule = {
  stateLabel?: string;
  postalLabel?: string;
  stateSelectPrompt?: string;
  stateSearchPlaceholder?: string;
  stateManualPlaceholder?: string;
  stateManualHint?: string;
  citySearchPlaceholder?: string;
  cityEmptyMessage?: string;
  cityHint?: string;
  postalSearchPlaceholder?: string;
  postalEmptyMessage?: string;
  postalNoCodeHint?: string;
};

const DEFAULT_RULE: Required<CountryFieldRule> = {
  stateLabel: "State / province",
  postalLabel: "Postal code",
  stateSelectPrompt: "Select state / province",
  stateSearchPlaceholder: "Search state / province...",
  stateManualPlaceholder: "Region, island, or district (as on official mail)",
  stateManualHint:
    "Type the subdivision carriers expect (state, province, island, parish, or territory).",
  citySearchPlaceholder: "Search or type...",
  cityEmptyMessage: "Open the list and search, or type if your area has no suggestions",
  cityHint:
    "Where we show a list, choose your town/city so the next step stays in range. Otherwise type as on official mail.",
  postalSearchPlaceholder: "Search or type postal code...",
  postalEmptyMessage: "Type to search or enter your postal code",
  postalNoCodeHint:
    "only if your area does not use one. If your country uses postal codes, type the official code above.",
};

const COUNTRY_RULES: Record<string, CountryFieldRule> = {
  US: {
    stateLabel: "State",
    postalLabel: "ZIP code",
    stateSelectPrompt: "Select state",
    stateSearchPlaceholder: "Search state...",
    postalSearchPlaceholder: "Search or type ZIP code...",
    postalEmptyMessage: "Type to search or enter your ZIP code",
  },
  CA: {
    stateLabel: "Province",
    stateSelectPrompt: "Select province",
    stateSearchPlaceholder: "Search province...",
    cityHint:
      "Use the same spelling as on official mail. Canada: city and postal code must match the postal database.",
  },
  AU: {
    stateLabel: "State / territory",
    postalLabel: "Postcode",
    stateSelectPrompt: "Select state / territory",
    stateSearchPlaceholder: "Search state / territory...",
    postalSearchPlaceholder: "Search or type postcode...",
    postalEmptyMessage: "Type to search or enter your postcode",
  },
  GB: {
    stateLabel: "County",
    postalLabel: "Postcode",
    stateSelectPrompt: "Select county",
    stateSearchPlaceholder: "Search county...",
    cityHint:
      "Type your town or city as on official mail. County is for routing; it does not need to match a suggestion list.",
    postalSearchPlaceholder: "Search or type postcode...",
    postalEmptyMessage: "Type to search or enter your postcode",
  },
  IE: {
    stateLabel: "County",
    postalLabel: "Eircode",
    stateSelectPrompt: "Select county",
    stateSearchPlaceholder: "Search county...",
    postalSearchPlaceholder: "Search or type Eircode...",
    postalEmptyMessage: "Type to search or enter your Eircode",
  },
  IN: {
    stateLabel: "State",
    postalLabel: "PIN code",
    stateSelectPrompt: "Select state",
    stateSearchPlaceholder: "Search state...",
    postalSearchPlaceholder: "Search or type PIN code...",
    postalEmptyMessage: "Type to search or enter your PIN code",
  },
  BR: {
    stateLabel: "State",
    postalLabel: "CEP",
    stateSelectPrompt: "Select state",
    stateSearchPlaceholder: "Search state...",
    postalSearchPlaceholder: "Search or type CEP...",
    postalEmptyMessage: "Type to search or enter your CEP",
  },
  JP: {
    stateLabel: "Prefecture",
    postalLabel: "Postal code",
    stateSelectPrompt: "Select prefecture",
    stateSearchPlaceholder: "Search prefecture...",
  },
  MX: {
    stateLabel: "State",
    postalLabel: "Postal code",
    stateSelectPrompt: "Select state",
    stateSearchPlaceholder: "Search state...",
  },
  CN: {
    stateLabel: "Province",
    stateSelectPrompt: "Select province",
    stateSearchPlaceholder: "Search province...",
  },
  RU: {
    stateLabel: "Region",
    stateSelectPrompt: "Select region",
    stateSearchPlaceholder: "Search region...",
  },
  NZ: {
    stateLabel: "Region",
    postalLabel: "Postcode",
    stateSelectPrompt: "Select region",
    stateSearchPlaceholder: "Search region...",
    postalSearchPlaceholder: "Search or type postcode...",
    postalEmptyMessage: "Type to search or enter your postcode",
  },
};

export type CheckoutCountryFieldRules = Required<CountryFieldRule>;

export function getCheckoutCountryFieldRules(
  countryName: string,
): CheckoutCountryFieldRules {
  const iso2 = countryLabelToIso2(countryName) ?? "";
  const r = COUNTRY_RULES[iso2] ?? {};
  return {
    ...DEFAULT_RULE,
    ...r,
  };
}
