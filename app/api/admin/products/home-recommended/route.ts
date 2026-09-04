import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  MAX_HOME_RECOMMENDED,
  MAX_HOME_RECOMMENDED_PER_CATEGORY,
  setHomeRecommendedProducts,
} from "@/lib/catalog-home-recommended";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function PATCH(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.productIds;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "productIds must be an array" }, { status: 400 });
  }
  const productIds = raw
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (productIds.length > MAX_HOME_RECOMMENDED) {
    return NextResponse.json(
      {
        error: `Select at most ${MAX_HOME_RECOMMENDED_PER_CATEGORY} products per category (${MAX_HOME_RECOMMENDED} total).`,
      },
      { status: 400 },
    );
  }

  try {
    await setHomeRecommendedProducts(productIds);
    return NextResponse.json({ ok: true, productIds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to update homepage recommended: ${msg}` },
      { status: 500 },
    );
  }
}
