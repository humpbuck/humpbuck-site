import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Apex → www (middleware preserves path; `next.config` `:path*` breaks on Cloudflare Workers). */
export default function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host === "humpbuck.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "www.humpbuck.com";
    return NextResponse.redirect(url, 308);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin-ouhao|.*\\..*).*)"],
};
