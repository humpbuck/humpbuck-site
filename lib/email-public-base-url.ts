/** When no env is set (e.g. local scripts), email links still point at the live site. */
const DEFAULT_EMAIL_SITE_ORIGIN = "https://www.humpbuck.com";

/**
 * Site origin for absolute URLs inside outbound emails (admin, account, tracking,
 * images, unsubscribe). Avoids `localhost` in real inboxes when `.env` is incomplete.
 *
 * Precedence: `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` (https) → `https://www.humpbuck.com`.
 */
export function emailPublicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    return v.startsWith("http://") || v.startsWith("https://")
      ? v
      : `https://${v}`;
  }
  return DEFAULT_EMAIL_SITE_ORIGIN;
}
