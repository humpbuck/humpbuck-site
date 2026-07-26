import { redirect } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFlashMessage } from "@/components/admin/admin-flash-message";
import { PendingActionButton } from "@/components/admin/pending-action-button";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import {
  getSiteVideoTutorialForAdmin,
  saveSiteVideoTutorial,
} from "@/lib/site-video-tutorial-queries";

export const dynamic = "force-dynamic";

function goVideoTutorial(params?: { error?: string; success?: string }): never {
  const error = params?.error?.trim();
  const success = params?.success?.trim();
  if (!error && !success) {
    redirect(adminPath("/video-tutorial"));
  }
  const qs = new URLSearchParams();
  if (error) qs.set("error", error);
  if (success) qs.set("success", success);
  redirect(`${adminPath("/video-tutorial")}?${qs.toString()}`);
}

async function saveVideoTutorialAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const title = String(formData.get("title") ?? "");
  const r2VideoUrl = String(formData.get("r2VideoUrl") ?? "");
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "");

  try {
    await saveSiteVideoTutorial({ title, r2VideoUrl, youtubeUrl });
  } catch (error) {
    const note =
      error instanceof Error ? error.message : "Could not save video tutorial.";
    goVideoTutorial({ error: note });
  }

  revalidateStorefrontPath("/video-tutorial");
  goVideoTutorial({ success: "Video tutorial page saved." });
}

export default async function AdminVideoTutorialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await assertAdmin();
  const { content, updatedAt } = await getSiteVideoTutorialForAdmin();
  const { error, success } = await searchParams;

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Video tutorial</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Storefront page at <code className="text-ink">/video-tutorial</code>.
        Left player uses the R2 (or direct MP4) URL; right player is YouTube for
        customers if the primary stream is slow. Both frames are 16:9.
      </p>
      {updatedAt ? (
        <p className="mt-1 text-[11px] text-muted">
          Last saved {updatedAt.toISOString().replace("T", " ").slice(0, 19)} UTC
        </p>
      ) : null}

      {error ? (
        <AdminFlashMessage
          kind="error"
          message={error}
          clearHref={adminPath("/video-tutorial")}
        />
      ) : null}
      {success ? (
        <AdminFlashMessage
          kind="success"
          message={success}
          clearHref={adminPath("/video-tutorial")}
        />
      ) : null}

      <form
        key={`${content.title}|${content.r2VideoUrl}|${content.youtubeUrl}|${updatedAt?.toISOString() ?? "empty"}`}
        action={saveVideoTutorialAction}
        className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-line bg-white/50 p-5"
      >
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Page title
          </span>
          <input
            name="title"
            defaultValue={content.title}
            placeholder="Video tutorial"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
          />
          <span className="mt-1 block text-[11px] text-muted">
            Leave blank to use the storefront default title.
          </span>
        </label>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Left — R2 / MP4 URL
          </span>
          <input
            name="r2VideoUrl"
            defaultValue={content.r2VideoUrl}
            placeholder="https://assets.humpbuck.com/…/tutorial.mp4"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Right — YouTube URL
          </span>
          <input
            name="youtubeUrl"
            defaultValue={content.youtubeUrl}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
          />
        </label>

        <PendingActionButton
          idleLabel="Save"
          pendingLabel="Saving…"
          className="rounded-lg bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
        />
      </form>
    </div>
  );
}
