export const PHONE_COUNTRY_CODES = [
  "+86",
  "+1",
  "+44",
  "+61",
  "+65",
  "+81",
  "+82",
  "+852",
  "+853",
  "+886",
];

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
