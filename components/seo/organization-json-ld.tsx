import { getLocale, getTranslations } from "next-intl/server";
import { R2 } from "@/lib/r2";
import { getSiteUrl } from "@/lib/seo";

function schemaLanguage(locale: string): string {
  const map: Record<string, string> = {
    ar: "ar-SA",
    de: "de-DE",
    es: "es-ES",
    fr: "fr-FR",
    he: "he-IL",
    hu: "hu-HU",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    nl: "nl-NL",
    pt: "pt-BR",
    ru: "ru-RU",
  };
  return map[locale] ?? "en-US";
}

/** WebSite + Organization JSON-LD for Google rich context (not a replacement for PDP Product schema). */
export async function OrganizationJsonLd() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "SiteMetadata" });
  const url = getSiteUrl();
  const description = t("descriptionDefault");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: "HUMPBUCK",
        description,
        publisher: { "@id": `${url}/#organization` },
        inLanguage: schemaLanguage(locale),
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "HUMPBUCK",
        url,
        logo: R2.home.digitemp2301Webp,
        description: t("titleDefault"),
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
