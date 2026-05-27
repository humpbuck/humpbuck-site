import {
  CreditCard,
  Mail,
  Package,
  Play,
  Truck,
} from "lucide-react";
import { WholesaleIndexJsonLd } from "@/components/seo/wholesale-json-ld";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { WholesaleContactActions } from "@/components/site/wholesale-contact-actions";
import { WholesaleListingsSection } from "@/components/site/wholesale-listings-section";
import { R2 } from "@/lib/r2";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { listActiveWholesaleListings } from "@/lib/wholesale-listings";
import {
  toWholesaleListingClientRow,
  type WholesaleListingsLabels,
} from "@/lib/wholesale-listing-shared";
import type { LucideIcon } from "lucide-react";

export async function WholesalePageBody({
  locale,
  initialOpenSlug,
}: {
  locale: string;
  initialOpenSlug?: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("WholesalePage");
  const messages = await getMessages();
  const wholesaleMessages = messages.WholesalePage as Record<string, string | undefined>;
  const listings = await listActiveWholesaleListings();
  const listingRows = listings.map(toWholesaleListingClientRow);
  const listingsLabels: WholesaleListingsLabels = {
    listingsKicker: t("listingsKicker"),
    listingsTitle: t("listingsTitle"),
    listingsLead: t("listingsLead"),
    listingsPrev: t("listingsPrev"),
    listingsNext: t("listingsNext"),
    listingsPageTemplate:
      wholesaleMessages.listingsPage ?? "Page {page} of {total}",
    listingsModalFallbackTitle: t("listingsModalFallbackTitle"),
  };

  const steps: {
    icon: LucideIcon;
    titleKey: "stepContactTitle" | "stepConfirmTitle" | "stepPayTitle" | "stepShipTitle";
    bodyKey: "stepContactBody" | "stepConfirmBody" | "stepPayBody" | "stepShipBody";
  }[] = [
    { icon: Mail, titleKey: "stepContactTitle", bodyKey: "stepContactBody" },
    { icon: Package, titleKey: "stepConfirmTitle", bodyKey: "stepConfirmBody" },
    { icon: CreditCard, titleKey: "stepPayTitle", bodyKey: "stepPayBody" },
    { icon: Truck, titleKey: "stepShipTitle", bodyKey: "stepShipBody" },
  ];

  const socialLabels = {
    facebook: t("socialFacebookAria"),
    instagram: t("socialInstagramAria"),
    youtube: t("socialYoutubeAria"),
    tiktok: t("socialTiktokAria"),
  };

  return (
    <>
      <WholesaleIndexJsonLd
        locale={locale}
        pageName={t("metaTitle")}
        pageDescription={t("metaDescription")}
        listings={listings}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="pb-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("kicker")}
          </p>
          <h1 className="mt-3 min-w-0 max-w-4xl font-serif text-2xl leading-tight tracking-tight sm:text-3xl lg:text-[2rem] xl:text-[2.125rem]">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("subtitle")}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="w-full">
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
              <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Play
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0 text-luxe-dim"
                  aria-hidden
                />
                <span>{t("videoCaption")}</span>
              </p>
            </div>

            <div className="flex flex-col justify-center lg:px-2 xl:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("socialLinksLabel")}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t("heroSocialLead")}</p>
              <div className="mt-5">
                <HumpbuckSocialLinks labels={socialLabels} />
              </div>
            </div>
          </div>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("ctaKicker")}
              </p>
              <h2 className="mt-3 font-serif text-2xl text-ink">{t("ctaTitle")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("ctaLead")}</p>
            </div>
            <WholesaleContactActions />
          </div>
        </div>

        <WholesaleListingsSection
          listings={listingRows}
          labels={listingsLabels}
          initialOpenSlug={initialOpenSlug}
        />
      </div>
    </>
  );
}
