import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { LazyCartDrawer } from "@/components/cart/lazy-cart-drawer";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { VercelObservabilityClient } from "@/components/site/vercel-observability";
import { routing } from "@/i18n/routing";
import { BASE_CLIENT_NAMESPACES, pickClientMessages } from "@/lib/client-messages";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { R2_ASSETS_PUBLIC_BASE, R2_PUBLIC_BASE } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Return `[]` so build-time `cf-build` (which has no D1 binding) does not bake
 * empty-catalog HTML; public retail routes under `[locale]` render on-demand
 * via ISR on Cloudflare Workers with live D1 and cache in R2 + Regional Cache.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
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

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const clientMessages = pickClientMessages(messages, BASE_CLIENT_NAMESPACES);

  return (
    <html
      lang={locale}
      dir={locale === "he" || locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href={R2_ASSETS_PUBLIC_BASE} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={R2_ASSETS_PUBLIC_BASE} />
        <link rel="preconnect" href={R2_PUBLIC_BASE} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={R2_PUBLIC_BASE} />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <OrganizationJsonLd locale={locale} />
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <AppProviders>
            {children}
            <LazyCartDrawer />
          </AppProviders>
        </NextIntlClientProvider>
        {process.env.VERCEL === "1" ? <VercelObservabilityClient /> : null}
      </body>
    </html>
  );
}
