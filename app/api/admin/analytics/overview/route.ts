import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { isGoogleConfigured } from "@/lib/google-auth";
import { getGscOverview } from "@/lib/gsc-client";
import { getGa4Overview } from "@/lib/ga4-client";

/**
 * GET /api/admin/analytics/overview
 *
 * Aggregates GA4 + GSC data for the admin analytics dashboard.
 * Results are cached in module scope for 15 minutes to stay within Google API
 * quotas. Pass ?refresh=1 to bypass the cache and force a fresh pull.
 *
 * No D1 involved — all data comes from Google APIs live.
 */

type CachedPayload = {
  data: unknown;
  expiresAt: number;
};

let cache: CachedPayload | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_SERVICE_ACCOUNT_JSON is not set. Run: wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  if (!forceRefresh && cache && Date.now() < cache.expiresAt) {
    return NextResponse.json({ ...cache.data as object, cached: true });
  }

  try {
    const [ga4, gsc] = await Promise.all([
      getGa4Overview().catch((err: unknown) => ({
        error: err instanceof Error ? err.message : "GA4 fetch failed",
      })),
      getGscOverview().catch((err: unknown) => ({
        error: err instanceof Error ? err.message : "GSC fetch failed",
      })),
    ]);

    const data = { ga4, gsc, fetchedAt: new Date().toISOString() };
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json({ ...data, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown analytics error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
