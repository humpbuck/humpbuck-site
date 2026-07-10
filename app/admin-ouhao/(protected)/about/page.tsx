import { redirect } from "next/navigation";
import { AboutContentEditor } from "@/components/admin/about-content-editor";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { founderStoryHomePoolWebpUrl } from "@/lib/r2";
import { revalidateStorefrontAbout } from "@/lib/revalidate-storefront";
import {
  getSiteHomeContentForAdmin,
  saveSiteHomeContent,
} from "@/lib/site-home-content-queries";
import {
  mergeSiteHomeAboutFields,
  resolveSiteHomeContentForAdminForm,
  siteHomeAboutFromFormData,
  validateSiteHomeAboutFields,
} from "@/lib/site-home-content";

export const dynamic = "force-dynamic";

function goAbout(params?: { error?: string; success?: string }): never {
  const error = params?.error?.trim();
  const success = params?.success?.trim();
  if (!error && !success) {
    redirect(adminPath("/about"));
  }
  const qs = new URLSearchParams();
  if (error) qs.set("error", error);
  if (success) qs.set("success", success);
  redirect(`${adminPath("/about")}?${qs.toString()}`);
}

async function saveAboutContentAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const about = siteHomeAboutFromFormData(formData);
  const validationError = validateSiteHomeAboutFields(about);
  if (validationError) {
    goAbout({ error: validationError });
  }

  const { content: storedContent } = await getSiteHomeContentForAdmin();
  const merged = mergeSiteHomeAboutFields(storedContent, about);

  try {
    await saveSiteHomeContent(merged);
  } catch (error) {
    const note =
      error instanceof Error ? error.message : "Could not save About content.";
    goAbout({ error: note });
  }

  revalidateStorefrontAbout();
  goAbout({
    success:
      "About section saved. Changes appear on the homepage founder story and /about page.",
  });
}

export default async function AdminAboutContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const { content: storedContent, updatedAt } = await getSiteHomeContentForAdmin();
  const { error, success } = await searchParams;

  const defaultAboutImage = founderStoryHomePoolWebpUrl();
  const content = resolveSiteHomeContentForAdminForm(storedContent, {
    heroBadge: "",
    heroTitle: "",
    heroLead: "",
    heroChip1: "",
    heroChip2: "",
    heroChip3: "",
    heroCtaShop: "",
    heroImageAlt: "",
    heroDesktopImageUrl: "",
    heroMobileImageUrl: "",
    aboutHeading: "About",
    aboutParagraph1:
      "Growing up, I watched my father—a master watch repairman—breathe life into countless timepieces after school. As he stayed by my side through my milestones, those watches marked every beat of my journey. That is where our bond was born. Time and companionship are life's most precious gifts. Now, I hope my handcrafted HUMPBUCK watches will stay by your side and bear witness to your most meaningful moments.",
    aboutParagraph2: "",
    aboutImageAlt:
      "Mechanical watch on a wooden post with a child in a rural village in the background",
    aboutImageUrl: defaultAboutImage,
    spotlightBackgroundImageUrl: "",
    spotlightBackgroundMobileImageUrl: "",
    spotlightProductImageUrl: "",
    couponTitle: "",
    couponQuestion: "",
    couponSuccessMessage: "",
    couponTagline: "",
    couponBackgroundImageUrl: "",
    certaintyHeading: "",
    certaintyLead: "",
    certaintyExtraBlocks: "",
    faqItem1Question: "",
    faqItem1Answer: "",
    faqItem2Question: "",
    faqItem2Answer: "",
    faqItem3Question: "",
    faqItem3Answer: "",
    faqItemsJson: "",
    momentsHeading: "",
    momentsLead: "",
    momentsCard1Title: "",
    momentsCard1Description: "",
    momentsCard1DesktopImageUrl: "",
    momentsCard1MobileImageUrl: "",
    momentsCard2Title: "",
    momentsCard2Description: "",
    momentsCard2DesktopImageUrl: "",
    momentsCard2MobileImageUrl: "",
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">About page</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Edit the founder story shown on the homepage and About page — heading,
        story text, and left-side image. Upload WEBP to R2 or paste a public URL.
      </p>

      {error ? (
        <AdminFlashMessage
          kind="error"
          message={error}
          clearHref={adminPath("/about")}
        />
      ) : null}
      {success ? (
        <AdminFlashMessage
          kind="success"
          message={success}
          clearHref={adminPath("/about")}
        />
      ) : null}

      <form
        key={updatedAt ?? "empty"}
        action={saveAboutContentAction}
        className="mt-8 max-w-2xl"
      >
        <AboutContentEditor
          initialHeading={content.aboutHeading}
          initialParagraph1={content.aboutParagraph1}
          initialImageAlt={content.aboutImageAlt}
          initialImageUrl={content.aboutImageUrl}
          defaultImageUrl={defaultAboutImage}
        />
      </form>
    </div>
  );
}
