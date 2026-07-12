import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { isGoogleConfigured, getGoogleServiceAccountEmail } from "@/lib/google-auth";
import { type GscOverview } from "@/lib/gsc-client";
import { type Ga4Overview } from "@/lib/ga4-client";
import { getAnalyticsOverview, type AnalyticsFetchResult } from "@/lib/analytics-cache";

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

function isError(v: unknown): v is { error: string } {
  return typeof v === "object" && v !== null && "error" in v && !("traffic" in v) && !("last7" in v);
}

const COUNTRY_LABELS: Record<string, string> = {
  us: "美国",
  jp: "日本",
  de: "德国",
  gb: "英国",
  fr: "法国",
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

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const configured = isGoogleConfigured();
  const serviceEmail = getGoogleServiceAccountEmail();

  if (!configured) {
    return (
      <div>
        <AdminBackLink href={adminPath()} label="Overview" />
        <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-sm font-semibold text-amber-800">Google API 未配置</p>
          <p className="mt-2 text-sm text-amber-700">
            运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON</code> 并粘贴服务账号 JSON。
          </p>
          <p className="mt-1 text-sm text-amber-700">
            然后确保服务账号已获得 GA4 属性和 Search Console 的读取权限。
          </p>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const forceRefresh = sp.refresh === "1";

  let result: AnalyticsFetchResult;
  let fromCache = false;
  let fetchedAt = "";

  try {
    const cached = await getAnalyticsOverview(forceRefresh);
    result = cached.data;
    fromCache = cached.fromCache;
    fetchedAt = cached.fetchedAt;
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return (
      <div>
        <AdminBackLink href={adminPath()} label="Overview" />
        <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5">
          <p className="text-sm font-semibold text-rose-800">加载分析数据失败</p>
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
          <h1 className="font-serif text-3xl tracking-tight">数据分析</h1>
          <p className="mt-2 text-sm text-muted">
            GA4 流量 + GSC 搜索表现。实时从 Google API 拉取 — 不经过 D1。
          </p>
        </div>
        <div className="text-right">
          {serviceEmail ? (
            <p className="text-[10px] text-muted">
              服务账号：{serviceEmail}
            </p>
          ) : null}
          <a
            href={adminPath("/analytics?refresh=1")}
            className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            ↻ 刷新
          </a>
        </div>
      </div>

      {/* Error banners */}
      {ga4 && ga4Ok ? null : (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">GA4 错误</p>
          <p className="mt-1 text-sm text-rose-700">{(result.ga4 as { error: string }).error}</p>
        </div>
      )}
      {gsc && gscOk ? null : (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">GSC 错误</p>
          <p className="mt-1 text-sm text-rose-700">{(result.gsc as { error: string }).error}</p>
        </div>
      )}

      {/* ─── GA4: Traffic Overview ─────────────────────────────────────── */}
      {ga4 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            流量概览 — GA4 {ga4.propertyId !== "auto" ? `(${ga4.propertyId})` : ""}
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="今日访客" value={ga4.traffic.todayVisitors.toLocaleString()} />
            <MetricCard label="最近 7 天访客" value={ga4.traffic.visitors7d.toLocaleString()} />
            <MetricCard label="最近 30 天访客" value={ga4.traffic.visitors30d.toLocaleString()} />
            <MetricCard label="页面浏览量 (30天)" value={ga4.traffic.pageViews30d.toLocaleString()} />
            <MetricCard
              label="平均会话时长"
              value={formatDuration(ga4.traffic.avgSessionDuration)}
            />
            <MetricCard
              label="互动率"
              value={formatPct(ga4.traffic.engagementRate)}
            />
            <MetricCard
              label="转化次数 (30天)"
              value={ga4.traffic.conversions30d.toLocaleString()}
            />
            <MetricCard
              label="转化率"
              value={formatPct(ga4.traffic.conversionRate)}
            />
          </ul>
        </section>
      ) : null}

      {/* ─── GA4: Source / Channel ranking ─────────────────────────────── */}
      {ga4 && ga4.sources.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            来源渠道排行 (30天)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">渠道</th>
                  <th className="px-4 py-3">来源</th>
                  <th className="px-4 py-3">媒介</th>
                  <th className="px-4 py-3 text-right">访客数</th>
                  <th className="px-4 py-3 text-right">浏览量</th>
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
                国家排行 (30天)
              </h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3">国家</th>
                      <th className="px-4 py-3 text-right">访客数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.countries.slice(0, 15).map((c, i) => (
                      <tr key={`${c.country}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-white/40">
                        <td className="px-4 py-3 font-medium">{c.country || "未知"}</td>
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
                热门页面 (30天)
              </h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3">页面</th>
                      <th className="px-4 py-3 text-right">浏览量</th>
                      <th className="px-4 py-3 text-right">访客数</th>
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
            SEO 搜索表现 — Google Search Console
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="点击数 (7天)" value={gsc.last7.clicks.toLocaleString()} />
            <MetricCard
              label="点击数 (28天)"
              value={gsc.last28.clicks.toLocaleString()}
              sub={`${gsc.last28.impressions.toLocaleString()} 次展示`}
            />
            <MetricCard
              label="展示量 (7天)"
              value={gsc.last7.impressions.toLocaleString()}
            />
            <MetricCard
              label="平均排名 (28天)"
              value={gsc.last28.position.toFixed(1)}
              sub={`点击率 ${formatPct(gsc.last28.ctr)}`}
            />
          </ul>
        </section>
      ) : null}

      {/* ─── GSC: Daily trend (7-day bar chart) ────────────────────────── */}
      {gsc && gsc.daily.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            谷歌每日流量趋势 (7 天)
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
                          <span className="text-ink">{d.impressions.toLocaleString()}</span> 曝光
                        </span>
                        <span className="w-16 shrink-0 text-right tabular-nums text-muted">
                          {d.clicks} 点击
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
            热门关键词 — 全球 (28天)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">搜索词</th>
                  <th className="px-4 py-3 text-right">展示量</th>
                  <th className="px-4 py-3 text-right">点击数</th>
                  <th className="px-4 py-3 text-right">点击率</th>
                  <th className="px-4 py-3 text-right">平均排名</th>
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
            各国热门关键词 (28天)
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
                          <th className="px-3 py-2">关键词</th>
                          <th className="px-3 py-2 text-right">展示</th>
                          <th className="px-3 py-2 text-right">点击</th>
                          <th className="px-3 py-2 text-right">点击率</th>
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
                  <p className="mt-2 text-xs text-muted">该国暂无数据。</p>
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
            热门着陆页 — 搜索 (28天)
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">页面</th>
                  <th className="px-4 py-3 text-right">展示量</th>
                  <th className="px-4 py-3 text-right">点击数</th>
                  <th className="px-4 py-3 text-right">点击率</th>
                  <th className="px-4 py-3 text-right">平均排名</th>
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
        {fromCache
          ? `缓存数据（上次拉取：${fetchedAt ? new Date(fetchedAt).toLocaleString() : "之前"}）。`
          : "从 Google API 拉取的最新数据。"}
        缓存 30 分钟，控制在 Google API 配额内。不经过 D1。
        点「↻ 刷新」可强制拉取最新数据。
      </p>
    </div>
  );
}
