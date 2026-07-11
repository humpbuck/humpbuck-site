import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadCheckoutAccountPrefill } from "@/lib/checkout-account-prefill";

/** Logged-in buyer: saved addresses, then last paid order (for checkout form prefill). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const prefill = await loadCheckoutAccountPrefill(session.user.id);
  return NextResponse.json({ ok: true, ...prefill });
}
