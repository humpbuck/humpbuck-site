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

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function assertAdmin() {
  return getAdminToken().then((token) => token && verifyAdminSession(token));
}

export async function GET() {
  const ok = await assertAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const products = await prisma.catalogProduct.findMany({
      where: { status: { not: "archived" } },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    const inventory = await prisma.productInventory.findMany({
      orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
    });
    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        highlights: parseJsonArray<string>(p.highlightsJson, []),
        specs: parseJsonArray<ProductSpec>(p.specsJson, []),
        gallery: parseJsonArray<string>(p.galleryJson, []),
        detail: parseJsonArray<string>(p.detailJson, []),
        variants: parseJsonArray<ProductVariant>(p.variantsJson, []),
        promoVideo: p.promoVideoJson
          ? (() => {
              try {
                return JSON.parse(p.promoVideoJson) as { src: string; poster?: string };
              } catch {
                return null;
              }
            })()
          : null,
      })),
      inventory,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to load products: ${msg}` },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const ok = await assertAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    const created = await prisma.catalogProduct.create({
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
        status: String(body.status ?? "active").toLowerCase() === "archived" ? "archived" : "active",
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

    for (const row of inventory) {
      const variantId = asString(row.variantId).trim();
      await prisma.productInventory.upsert({
        where: { productSlug_variantId: { productSlug: slug, variantId } },
        create: {
          productSlug: slug,
          variantId,
          quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
          lowStockThreshold: Math.max(0, Math.floor(Number(row.lowStockThreshold) || 5)),
        },
        update: {
          quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
          lowStockThreshold: Math.max(0, Math.floor(Number(row.lowStockThreshold) || 5)),
        },
      });
    }

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to save product: ${msg}` },
      { status: 500 },
    );
  }
}
