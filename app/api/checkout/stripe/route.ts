import { NextResponse } from "next/server";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    totalUsd?: number;
    returnUrl?: string;
    cancelUrl?: string;
    orderId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.returnUrl || !body.cancelUrl || typeof body.totalUsd !== "number" || !body.orderId) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    const session = await createStripeCheckoutSession({
      totalUsd: body.totalUsd,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
      orderId: body.orderId,
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Stripe checkout URL missing" }, { status: 502 });
    }

    await prisma.order.updateMany({
      where: { id: body.orderId, status: "pending_payment" },
      data: {
        provider: "stripe",
        providerRef: session.id,
      },
    });

    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Stripe not configured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
