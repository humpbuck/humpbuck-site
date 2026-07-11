import { NextResponse } from "next/server";
import { normalizePayPalOrderToCheckoutPrefill } from "@/lib/paypal-express-address";
import { paypalCreateExpressOrder, paypalGetOrder } from "@/lib/paypal";

export async function POST(req: Request) {
  let body: {
    action?: "create" | "details";
    subtotalUsd?: string;
    paypalOrderId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "create") {
    if (!body.subtotalUsd) {
      return NextResponse.json({ ok: false, error: "Missing subtotal" }, { status: 400 });
    }
    try {
      const created = await paypalCreateExpressOrder(body.subtotalUsd);
      return NextResponse.json({ ok: true, paypalOrderId: created.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("not configured") ? 503 : 502;
      return NextResponse.json({ ok: false, error: message }, { status });
    }
  }

  if (body.action === "details") {
    if (!body.paypalOrderId?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing PayPal order id" }, { status: 400 });
    }
    try {
      const order = await paypalGetOrder(body.paypalOrderId.trim());
      const prefill = normalizePayPalOrderToCheckoutPrefill(order);
      if (!prefill) {
        return NextResponse.json({ ok: false, error: "PayPal shipping address unavailable" }, { status: 422 });
      }
      return NextResponse.json({
        ok: true,
        email: prefill.email,
        billing: prefill.billing,
        shipping: prefill.shipping,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}
