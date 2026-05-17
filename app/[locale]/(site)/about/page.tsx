import { Link } from "@/i18n/navigation";
import { Mail, MapPin, MessageCircle, Play } from "lucide-react";
import {
  GUANGZHOU_GOOGLE_MAPS_URL,
  aboutPageMapEmbed,
} from "@/lib/about-location";
import { R2 } from "@/lib/r2";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/about"),
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
  const mapEmbed = aboutPageMapEmbed();
  const regionLabel = t("factoryRegion");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <header className="border-b border-line pb-10 lg:pb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kickerBrand")}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">{t("heroLead")}</p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-7">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">{t("digiTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-ink">{t("digiLead")}</strong>
            {t("digiRest")}
          </p>
        </section>
        <section className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-7">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">{t("rmTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-ink">{t("rmLead")}</strong>
            {t("rmRest")}
          </p>
        </section>
        <section className="rounded-3xl border border-line bg-paper p-6 sm:p-7 md:col-span-2 lg:col-span-1">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">{t("optimizeTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted">
            <li>{t("optLi1")}</li>
            <li>{t("optLi2")}</li>
            <li>{t("optLi3")}</li>
          </ul>
        </section>
      </div>

      <section
        className="mt-12 lg:mt-16"
        aria-labelledby="about-factory-location-heading"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("factoryKicker")}
            </p>
            <h2
              id="about-factory-location-heading"
              className="mt-2 font-serif text-2xl tracking-tight text-ink sm:text-3xl"
            >
              {t("factoryTitle")}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted lg:text-right">
            {t("factoryAsideBefore")}{" "}
            <span className="text-ink/90">{regionLabel}</span>{" "}
            {t("factoryAsideAfter")}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-card)">
              <iframe
                src={mapEmbed.src}
                title={t("mapIframeTitle")}
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {mapEmbed.kind === "osm-fallback" ? (
              <p className="text-xs leading-relaxed text-muted">{t("mapFallback")}</p>
            ) : null}
            <a
              href={GUANGZHOU_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-ink/90 shadow-sm transition hover:border-ink/15 hover:bg-white"
            >
              <MapPin size={16} strokeWidth={1.75} aria-hidden />
              {t("openMapsLabel")}
            </a>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-(--shadow-card)">
              <video
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
                aria-label={t("videoAriaLabel")}
              >
                <source src={R2.about.promotionalVideoMp4} type="video/mp4" />
              </video>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted">
              <Play
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-luxe-dim"
                aria-hidden
              />
              <span>{t("videoCaption")}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
        <section
          className="rounded-3xl border border-line bg-white/70 p-7 shadow-(--shadow-card) sm:p-8"
          aria-labelledby="about-contact-heading"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("contactKicker")}
          </p>
          <h2
            id="about-contact-heading"
            className="mt-3 font-serif text-2xl text-ink"
          >
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

        <div className="flex flex-col justify-between rounded-3xl border border-line bg-paper p-7 sm:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("b2bKicker")}
            </p>
            <h2 className="mt-3 font-serif text-2xl text-ink">{t("b2bTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("b2bLead")}</p>
          </div>
          <Link
            href="/wholesale"
            className="mt-8 inline-flex w-fit text-[12px] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-8 hover:underline"
          >
            {t("wholesaleLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
