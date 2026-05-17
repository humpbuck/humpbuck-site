import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AffiliatesPublic" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/affiliates`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/affiliates"),
    },
  };
}

export default async function AffiliatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AffiliatesPublic");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <header className="border-b border-line pb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">{t("heroLead")}</p>
      </header>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("step1Kicker")}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">{t("step1Title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("step1Body")}</p>
        </article>

        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("step2Kicker")}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">{t("step2Title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("step2Body")}</p>
        </article>

        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("step3Kicker")}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">{t("step3Title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("step3Body")}</p>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-ink">{t("policyTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted">
          <li>{t("policyLi1")}</li>
          <li>{t("policyLi2")}</li>
          <li>{t("policyLi3")}</li>
          <li>{t("policyLi4")}</li>
        </ul>
      </section>

      <section className="mt-10 rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-8">
        <h2 className="font-serif text-2xl text-ink">{t("dashboardTitle")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              {t("dashAppTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("dashAppBody")}</p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              {t("dashLinkTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("dashLinkBody")}</p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              {t("dashSettleTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("dashSettleBody")}</p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              {t("dashExportTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("dashExportBody")}</p>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/account/affiliate"
            className="inline-flex items-center rounded-xl bg-luxe px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-luxe/90"
          >
            {t("ctaAffiliate")}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-xl border border-line bg-paper px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/85 transition hover:border-ink/20 hover:bg-white"
          >
            {t("ctaAbout")}
          </Link>
        </div>
      </section>
    </div>
  );
}
