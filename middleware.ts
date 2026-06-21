import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Keep this a thin pass-through — do not clone `NextRequest` here (breaks refresh with type-only imports). */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin-ouhao|.*\\..*).*)"],
};
