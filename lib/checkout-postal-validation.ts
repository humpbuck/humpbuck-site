import { postcodeValidator, postcodeValidatorExistsForCountry } from "postcode-validator";
import zipcodes from "zipcodes";
import type { CheckoutAddressForm } from "@/lib/checkout-address";

export type CheckoutPostalValidationErrorKey =
  | "postalInvalidFormat"
  | "postalNotFound"
  | "postalStateMismatch";

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
    const normalized = zipcodes.states.normalize(trimmed);
    if (normalized) return normalized;
  }
  return trimmed.toUpperCase();
}

function usZip5(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, "");
  return digits.slice(0, 5);
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

  if (countryIso2 !== "US") return { ok: true };

  const zip5 = usZip5(postalCode);
  if (zip5.length !== 5) {
    return { ok: false, errorKey: "postalInvalidFormat" };
  }

  const found = zipcodes.lookup(zip5);
  if (!found) {
    return { ok: false, errorKey: "postalNotFound" };
  }

  const stateCode = parseCheckoutStateCode(form.state, countryIso2);
  if (stateCode && found.state !== stateCode) {
    return { ok: false, errorKey: "postalStateMismatch" };
  }

  return { ok: true };
}
