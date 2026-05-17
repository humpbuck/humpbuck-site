import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/** Revalidate a storefront pathname for every `[locale]` segment (`as-needed` + `/es/...`). */
export function revalidateStorefrontPath(pathname: string): void {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  revalidatePath(p);
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    revalidatePath(`/${locale}${p}`);
  }
}
