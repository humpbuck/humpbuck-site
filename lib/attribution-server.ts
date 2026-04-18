/** Normalize client-submitted traffic slug for persistence. */

export function sanitizeTrafficSource(raw: unknown): string {
  if (raw === undefined || raw === null) return "unknown";
  const s = String(raw).trim().toLowerCase().slice(0, 64);
  if (!s) return "unknown";
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(s)) return "unknown";
  return s;
}
