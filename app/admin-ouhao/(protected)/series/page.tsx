import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminCategoriesPanel } from "@/components/admin/admin-categories-panel";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  await assertAdmin();

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Series</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Create and reorder shop series. Assign a series when editing a product.
      </p>
      <AdminCategoriesPanel />
    </div>
  );
}
