import { postcodeValidator, postcodeValidatorExistsForCountry } from "postcode-validator";
import type { CheckoutAddressForm } from "@/lib/checkout-address";
import { normalizeUsStateCode } from "@/lib/us-state-codes";

export type CheckoutPostalValidationErrorKey =
  | "postalInvalidFormat"
  | "postalNotFound"
  | "postalStateMismatch";

/** First letter of a Canadian postal code → province/territory ISO codes. */
const CA_POSTAL_LETTER_TO_PROVINCES: Record<string, string[]> = {
  A: ["NL"],
  B: ["NS"],
  C: ["PE"],
  E: ["NB"],
  G: ["QC"],
  H: ["QC"],
  J: ["QC"],
  K: ["ON"],
  L: ["ON"],
  M: ["ON"],
  N: ["ON"],
  P: ["ON"],
  R: ["MB"],
  S: ["SK"],
  T: ["AB"],
  V: ["BC"],
  X: ["NT", "NU"],
  Y: ["YT"],
};

export function parseCheckoutCountryIso2(countryLabel: string): string {
  const trimmed = countryLabel.trim();
  const match = trimmed.match(/\(([A-Za-z]{2})\)\s*$/);
  if (match) return match[1].toUpperCase();
  const direct = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(direct)) return direct;
  return direct;
}

export function parseCheckoutStateCode(stateLabel: string, countryIso2: string): string {
  const trimmed = stateLabel.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/\(([A-Za-z]{2,3})\)\s*$/);
  if (match) return match[1].toUpperCase();
  if (countryIso2 === "US") {
    const normalized = normalizeUsStateCode(trimmed);
    if (normalized) return normalized;
  }
  return trimmed.toUpperCase();
}

function usZip5(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function normalizeCanadianPostal(postalCode: string): string {
  return postalCode.replace(/\s+/g, "").toUpperCase();
}

function auStateFromPostcode(postalCode: string): string | null {
  const digits = postalCode.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return null;

  if (n >= 800 && n <= 999) return "NT";
  if (n >= 1000 && n <= 2599) return "NSW";
  if (n >= 2600 && n <= 2618) return "ACT";
  if (n >= 2619 && n <= 2899) return "NSW";
  if (n >= 2900 && n <= 2920) return "ACT";
  if (n >= 2921 && n <= 2999) return "NSW";
  if (n >= 3000 && n <= 3999) return "VIC";
  if (n >= 4000 && n <= 4999) return "QLD";
  if (n >= 5000 && n <= 5999) return "SA";
  if (n >= 6000 && n <= 6999) return "WA";
  if (n >= 7000 && n <= 7999) return "TAS";
  if (n >= 8000 && n <= 8999) return "VIC";
  if (n >= 9000 && n <= 9999) return "QLD";
  return null;
}

function caProvincesFromPostal(postalCode: string): string[] | null {
  const normalized = normalizeCanadianPostal(postalCode);
  const letter = normalized[0];
  if (!letter || !/[A-Z]/.test(letter)) return null;
  return CA_POSTAL_LETTER_TO_PROVINCES[letter] ?? null;
}

function validateUsPostal(
  postalCode: string,
): { ok: true } | { ok: false; errorKey: CheckoutPostalValidationErrorKey } {
  const zip5 = usZip5(postalCode);
  if (zip5.length !== 5) {
    return { ok: false, errorKey: "postalInvalidFormat" };
  }
  return { ok: true };
}

function validateCaPostal(
  postalCode: string,
  stateLabel: string,
): { ok: true } | { ok: false; errorKey: CheckoutPostalValidationErrorKey } {
  const provinces = caProvincesFromPostal(postalCode);
  if (!provinces) {
    return { ok: false, errorKey: "postalInvalidFormat" };
  }

  const stateCode = parseCheckoutStateCode(stateLabel, "CA");
  if (stateCode && !provinces.includes(stateCode)) {
    return { ok: false, errorKey: "postalStateMismatch" };
  }

  return { ok: true };
}

function validateAuPostal(
  postalCode: string,
  stateLabel: string,
): { ok: true } | { ok: false; errorKey: CheckoutPostalValidationErrorKey } {
  const derivedState = auStateFromPostcode(postalCode);
  if (!derivedState) {
    return { ok: false, errorKey: "postalInvalidFormat" };
  }

  const stateCode = parseCheckoutStateCode(stateLabel, "AU");
  if (stateCode && derivedState !== stateCode) {
    return { ok: false, errorKey: "postalStateMismatch" };
  }

  return { ok: true };
}

export function validateCheckoutPostalCode(
  form: Pick<CheckoutAddressForm, "country" | "state" | "city" | "postalCode">,
):
  | { ok: true }
  | { ok: false; errorKey: CheckoutPostalValidationErrorKey } {
  const postalCode = form.postalCode.trim();
  if (!postalCode) return { ok: true };

  const countryIso2 = parseCheckoutCountryIso2(form.country);
  if (!countryIso2) return { ok: true };

  if (postcodeValidatorExistsForCountry(countryIso2)) {
    if (!postcodeValidator(postalCode, countryIso2)) {
      return { ok: false, errorKey: "postalInvalidFormat" };
    }
  }

  if (countryIso2 === "US") return validateUsPostal(postalCode);
  if (countryIso2 === "CA") return validateCaPostal(postalCode, form.state);
  if (countryIso2 === "AU") return validateAuPostal(postalCode, form.state);

  return { ok: true };
}
