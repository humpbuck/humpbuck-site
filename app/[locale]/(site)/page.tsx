import type { Metadata } from "next";
import { StorefrontImage } from "@/components/site/storefront-image";
import { getTranslations, getMessages, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Factory, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { HeroSpaceVideo } from "@/components/site/HeroSpaceVideo";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { HomeFeaturedProductCard } from "@/components/site/home-featured-product-card";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import { PreloadHomeSeriesImages } from "@/components/site/preload-home-series-images";
import { NewsletterSubscribe } from "@/components/site/NewsletterSubscribe";
import { ProductCard } from "@/components/site/ProductCard";
import { routing } from "@/i18n/routing";
import { formatPrice, seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardR2GalleryImage } from "@/lib/r2-card-image";
import { R2 } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const base = getSiteUrl();
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const openGraphUrl = pathPrefix ? `${base}${pathPrefix}` : base;

  return {
    title: {
      absolute: t("metaTitle"),
    },
    description: t("metaDescription"),
    alternates: {
      canonical: pathPrefix ? `${pathPrefix}/` : "/",
      languages: storefrontHreflangLanguages("/"),
    },
    openGraph: {
      url: openGraphUrl,
      type: "website",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage.url],
    },
  };
}

/** Avoid SSG at build with an empty or unreachable DB (same pattern as `/series/[slug]`). */
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const featured = [...all].slice(0, 12).map((p) => applyStorefrontProductLocale(p, locale, messages));
  const featuredCardImages = await Promise.all(
    featured.map((p) =>
      getShopCardR2GalleryImage(p.slug, p.image, p.galleryImages ?? p.images),
    ),
  );
  const featuredImageUrls = featured.map(
    (p, i) => featuredCardImages[i]?.trim() || p.image,
  );
  const tonneauFeaturedRaw = all.find((p) => p.seriesSlug === "tonneau") ?? null;
  const rdFeaturedRaw = all.find((p) => p.seriesSlug === "rd-astral") ?? null;
  const tonneauFeatured = tonneauFeaturedRaw
    ? applyStorefrontProductLocale(tonneauFeaturedRaw, locale, messages)
    : null;
  const rdFeatured = rdFeaturedRaw
    ? applyStorefrontProductLocale(rdFeaturedRaw, locale, messages)
    : null;
  const tonneauSeries = seriesList.find((s) => s.slug === "tonneau");
  const rdAstralSeries = seriesList.find((s) => s.slug === "rd-astral");
  const heroFeaturedRaw =
    all.find((p) => p.slug === "digitemp-2301") ?? [...all].slice(0, 12)[0] ?? null;
  const heroFeatured = heroFeaturedRaw
    ? applyStorefrontProductLocale(heroFeaturedRaw, locale, messages)
    : null;
  const heroFallback = {
    slug: "digitemp",
    name: "HUMPBUCK DIGI-TEMP",
    price: 0,
    compareAtPrice: undefined,
  };
  const deferredSectionStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "1000px",
  } as const;

  return (
    <div>
      {(tonneauFeatured || rdFeatured) ? <PreloadHomeSeriesImages /> : null}
      {featured.length > 0 ? <PreloadHomeFeaturedImages urls={featuredImageUrls} /> : null}
      {/* Hero — HUMPBUCK DIGI-TEMP (SEO + conversion) */}
      <section className="relative border-b border-white/10 bg-[#070a10] text-white">
        <HeroSpaceVideo />

        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-10 md:py-16 lg:gap-16 lg:py-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.2em] text-cyan-200/85 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[8px]">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-cyan-300 sm:h-3 sm:w-3" strokeWidth={2} />
              {t("heroBadge")}
            </div>
            <h1 className="mt-6 font-serif font-normal leading-[1.05] tracking-[-0.02em]">
              {/*
                Base: single column, full width — can be larger.
                md–2xl: two columns — cap size to container (vw alone would still be too big for the text column on iPad / Surface).
              */}
              <span className="block w-full max-w-full min-w-0 whitespace-nowrap leading-[1.08] text-[clamp(1.45rem,min(5vw+0.45rem,2.2rem),2.2rem)] md:text-[clamp(0.95rem,min(2.15vw+0.55rem,1.12rem),1.12rem)] lg:text-[clamp(1rem,min(1.85vw+0.55rem,1.22rem),1.22rem)] xl:text-[clamp(1.08rem,min(1.5vw+0.55rem,1.42rem),1.42rem)] 2xl:text-[clamp(1.2rem,min(1.25vw+0.6rem,1.7rem),1.7rem)] min-[1800px]:text-[clamp(1.35rem,0.9vw+0.65rem,2rem)]">
                HUMPBUCK{" "}
                <span className="inline">DIGI{"\u2011"}TEMP</span>
              </span>
            </h1>
            <p className="mt-6 max-w-prose font-sans text-base font-normal leading-snug tracking-normal text-white/88 md:mt-5 md:text-lg">
              {t("heroLead1")}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/72 md:mt-6 md:text-lg">
              {t("heroLead2")}
            </p>
            {/* Mobile: long tag full-width, 2-up below. md+: one flex row, wraps on iPad/Surface */}
            <div className="relative mt-7 flex max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2">
              <span className="inline-flex w-full shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-cyan-100 md:w-auto md:justify-start md:px-3.5 md:text-[11px] md:tracking-[0.12em]">
                {t("heroModesChip")}
              </span>
              <div className="grid grid-cols-2 gap-2 md:contents">
                <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 md:text-[11px]">
                  {t("heroDualTime")}
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85 md:text-[11px]">
                  {t("heroBacklight")}
                </span>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/shop?series=digitemp"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#070a10] transition hover:bg-white/90"
              >
                {t("heroCtaShop")}
              </Link>
              <Link
                href="/series/digitemp"
                className="inline-flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 underline-offset-8 transition hover:text-white hover:underline"
              >
                {t("heroSeriesStory")}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                {t("heroSocialLabel")}
              </p>
              <div className="mt-3">
                <HumpbuckSocialLinks
                  variant="hero"
                  labels={{
                    facebook: t("socialFacebookAria"),
                    instagram: t("socialInstagramAria"),
                    youtube: t("socialYoutubeAria"),
                    tiktok: t("socialTiktokAria"),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg min-w-0 md:max-w-none md:mx-0">
            {(heroFeatured ?? heroFallback) ? (
              <Link
                href={(heroFeatured ?? heroFallback).slug === "digitemp" ? "/shop?series=digitemp" : `/product/${(heroFeatured ?? heroFallback).slug}`}
                className="group relative block aspect-square overflow-hidden rounded-[24px] border border-white/10 bg-linear-to-b from-white/10 to-white/0 shadow-glow-digital transition outline-offset-4 focus-visible:outline-2 focus-visible:outline-cyan-400/80 sm:rounded-[28px]"
              >
                <StorefrontImage
                  src={R2.home.digitemp2301Webp}
                  alt={t("heroFeaturedAlt")}
                  fill
                  priority
                  fetchPriority="high"
                  quality={68}
                  className="object-cover opacity-95 transition group-hover:opacity-100"
                  sizes="(max-width:767px) 92vw, (max-width:1279px) 50vw, 560px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#070a10] via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                        {t("heroFeaturedLabel")}
                      </div>
                      <div className="mt-1 font-serif text-lg">{(heroFeatured ?? heroFallback).name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold tabular-nums text-white">
                        {formatPrice((heroFeatured ?? heroFallback).price)}
                      </div>
                      {(heroFeatured ?? heroFallback).compareAtPrice != null && (
                        <div className="text-[12px] text-white/55 line-through tabular-nums">
                          {formatPrice((heroFeatured ?? heroFallback).compareAtPrice!)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-cyan-400/90 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#06252d] transition group-hover:bg-cyan-300">
                    {t("heroViewProduct")}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[24px] border border-white/10 bg-white/5 p-8 text-center text-white/75 sm:rounded-[28px]">
                <div>
                  <div className="font-serif text-2xl">{t("heroComingSoonTitle")}</div>
                  <p className="mt-3 text-sm text-white/60">{t("heroComingSoonBody")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RM-TONNEAU & RD-ASTRAL — series hero cards (R2 series backgrounds) */}
      {(tonneauFeatured || rdFeatured) && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {tonneauFeatured ? (
              <HomeFeaturedProductCard
                href="/series/tonneau"
                imageSrc={R2.home.rmTonneauSeriesBackgroundWebp}
                imageAlt={tonneauSeries?.name ?? "RM-TONNEAU"}
                badge={tonneauSeries?.name ?? "RM-TONNEAU"}
                seriesShopLabel={t("seriesShopLabel")}
                name={tonneauFeatured.name}
                price={tonneauFeatured.price}
                compareAtPrice={tonneauFeatured.compareAtPrice}
                ctaLabel={t("heroViewProduct")}
                theme="luxe"
                imageEager
              />
            ) : null}
            {rdFeatured ? (
              <HomeFeaturedProductCard
                href="/series/rd-astral"
                imageSrc={R2.home.rdAstralSeriesBackgroundWebp}
                imageAlt={rdAstralSeries?.name ?? "RD-ASTRAL"}
                badge={rdAstralSeries?.name ?? "RD-ASTRAL"}
                seriesShopLabel={t("seriesShopLabel")}
                name={rdFeatured.name}
                price={rdFeatured.price}
                compareAtPrice={rdFeatured.compareAtPrice}
                ctaLabel={t("heroViewProduct")}
                theme="mixed"
                imageEager
              />
            ) : null}
          </div>
        </section>
      )}

      {/* Wholesale */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
        style={deferredSectionStyle}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-linear-to-br from-ink via-[#161821] to-[#0f1114] p-8 text-paper shadow-card sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-luxe)]/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <Factory size={14} className="text-[color:var(--color-luxe)]" />
                {t("wholesaleBadge")}
              </div>
              <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
                {t("wholesaleTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
                {t("wholesaleBody")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/wholesale"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[color:var(--color-luxe)] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-[color:var(--color-luxe)]/90"
              >
                {t("wholesaleCta")}
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
              >
                {t("wholesaleWhatsApp")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="border-t border-line bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("featuredHeading")}
            </div>
            <Link
              href="/shop"
              className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/75 underline-offset-8 hover:text-ink hover:underline"
            >
              {t("viewAllProducts")}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {featured.map((p, i) => (
              <ProductCard
                key={p.slug}
                product={p}
                cardImageUrl={featuredCardImages[i] ?? undefined}
                imagePriority={i < 2}
                imageEager={i < 4}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats + trust */}
      <section
        className="border-t border-line bg-white/55 py-14"
        style={deferredSectionStyle}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {(
            [
              { k: "10k+", labelKey: "statActiveCustomers" as const },
              { k: "25k+", labelKey: "statOrdersFulfilled" as const },
              { k: "50+", labelKey: "statCountriesShipped" as const },
              { k: "24/7", labelKey: "statSupport" as const },
            ] as const
          ).map((s) => (
            <div key={s.labelKey} className="text-center lg:text-left">
              <div className="font-serif text-4xl tabular-nums">{s.k}</div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.16em] text-muted">
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <ShieldCheck
              className="mt-0.5 text-digital-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustSecureTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustSecureBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Globe2
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustGlobalTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustGlobalBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Sparkles
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustLaunchTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustLaunchBody")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section
        id="newsletter"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
        style={deferredSectionStyle}
      >
        <div className="rounded-3xl border border-line bg-white/70 p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("newsletterKicker")}
              </div>
              <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
                {t("newsletterTitle")}
              </h2>
              <p className="mt-3 text-sm text-muted">{t("newsletterBody")}</p>
            </div>
            <NewsletterSubscribe />
          </div>
        </div>
      </section>
    </div>
  );
}
