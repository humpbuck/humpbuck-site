import Link from "next/link";
import { cookies } from "next/headers";
import { Mail, MapPin, MessageCircle, Play } from "lucide-react";
import {
  GUANGZHOU_GOOGLE_MAPS_URL,
  aboutPageMapEmbed,
} from "@/lib/about-location";
import { R2 } from "@/lib/r2";
import { normalizeSiteLanguage } from "@/lib/site-i18n";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "About — DIGI-TEMP, RM-TONNEAU & RD-ASTRAL",
  description:
    "How HUMPBUCK structures DIGI-TEMP (ana-digi flagship) alongside RM-TONNEAU and RD-ASTRAL — design intent and multi-series SEO hygiene.",
  alternates: {
    canonical: "/about",
  },
};

export default async function AboutPage() {
  const lang = normalizeSiteLanguage((await cookies()).get("site_lang")?.value);
  const copy =
    lang === "es"
      ? {
          badgeBrand: "Marca",
          heroTitle: "HUMPBUCK — utilidad primero, espectaculo despues.",
          badgeFactory: "Fabrica y ubicacion",
          mapButton: "Abrir en Google Maps",
          contact: "Contacto",
          reachTeam: "Contacta al equipo",
          email: "Correo",
          b2b: "B2B",
          programs: "Programas y mayorista",
          exploreWholesale: "Explorar mayorista",
        }
      : {
          badgeBrand: "Brand",
          heroTitle: "HUMPBUCK — utility first, then spectacle.",
          badgeFactory: "Factory & location",
          mapButton: "Open in Google Maps",
          contact: "Contact",
          reachTeam: "Reach the team",
          email: "Email",
          b2b: "B2B",
          programs: "Programs & wholesale",
          exploreWholesale: "Explore wholesale",
        };
  const supportMail = publicSupportEmail();
  const mailtoHref = `mailto:${supportMail}?subject=${encodeURIComponent(
    "Question about HUMPBUCK",
  )}`;
  const mapEmbed = aboutPageMapEmbed();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      {/* Hero — full width intro, not buried below media */}
      <header className="border-b border-line pb-10 lg:pb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {copy.badgeBrand}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl tracking-tight sm:text-5xl">
          {copy.heroTitle}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
          We run a direct storefront plus factory programs so a single launch can
          grow into repeatable production without re-sourcing every season.
        </p>
      </header>

      {/* Series — card grid breaks the single-column rhythm */}
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-7">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">
            DIGI-TEMP (flagship)
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-ink">HUMPBUCK DIGI-TEMP</strong> is our lead
            ana-digi line: dual LCD legibility, modes for TIME, DATE, alarm,
            outdoor temperature (OUT), and stopwatch (STW), in stainless cases
            suited to daily wear. It is the series we emphasize in storytelling,
            metadata, and merchandising — the name customers should remember
            first.
          </p>
        </section>
        <section className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-7">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">
            RM-TONNEAU (parallel line)
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-ink">RM-TONNEAU</strong> is a separate
            barrel-case and skeleton-forward quartz collection. It does not
            replace DIGI-TEMP; it extends the catalog for buyers who want a
            different silhouette and keyword set. Each line has its own URL,
            title tags, and copy — so search engines and ads can target them
            cleanly without mixing messages.
          </p>
        </section>
        <section className="rounded-3xl border border-line bg-paper p-6 sm:p-7 md:col-span-2 lg:col-span-1">
          <h2 className="font-serif text-xl text-ink sm:text-2xl">
            What we optimize for
          </h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted">
            <li>Readable specs (dimensions, WR, modes) on every product page</li>
            <li>Clear checkout, tax, and after-sales pages</li>
            <li>Wholesale briefs with MOQ and sampling checkpoints</li>
          </ul>
        </section>
      </div>

      {/* Factory & map — side by side on large screens */}
      <section
        className="mt-12 lg:mt-16"
        aria-labelledby="about-factory-location-heading"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {copy.badgeFactory}
            </p>
            <h2
              id="about-factory-location-heading"
              className="mt-2 font-serif text-2xl tracking-tight text-ink sm:text-3xl"
            >
              Guangzhou base & promotional film
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted lg:text-right">
            Manufacturing in{" "}
            <span className="text-ink/90">Guangzhou, Guangdong Province</span> — a
            hub for OEM watch assembly. Verify the region on the map, or open
            Google Maps for navigation.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-card)">
              <iframe
                src={mapEmbed.src}
                title="Map — Guangzhou, China"
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {mapEmbed.kind === "osm-fallback" ? (
              <p className="text-xs leading-relaxed text-muted">
                Regional overview of Guangzhou. Use{" "}
                <span className="text-ink/80">Open in Google Maps</span> for
                directions and satellite view.
              </p>
            ) : null}
            <a
              href={GUANGZHOU_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-ink/90 shadow-sm transition hover:border-ink/15 hover:bg-white"
            >
              <MapPin size={16} strokeWidth={1.75} aria-hidden />
              {copy.mapButton}
            </a>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-(--shadow-card)">
              <video
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
                aria-label="HUMPBUCK Watch Factory Promotional Video"
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
              <span>HUMPBUCK Watch Factory promotional video</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contact + next step — two columns on desktop */}
      <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
        <section
          className="rounded-3xl border border-line bg-white/70 p-7 shadow-(--shadow-card) sm:p-8"
          aria-labelledby="about-contact-heading"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {copy.contact}
          </p>
          <h2
            id="about-contact-heading"
            className="mt-3 font-serif text-2xl text-ink"
          >
            {copy.reachTeam}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Product questions, order help, or wholesale — email us or message on
            WhatsApp.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-white"
              aria-label={`Email ${supportMail}`}
            >
              <Mail size={18} strokeWidth={1.75} aria-hidden />
              {copy.email}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-luxe px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-luxe/90"
              aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
            >
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden />
              WhatsApp
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
              {copy.b2b}
            </p>
            <h2 className="mt-3 font-serif text-2xl text-ink">
              {copy.programs}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Add your founding story, manufacturing geography, warranty policy,
              and sustainability commitments here when ready.
            </p>
          </div>
          <Link
            href="/wholesale"
            className="mt-8 inline-flex w-fit text-[12px] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-8 hover:underline"
          >
            {copy.exploreWholesale}
          </Link>
        </div>
      </div>
    </div>
  );
}
