import { Mail, MessageCircle } from "lucide-react";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/about`;
  const pageUrl = `${getSiteUrl()}${path}`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/about"),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [defaultOgImage.url],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AboutPage");
  const supportMail = publicSupportEmail();
  const mailtoHref = `mailto:${supportMail}?subject=${encodeURIComponent(
    t("mailSubject"),
  )}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <section className="border-b border-line pb-10 lg:pb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("storyKicker")}
        </p>
        <div className="mt-5 space-y-5 text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
          <p>{t("storyP1")}</p>
          <p>{t("storyP2")}</p>
        </div>
      </section>

      <section
        className="mt-10 rounded-3xl border border-line bg-white/70 p-7 shadow-(--shadow-card) sm:mt-12 sm:p-8"
        aria-labelledby="about-contact-heading"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("contactKicker")}
        </p>
        <h2 id="about-contact-heading" className="mt-3 font-serif text-2xl text-ink">
          {t("contactTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("contactLead")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={mailtoHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-white"
            aria-label={`${t("emailButton")} ${supportMail}`}
          >
            <Mail size={18} strokeWidth={1.75} aria-hidden />
            {t("emailButton")}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-luxe px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-luxe/90"
            aria-label={`${t("whatsappButton")} ${WHATSAPP_DISPLAY}`}
          >
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden />
            {t("whatsappButton")}
          </a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted">
          <a
            href={mailtoHref}
            className="text-ink/80 underline underline-offset-2 hover:text-ink"
          >
            {supportMail}
          </a>
          <span className="mx-2 text-muted/60" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{WHATSAPP_DISPLAY}</span>
        </p>
      </section>
    </div>
  );
}
