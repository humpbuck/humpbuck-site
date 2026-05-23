import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { WholesalePageBody } from "@/components/site/wholesale-page-body";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { listActiveWholesaleListings } from "@/lib/wholesale-listings";
import { resolveWholesaleOgImage, wholesaleIndexPageUrl } from "@/lib/wholesale-seo";

/** Listings and OG image should reflect daily stock updates. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "WholesalePage" });
  const messages = await getMessages({ locale });
  const wholesaleMessages = messages.WholesalePage as Record<string, string | undefined>;
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/wholesale`;
  const pageUrl = wholesaleIndexPageUrl(locale);
  const listings = await listActiveWholesaleListings();
  const ogImage = resolveWholesaleOgImage(listings);
  const ogTitle = wholesaleMessages.ogTitle ?? t("metaTitle");

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/wholesale"),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: ogTitle,
      description: t("metaDescription"),
      siteName: "HUMPBUCK",
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: t("metaDescription"),
      images: [ogImage],
    },
  };
}

export default async function WholesalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <WholesalePageBody locale={locale} />;
}
