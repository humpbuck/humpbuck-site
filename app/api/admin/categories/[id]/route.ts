import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  deleteProductCategory,
  updateProductCategory,
} from "@/lib/product-categories";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const category = await updateProductCategory(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      imageUrl:
        body.imageUrl === null
          ? null
          : typeof body.imageUrl === "string"
            ? body.imageUrl
            : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
    });
    if (!category) {
      return NextResponse.json({ error: "Series not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteProductCategory(id);
  if (!ok) {
    return NextResponse.json({ error: "Series not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
