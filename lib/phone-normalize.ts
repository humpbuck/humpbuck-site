import metadata from "libphonenumber-js/metadata.min.json";

type PhoneMetadata = {
  country_calling_codes?: Record<string, string[]>;
};

const parsedMetadata = metadata as PhoneMetadata;
const globalCallingCodeKeys = Object.keys(parsedMetadata.country_calling_codes ?? {});

/** Global unique country calling codes from libphonenumber metadata. */
export const PHONE_COUNTRY_CODES = globalCallingCodeKeys
  .map((code) => `+${code}`)
  .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
export const PHONE_COUNTRY_CODE_DATALIST_ID = "phone-country-codes";

export function normalizeCountryCodeInput(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 4);
  if (!digits) return "";
  return `+${digits}`;
}

export function splitPhoneForInput(phone: string | null | undefined): {
  countryCode: string;
  localNumber: string;
} {
  const raw = (phone ?? "").trim();
  if (!raw) return { countryCode: "+86", localNumber: "" };
  const compact = raw.replace(/\s+/g, "");
  const match = compact.match(/^(\+\d{1,4})(\d+)$/);
  if (match) return { countryCode: match[1], localNumber: match[2] };
  return { countryCode: "+86", localNumber: compact.replace(/[^\d]/g, "") };
}

export function normalizePhone(countryCode: string, localNumber: string): string {
  const cc = countryCode.trim().replace(/[^\d+]/g, "");
  const local = localNumber.trim().replace(/[^\d]/g, "");
  if (!local) return "";
  const normalizedCode = cc.startsWith("+") ? cc : `+${cc.replace(/[+]/g, "")}`;
  return `${normalizedCode}${local}`;
}
