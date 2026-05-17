import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/components/providers/app-providers";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { R2_PUBLIC_BASE } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";

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
  const ogLocale = locale === "es" ? "es_ES" : "en_US";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "HUMPBUCK — DIGI-TEMP Ana-Digi Watches & RM-TONNEAU",
      template: "%s · HUMPBUCK",
    },
    description:
      "HUMPBUCK DIGI-TEMP flagship ana-digi watches — dual LCD, TIME/DATE/ALM/OUT/STW modes, stainless steel, mineral glass, 30 m WR. RM-TONNEAU barrel-case line & wholesale programs.",
    applicationName: "HUMPBUCK",
    authors: [{ name: "HUMPBUCK" }],
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: siteUrl,
      siteName: "HUMPBUCK",
      title: "HUMPBUCK — DIGI-TEMP & RM-TONNEAU",
      description:
        "Official DIGI-TEMP ana-digi collection plus RM-TONNEAU quartz. Factory programs available.",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: "HUMPBUCK — DIGI-TEMP & RM-TONNEAU",
      description:
        "Official DIGI-TEMP ana-digi collection plus RM-TONNEAU quartz. Factory programs available.",
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
      data-scroll-behavior="smooth"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full`}
    >
      <head>
        <link rel="preconnect" href={R2_PUBLIC_BASE} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={R2_PUBLIC_BASE} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <OrganizationJsonLd />
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
