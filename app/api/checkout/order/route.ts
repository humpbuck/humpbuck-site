import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    email?: string;
    totalUsd?: number;
    items?: Array<{
      slug: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      unitAmountCents?: number;
      lineTotalCents?: number;
      variantId?: string;
      variantLabel?: string;
      variantImage?: string;
      productName?: string;
    }>;
    billing?: Record<string, string>;
    shipping?: Record<string, string>;
    shippingMethod?: string;
    shippingEstimateCny?: number;
    couponCode?: string | null;
    discountCents?: number;
    returnUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || typeof body.totalUsd !== "number" || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const totalCents = Math.max(0, Math.round(body.totalUsd * 100));

  const order = await prisma.order.create({
    data: {
      userId,
      email: body.email,
      status: "pending_payment",
      provider: "pending",
      totalCents,
      itemsJson: JSON.stringify(body.items),
      billingJson: body.billing ? JSON.stringify(body.billing) : null,
      shippingJson: body.shipping ? JSON.stringify(body.shipping) : null,
      couponCode: body.couponCode ?? null,
      discountCents: Math.max(0, Math.round(body.discountCents ?? 0)),
    },
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
