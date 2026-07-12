/**
 * Google Analytics 4 Data API client.
 *
 * Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
 *
 * All data is fetched live from Google (no D1). Token comes from
 * `lib/google-auth.ts`. The GA4 property numeric ID is read from
 * `GA4_PROPERTY_ID` env var; if unset, auto-discovered via the Admin API.
 */

import { getGoogleAccessToken } from "@/lib/google-auth";

const GA4_DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const GA4_ADMIN_API_BASE = "https://analyticsadmin.googleapis.com/v1beta";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// ─── Property ID resolution ─────────────────────────────────────────────────

let cachedPropertyId: string | null = null;

async function discoverPropertyId(): Promise<string> {
  const token = await getGoogleAccessToken();
  const res = await fetch(`${GA4_ADMIN_API_BASE}/accountSummaries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 accountSummaries failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    accountSummaries?: Array<{
      propertySummaries?: Array<{ property: string; displayName: string }>;
    }>;
  };
  const firstProperty = data.accountSummaries?.[0]?.propertySummaries?.[0];
  if (!firstProperty) {
    throw new Error(
      "No GA4 properties found. Ensure the service account has Reader access to a GA4 property.",
    );
  }
  // property is like "properties/123456789" — return just the numeric ID
  const id = firstProperty.property.replace("properties/", "");
  cachedPropertyId = id;
  return id;
}

async function getPropertyId(): Promise<string> {
  const envId = process.env.GA4_PROPERTY_ID?.trim();
  if (envId) return envId;
  if (cachedPropertyId) return cachedPropertyId;
  return discoverPropertyId();
}

// ─── Report runner ──────────────────────────────────────────────────────────

type Ga4Dimension = { name: string };
type Ga4Metric = { name: string };
type Ga4DateRange = { startDate: string; endDate: string };
type Ga4OrderBy = { metric: { metricName: string }; desc: boolean };

type Ga4ReportResponse = {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type?: string }>;
  rows?: Array<{
    dimensionValues?: Array<{ value: string }>;
    metricValues?: Array<{ value: string }>;
  }>;
  totals?: Array<{
    metricValues?: Array<{ value: string }>;
  }>;
};

async function runReport(body: {
  dateRanges: Ga4DateRange[];
  dimensions?: Ga4Dimension[];
  metrics: Ga4Metric[];
  limit?: number;
  orderBys?: Ga4OrderBy[];
  dimensionFilter?: unknown;
}): Promise<Ga4ReportResponse> {
  const token = await getGoogleAccessToken();
  const propertyId = await getPropertyId();
  const res = await fetch(
    `${GA4_DATA_API_BASE}/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Ga4ReportResponse;
}

/** Extract a single metric value from the first row, or 0 if no data. */
function firstMetric(report: Ga4ReportResponse, index: number): number {
  const row = report.rows?.[0];
  if (!row?.metricValues?.[index]) return 0;
  return Number(row.metricValues[index].value) || 0;
}

/** Extract dimension + metric rows as flat objects. */
function rowsAsObjects(
  report: Ga4ReportResponse,
  dimensionNames: string[],
  metricNames: string[],
): Array<Record<string, string | number>> {
  return (report.rows ?? []).map((row) => {
    const obj: Record<string, string | number> = {};
    dimensionNames.forEach((name, i) => {
      obj[name] = row.dimensionValues?.[i]?.value ?? "";
    });
    metricNames.forEach((name, i) => {
      const raw = row.metricValues?.[i]?.value ?? "0";
      obj[name] = Number(raw) || 0;
    });
    return obj;
  });
}

// ─── Public types ───────────────────────────────────────────────────────────

export type Ga4TrafficSummary = {
  todayVisitors: number;
  visitors7d: number;
  visitors30d: number;
  pageViews30d: number;
  avgSessionDuration: number;
  engagementRate: number;
  conversions30d: number;
  conversionRate: number;
};

export type Ga4SourceRow = {
  channel: string;
  source: string;
  medium: string;
  visitors: number;
  pageViews: number;
};

export type Ga4CountryRow = {
  country: string;
  visitors: number;
};

export type Ga4PageRow = {
  pagePath: string;
  pageViews: number;
  visitors: number;
};

export type Ga4Overview = {
  traffic: Ga4TrafficSummary;
  sources: Ga4SourceRow[];
  countries: Ga4CountryRow[];
  topPages: Ga4PageRow[];
  propertyId: string;
};

// ─── Public API ─────────────────────────────────────────────────────────────

async function getTrafficSummary(): Promise<Ga4TrafficSummary> {
  const today = isoDate(new Date());
  const d7 = isoDate(daysAgo(7));
  const d30 = isoDate(daysAgo(30));

  // Today: visitors only
  const todayReport = await runReport({
    dateRanges: [{ startDate: today, endDate: today }],
    metrics: [{ name: "activeUsers" }],
  });

  // 7d: visitors
  const d7Report = await runReport({
    dateRanges: [{ startDate: d7, endDate: today }],
    metrics: [{ name: "activeUsers" }],
  });

  // 30d: visitors, pageViews, avgSessionDuration, engagementRate, conversions, sessions
  const d30Report = await runReport({
    dateRanges: [{ startDate: d30, endDate: today }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "engagementRate" },
      { name: "conversions" },
      { name: "sessions" },
    ],
  });

  const sessions30d = firstMetric(d30Report, 5);
  const conversions30d = firstMetric(d30Report, 4);

  return {
    todayVisitors: firstMetric(todayReport, 0),
    visitors7d: firstMetric(d7Report, 0),
    visitors30d: firstMetric(d30Report, 0),
    pageViews30d: firstMetric(d30Report, 1),
    avgSessionDuration: firstMetric(d30Report, 2),
    engagementRate: firstMetric(d30Report, 3),
    conversions30d,
    conversionRate: sessions30d > 0 ? conversions30d / sessions30d : 0,
  };
}

async function getSources(): Promise<Ga4SourceRow[]> {
  const d30 = isoDate(daysAgo(30));
  const today = isoDate(new Date());
  const report = await runReport({
    dateRanges: [{ startDate: d30, endDate: today }],
    dimensions: [
      { name: "sessionDefaultChannelGroup" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
    ],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    limit: 30,
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });
  const rows = rowsAsObjects(report, ["sessionDefaultChannelGroup", "sessionSource", "sessionMedium"], ["activeUsers", "screenPageViews"]);
  return rows.map((r) => ({
    channel: String(r.sessionDefaultChannelGroup),
    source: String(r.sessionSource),
    medium: String(r.sessionMedium),
    visitors: Number(r.activeUsers),
    pageViews: Number(r.screenPageViews),
  }));
}

async function getCountries(): Promise<Ga4CountryRow[]> {
  const d30 = isoDate(daysAgo(30));
  const today = isoDate(new Date());
  const report = await runReport({
    dateRanges: [{ startDate: d30, endDate: today }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    limit: 20,
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });
  const rows = rowsAsObjects(report, ["country"], ["activeUsers"]);
  return rows.map((r) => ({
    country: String(r.country),
    visitors: Number(r.activeUsers),
  }));
}

async function getTopPages(): Promise<Ga4PageRow[]> {
  const d30 = isoDate(daysAgo(30));
  const today = isoDate(new Date());
  const report = await runReport({
    dateRanges: [{ startDate: d30, endDate: today }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    limit: 20,
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
  });
  const rows = rowsAsObjects(report, ["pagePath"], ["screenPageViews", "activeUsers"]);
  return rows.map((r) => ({
    pagePath: String(r.pagePath),
    pageViews: Number(r.screenPageViews),
    visitors: Number(r.activeUsers),
  }));
}

/** Full GA4 overview: traffic summary + sources + countries + top pages. */
export async function getGa4Overview(): Promise<Ga4Overview> {
  const [traffic, sources, countries, topPages] = await Promise.all([
    getTrafficSummary(),
    getSources(),
    getCountries(),
    getTopPages(),
  ]);
  return {
    traffic,
    sources,
    countries,
    topPages,
    propertyId: cachedPropertyId ?? process.env.GA4_PROPERTY_ID ?? "auto",
  };
}
