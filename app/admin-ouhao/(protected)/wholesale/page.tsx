import { AdminBackLink } from "@/components/admin/admin-back-link";
import { WholesaleListingManager } from "@/components/admin/wholesale-listing-manager";
import { adminPath } from "@/lib/admin-path";
import { listWholesaleListingsAdmin } from "@/lib/wholesale-listings";

export default async function AdminWholesalePage() {
  const listings = await listWholesaleListingsAdmin();
  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Wholesale listings</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Manage products shown on the public wholesale page. Set a unique slug for Facebook
        links (e.g. /wholesale/model-001). One R2 URL per field; model number is display-only.
      </p>
      <div className="mt-6">
        <WholesaleListingManager initialRows={listings} />
      </div>
    </div>
  );
}
