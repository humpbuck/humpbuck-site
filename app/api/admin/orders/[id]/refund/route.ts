import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { refundOrderById } from "@/lib/payment-refund";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  // Parse optional partial refund amount and reason
  let amountCents: number | undefined;
  let reason: string | undefined;
  try {
    const body = (await req.json()) as { amountCents?: unknown; reason?: unknown };
    if (typeof body.amountCents === "number" && body.amountCents > 0) {
      amountCents = Math.floor(body.amountCents);
    }
    if (typeof body.reason === "string") {
      reason = body.reason.trim();
    }
  } catch {
    // No body = full refund (backwards compatible)
  }

  const result = await refundOrderById(id, { amountCents, reason });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
