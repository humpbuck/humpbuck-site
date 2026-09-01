import { permanentRedirect, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

function localizedStorefrontPath(pathWithQuery: string, locale: string): string {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}

/** Same-site redirect that preserves the active `[locale]` segment (`as-needed` default locale has no prefix). */
export async function redirectWithLocale(pathWithQuery: string): Promise<never> {
  const locale = await getLocale();
  redirect(localizedStorefrontPath(pathWithQuery, locale));
}

/** Permanent (308) locale-aware redirect — use for SEO URL migrations. */
export async function permanentRedirectWithLocale(
  pathWithQuery: string,
): Promise<never> {
  const locale = await getLocale();
  permanentRedirect(localizedStorefrontPath(pathWithQuery, locale));
}
