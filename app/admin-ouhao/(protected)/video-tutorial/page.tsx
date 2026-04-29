import { AdminBackLink } from "@/components/admin/admin-back-link";
import { VideoTutorialManager } from "@/components/admin/video-tutorial-manager";
import { adminPath } from "@/lib/admin-path";
import { listVideoTutorials } from "@/lib/video-tutorials";

export default async function AdminVideoTutorialPage() {
  const tutorials = await listVideoTutorials();
  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Video tutorial</h1>
      <p className="mt-2 text-sm text-muted">
        Manage tutorial video links by product. Supports R2, YouTube, and other platform URLs.
      </p>
      <div className="mt-6">
        <VideoTutorialManager initialRows={tutorials} />
      </div>
    </div>
  );
}
