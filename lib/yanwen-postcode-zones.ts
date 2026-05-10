export function parseAustraliaPostcodeNumeric(value: string): number | null {
  const n = Number.parseInt(value.replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function deriveYanwenLaneZoneDigit(_iso2: string, _postalCode: string): string | null {
  return null;
}
