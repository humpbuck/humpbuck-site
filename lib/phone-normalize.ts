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
