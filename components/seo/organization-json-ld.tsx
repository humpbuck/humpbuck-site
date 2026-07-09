import { R2 } from "@/lib/r2";
import { getSiteUrl } from "@/lib/seo";

/** WebSite + Organization JSON-LD for Google rich context (not a replacement for PDP Product schema). */
export function OrganizationJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: "HUMPBUCK",
        description:
          "Handcrafted timepieces designed to stay by your side and witness life's meaningful moments.",
        publisher: { "@id": `${url}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "HUMPBUCK",
        url,
        logo: R2.home.digitemp2301Webp,
        description:
          "HUMPBUCK Watches — meaningful gifts of time and love. Handcrafted timepieces for life's meaningful moments.",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
