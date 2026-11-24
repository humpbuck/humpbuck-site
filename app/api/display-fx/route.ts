import { NextResponse } from "next/server";
import { getUsdFxRates } from "@/lib/fx-rates";

export const revalidate = 86400;

const CACHE_CONTROL =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400";

async function cacheMatch(request: Request): Promise<Response | undefined> {
  try {
    if (typeof caches === "undefined") return undefined;
    return (await caches.default.match(request)) ?? undefined;
  } catch {
    return undefined;
  }
}

async function cachePut(request: Request, response: Response): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    await caches.default.put(request, response);
  } catch {
    /* Node local dev has no Cache API. */
  }
}

export async function GET(request: Request) {
  const cacheRequest = new Request(request.url, { method: "GET" });
  const hit = await cacheMatch(cacheRequest);
  if (hit) return hit;

  try {
    const rates = await getUsdFxRates();
    const response = NextResponse.json(
      { rates },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
    await cachePut(cacheRequest, response.clone());
    return response;
  } catch {
    return NextResponse.json({ error: "fx_unavailable" }, { status: 503 });
  }
}
