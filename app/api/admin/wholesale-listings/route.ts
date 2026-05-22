import { NextResponse } from "next/server";
import { isPrismaUniqueViolation } from "@/lib/admin-product-slug";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  createWholesaleListing,
  listWholesaleListingsAdmin,
  saveWholesaleListingOrder,
  type WholesaleListingInput,
} from "@/lib/wholesale-listings";

function parsePayload(body: {
  slug?: string;
  modelNumber?: string;
  description?: string;
  priceUsd?: number;
  mediaUrls?: string[];
  status?: string;
  sortOrder?: number;
}): WholesaleListingInput {
  const mediaUrls = Array.isArray(body.mediaUrls)
    ? body.mediaUrls.filter((x): x is string => typeof x === "string")
    : [];
  return {
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
}

function saveErrorResponse(error: unknown) {
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
    return NextResponse.json({ error: "This slug is already used by another listing." }, { status: 409 });
  }
  return NextResponse.json({ error: "Save failed" }, { status: 500 });
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
  try {
    const listing = await createWholesaleListing(payload);
    return NextResponse.json({ listing });
  } catch (error) {
    return saveErrorResponse(error);
  }
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
