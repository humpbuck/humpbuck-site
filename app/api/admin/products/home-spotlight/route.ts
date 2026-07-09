import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { setHomeSpotlightProduct } from "@/lib/catalog-home-spotlight";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

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

  const rawId = body.productId;
  const productId =
    rawId === null || rawId === undefined || rawId === "" ? null : asString(rawId);
  if (productId === "") {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  try {
    await setHomeSpotlightProduct(productId);
    return NextResponse.json({ ok: true, productId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to update homepage spotlight: ${msg}` },
      { status: 500 },
    );
  }
}
