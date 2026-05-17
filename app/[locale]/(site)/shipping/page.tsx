import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

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
  const path = `${pathPrefix}/shipping`;
  return {
    title: t("shippingMetaTitle"),
    description: t("shippingMetaDescription"),
    alternates: {
      canonical: path,
      languages: {
        en: `${getSiteUrl()}/shipping`,
        es: `${getSiteUrl()}/es/shipping`,
      },
    },
  };
}

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("PolicyPages");
  const t = await getTranslations("ShippingPolicy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        {tNav("shippingMetaTitle")}
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          {t.rich("intro", {
            site: (chunks) => (
              <a
                href="https://humpbuck.com/"
                className={linkContact}
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>

      <hr className="my-10 border-line" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("processingHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("processingP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("shippingOptionsHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("shippingOptionsP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("trackingHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("trackingIntro")}</p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>{t("trackingLi1")}</li>
            <li>{t("trackingLi2")}</li>
            <li>{t("trackingLi3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("customsHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("customsP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("indiaHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("indiaP")}</p>
          <ol className="mt-6 list-decimal space-y-6 pl-5 text-ink/85 marker:font-semibold">
            <li>
              <p className="font-semibold text-ink">{t("indiaStep1Title")}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-ink/40">
                <li>{t("indiaStep1Li1")}</li>
                <li className="italic text-ink/75">{t("indiaStep1Note")}</li>
              </ul>
            </li>
            <li>
              {t.rich("indiaStep2", {
                kycEmail: (chunks) => (
                  <a href="mailto:kyc@morningglobal.com" className={linkContact}>
                    {chunks}
                  </a>
                ),
              })}
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("taxesHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("taxesP")}</p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              {t.rich("taxesLi1", {
                phone: WHATSAPP_DISPLAY,
                wa: (chunks) => (
                  <a
                    href={WHATSAPP_URL}
                    className={linkContact}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("deliveryHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("deliveryP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("titleRiskHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("titleRiskP")}</p>
        </section>

        <PolicyContactCard />
      </div>

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        {tNav("relatedLabel")}{" "}
        <Link href="/refund" className="font-medium text-ink underline-offset-4 hover:underline">
          {tNav("relatedRefund")}
        </Link>
        {" · "}
        <Link
          href="/wholesale"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {tNav("relatedWholesale")}
        </Link>
      </p>
    </div>
  );
}
