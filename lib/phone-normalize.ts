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

export function normalizeCountryCodeInput(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 4);
  if (!digits) return "";
  return `+${digits}`;
}

export function resolveCountryCodeInput(selected: string, manual: string): string {
  return normalizeCountryCodeInput(manual) || selected;
}

export function splitPhoneForInput(phone: string | null | undefined): {
  countryCode: string;
  localNumber: string;
} {
  const raw = (phone ?? "").trim();
  if (!raw) return { countryCode: "+1", localNumber: "" };
  const compact = raw.replace(/\s+/g, "");
  const match = compact.match(/^(\+\d{1,4})(\d+)$/);
  if (match) return { countryCode: match[1], localNumber: match[2] };
  return { countryCode: "+1", localNumber: compact.replace(/[^\d]/g, "") };
}

export function normalizePhone(countryCode: string, localNumber: string): string {
  const cc = countryCode.trim().replace(/[^\d+]/g, "");
  const local = localNumber.trim().replace(/[^\d]/g, "");
  if (!local) return "";
  const normalizedCode = cc.startsWith("+") ? cc : `+${cc.replace(/[+]/g, "")}`;
  return `${normalizedCode}${local}`;
}
