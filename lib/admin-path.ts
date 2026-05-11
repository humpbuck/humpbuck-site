/**
 * Public admin UI base path (no trailing slash). Default: `/admin-ouhao`.
 * Set `NEXT_PUBLIC_ADMIN_PATH` in `.env` / Vercel to change (e.g. `"/backoffice"`). Rebuild after changing.
 */
function readAdminPath(): string {
  return "/admin-ouhao";
}

export const ADMIN_PATH = readAdminPath();

/** Join admin base with a path such as `"/orders"` or `"/orders/abc"`. */
export function adminPath(relative: string = ""): string {
  if (!relative || relative === "/") return ADMIN_PATH;
  const r = relative.startsWith("/") ? relative : `/${relative}`;
  return `${ADMIN_PATH}${r}`;
}

export function adminLoginPath(): string {
  return adminPath("/login");
}
