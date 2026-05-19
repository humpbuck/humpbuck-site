import { Link } from "@/i18n/navigation";
import { redirectWithLocale } from "@/lib/storefront-redirect";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
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
import { AffiliateSettlementSelector } from "@/components/account/affiliate-settlement-selector";
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
  validateInternationalPhone,
} from "@/lib/phone-normalize";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { prisma } from "@/lib/prisma";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

const AFFILIATE_ERR_CODES = [
  "promo_plan_short",
  "social_required",
  "international_phone_required",
  "international_phone_incomplete",
  "international_phone_country_code_length",
  "international_phone_local_length",
  "international_phone_total_digits",
  "payout_account_required",
  "payout_real_name_required",
  "payout_recipient_name_required",
  "payout_swift_required",
  "payout_bank_address_required",
  "affiliate_profile_required",
  "payout_contact_required",
  "coupon_requires_active",
  "coupon_email_failed",
] as const;

type AffiliateErrCode = (typeof AFFILIATE_ERR_CODES)[number];

function isAffiliateErrCode(code: string): code is AffiliateErrCode {
  return (AFFILIATE_ERR_CODES as readonly string[]).includes(code);
}

async function goAffiliateErr(code: AffiliateErrCode): Promise<never> {
  return redirectWithLocale(`/account/affiliate?err=${encodeURIComponent(code)}`);
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
  if (!userId) return redirectWithLocale("/auth/login?callbackUrl=/account/affiliate");

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
    return goAffiliateErr("promo_plan_short");
  }
  if (socialLinks.length === 0) {
    return goAffiliateErr("social_required");
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
  const whatsappCheck = validateInternationalPhone(whatsapp, {
    required: false,
    label: "WhatsApp number",
  });
  if (!whatsappCheck.ok) return goAffiliateErr(whatsappCheck.code);
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

  const merchantEmail = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  const supportFrom = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
  const profileStatus = existingProfile?.blacklist
    ? "blacklisted"
    : risk.highRisk
      ? "pending"
      : "active";
  await sendTransactionalEmail({
    to: merchantEmail,
    subject: "New affiliate application received",
    htmlContent: `
      <p>Hello,</p>
      <p>An affiliate application has been submitted and the profile was ${profileStatus === "active" ? "created/updated successfully" : "saved for review"}.</p>
      <ul>
        <li><strong>Name:</strong> ${session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Affiliate partner"}</li>
        <li><strong>Email:</strong> ${session?.user?.email || "-"}</li>
        <li><strong>PID:</strong> ${pid}</li>
        <li><strong>Status:</strong> ${profileStatus}</li>
        <li><strong>Risk flag:</strong> ${risk.highRisk ? "Yes" : "No"}</li>
        <li><strong>Blacklist:</strong> ${Boolean(existingProfile?.blacklist) ? "Yes" : "No"}</li>
        <li><strong>Payout email:</strong> ${payoutEmail || "-"}</li>
        <li><strong>WhatsApp:</strong> ${whatsapp || "-"}</li>
        <li><strong>Support:</strong> ${supportFrom}</li>
      </ul>
      <p>Please review the new affiliate in the admin panel if needed.</p>
    `,
    textContent: `New affiliate application received\nName: ${session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Affiliate partner"}\nEmail: ${session?.user?.email || "-"}\nPID: ${pid}\nStatus: ${profileStatus}\nRisk flag: ${risk.highRisk ? "Yes" : "No"}\nBlacklist: ${Boolean(existingProfile?.blacklist) ? "Yes" : "No"}\nPayout email: ${payoutEmail || "-"}\nWhatsApp: ${whatsapp || "-"}\nSupport: ${supportFrom}\nPlease review the new affiliate in the admin panel if needed.`,
  }).catch(() => null);

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

  revalidateStorefrontPath("/account/affiliate");
  await redirectWithLocale(
    risk.highRisk
      ? "/account/affiliate?ok=pending"
      : "/account/affiliate?ok=approved",
  );
}

async function updatePayoutDetailsAction(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return redirectWithLocale("/auth/login?callbackUrl=/account/affiliate");

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
    return goAffiliateErr("payout_account_required");
  }
  if ((payoutMethod === "alipay" || payoutMethod === "bank") && !payoutRealName) {
    return goAffiliateErr("payout_real_name_required");
  }
  if ((payoutMethod === "wise" || payoutMethod === "payoneer") && !payoutAccount.includes("Recipient name:")) {
    return goAffiliateErr("payout_recipient_name_required");
  }
  if (payoutMethod === "bank" && payoutBankTransferScope === "international") {
    if (!payoutAccount.includes("SWIFT/BIC:")) {
      return goAffiliateErr("payout_swift_required");
    }
    if (!payoutAccount.includes("Bank address:")) {
      return goAffiliateErr("payout_bank_address_required");
    }
  }
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: { id: true, whatsapp: true },
  });
  if (!profile) {
    return goAffiliateErr("affiliate_profile_required");
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
  const whatsappCheck = validateInternationalPhone(whatsapp, {
    required: false,
    label: "WhatsApp number",
  });
  if (!whatsappCheck.ok) return goAffiliateErr(whatsappCheck.code);
  if (payoutMethod === "other" && !(payoutEmail || whatsapp)) {
    return goAffiliateErr("payout_contact_required");
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

  revalidateStorefrontPath("/account/affiliate");
  await redirectWithLocale("/account/affiliate?ok=payout_saved#account-settings");
}

async function requestAffiliateCouponCodeAction() {
  "use server";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return redirectWithLocale("/auth/login?callbackUrl=/account/affiliate");

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
    return goAffiliateErr("affiliate_profile_required");
  }
  if (profile.status !== "active") {
    return goAffiliateErr("coupon_requires_active");
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
    return goAffiliateErr("coupon_email_failed");
  }

  revalidateStorefrontPath("/account/affiliate");
  await redirectWithLocale(`/account/affiliate?ok=coupon_requested&rid=${Date.now()}`);
}

type SettlementFilter = "all" | "pending" | "eligible" | "paid" | "reversed";

function normalizeSettlementFilter(raw: string | undefined): SettlementFilter {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "pending" || v === "eligible" || v === "paid" || v === "reversed") {
    return v;
  }
  return "all";
}

function normalizeDateInput(raw: string | undefined): string {
  const v = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
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
  { levelKey: "level1", minOrders: 0, rate: 5 },
  { levelKey: "level2", minOrders: 100, rate: 7 },
  { levelKey: "level3", minOrders: 300, rate: 9 },
  { levelKey: "level4", minOrders: 600, rate: 11 },
  { levelKey: "level5", minOrders: 1000, rate: 13 },
  { levelKey: "level6", minOrders: 1500, rate: 15 },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AccountAffiliate" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/account/affiliate`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/account/affiliate"),
    },
  };
}

export default async function AccountAffiliatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    ok?: string;
    rid?: string;
    err?: string;
    error?: string;
    editProfile?: string;
    editPayout?: string;
    settlement?: string;
    settlementPage?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AccountAffiliate");
  const dateLocale =
    locale === "es"
      ? "es"
      : locale === "pt"
        ? "pt-BR"
        : locale === "ru"
          ? "ru-RU"
          : locale === "fr"
            ? "fr-FR"
            : locale === "it"
              ? "it-IT"
              : "en-US";

  function payoutMethodLabel(method: string | null | undefined): string {
    if (!method) return "-";
    const map = {
      paypal: "payoutPaypal",
      alipay: "payoutAlipay",
      bank: "payoutBank",
      wise: "payoutWise",
      payoneer: "payoutPayoneer",
      other: "payoutOther",
    } as const;
    const key = map[method as keyof typeof map];
    return key ? t(key) : method;
  }

  function applicationStatusLabel(status: string): string {
    const map = {
      auto_approved: "statusAutoApproved",
      approved: "statusApproved",
      rejected: "statusRejected",
      pending: "statusPendingReview",
    } as const;
    const key = map[status as keyof typeof map];
    return key ? t(key) : status;
  }

  function tierName(levelKey: (typeof GROWTH_MILESTONES)[number]["levelKey"]): string {
    return t(levelKey);
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return redirectWithLocale("/auth/login?callbackUrl=/account/affiliate");
  await ensureAffiliateGrowthTiers();

  const sp = await searchParams;
  const settlementFilter = normalizeSettlementFilter(sp.settlement);
  const settlementPageRaw = Math.max(1, Math.floor(Number(sp.settlementPage) || 1));
  const dateFromInput = normalizeDateInput(sp.from);
  const dateToInput = normalizeDateInput(sp.to);
  const dateFrom = dateFromInput ? new Date(`${dateFromInput}T00:00:00`) : null;
  const dateTo = dateToInput ? new Date(`${dateToInput}T23:59:59.999`) : null;
  const eligibleAtWhere =
    dateFrom && dateTo
      ? dateFrom <= dateTo
        ? { gte: dateFrom, lte: dateTo }
        : { gte: dateTo, lte: dateFrom }
      : dateFrom
        ? { gte: dateFrom }
        : dateTo
          ? { lte: dateTo }
          : undefined;
  const SETTLEMENT_PAGE_SIZE = 10;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const settlementWhere = {
    affiliate: { userId },
    order: { deletedAt: null as Date | null },
    ...(settlementFilter === "all" ? {} : { status: settlementFilter }),
    ...(eligibleAtWhere ? { eligibleAt: eligibleAtWhere } : {}),
  };
  const [accountUser, profile, latestApplication, monthlyPaid, totalPaid, coupon, settlementRows, settlementCountRows, settlementTotal] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
      },
    }),
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
      where: settlementWhere,
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (settlementPageRaw - 1) * SETTLEMENT_PAGE_SIZE,
      take: SETTLEMENT_PAGE_SIZE,
    }),
    prisma.affiliateCommissionLedger.groupBy({
      by: ["status"],
      where: {
        affiliate: { userId },
        order: { deletedAt: null },
      },
      _count: { _all: true },
    }),
    prisma.affiliateCommissionLedger.count({
      where: settlementWhere,
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
  const settlementCountMap = new Map<string, number>(
    settlementCountRows.map((row) => [row.status, row._count._all]),
  );
  const settlementCounts = {
    all: settlementCountRows.reduce((sum, row) => sum + row._count._all, 0),
    pending: settlementCountMap.get("pending") ?? 0,
    eligible: settlementCountMap.get("eligible") ?? 0,
    paid: settlementCountMap.get("paid") ?? 0,
    reversed: settlementCountMap.get("reversed") ?? 0,
  };
  const settlementTotalPages = Math.max(1, Math.ceil(settlementTotal / SETTLEMENT_PAGE_SIZE));
  const settlementPage = Math.min(settlementPageRaw, settlementTotalPages);
  const settlementPageHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (settlementFilter !== "all") qs.set("settlement", settlementFilter);
    if (dateFromInput) qs.set("from", dateFromInput);
    if (dateToInput) qs.set("to", dateToInput);
    if (nextPage > 1) qs.set("settlementPage", String(nextPage));
    return `/account/affiliate${qs.toString() ? `?${qs.toString()}` : ""}#settlement-orders`;
  };
  const settlementExportHref = (() => {
    const qs = new URLSearchParams();
    if (settlementFilter !== "all") qs.set("settlement", settlementFilter);
    if (dateFromInput) qs.set("from", dateFromInput);
    if (dateToInput) qs.set("to", dateToInput);
    return `/api/account/affiliate/settlement/export${qs.toString() ? `?${qs.toString()}` : ""}`;
  })();
  const fullName = [accountUser?.firstName?.trim(), accountUser?.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const greetingName =
    fullName ||
    accountUser?.displayName?.trim() ||
    accountUser?.email?.trim() ||
    profile?.displayName?.trim() ||
    profile?.user.displayName?.trim() ||
    profile?.user.email?.trim() ||
    session?.user?.email?.trim() ||
    t("partnerFallback");
  const dashboardTitle = isActiveAffiliate ? t("dashboardActive") : t("dashboardApply");
  const showGenericOkMessage = Boolean(
    sp.ok && sp.ok !== "coupon_requested" && sp.ok !== "payout_saved",
  );

  const errParam = sp.err?.trim();
  const errorBanner: string | null =
    errParam && isAffiliateErrCode(errParam)
      ? t(`err.${errParam}`)
      : sp.error
        ? sp.error
        : null;

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
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{t("greeting", { name: greetingName })}</h1>
      <p className="mt-4 text-sm text-muted">{t("intro")}</p>
      {profile ? (
        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white/60 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("earnedThisMonth")}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
              {usd(earnedThisMonthCents)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#EEEEEE] bg-white/60 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t("totalEarned")}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
              {usd(totalEarnedCents)}
            </p>
          </div>
        </section>
      ) : null}

      {errorBanner ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {errorBanner}
        </p>
      ) : null}
      {showGenericOkMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {sp.ok === "pending" ? t("okPending") : t("okAutoApproved")}
        </p>
      ) : null}

      {profile ? <AffiliateQuickGuide /> : null}

      {profile ? (
        <section id="account-settings" className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("yourTools")}
            </h2>
            {isActiveAffiliate ? (
              <Link
                href="/account/affiliate?editProfile=1"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
              >
                {t("updatePartnerInfo")}
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-paper/70 px-3 py-3 text-sm text-ink/90">
              <p>
                {t("pidPrefix")} <span className="font-medium">{profile.pid ?? "-"}</span>
              </p>
              <p className="mt-1">
                {t("tierPrefix")}{" "}
                <span className="font-medium">
                  {tierName(currentGrowthTier.levelKey)} ({currentGrowthTier.rate}%)
                </span>
              </p>
              <p className="mt-1">
                {t("couponCode")}{" "}
                {coupon?.code ? (
                  <span className="font-medium">{coupon.code}</span>
                ) : (
                  <form action={requestAffiliateCouponCodeAction} className="inline">
                    <button type="submit" className="font-medium underline underline-offset-2">
                      {t("applyForCode")}
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
                <p className="text-sm text-muted">{t("pidPendingNote")}</p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://humpbuck.com"}/wholesale`}
              className="inline-flex items-center justify-center rounded-xl bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
            >
              {t("downloadBrandAssets")}
            </a>
          </div>
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span>{t("growthProgress")}</span>
            <span className="group relative inline-block">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold text-muted">
                ?
              </span>
              <span className="absolute left-0 top-6 z-10 hidden w-72 rounded-xl border border-line bg-white px-3 py-3 text-[11px] normal-case leading-5 tracking-normal text-ink shadow-md group-hover:block">
                <span className="block font-semibold text-ink">{t("growthHelpTitle")}</span>
                <span className="mt-1 block text-muted">{t("growthHelpRates")}</span>
                <span className="mt-2 block border-t border-line pt-2 text-ink/90">
                  {t("growthHelpPaidOrders")}{" "}
                  <span className="font-semibold tabular-nums">{paidCommissionOrderCount}</span>
                </span>
                <span className="block text-ink/90">
                  {t("growthHelpToNext")}{" "}
                  <span className="font-semibold tabular-nums">
                    {nextGrowthTier
                      ? t("growthHelpOrders", { count: ordersToNextTier })
                      : t("growthHelpMaxTier")}
                  </span>
                </span>
              </span>
            </span>
          </h2>
          <p className="mt-2 text-sm text-ink/90">
            {t("growthCurrentOrders")}{" "}
            <span className="font-medium tabular-nums">{paidCommissionOrderCount}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {nextGrowthTier
              ? t("growthTierProgress", {
                  currentLevel: tierName(currentGrowthTier.levelKey),
                  currentRate: currentGrowthTier.rate,
                  nextLevel: tierName(nextGrowthTier.levelKey),
                  nextRate: nextGrowthTier.rate,
                  orders: ordersToNextTier,
                })
              : t("growthTierMax", {
                  level: tierName(currentGrowthTier.levelKey),
                  rate: currentGrowthTier.rate,
                })}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink">
              {nextGrowthTier
                ? t("growthNextUnlock", {
                    level: tierName(nextGrowthTier.levelKey),
                    rate: nextGrowthTier.rate,
                  })
                : t("growthHighestTier")}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${growthProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {t("growthProgressLabel")}{" "}
            <span className="font-medium tabular-nums">{growthProgressPercent}%</span>
          </p>
          {nextGrowthTier ? (
            <p className="mt-1 text-xs text-ink/80">
              {t("growthTip", {
                orders: ordersToNextTier,
                rate: nextGrowthTier.rate,
              })}
            </p>
          ) : null}
        </section>
      ) : null}

      {profile ? (
        <section id="settlement-orders" className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span>{t("accountSettings")}</span>
            <span className="group relative inline-block">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold text-muted">
                ?
              </span>
              <span className="absolute left-0 top-6 z-10 hidden w-80 rounded-xl border border-line bg-white px-3 py-3 text-[11px] normal-case leading-5 tracking-normal text-ink shadow-md group-hover:block">
                <span className="block font-semibold text-ink">{t("payoutHelpTitle")}</span>
                <span className="mt-1 block text-muted">{t("payoutHelpPaypal")}</span>
                <span className="mt-1 block text-muted">{t("payoutHelpOther")}</span>
              </span>
            </span>
          </h2>
          {profile.paymentInfoPending ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {t("missingPayoutDetails")}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">{t("payoutConfirmed")}</p>
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
              <p>
                {t("method")}{" "}
                <span className="font-medium">{payoutMethodLabel(profile.payoutMethod)}</span>
              </p>
              <p className="mt-1">
                {t("account")}{" "}
                <span className="whitespace-pre-line font-medium">
                  {maskPayoutAccountForDisplay(
                    stripEmbeddedWhatsAppFromPayoutAccount(profile.payoutAccount ?? ""),
                  )}
                </span>
              </p>
              <p className="mt-1">
                {t("email")} <span className="font-medium">{profile.payoutEmail || "-"}</span>
              </p>
              <p className="mt-1">
                {t("telephone")} <span className="font-medium">{profile.whatsapp || "-"}</span>
              </p>
              <p className="mt-1">
                {t("whatsapp")}{" "}
                <span className="font-medium">
                  {profile.whatsapp ||
                    extractLabeledValue(profile.payoutAccount, "WhatsApp") ||
                    "-"}
                </span>
              </p>
              <p className="mt-1">
                {t("verification")}{" "}
                <span className="font-medium">
                  {!profile.paymentInfoPending
                    ? profile.payoutVerifiedAt
                      ? t("verificationApprovedDate", {
                          date: profile.payoutVerifiedAt.toLocaleDateString(dateLocale),
                        })
                      : t("verificationApproved")
                    : t("verificationPending")}
                </span>
              </p>
              <div className="mt-3">
                <Link
                  href="/account/affiliate?editPayout=1#account-settings"
                  scroll={false}
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                >
                  {t("edit")}
                </Link>
                {sp.ok === "payout_saved" ? (
                  <span className="ml-2 inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-900">
                    {t("savedSuccessfully")}
                  </span>
                ) : null}
              </div>
            </div>
          )}
          <div className="mt-3 rounded-xl border border-line bg-paper/70 px-3 py-3 text-xs text-ink/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("payoutSupportTitle")}
            </p>
            <p className="mt-2">
              {t("payoutSupportEmail")}{" "}
              <a className="font-medium text-ink underline underline-offset-2" href="mailto:support@humpbuck.com">
                support@humpbuck.com
              </a>
            </p>
            <p className="mt-1">
              {t("payoutSupportWhatsapp")}{" "}
              <a
                className="font-medium text-ink underline underline-offset-2"
                href="https://wa.me/8618928160416"
              >
                +86 189 2816 0416
              </a>
            </p>
          </div>
        </section>
      ) : null}

      {showApplicationForm ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("updatePartnerSection")}
          </h2>
          <form action={submitAffiliateApplicationAction} className="mt-4 space-y-3">
          <textarea
            name="socialLinks"
            required
            rows={3}
            placeholder={t("placeholderSocial")}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="followerCount"
            type="number"
            min="0"
            step="1"
            placeholder={t("placeholderFollowers")}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <textarea
            name="about"
            required
            minLength={20}
            rows={4}
            placeholder={t("placeholderPromo")}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("labelContactEmail")}
            </span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={profile?.payoutEmail ?? session?.user?.email?.trim() ?? ""}
              placeholder={t("placeholderSettlementEmail")}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("labelWhatsapp")}
            </span>
            <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
              <input
                name="contactWhatsappCountryCode"
                defaultValue=""
                list={PHONE_COUNTRY_CODE_DATALIST_ID}
                inputMode="tel"
                placeholder={t("placeholderCountryCode")}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <input
                name="contactWhatsappLocal"
                defaultValue={contactWhatsappInput.localNumber}
                inputMode="numeric"
                placeholder={t("placeholderSettlementWhatsapp")}
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
                {t("submit")}
              </button>
              {isActiveAffiliate ? (
                <Link
                  href="/account/affiliate"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
                >
                  {t("cancel")}
                </Link>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {latestApplication && showApplicationForm ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("latestApplication")}
          </h2>
          <p className="mt-3 text-sm text-ink/90">
            {t("statusPrefix")}{" "}
            <span className="font-medium">{applicationStatusLabel(latestApplication.status)}</span>
          </p>
          {latestApplication.riskReason ? (
            <p className="mt-1 text-sm text-muted">
              {t("riskNotePrefix")} {latestApplication.riskReason}
            </p>
          ) : null}
          {links.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {t("linksPrefix")} {links.join(" , ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-[#EEEEEE] bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("settlementOrders")}
          </h2>
          <p className="mt-2 text-xs text-muted">{t("settlementReadOnly")}</p>
          <form className="mt-3 flex flex-wrap items-end gap-2 md:flex-nowrap" method="get" action="/account/affiliate#settlement-orders">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("filterSettlementStatus")}
              </span>
              <select
                name="settlement"
                defaultValue={settlementFilter}
                className="mt-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              >
                <option value="all">{t("filterAll", { count: settlementCounts.all })}</option>
                <option value="eligible">{t("filterEligible", { count: settlementCounts.eligible })}</option>
                <option value="paid">{t("filterPaid", { count: settlementCounts.paid })}</option>
                <option value="pending">{t("filterPending", { count: settlementCounts.pending })}</option>
                <option value="reversed">{t("filterReversed", { count: settlementCounts.reversed })}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("filterFrom")}
              </span>
              <input
                type="date"
                name="from"
                defaultValue={dateFromInput}
                className="mt-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("filterTo")}
              </span>
              <input
                type="date"
                name="to"
                defaultValue={dateToInput}
                className="mt-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>
            <div className="flex items-center gap-2 md:mb-0 md:self-end">
              <button
                type="submit"
                className="rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-ink/20"
              >
                {t("applyFilters")}
              </button>
              <a
                href={settlementExportHref}
                className="whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
              >
                {t("exportCsv")}
              </a>
            </div>
          </form>
          <div className="mt-3">
            <AffiliateSettlementSelector
              rows={settlementRows.map((l) => ({
                id: l.id,
                orderId: l.order.id,
                orderStatus: l.order.status,
                settlementStatus: l.status,
                eligibleAtLabel: l.eligibleAt.toLocaleDateString(dateLocale),
                paidOrReversedAtLabel:
                  (l.paidAt ?? l.reversedAt)?.toLocaleDateString(dateLocale) ?? "-",
                commissionCents: l.commissionCents,
              }))}
              scopeKey={`${settlementFilter}|${dateFromInput}|${dateToInput}`}
            />
          </div>
          {settlementTotalPages > 1 ? (
            <nav
              className="mt-3 flex items-center justify-end gap-2 text-xs text-ink/90"
              aria-label={t("paginationAria")}
            >
              <Link
                href={settlementPageHref(Math.max(1, settlementPage - 1))}
                scroll={false}
                className={`rounded-lg border px-2.5 py-1 ${
                  settlementPage <= 1
                    ? "pointer-events-none border-line/60 text-muted opacity-60"
                    : "border-line bg-white hover:border-ink/20"
                }`}
              >
                {t("prev")}
              </Link>
              <span className="tabular-nums">
                {t("pageOf", { page: settlementPage, total: settlementTotalPages })}
              </span>
              <Link
                href={settlementPageHref(Math.min(settlementTotalPages, settlementPage + 1))}
                scroll={false}
                className={`rounded-lg border px-2.5 py-1 ${
                  settlementPage >= settlementTotalPages
                    ? "pointer-events-none border-line/60 text-muted opacity-60"
                    : "border-line bg-white hover:border-ink/20"
                }`}
              >
                {t("next")}
              </Link>
            </nav>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

