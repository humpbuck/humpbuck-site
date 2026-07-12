import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { isGoogleConfigured, getGoogleServiceAccountEmail } from "@/lib/google-auth";
import { getGscOverview, type GscOverview } from "@/lib/gsc-client";
import { getGa4Overview, type Ga4Overview } from "@/lib/ga4-client";

export const dynamic = "force-dynamic";

function formatPct(v: number, digits = 2): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

type FetchResult = {
  ga4: Ga4Overview | { error: string };
  gsc: GscOverview | { error: string };
};

async function fetchAnalytics(): Promise<FetchResult> {
  const [ga4, gsc] = await Promise.all([
    getGa4Overview().catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "GA4 fetch failed",
    })),
    getGscOverview().catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "GSC fetch failed",
    })),
  ]);
  return { ga4, gsc } as FetchResult;
}

function isError(v: unknown): v is { error: string } {
  return typeof v === "object" && v !== null && "error" in v && !("traffic" in v) && !("last7" in v);
}

const COUNTRY_LABELS: Record<string, string> = {
  us: "United States",
  jp: "Japan",
  de: "Germany",
  gb: "United Kingdom",
  fr: "France",
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white/60 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl tabular-nums text-ink">{value}</p>
      {sub ? <p className="mt-1 text-[10px] text-muted">{sub}</p> : null}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const configured = isGoogleConfigured();
  const serviceEmail = getGoogleServiceAccountEmail();

  if (!configured) {
    return (
      <div>
        <AdminBackLink href={adminPath()} label="Overview" />
        <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-sm font-semibold text-amber-800">Google API not configured</p>
          <p className="mt-2 text-sm text-amber-700">
            Run <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON</code> and paste the service-account JSON.
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Then ensure the service account has Reader access to your GA4 property and Search Console site.
          </p>
        </div>
      </div>
    );
  }

  let result: FetchResult;
  try {
    result = await fetchAnalytics();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div>
        <AdminBackLink href={adminPath()} label="Overview" />
        <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5">
          <p className="text-sm font-semibold text-rose-800">Failed to load analytics</p>
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        </div>
      </div>
    );
  }

  const ga4Ok = !isError(result.ga4);
  const gscOk = !isError(result.gsc);
  const ga4 = ga4Ok ? (result.ga4 as Ga4Overview) : null;
  const gsc = gscOk ? (result.gsc as GscOverview) : null;

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
          <p className="mt-2 text-sm text-muted">
            GA4 traffic + GSC search performance. Live from Google APIs — no D1.
          </p>
        </div>
        <div className="text-right">
          {serviceEmail ? (
            <p className="text-[10px] text-muted">
              Service account: {serviceEmail}
            </p>
          ) : null}
          <a
            href={adminPath("/analytics")}
            className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            ↻ Refresh
          </a>
        </div>
      </div>

      {/* Error banners */}
      {ga4 && ga4Ok ? null : (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">GA4 error</p>
          <p className="mt-1 text-sm text-rose-700">{(result.ga4 as { error: string }).error}</p>
        </div>
      )}
      {gsc && gscOk ? null : (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">GSC error</p>
          <p className="mt-1 text-sm text-rose-700">{(result.gsc as { error: string }).error}</p>
        </div>
      )}

      {/* ─── GA4: Traffic Overview ─────────────────────────────────────── */}
      {ga4 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Traffic Overview — GA4 {ga4.propertyId !== "auto" ? `(${ga4.propertyId})` : ""}
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Today visitors" value={ga4.traffic.todayVisitors.toLocaleString()} />
            <MetricCard label="Last 7 days" value={ga4.traffic.visitors7d.toLocaleString()} />
            <MetricCard label="Last 30 days" value={ga4.traffic.visitors30d.toLocaleString()} />
            <MetricCard label="Page views (30d)" value={ga4.traffic.pageViews30d.toLocaleString()} />
            <MetricCard
              label="Avg session duration"
              value={formatDuration(ga4.traffic.avgSessionDuration)}
            />
            <MetricCard
              label="Engagement rate"
              value={formatPct(ga4.traffic.engagementRate)}
            />
            <MetricCard
              label="Conversions (30d)"
              value={ga4.traffic.conversions30d.toLocaleString()}
            />
            <MetricCard
              label="Conversion rate"
              value={formatPct(ga4.traffic.conversionRate)}
            />
          </ul>
        </section>
      ) : null}

      {/* ─── GA4: Source / Channel ranking ─────────────────────────────── */}
      {ga4 && ga4.sources.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Source / Channel Ranking (30d)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Medium</th>
                  <th className="px-4 py-3 text-right">Visitors</th>
                  <th className="px-4 py-3 text-right">Page views</th>
                </tr>
              </thead>
              <tbody>
                {ga4.sources.slice(0, 15).map((s, i) => (
                  <tr key={`${s.channel}-${s.source}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                    <td className="px-4 py-3 font-medium">{s.channel}</td>
                    <td className="px-4 py-3 text-muted">{s.source}</td>
                    <td className="px-4 py-3 text-muted">{s.medium}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.visitors.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.pageViews.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ─── GA4: Country + Top Pages (two columns) ────────────────────── */}
      {ga4 ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {ga4.countries.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Country Ranking (30d)
              </h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3 text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.countries.slice(0, 15).map((c, i) => (
                      <tr key={`${c.country}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                        <td className="px-4 py-3 font-medium">{c.country || "Unknown"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.visitors.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {ga4.topPages.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Top Pages (30d)
              </h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3">Page</th>
                      <th className="px-4 py-3 text-right">Views</th>
                      <th className="px-4 py-3 text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.topPages.slice(0, 15).map((p, i) => (
                      <tr key={`${p.pagePath}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                        <td className="px-4 py-3 font-medium">{truncate(p.pagePath, 60)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.pageViews.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.visitors.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ─── GSC: Search Performance ───────────────────────────────────── */}
      {gsc ? (
        <section className="mt-10">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            SEO Search Performance — Google Search Console
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Clicks (7d)" value={gsc.last7.clicks.toLocaleString()} />
            <MetricCard
              label="Clicks (28d)"
              value={gsc.last28.clicks.toLocaleString()}
              sub={`${gsc.last28.impressions.toLocaleString()} impressions`}
            />
            <MetricCard
              label="Impressions (7d)"
              value={gsc.last7.impressions.toLocaleString()}
            />
            <MetricCard
              label="Avg position (28d)"
              value={gsc.last28.position.toFixed(1)}
              sub={`CTR ${formatPct(gsc.last28.ctr)}`}
            />
          </ul>
        </section>
      ) : null}

      {/* ─── GSC: Daily trend (7-day bar chart) ────────────────────────── */}
      {gsc && gsc.daily.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Google Daily Traffic (7 Days Trend)
          </h2>
          <div className="mt-3 rounded-2xl border border-line bg-white/60 px-5 py-5">
            {(() => {
              const maxImp = Math.max(...gsc.daily.map((d) => d.impressions), 1);
              return (
                <ul className="space-y-3">
                  {gsc.daily.map((d) => {
                    const pct = Math.round((d.impressions / maxImp) * 100);
                    return (
                      <li key={d.date} className="flex items-center gap-3 text-sm">
                        <span className="w-12 shrink-0 tabular-nums text-muted">{d.date.slice(5)}</span>
                        <div className="flex-1">
                          <div className="h-6 rounded bg-blue-100" style={{ minWidth: "4px" }}>
                            <div
                              className="h-6 rounded bg-blue-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-28 shrink-0 text-right tabular-nums text-muted">
                          <span className="text-ink">{d.impressions.toLocaleString()}</span> imp
                        </span>
                        <span className="w-16 shrink-0 text-right tabular-nums text-muted">
                          {d.clicks} clk
                        </span>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        </section>
      ) : null}

      {/* ─── GSC: Top Keywords (global) ────────────────────────────────── */}
      {gsc && gsc.topKeywords.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top Keywords — Global (28d)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Search term</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Avg position</th>
                </tr>
              </thead>
              <tbody>
                {gsc.topKeywords.slice(0, 20).map((k, i) => (
                  <tr key={`${k.query}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                    <td className="px-4 py-3 font-medium">{k.query}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{k.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600">{k.clicks}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPct(k.ctr)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{k.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ─── GSC: Top Keywords by Country ──────────────────────────────── */}
      {gsc ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top Keywords by Country (28d)
          </h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            {Object.entries(gsc.topKeywordsByCountry).map(([country, keywords]) => (
              <div key={country}>
                <h3 className="text-xs font-semibold text-ink">
                  {COUNTRY_LABELS[country] ?? country.toUpperCase()}
                </h3>
                {keywords.length > 0 ? (
                  <div className="mt-2 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          <th className="px-3 py-2">Keyword</th>
                          <th className="px-3 py-2 text-right">Imp</th>
                          <th className="px-3 py-2 text-right">Clicks</th>
                          <th className="px-3 py-2 text-right">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywords.slice(0, 10).map((k, i) => (
                          <tr key={`${country}-${k.query}-${i}`} className="border-b border-line/50 last:border-0">
                            <td className="px-3 py-2 font-medium">{truncate(k.query, 40)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{k.impressions}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-blue-600">{k.clicks}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatPct(k.ctr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted">No data for this country.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─── GSC: Top Landing Pages ────────────────────────────────────── */}
      {gsc && gsc.topPages.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top Landing Pages — Search (28d)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Avg position</th>
                </tr>
              </thead>
              <tbody>
                {gsc.topPages.slice(0, 15).map((p, i) => (
                  <tr key={`${p.page}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                    <td className="px-4 py-3 font-medium">{truncate(p.page, 70)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600">{p.clicks}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPct(p.ctr)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="mt-10 text-[10px] text-muted">
        Data fetched live from Google Analytics 4 Data API + Search Console API.
        Cached for 15 minutes in Worker memory. No D1 involved.
      </p>
    </div>
  );
}
