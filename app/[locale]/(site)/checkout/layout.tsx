import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CHECKOUT_CLIENT_NAMESPACES, pickClientMessages } from "@/lib/client-messages";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${pathPrefix}/checkout`,
      languages: storefrontHreflangLanguages("/checkout"),
    },
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const clientMessages = pickClientMessages(messages, CHECKOUT_CLIENT_NAMESPACES);

  return (
    <NextIntlClientProvider locale={locale} messages={clientMessages}>
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://www.paypal.com" />
      {children}
    </NextIntlClientProvider>
  );
}
