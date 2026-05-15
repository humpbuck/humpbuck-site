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
  if (!source) return "Direct";
  const s = source.trim().toLowerCase();
  if (!s) return "Direct";
  if (s === "(direct)" || s === "direct" || s === "none") return "Direct";
  if (s.includes("google") && (s.includes("organic") || s === "google")) return "Google Organic";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("facebook") || s.includes("meta")) return "Facebook Ads";
  if (s.includes("tiktok")) return "TikTok";
  if (s.includes("youtube")) return "YouTube";
  if (s.includes("email") || s.includes("newsletter")) return "Email";
  if (s.includes("affiliate")) return "Affiliate";
  if (s.includes("referral") || s.includes("referrer")) return "Referral";
  if (s.includes("search")) return "Search";
  return source.replace(/[_-]/g, " ");
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function deltaBadge(current: number, previous: number): { text: string; tone: "up" | "down" | "flat" } {
  const change = pctChange(current, previous);
  if (change > 0) return { text: `↑ ${change}%`, tone: "up" };
  if (change < 0) return { text: `↓ ${Math.abs(change)}%`, tone: "down" };
  return { text: "→ 0%", tone: "flat" };
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function compactEventLabel(type: string): string {
  if (type === "session_start") return "entry";
  if (type === "page_view") return "page";
  if (type === "product_view") return "product";
  if (type === "add_to_cart") return "cart";
  if (type === "checkout_start") return "checkout";
  if (type === "purchase") return "purchase";
  return type;
}

function safeToken(input?: string): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(s)) return null;
  return s;
}

function makeSeries(values: number[]): string {
  const maxC = Math.max(1, ...values);
  return values
    .map((c, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * 100;
      const y = 100 - (c / maxC) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

type ProductSummary = {
  slug: string;
  name: string;
  views: number;
  cartAdds: number;
  orders: number;
  salesCents: number;
};

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
    orderTotalCentsCurrent,
    refundCountCurrent,
    onlineNowCount,
    topSources,
    topPages,
    topProductsRaw,
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
    prisma.visitorSession.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.visitorEvent.count({ where: { type: "page_view", createdAt: { gte: since } } }),
    prisma.visitorEvent.count({ where: { type: "page_view", createdAt: { gte: prevSince, lt: since } } }),
    prisma.visitorEvent.count({ where: { type: "product_view", createdAt: { gte: since } } }),
    prisma.visitorEvent.count({ where: { type: "product_view", createdAt: { gte: prevSince, lt: since } } }),
    prisma.visitorEvent.count({ where: { type: "add_to_cart", createdAt: { gte: since } } }),
    prisma.visitorEvent.count({ where: { type: "add_to_cart", createdAt: { gte: prevSince, lt: since } } }),
    prisma.visitorEvent.count({ where: { type: "checkout_start", createdAt: { gte: since } } }),
    prisma.visitorEvent.count({ where: { type: "checkout_start", createdAt: { gte: prevSince, lt: since } } }),
    prisma.visitorEvent.count({ where: { type: "purchase", createdAt: { gte: since } } }),
    prisma.visitorEvent.count({ where: { type: "purchase", createdAt: { gte: prevSince, lt: since } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: since }, deletedAt: null },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: since }, deletedAt: null, refundedAt: { not: null } } }),
    prisma.visitorSession.count({ where: { lastSeenAt: { gte: onlineSince } } }),
    prisma.visitorSession.groupBy({
      by: ["utmSource"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 8,
    }),
    prisma.visitorSession.groupBy({
      by: ["landingPath"],
      where: { createdAt: { gte: since }, landingPath: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { landingPath: "desc" } },
      take: 10,
    }),
    prisma.visitorEvent.groupBy({
      by: ["productSlug"],
      where: {
        type: "product_view",
        createdAt: { gte: since },
        productSlug: { not: null as null },
      },
      _count: { _all: true },
      orderBy: { _count: { productSlug: "desc" } },
      take: 12,
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
          select: { type: true, path: true, productSlug: true, createdAt: true },
        },
      },
    }),
    prisma.visitorSession.count({ where: recentSessionsWhere }),
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

  const orderSalesCentsCurrent = Number(orderTotalCentsCurrent._sum.totalCents ?? 0);
  const avgSessionSeconds = Number(avgDurationRows[0]?.avg_seconds ?? 0);
  const checkoutConversion = sessionCountCurrent > 0 ? Math.round((purchaseCountCurrent / sessionCountCurrent) * 100) : 0;
  const refundRate = purchaseCountCurrent > 0 ? Math.round((refundCountCurrent / purchaseCountCurrent) * 100) : 0;
  const funnelViewToCart = productViewCountCurrent > 0 ? Math.round((addToCartCountCurrent / productViewCountCurrent) * 100) : 0;
  const funnelCartToCheckout = addToCartCountCurrent > 0 ? Math.round((checkoutStartCountCurrent / addToCartCountCurrent) * 100) : 0;
  const funnelCheckoutToPurchase = checkoutStartCountCurrent > 0 ? Math.round((purchaseCountCurrent / checkoutStartCountCurrent) * 100) : 0;

  const rowMap = new Map<number, number>();
  for (const r of chartRows) {
    rowMap.set(new Date(r.hour_bucket).getTime(), Number(r.c));
  }
  const chartStart = new Date(nowTs - days * 86400000);
  chartStart.setMinutes(0, 0, 0);
  const chartEnd = new Date(nowTs);
  chartEnd.setMinutes(0, 0, 0);
  const points: Array<{ t: number; c: number }> = [];
  for (let t = chartStart.getTime(); t <= chartEnd.getTime(); t += 3600000) {
    points.push({ t, c: rowMap.get(t) ?? 0 });
  }
  const pageValues = points.map((p) => p.c);
  const polyline = makeSeries(pageValues);
  const maxC = Math.max(1, ...pageValues);

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

  const productSummaryMap = new Map<string, ProductSummary>();
  const productSlugs = topProductsRaw.map((p) => p.productSlug).filter((x): x is string => Boolean(x));
  const [productRows, orderItemRows, productMetaRows] = await Promise.all([
    prisma.visitorEvent.groupBy({
      by: ["productSlug"],
      where: {
        type: "product_view",
        createdAt: { gte: since },
        productSlug: { in: productSlugs },
      },
      _count: { _all: true },
    }),
    prisma.orderItemSnapshot.groupBy({
      by: ["productSlug"],
      where: { createdAt: { gte: since }, productSlug: { in: productSlugs } },
      _count: { _all: true },
      _sum: { lineTotalCents: true, qty: true },
    }),
    prisma.catalogProduct.findMany({
      where: { slug: { in: productSlugs } },
      select: { slug: true, name: true, price: true },
    }),
  ]);
  const productNameMap = new Map(productMetaRows.map((p) => [p.slug, p.name]));
  const productViewMap = new Map(productRows.map((r) => [r.productSlug ?? "", Number(r._count._all)]));
  const productOrderMap = new Map(orderItemRows.map((r) => [r.productSlug, { orders: Number(r._count._all), salesCents: Number(r._sum.lineTotalCents ?? 0) }]));
  for (const p of topProductsRaw) {
    const slug = p.productSlug ?? "unknown";
    const viewCount = Number(p._count._all);
    const orderData = productOrderMap.get(slug) ?? { orders: 0, salesCents: 0 };
    productSummaryMap.set(slug, {
      slug,
      name: productNameMap.get(slug) ?? slug,
      views: viewCount,
      cartAdds: 0,
      orders: orderData.orders,
      salesCents: orderData.salesCents,
    });
  }
  const cartAddRows = await prisma.visitorEvent.groupBy({
    by: ["productSlug"],
    where: {
      type: "add_to_cart",
      createdAt: { gte: since },
      productSlug: { in: productSlugs },
    },
    _count: { _all: true },
  });
  for (const r of cartAddRows) {
    const slug = r.productSlug ?? "unknown";
    const current = productSummaryMap.get(slug) ?? {
      slug,
      name: productNameMap.get(slug) ?? slug,
      views: productViewMap.get(slug) ?? 0,
      cartAdds: 0,
      orders: 0,
      salesCents: 0,
    };
    current.cartAdds = Number(r._count._all);
    current.views = current.views || productViewMap.get(slug) || 0;
    productSummaryMap.set(slug, current);
  }
  const topProducts = [...productSummaryMap.values()]
    .sort((a, b) => b.salesCents - a.salesCents || b.orders - a.orders || b.views - a.views)
    .slice(0, 10);

  const topSourceCards = topSources.map((s) => ({ label: sourceLabel(s.utmSource), count: s._count._all }));
  const topPageCards = topPages.map((p) => ({ label: p.landingPath ?? "unknown", count: p._count._all }));

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">经营总览</h1>
          <p className="mt-2 text-sm text-muted">查看访问、商品表现、转化和渠道效果。</p>
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
              href={adminPath(`/traffic?days=${d}${selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : ""}${selectedDevice ? `&device=${encodeURIComponent(selectedDevice)}` : ""}${selectedBrowser ? `&browser=${encodeURIComponent(selectedBrowser)}` : ""}`)}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Traffic trend ({days}d)</p>
          <p className="text-xs text-muted">Peak {maxC} page views / hour</p>
        </div>
        <div className="mt-3 h-28 w-full rounded-xl border border-line/60 bg-paper/70 p-2">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polyline fill="none" stroke="currentColor" className="text-cyan-600" strokeWidth="1.5" points={polyline} />
            {points.map((p, i) => {
              const x = points.length <= 1 ? 0 : (i / (points.length - 1)) * 100;
              const y = 100 - (p.c / maxC) * 100;
              return (
                <circle key={`${p.t}-${i}`} cx={x} cy={y} r="2.8" fill="transparent" className="cursor-pointer">
                  <title>{`${new Date(p.t).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })} · ${p.c} page views`}</title>
                </circle>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="访问人数" value={sessionCountCurrent} delta={deltaBadge(sessionCountCurrent, sessionCountPrevious)} />
        <MetricCard label="商品浏览" value={productViewCountCurrent} delta={deltaBadge(productViewCountCurrent, productViewCountPrevious)} />
        <MetricCard label="加购" value={addToCartCountCurrent} delta={deltaBadge(addToCartCountCurrent, addToCartCountPrevious)} />
        <MetricCard label="订单" value={purchaseCountCurrent} delta={deltaBadge(purchaseCountCurrent, purchaseCountPrevious)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="结账开始" value={checkoutStartCountCurrent} delta={deltaBadge(checkoutStartCountCurrent, checkoutStartCountPrevious)} />
        <MetricCard label="销售额" value={Math.round(orderSalesCentsCurrent / 100)} suffix="" />
        <MetricCard label="转化率" value={checkoutConversion} suffix="%" />
        <MetricCard label="退款率" value={refundRate} suffix="%" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="流量趋势">
          <ul className="space-y-2 text-sm text-ink/85">
            <li className="flex justify-between gap-4"><span>sessions</span><span className="tabular-nums">{sessionCountCurrent}</span></li>
            <li className="flex justify-between gap-4"><span>page views</span><span className="tabular-nums">{pageViewCountCurrent}</span></li>
            <li className="flex justify-between gap-4"><span>product views</span><span className="tabular-nums">{productViewCountCurrent}</span></li>
            <li className="flex justify-between gap-4"><span>add to cart</span><span className="tabular-nums">{addToCartCountCurrent}</span></li>
            <li className="flex justify-between gap-4"><span>purchases</span><span className="tabular-nums">{purchaseCountCurrent}</span></li>
          </ul>
        </Panel>
        <Panel title="来源排行">
          <ul className="mt-3 space-y-2 text-sm">
            {topSourceCards.length === 0 ? (
              <li className="text-muted">No data yet.</li>
            ) : (
              topSourceCards.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-4">
                  <span className="text-ink/85">{s.label}</span>
                  <span className="tabular-nums text-muted">{s.count}</span>
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="实时">
          <p className="mt-3 flex items-center gap-2 text-sm text-ink/85">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            Online now (last 5 min): <span className="font-semibold tabular-nums">{onlineNowCount}</span>
          </p>
          <p className="mt-2 text-sm text-ink/85">Avg session duration: <span className="font-semibold tabular-nums">{formatSeconds(avgSessionSeconds)}</span></p>
          <p className="mt-2 text-xs text-muted">Data source: GA4 + Vercel Analytics + Neon/Postgres.</p>
        </Panel>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Funnel snapshot</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatLine label="Product view → add to cart" value={`${funnelViewToCart}%`} />
          <StatLine label="Add to cart → checkout" value={`${funnelCartToCheckout}%`} />
          <StatLine label="Checkout → purchase" value={`${funnelCheckoutToPurchase}%`} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="商品表现">
          <p className="mt-2 text-xs text-muted">按销售额排序，显示真实商品名、销量、浏览和加购表现。</p>
          <ul className="mt-4 space-y-3 text-sm">
            {topProducts.length === 0 ? (
              <li className="text-muted">No product sales yet.</li>
            ) : (
              topProducts.map((p) => (
                <li key={p.slug} className="rounded-xl border border-line/60 bg-paper/60 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-ink/90">{p.name}</p>
                      <p className="mt-1 text-xs text-muted">/{p.slug}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p className="font-semibold text-ink/85 tabular-nums">${(p.salesCents / 100).toFixed(2)}</p>
                      <p>sales</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-ink/85">
                    <div className="rounded-lg bg-white/70 px-2 py-1.5">Views <span className="ml-1 tabular-nums text-muted">{p.views}</span></div>
                    <div className="rounded-lg bg-white/70 px-2 py-1.5">Cart <span className="ml-1 tabular-nums text-muted">{p.cartAdds}</span></div>
                    <div className="rounded-lg bg-white/70 px-2 py-1.5">Orders <span className="ml-1 tabular-nums text-muted">{p.orders}</span></div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="热门页面">
          <p className="mt-2 text-xs text-muted">按入口页面排序，帮助你判断流量先进入哪里。</p>
          <ul className="mt-3 space-y-2 text-sm">
            {topPageCards.length === 0 ? (
              <li className="text-muted">No page data yet.</li>
            ) : (
              topPageCards.map((p) => (
                <li key={p.label} className="flex items-center justify-between gap-4">
                  <span className="truncate text-ink/85">{p.label}</span>
                  <span className="tabular-nums text-muted">{p.count}</span>
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="地区和设备">
          <p className="mt-2 text-xs text-muted">国家 / 城市 / 手机桌面 / 浏览器</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <MiniList title="国家" items={topCountries.map((r) => ({ label: r.country ?? "unknown", count: r._count._all }))} />
            <MiniList title="设备" items={topDevices.map((r) => ({ label: r.deviceType ?? "unknown", count: r._count._all }))} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MiniList title="城市" items={topCities.map((r) => ({ label: r.city ?? "unknown", count: r._count._all }))} />
            <MiniList title="浏览器" items={topBrowsers.map((r) => ({ label: r.browser ?? "unknown", count: r._count._all }))} />
          </div>
        </Panel>
      </div>

      <div id="recent-visitor-journeys" className="mt-8 rounded-2xl border border-line bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Recent visitor journeys</p>
            <p className="mt-1 text-xs text-muted">排查入口、路径、卡点和成交前的最后动作。</p>
          </div>
          {recentSessionsTotal > 0 ? <p className="text-xs text-muted">Page {safeJourneysPage} / {journeysTotalPages}</p> : null}
        </div>
        <div className="mt-4 space-y-4">
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions captured yet.</p>
          ) : (
            recentSessions.map((s) => {
              const events = s.events.filter((e) => e.type !== "heartbeat");
              const lastEvent = events[events.length - 1] ?? null;
              const pageCount = events.filter((e) => e.type === "page_view").length;
              const productCount = events.filter((e) => e.type === "product_view").length;
              const cartCount = events.filter((e) => e.type === "add_to_cart").length;
              const checkoutCount = events.filter((e) => e.type === "checkout_start").length;
              const purchased = events.some((e) => e.type === "purchase");

              return (
                <div key={s.id} className="rounded-xl border border-line/60 bg-paper/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted break-all">
                        <span className="font-mono break-all">{s.sessionKey.slice(-12)}</span>
                        <span>{s.createdAt.toLocaleString("en-US")}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/80">[{sourceLabel(s.utmSource)}]</span>
                        {s.country ? <span>{s.country}</span> : null}
                        {s.city ? <span>{s.city}</span> : null}
                        {s.utmCampaign ? <span>cmp: {s.utmCampaign}</span> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        <span className="rounded-full border border-line bg-white px-2 py-1">Pages {pageCount}</span>
                        <span className="rounded-full border border-line bg-white px-2 py-1">Products {productCount}</span>
                        <span className="rounded-full border border-line bg-white px-2 py-1">Cart {cartCount}</span>
                        <span className="rounded-full border border-line bg-white px-2 py-1">Checkout {checkoutCount}</span>
                        <span className={`rounded-full border px-2 py-1 ${purchased ? "border-green-200 bg-green-50 text-green-800" : "border-line bg-white text-muted"}`}>
                          {purchased ? "Purchased" : "No purchase"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p className="font-semibold text-ink/85">Last action</p>
                      <p className="mt-1 break-all">{lastEvent ? `${compactEventLabel(lastEvent.type)}${lastEvent.productSlug ? `: ${lastEvent.productSlug}` : lastEvent.path ? `: ${lastEvent.path}` : ""}` : "No events"}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-line/50 bg-white/60 px-3 py-2 text-sm text-ink/85 break-all">
                    {events.map((e) => {
                      const base = compactEventLabel(e.type);
                      if (e.productSlug) return `${base}:${e.productSlug}`;
                      if (e.path) return `${base}:${e.path}`;
                      return base;
                    }).join(" -> ") || "No journey events"}
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
                    <div className="rounded-lg border border-line/60 bg-white/50 px-3 py-2">
                      <p className="font-semibold uppercase tracking-[0.08em] text-ink/80">Landing</p>
                      <p className="mt-1 break-all">{s.landingPath ?? "Unknown"}</p>
                    </div>
                    <div className="rounded-lg border border-line/60 bg-white/50 px-3 py-2">
                      <p className="font-semibold uppercase tracking-[0.08em] text-ink/80">Campaign</p>
                      <p className="mt-1 break-all">{s.utmCampaign ?? "None"}</p>
                    </div>
                    <div className="rounded-lg border border-line/60 bg-white/50 px-3 py-2">
                      <p className="font-semibold uppercase tracking-[0.08em] text-ink/80">Journey note</p>
                      <p className="mt-1 break-all">{purchased ? "Reached purchase" : lastEvent?.type === "checkout_start" ? "Stopped at checkout" : lastEvent?.type === "add_to_cart" ? "Stopped after add to cart" : "Browsing"}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {recentSessionsTotal > JOURNEYS_PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Link href={buildTrafficPageHref(Math.max(1, safeJourneysPage - 1))} scroll={false} aria-disabled={safeJourneysPage <= 1} className={`rounded-lg border px-3 py-1.5 text-xs ${safeJourneysPage <= 1 ? "pointer-events-none border-line/60 bg-white/50 text-muted" : "border-line bg-white text-ink hover:border-ink/20"}`}>
              Prev
            </Link>
            <Link href={buildTrafficPageHref(Math.min(journeysTotalPages, safeJourneysPage + 1))} scroll={false} aria-disabled={safeJourneysPage >= journeysTotalPages} className={`rounded-lg border px-3 py-1.5 text-xs ${safeJourneysPage >= journeysTotalPages ? "pointer-events-none border-line/60 bg-white/50 text-muted" : "border-line bg-white text-ink hover:border-ink/20"}`}>
              Next
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, delta, suffix }: { label: string; value: number; delta?: { text: string; tone: "up" | "down" | "flat" }; suffix?: string; }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-ink">{value}{suffix ?? ""}</p>
      {delta ? <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${delta.tone === "up" ? "text-green-700" : delta.tone === "down" ? "text-red-700" : "text-muted"}`}>vs prev {delta.text}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
      {children}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/60 bg-paper/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: Array<{ label: string; count: number }>; }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.length === 0 ? (
          <li className="text-muted">No data yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3">
              <span className="truncate text-ink/85">{item.label}</span>
              <span className="tabular-nums text-muted">{item.count}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
