import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/lib/catalog";
import { InventoryTable } from "@/components/admin/inventory-table";

export default async function AdminInventoryPage() {
  const products = getAllProducts();
  const records = await prisma.productInventory.findMany({
    orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
  });

  const lowStock = records.filter((r) => r.quantity <= r.lowStockThreshold && r.quantity > 0);
  const outOfStock = records.filter((r) => r.quantity === 0);

  // Build a map for quick lookup
  const inventoryMap: Record<string, { quantity: number; lowStockThreshold: number }> = {};
  for (const r of records) {
    inventoryMap[`${r.productSlug}::${r.variantId}`] = {
      quantity: r.quantity,
      lowStockThreshold: r.lowStockThreshold,
    };
  }

  // Build rows for the table
  const rows: {
    productSlug: string;
    productName: string;
    variantId: string;
    variantLabel: string;
    quantity: number;
    lowStockThreshold: number;
    hasRecord: boolean;
  }[] = [];

  for (const p of products) {
    if (p.variantOptions?.length) {
      for (const v of p.variantOptions) {
        const key = `${p.slug}::${v.id}`;
        const inv = inventoryMap[key];
        rows.push({
          productSlug: p.slug,
          productName: p.name,
          variantId: v.id,
          variantLabel: v.label,
          quantity: inv?.quantity ?? -1, // -1 = no record (unlimited)
          lowStockThreshold: inv?.lowStockThreshold ?? 5,
          hasRecord: !!inv,
        });
      }
    } else {
      const key = `${p.slug}::`;
      const inv = inventoryMap[key];
      rows.push({
        productSlug: p.slug,
        productName: p.name,
        variantId: "",
        variantLabel: "",
        quantity: inv?.quantity ?? -1,
        lowStockThreshold: inv?.lowStockThreshold ?? 5,
        hasRecord: !!inv,
      });
    }
  }

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Inventory</h1>
      <p className="mt-2 text-sm text-muted">
        Manage stock levels for each product and variant. Items without an
        inventory record are treated as unlimited stock.
      </p>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {outOfStock.length > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              {outOfStock.length} out of stock
            </span>
          )}
          {lowStock.length > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {lowStock.length} low stock
            </span>
          )}
        </div>
      )}

      <div className="mt-8">
        <InventoryTable rows={rows} />
      </div>
    </div>
  );
}
