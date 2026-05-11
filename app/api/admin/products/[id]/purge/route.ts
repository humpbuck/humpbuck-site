import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const product = await prisma.catalogProduct.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.status !== "archived") {
      return NextResponse.json(
        { error: "Product must be archived before permanent deletion" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.productInventory.deleteMany({ where: { productSlug: product.slug } });
      await tx.catalogProduct.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to purge product: ${msg}` },
      { status: 500 },
    );
  }
}
