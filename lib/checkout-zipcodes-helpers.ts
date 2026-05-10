export function normalizeCheckoutPostalCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
