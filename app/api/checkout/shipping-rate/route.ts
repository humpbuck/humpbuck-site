import { NextResponse } from "next/server";
import { WATCH_WEIGHT_KG } from "@/lib/shipping-fee";
import { listCheckoutShippingMethods } from "@/lib/shipping-fee-rates";
import { getCnyUsdExchangeRate } from "@/lib/cny-usd-exchange";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country")?.trim() ?? "";
  const postalCode = url.searchParams.get("postalCode")?.trim() ?? "";
  const unitsRaw = Number(url.searchParams.get("units") ?? "1");
  const units = Number.isFinite(unitsRaw) && unitsRaw > 0 ? Math.floor(unitsRaw) : 1;
  const weightParam = Number(url.searchParams.get("weightKg") ?? "");
  const weightKg =
    Number.isFinite(weightParam) && weightParam > 0 ? weightParam : units * WATCH_WEIGHT_KG;
  const goodsUsdCentsRaw = Number(url.searchParams.get("goodsUsdCents") ?? "0");
  const goodsUsdCents =
    Number.isFinite(goodsUsdCentsRaw) && goodsUsdCentsRaw > 0 ? goodsUsdCentsRaw : 0;

  if (!country) {
    return NextResponse.json({ ok: false, error: "country_required" }, { status: 400 });
  }

  const fx = await getCnyUsdExchangeRate();
  const goodsCny = (goodsUsdCents / 100) * fx.cnyPerUsd;

  const result = await listCheckoutShippingMethods(country, postalCode || null, {
    weightKg,
    goodsCny,
  });
  if (!result.ok) {
    const status = result.error === "postal_required" ? 400 : 404;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    methods: result.methods,
    cnyPerUsd: result.cnyPerUsd,
    weightKg,
  });
}
