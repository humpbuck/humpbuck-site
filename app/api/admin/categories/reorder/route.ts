import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { reorderProductCategories } from "@/lib/product-categories";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function POST(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string")
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids array is required." }, { status: 400 });
  }

  try {
    const categories = await reorderProductCategories(ids);
    return NextResponse.json({ ok: true, categories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
