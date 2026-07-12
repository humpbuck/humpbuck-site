/**
 * Analytics cache layer — 30-minute TTL module-level cache.
 *
 * Moved out of the page component to satisfy React Server Component purity rules
 * (no Date.now() or module-variable mutation during render).
 *
 * Lives in Worker isolate memory — not D1, not KV. Persisted across requests
 * within the same isolate. Use `forceRefresh=true` to bypass.
 */

import { getGa4Overview, type Ga4Overview } from "@/lib/ga4-client";
import { getGscOverview, type GscOverview } from "@/lib/gsc-client";

export type AnalyticsFetchResult = {
  ga4: Ga4Overview | { error: string };
  gsc: GscOverview | { error: string };
};

const CACHE_TTL_MS = 30 * 60 * 1000;

let cache: {
  data: AnalyticsFetchResult;
  expiresAt: number;
  fetchedAt: string;
} | null = null;

export async function getAnalyticsOverview(
  forceRefresh: boolean,
): Promise<{
  data: AnalyticsFetchResult;
  fromCache: boolean;
  fetchedAt: string;
}> {
  const now = Date.now();

  if (!forceRefresh && cache && now < cache.expiresAt) {
    return { data: cache.data, fromCache: true, fetchedAt: cache.fetchedAt };
  }

  const [ga4, gsc] = await Promise.all([
    getGa4Overview().catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "GA4 fetch failed",
    })),
    getGscOverview().catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "GSC fetch failed",
    })),
  ]);

  const data = { ga4, gsc } as AnalyticsFetchResult;
  const fetchedAt = new Date().toISOString();
  cache = { data, expiresAt: now + CACHE_TTL_MS, fetchedAt };
  return { data, fromCache: false, fetchedAt };
}
