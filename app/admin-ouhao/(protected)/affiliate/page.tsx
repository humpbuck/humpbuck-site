import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { PayoutExportLinks } from "@/components/admin/payout-export-links";
import { RestoreScrollOnFormSubmit } from "@/components/admin/restore-scroll-on-form-submit";
import { SettlementBulkActions } from "@/components/admin/settlement-bulk-actions";
import { SettlementSelectionSummary } from "@/components/admin/settlement-selection-summary";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  ensureAffiliateGrowthTiers,
  syncAffiliateGrowthTierByOrderCount,
} from "@/lib/affiliate-tier-growth";
import { sendAffiliatePaidSummaryEmail } from "@/lib/affiliate-paid-email";
import { prisma } from "@/lib/prisma";

function goAffiliate(error?: string): never {
  if (!error) redirect(adminPath("/affiliate"));
  redirect(`${adminPath("/affiliate")}?error=${encodeURIComponent(error)}`);
}

async function ensureDefaultTierId(): Promise<string> {
  return ensureAffiliateGrowthTiers();
}

function parseCommissionValue(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
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

async function updateTierAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const tierId = String(formData.get("tierId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const commissionType = String(formData.get("commissionType") ?? "percent").trim();
  const commissionValue = parseCommissionValue(formData.get("commissionValue"));
  const makeDefault = String(formData.get("isDefault") ?? "") === "on";

  if (!tierId) goAffiliate("Missing tier id.");
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
    await tx.affiliateTier.update({
      where: { id: tierId },
      data: {
        name,
        commissionType,
        commissionValue,
        isDefault: makeDefault,
      },
    });
  });

  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function deleteTierAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const tierId = String(formData.get("tierId") ?? "").trim();
  if (!tierId) goAffiliate("Missing tier id.");

  await prisma.affiliateTier.delete({
    where: { id: tierId },
  });

  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function updateSelectedLedgersStatusAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const ids = formData
    .getAll("ledgerIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (ids.length === 0) goAffiliate("Please select at least one settlement row.");
  const targetStatus = String(formData.get("targetSettlementStatus") ?? "").trim().toLowerCase();
  if (!["pending", "eligible", "paid", "reversed"].includes(targetStatus)) {
    goAffiliate("Please select a valid target settlement status.");
  }
  const payoutBatchId = String(formData.get("payoutBatchId") ?? "").trim();
  const payoutTxnRef = String(formData.get("payoutTxnRef") ?? "").trim();
  const paidNote = String(formData.get("paidNote") ?? "").trim();

  const selectedRows = await prisma.affiliateCommissionLedger.findMany({
    where: { id: { in: ids }, order: { deletedAt: null } },
    include: {
      affiliate: {
        include: { user: { select: { email: true, displayName: true, name: true } } },
      },
      order: { include: { items: true } },
    },
  });
  if (selectedRows.length === 0) goAffiliate("No matching settlement rows found.");

  const now = new Date();
  for (const row of selectedRows) {
    if (targetStatus === "paid") {
      await prisma.affiliateCommissionLedger.update({
        where: { id: row.id },
        data: {
          status: "paid",
          paidAt: now,
          reversedAt: null,
          reversalReason: null,
          payoutBatchId: payoutBatchId || null,
          payoutTxnRef: payoutTxnRef || null,
          paidNote: paidNote || null,
        },
      });
      continue;
    }

    if (targetStatus === "reversed") {
      await prisma.affiliateCommissionLedger.update({
        where: { id: row.id },
        data: {
          status: "reversed",
          reversedAt: now,
          reversalReason: paidNote || "manual_status_update",
          reversedCommissionCents: row.commissionCents,
          paidAt: null,
        },
      });
      continue;
    }

    await prisma.affiliateCommissionLedger.update({
      where: { id: row.id },
      data: {
        status: targetStatus,
        paidAt: null,
        reversedAt: null,
        reversalReason: null,
      },
    });
  }
  const affectedAffiliateIds = Array.from(new Set(selectedRows.map((row) => row.affiliateId)));
  for (const row of selectedRows) {
    if (row.status !== "eligible" || row.paidAt || row.reversedAt) continue;
    if (!row.affiliate?.user?.email) continue;
    const result = await sendAffiliatePaidSummaryEmail({
      to: row.affiliate.user.email,
      affiliateName: row.affiliate.user.displayName || row.affiliate.user.name || row.affiliate.user.email,
      affiliateLoginUrl: `${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.humpbuck.com"}/account/affiliate`,
      ledgers: [{
        orderId: row.orderId,
        commissionCents: row.commissionCents,
        paidAt: now,
        payoutBatchId: payoutBatchId || null,
        payoutTxnRef: payoutTxnRef || null,
        paidNote: paidNote || null,
        items: row.order.items.map((item) => ({
          productSlug: item.productSlug,
          productName: item.productName,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          qty: item.qty,
        })),
      }],
    });
    if (result.ok) {
      await prisma.affiliateCommissionLedger.update({
        where: { id: row.id },
        data: { paidEmailSentAt: now },
      });
    }
  }
  await Promise.all(affectedAffiliateIds.map((id) => syncAffiliateGrowthTierByOrderCount(id)));
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate"));
}

async function markCouponRequestHandledAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) goAffiliate("Missing coupon request id.");
  await prisma.affiliateCouponRequest.updateMany({
    where: { id: requestId, status: "pending" },
    data: { status: "handled", handledAt: new Date() },
  });
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/affiliate?couponRequests=1"));
}

export default async function AdminAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    couponRequests?: string;
    affiliateId?: string;
    orderStatus?: string;
    settle?: string;
    onlyVerifiedPayout?: string;
    settlePage?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  await assertAdmin();
  await ensureDefaultTierId();
  const sp = await searchParams;
  const selectedAffiliateId = String(sp.affiliateId ?? "").trim();
  const selectedOrderStatus = String(sp.orderStatus ?? "").trim();
  const selectedSettlement = String(sp.settle ?? "").trim() || "eligible";
  const onlyVerifiedPayout = String(sp.onlyVerifiedPayout ?? "").trim() === "1";
  const settlePageRaw = Number.parseInt(String(sp.settlePage ?? "1"), 10);
  const settlePage = Number.isFinite(settlePageRaw) && settlePageRaw > 0 ? settlePageRaw : 1;
  const SETTLEMENT_PAGE_SIZE = 10;
  const settlementWhere = {
    ...(selectedAffiliateId ? { affiliateId: selectedAffiliateId } : {}),
    order: {
      deletedAt: null as Date | null,
      ...(selectedOrderStatus ? { status: selectedOrderStatus } : {}),
    },
    ...(selectedSettlement === "all" ? {} : { status: selectedSettlement }),
    ...(onlyVerifiedPayout ? { affiliate: { payoutVerifiedAt: { not: null } } } : {}),
  };

  const [tiers, pendingApps, profiles, blacklistedCount, settlementRows, settlementTotalCount, couponRequests] =
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
      prisma.affiliateProfile.count({
        where: {
          OR: [{ blacklist: true }, { status: "blacklisted" }],
        },
      }),
      prisma.affiliateCommissionLedger.findMany({
        where: settlementWhere,
        include: {
          affiliate: { include: { user: { select: { email: true, displayName: true } } } },
          order: { select: { id: true, status: true, totalCents: true } },
        },
        orderBy: [{ eligibleAt: "asc" }, { createdAt: "desc" }],
        skip: (settlePage - 1) * SETTLEMENT_PAGE_SIZE,
        take: SETTLEMENT_PAGE_SIZE,
      }),
      prisma.affiliateCommissionLedger.count({
        where: settlementWhere,
      }),
      prisma.affiliateCouponRequest.findMany({
        where: { status: "pending" },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          affiliate: { select: { pid: true } },
        },
        orderBy: { requestedAt: "desc" },
        take: 30,
      }).catch(() => []),
    ]);
  const settlementTotalPages = Math.max(1, Math.ceil(settlementTotalCount / SETTLEMENT_PAGE_SIZE));
  const currentSettlementPage = Math.min(settlePage, settlementTotalPages);

  const autoApprovedCount = profiles.filter((p) => p.applications[0]?.status === "auto_approved").length;
  const growthTierList = [...tiers]
    .filter((t) => t.commissionType === "percent")
    .sort((a, b) => {
      const byValue = a.commissionValue - b.commissionValue;
      if (byValue !== 0) return byValue;
      return a.name.localeCompare(b.name);
    });
  const settlementOrderStatuses = Array.from(
    new Set(settlementRows.map((r) => r.order.status).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const filterQuery = new URLSearchParams();
  if (selectedAffiliateId) filterQuery.set("affiliateId", selectedAffiliateId);
  if (selectedOrderStatus) filterQuery.set("orderStatus", selectedOrderStatus);
  if (selectedSettlement) filterQuery.set("settle", selectedSettlement);
  if (onlyVerifiedPayout) filterQuery.set("onlyVerifiedPayout", "1");

  return (
    <div>
      <RestoreScrollOnFormSubmit
        formIds={["affiliate-settlement-filters-form", "affiliate-settlement-form"]}
        storageKey="admin_affiliate_settlement_scroll_y"
      />
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
        <Link
          href={adminPath("/affiliate/stats?focus=total")}
          className="rounded-2xl border border-line bg-white/60 px-4 py-3 transition hover:border-ink/20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Total affiliates
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{profiles.length}</p>
        </Link>
        <Link
          href={adminPath("/affiliate/stats?focus=auto")}
          className="rounded-2xl border border-line bg-white/60 px-4 py-3 transition hover:border-ink/20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Auto approved
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{autoApprovedCount}</p>
        </Link>
        <Link
          href={adminPath("/affiliate/stats?focus=pending")}
          className="rounded-2xl border border-line bg-white/60 px-4 py-3 transition hover:border-ink/20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Pending review
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{pendingApps.length}</p>
        </Link>
        <Link
          href={adminPath("/affiliate/stats?focus=blacklisted")}
          className="rounded-2xl border border-line bg-white/60 px-4 py-3 transition hover:border-ink/20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Blacklisted
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{blacklistedCount}</p>
        </Link>
      </section>

      <section
        id="coupon-requests"
        className={`mt-6 rounded-2xl border border-line bg-white/60 p-5 ${sp.couponRequests === "1" ? "ring-2 ring-ink/20" : ""} ${couponRequests.length > 0 ? "border-amber-300 bg-amber-50/40" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Coupon code requests
            </h2>
            <p className="mt-2 text-sm text-muted">
              Pending affiliates asking for coupon code binding.
            </p>
          </div>
          {couponRequests.length > 0 ? (
            <div className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900">
              {couponRequests.length} affiliate{couponRequests.length === 1 ? "" : "s"} requested a coupon
            </div>
          ) : null}
        </div>
        {couponRequests.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No pending requests.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {couponRequests.map((req) => {
              const name =
                [req.user.firstName?.trim(), req.user.lastName?.trim()].filter(Boolean).join(" ").trim() ||
                req.user.displayName?.trim() ||
                req.user.email?.trim() ||
                "-";
              return (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm text-ink/90">
                  <div>
                    <p>
                      <span className="font-medium">{name}</span> · PID{" "}
                      <span className="font-medium">{req.affiliate?.pid ?? "-"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {req.user.email ?? "-"} · {req.requestedAt.toLocaleString()}
                    </p>
                  </div>
                  <form action={markCouponRequestHandledAction}>
                    <input type="hidden" name="requestId" value={req.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                    >
                      Mark handled
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Settlement queue
        </h2>
        <p className="mt-2 text-sm text-muted">
          Filter by affiliate and order status, then mark selected eligible orders as paid.
        </p>
        <form
          id="affiliate-settlement-filters-form"
          method="get"
          className="mt-4 grid gap-2 md:grid-cols-4"
        >
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
        <form
          id="affiliate-settlement-form"
          action={updateSelectedLedgersStatusAction}
          className="mt-4 space-y-2 text-sm text-ink/90"
        >
          <div className="grid gap-2 md:grid-cols-3">
            <input
              name="payoutBatchId"
              placeholder="Payout batch ID (optional)"
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
            />
            <input
              name="payoutTxnRef"
              placeholder="Payout transaction ref (optional)"
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
            />
            <input
              name="paidNote"
              placeholder="Paid note (optional)"
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
            />
          </div>
          <div className="hidden">
            <button id="settlement-apply-status-submit" type="submit">
              apply
            </button>
          </div>
          <SettlementSelectionSummary formId="affiliate-settlement-form" />
          <SettlementBulkActions
            formId="affiliate-settlement-form"
            submitButtonId="settlement-apply-status-submit"
          />
          <div className="flex flex-wrap gap-2">
            <input type="hidden" name="affiliateId" value={selectedAffiliateId} />
            <input type="hidden" name="orderStatus" value={selectedOrderStatus} />
            <input type="hidden" name="onlyVerifiedPayout" value={onlyVerifiedPayout ? "true" : ""} />
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
                  data-commission-cents={l.commissionCents}
                  data-order-total-cents={l.order.totalCents}
                  data-order-code={l.order.id.slice(-8)}
                  data-settlement-status={l.status}
                  disabled={Boolean(l.reversedAt)}
                />
                <span>
                  #{l.order.id.slice(-8)} · {l.affiliate?.user.displayName || l.affiliate?.user.email || l.affiliateId} ·
                  Order {l.order.status} · ${(l.commissionCents / 100).toFixed(2)} · Settlement {l.status}
                  {l.paidEmailSentAt ? ` · Paid mail ${l.paidEmailSentAt.toLocaleDateString()}` : ""}
                </span>
              </label>
            ))
          )}
          {settlementTotalCount > SETTLEMENT_PAGE_SIZE ? (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-ink/90">
              {currentSettlementPage > 1 ? (
                <Link
                  href={`${adminPath("/affiliate")}?${(() => {
                    const q = new URLSearchParams(filterQuery);
                    q.set("settlePage", String(currentSettlementPage - 1));
                    return q.toString();
                  })()}`}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 transition hover:border-ink/20"
                >
                  Prev
                </Link>
              ) : (
                <span className="rounded-lg border border-line bg-white px-2.5 py-1 opacity-50">
                  Prev
                </span>
              )}
              <span className="tabular-nums">
                Page {currentSettlementPage} / {settlementTotalPages}
              </span>
              {currentSettlementPage < settlementTotalPages ? (
                <Link
                  href={`${adminPath("/affiliate")}?${(() => {
                    const q = new URLSearchParams(filterQuery);
                    q.set("settlePage", String(currentSettlementPage + 1));
                    return q.toString();
                  })()}`}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 transition hover:border-ink/20"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-lg border border-line bg-white px-2.5 py-1 opacity-50">
                  Next
                </span>
              )}
            </div>
          ) : null}
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Payout export
        </h2>
        <p className="mt-2 text-sm text-muted">
          Export payout-ready orders: delivered and older than 30 days.
        </p>
        <PayoutExportLinks
          baseQuery={filterQuery.toString()}
          initialStartDate={String(sp.startDate ?? "")}
          initialEndDate={String(sp.endDate ?? "")}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Create tier
        </h2>
        <div className="mt-2 rounded-xl border border-line bg-paper/50 p-3">
          <p className="text-xs font-semibold text-ink/85">
            Current growth settings (always sorted low to high)
          </p>
          <div className="mt-2 space-y-2">
            {growthTierList.map((t, idx) => (
              <form
                key={`growth-tier-${t.id}`}
                action={updateTierAction}
                className="grid gap-2 md:grid-cols-[1.1fr_1fr_1fr_1fr_auto_auto] md:items-center"
              >
                <input type="hidden" name="tierId" value={t.id} />
                <input
                  name="name"
                  defaultValue={t.name || `Level ${idx + 1}`}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <select
                  name="commissionType"
                  defaultValue={t.commissionType}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input
                  name="commissionValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={t.commissionValue}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <label className="inline-flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink">
                  <span>Default</span>
                  <input name="isDefault" type="checkbox" defaultChecked={t.isDefault} className="h-4 w-4" />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink transition hover:border-ink/20"
                >
                  Save
                </button>
                <button
                  formAction={deleteTierAction}
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-800 transition hover:bg-rose-100"
                >
                  Delete
                </button>
              </form>
            ))}
          </div>
        </div>
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
            defaultValue="5"
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

    </div>
  );
}

