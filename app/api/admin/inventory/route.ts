import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/** GET — list all inventory records. */
export async function GET() {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.productInventory.findMany({
    orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
  });
  return NextResponse.json(records);
}

/** POST — upsert a single inventory record. */
export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    productSlug?: string;
    variantId?: string;
    quantity?: number;
    lowStockThreshold?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productSlug = String(body.productSlug ?? "").trim();
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
  }

  const variantId = String(body.variantId ?? "").trim();
  const quantity = Math.max(0, Math.floor(Number(body.quantity) || 0));
  const lowStockThreshold = Math.max(0, Math.floor(Number(body.lowStockThreshold) || 5));

  const record = await prisma.productInventory.upsert({
    where: { productSlug_variantId: { productSlug, variantId } },
    create: { productSlug, variantId, quantity, lowStockThreshold },
    update: { quantity, lowStockThreshold },
  });

  return NextResponse.json(record);
}

/** PATCH — bulk update inventory (array of records). */
export async function PATCH(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    updates?: {
      productSlug: string;
      variantId?: string;
      quantity: number;
      lowStockThreshold?: number;
    }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const results = await prisma.$transaction(
    body.updates.map((u) => {
      const productSlug = String(u.productSlug).trim();
      const variantId = String(u.variantId ?? "").trim();
      const quantity = Math.max(0, Math.floor(Number(u.quantity) || 0));
      const lowStockThreshold = Math.max(0, Math.floor(Number(u.lowStockThreshold) || 5));
      return prisma.productInventory.upsert({
        where: { productSlug_variantId: { productSlug, variantId } },
        create: { productSlug, variantId, quantity, lowStockThreshold },
        update: { quantity, lowStockThreshold },
      });
    }),
  );

  return NextResponse.json({ ok: true, count: results.length });
}
