import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";

async function assertAdmin(): Promise<boolean> {
  const token = await getAdminToken();
  return Boolean(token && verifyAdminSession(token));
}

const FIXED_MSG =
  "Storefront categories are fixed (ANA-DIGI, Digital, Analog, Automatic). Assign them on Products.";

export async function PATCH() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: FIXED_MSG }, { status: 405 });
}

export async function DELETE() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: FIXED_MSG }, { status: 405 });
}
