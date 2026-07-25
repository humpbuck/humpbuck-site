import { redirect } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminCollapsibleSection } from "@/components/admin/admin-collapsible-section";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { FaqItemsEditor } from "@/components/admin/faq-items-editor";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  flagshipCategoryBackgroundWebpUrl,
  founderStoryHomePoolWebpUrl,
  homeHeroDesktopWebpUrl,
  homeHeroMobileWebpUrl,
} from "@/lib/r2";
import { revalidateStorefrontHomepage } from "@/lib/revalidate-storefront";
import {
  getSiteHomeContentForAdmin,
  saveSiteHomeContent,
} from "@/lib/site-home-content-queries";
import {
  parseFaqItemsFromAdminForm,
  resolveHomeFaqItemsForAdmin,
  resolveSiteHomeContentForAdminForm,
  siteHomeContentFromFormData,
  validateHomeFaqItems,
  validateSiteHomeContent,
} from "@/lib/site-home-content";

export const dynamic = "force-dynamic";

function goHomepage(params?: { error?: string; success?: string }): never {
  const error = params?.error?.trim();
  const success = params?.success?.trim();
  if (!error && !success) {
    redirect(adminPath("/homepage"));
  }
  const qs = new URLSearchParams();
  if (error) qs.set("error", error);
  if (success) qs.set("success", success);
  redirect(`${adminPath("/homepage")}?${qs.toString()}`);
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function saveHomepageContentAction(formData: FormData) {
  "use server";
  try {
    await assertAdmin();

    const faqRaw = String(formData.get("faqItemsJson") ?? "");
    const { items: faqItems, error: faqParseError } = parseFaqItemsFromAdminForm(faqRaw);
    if (faqParseError) {
      goHomepage({ error: faqParseError });
    }

    const faqValidationError = validateHomeFaqItems(faqItems);
    if (faqValidationError) {
      goHomepage({ error: faqValidationError });
    }

    const { content: storedContent } = await getSiteHomeContentForAdmin();
    const data = siteHomeContentFromFormData(formData, faqItems);
    const validationError = validateSiteHomeContent({
      ...data,
      aboutHeading: storedContent.aboutHeading,
      aboutParagraph1: storedContent.aboutParagraph1,
      aboutParagraph2: storedContent.aboutParagraph2,
      aboutImageAlt: storedContent.aboutImageAlt,
      aboutImageUrl: storedContent.aboutImageUrl,
    });
    if (validationError) {
      goHomepage({ error: validationError });
    }

    try {
      await saveSiteHomeContent({
        ...data,
        aboutHeading: storedContent.aboutHeading,
        aboutParagraph1: storedContent.aboutParagraph1,
        aboutParagraph2: storedContent.aboutParagraph2,
        aboutImageAlt: storedContent.aboutImageAlt,
        aboutImageUrl: storedContent.aboutImageUrl,
        certaintyLead: storedContent.certaintyLead,
        certaintyExtraBlocks: storedContent.certaintyExtraBlocks,
        couponSuccessMessage: storedContent.couponSuccessMessage,
      });
    } catch (error) {
      const note =
        error instanceof Error ? error.message : "Could not save homepage content.";
      goHomepage({ error: note });
    }

    try {
      revalidateStorefrontHomepage();
    } catch {
      /* OpenNext on Cloudflare may reject revalidate; D1 reads are live via connection(). */
    }

    goHomepage({
      success:
        "Homepage hero, moments, coupon, spotlight, and FAQ saved. Changes should appear on the live site immediately.",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const note =
      error instanceof Error ? error.message : "Could not save homepage content.";
    goHomepage({ error: note });
  }
}

function AdminField({
  label,
  name,
  defaultValue,
  placeholder,
  multiline = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  const inputClass =
    "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25";

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      {multiline ? (
        <textarea
          name={name}
          rows={4}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`${inputClass} min-h-[6rem] resize-y`}
        />
      ) : (
        <input
          name={name}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {hint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hint}</p>
      ) : null}
    </label>
  );
}

export default async function AdminHomepageContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const { content: storedContent, updatedAt } = await getSiteHomeContentForAdmin();
  const { error, success } = await searchParams;

  const defaultHeroDesktop = homeHeroDesktopWebpUrl();
  const defaultHeroMobile = homeHeroMobileWebpUrl();
  const defaultAboutImage = founderStoryHomePoolWebpUrl();
  const defaultSpotlightBackground = flagshipCategoryBackgroundWebpUrl();

  const content = resolveSiteHomeContentForAdminForm(storedContent, {
    heroBadge: "ANA-DIGI · TEMP",
    heroTitle: "ANA-DIGI Temperature",
    heroLead:
      "Retro ana-digi watches blending analog precision, digital functions, and futuristic design.",
    heroChip1: "TIME",
    heroChip2: "DATE",
    heroChip3: "ALM",
    heroChip4: "DU.T",
    heroChip5: "ST.W",
    heroCtaShop: "Shop",
    heroImageAlt: "HUMPBUCK homepage hero — handcrafted premium timepieces",
    heroDesktopImageUrl: defaultHeroDesktop,
    heroMobileImageUrl: defaultHeroMobile,
    momentsHeading: "Made for Every Mode",
    momentsLead:
      "From everyday routines to new adventures, one watch keeps up with every moment.",
    momentsCard1Title: "Everyday Mode",
    momentsCard1Description:
      "Time, date, alarm, and dual time for the rhythm of daily life.",
    momentsCard1DesktopImageUrl:
      "https://assets.humpbuck.com/Home/section2/Everyday-Mode-PC.webp",
    momentsCard1MobileImageUrl:
      "https://assets.humpbuck.com/Home/section2/Everyday-Mode-APP.webp",
    momentsCard2Title: "Adventure Mode",
    momentsCard2Description:
      "Stopwatch and dual time for travel, movement, and everything ahead.",
    momentsCard2DesktopImageUrl:
      "https://assets.humpbuck.com/Home/section2/Adventure-Mode-PC.webp",
    momentsCard2MobileImageUrl:
      "https://assets.humpbuck.com/Home/section2/Adventure-Mode-APP.webp",
    aboutHeading: "About",
    aboutParagraph1:
      "Growing up, I watched my father—a master watch repairman—breathe life into countless timepieces after school. As he stayed by my side through my milestones, those watches marked every beat of my journey. That is where our bond was born. Time and companionship are life's most precious gifts. Now, I hope my handcrafted HUMPBUCK watches will stay by your side and bear witness to your most meaningful moments.",
    aboutParagraph2: "",
    aboutImageAlt:
      "Father and young son examining a watch movement together at a watchmaker's workbench",
    aboutImageUrl: defaultAboutImage,
    spotlightBackgroundImageUrl: defaultSpotlightBackground,
    spotlightBackgroundMobileImageUrl: "",
    spotlightProductImageUrl: "",
    couponTitle: "Get a coupon",
    couponQuestion: "What's the most precious thing in life?",
    couponSuccessMessage: "",
    couponTagline: "Life has no standard answer.\nJust live it your way.",
    couponBackgroundImageUrl: "",
    certaintyHeading: "Frequently asked questions",
    certaintyLead: "",
    certaintyExtraBlocks: "",
    faqItem1Question: "What currency are prices shown in?",
    faqItem1Answer:
      "All prices are listed in US dollars. Use the currency control at the bottom-left of your screen for a live reference conversion. Your card or wallet is charged in USD at checkout.",
    faqItem2Question: "Do you ship to my country?",
    faqItem2Answer:
      "We ship to most countries worldwide. Orders are processed within three business days; tracked delivery typically arrives in 7–21 days depending on your region. Any shipping fee is calculated and shown before you pay.",
    faqItem3Question: "Which payment methods do you accept?",
    faqItem3Answer:
      "Pay with PayPal, major credit and debit cards, Apple Pay, or Google Pay — processed through trusted payment partners with encrypted checkout.",
    faqItemsJson: "",
  });

  const faqItemsForAdmin = resolveHomeFaqItemsForAdmin(content, [
    {
      question: "What currency are prices shown in?",
      answer:
        "All prices are listed in US dollars. Use the currency control at the bottom-left of your screen for a live reference conversion. Your card or wallet is charged in USD at checkout.",
    },
    {
      question: "Do you ship to my country?",
      answer:
        "We ship to most countries worldwide. Orders are processed within three business days; tracked delivery typically arrives in 7–21 days depending on your region. Any shipping fee is calculated and shown before you pay.",
    },
    {
      question: "Which payment methods do you accept?",
      answer:
        "Pay with PayPal, major credit and debit cards, Apple Pay, or Google Pay — processed through trusted payment partners with encrypted checkout.",
    },
  ]);

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Homepage content</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Edit the homepage hero banner, moments, coupon, spotlight, and FAQ. Fields
        show the copy currently live on the site. Clear a field and save to
        restore the built-in default.
      </p>

      {error ? (
        <AdminFlashMessage
          kind="error"
          message={error}
          clearHref={adminPath("/homepage")}
        />
      ) : null}
      {success ? (
        <AdminFlashMessage
          kind="success"
          message={success}
          clearHref={adminPath("/homepage")}
        />
      ) : null}

      <form
        key={updatedAt ?? "empty"}
        action={saveHomepageContentAction}
        className="mt-8 max-w-2xl space-y-4"
      >
        <AdminCollapsibleSection title="Hero section">
          <AdminField
            label="Badge"
            name="heroBadge"
            defaultValue={content.heroBadge}
            placeholder="ANA-DIGI · TEMP"
          />
          <AdminField
            label="Title"
            name="heroTitle"
            defaultValue={content.heroTitle}
            placeholder="ANA-DIGI Temperature"
          />
          <AdminField
            label="Lead paragraph"
            name="heroLead"
            defaultValue={content.heroLead}
            multiline
            placeholder="Retro ana-digi watches blending analog precision…"
          />
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
            <AdminField
              label="Chip 1"
              name="heroChip1"
              defaultValue={content.heroChip1}
              placeholder="TIME"
            />
            <AdminField
              label="Chip 2"
              name="heroChip2"
              defaultValue={content.heroChip2}
              placeholder="DATE"
            />
            <AdminField
              label="Chip 3"
              name="heroChip3"
              defaultValue={content.heroChip3}
              placeholder="ALM"
            />
            <AdminField
              label="Chip 4"
              name="heroChip4"
              defaultValue={content.heroChip4}
              placeholder="DU.T"
            />
            <AdminField
              label="Chip 5"
              name="heroChip5"
              defaultValue={content.heroChip5}
              placeholder="ST.W"
            />
          </div>
          <AdminField
            label="Shop button"
            name="heroCtaShop"
            defaultValue={content.heroCtaShop}
            placeholder="Shop"
          />
          <AdminField
            label="Hero image alt text"
            name="heroImageAlt"
            defaultValue={content.heroImageAlt}
            placeholder="HUMPBUCK homepage hero — handcrafted premium timepieces"
          />
          <AdminField
            label="Desktop hero image URL"
            name="heroDesktopImageUrl"
            defaultValue={content.heroDesktopImageUrl}
            placeholder={defaultHeroDesktop}
            hint={`Default: ${defaultHeroDesktop}`}
          />
          <AdminField
            label="Mobile hero image URL"
            name="heroMobileImageUrl"
            defaultValue={content.heroMobileImageUrl}
            placeholder={defaultHeroMobile}
            hint={`Default: ${defaultHeroMobile}`}
          />
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="Moments section">
          <AdminField
            label="Section heading"
            name="momentsHeading"
            defaultValue={content.momentsHeading}
            placeholder="Made for Every Mode"
          />
          <AdminField
            label="Section lead"
            name="momentsLead"
            defaultValue={content.momentsLead}
            multiline
            placeholder="From everyday routines to new adventures, one watch keeps up with every moment."
          />
          <p className="text-[11px] leading-relaxed text-muted">
            Card 1 — Everyday Mode
          </p>
          <AdminField
            label="Card 1 title"
            name="momentsCard1Title"
            defaultValue={content.momentsCard1Title}
            placeholder="Everyday Mode"
          />
          <AdminField
            label="Card 1 description"
            name="momentsCard1Description"
            defaultValue={content.momentsCard1Description}
            multiline
            placeholder="Time, date, alarm, and dual time for the rhythm of daily life."
          />
          <AdminField
            label="Card 1 image URL (PC)"
            name="momentsCard1DesktopImageUrl"
            defaultValue={content.momentsCard1DesktopImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Wide horizontal image for desktop — text overlays the bottom."
          />
          <AdminField
            label="Card 1 image URL (mobile / APP)"
            name="momentsCard1MobileImageUrl"
            defaultValue={content.momentsCard1MobileImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional. Vertical card image for mobile. Blank = same as PC."
          />
          <p className="pt-2 text-[11px] leading-relaxed text-muted">
            Card 2 — Adventure Mode
          </p>
          <AdminField
            label="Card 2 title"
            name="momentsCard2Title"
            defaultValue={content.momentsCard2Title}
            placeholder="Adventure Mode"
          />
          <AdminField
            label="Card 2 description"
            name="momentsCard2Description"
            defaultValue={content.momentsCard2Description}
            multiline
            placeholder="Stopwatch and dual time for travel, movement, and everything ahead."
          />
          <AdminField
            label="Card 2 image URL (PC)"
            name="momentsCard2DesktopImageUrl"
            defaultValue={content.momentsCard2DesktopImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Wide horizontal image for desktop — text overlays the bottom."
          />
          <AdminField
            label="Card 2 image URL (mobile / APP)"
            name="momentsCard2MobileImageUrl"
            defaultValue={content.momentsCard2MobileImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional. Vertical card image for mobile. Blank = same as PC."
          />
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="Coupon prompt section">
          <AdminField
            label="Background image URL"
            name="couponBackgroundImageUrl"
            defaultValue={content.couponBackgroundImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional. Coupon code under Coupons → Homepage coupon."
          />
          <AdminField
            label="Title"
            name="couponTitle"
            defaultValue={content.couponTitle}
            placeholder="Get a coupon"
          />
          <AdminField
            label="Question"
            name="couponQuestion"
            defaultValue={content.couponQuestion}
            placeholder="What's the most precious thing in life?"
          />
          <AdminField
            label="Modal tagline"
            name="couponTagline"
            defaultValue={content.couponTagline}
            multiline
            placeholder={"Life has no standard answer.\nJust live it your way."}
          />
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="Product spotlight section">
          <AdminField
            label="Background image URL (PC)"
            name="spotlightBackgroundImageUrl"
            defaultValue={content.spotlightBackgroundImageUrl}
            placeholder={defaultSpotlightBackground}
            hint={`Product under Products → Homepage spotlight. PC default: ${defaultSpotlightBackground}`}
          />
          <AdminField
            label="Background image URL (mobile / APP)"
            name="spotlightBackgroundMobileImageUrl"
            defaultValue={content.spotlightBackgroundMobileImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional. Blank = same as PC."
          />
          <AdminField
            label="Product image URL (transparent WEBP)"
            name="spotlightProductImageUrl"
            defaultValue={content.spotlightProductImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional cutout. Blank = catalog cover image."
          />
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="FAQ">
          <AdminField
            label="Section heading"
            name="certaintyHeading"
            defaultValue={content.certaintyHeading}
            placeholder="Frequently asked questions"
          />
          <FaqItemsEditor initialItems={faqItemsForAdmin} />
        </AdminCollapsibleSection>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          Save homepage content
        </button>
      </form>
    </div>
  );
}
