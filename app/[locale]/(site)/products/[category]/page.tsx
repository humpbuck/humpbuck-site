import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  buildWatchCollectionMetadata,
  WatchCollectionPage,
} from "@/components/site/watch-collection-page";
import {
  isProductPathCategory,
  productHref,
} from "@/lib/product-path";
import { resolveProductForPdpSlug } from "@/lib/product-path-server";
import { permanentRedirectWithLocale } from "@/lib/storefront-redirect";

export const revalidate = false;

/**
 * `/products/{category}` — fixed collection landing (e.g. `/products/analog`).
 * `/products/{slug}` — legacy PDP → 308 `/products/{category}/{slug}`.
 *
 * Param must be named `category` to match `products/[category]/[slug]`
 * (Next.js forbids conflicting dynamic names at the same path depth).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (isProductPathCategory(category)) {
    return buildWatchCollectionMetadata(locale, category);
  }
  return {};
}

export default async function ProductsCategoryOrLegacySlugPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: segment } = await params;
  setRequestLocale(locale);

  if (isProductPathCategory(segment)) {
    return <WatchCollectionPage locale={locale} categorySlug={segment} />;
  }

  const product = await resolveProductForPdpSlug(segment);
  if (!product) notFound();

  await permanentRedirectWithLocale(productHref(product));
}
