import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { ClearQueryParam } from "@/components/admin/clear-query-param";
import { PendingActionButton } from "@/components/admin/pending-action-button";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  PHONE_COUNTRY_CODE_DATALIST_ID,
  PHONE_COUNTRY_CODES,
  normalizeCountryCodeInput,
  normalizePhone,
  splitPhoneForInput,
} from "@/lib/phone-normalize";
import {
  sanitizeAffiliatePayoutWhatsappContact,
  stripEmbeddedWhatsAppFromPayoutAccount,
} from "@/lib/affiliate-payout-account";
import { prisma } from "@/lib/prisma";

type Focus = "total" | "auto" | "pending" | "blacklisted";

const GROWTH_MILESTONES = [
  { level: "Level 1", minOrders: 0, rate: 5 },
  { level: "Level 2", minOrders: 100, rate: 7 },
  { level: "Level 3", minOrders: 300, rate: 9 },
  { level: "Level 4", minOrders: 600, rate: 11 },
  { level: "Level 5", minOrders: 1000, rate: 13 },
  { level: "Level 6", minOrders: 1500, rate: 15 },
] as const;

function extractLabeledValue(payload: string | null | undefined, label: string): string {
  const raw = String(payload ?? "");
  const match = raw.match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function goStats(focus: string, ok?: string): never {
  const qs = new URLSearchParams();
  qs.set("focus", focus || "total");
  if (ok) qs.set("ok", ok);
  redirect(`${adminPath("/affiliate/stats")}?${qs.toString()}`);
}

async function updateAffiliateTierAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "").trim();
  const focus = String(formData.get("focus") ?? "total").trim();
  if (!profileId) redirect(adminPath(`/affiliate/stats?focus=${encodeURIComponent(focus || "total")}`));
  await prisma.affiliateProfile
    .update({
      where: { id: profileId },
      data: { tierId: tierId || null },
    })
    .catch(() => null);
  revalidatePath(adminPath("/affiliate"));
  revalidatePath(adminPath("/affiliate/stats"));
  goStats(focus, "level_saved");
}

async function updateAffiliateDetailsAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "").trim();
  const whitelist = String(formData.get("whitelist") ?? "") === "on";
  const notes = String(formData.get("notes") ?? "").trim();
  const payoutMethod = String(formData.get("payoutMethod") ?? "").trim();
  const payoutAccountRaw = String(formData.get("payoutAccount") ?? "").trim();
  const payoutEmail = String(formData.get("payoutEmail") ?? "").trim();
  const whatsappContact = sanitizeAffiliatePayoutWhatsappContact(
    String(formData.get("whatsappContact") ?? "").trim(),
  );
  const whatsappRaw = String(formData.get("whatsapp") ?? "").trim();
  const whatsappLocal = String(formData.get("whatsappLocal") ?? "");
  const whatsappCountryInput = normalizeCountryCodeInput(
    String(formData.get("whatsappCountryCode") ?? ""),
  );
  const focus = String(formData.get("focus") ?? "total").trim();
  if (!profileId) redirect(adminPath(`/affiliate/stats?focus=${encodeURIComponent(focus || "total")}`));

  const existing = await prisma.affiliateProfile.findUnique({
    where: { id: profileId },
    select: {
      payoutMethod: true,
      payoutAccount: true,
      payoutEmail: true,
      whatsapp: true,
    },
  });
  const existingWhatsappCountryCode = splitPhoneForInput(existing?.whatsapp).countryCode;
  const whatsapp =
    normalizePhone(whatsappCountryInput || existingWhatsappCountryCode || "+1", whatsappLocal) ||
    whatsappRaw;
  const payoutChanged =
    (existing?.payoutMethod ?? "") !== payoutMethod ||
    (existing?.payoutAccount ?? "") !== payoutAccountRaw ||
    (existing?.payoutEmail ?? "") !== payoutEmail ||
    (existing?.whatsapp ?? "") !== whatsapp;
  const payoutAccount = stripEmbeddedWhatsAppFromPayoutAccount(payoutAccountRaw);

  await prisma.affiliateProfile.update({
    where: { id: profileId },
    data: {
      tierId: tierId || null,
      whitelist,
      notes: notes || null,
      payoutMethod: payoutMethod || null,
      payoutAccount: payoutAccount || null,
      payoutEmail: payoutEmail || null,
      whatsapp: whatsapp || null,
      paymentInfoPending: !(payoutMethod || payoutAccount || payoutEmail || whatsapp),
      ...(payoutChanged ? { payoutVerifiedAt: null, payoutVerifiedBy: null } : {}),
    },
  });
  revalidatePath(adminPath("/affiliate"));
  revalidatePath(adminPath("/affiliate/stats"));
  goStats(focus, "profile_saved");
}

async function toggleBlacklistAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const focus = String(formData.get("focus") ?? "total").trim();
  if (!profileId) redirect(adminPath(`/affiliate/stats?focus=${encodeURIComponent(focus || "total")}`));
  const current = await prisma.affiliateProfile.findUnique({
    where: { id: profileId },
    select: { blacklist: true, status: true },
  });
  const currentlyBlacklisted = Boolean(current?.blacklist || current?.status === "blacklisted");
  const nextBlacklisted = !currentlyBlacklisted;
  await prisma.affiliateProfile.update({
    where: { id: profileId },
    data: {
      blacklist: nextBlacklisted,
      status: nextBlacklisted ? "blacklisted" : "active",
      riskFlag: nextBlacklisted,
    },
  });
  revalidatePath(adminPath("/affiliate"));
  revalidatePath(adminPath("/affiliate/stats"));
  goStats(focus, "blacklist_updated");
}

export default async function AffiliateStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; ok?: string }>;
}) {
  await assertAdmin();
  const sp = await searchParams;
  const focusRaw = String(sp.focus ?? "").trim();
  const focus: Focus =
    focusRaw === "auto" || focusRaw === "pending" || focusRaw === "blacklisted" ? focusRaw : "total";

  const [profiles, pendingApps, tiers, paidOrderCounts] = await Promise.all([
    prisma.affiliateProfile.findMany({
      include: {
        user: true,
        tier: true,
        coupons: {
          where: { isActive: true },
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: { code: true },
        },
        applications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.affiliateApplication.findMany({
      where: { status: "pending" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliateTier.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true, commissionType: true, commissionValue: true },
    }),
    prisma.affiliateCommissionLedger.groupBy({
      by: ["affiliateId"],
      where: {
        order: { deletedAt: null },
        status: "paid",
        paidAt: { not: null },
      },
      _count: { _all: true },
    }),
  ]);
  const paidCountMap = new Map(paidOrderCounts.map((row) => [row.affiliateId, row._count._all]));

  const blacklistedProfiles = profiles.filter((p) => p.blacklist || p.status === "blacklisted");
  const autoApprovedProfiles = profiles.filter((p) => p.applications[0]?.status === "auto_approved");

  const title =
    focus === "total"
      ? "All affiliates"
      : focus === "auto"
        ? "Auto approved affiliates"
        : focus === "pending"
          ? "Pending review"
          : "Blacklisted affiliates";
  const list =
    focus === "blacklisted"
      ? blacklistedProfiles
      : focus === "auto"
        ? autoApprovedProfiles
        : profiles;
  const emptyMessage =
    focus === "blacklisted"
      ? "No blacklisted affiliates."
      : focus === "auto"
        ? "No auto approved affiliates."
        : "No affiliates found.";

  return (
    <div>
      <AdminBackLink href={adminPath("/affiliate")} label="Affiliate" />
      <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">View details for this affiliate category.</p>
      {sp.ok ? (
        <>
          <ClearQueryParam param="ok" />
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
            {sp.ok === "level_saved"
              ? "Level saved successfully."
              : sp.ok === "profile_saved"
                ? "Affiliate info saved successfully."
                : "Blacklist status updated successfully."}
          </p>
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className={`rounded-xl border px-3 py-1.5 text-xs transition hover:border-ink/20 ${
            focus === "total" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
          }`}
          href={adminPath("/affiliate/stats?focus=total")}
        >
          Total
        </Link>
        <Link
          className={`rounded-xl border px-3 py-1.5 text-xs transition hover:border-ink/20 ${
            focus === "auto" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
          }`}
          href={adminPath("/affiliate/stats?focus=auto")}
        >
          Auto approved
        </Link>
        <Link
          className={`rounded-xl border px-3 py-1.5 text-xs transition hover:border-ink/20 ${
            focus === "pending" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
          }`}
          href={adminPath("/affiliate/stats?focus=pending")}
        >
          Pending review
        </Link>
        <Link
          className={`rounded-xl border px-3 py-1.5 text-xs transition hover:border-ink/20 ${
            focus === "blacklisted" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
          }`}
          href={adminPath("/affiliate/stats?focus=blacklisted")}
        >
          Blacklisted
        </Link>
      </div>

      <section className="mt-6 space-y-2">
        {focus === "pending" ? (
          pendingApps.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
              No pending applications.
            </p>
          ) : (
            pendingApps.map((a) => (
              <div key={a.id} className="rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm">
                <p className="font-medium text-ink">{a.user.displayName || a.user.name || a.user.email || a.user.id}</p>
                <p className="mt-1 text-xs text-muted">
                  Followers: {a.followerCount ?? "-"} · Submitted {a.createdAt.toLocaleString()}
                </p>
              </div>
            ))
          )
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
            {emptyMessage}
          </p>
        ) : (
          list.map((p) => (
            <form
              key={p.id}
              action={updateAffiliateDetailsAction}
              className="rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm"
            >
              {(() => {
                const paidOrders = paidCountMap.get(p.id) ?? 0;
                const currentGrowthTier =
                  [...GROWTH_MILESTONES]
                    .reverse()
                    .find((m) => paidOrders >= m.minOrders) ?? GROWTH_MILESTONES[0];
                const currentTierIndex = GROWTH_MILESTONES.findIndex(
                  (m) => m.level === currentGrowthTier.level,
                );
                const nextGrowthTier =
                  currentTierIndex >= 0 && currentTierIndex < GROWTH_MILESTONES.length - 1
                    ? GROWTH_MILESTONES[currentTierIndex + 1]
                    : null;
                const ordersToNext = nextGrowthTier
                  ? Math.max(0, nextGrowthTier.minOrders - paidOrders)
                  : 0;
                const currentTierFloor = currentGrowthTier.minOrders;
                const nextTierFloor = nextGrowthTier?.minOrders ?? currentTierFloor;
                const progressInTier = Math.max(0, paidOrders - currentTierFloor);
                const progressSpan = nextGrowthTier
                  ? Math.max(1, nextTierFloor - currentTierFloor)
                  : 1;
                const growthProgressPercent = nextGrowthTier
                  ? Math.min(100, Math.round((progressInTier / progressSpan) * 100))
                  : 100;
                return (
                  <div className="grid gap-3 md:grid-cols-[1.2fr_auto_220px] md:items-start">
                    <div>
                      <p className="font-medium text-ink">{p.user.displayName || p.user.name || p.user.email || p.user.id}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span>Status: {p.status}</span>
                        <span>PID: {p.pid ?? "-"}</span>
                        <span>Current level: {p.tier?.name ?? "-"}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink/80">
                        Growth: {currentGrowthTier.level} ({currentGrowthTier.rate}%) · Valid paid orders:{" "}
                        {paidOrders}
                        {nextGrowthTier
                          ? ` · Next ${nextGrowthTier.level} (${nextGrowthTier.rate}%) in ${ordersToNext} orders`
                          : " · Highest level reached"}
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-paper">
                        <div
                          className="h-2 rounded-full bg-ink transition-all"
                          style={{ width: `${growthProgressPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Progress in current tier range: {growthProgressPercent}%.
                        {nextGrowthTier
                          ? ` You need ${ordersToNext} more orders to unlock ${nextGrowthTier.rate}% commission.`
                          : " Highest commission tier reached."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <select
                        name="tierId"
                        defaultValue={p.tierId ?? ""}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
                      >
                        <option value="">No tier</option>
                        {tiers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} · {t.commissionType} {t.commissionValue}
                          </option>
                        ))}
                      </select>
                      <PendingActionButton
                        formAction={updateAffiliateTierAction}
                        idleLabel="Save level"
                        pendingLabel="Saving..."
                        className="rounded-lg bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition hover:bg-ink/90"
                        pendingClassName="cursor-not-allowed bg-ink/70"
                      />
                    </div>
                    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                        Coupon code
                      </p>
                      <p className="mt-1 font-medium">
                        {p.coupons[0]?.code?.trim() || "No coupon code for now."}
                      </p>
                    </div>
                  </div>
                );
              })()}
              <input type="hidden" name="profileId" value={p.id} />
              <input type="hidden" name="focus" value={focus} />
              <div className="mt-2 grid gap-2 md:grid-cols-4">
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
                  name="payoutMethod"
                  defaultValue={p.payoutMethod ?? ""}
                  placeholder="Payout method (paypal/bank/wise...)"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="payoutAccount"
                  defaultValue={stripEmbeddedWhatsAppFromPayoutAccount(p.payoutAccount ?? "")}
                  placeholder="Payout account"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_120px_1fr]">
                <input
                  name="payoutEmail"
                  defaultValue={p.payoutEmail ?? ""}
                  placeholder="Payout email"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="whatsappCountryCode"
                  defaultValue={splitPhoneForInput(p.whatsapp).countryCode}
                  list={PHONE_COUNTRY_CODE_DATALIST_ID}
                  inputMode="tel"
                  placeholder="+1"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
                <input
                  name="whatsappLocal"
                  defaultValue={splitPhoneForInput(p.whatsapp).localNumber}
                  inputMode="numeric"
                  placeholder="Telephone number"
                  className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
                />
              </div>
              <div className="mt-2 w-full md:max-w-[560px] rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus-within:ring-2">
                <span className="font-medium text-ink/90">WhatsApp: </span>
                <input
                  name="whatsappContact"
                  defaultValue={
                    p.whatsapp ||
                    sanitizeAffiliatePayoutWhatsappContact(
                      extractLabeledValue(p.payoutAccount, "WhatsApp"),
                    )
                  }
                  placeholder="+86 180 2429 0526"
                  className="w-[calc(100%-88px)] border-0 bg-transparent p-0 text-sm text-ink outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <PendingActionButton
                  idleLabel="Save affiliate info"
                  pendingLabel="Saving..."
                  className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
                  pendingClassName="cursor-not-allowed bg-ink/70"
                />
                <button
                  formAction={toggleBlacklistAction}
                  type="submit"
                  name="nextBlacklisted"
                  value={p.blacklist || p.status === "blacklisted" ? "false" : "true"}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100"
                >
                  {p.blacklist || p.status === "blacklisted" ? "Remove blacklist" : "Blacklist"}
                </button>
              </div>
              <datalist id={PHONE_COUNTRY_CODE_DATALIST_ID}>
                {PHONE_COUNTRY_CODES.map((code) => (
                  <option key={code} value={code} />
                ))}
              </datalist>
              <input name="whatsapp" defaultValue={p.whatsapp ?? ""} hidden readOnly />
            </form>
          ))
        )}
      </section>
    </div>
  );
}
