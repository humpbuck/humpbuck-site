import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  createWholesaleListing,
  listWholesaleListingsAdmin,
  saveWholesaleListingOrder,
} from "@/lib/wholesale-listings";

function parsePayload(body: {
  modelNumber?: string;
  description?: string;
  priceUsd?: number;
  mediaUrls?: string[];
  status?: string;
  sortOrder?: number;
}) {
  const mediaUrls = Array.isArray(body.mediaUrls)
    ? body.mediaUrls.filter((x): x is string => typeof x === "string")
    : [];
  return {
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
}

export async function GET() {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const listings = await listWholesaleListingsAdmin();
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Parameters<typeof parsePayload>[0];
  const payload = parsePayload(body);
  if (payload.mediaUrls.length === 0) {
    return NextResponse.json({ error: "At least one media URL is required" }, { status: 400 });
  }
  const listing = await createWholesaleListing(payload);
  return NextResponse.json({ listing });
}

export async function PATCH(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { orderedIds?: string[] };
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
    : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveWholesaleListingOrder(orderedIds);
  return NextResponse.json({ ok: true });
}
