import { getSiteUrl } from "@/lib/seo";
import type { WholesaleListingRow } from "@/lib/wholesale-listing-shared";
import { wholesaleIndexPageUrl, wholesaleListingPageUrl } from "@/lib/wholesale-seo";

type WholesaleIndexJsonLdProps = {
  locale: string;
  pageName: string;
  pageDescription: string;
  listings: WholesaleListingRow[];
};

/** WebPage + ItemList for `/wholesale` — helps Google discover live B2B models. */
export function WholesaleIndexJsonLd({
  locale,
  pageName,
  pageDescription,
  listings,
}: WholesaleIndexJsonLdProps) {
  const siteUrl = getSiteUrl();
  const pageUrl = wholesaleIndexPageUrl(locale);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageName,
        description: pageDescription,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: locale,
      },
      ...(listings.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#listings`,
              name: pageName,
              numberOfItems: listings.length,
              itemListElement: listings.map((listing, index) => {
                const itemUrl = wholesaleListingPageUrl(listing.slug, locale);
                const name = listing.modelNumber.trim() || listing.slug;
                return {
                  "@type": "ListItem",
                  position: index + 1,
                  url: itemUrl,
                  name,
                };
              }),
            },
          ]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type WholesaleListingJsonLdProps = {
  locale: string;
  listing: WholesaleListingRow;
  pageDescription: string;
};

/** Product + Offer for `/wholesale/[slug]` deep links and social shares. */
export function WholesaleListingJsonLd({
  locale,
  listing,
  pageDescription,
}: WholesaleListingJsonLdProps) {
  const pageUrl = wholesaleListingPageUrl(listing.slug, locale);
  const name = listing.modelNumber.trim() || listing.slug;
  const image = listing.mediaUrls.find((u) => u.trim())?.trim();

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name,
    description: listing.description.trim() || pageDescription,
    url: pageUrl,
    ...(image ? { image: [image] } : {}),
    brand: {
      "@type": "Brand",
      name: "HUMPBUCK",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "USD",
      price: listing.priceUsd.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "HUMPBUCK",
        url: getSiteUrl(),
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
