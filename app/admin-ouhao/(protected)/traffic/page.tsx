import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function toInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(90, Math.floor(n)));
}

function sourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  return source.replace(/[_-]/g, " ");
}

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = toInt(sp.days, 7);
  // Server-rendered analytics window anchored to "now".
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - days * 86400000);

  const [
    sessionCount,
    pageViewCount,
    productViewCount,
    addToCartCount,
    checkoutStartCount,
    purchaseCount,
    topSources,
    topProducts,
    recentSessions,
  ] = await Promise.all([
    prisma.visitorSession.count({ where: { createdAt: { gte: since } } }),
    prisma.visitorEvent.count({
      where: { type: "page_view", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "product_view", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "add_to_cart", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "checkout_start", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.count({
      where: { type: "purchase", createdAt: { gte: since } },
    }),
    prisma.visitorEvent.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.visitorEvent.groupBy({
      by: ["productSlug"],
      where: {
        type: "product_view",
        createdAt: { gte: since },
        productSlug: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { productSlug: "desc" } },
      take: 10,
    }),
    prisma.visitorSession.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        sessionKey: true,
        createdAt: true,
        utmSource: true,
        utmCampaign: true,
        landingPath: true,
        events: {
          orderBy: { createdAt: "asc" },
          take: 8,
          select: {
            type: true,
            path: true,
            productSlug: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const funnelViewToCart =
    productViewCount > 0 ? Math.round((addToCartCount / productViewCount) * 100) : 0;
  const funnelCartToCheckout =
    addToCartCount > 0 ? Math.round((checkoutStartCount / addToCartCount) * 100) : 0;

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
          {[7, 14, 30].map((d) => (
            <Link
              key={d}
              href={adminPath(`/traffic?days=${d}`)}
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Visitor sessions" value={sessionCount} />
        <MetricCard label="Page views" value={pageViewCount} />
        <MetricCard label="Product views" value={productViewCount} />
        <MetricCard label="Add to cart" value={addToCartCount} />
        <MetricCard label="Checkout starts" value={checkoutStartCount} />
        <MetricCard label="Purchases tracked" value={purchaseCount} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                <li key={s.source ?? "unknown"} className="flex justify-between gap-4">
                  <span className="capitalize text-ink/85">{sourceLabel(s.source)}</span>
                  <span className="tabular-nums text-muted">{s._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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
            Recent visitor journeys
          </p>
          <div className="mt-3 space-y-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted">No sessions captured yet.</p>
            ) : (
              recentSessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-line/60 bg-paper/60 p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-mono">{s.sessionKey.slice(-12)}</span>
                    <span>{s.createdAt.toLocaleString("en-US")}</span>
                    <span className="capitalize">src: {sourceLabel(s.utmSource)}</span>
                    {s.utmCampaign ? <span>cmp: {s.utmCampaign}</span> : null}
                    {s.landingPath ? <span>landing: {s.landingPath}</span> : null}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
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
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-ink">{value}</p>
    </div>
  );
}
