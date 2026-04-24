/** When no env is set (e.g. local scripts), email links still point at the live site. */
const DEFAULT_EMAIL_SITE_ORIGIN = "https://www.humpbuck.com";

function isLocalDevOrigin(url: string): boolean {
  const t = url.trim().toLowerCase();
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    const h = u.hostname;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "[::1]" ||
      h.endsWith(".local")
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(t);
  }
}

/**
 * Site origin for absolute URLs inside outbound emails (admin, account, tracking,
 * images, unsubscribe).
 *
 * **Never uses `localhost` for links** — dev machines often set `NEXT_PUBLIC_APP_URL`
 * to `http://localhost:3000`, which would break links on phones (see Safari “cannot
 * connect to the server”).
 *
 * Precedence: `EMAIL_PUBLIC_BASE_URL` → `NEXT_PUBLIC_APP_URL` (if not local) →
 * `VERCEL_URL` → `https://www.humpbuck.com`.
 */
export function emailPublicBaseUrl(): string {
  const emailOnly = process.env.EMAIL_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (emailOnly) return emailOnly;

  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit && !isLocalDevOrigin(explicit)) return explicit;

  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    return v.startsWith("http://") || v.startsWith("https://")
      ? v
      : `https://${v}`;
  }
  return DEFAULT_EMAIL_SITE_ORIGIN;
}
