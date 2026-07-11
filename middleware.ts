import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function withPathnameHeader(response: NextResponse, pathname: string) {
  response.headers.set("x-pathname", pathname);
  return response;
}

/** Apex → www (middleware preserves path; `next.config` `:path*` breaks on Cloudflare Workers). */
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host === "humpbuck.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "www.humpbuck.com";
    return withPathnameHeader(NextResponse.redirect(url, 308), pathname);
  }
  return withPathnameHeader(intlMiddleware(request), pathname);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin-ouhao|.*\\..*).*)"],
};
