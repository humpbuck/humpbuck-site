import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PolicyPages" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/refund`;
  return {
    title: t("refundMetaTitle"),
    description: t("refundMetaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/refund"),
    },
  };
}

export default async function RefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tPolicy = await getTranslations("PolicyPages");
  const t = await getTranslations("RefundPolicy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">{t("title")}</h1>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          {t.rich("introStrong", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p>{t("introEligibility")}</p>
      </div>

      <hr className="my-10 border-line" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("howToReturnHeading")}
          </h2>
          <p className="mt-4 text-ink/85">
            {t("returnStartA")}{" "}
            <a href="mailto:support@humpbuck.com" className={linkContact}>
              support@humpbuck.com
            </a>{" "}
            {t("returnStartB")}{" "}
            <a
              href={WHATSAPP_URL}
              className={linkContact}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("returnWhatsAppAt", { phone: WHATSAPP_DISPLAY })}
            </a>
            {t("returnStartC")}
          </p>
          <div className="mt-5 rounded-xl border border-line bg-paper/70 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("returnAddressLabel")}
            </p>
            <p className="mt-2 font-mono text-[13px] font-medium text-ink">
              {t("returnAddressPlaceholder")}
            </p>
          </div>
          <p className="mt-5 text-ink/85">{t("returnAfterAccept")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">{t("damagesHeading")}</h2>
          <p className="mt-4 text-ink/85">{t("damagesBody")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">{t("exceptionsHeading")}</h2>
          <p className="mt-4 text-ink/85">{t("exceptionsP1")}</p>
          <p className="mt-4 text-ink/85">{t("exceptionsP2")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">{t("exchangesHeading")}</h2>
          <p className="mt-4 text-ink/85">{t("exchangesBody")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">{t("eu14Heading")}</h2>
          <p className="mt-4 text-ink/85">{t("eu14Body")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">{t("refundsSectionHeading")}</h2>
          <p className="mt-4 text-ink/85">{t("refundsP1")}</p>
          <p className="mt-4 text-ink/85">{t("refundsP2")}</p>
        </section>

        <PolicyContactCard variant="refund" />
      </div>

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        {tPolicy("relatedLabel")}{" "}
        <Link
          href="/shipping"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {tPolicy("relatedShipping")}
        </Link>
      </p>
    </div>
  );
}
