import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { productHref } from "@/lib/product-path";
import { resolveProductForPdpSlug } from "@/lib/product-path-server";
import { permanentRedirectWithLocale } from "@/lib/storefront-redirect";

/**
 * Legacy PDP: `/product/{slug}` → 308 `/product/{category}/{slug}`.
 *
 * Param must be named `category` to match `product/[category]/[slug]`
 * (Next.js forbids conflicting dynamic names at the same path depth).
 * The single segment here is the old model slug, not a category.
 */
export default async function LegacyProductSlugRedirect({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);

  const product = await resolveProductForPdpSlug(slug);
  if (!product) notFound();

  await permanentRedirectWithLocale(productHref(product));
}
