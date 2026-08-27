import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { WATCHES_PATH } from "@/lib/storefront-watch-categories";

/** Legacy catalog URL — permanent home is `/watches` (also redirected in next.config). */
export default async function ProductCatalogRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dest =
    locale === routing.defaultLocale
      ? WATCHES_PATH
      : `/${locale}${WATCHES_PATH}`;
  redirect(dest);
}
