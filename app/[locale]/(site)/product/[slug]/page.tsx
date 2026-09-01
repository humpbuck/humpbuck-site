import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { productHref } from "@/lib/product-path";
import { resolveProductForPdpSlug } from "@/lib/product-path-server";
import { permanentRedirectWithLocale } from "@/lib/storefront-redirect";

/**
 * Legacy PDP: `/product/{slug}` → 308 `/product/{category}/{slug}`.
 * Also recovers renamed compound slugs (e.g. digi-temp-2301 → ana-digi/2301).
 */
export default async function LegacyProductSlugRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await resolveProductForPdpSlug(slug);
  if (!product) notFound();

  await permanentRedirectWithLocale(productHref(product));
}
