import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/admin/product-manager";

export default async function AdminInventoryPage() {
  const products = await prisma.catalogProduct.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
  const inventory = await prisma.productInventory.findMany({
    orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Products & Inventory</h1>
      <p className="mt-2 text-sm text-muted">
        Create, update, and delete products. Manage inventory, media, and product copy in one place.
      </p>

      <div className="mt-8">
        <ProductManager
          initialProducts={products}
          initialInventory={inventory}
        />
      </div>
    </div>
  );
}
