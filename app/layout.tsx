import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { R2_PUBLIC_BASE } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { VercelObservabilityClient } from "@/components/site/vercel-observability";

const fontBody = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

const fontDisplay = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "SiteMetadata" });
  const ogLocale =
    locale === "es"
      ? "es_ES"
      : locale === "pt"
        ? "pt_BR"
        : locale === "ru"
          ? "ru_RU"
          : locale === "fr"
            ? "fr_FR"
            : locale === "it"
              ? "it_IT"
              : locale === "nl"
                ? "nl_NL"
                : locale === "hu"
                  ? "hu_HU"
                  : locale === "ko"
                    ? "ko_KR"
                    : locale === "de"
                      ? "de_DE"
                      : locale === "ja"
                        ? "ja_JP"
                        : locale === "he"
                          ? "he_IL"
                          : locale === "ar"
                            ? "ar_SA"
                            : "en_US";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("titleDefault"),
      template: "%s · HUMPBUCK",
    },
    description: t("descriptionDefault"),
    applicationName: "HUMPBUCK",
    authors: [{ name: "HUMPBUCK" }],
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: siteUrl,
      siteName: "HUMPBUCK",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={locale === "he" || locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href={R2_PUBLIC_BASE} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={R2_PUBLIC_BASE} />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <OrganizationJsonLd />
        <AppProviders>{children}</AppProviders>
        {process.env.VERCEL === "1" ? <VercelObservabilityClient /> : null}
      </body>
    </html>
  );
}
