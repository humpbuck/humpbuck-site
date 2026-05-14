import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Factory, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { HeroSpaceVideo } from "@/components/site/HeroSpaceVideo";
import { NewsletterSubscribe } from "@/components/site/NewsletterSubscribe";
import { ProductCard } from "@/components/site/ProductCard";
import { formatPrice, seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { R2 } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: {
    absolute:
      "HUMPBUCK DIGI-TEMP — Ana-Digi Multifunction Watch | Official Store",
  },
  description:
    "Shop the HUMPBUCK DIGI-TEMP flagship — dual LCD ana-digi watches with TIME, DATE, ALM, OUT (outdoor temperature), and STW modes; stainless steel, mineral glass, 30 m WR. Also explore RM-TONNEAU barrel-case quartz.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: getSiteUrl(),
    type: "website",
    title: "HUMPBUCK DIGI-TEMP — Ana-Digi Multifunction Watch",
    description:
      "DIGI-TEMP dual LCD line plus RM-TONNEAU & RD-ASTRAL. Secure checkout · global shipping.",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "HUMPBUCK DIGI-TEMP — Ana-Digi Multifunction Watch",
    description:
      "DIGI-TEMP dual LCD line plus RM-TONNEAU & RD-ASTRAL. Secure checkout · global shipping.",
    images: [defaultOgImage.url],
  },
};

export default async function HomePage() {
  const all = await getMergedCatalogProducts();
  const featured = [...all].slice(0, 12);
  const tonneau = seriesList.find((s) => s.slug === "tonneau")!;
  const rdAstral = seriesList.find((s) => s.slug === "rd-astral")!;
  const heroFeatured =
    all.find((p) => p.slug === "digitemp-2301") ?? featured[0] ?? null;
  const heroFallback = {
    slug: "digitemp",
    name: "HUMPBUCK DIGI-TEMP",
    price: 0,
    compareAtPrice: undefined,
  };
  const tonneauCount = all.filter((p) => p.seriesSlug === "tonneau").length;
  const rdAstralCount = all.filter((p) => p.seriesSlug === "rd-astral").length;
  const deferredSectionStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "1000px",
  } as const;

  return (
    <div>
      {/* Hero — HUMPBUCK DIGI-TEMP (SEO + conversion) */}
      <section className="relative border-b border-white/10 bg-[#070a10] text-white">
        <HeroSpaceVideo />

        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-10 md:py-16 lg:gap-16 lg:py-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.2em] text-cyan-200/85 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[8px]">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-cyan-300 sm:h-3 sm:w-3" strokeWidth={2} />
              Series · DIGI-TEMP
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
              Ana-digi multifunction watch — dual displays, full feature set.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/72 md:mt-6 md:text-lg">
              Time, date, alarm, outdoor temperature, and stopwatch modes in a
              compact stainless steel case — cockpit-clear readability for daily
              wear.
            </p>
            {/* Mobile: long tag full-width, 2-up below. md+: one flex row, wraps on iPad/Surface */}
            <div className="relative mt-7 flex max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2">
              <span className="inline-flex w-full flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-100 md:w-auto md:justify-start md:px-3.5 md:text-[11px] md:tracking-[0.12em]">
                TIME · DATE · ALM · OUT · STW
              </span>
              <div className="grid grid-cols-2 gap-2 md:contents">
                <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 md:text-[11px]">
                  Dual time
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85 md:text-[11px]">
                  Backlight
                </span>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/shop?series=digitemp"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#070a10] transition hover:bg-white/90"
              >
                Shop DIGI-TEMP
              </Link>
              <Link
                href="/series/digitemp"
                className="inline-flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 underline-offset-8 transition hover:text-white hover:underline"
              >
                Series story
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg min-w-0 md:max-w-none md:mx-0">
            {(heroFeatured ?? heroFallback) ? (
              <Link
                href={(heroFeatured ?? heroFallback).slug === "digitemp" ? "/shop?series=digitemp" : `/product/${(heroFeatured ?? heroFallback).slug}`}
                className="group relative block aspect-square overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/10 to-white/0 shadow-[var(--shadow-glow-digital)] transition outline-offset-4 focus-visible:outline-2 focus-visible:outline-cyan-400/80 sm:rounded-[28px]"
              >
                <Image
                  src={R2.home.digitemp2301Webp}
                  alt="HUMPBUCK DIGI-TEMP 2301"
                  fill
                  priority
                  fetchPriority="high"
                  quality={68}
                  className="object-cover opacity-95 transition group-hover:opacity-100"
                  sizes="(max-width:767px) 92vw, (max-width:1279px) 50vw, 560px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                        Featured
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
                    View product
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[24px] border border-white/10 bg-white/5 p-8 text-center text-white/75 sm:rounded-[28px]">
                <div>
                  <div className="font-serif text-2xl">Featured product coming soon</div>
                  <p className="mt-3 text-sm text-white/60">
                    We&apos;re syncing catalog data. Please check back shortly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Series split */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
        style={deferredSectionStyle}
      >
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
          <Link
            href="/series/tonneau"
            className="group relative overflow-hidden rounded-3xl border border-[color:var(--color-line)] bg-[#141210] p-8 text-white shadow-[var(--shadow-card)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <Image
                src={tonneau.heroImage}
                alt=""
                fill
                quality={66}
                className="object-cover"
                sizes="(max-width:1024px) 100vw, (max-width:1536px) 50vw, 720px"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-[#141210]/20" />
            <div className="relative">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-luxe)]">
                RM-TONNEAU
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Shop the series · {tonneauCount}{" "}
                {tonneauCount === 1 ? "product" : "products"}
              </p>
              <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight sm:text-4xl">
                Keep your foot down when life asks you to lift.
                <span className="mt-2 block text-lg font-normal text-white/75">
                  {tonneau.tagline}
                </span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/72">
                {tonneau.description}
              </p>
              <span className="mt-8 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 underline-offset-8 group-hover:underline">
                Explore series
                <span className="font-normal text-white/45" aria-hidden>
                  ·
                </span>
                <span>View watches</span>
                <ArrowRight size={16} className="shrink-0" />
              </span>
            </div>
          </Link>

          <Link
            href="/series/rd-astral"
            className="group relative overflow-hidden rounded-3xl border border-[color:var(--color-line)] bg-[#1a1224] p-8 text-white shadow-[var(--shadow-card)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-45">
              <Image
                src={rdAstral.heroImage}
                alt=""
                fill
                quality={62}
                className="object-cover"
                sizes="(max-width:1024px) 100vw, (max-width:1536px) 50vw, 720px"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-950/80 via-black/50 to-[#1a1224]/25" />
            <div className="relative">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
                RD-ASTRAL
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Shop the series · {rdAstralCount}{" "}
                {rdAstralCount === 1 ? "product" : "products"}
              </p>
              <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight sm:text-4xl">
                Under the same stars—the courage to keep dreaming.
                <span className="mt-2 block text-lg font-normal text-white/75">
                  {rdAstral.tagline}
                </span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/72">
                {rdAstral.description}
              </p>
              <span className="mt-8 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 underline-offset-8 group-hover:underline">
                Explore series
                <span className="font-normal text-white/45" aria-hidden>
                  ·
                </span>
                <span>View watches</span>
                <ArrowRight size={16} className="shrink-0" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section
        className="border-t border-[color:var(--color-line)] bg-paper py-16 sm:py-20"
        style={deferredSectionStyle}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Featured
            </div>
            <Link
              href="/shop"
              className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/75 underline-offset-8 hover:text-ink hover:underline"
            >
              View all products
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {featured.map((p) => (
              <ProductCard
                key={p.slug}
                product={p}
                imagePriority={false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale */}
      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
        style={deferredSectionStyle}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--color-line)] bg-gradient-to-br from-ink via-[#161821] to-[#0f1114] p-8 text-paper shadow-[var(--shadow-card)] sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-luxe)]/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <Factory size={14} className="text-[color:var(--color-luxe)]" />
                HUMPBUCK Watch Factory
              </div>
              <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
                Custom branding & wholesale.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
                We offer end-to-end OEM and ODM watch customization, covering design,
                functions, materials, branding, and packaging. Whether you start with a
                finished design or just an idea, we help you build competitive watches
                and grow your brand in the market.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/wholesale"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[color:var(--color-luxe)] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-[color:var(--color-luxe)]/90"
              >
                Wholesale brief
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + trust */}
      <section
        className="border-t border-[color:var(--color-line)] bg-white/55 py-14"
        style={deferredSectionStyle}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { k: "10k+", label: "Active customers" },
            { k: "25k+", label: "Orders fulfilled" },
            { k: "50+", label: "Countries shipped" },
            { k: "24/7", label: "Support coverage" },
          ].map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <div className="font-serif text-4xl tabular-nums">{s.k}</div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.16em] text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-line)] bg-paper p-5">
            <ShieldCheck
              className="mt-0.5 text-digital-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">Secure checkout</div>
              <div className="mt-1 text-sm text-muted">
                Encrypted payments and verified processors.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-line)] bg-paper p-5">
            <Globe2
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">Global logistics</div>
              <div className="mt-1 text-sm text-muted">
                Duty/tax messaging at checkout where applicable.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-line)] bg-paper p-5">
            <Sparkles
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">Launch support</div>
              <div className="mt-1 text-sm text-muted">
                Factory programs for growing watch brands.
              </div>
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
        <div className="rounded-3xl border border-[color:var(--color-line)] bg-white/70 p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Updates
              </div>
              <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
                DIGI-TEMP restocks &amp; RM-TONNEAU drops
              </h2>
              <p className="mt-3 text-sm text-muted">
                Short updates on flagship ana-digi stock plus partner wholesale
                windows — no filler.
              </p>
            </div>
            <NewsletterSubscribe />
          </div>
        </div>
      </section>
    </div>
  );
}
