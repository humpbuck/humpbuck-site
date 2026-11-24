import { NextResponse } from "next/server";
import { getUsdFxRates } from "@/lib/fx-rates";

export const revalidate = 86400;

const CACHE_CONTROL =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400";

/** Cloudflare Workers expose `caches.default`; DOM `CacheStorage` does not. */
function workerDefaultCache(): Cache | undefined {
  if (typeof caches === "undefined") return undefined;
  const store = caches as CacheStorage & { default?: Cache };
  return store.default;
}

async function cacheMatch(request: Request): Promise<Response | undefined> {
  try {
    return (await workerDefaultCache()?.match(request)) ?? undefined;
  } catch {
    return undefined;
  }
}

async function cachePut(request: Request, response: Response): Promise<void> {
  try {
    await workerDefaultCache()?.put(request, response);
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
