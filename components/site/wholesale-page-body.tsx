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
import { WholesaleStoryCollapsible } from "@/components/site/wholesale-story-collapsible";
import { WholesaleListingsSection } from "@/components/site/wholesale-listings-section";
import { R2 } from "@/lib/r2";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { listActiveWholesaleListings } from "@/lib/wholesale-listings";
import {
  toWholesaleListingClientRow,
  type WholesaleListingsLabels,
} from "@/lib/wholesale-listing-shared";
import type { LucideIcon } from "lucide-react";

const TRUST_CHIP_KEYS = [
  "trustChipFamily",
  "trustChipMortgage",
  "trustChipSisterFactory",
  "trustChipSourceSales",
  "trustChipOem",
  "trustChipPayments",
] as const;

type StorySection = {
  kickerKey:
    | "storyJourneyKicker"
    | "storyRootsKicker"
    | "storySourcesKicker"
    | "storyWhyKicker";
  titleKey:
    | "storyJourneyTitle"
    | "storyRootsTitle"
    | "storySourcesTitle"
    | "storyWhyTitle";
  paragraphKeys: readonly string[];
  fullWidth?: boolean;
  includeSocialLinks?: boolean;
};

const STORY_BODY_CLASS = "w-full text-base leading-relaxed text-muted sm:text-lg";
const STORY_BODY_COMPACT_CLASS = "w-full text-sm leading-relaxed text-muted";

const STORY_SECTIONS: StorySection[] = [
  {
    kickerKey: "storyJourneyKicker",
    titleKey: "storyJourneyTitle",
    paragraphKeys: ["storyJourneyP1", "storyJourneyP2", "storyJourneyP3"],
    fullWidth: true,
    includeSocialLinks: true,
  },
];

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
          <h1 className="mt-3 min-w-0 font-serif text-2xl leading-tight tracking-tight sm:text-3xl lg:text-[2rem] lg:whitespace-nowrap xl:text-[2.125rem]">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-6 space-y-5 sm:space-y-6">
            <p className="w-full text-base leading-relaxed text-muted sm:text-lg">{t("introP1")}</p>
            <p className="w-full text-base leading-relaxed text-muted sm:text-lg">{t("introP2")}</p>
            <p className="w-full text-base leading-relaxed text-muted sm:text-lg">{t("introP3")}</p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label={t("storyKicker")}>
            {TRUST_CHIP_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/75"
              >
                {t(key)}
              </li>
            ))}
          </ul>
        </header>

        <WholesaleListingsSection
          listings={listingRows}
          labels={listingsLabels}
          initialOpenSlug={initialOpenSlug}
        />

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

        <section id="founder-story" className="mt-16 lg:mt-20" aria-labelledby="wholesale-story-heading">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("storyKicker")}
          </p>
          <h2 id="wholesale-story-heading" className="sr-only">
            {t("storyKicker")}
          </h2>

          <div className="mt-8">
          <WholesaleStoryCollapsible
            teaser={t("storyJourneyTitle")}
            teaserLead={t("storyTeaserLead")}
            expandLabel={t("storyExpandLabel")}
            collapseLabel={t("storyCollapseLabel")}
          >
            {STORY_SECTIONS.filter(({ titleKey }) => titleKey === "storyJourneyTitle").map(
              ({ kickerKey, titleKey, paragraphKeys, includeSocialLinks }) => (
                <article key={kickerKey} className="w-full">
                  <h3 className="font-serif text-xl text-ink sm:text-2xl">{t(titleKey)}</h3>
                  <div className="mt-5 space-y-5 sm:space-y-6">
                    {paragraphKeys.map((paragraphKey) => (
                      <p key={paragraphKey} className={STORY_BODY_CLASS}>
                        {t(paragraphKey)}
                      </p>
                    ))}
                  </div>
                  {includeSocialLinks ? (
                    <div className="mt-6 border-t border-line pt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        {t("socialLinksLabel")}
                      </p>
                      <div className="mt-4">
                        <HumpbuckSocialLinks
                          labels={{
                            facebook: t("socialFacebookAria"),
                            instagram: t("socialInstagramAria"),
                            youtube: t("socialYoutubeAria"),
                            tiktok: t("socialTiktokAria"),
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </article>
              ),
            )}

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <article className="h-full">
                <h3 className="font-serif text-xl text-ink sm:text-2xl">{t("storySourcesTitle")}</h3>
                <div className="mt-5 space-y-5 sm:space-y-6">
                  <p className={STORY_BODY_CLASS}>{t("storySourcesP1")}</p>
                  <p className={STORY_BODY_CLASS}>{t("storySourcesP2")}</p>
                </div>

                <div className="mt-8 border-t border-line pt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {t("storyWhyKicker")}
                  </p>
                  <h3 className="mt-3 font-serif text-xl text-ink sm:text-2xl">{t("storyWhyTitle")}</h3>
                  <div className="mt-5 space-y-5 sm:space-y-6">
                    <p className={STORY_BODY_CLASS}>{t("storyWhyP1")}</p>
                    <p className={STORY_BODY_CLASS}>{t("storyWhyP2")}</p>
                  </div>
                </div>
              </article>

              <article className="h-full">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {t("storyRootsKicker")}
                </p>
                <h3 className="mt-3 font-serif text-xl text-ink sm:text-2xl">{t("storyRootsTitle")}</h3>
                <p className={`mt-4 ${STORY_BODY_COMPACT_CLASS}`}>{t("storyRootsP1")}</p>
                <div className="mt-6 w-full">
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
              </article>
            </div>
          </WholesaleStoryCollapsible>
          </div>
        </section>
      </div>
    </>
  );
}
