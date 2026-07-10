import { redirect } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
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
  resolveSiteHomeContentForAdminForm,
  siteHomeContentFromFormData,
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

async function saveHomepageContentAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const data = siteHomeContentFromFormData(formData);
  const validationError = validateSiteHomeContent(data);
  if (validationError) {
    goHomepage({ error: validationError });
  }

  try {
    await saveSiteHomeContent(data);
  } catch (error) {
    const note =
      error instanceof Error ? error.message : "Could not save homepage content.";
    goHomepage({ error: note });
  }

  revalidateStorefrontHomepage();
  goHomepage({
    success:
      "Homepage hero, coupon, spotlight, and about sections saved. Changes should appear on the live site immediately.",
  });
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
    heroBadge: "Gifts · Time & Love",
    heroTitle: "HUMPBUCK Watches",
    heroLead:
      "Handcrafted timepieces designed to stay by your side and witness life's meaningful moments.",
    heroChip1: "Craftsmanship",
    heroChip2: "Milestones",
    heroChip3: "Companionship",
    heroCtaShop: "Shop",
    heroImageAlt: "HUMPBUCK homepage hero — handcrafted premium timepieces",
    heroDesktopImageUrl: defaultHeroDesktop,
    heroMobileImageUrl: defaultHeroMobile,
    aboutHeading: "About",
    aboutParagraph1:
      "I have loved mechanical watches since I was a child. Back then, my family was poor, and I couldn't afford one. However, I was completely fascinated by how the intricate gears interlock and how the complex mechanical structures work together to keep precise time.",
    aboutParagraph2: "",
    aboutImageAlt:
      "Mechanical watch on a wooden post with a child in a rural village in the background",
    aboutImageUrl: defaultAboutImage,
    spotlightBackgroundImageUrl: defaultSpotlightBackground,
    couponTitle: "Get a coupon",
    couponQuestion: "What's the most precious thing in life?",
    couponSuccessMessage: "",
    couponTagline: "Life has no standard answer.\nJust live it your way.",
    couponBackgroundImageUrl: "",
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Homepage hero &amp; about</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Edit the homepage hero banner and founder story (about) section. Fields
        show the copy currently live on the site. Clear a field and save to
        restore the built-in default. Image fields accept full R2 or HTTPS URLs.
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
        className="mt-8 max-w-2xl space-y-10"
      >
        <fieldset className="space-y-4 rounded-2xl border border-line bg-white/60 p-5">
          <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
            Hero section
          </legend>

          <AdminField
            label="Badge"
            name="heroBadge"
            defaultValue={content.heroBadge}
            placeholder="Gifts · Time & Love"
          />
          <AdminField
            label="Title"
            name="heroTitle"
            defaultValue={content.heroTitle}
            placeholder="HUMPBUCK Watches"
          />
          <AdminField
            label="Lead paragraph"
            name="heroLead"
            defaultValue={content.heroLead}
            multiline
            placeholder="Handcrafted timepieces designed to stay by your side…"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminField
              label="Chip 1"
              name="heroChip1"
              defaultValue={content.heroChip1}
              placeholder="Craftsmanship"
            />
            <AdminField
              label="Chip 2"
              name="heroChip2"
              defaultValue={content.heroChip2}
              placeholder="Milestones"
            />
            <AdminField
              label="Chip 3"
              name="heroChip3"
              defaultValue={content.heroChip3}
              placeholder="Companionship"
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
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-line bg-white/60 p-5">
          <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
            Coupon prompt section
          </legend>
          <p className="text-sm text-muted">
            Interactive block directly below the hero. Assign the coupon code
            under Coupons → Homepage coupon. Leave background blank for the
            default solid site color.
          </p>
          <AdminField
            label="Background image URL"
            name="couponBackgroundImageUrl"
            defaultValue={content.couponBackgroundImageUrl}
            placeholder="https://assets.humpbuck.com/…"
            hint="Optional. Full R2 or HTTPS image URL."
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
            hint='Two lines in the popup above "Your Coupon is …". Separate lines with Enter, or use a semicolon. Coupon code comes from Coupons → Homepage coupon.'
          />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-line bg-white/60 p-5">
          <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
            Product spotlight section
          </legend>
          <p className="text-sm text-muted">
            The featured product block directly below the hero (gear-pattern
            background). Product selection stays in Products &amp; Inventory →
            Homepage spotlight.
          </p>
          <AdminField
            label="Background image URL"
            name="spotlightBackgroundImageUrl"
            defaultValue={content.spotlightBackgroundImageUrl}
            placeholder={defaultSpotlightBackground}
            hint={`Default: ${defaultSpotlightBackground}. Use the plain R2 URL; after each save the storefront adds ?v= from save time so CDN/browser pick up same-path overwrites.`}
          />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-line bg-white/60 p-5">
          <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
            About section
          </legend>

          <AdminField
            label="Heading"
            name="aboutHeading"
            defaultValue={content.aboutHeading}
            placeholder="About"
          />
          <AdminField
            label="Paragraph 1"
            name="aboutParagraph1"
            defaultValue={content.aboutParagraph1}
            multiline
            placeholder="I have loved mechanical watches since I was a child…"
          />
          <AdminField
            label="About image alt text"
            name="aboutImageAlt"
            defaultValue={content.aboutImageAlt}
            placeholder="Mechanical watch on a wooden post with a child in a rural village in the background"
          />
          <AdminField
            label="About image URL"
            name="aboutImageUrl"
            defaultValue={content.aboutImageUrl}
            placeholder={defaultAboutImage}
            hint={`Default: ${defaultAboutImage}`}
          />
        </fieldset>

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
