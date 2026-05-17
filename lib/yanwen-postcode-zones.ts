export function parseAustraliaPostcodeNumeric(value: string): number | null {
  const n = Number.parseInt(value.replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function deriveYanwenLaneZoneDigit(iso2: string, postalCode: string): string | null {
  void iso2;
  void postalCode;
  return null;
}
