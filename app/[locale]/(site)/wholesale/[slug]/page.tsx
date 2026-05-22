import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WholesalePageBody } from "@/components/site/wholesale-page-body";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { wholesaleListingPublicPath } from "@/lib/wholesale-listing-shared";
import { getActiveWholesaleListingBySlug } from "@/lib/wholesale-listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const listing = await getActiveWholesaleListingBySlug(slug);
  if (!listing) {
    return { title: "Not found" };
  }
  const t = await getTranslations({ locale, namespace: "WholesalePage" });
  const path = wholesaleListingPublicPath(listing.slug);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const canonical = `${pathPrefix}${path}`;
  const model = listing.modelNumber.trim() || t("listingsModalFallbackTitle");
  return {
    title: t("listingMetaTitle", { model }),
    description: listing.description.trim() || t("metaDescription"),
    alternates: {
      canonical,
      languages: storefrontHreflangLanguages(path),
    },
  };
}

export default async function WholesaleListingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const listing = await getActiveWholesaleListingBySlug(slug);
  if (!listing) notFound();

  return <WholesalePageBody locale={locale} initialOpenSlug={listing.slug} />;
}
