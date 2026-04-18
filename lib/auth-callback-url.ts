/**
 * Safe post-login redirect: same-site relative paths only (open-redirect safe).
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (raw == null || raw === "") return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return fallback;
  }
  if (!decoded.startsWith("/")) return fallback;
  if (decoded.startsWith("//")) return fallback;
  if (decoded.includes("\\")) return fallback;
  if (decoded.includes("\0")) return fallback;
  const lower = decoded.toLowerCase();
  if (
    lower.startsWith("/javascript:") ||
    lower.startsWith("/data:") ||
    lower.startsWith("/vbscript:")
  ) {
    return fallback;
  }
  if (
    decoded.startsWith("/auth/login") ||
    decoded.startsWith("/auth/register") ||
    decoded.startsWith("/auth/forgot-password") ||
    decoded.startsWith("/auth/reset-password")
  ) {
    return fallback;
  }
  return decoded;
}

/**
 * Current path + query for use in ?callbackUrl= (caller should not pass auth pages).
 */
export function currentPathForCallback(
  pathname: string | null,
  searchParams: URLSearchParams | null,
): string {
  const path = pathname && pathname !== "" ? pathname : "/";
  const qs = searchParams?.toString() ?? "";
  return qs ? `${path}?${qs}` : path;
}

/** Login URL including callback when appropriate. */
export function buildLoginHref(
  pathname: string | null,
  searchParams: URLSearchParams | null,
): string {
  const path = pathname || "/";
  if (path.startsWith("/auth/")) {
    return "/auth/login";
  }
  const target = currentPathForCallback(pathname, searchParams);
  return `/auth/login?callbackUrl=${encodeURIComponent(target)}`;
}
