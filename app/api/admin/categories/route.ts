import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { getFixedStorefrontCategories } from "@/lib/product-categories";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const categories = await getFixedStorefrontCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to load categories: ${msg}` },
      { status: 500 },
    );
  }
}

/** Categories are fixed — create is disabled. */
export async function POST() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error:
        "Storefront categories are fixed (ANA-DIGI, Digital, Analog, Automatic). Assign them on Products.",
    },
    { status: 405 },
  );
}
