import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** Same-site redirect that preserves the active `[locale]` segment (`as-needed` default locale has no prefix). */
export async function redirectWithLocale(pathWithQuery: string): Promise<never> {
  const locale = await getLocale();
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  if (locale === routing.defaultLocale) {
    redirect(path);
  }
  redirect(`/${locale}${path}`);
}
