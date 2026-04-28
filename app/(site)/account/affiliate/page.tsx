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
import {
  countAffiliatePaidCommissionOrders,
  ensureAffiliateGrowthTiers,
  syncAffiliateGrowthTierByOrderCount,
} from "@/lib/affiliate-tier-growth";
import { AffiliateQuickGuide } from "@/components/account/affiliate-quick-guide";
import { AffiliateLinkGenerator } from "@/components/account/affiliate-link-generator";
import { AffiliateCouponRequestedModal } from "@/components/account/affiliate-coupon-requested-modal";
import { AffiliatePayoutDetailsForm } from "@/components/account/affiliate-payout-details-form";
import { AffiliateLiveRefresh } from "@/components/account/affiliate-live-refresh";
import { PaidCommissionSelector } from "@/components/account/paid-commission-selector";
import { RestoreScrollOnce } from "@/components/account/restore-scroll-once";
import { ClearQueryParam } from "@/components/admin/clear-query-param";
import {
  sanitizeAffiliatePayoutWhatsappContact,
  stripEmbeddedWhatsAppFromPayoutAccount,
} from "@/lib/affiliate-payout-account";
import {
  PHONE_COUNTRY_CODE_DATALIST_ID,
  PHONE_COUNTRY_CODES,
  normalizeCountryCodeInput,
  normalizePhone,
  splitPhoneForInput,
} from "@/lib/phone-normalize";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { prisma } from "@/lib/prisma";

function goAffiliate(error?: string): never {
  if (!error) redirect("/account/affiliate");
  redirect(`/account/affiliate?error=${encodeURIComponent(error)}`);
}

async function ensureDefaultTierId(): Promise<string> {
  return ensureAffiliateGrowthTiers();
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
  const contactWhatsappLocal = String(formData.get("contactWhatsappLocal") ?? "");
  const contactWhatsappCountryInput = normalizeCountryCodeInput(
    String(formData.get("contactWhatsappCountryCode") ?? ""),
  );
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
      whatsapp: true,
    },
  });
  const risk = evaluateAffiliateRisk({
    followerCount,
    socialLinks,
    isBlacklisted: Boolean(existingProfile?.blacklist),
  });
  const defaultTierId = await ensureDefaultTierId();
  const existingWhatsappCountryCode = splitPhoneForInput(existingProfile?.whatsapp).countryCode;
  const contactWhatsapp = normalizePhone(
    contactWhatsappCountryInput || existingWhatsappCountryCode || "+1",
    contactWhatsappLocal,
  );
  const payoutEmail = contactEmail || existingProfile?.payoutEmail || null;
  const whatsapp = contactWhatsapp || existingProfile?.whatsapp || null;
  const paymentInfoPending = !(payoutEmail || whatsapp);
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
      whatsapp,
      paymentInfoPending,
    },
    update: existingProfile?.blacklist
      ? {
          status: "blacklisted",
          riskFlag: true,
          blacklist: true,
          payoutEmail,
          whatsapp,
          paymentInfoPending,
        }
      : risk.highRisk
        ? {
            status: "pending",
            riskFlag: true,
            payoutEmail,
            whatsapp,
            paymentInfoPending,
          }
        : {
            status: "active",
            riskFlag: false,
            tierId: existingProfile?.tierId ?? defaultTierId,
            pid,
            payoutEmail,
            whatsapp,
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
  const payoutAccount = stripEmbeddedWhatsAppFromPayoutAccount(
    String(formData.get("payoutAccount") ?? "").trim(),
  );
  const payoutEmail = String(formData.get("payoutEmail") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp") ?? "").trim();
  const whatsappLocal = String(formData.get("whatsappLocal") ?? "");
  const whatsappContact = sanitizeAffiliatePayoutWhatsappContact(
    String(formData.get("whatsappContact") ?? "").trim(),
  );
  const whatsappCountryInput = normalizeCountryCodeInput(
    String(formData.get("whatsappCountryCode") ?? ""),
  );
  const payoutRealName = String(formData.get("payoutRealName") ?? "").trim();
  const payoutBankTransferScope = String(formData.get("payoutBankTransferScope") ?? "").trim();
  if (payoutMethod && payoutMethod !== "other" && !payoutAccount) {
    goAffiliate("Please fill in payout account details for the selected method.");
  }
  if ((payoutMethod === "alipay" || payoutMethod === "bank") && !payoutRealName) {
    goAffiliate("Real name is required for Alipay or bank transfer payout.");
  }
  if ((payoutMethod === "wise" || payoutMethod === "payoneer") && !payoutAccount.includes("Recipient name:")) {
    goAffiliate("Recipient name is required for Wise or Payoneer payout verification.");
  }
  if (payoutMethod === "bank" && payoutBankTransferScope === "international") {
    if (!payoutAccount.includes("SWIFT/BIC:")) {
      goAffiliate("Please provide SWIFT/BIC for international bank transfer.");
    }
    if (!payoutAccount.includes("Bank address:")) {
      goAffiliate("Please provide bank address for international bank transfer.");
    }
  }
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: { id: true, whatsapp: true },
  });
  if (!profile) {
    goAffiliate("Please submit affiliate application first.");
  }
  const existingWhatsappCountryCode = splitPhoneForInput(profile.whatsapp).countryCode;
  const countryForPhone = whatsappCountryInput || existingWhatsappCountryCode || "+1";
  const fromPhone = normalizePhone(countryForPhone, whatsappLocal);
  const splitContact = splitPhoneForInput(whatsappContact);
  const fromContact =
    whatsappContact && splitContact.localNumber
      ? normalizePhone(splitContact.countryCode || countryForPhone, splitContact.localNumber)
      : "";
  const whatsapp = fromPhone || fromContact || whatsappRaw;
  if (payoutMethod === "other" && !(payoutEmail || whatsapp)) {
    goAffiliate("Please provide email or WhatsApp so we can confirm your payout method.");
  }

  await prisma.affiliateProfile.update({
    where: { userId },
    data: {
      payoutMethod: payoutMethod || null,
      payoutAccount: payoutAccount || null,
      payoutEmail: payoutEmail || null,
      whatsapp: whatsapp || null,
      paymentInfoPending: !(payoutAccount || payoutEmail || whatsapp),
      payoutVerifiedAt: null,
      payoutVerifiedBy: null,
    },
  });

  revalidatePath("/account/affiliate");
  redirect("/account/affiliate?ok=payout_saved#account-settings");
}

async function requestAffiliateCouponCodeAction() {
  "use server";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");

  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
        },
      },
    },
  });
  if (!profile) {
    goAffiliate("Please submit affiliate application first.");
  }
  if (profile.status !== "active") {
    goAffiliate("Coupon code can be requested after your affiliate account is active.");
  }

  const fullName = [profile.user.firstName?.trim(), profile.user.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const requestor =
    fullName || profile.displayName?.trim() || profile.user.displayName?.trim() || profile.user.email?.trim() || "Affiliate partner";
  const requestEmail = profile.user.email?.trim() || "-";
  const supportFrom = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  const existingPending = await prisma.affiliateCouponRequest
    .findFirst({
      where: { userId, status: "pending" },
      select: { id: true },
    })
    .catch(() => null);
  if (!existingPending) {
    await prisma.affiliateCouponRequest
      .create({
        data: {
          userId,
          affiliateId: profile.id,
          status: "pending",
        },
      })
      .catch(() => null);
  }

  const mail = await sendTransactionalEmail({
    to: notifyTo,
    subject: "Affiliate apply for coupon code",
    htmlContent: `
      <p>Hello,</p>
      <p>An affiliate partner requested a coupon code.</p>
      <ul>
        <li><strong>Name:</strong> ${requestor}</li>
        <li><strong>PID:</strong> ${profile.pid ?? "-"}</li>
        <li><strong>User email:</strong> ${requestEmail}</li>
        <li><strong>Requested from:</strong> ${supportFrom}</li>
      </ul>
      <p>Please create and bind the coupon code in admin panel.</p>
    `,
    textContent: `Affiliate coupon request\nName: ${requestor}\nPID: ${profile.pid ?? "-"}\nUser email: ${requestEmail}\nRequested from: ${supportFrom}\nPlease create and bind coupon in admin panel.`,
  });

  if (!mail.ok) {
    goAffiliate("Failed to submit coupon request email. Please try again.");
  }

  revalidatePath("/account/affiliate");
  redirect(`/account/affiliate?ok=coupon_requested&rid=${Date.now()}`);
}

function humanizeStatus(status: string): string {
  if (status === "auto_approved") return "Auto approved";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending review";
  return status;
}

function humanizePayoutMethod(method: string | null | undefined): string {
  if (!method) return "-";
  if (method === "paypal") return "PayPal";
  if (method === "alipay") return "Alipay";
  if (method === "bank") return "Bank account";
  if (method === "wise") return "Wise";
  if (method === "payoneer") return "Payoneer";
  if (method === "other") return "Other";
  return method;
}

function maskSensitiveValue(value: string): string {
  const raw = value.trim();
  if (!raw) return raw;
  const emailMatch = raw.match(/^([^@\s]+)@(.+)$/);
  if (emailMatch) {
    const local = emailMatch[1];
    const domain = emailMatch[2];
    if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 8) {
    const maskedDigits = `${digits.slice(0, 3)}****${digits.slice(-3)}`;
    return raw.replace(digits, maskedDigits);
  }
  if (raw.length <= 4) return `${raw[0] ?? "*"}***`;
  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

function maskPayoutAccountForDisplay(account: string): string {
  if (!account.trim()) return "-";
  const lines = account.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1 && !account.includes(":")) {
    return maskSensitiveValue(account);
  }
  return lines
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx < 0) return maskSensitiveValue(line);
      const label = line.slice(0, idx + 1);
      const value = line.slice(idx + 1).trim();
      if (!value) return line;
      return `${label} ${maskSensitiveValue(value)}`;
    })
    .join("\n");
}

function extractLabeledValue(payload: string | null | undefined, label: string): string {
  const raw = String(payload ?? "");
  const match = raw.match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const GROWTH_MILESTONES = [
  { level: "Level 1", minOrders: 0, rate: 5 },
  { level: "Level 2", minOrders: 100, rate: 7 },
  { level: "Level 3", minOrders: 300, rate: 9 },
  { level: "Level 4", minOrders: 600, rate: 11 },
  { level: "Level 5", minOrders: 1000, rate: 13 },
  { level: "Level 6", minOrders: 1500, rate: 15 },
] as const;

export default async function AccountAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    rid?: string;
    error?: string;
    editProfile?: string;
    editPayout?: string;
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");
  await ensureAffiliateGrowthTiers();

  const sp = await searchParams;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [profile, latestApplication, commissionLedgers, monthlyPaid, totalPaid, coupon, paidLedgers] = await Promise.all([
    prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        tier: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
      },
    }),
    prisma.affiliateApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliateCommissionLedger.findMany({
      where: {
        affiliate: { userId },
        order: { deletedAt: null },
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
        order: { deletedAt: null },
        status: "paid",
        paidAt: { gte: monthStart },
      },
      _sum: { commissionCents: true },
    }),
    prisma.affiliateCommissionLedger.aggregate({
      where: {
        affiliate: { userId },
        order: { deletedAt: null },
        status: "paid",
      },
      _sum: { commissionCents: true },
    }),
    prisma.coupon.findFirst({
      where: {
        affiliate: { userId },
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    }),
    prisma.affiliateCommissionLedger.findMany({
      where: {
        affiliate: { userId },
        order: { deletedAt: null },
        status: "paid",
        paidAt: { not: null },
      },
      select: {
        id: true,
        orderId: true,
        commissionCents: true,
        paidAt: true,
      },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
  ]);
  const isActiveAffiliate = profile?.status === "active";
  if (profile?.id) {
    await syncAffiliateGrowthTierByOrderCount(profile.id);
  }
  const showApplicationForm = !isActiveAffiliate || sp.editProfile === "1";
  const showPayoutEditor = !profile || sp.editPayout === "1";
  const contactWhatsappInput = splitPhoneForInput(profile?.whatsapp);
  const earnedThisMonthCents = monthlyPaid._sum.commissionCents ?? 0;
  const totalEarnedCents = totalPaid._sum.commissionCents ?? 0;
  const paidCommissionOrderCount = profile
    ? await countAffiliatePaidCommissionOrders(profile.id)
    : 0;
  const currentGrowthTier =
    [...GROWTH_MILESTONES]
      .reverse()
      .find((x) => paidCommissionOrderCount >= x.minOrders) ?? GROWTH_MILESTONES[0];
  const nextGrowthTier = GROWTH_MILESTONES.find(
    (x) => x.minOrders > paidCommissionOrderCount,
  );
  const ordersToNextTier = nextGrowthTier
    ? Math.max(0, nextGrowthTier.minOrders - paidCommissionOrderCount)
    : 0;
  const currentTierFloor = currentGrowthTier.minOrders;
  const nextTierFloor = nextGrowthTier?.minOrders ?? currentTierFloor;
  const progressInTier = nextGrowthTier
    ? Math.max(0, paidCommissionOrderCount - currentTierFloor)
    : 1;
  const progressSpan = nextGrowthTier
    ? Math.max(1, nextTierFloor - currentTierFloor)
    : 1;
  const growthProgressPercent = nextGrowthTier
    ? Math.min(100, Math.round((progressInTier / progressSpan) * 100))
    : 100;
  const recentReferrals = commissionLedgers.slice(0, 3);
  const fullName = [profile?.user.firstName?.trim(), profile?.user.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const greetingName =
    fullName ||
    profile?.displayName?.trim() ||
    profile?.user.displayName?.trim() ||
    profile?.user.email?.trim() ||
    session?.user?.email?.trim() ||
    "Partner";
  const dashboardTitle = isActiveAffiliate ? "Affiliate dashboard" : "Affiliate application";
  const showGenericOkMessage = Boolean(
    sp.ok && sp.ok !== "coupon_requested" && sp.ok !== "payout_saved",
  );

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
      {profile ? <AffiliateLiveRefresh /> : null}
      <AffiliateCouponRequestedModal
        show={sp.ok === "coupon_requested"}
        requestId={String(sp.rid ?? "")}
      />
      {sp.ok ? <ClearQueryParam param="ok" /> : null}
      <RestoreScrollOnce
        enabled={sp.ok === "payout_saved"}
        storageKey="affiliate_payout_submit_scroll_y"
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{dashboardTitle}</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        Hi, {greetingName}!
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
            Total earned
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {usd(totalEarnedCents)}
          </p>
        </div>
      </section>

      {sp.error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {sp.error}
        </p>
      ) : null}
      {showGenericOkMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {sp.ok === "pending"
            ? "Application submitted. Your profile is pending manual review."
            : "Application submitted and auto-approved. Please complete payout details in the next phase."}
        </p>
      ) : null}

      {profile ? <AffiliateQuickGuide /> : null}

      {profile ? (
        <section id="account-settings" className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
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
                Tier:{" "}
                <span className="font-medium">
                  {currentGrowthTier.level} ({currentGrowthTier.rate}%)
                </span>
              </p>
              <p className="mt-1">
                Coupon code:{" "}
                {coupon?.code ? (
                  <span className="font-medium">{coupon.code}</span>
                ) : (
                  <form action={requestAffiliateCouponCodeAction} className="inline">
                    <button type="submit" className="font-medium underline underline-offset-2">
                      Apply for code
                    </button>
                  </form>
                )}
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
              className="inline-flex items-center justify-center rounded-xl bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
            >
              Download brand assets
            </a>
          </div>
        </section>
      ) : null}

      {paidLedgers.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Paid commission orders
          </h2>
          <p className="mt-2 text-xs text-muted">
            You can tick paid commission orders to view selected total count and commission.
          </p>
          <div className="mt-3">
            <PaidCommissionSelector
              rows={paidLedgers.map((r) => ({
                id: r.id,
                orderId: r.orderId,
                commissionCents: r.commissionCents,
                paidAtLabel: r.paidAt ? r.paidAt.toLocaleDateString() : "-",
              }))}
            />
          </div>
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span>Growth progress</span>
            <span className="group relative inline-block">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold text-muted">
                ?
              </span>
              <span className="absolute left-0 top-6 z-10 hidden w-72 rounded-xl border border-line bg-white px-3 py-3 text-[11px] normal-case leading-5 tracking-normal text-ink shadow-md group-hover:block">
                <span className="block font-semibold text-ink">Growth tiers (paid commission orders)</span>
                <span className="mt-1 block text-muted">
                  0-99: 5% · 100+: 7% · 300+: 9% · 600+: 11% · 1000+: 13% · 1500+: 15%
                </span>
                <span className="mt-2 block border-t border-line pt-2 text-ink/90">
                  Paid commission orders:{" "}
                  <span className="font-semibold tabular-nums">{paidCommissionOrderCount}</span>
                </span>
                <span className="block text-ink/90">
                  To next tier:{" "}
                  <span className="font-semibold tabular-nums">
                    {nextGrowthTier ? `${ordersToNextTier} orders` : "Max tier reached"}
                  </span>
                </span>
              </span>
            </span>
          </h2>
          <p className="mt-2 text-sm text-ink/90">
            Current valid orders (paid commission):{" "}
            <span className="font-medium tabular-nums">{paidCommissionOrderCount}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {nextGrowthTier
              ? `${currentGrowthTier.level} (${currentGrowthTier.rate}%) -> ${nextGrowthTier.level} (${nextGrowthTier.rate}%): ${ordersToNextTier} orders to go`
              : `You are at ${currentGrowthTier.level} (${currentGrowthTier.rate}%), the highest tier.`}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink">
              {nextGrowthTier
                ? `Next unlock: ${nextGrowthTier.level} (${nextGrowthTier.rate}%)`
                : "Highest tier unlocked"}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${growthProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Progress in current tier range:{" "}
            <span className="font-medium tabular-nums">{growthProgressPercent}%</span>
          </p>
          {nextGrowthTier ? (
            <p className="mt-1 text-xs text-ink/80">
              Tip: You need <span className="font-semibold tabular-nums">{ordersToNextTier}</span> more
              orders to unlock <span className="font-semibold">{nextGrowthTier.rate}%</span> commission.
            </p>
          ) : null}
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span>Account settings</span>
            <span className="group relative inline-block">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold text-muted">
                ?
              </span>
              <span className="absolute left-0 top-6 z-10 hidden w-80 rounded-xl border border-line bg-white px-3 py-3 text-[11px] normal-case leading-5 tracking-normal text-ink shadow-md group-hover:block">
                <span className="block font-semibold text-ink">Recommended payout methods</span>
                <span className="mt-1 block text-muted">
                  PayPal and Alipay are recommended for faster processing.
                </span>
                <span className="mt-1 block text-muted">
                  If none of the methods below fit your payout setup, please choose Other and contact us
                  to confirm your payout method.
                </span>
              </span>
            </span>
          </h2>
          {profile.paymentInfoPending ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Missing payout details. Please add your payout method and at least one contact method.
              If no payout account is available now, keep your email or WhatsApp updated and admin will
              contact you for manual settlement.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Payout details confirmed by admin. Keep them up to date for future settlements.
            </p>
          )}
          {showPayoutEditor ? (
            <AffiliatePayoutDetailsForm
              action={updatePayoutDetailsAction}
              defaultPayoutMethod={profile.payoutMethod ?? ""}
              defaultPayoutAccount={profile.payoutAccount ?? ""}
              defaultPayoutEmail={profile.payoutEmail ?? ""}
              defaultWhatsapp={profile.whatsapp ?? ""}
              cancelHref="/account/affiliate#account-settings"
              showSaveSuccess={sp.ok === "payout_saved"}
            />
          ) : (
            <div className="mt-3 rounded-xl border border-line bg-paper/70 px-3 py-3 text-sm text-ink/90">
              <p>Method: <span className="font-medium">{humanizePayoutMethod(profile.payoutMethod)}</span></p>
              <p className="mt-1">
                Account:{" "}
                <span className="whitespace-pre-line font-medium">
                  {maskPayoutAccountForDisplay(
                    stripEmbeddedWhatsAppFromPayoutAccount(profile.payoutAccount ?? ""),
                  )}
                </span>
              </p>
              <p className="mt-1">Email: <span className="font-medium">{profile.payoutEmail || "-"}</span></p>
              <p className="mt-1">Telephone: <span className="font-medium">{profile.whatsapp || "-"}</span></p>
              <p className="mt-1">
                WhatsApp:{" "}
                <span className="font-medium">
                  {profile.whatsapp ||
                    extractLabeledValue(profile.payoutAccount, "WhatsApp") ||
                    "-"}
                </span>
              </p>
              <p className="mt-1">
                Verification:{" "}
                <span className="font-medium">
                  {profile.payoutVerifiedAt ? `Confirmed (${profile.payoutVerifiedAt.toLocaleDateString()})` : "Pending admin confirmation"}
                </span>
              </p>
              <div className="mt-3">
                <Link
                  href="/account/affiliate?editPayout=1#account-settings"
                  scroll={false}
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                >
                  Edit
                </Link>
                {sp.ok === "payout_saved" ? (
                  <span className="ml-2 inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-900">
                    Saved successfully.
                  </span>
                ) : null}
              </div>
            </div>
          )}
          <div className="mt-3 rounded-xl border border-line bg-paper/70 px-3 py-3 text-xs text-ink/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Contact for payout support</p>
            <p className="mt-2">
              Email: <a className="font-medium text-ink underline underline-offset-2" href="mailto:support@humpbuck.com">support@humpbuck.com</a>
            </p>
            <p className="mt-1">
              WhatsApp: <a className="font-medium text-ink underline underline-offset-2" href="https://wa.me/8618928160416">+86 189 2816 0416</a>
            </p>
          </div>
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
            <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
              <input
                name="contactWhatsappCountryCode"
                defaultValue=""
                list={PHONE_COUNTRY_CODE_DATALIST_ID}
                inputMode="tel"
                placeholder="+1"
                onChange={(e) => {
                  e.currentTarget.value = normalizeCountryCodeInput(e.currentTarget.value);
                }}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                name="contactWhatsappLocal"
                defaultValue={contactWhatsappInput.localNumber}
                inputMode="numeric"
                placeholder="Settlement WhatsApp (optional)"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </div>
            <datalist id={PHONE_COUNTRY_CODE_DATALIST_ID}>
              {PHONE_COUNTRY_CODES.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
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

