import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function toInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(90, Math.floor(n)));
}

function toPage(v: string | undefined, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function sourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  return source.replace(/[_-]/g, " ");
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function deltaBadge(current: number, previous: number): {
  text: string;
  tone: "up" | "down" | "flat";
} {
  const change = pctChange(current, previous);
  if (change > 0) return { text: `↑ ${change}%`, tone: "up" };
  if (change < 0) return { text: `↓ ${Math.abs(change)}%`, tone: "down" };
  return { text: "→ 0%", tone: "flat" };
}

function compactEventLabel(type: string): string {
  if (type === "session_start") return "entry";
  if (type === "page_view") return "page";
  if (type === "product_view") return "product";
  if (type === "add_to_cart") return "cart";
  if (type === "checkout_start") return "checkout";
  if (type === "purchase") return "purchase";
  if (type === "heartbeat") return "active";
  return type;
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function startOfHourMs(ts: number): number {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function safeToken(input?: string): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(s)) return null;
  return s;
}

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    country?: string;
    device?: string;
    browser?: string;
    journeysPage?: string;
  }>;
}) {
  const sp = await searchParams;
  const days = toInt(sp.days, 7);
  const selectedCountry = safeToken(sp.country);
  const selectedDevice = safeToken(sp.device);
  const selectedBrowser = safeToken(sp.browser);
  const journeysPage = toPage(sp.journeysPage, 1);
  const JOURNEYS_PAGE_SIZE = 5;
  const nowTs = Date.now();
  const since = new Date(nowTs - days * 86400000);
  const prevSince = new Date(nowTs - days * 2 * 86400000);
  const onlineSince = new Date(nowTs - 5 * 60 * 1000);
  const topProductsWhere = {
    type: "product_view" as const,
    createdAt: { gte: since },
    productSlug: { not: null as null },
    ...(selectedCountry || selectedDevice || selectedBrowser
      ? {
          session: {
            ...(selectedCountry ? { country: selectedCountry } : {}),
            ...(selectedDevice ? { deviceType: selectedDevice } : {}),
            ...(selectedBrowser ? { browser: selectedBrowser } : {}),
          },
        }
      : {}),
  };
  const recentSessionsWhere = {
    createdAt: { gte: since },
    ...(selectedCountry ? { country: selectedCountry } : {}),
    ...(selectedDevice ? { deviceType: selectedDevice } : {}),
    ...(selectedBrowser ? { browser: selectedBrowser } : {}),
  };

  const [
    sessionCountCurrent,
    sessionCountPrevious,
    pageViewCountCurrent,
    pageViewCountPrevious,
    productViewCountCurrent,
    productViewCountPrevious,
    addToCartCountCurrent,
    addToCartCountPrevious,
    checkoutStartCountCurrent,
    checkoutStartCountPrevious,
    purchaseCountCurrent,
    purchaseCountPrevious,
    onlineNowCount,
    topSources,
    topProducts,
    topCountries,
    topCities,
    topDevices,
    topBrowsers,
    recentSessions,
    recentSessionsTotal,
    avgDurationRows,
    chartRows,
  ] = await Promise.all([
    prisma.visitorSession.count({ where: { createdAt: { gte: since } } }),
    prisma.visitorSession.count({
      where: { createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "page_view", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "page_view", createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "product_view", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "product_view", createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "add_to_cart", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "add_to_cart", createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "checkout_start", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "checkout_start", createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "purchase", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "purchase", createdAt: { gte: prevSince, lt: since } },
    }),
    prisma.visitorSession.count({ where: { lastSeenAt: { gte: onlineSince } } }),
    prisma.visitorSession.groupBy({
      by: ["utmSource"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 8,
    }),
    prisma.visitorEvent.groupBy({
      by: ["productSlug"],
      where: topProductsWhere,
      _count: { _all: true },
      orderBy: { _count: { productSlug: "desc" } },
      take: 10,
    }),
    prisma.visitorSession.groupBy({
      by: ["country"],
      where: { createdAt: { gte: since }, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
    prisma.visitorSession.groupBy({
      by: ["city"],
      where: { createdAt: { gte: since }, city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
    prisma.visitorSession.groupBy({
      by: ["deviceType"],
      where: { createdAt: { gte: since }, deviceType: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { deviceType: "desc" } },
      take: 6,
    }),
    prisma.visitorSession.groupBy({
      by: ["browser"],
      where: { createdAt: { gte: since }, browser: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { browser: "desc" } },
      take: 6,
    }),
    prisma.visitorSession.findMany({
      where: recentSessionsWhere,
      orderBy: { createdAt: "desc" },
      skip: (journeysPage - 1) * JOURNEYS_PAGE_SIZE,
      take: JOURNEYS_PAGE_SIZE,
      select: {
        id: true,
        sessionKey: true,
        createdAt: true,
        utmSource: true,
        utmCampaign: true,
        country: true,
        city: true,
        landingPath: true,
        events: {
          orderBy: { createdAt: "asc" },
          take: 12,
          select: {
            type: true,
            path: true,
            productSlug: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.visitorSession.count({
      where: recentSessionsWhere,
    }),
    prisma.$queryRaw<Array<{ avg_seconds: number | null }>>`
      SELECT AVG(session_span) AS avg_seconds
      FROM (
        SELECT EXTRACT(EPOCH FROM (MAX("createdAt") - MIN("createdAt"))) AS session_span
        FROM "VisitorEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY "sessionId"
      ) spans
    `,
    prisma.$queryRaw<Array<{ hour_bucket: Date; c: bigint | number }>>`
      SELECT date_trunc('hour', "createdAt") AS hour_bucket, COUNT(*) AS c
      FROM "VisitorEvent"
      WHERE "createdAt" >= ${since}
        AND "type" = 'page_view'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const sessionCount = sessionCountCurrent;
  const pageViewCount = pageViewCountCurrent;
  const productViewCount = productViewCountCurrent;
  const addToCartCount = addToCartCountCurrent;
  const checkoutStartCount = checkoutStartCountCurrent;
  const purchaseCount = purchaseCountCurrent;

  const funnelViewToCart =
    productViewCount > 0 ? Math.round((addToCartCount / productViewCount) * 100) : 0;
  const funnelCartToCheckout =
    addToCartCount > 0 ? Math.round((checkoutStartCount / addToCartCount) * 100) : 0;
  const funnelCheckoutToPurchase =
    checkoutStartCount > 0
      ? Math.round((purchaseCount / checkoutStartCount) * 100)
      : 0;
  const avgSessionSeconds = Number(avgDurationRows[0]?.avg_seconds ?? 0);
  const viewToCartDrop =
    pctChange(funnelViewToCart, addToCartCountPrevious > 0 && productViewCountPrevious > 0
      ? Math.round((addToCartCountPrevious / productViewCountPrevious) * 100)
      : 0) < -50;
  const cartToCheckoutDrop =
    pctChange(
      funnelCartToCheckout,
      addToCartCountPrevious > 0 && checkoutStartCountPrevious > 0
        ? Math.round((checkoutStartCountPrevious / addToCartCountPrevious) * 100)
        : 0,
    ) < -50;

  const chartStart = startOfHourMs(nowTs - days * 86400000);
  const chartEnd = startOfHourMs(nowTs);
  const points: Array<{ t: number; c: number }> = [];
  const rowMap = new Map<number, number>();
  for (const r of chartRows) {
    const t = new Date(r.hour_bucket).getTime();
    rowMap.set(t, Number(r.c));
  }
  for (let t = chartStart; t <= chartEnd; t += 3600000) {
    points.push({ t, c: rowMap.get(t) ?? 0 });
  }
  const maxC = Math.max(1, ...points.map((p) => p.c));
  const polyline = points
    .map((p, i) => {
      const x = points.length <= 1 ? 0 : (i / (points.length - 1)) * 100;
      const y = 100 - (p.c / maxC) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const journeysTotalPages = Math.max(1, Math.ceil(recentSessionsTotal / JOURNEYS_PAGE_SIZE));
  const safeJourneysPage = Math.min(journeysPage, journeysTotalPages);
  const buildTrafficPageHref = (nextJourneysPage: number): string => {
    const qs = new URLSearchParams();
    qs.set("days", String(days));
    if (selectedCountry) qs.set("country", selectedCountry);
    if (selectedDevice) qs.set("device", selectedDevice);
    if (selectedBrowser) qs.set("browser", selectedBrowser);
    if (nextJourneysPage > 1) qs.set("journeysPage", String(nextJourneysPage));
    return `${adminPath(`/traffic?${qs.toString()}`)}#recent-visitor-journeys`;
  };

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Traffic</h1>
          <p className="mt-2 text-sm text-muted">
            Visitor sources and browse journeys captured on your storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={adminPath(`/traffic?days=${days}`)}
            className={`rounded-xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              !selectedCountry && !selectedDevice && !selectedBrowser
                ? "border-ink bg-ink text-paper"
                : "border-line bg-white/70 text-ink/80 hover:border-ink/20"
            }`}
          >
            All filters
          </Link>
          {[7, 14, 30].map((d) => (
            <Link
              key={d}
              href={adminPath(
                `/traffic?days=${d}${selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : ""}${selectedDevice ? `&device=${encodeURIComponent(selectedDevice)}` : ""}${selectedBrowser ? `&browser=${encodeURIComponent(selectedBrowser)}` : ""}`,
              )}
              className={`rounded-xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                days === d
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white/70 text-ink/80 hover:border-ink/20"
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Traffic by hour ({days}d)
          </p>
          <p className="text-xs text-muted">Peak {maxC} page views / hour</p>
        </div>
        <div className="mt-3 h-28 w-full rounded-xl border border-line/60 bg-paper/70 p-2">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polyline
              fill="none"
              stroke="currentColor"
              className="text-cyan-600"
              strokeWidth="1.5"
              points={polyline}
            />
          </svg>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Unique visitors"
          value={sessionCount}
          delta={deltaBadge(sessionCountCurrent, sessionCountPrevious)}
        />
        <MetricCard
          label="Page views"
          value={pageViewCount}
          delta={deltaBadge(pageViewCountCurrent, pageViewCountPrevious)}
        />
        <MetricCard
          label="Product views"
          value={productViewCount}
          delta={deltaBadge(productViewCountCurrent, productViewCountPrevious)}
        />
        <MetricCard
          label="Add to cart"
          value={addToCartCount}
          delta={deltaBadge(addToCartCountCurrent, addToCartCountPrevious)}
        />
        <MetricCard
          label="Checkout starts"
          value={checkoutStartCount}
          delta={deltaBadge(checkoutStartCountCurrent, checkoutStartCountPrevious)}
        />
        <MetricCard
          label="Purchases"
          value={purchaseCount}
          delta={deltaBadge(purchaseCountCurrent, purchaseCountPrevious)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Funnel snapshot
          </p>
          <p className="mt-3 text-sm text-ink/85">
            Product view → add to cart:{" "}
            <span className="font-semibold tabular-nums">{funnelViewToCart}%</span>
          </p>
          <p className="mt-2 text-sm text-ink/85">
            Add to cart → checkout:{" "}
            <span className="font-semibold tabular-nums">{funnelCartToCheckout}%</span>
          </p>
          <p className="mt-2 text-sm text-ink/85">
            Checkout → purchase:{" "}
            <span className="font-semibold tabular-nums">{funnelCheckoutToPurchase}%</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top sources
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {topSources.length === 0 ? (
              <li className="text-muted">No data yet.</li>
            ) : (
              topSources.map((s) => (
                <li key={s.utmSource ?? "unknown"} className="flex justify-between gap-4">
                  <span className="capitalize text-ink/85">
                    {sourceLabel(s.utmSource)}
                  </span>
                  <span className="tabular-nums text-muted">{s._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Real-time
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink/85">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            Online now (last 5 min):{" "}
            <span className="font-semibold tabular-nums">{onlineNowCount}</span>
          </p>
          <p className="mt-2 text-sm text-ink/85">
            Avg session duration:{" "}
            <span className="font-semibold tabular-nums">
              {formatSeconds(avgSessionSeconds)}
            </span>
          </p>
        </div>
      </div>

      {(viewToCartDrop || cartToCheckoutDrop) && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-900">
            Funnel warning
          </p>
          <p className="mt-1 text-sm text-red-900/90">
            Conversion dropped sharply vs previous period. Check checkout flow, shipping methods, and payment gateway health.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Most viewed products
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {topProducts.length === 0 ? (
              <li className="text-muted">No product views yet.</li>
            ) : (
              topProducts.map((p) => (
                <li
                  key={p.productSlug ?? "unknown"}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="font-medium text-ink/90">{p.productSlug}</span>
                  <span className="tabular-nums text-muted">{p._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top countries
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {topCountries.length === 0 ? (
              <li className="text-muted">No geo data yet.</li>
            ) : (
              topCountries.map((r) => (
                <li key={r.country ?? "unknown"} className="flex justify-between gap-3">
                  <Link
                    href={adminPath(
                      `/traffic?days=${days}&country=${encodeURIComponent(r.country ?? "unknown")}${selectedDevice ? `&device=${encodeURIComponent(selectedDevice)}` : ""}${selectedBrowser ? `&browser=${encodeURIComponent(selectedBrowser)}` : ""}`,
                    )}
                    className="uppercase text-ink/85 underline-offset-2 hover:underline"
                  >
                    {r.country ?? "unknown"}
                  </Link>
                  <span className="tabular-nums text-muted">{r._count._all}</span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Top cities
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {topCities.length === 0 ? (
              <li className="text-muted">No city data yet.</li>
            ) : (
              topCities.map((r) => (
                <li key={r.city ?? "unknown"} className="flex justify-between gap-3">
                  <span className="text-ink/85">{r.city ?? "unknown"}</span>
                  <span className="tabular-nums text-muted">{r._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Device & browser
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {topDevices.length === 0 ? (
              <li className="text-muted">No device data yet.</li>
            ) : (
              topDevices.map((r) => (
                <li key={r.deviceType ?? "unknown"} className="flex justify-between gap-3">
                  <Link
                    href={adminPath(
                      `/traffic?days=${days}&device=${encodeURIComponent(r.deviceType ?? "unknown")}${selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : ""}${selectedBrowser ? `&browser=${encodeURIComponent(selectedBrowser)}` : ""}`,
                    )}
                    className="capitalize text-ink/85 underline-offset-2 hover:underline"
                  >
                    {r.deviceType ?? "unknown"}
                  </Link>
                  <span className="tabular-nums text-muted">{r._count._all}</span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Browsers
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {topBrowsers.length === 0 ? (
              <li className="text-muted">No browser data yet.</li>
            ) : (
              topBrowsers.map((r) => (
                <li key={r.browser ?? "unknown"} className="flex justify-between gap-3">
                  <Link
                    href={adminPath(
                      `/traffic?days=${days}&browser=${encodeURIComponent(r.browser ?? "unknown")}${selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : ""}${selectedDevice ? `&device=${encodeURIComponent(selectedDevice)}` : ""}`,
                    )}
                    className="capitalize text-ink/85 underline-offset-2 hover:underline"
                  >
                    {r.browser ?? "unknown"}
                  </Link>
                  <span className="tabular-nums text-muted">{r._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-1">

        <div id="recent-visitor-journeys" className="rounded-2xl border border-line bg-white/70 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Recent visitor journeys
            </p>
            {recentSessionsTotal > 0 ? (
              <p className="text-xs text-muted">
                Page {safeJourneysPage} / {journeysTotalPages}
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted">No sessions captured yet.</p>
            ) : (
              recentSessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-line/60 bg-paper/60 p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted break-all">
                    <span className="font-mono break-all">{s.sessionKey.slice(-12)}</span>
                    <span className="break-all">{s.createdAt.toLocaleString("en-US")}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/80">
                      [{sourceLabel(s.utmSource)}]
                    </span>
                    {s.country ? <span className="break-all">{s.country}</span> : null}
                    {s.city ? <span className="break-all">{s.city}</span> : null}
                    {s.utmCampaign ? <span className="break-all">cmp: {s.utmCampaign}</span> : null}
                    {s.landingPath ? <span className="break-all">landing: {s.landingPath}</span> : null}
                  </div>
                  <div className="mt-2 rounded-lg border border-line/50 bg-white/60 px-3 py-2 text-sm text-ink/85 break-all">
                    {s.events
                      .filter((e) => e.type !== "heartbeat")
                      .map((e) => {
                        const base = compactEventLabel(e.type);
                        if (e.productSlug) return `${base}:${e.productSlug}`;
                        if (e.path) return `${base}:${e.path}`;
                        return base;
                      })
                      .join(" -> ") || "No journey events"}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs break-all">
                    {s.events.length === 0 ? (
                      <li className="text-muted">No events.</li>
                    ) : (
                      s.events.map((e, i) => (
                        <li key={`${s.id}-${i}`} className="text-ink/85">
                          <span className="font-semibold uppercase tracking-[0.08em] text-[11px]">
                            {e.type}
                          </span>
                          {e.productSlug ? ` · ${e.productSlug}` : ""}
                          {e.path ? ` · ${e.path}` : ""}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
          {recentSessionsTotal > JOURNEYS_PAGE_SIZE ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Link
                href={buildTrafficPageHref(Math.max(1, safeJourneysPage - 1))}
                scroll={false}
                aria-disabled={safeJourneysPage <= 1}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  safeJourneysPage <= 1
                    ? "pointer-events-none border-line/60 bg-white/50 text-muted"
                    : "border-line bg-white text-ink hover:border-ink/20"
                }`}
              >
                Prev
              </Link>
              <Link
                href={buildTrafficPageHref(Math.min(journeysTotalPages, safeJourneysPage + 1))}
                scroll={false}
                aria-disabled={safeJourneysPage >= journeysTotalPages}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  safeJourneysPage >= journeysTotalPages
                    ? "pointer-events-none border-line/60 bg-white/50 text-muted"
                    : "border-line bg-white text-ink hover:border-ink/20"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: { text: string; tone: "up" | "down" | "flat" };
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-ink">{value}</p>
      {delta ? (
        <p
          className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
            delta.tone === "up"
              ? "text-green-700"
              : delta.tone === "down"
                ? "text-red-700"
                : "text-muted"
          }`}
        >
          vs prev {delta.text}
        </p>
      ) : null}
    </div>
  );
}
