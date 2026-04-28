import metadata from "libphonenumber-js/metadata.min.json";

type PhoneMetadata = {
  country_calling_codes?: Record<string, string[]>;
};

const parsedMetadata = metadata as PhoneMetadata;
const globalCallingCodeKeys = Object.keys(parsedMetadata.country_calling_codes ?? {});

/** Global unique country calling codes from libphonenumber metadata. */
export const PHONE_COUNTRY_CODES = globalCallingCodeKeys
  .map((code) => `+${code}`)
  .sort((a, b) => {
    const aDigits = a.slice(1);
    const bDigits = b.slice(1);
    const aFirst = aDigits[0] ?? "";
    const bFirst = bDigits[0] ?? "";
    if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);
    return Number(aDigits) - Number(bDigits);
  });
export const PHONE_COUNTRY_CODE_DATALIST_ID = "phone-country-codes";

export type PhoneValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

export function normalizeCountryCodeInput(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 3);
  if (!digits) return "";
  return `+${digits}`;
}

export function splitPhoneForInput(phone: string | null | undefined): {
  countryCode: string;
  localNumber: string;
} {
  const raw = (phone ?? "").trim();
  if (!raw) return { countryCode: "", localNumber: "" };
  const compact = raw.replace(/\s+/g, "");
  if (compact.startsWith("+")) {
    const digitsOnly = compact.slice(1).replace(/[^\d]/g, "");
    if (/^\+\d{1,3}$/.test(compact)) {
      return { countryCode: compact, localNumber: "" };
    }
    const matchedCode = PHONE_COUNTRY_CODES
      .map((c) => c.slice(1))
      .sort((a, b) => b.length - a.length)
      .find((codeDigits) => digitsOnly.startsWith(codeDigits) && digitsOnly.length > codeDigits.length);
    if (matchedCode) {
      return {
        countryCode: `+${matchedCode}`,
        localNumber: digitsOnly.slice(matchedCode.length),
      };
    }
    const fallback = compact.match(/^(\+\d{1,3})(\d+)$/);
    if (fallback) return { countryCode: fallback[1], localNumber: fallback[2] };
  }
  return { countryCode: "", localNumber: compact.replace(/[^\d]/g, "") };
}

export function normalizePhone(countryCode: string, localNumber: string): string {
  const cc = countryCode.trim().replace(/[^\d+]/g, "");
  const local = localNumber.trim().replace(/[^\d]/g, "");
  if (!local) return "";
  const normalizedCode = cc.startsWith("+") ? cc : `+${cc.replace(/[+]/g, "")}`;
  return `${normalizedCode}${local}`;
}

export function validateInternationalPhone(
  phone: string | null | undefined,
  opts?: { required?: boolean; label?: string },
): PhoneValidationResult {
  const label = opts?.label?.trim() || "Phone number";
  const required = opts?.required !== false;
  const raw = String(phone ?? "").trim();
  if (!raw) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, normalized: "" };
  }
  const compact = raw.replace(/\s+/g, "");
  const parts = splitPhoneForInput(compact);
  const ccDigits = parts.countryCode.replace(/[^\d]/g, "");
  const localDigits = parts.localNumber.replace(/[^\d]/g, "");
  if (!ccDigits || !localDigits) {
    return {
      ok: false,
      error: `${label} must include country code and local number.`,
    };
  }
  if (ccDigits.length < 1 || ccDigits.length > 3) {
    return {
      ok: false,
      error: `${label} country code must be 1-3 digits.`,
    };
  }
  if (localDigits.length < 4 || localDigits.length > 14) {
    return {
      ok: false,
      error: `${label} local number must be 4-14 digits.`,
    };
  }
  const total = ccDigits.length + localDigits.length;
  if (total < 6 || total > 15) {
    return {
      ok: false,
      error: `${label} total digits must be 6-15.`,
    };
  }
  return { ok: true, normalized: `+${ccDigits}${localDigits}` };
}
