import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  createProductCategory,
  getAllProductCategories,
} from "@/lib/product-categories";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const categories = await getAllProductCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to load categories: ${msg}` },
      { status: 500 },
    );
  }
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

  try {
    const category = await createProductCategory({
      name: typeof body.name === "string" ? body.name : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
      slug: typeof body.slug === "string" ? body.slug : null,
    });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
