/**
 * Google Search Console API client.
 *
 * Docs: https://developers.google.com/webmaster-tools/v1/searchanalytics
 *
 * All data is fetched live from Google (no D1). Token comes from
 * `lib/google-auth.ts`. The site URL is read from `GSC_SITE_URL` env var,
 * defaulting to `sc-domain:humpbuck.com`.
 */

import { getGoogleAccessToken } from "@/lib/google-auth";

const GSC_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

function getSiteUrl(): string {
  return (process.env.GSC_SITE_URL || "sc-domain:humpbuck.com").trim();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

async function gscQuery(body: {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  filters?: Array<{ dimension: string; operator: string; expression: string }>;
  dimensionFilterGroups?: Array<{
    groupType: string;
    filters: Array<{ dimension: string; operator: string; expression: string }>;
  }>;
  aggregationType?: string;
  dataState?: string;
}): Promise<GscRow[]> {
  const token = await getGoogleAccessToken();
  const siteUrl = encodeURIComponent(getSiteUrl());
  const res = await fetch(`${GSC_API_BASE}/sites/${siteUrl}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC query failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

export type GscSummary = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscDailyRow = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscKeywordRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscPageRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscOverview = {
  last7: GscSummary;
  last28: GscSummary;
  daily: GscDailyRow[];
  topKeywords: GscKeywordRow[];
  topPages: GscPageRow[];
  topKeywordsByCountry: Record<string, GscKeywordRow[]>;
};

/** Aggregate clicks/impressions/ctr/position for a date range. */
async function getSummary(startDate: string, endDate: string): Promise<GscSummary> {
  const rows = await gscQuery({
    startDate,
    endDate,
    dimensions: [],
    rowLimit: 1,
  });
  if (rows.length === 0) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
  const r = rows[0];
  return {
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  };
}

/** Daily breakdown (impressions + clicks per day) for the last N days. */
async function getDaily(days: number): Promise<GscDailyRow[]> {
  const start = isoDate(daysAgo(days));
  const end = isoDate(new Date());
  const rows = await gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ["date"],
    rowLimit: days + 1,
  });
  return rows.map((r) => ({
    date: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** Top search queries (keywords) for a date range, optionally filtered by country. */
async function getTopKeywords(
  days: number,
  limit: number,
  country?: string,
): Promise<GscKeywordRow[]> {
  const start = isoDate(daysAgo(days));
  const end = isoDate(new Date());
  const body: Parameters<typeof gscQuery>[0] = {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit: Math.min(limit, 1000),
  };
  if (country) {
    body.dimensionFilterGroups = [
      {
        groupType: "and",
        filters: [{ dimension: "country", operator: "equals", expression: country }],
      },
    ];
  }
  const rows = await gscQuery(body);
  return rows.map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** Top landing pages for a date range. */
async function getTopPages(days: number, limit: number): Promise<GscPageRow[]> {
  const start = isoDate(daysAgo(days));
  const end = isoDate(new Date());
  const rows = await gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ["page"],
    rowLimit: Math.min(limit, 1000),
  });
  return rows.map((r) => ({
    page: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** List verified sites in Search Console (for auto-detecting site URL). */
export async function listGscSites(): Promise<string[]> {
  const token = await getGoogleAccessToken();
  const res = await fetch(`${GSC_API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC sites list failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>;
  };
  return (data.siteEntry ?? []).map((s) => s.siteUrl);
}

/**
 * Full GSC overview: 7d + 28d summary, daily trend, top keywords (global +
 * by-country), top landing pages.
 *
 * Countries for keyword breakdown: us, jp, de, gb, fr — adjust as needed.
 */
export async function getGscOverview(): Promise<GscOverview> {
  const d7Start = isoDate(daysAgo(7));
  const d28Start = isoDate(daysAgo(28));
  const today = isoDate(new Date());

  const COUNTRY_BREAKDOWN = ["us", "jp", "de", "gb", "fr"];

  const [
    last7,
    last28,
    daily,
    topKeywords,
    topPages,
    ...countryKeywordSets
  ] = await Promise.all([
    getSummary(d7Start, today),
    getSummary(d28Start, today),
    getDaily(7),
    getTopKeywords(28, 30),
    getTopPages(28, 20),
    ...COUNTRY_BREAKDOWN.map((c) => getTopKeywords(28, 15, c).catch(() => [] as GscKeywordRow[])),
  ]);

  const topKeywordsByCountry: Record<string, GscKeywordRow[]> = {};
  COUNTRY_BREAKDOWN.forEach((c, i) => {
    topKeywordsByCountry[c] = countryKeywordSets[i] ?? [];
  });

  return { last7, last28, daily, topKeywords, topPages, topKeywordsByCountry };
}
