import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WholesaleListingJsonLd } from "@/components/seo/wholesale-json-ld";
import { WholesalePageBody } from "@/components/site/wholesale-page-body";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { wholesaleListingPublicPath } from "@/lib/wholesale-listing-shared";
import { getActiveWholesaleListingBySlug } from "@/lib/wholesale-listings";
import { resolveWholesaleListingOgImage, wholesaleListingPageUrl } from "@/lib/wholesale-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const listing = await getActiveWholesaleListingBySlug(slug);
  if (!listing) {
    return { title: "Not found" };
  }
  const t = await getTranslations({ locale, namespace: "WholesalePage" });
  const path = wholesaleListingPublicPath(listing.slug);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const canonical = `${pathPrefix}${path}`;
  const pageUrl = wholesaleListingPageUrl(listing.slug, locale);
  const model = listing.modelNumber.trim() || t("listingsModalFallbackTitle");
  const title = t("listingMetaTitle", { model });
  const description = listing.description.trim() || t("metaDescription");
  const ogImage = resolveWholesaleListingOgImage(listing);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: storefrontHreflangLanguages(path),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description,
      siteName: "HUMPBUCK",
      images: [{ url: ogImage, width: 1200, height: 630, alt: model }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
  const t = await getTranslations("WholesalePage");

  return (
    <>
      <WholesaleListingJsonLd
        locale={locale}
        listing={listing}
        pageDescription={t("metaDescription")}
      />
      <WholesalePageBody locale={locale} initialOpenSlug={listing.slug} />
    </>
  );
}
