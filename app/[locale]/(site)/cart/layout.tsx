import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${pathPrefix}/cart`,
      languages: storefrontHreflangLanguages("/cart"),
    },
    robots: { index: false, follow: false },
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
