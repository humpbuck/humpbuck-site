import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  buildAffiliatePidSeed,
  evaluateAffiliateRisk,
  parseAffiliateFollowerCount,
  parseAffiliateSocialLinks,
} from "@/lib/affiliate";
import { AffiliateQuickGuide } from "@/components/account/affiliate-quick-guide";
import { AffiliateLinkGenerator } from "@/components/account/affiliate-link-generator";
import { prisma } from "@/lib/prisma";

function goAffiliate(error?: string): never {
  if (!error) redirect("/account/affiliate");
  redirect(`/account/affiliate?error=${encodeURIComponent(error)}`);
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

async function submitAffiliateApplicationAction(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");

  const socialLinks = parseAffiliateSocialLinks(
    String(formData.get("socialLinks") ?? ""),
  );
  const followerCount = parseAffiliateFollowerCount(
    String(formData.get("followerCount") ?? ""),
  );
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactWhatsapp = String(formData.get("contactWhatsapp") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();

  if (!about || about.length < 20) {
    goAffiliate("Please enter at least 20 characters in your promotion plan.");
  }
  if (socialLinks.length === 0) {
    goAffiliate("At least one social media link is required.");
  }

  const existingProfile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      blacklist: true,
      tierId: true,
      pid: true,
      payoutEmail: true,
      payoutWhatsapp: true,
    },
  });
  const risk = evaluateAffiliateRisk({
    followerCount,
    socialLinks,
    isBlacklisted: Boolean(existingProfile?.blacklist),
  });
  const defaultTierId = await ensureDefaultTierId();
  const payoutEmail = contactEmail || existingProfile?.payoutEmail || null;
  const payoutWhatsapp = contactWhatsapp || existingProfile?.payoutWhatsapp || null;
  const paymentInfoPending = !(payoutEmail || payoutWhatsapp);
  const pid = await ensureUniqueAffiliatePid({
    userId,
    email: session?.user?.email,
    currentPid: existingProfile?.pid ?? null,
  });

  const profile = await prisma.affiliateProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName:
        session?.user?.name?.trim() ||
        session?.user?.email?.split("@")[0]?.trim() ||
        null,
      status: risk.highRisk ? "pending" : "active",
      riskFlag: risk.highRisk,
      blacklist: Boolean(existingProfile?.blacklist),
      tierId: risk.highRisk ? null : defaultTierId,
      pid,
      payoutEmail,
      payoutWhatsapp,
      paymentInfoPending,
    },
    update: existingProfile?.blacklist
      ? {
          status: "blacklisted",
          riskFlag: true,
          blacklist: true,
          payoutEmail,
          payoutWhatsapp,
          paymentInfoPending,
        }
      : risk.highRisk
        ? {
            status: "pending",
            riskFlag: true,
            payoutEmail,
            payoutWhatsapp,
            paymentInfoPending,
          }
        : {
            status: "active",
            riskFlag: false,
            tierId: existingProfile?.tierId ?? defaultTierId,
            pid,
            payoutEmail,
            payoutWhatsapp,
            paymentInfoPending,
          },
    select: { id: true },
  });

  await prisma.affiliateApplication.create({
    data: {
      userId,
      affiliateId: profile.id,
      socialLinksJson: JSON.stringify(socialLinks),
      followerCount,
      about,
      status: existingProfile?.blacklist
        ? "pending"
        : risk.highRisk
          ? "pending"
          : "auto_approved",
      riskReason: risk.reason,
      reviewedBy: risk.highRisk ? null : "system:auto",
      reviewedAt: risk.highRisk ? null : new Date(),
    },
  });

  revalidatePath("/account/affiliate");
  redirect(
    risk.highRisk
      ? "/account/affiliate?ok=pending"
      : "/account/affiliate?ok=approved",
  );
}

async function updatePayoutDetailsAction(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");

  const payoutMethod = String(formData.get("payoutMethod") ?? "").trim();
  const payoutAccount = String(formData.get("payoutAccount") ?? "").trim();
  const payoutEmail = String(formData.get("payoutEmail") ?? "").trim();
  const payoutWhatsapp = String(formData.get("payoutWhatsapp") ?? "").trim();

  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    goAffiliate("Please submit affiliate application first.");
  }

  await prisma.affiliateProfile.update({
    where: { userId },
    data: {
      payoutMethod: payoutMethod || null,
      payoutAccount: payoutAccount || null,
      payoutEmail: payoutEmail || null,
      payoutWhatsapp: payoutWhatsapp || null,
      paymentInfoPending: !(payoutMethod || payoutAccount || payoutEmail || payoutWhatsapp),
      payoutVerifiedAt: null,
      payoutVerifiedBy: null,
    },
  });

  revalidatePath("/account/affiliate");
  redirect("/account/affiliate?ok=payout_saved");
}

function humanizeStatus(status: string): string {
  if (status === "auto_approved") return "Auto approved";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending review";
  return status;
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AccountAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    editProfile?: string;
    editPayout?: string;
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");

  const sp = await searchParams;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [profile, latestApplication, commissionLedgers, monthlyPaid, coupon] = await Promise.all([
    prisma.affiliateProfile.findUnique({
      where: { userId },
      include: { tier: true },
    }),
    prisma.affiliateApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliateCommissionLedger.findMany({
      where: {
        affiliate: { userId },
      },
      include: {
        order: {
          select: {
            id: true,
            totalCents: true,
            status: true,
            affiliateAttribution: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.affiliateCommissionLedger.aggregate({
      where: {
        affiliate: { userId },
        status: "paid",
        paidAt: { gte: monthStart },
      },
      _sum: { commissionCents: true },
    }),
    prisma.coupon.findFirst({
      where: { affiliate: { userId }, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    }),
  ]);
  const isActiveAffiliate = profile?.status === "active";
  const showApplicationForm = !isActiveAffiliate || sp.editProfile === "1";
  const showPayoutEditor = !profile || sp.editPayout === "1";
  const earnedThisMonthCents = monthlyPaid._sum.commissionCents ?? 0;
  const recentReferrals = commissionLedgers.slice(0, 3);

  const links = (() => {
    try {
      return latestApplication?.socialLinksJson
        ? (JSON.parse(latestApplication.socialLinksJson) as string[])
        : [];
    } catch {
      return [] as string[];
    }
  })();

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Affiliate
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        Hi, {profile?.displayName || session?.user?.name || session?.user?.email?.split("@")[0] || "Partner"}!
      </h1>
      <p className="mt-4 text-sm text-muted">
        Keep your affiliate tools and payout settings up to date.
      </p>
      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#EEEEEE] bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Earned this month
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {usd(earnedThisMonthCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EEEEEE] bg-white/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Current status
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {profile ? humanizeStatus(profile.status) : "Not applied"}
          </p>
        </div>
      </section>

      {sp.error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {sp.error}
        </p>
      ) : null}
      {sp.ok ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {sp.ok === "pending"
            ? "Application submitted. Your profile is pending manual review."
            : sp.ok === "payout_saved"
              ? "Payout details saved. Admin will use this for commission settlement."
            : "Application submitted and auto-approved. Please complete payout details in the next phase."}
        </p>
      ) : null}

      {profile ? <AffiliateQuickGuide /> : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Your tools
            </h2>
            {isActiveAffiliate ? (
              <Link
                href="/account/affiliate?editProfile=1"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
              >
                Update partner info
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-paper/70 px-3 py-3 text-sm text-ink/90">
              <p>
                PID: <span className="font-medium">{profile.pid ?? "-"}</span>
              </p>
              <p className="mt-1">
                Tier: <span className="font-medium">{profile.tier?.name ?? "-"}</span>
              </p>
              <p className="mt-1">
                Status: <span className="font-medium">{humanizeStatus(profile.status)}</span>
              </p>
              <p className="mt-1">
                Coupon code: <span className="font-medium">{coupon?.code ?? "Contact admin to bind"}</span>
              </p>
            </div>
            <div className="rounded-xl border border-line bg-paper/70 px-3 py-3">
              {profile.pid ? (
                <AffiliateLinkGenerator
                  pid={profile.pid}
                  siteBaseUrl={
                    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://humpbuck.com"
                  }
                />
              ) : (
                <p className="text-sm text-muted">PID will be available after approval.</p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://humpbuck.com"}/wholesale`}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              Brand assets
            </a>
          </div>
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Account settings
          </h2>
          {profile.paymentInfoPending ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Missing payout details. Please add your payout method and at least one contact method.
              If no payout account is available now, keep your email or WhatsApp updated and admin will
              contact you for manual settlement.
            </p>
          ) : sp.ok === "payout_saved" ? (
            <p className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              Payout details submitted. Waiting for admin confirmation before payout processing.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Payout details confirmed by admin. Keep them up to date for future settlements.
            </p>
          )}
          {showPayoutEditor ? (
            <form action={updatePayoutDetailsAction} className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                name="payoutMethod"
                defaultValue={profile.payoutMethod ?? ""}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              >
                <option value="">Select payout method</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank account</option>
                <option value="wise">Wise</option>
                <option value="payoneer">Payoneer</option>
                <option value="other">Other</option>
              </select>
              <input
                name="payoutAccount"
                defaultValue={profile.payoutAccount ?? ""}
                placeholder="Payout account (e.g. PayPal email / bank account)"
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                name="payoutEmail"
                defaultValue={profile.payoutEmail ?? ""}
                placeholder="Contact email for settlement"
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                name="payoutWhatsapp"
                defaultValue={profile.payoutWhatsapp ?? ""}
                placeholder="WhatsApp for settlement"
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
                >
                  Save payout details
                </button>
                <Link
                  href="/account/affiliate"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-3 rounded-xl border border-line bg-paper/70 px-3 py-3 text-sm text-ink/90">
              <p>Method: <span className="font-medium">{profile.payoutMethod || "-"}</span></p>
              <p className="mt-1">Account: <span className="font-medium">{profile.payoutAccount || "-"}</span></p>
              <p className="mt-1">Email: <span className="font-medium">{profile.payoutEmail || "-"}</span></p>
              <p className="mt-1">WhatsApp: <span className="font-medium">{profile.payoutWhatsapp || "-"}</span></p>
              <p className="mt-1">
                Verification:{" "}
                <span className="font-medium">
                  {profile.payoutVerifiedAt ? `Confirmed (${profile.payoutVerifiedAt.toLocaleDateString()})` : "Pending admin confirmation"}
                </span>
              </p>
              <div className="mt-3">
                <Link
                  href="/account/affiliate?editPayout=1"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                >
                  Edit
                </Link>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {showApplicationForm ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Update partner info
          </h2>
          <form action={submitAffiliateApplicationAction} className="mt-4 space-y-3">
          <textarea
            name="socialLinks"
            required
            rows={3}
            placeholder="Social links (one per line): https://instagram.com/..., https://tiktok.com/@..."
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="followerCount"
            type="number"
            min="0"
            step="1"
            placeholder="Follower count (e.g. 12000)"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <textarea
            name="about"
            required
            minLength={20}
            rows={4}
            placeholder="How do you plan to promote Humpbuck? (minimum 20 characters)"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Email
            </span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={profile?.payoutEmail ?? session?.user?.email?.trim() ?? ""}
              placeholder="Settlement contact email (optional)"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              WhatsApp
            </span>
            <input
              name="contactWhatsapp"
              defaultValue={profile?.payoutWhatsapp ?? ""}
              placeholder="Settlement WhatsApp (optional)"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
            />
          </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
              >
                Submit
              </button>
              {isActiveAffiliate ? (
                <Link
                  href="/account/affiliate"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
                >
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {latestApplication && showApplicationForm ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Latest application
          </h2>
          <p className="mt-3 text-sm text-ink/90">
            Status:{" "}
            <span className="font-medium">{humanizeStatus(latestApplication.status)}</span>
          </p>
          {latestApplication.riskReason ? (
            <p className="mt-1 text-sm text-muted">
              Risk note: {latestApplication.riskReason}
            </p>
          ) : null}
          {links.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              Links: {links.join(" , ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {recentReferrals.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Recent referrals
          </h2>
          <p className="mt-2 text-xs text-muted">
            Read-only view. Order status and settlement status can only be updated by admin.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm text-ink/90">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Order status</th>
                  <th className="px-2 py-2">Settlement</th>
                  <th className="px-2 py-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {recentReferrals.map((l) => (
                  <tr key={l.id} className="border-b border-line/60">
                    <td className="px-2 py-2">#{l.order.id.slice(-8)}</td>
                    <td className="px-2 py-2">{l.order.status}</td>
                    <td className="px-2 py-2">
                      {l.status}
                      {l.paidAt ? ` · ${l.paidAt.toLocaleDateString()}` : ""}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{usd(l.commissionCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

