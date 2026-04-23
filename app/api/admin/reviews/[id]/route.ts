import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const MAX_MERCHANT_REPLY = 5_000;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { merchantReply?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reply = String(body.merchantReply ?? "").trim();
  if (!reply) {
    return NextResponse.json(
      { error: "merchantReply (non-empty string) is required" },
      { status: 400 },
    );
  }
  if (reply.length > MAX_MERCHANT_REPLY) {
    return NextResponse.json({ error: "Reply is too long" }, { status: 400 });
  }

  const updated = await prisma.productReview.updateMany({
    where: { id },
    data: {
      merchantReply: reply,
      merchantRepliedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const deleted = await prisma.productReview.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
