import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  deleteWholesaleListing,
  updateWholesaleListing,
} from "@/lib/wholesale-listings";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as {
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
  if (mediaUrls.length === 0) {
    return NextResponse.json({ error: "At least one media URL is required" }, { status: 400 });
  }
  const listing = await updateWholesaleListing(id, {
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
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
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
