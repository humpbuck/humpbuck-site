import { NextResponse } from "next/server";
import { getUsdFxRates } from "@/lib/fx-rates";

export async function GET() {
  try {
    const rates = await getUsdFxRates();
    return NextResponse.json(
      { rates, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "fx_unavailable" }, { status: 503 });
  }
}
