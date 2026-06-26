import { AnnouncementBackgroundColorField } from "@/components/admin/announcement-background-color-field";
import { AnnouncementSlidesEditor } from "@/components/admin/announcement-slides-editor";
import { redirect } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { revalidateStorefrontShell, revalidateSiteAnnouncement } from "@/lib/revalidate-storefront";
import {
  getSiteAnnouncement,
  saveSiteAnnouncement,
} from "@/lib/site-announcement-queries";
import {
  normalizeAnnouncementBackgroundColor,
  normalizeAnnouncementSlides,
  parseAnnouncementSlidesJson,
  validateAnnouncementSlideHref,
} from "@/lib/site-announcement";

export const dynamic = "force-dynamic";

function goAnnouncement(params?: { error?: string; success?: string }): never {
  const error = params?.error?.trim();
  const success = params?.success?.trim();
  if (!error && !success) {
    redirect(adminPath("/announcement"));
  }
  const qs = new URLSearchParams();
  if (error) qs.set("error", error);
  if (success) qs.set("success", success);
  redirect(`${adminPath("/announcement")}?${qs.toString()}`);
}

async function saveAnnouncementAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const enabled = formData.get("enabled") === "on";
  const slidesJson = String(formData.get("slidesJson") ?? "");
  const slides = normalizeAnnouncementSlides(
    parseAnnouncementSlidesJson(slidesJson),
  );
  const backgroundColor = normalizeAnnouncementBackgroundColor(
    String(formData.get("backgroundColor") ?? ""),
  );

  if (enabled && slides.length === 0) {
    goAnnouncement({
      error: "Add at least one slide message when the bar is enabled.",
    });
  }

  if (!backgroundColor) {
    goAnnouncement({ error: "Bar color must be a hex value like #0f1114." });
  }

  for (const slide of slides) {
    if (!validateAnnouncementSlideHref(slide.href)) {
      goAnnouncement({ error: "Each link must start with / or http(s)://." });
    }
  }

  let result: Awaited<ReturnType<typeof saveSiteAnnouncement>>;
  try {
    result = await saveSiteAnnouncement({
      enabled,
      slides,
      backgroundColor,
    });
  } catch (error) {
    const note =
      error instanceof Error ? error.message : "Could not save announcement.";
    goAnnouncement({ error: note });
  }

  revalidateSiteAnnouncement();
  revalidateStorefrontShell();
  if (!result.colorSaved) {
    goAnnouncement({
      success:
        "Slides saved. Bar color needs `npm run db:migrate` + restart dev, then save again.",
    });
  }
  goAnnouncement({ success: "Homepage announcement saved." });
}

export default async function AdminAnnouncementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const announcement = await getSiteAnnouncement();
  const { error, success } = await searchParams;

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Homepage announcement</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Promo bar at the top of the storefront homepage. Add multiple slides —
        they rotate automatically like a ticker. Customize bar color without
        redeploying.
      </p>

      {error ? (
        <AdminFlashMessage
          kind="error"
          message={error}
          clearHref={adminPath("/announcement")}
        />
      ) : null}
      {success ? (
        <AdminFlashMessage
          kind="success"
          message={success}
          clearHref={adminPath("/announcement")}
        />
      ) : null}

      <form action={saveAnnouncementAction} className="mt-8 max-w-2xl space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm text-ink">
          <span>Show on homepage</span>
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={announcement.enabled}
            className="h-4 w-4"
          />
        </label>

        <AnnouncementSlidesEditor initialSlides={announcement.slides} />

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Bar color
          </span>
          <AnnouncementBackgroundColorField
            defaultValue={announcement.backgroundColor}
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          Save announcement
        </button>
      </form>
    </div>
  );
}
