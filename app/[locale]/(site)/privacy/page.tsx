import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";
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
  const path = `${pathPrefix}/privacy`;
  return {
    title: t("privacyMetaTitle"),
    description: t("privacyMetaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/privacy"),
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("PolicyPages");
  const t = await getTranslations("PrivacyPolicy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        {tNav("privacyMetaTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {tNav("lastUpdated", { date: tNav("privacyLastUpdatedDate") })}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          {t.rich("intro", {
            site: (chunks) => (
              <a
                href="https://www.humpbuck.com"
                className={linkContact}
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t("readCarefully")}</p>
      </div>

      <hr className="my-10 border-line" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("changesHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("changesP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("collectUseHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("collectUseP1")}</p>
          <p className="mt-4 text-ink/85">{t("collectUseP2")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("whatWeCollectHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("whatWeCollectLead")}</p>

          <h3 className="mt-8 font-semibold text-ink">{t("directHeading")}</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ink/40">
            <li>{t("directLi1")}</li>
            <li>{t("directLi2")}</li>
            <li>{t("directLi3")}</li>
            <li>{t("directLi4")}</li>
          </ul>

          <h3 className="mt-8 font-semibold text-ink">{t("usageHeading")}</h3>
          <p className="mt-4 text-ink/85">{t("usageP")}</p>

          <h3 className="mt-8 font-semibold text-ink">{t("thirdPartiesHeading")}</h3>
          <p className="mt-4 text-ink/85">{t("thirdPartiesP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("howUseHeading")}
          </h2>
          <ul className="mt-4 list-disc space-y-4 pl-5 text-ink/85 marker:text-ink/40">
            <li>{t("howUseLi1")}</li>
            <li>{t("howUseLi2")}</li>
            <li>{t("howUseLi3")}</li>
            <li>{t("howUseLi4")}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("cookiesHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("cookiesP1")}</p>
          <p className="mt-4 text-ink/85">
            {t.rich("cookiesP2", {
              bold: (chunks) => (
                <strong className="font-medium text-ink">{chunks}</strong>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("discloseHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("discloseLead")}</p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>{t("discloseLi1")}</li>
            <li>{t("discloseLi2")}</li>
            <li>{t("discloseLi3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("thirdPartyLinksHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("thirdPartyLinksP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("childrenHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("childrenP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("securityHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("securityP")}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            {t("rightsHeading")}
          </h2>
          <p className="mt-4 text-ink/85">{t("rightsLead")}</p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>{t("rightsLi1")}</li>
            <li>{t("rightsLi2")}</li>
            <li>{t("rightsLi3")}</li>
          </ul>
          <p className="mt-4 text-ink/85">{t("rightsFoot")}</p>
        </section>

        <PolicyContactCard variant="privacy" />
      </div>

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        {tNav("relatedLabel")}{" "}
        <Link
          href="/terms"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {tNav("relatedTerms")}
        </Link>
        {" · "}
        <Link
          href="/shipping"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {tNav("relatedShipping")}
        </Link>
      </p>
    </div>
  );
}
