import { Link } from "@/i18n/navigation";
import { Mail, MessageCircle, Package, PenTool, Truck } from "lucide-react";
import { WholesaleBriefForm } from "@/components/site/WholesaleBriefForm";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import type { LucideIcon } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "WholesalePage" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/wholesale`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/wholesale"),
    },
  };
}

export default async function WholesalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("WholesalePage");
  const supportMail = publicSupportEmail();

  const steps: {
    icon: LucideIcon;
    titleKey: "stepBriefTitle" | "stepMockTitle" | "stepSampleTitle" | "stepProdTitle";
    bodyKey: "stepBriefBody" | "stepMockBody" | "stepSampleBody" | "stepProdBody";
  }[] = [
    { icon: Mail, titleKey: "stepBriefTitle", bodyKey: "stepBriefBody" },
    { icon: PenTool, titleKey: "stepMockTitle", bodyKey: "stepMockBody" },
    { icon: Package, titleKey: "stepSampleTitle", bodyKey: "stepSampleBody" },
    { icon: Truck, titleKey: "stepProdTitle", bodyKey: "stepProdBody" },
  ];

  const customizeKeys = ["custom1", "custom2", "custom3", "custom4", "custom5"] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">
          {t("introBefore")}{" "}
          <strong className="font-medium text-ink/90">{t("digiStrong")}</strong> {t("introMid")}{" "}
          <strong className="font-medium text-ink/90">{t("tonneauStrong")}</strong> {t("introAfter")}
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white/70 p-6 shadow-card">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t("moqHeading")}</div>
          <ul className="mt-4 space-y-2 text-sm text-ink/85">
            <li>{t("moq1")}</li>
            <li>{t("moq2")}</li>
            <li>{t("moq3")}</li>
          </ul>
          <p className="mt-4 text-xs text-muted">{t("moqNote")}</p>
        </div>
        <div className="rounded-3xl border border-line bg-white/70 p-6 shadow-card lg:col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("customizeHeading")}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {customizeKeys.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm"
              >
                {t(key)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, titleKey, bodyKey }) => (
          <div key={titleKey} className="rounded-3xl border border-line bg-paper p-6">
            <Icon className="text-luxe-dim" size={22} strokeWidth={1.75} />
            <div className="mt-4 font-serif text-lg">{t(titleKey)}</div>
            <p className="mt-2 text-sm text-muted">{t(bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-stone-400/25 bg-stone-300/90 p-8 shadow-card sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t("nextKicker")}</p>
            <h2 className="mt-3 font-serif text-2xl text-ink">{t("nextTitle")}</h2>
            <p className="mt-3 text-sm text-muted">{t("nextLead")}</p>
            <WholesaleBriefForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} />
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-luxe)] px-6 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-[color:var(--color-luxe)]/90"
            >
              <MessageCircle size={18} />
              {t("whatsappButton")}
            </a>
            <button
              type="submit"
              form="wholesale-brief-form"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-400/35 bg-paper px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-stone-100/90"
              aria-label={t("submitAria", { email: supportMail })}
            >
              <Mail size={18} />
              {t("submitButton")}
            </button>
            <Link
              href="/shop"
              className="text-center text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {t("browseCatalog")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
