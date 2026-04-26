import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { buildAffiliatePidSeed } from "@/lib/affiliate";
import { prisma } from "@/lib/prisma";

function goAffiliate(error?: string): never {
  if (!error) redirect(adminPath("/affiliate"));
  redirect(`${adminPath("/affiliate")}?error=${encodeURIComponent(error)}`);
}

async function ensureDefaultTierId(): Promise<string> {
  const existing = await prisma.affiliateTier.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.affiliateTier.create({
    data: {
      name: "Starter",
      commissionType: "percent",
      commissionValue: 10,
      isDefault: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function ensureUniqueAffiliatePid(input: {
  userId: string;
  email?: string | null;
  currentPid?: string | null;
}): Promise<string> {
  if (input.currentPid) return input.currentPid;
  const base = buildAffiliatePidSeed({ userId: input.userId, email: input.email });
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const exists = await prisma.affiliateProfile.findUnique({
      where: { pid: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

function parseCommissionValue(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function normalizeFilterValue(raw: string | undefined): string {
  return String(raw ?? "").trim();
}

async function createTierAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const commissionType = String(formData.get("commissionType") ?? "percent").trim();
  const commissionValue = parseCommissionValue(formData.get("commissionValue"));
  const makeDefault = String(formData.get("isDefault") ?? "") === "on";

  if (!name) goAffiliate("Tier name is required.");
  if (!["percent", "fixed"].includes(commissionType)) {
    goAffiliate("Commission type must be percent or fixed.");
  }
  if (commissionValue === null) goAffiliate("Commission value must be >= 0.");

  await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.affiliateTier.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    await tx.affiliateTier.create({
      data: { name, commissionType, commissionValue, isDefault: makeDefault },
    });
  });

  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function approveApplicationAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("applicationId") ?? "").trim();
  if (!id) goAffiliate("Missing application id.");
  const app = await prisma.affiliateApplication.findUnique({
    where: { id },
    include: { affiliate: true, user: true },
  });
  if (!app) goAffiliate("Application not found.");

  const defaultTierId = await ensureDefaultTierId();
  const pid = await ensureUniqueAffiliatePid({
    userId: app.userId,
    email: app.user.email,
    currentPid: app.affiliate?.pid ?? null,
  });
  const profile = await prisma.affiliateProfile.upsert({
    where: { userId: app.userId },
    create: {
      userId: app.userId,
      displayName:
        app.user.displayName?.trim() ||
        app.user.name?.trim() ||
        app.user.email?.split("@")[0]?.trim() ||
        null,
      status: "active",
      riskFlag: false,
      blacklist: false,
      tierId: defaultTierId,
      pid,
    },
    update: {
      status: "active",
      riskFlag: false,
      blacklist: false,
      tierId: app.affiliate?.tierId ?? defaultTierId,
      pid,
    },
    select: { id: true },
  });

  await prisma.affiliateApplication.update({
    where: { id },
    data: {
      affiliateId: profile.id,
      status: "approved",
      reviewedBy: "admin",
      reviewedAt: new Date(),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function rejectApplicationAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("applicationId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) goAffiliate("Missing application id.");
  await prisma.affiliateApplication.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedBy: "admin",
      reviewedAt: new Date(),
      riskReason: reason || undefined,
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function updateProfileAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "").trim();
  const whitelist = String(formData.get("whitelist") ?? "") === "on";
  const notes = String(formData.get("notes") ?? "").trim();
  const payoutEmail = String(formData.get("payoutEmail") ?? "").trim();
  const payoutWhatsapp = String(formData.get("payoutWhatsapp") ?? "").trim();
  if (!profileId) goAffiliate("Missing affiliate profile id.");

  await prisma.affiliateProfile.update({
    where: { id: profileId },
    data: {
      tierId: tierId || null,
      whitelist,
      notes: notes || null,
      payoutEmail: payoutEmail || null,
      payoutWhatsapp: payoutWhatsapp || null,
      paymentInfoPending: !(payoutEmail || payoutWhatsapp),
    },
  });

  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function toggleBlacklistAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const nextBlacklisted = String(formData.get("nextBlacklisted") ?? "") === "true";
  if (!profileId) goAffiliate("Missing affiliate profile id.");

  await prisma.affiliateProfile.update({
    where: { id: profileId },
    data: {
      blacklist: nextBlacklisted,
      status: nextBlacklisted ? "blacklisted" : "active",
      riskFlag: nextBlacklisted,
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function markLedgerPaidAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();
  if (!ledgerId) goAffiliate("Missing ledger id.");

  await prisma.affiliateCommissionLedger.updateMany({
    where: {
      id: ledgerId,
      status: "eligible",
      paidAt: null,
      reversedAt: null,
    },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function markAllEligiblePaidAction() {
  "use server";
  await assertAdmin();
  await prisma.affiliateCommissionLedger.updateMany({
    where: {
      status: "eligible",
      paidAt: null,
      reversedAt: null,
    },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function markSelectedLedgersPaidAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const ids = formData
    .getAll("ledgerIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (ids.length === 0) goAffiliate("Please select at least one order to mark paid.");
  await prisma.affiliateCommissionLedger.updateMany({
    where: {
      id: { in: ids },
      status: "eligible",
      paidAt: null,
      reversedAt: null,
    },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function markFilteredEligiblePaidAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const affiliateId = String(formData.get("affiliateId") ?? "").trim();
  const orderStatus = String(formData.get("orderStatus") ?? "").trim();
  await prisma.affiliateCommissionLedger.updateMany({
    where: {
      status: "eligible",
      paidAt: null,
      reversedAt: null,
      ...(affiliateId ? { affiliateId } : {}),
      ...(orderStatus ? { order: { status: orderStatus } } : {}),
    },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

function asLinks(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function AdminAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    affiliateId?: string;
    orderStatus?: string;
    settle?: string;
  }>;
}) {
  await assertAdmin();
  await ensureDefaultTierId();
  const sp = await searchParams;
  const selectedAffiliateId = normalizeFilterValue(sp.affiliateId);
  const selectedOrderStatus = normalizeFilterValue(sp.orderStatus);
  const selectedSettlement = normalizeFilterValue(sp.settle) || "eligible";

  const [tiers, pendingApps, profiles, blacklistedCount, autoApprovedCount, recentAttributedOrders, ledgerSummary, recentLedgers, settlementRows] =
    await Promise.all([
      prisma.affiliateTier.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
      prisma.affiliateApplication.findMany({
        where: { status: "pending" },
        include: { user: true, affiliate: { include: { tier: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.affiliateProfile.findMany({
        include: {
          user: true,
          tier: true,
          applications: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.affiliateProfile.count({ where: { blacklist: true } }),
      prisma.affiliateApplication.count({ where: { status: "auto_approved" } }),
      prisma.order.findMany({
        where: { affiliateId: { not: null }, deletedAt: null },
        include: { affiliate: { include: { user: { select: { email: true, displayName: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.affiliateCommissionLedger.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.affiliateCommissionLedger.findMany({
        include: {
          affiliate: { include: { user: { select: { email: true, displayName: true } } } },
          order: { select: { id: true, totalCents: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.affiliateCommissionLedger.findMany({
        where: {
          ...(selectedAffiliateId ? { affiliateId: selectedAffiliateId } : {}),
          ...(selectedOrderStatus ? { order: { status: selectedOrderStatus } } : {}),
          ...(selectedSettlement === "all" ? {} : { status: selectedSettlement }),
        },
        include: {
          affiliate: { include: { user: { select: { email: true, displayName: true } } } },
          order: { select: { id: true, status: true, totalCents: true } },
        },
        orderBy: [{ eligibleAt: "asc" }, { createdAt: "desc" }],
        take: 120,
      }),
    ]);

  const activeProfiles = profiles.filter((p) => !p.blacklist);
  const blacklistedProfiles = profiles.filter((p) => p.blacklist);
  const settlementOrderStatuses = Array.from(
    new Set(settlementRows.map((r) => r.order.status).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const filterQuery = new URLSearchParams();
  if (selectedAffiliateId) filterQuery.set("affiliateId", selectedAffiliateId);
  if (selectedOrderStatus) filterQuery.set("orderStatus", selectedOrderStatus);

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Affiliate</h1>
      <p className="mt-2 text-sm text-muted">
        Manage affiliate applications, tier levels, and blacklist/whitelist controls.
      </p>

      {sp.error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {sp.error}
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Total affiliates
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{profiles.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Auto approved
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{autoApprovedCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Pending review
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{pendingApps.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Blacklisted
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{blacklistedCount}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Settlement queue
        </h2>
        <p className="mt-2 text-sm text-muted">
          Filter by affiliate and order status, then mark selected eligible orders as paid.
        </p>
        <form method="get" className="mt-4 grid gap-2 md:grid-cols-4">
          <input type="hidden" name="error" value="" />
          <select
            name="affiliateId"
            defaultValue={selectedAffiliateId}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          >
            <option value="">All affiliates</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.displayName || p.user.email || p.id}
              </option>
            ))}
          </select>
          <select
            name="orderStatus"
            defaultValue={selectedOrderStatus}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          >
            <option value="">All order statuses</option>
            {settlementOrderStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="settle"
            defaultValue={selectedSettlement}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          >
            <option value="eligible">Eligible</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="reversed">Reversed</option>
            <option value="all">All settlement statuses</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
          >
            Apply filters
          </button>
        </form>
        <form action={markSelectedLedgersPaidAction} className="mt-4 space-y-2 text-sm text-ink/90">
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
            >
              Mark selected eligible as paid
            </button>
            <button
              formAction={markFilteredEligiblePaidAction}
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              Mark all filtered eligible as paid
            </button>
            <input type="hidden" name="affiliateId" value={selectedAffiliateId} />
            <input type="hidden" name="orderStatus" value={selectedOrderStatus} />
          </div>
          {settlementRows.length === 0 ? (
            <p className="rounded-xl border border-line bg-paper/60 px-3 py-2 text-muted">
              No settlement rows for current filters.
            </p>
          ) : (
            settlementRows.map((l) => (
              <label
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-3 py-2"
              >
                <input
                  type="checkbox"
                  name="ledgerIds"
                  value={l.id}
                  disabled={l.status !== "eligible" || Boolean(l.paidAt) || Boolean(l.reversedAt)}
                />
                <span>
                  #{l.order.id.slice(-8)} · {l.affiliate?.user.displayName || l.affiliate?.user.email || l.affiliateId} ·
                  Order {l.order.status} · ${(l.commissionCents / 100).toFixed(2)} · Settlement {l.status}
                </span>
              </label>
            ))
          )}
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Commission ledger
        </h2>
        <p className="mt-2 text-sm text-muted">
          Ledger rows are created when orders reach Delivered and move to Eligible after hold period.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/85">
          {ledgerSummary.length === 0 ? (
            <span>No ledger rows yet.</span>
          ) : (
            ledgerSummary.map((s) => (
              <span key={s.status} className="rounded-full border border-line bg-paper px-3 py-1">
                {s.status}: {s._count._all}
              </span>
            ))
          )}
        </div>
        <form action={markAllEligiblePaidAction} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
          >
            Mark all eligible as paid
          </button>
        </form>
        <div className="mt-4 space-y-2 text-sm text-ink/90">
          {recentLedgers.length === 0 ? (
            <p className="text-muted">No recent ledger records.</p>
          ) : (
            recentLedgers.map((l) => (
              <div key={l.id} className="rounded-xl border border-line bg-paper/60 px-3 py-2">
                <p>
                  #{l.order.id.slice(-8)} · {l.affiliate?.user.displayName || l.affiliate?.user.email || l.affiliateId} ·{" "}
                  ${(l.commissionCents / 100).toFixed(2)} · {l.status}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Eligible at {l.eligibleAt.toLocaleDateString()} · Order $
                  {(l.order.totalCents / 100).toFixed(2)}
                  {` · Order status ${l.order.status}`}
                  {l.reversedAt ? ` · Reversed ${l.reversalReason ?? ""}` : ""}
                  {l.paidAt ? ` · Paid ${l.paidAt.toLocaleDateString()}` : ""}
                </p>
                {l.status === "eligible" && !l.paidAt && !l.reversedAt ? (
                  <form action={markLedgerPaidAction} className="mt-2">
                    <input type="hidden" name="ledgerId" value={l.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-lg bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-paper transition hover:bg-ink/90"
                    >
                      Mark paid
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Payout export
        </h2>
        <p className="mt-2 text-sm text-muted">
          Export payout-ready orders: delivered and older than 30 days.
        </p>
        <p className="mt-3">
          <a
            href={`/api/admin/affiliate/payouts/export?mode=eligible&holdDays=30${
              filterQuery.size > 0 ? `&${filterQuery.toString()}` : ""
            }`}
            className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
          >
            Export eligible CSV (30d)
          </a>
        </p>
        <p className="mt-2 flex flex-wrap gap-2">
          <a
            href={`/api/admin/affiliate/payouts/export?mode=paid&holdDays=30${
              filterQuery.size > 0 ? `&${filterQuery.toString()}` : ""
            }`}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
          >
            Export paid CSV
          </a>
          <a
            href={`/api/admin/affiliate/payouts/export?mode=all&holdDays=30${
              filterQuery.size > 0 ? `&${filterQuery.toString()}` : ""
            }`}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
          >
            Export all ledger CSV
          </a>
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Create tier
        </h2>
        <form action={createTierAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Tier name (e.g. Gold)"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <select
            name="commissionType"
            defaultValue="percent"
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input
            name="commissionValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue="10"
            required
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <label className="inline-flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink">
            <span>Default</span>
            <input name="isDefault" type="checkbox" className="h-4 w-4" />
          </label>
          <button
            type="submit"
            className="md:col-span-4 inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
          >
            Add tier
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Pending review
        </h2>
        <div className="mt-3 space-y-3">
          {pendingApps.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No pending applications.
            </p>
          ) : (
            pendingApps.map((a) => {
              const links = asLinks(a.socialLinksJson);
              return (
                <div key={a.id} className="rounded-2xl border border-line bg-white/60 p-4">
                  <p className="text-sm font-medium text-ink">
                    {a.user.displayName || a.user.name || a.user.email || a.user.id}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Followers: {a.followerCount ?? "-"} · Submitted {a.createdAt.toLocaleString()}
                  </p>
                  {a.about ? <p className="mt-2 text-sm text-ink/90">{a.about}</p> : null}
                  {links.length > 0 ? (
                    <p className="mt-2 text-xs text-muted">Links: {links.join(" , ")}</p>
                  ) : null}
                  {a.riskReason ? (
                    <p className="mt-1 text-xs text-amber-800">Risk: {a.riskReason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={approveApplicationAction}>
                      <input type="hidden" name="applicationId" value={a.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectApplicationAction} className="flex gap-2">
                      <input type="hidden" name="applicationId" value={a.id} />
                      <input
                        name="reason"
                        placeholder="Reject reason (optional)"
                        className="rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Active affiliates
        </h2>
        <div className="mt-3 space-y-3">
          {activeProfiles.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No active affiliates yet.
            </p>
          ) : (
            activeProfiles.map((p) => (
              <form
                key={p.id}
                action={updateProfileAction}
                className="grid gap-3 rounded-2xl border border-line bg-white/60 p-4 md:grid-cols-6"
              >
                <input type="hidden" name="profileId" value={p.id} />
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-ink">
                    {p.user.displayName || p.user.name || p.user.email || p.user.id}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Status: {p.status} · Risk flag: {p.riskFlag ? "Yes" : "No"} · PID:{" "}
                    {p.pid ?? "-"}
                  </p>
                </div>
                <select
                  name="tierId"
                  defaultValue={p.tierId ?? ""}
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                >
                  <option value="">No tier</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.commissionType} {t.commissionValue}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink">
                  <span>Whitelist</span>
                  <input name="whitelist" type="checkbox" defaultChecked={p.whitelist} className="h-4 w-4" />
                </label>
                <input
                  name="notes"
                  defaultValue={p.notes ?? ""}
                  placeholder="Internal notes"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="payoutEmail"
                  defaultValue={p.payoutEmail ?? ""}
                  placeholder="Payout email"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="payoutWhatsapp"
                  defaultValue={p.payoutWhatsapp ?? ""}
                  placeholder="WhatsApp number"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
                  >
                    Save
                  </button>
                  <button
                    formAction={toggleBlacklistAction}
                    type="submit"
                    name="nextBlacklisted"
                    value="true"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                  >
                    Blacklist
                  </button>
                </div>
              </form>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Recent attributed orders
        </h2>
        <div className="mt-3 space-y-3">
          {recentAttributedOrders.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No attributed orders yet.
            </p>
          ) : (
            recentAttributedOrders.map((o) => (
              <p key={o.id} className="rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm text-ink/90">
                #{o.id.slice(-8)} · ${(o.totalCents / 100).toFixed(2)} · {o.status} ·{" "}
                {o.affiliate?.user.displayName || o.affiliate?.user.email || o.affiliatePid || "-"}
                {o.affiliateAttribution ? ` · ${o.affiliateAttribution}` : ""}
              </p>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Blacklisted
        </h2>
        <div className="mt-3 space-y-3">
          {blacklistedProfiles.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No blacklisted affiliates.
            </p>
          ) : (
            blacklistedProfiles.map((p) => (
              <div key={p.id} className="rounded-2xl border border-line bg-white/60 p-4">
                <p className="text-sm font-medium text-ink">
                  {p.user.displayName || p.user.name || p.user.email || p.user.id}
                </p>
                <p className="mt-1 text-xs text-muted">Tier: {p.tier?.name ?? "-"}</p>
                <form action={toggleBlacklistAction} className="mt-3">
                  <input type="hidden" name="profileId" value={p.id} />
                  <button
                    type="submit"
                    name="nextBlacklisted"
                    value="false"
                    className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                  >
                    Remove from blacklist
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

