import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type ProductSpec = { label: string; value: string };
type ProductVariant = {
  id: string;
  label: string;
  image: string;
  inStock?: boolean;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeSlug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "product"
  );
}

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = normalizeSlug(asString(body.slug));
  const name = asString(body.name).trim();
  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }
  const variants = Array.isArray(body.variants) ? (body.variants as ProductVariant[]) : [];
  const inventory = Array.isArray(body.inventory)
    ? (body.inventory as { variantId?: string; quantity?: number; lowStockThreshold?: number }[])
    : [];

  try {
    const prev =
      (await prisma.catalogProduct.findUnique({ where: { id } })) ??
      (slug ? await prisma.catalogProduct.findUnique({ where: { slug } }) : null);
    if (!prev) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.catalogProduct.update({
      where: { id: prev.id },
      data: {
        slug,
        name,
        seriesSlug: asString(body.seriesSlug, "digitemp") || "digitemp",
        categoryLabel: asString(body.categoryLabel, "Catalog"),
        shortDescription: asString(body.shortDescription),
        description: asString(body.description),
        price: Number(body.price) || 0,
        compareAtPrice:
          body.compareAtPrice === null || body.compareAtPrice === undefined
            ? null
            : Number(body.compareAtPrice) || null,
        image: asString(body.image),
        status: String(body.status ?? prev.status ?? "active").toLowerCase() === "archived" ? "archived" : "active",
        inStock: Boolean(body.inStock),
        highlightsJson: JSON.stringify(
          Array.isArray(body.highlights) ? (body.highlights as string[]) : [],
        ),
        specsJson: JSON.stringify(
          Array.isArray(body.specs) ? (body.specs as ProductSpec[]) : [],
        ),
        galleryJson: JSON.stringify(
          Array.isArray(body.gallery) ? (body.gallery as string[]) : [],
        ),
        detailJson: JSON.stringify(
          Array.isArray(body.detail) ? (body.detail as string[]) : [],
        ),
        variantsJson: JSON.stringify(variants),
        promoVideoJson: body.promoVideo ? JSON.stringify(body.promoVideo) : null,
      },
    });

    if (prev.slug !== slug) {
      await prisma.productInventory.updateMany({
        where: { productSlug: prev.slug },
        data: { productSlug: slug },
      });
    }

    const normalizedVariants = variants.map((v) => asString(v.id).trim()).filter(Boolean);
    const existingInventory = await prisma.productInventory.findMany({ where: { productSlug: slug } });
    const inventoryMap = new Map(existingInventory.map((row) => [row.variantId, row]));

    for (const variantId of normalizedVariants) {
      const row = inventory.find((item) => asString(item.variantId).trim() === variantId);
      const hasQuantity = row?.quantity !== undefined && row?.quantity !== null && String(row.quantity).trim() !== "";
      const hasThreshold = row?.lowStockThreshold !== undefined && row?.lowStockThreshold !== null && String(row.lowStockThreshold).trim() !== "";
      const current = inventoryMap.get(variantId);
      const quantity = hasQuantity ? Math.max(0, Math.floor(Number(row?.quantity) || 0)) : current?.quantity;
      const lowStockThreshold = hasThreshold ? Math.max(0, Math.floor(Number(row?.lowStockThreshold) || 5)) : current?.lowStockThreshold ?? 5;

      if (quantity === undefined) {
        inventoryMap.delete(variantId);
        continue;
      }

      await prisma.productInventory.upsert({
        where: { productSlug_variantId: { productSlug: slug, variantId } },
        create: {
          productSlug: slug,
          variantId,
          quantity,
          lowStockThreshold,
        },
        update: {
          quantity,
          lowStockThreshold,
        },
      });
      inventoryMap.delete(variantId);
    }

    for (const orphan of inventoryMap.values()) {
      await prisma.productInventory.delete({ where: { id: orphan.id } }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to update product: ${msg}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const product = await prisma.catalogProduct.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    await prisma.catalogProduct.update({
      where: { id },
      data: { status: "archived", inStock: false },
    });
    await prisma.productInventory.deleteMany({ where: { productSlug: product.slug } });
    return NextResponse.json({ ok: true, archived: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to delete product: ${msg}` },
      { status: 500 },
    );
  }
}
