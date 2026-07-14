import { OemOdmFactorySection } from "@/components/site/oem-odm-factory-section";
import { routing } from "@/i18n/routing";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "OemOdmPage" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/oem-odm`;
  const pageUrl = `${getSiteUrl()}${path}`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/oem-odm"),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [defaultOgImage.url],
    },
  };
}

export default async function OemOdmPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OemOdmFactorySection />;
}
