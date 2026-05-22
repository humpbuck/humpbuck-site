import { NextResponse } from "next/server";
import { isPrismaUniqueViolation } from "@/lib/admin-product-slug";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  deleteWholesaleListing,
  updateWholesaleListing,
  type WholesaleListingInput,
} from "@/lib/wholesale-listings";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as {
    slug?: string;
    modelNumber?: string;
    description?: string;
    priceUsd?: number;
    mediaUrls?: string[];
    status?: string;
    sortOrder?: number;
  };
  const mediaUrls = Array.isArray(body.mediaUrls)
    ? body.mediaUrls.filter((x): x is string => typeof x === "string")
    : [];
  const payload: WholesaleListingInput = {
    slug: (body.slug ?? "").trim(),
    modelNumber: (body.modelNumber ?? "").trim(),
    description: (body.description ?? "").trim(),
    priceUsd:
      typeof body.priceUsd === "number" && Number.isFinite(body.priceUsd)
        ? body.priceUsd
        : 0,
    mediaUrls,
    status: body.status === "archived" ? "archived" : "active",
    sortOrder:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : 0,
  };
  try {
    const listing = await updateWholesaleListing(id, payload);
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_WHOLESALE_LISTING") {
      return NextResponse.json(
        {
          error:
            "Slug must use lowercase letters, numbers, and hyphens (e.g. model-001). At least one media URL is required.",
        },
        { status: 400 },
      );
    }
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json(
        { error: "This slug is already used by another listing." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const ok = await deleteWholesaleListing(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
