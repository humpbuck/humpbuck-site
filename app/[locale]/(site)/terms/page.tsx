import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TermsBodyEn } from "@/components/site/terms-body-en";
import { TermsBodyEs } from "@/components/site/terms-body-es";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PolicyPages" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/terms`;
  return {
    title: t("termsMetaTitle"),
    description: t("termsMetaDescription"),
    alternates: {
      canonical: path,
      languages: {
        en: `${getSiteUrl()}/terms`,
        es: `${getSiteUrl()}/es/terms`,
      },
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PolicyPages");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        {t("termsMetaTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {t("lastUpdated", { date: t("termsLastUpdatedDate") })}
      </p>

      {locale === routing.defaultLocale ? <TermsBodyEn /> : <TermsBodyEs />}

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        {t("relatedLabel")}{" "}
        <Link
          href="/privacy"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {t("relatedPrivacy")}
        </Link>
        {" · "}
        <Link
          href="/refund"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {t("relatedRefund")}
        </Link>
        {" · "}
        <Link
          href="/shipping"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {t("relatedShipping")}
        </Link>
      </p>
    </div>
  );
}
