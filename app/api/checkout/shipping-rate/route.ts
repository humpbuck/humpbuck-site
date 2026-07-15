import { NextResponse } from "next/server";
import { listCheckoutShippingMethods } from "@/lib/shipping-fee-rates";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country")?.trim() ?? "";
  const postalCode = url.searchParams.get("postalCode")?.trim() ?? "";

  if (!country) {
    return NextResponse.json({ ok: false, error: "country_required" }, { status: 400 });
  }

  const result = await listCheckoutShippingMethods(country, postalCode || null);
  if (!result.ok) {
    const status = result.error === "postal_required" ? 400 : 404;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    methods: result.methods,
    cnyPerUsd: result.cnyPerUsd,
  });
}
