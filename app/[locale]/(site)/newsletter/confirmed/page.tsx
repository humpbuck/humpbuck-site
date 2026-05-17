import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NewsletterConfirmed" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function NewsletterConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { r } = await searchParams;
  const t = await getTranslations("NewsletterConfirmed");

  let title = t("titleSubscribed");
  let body = t("bodySubscribed");

  if (r === "invalid") {
    title = t("titleInvalid");
    body = t("bodyInvalid");
  } else if (r === "error" || r === "not_configured") {
    title = t("titleError");
    body = t("bodyError");
  } else if (r === "already") {
    title = t("titleAlready");
    body = t("bodyAlready");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
      <p className="mt-6 text-muted">{body}</p>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
