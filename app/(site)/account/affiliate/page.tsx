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

export default async function AccountAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/login?callbackUrl=/account/affiliate");

  const sp = await searchParams;
  const [profile, latestApplication, commissionLedgers] = await Promise.all([
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
  ]);

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
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Affiliate application</h1>
      <p className="mt-4 text-sm text-muted">
        Apply to join our affiliate program. Most applications are auto-approved;
        high-risk submissions are routed for manual review.
      </p>

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

      <section className="mt-8 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Current status
        </h2>
        {profile ? (
          <div className="mt-3 space-y-1 text-sm text-ink/90">
            <p>
              Status: <span className="font-medium">{profile.status}</span>
            </p>
            <p>
              Tier: <span className="font-medium">{profile.tier?.name ?? "-"}</span>
            </p>
            <p>
              PID: <span className="font-medium">{profile.pid ?? "-"}</span>
            </p>
            <p>
              Payout method: <span className="font-medium">{profile.payoutMethod ?? "-"}</span>
            </p>
            <p>
              Payout account: <span className="font-medium">{profile.payoutAccount ?? "-"}</span>
            </p>
            <p>
              Payout email: <span className="font-medium">{profile.payoutEmail ?? "-"}</span>
            </p>
            <p>
              WhatsApp: <span className="font-medium">{profile.payoutWhatsapp ?? "-"}</span>
            </p>
            <p>
              Payout verification:{" "}
              <span className="font-medium">
                {profile.payoutVerifiedAt
                  ? `Confirmed (${profile.payoutVerifiedAt.toLocaleDateString()})`
                  : "Pending admin confirmation"}
              </span>
            </p>
            <p>
              Blacklist:{" "}
              <span className="font-medium">{profile.blacklist ? "Yes" : "No"}</span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No affiliate profile yet.</p>
        )}
      </section>

      {profile?.pid ? (
        <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Link generator (PID tracking)
          </h2>
          <p className="mt-2 text-sm text-muted">
            Paste any product/page URL to generate your tracked link.
          </p>
          <div className="mt-3">
            <AffiliateLinkGenerator
              pid={profile.pid}
              siteBaseUrl={
                process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://humpbuck.com"
              }
            />
          </div>
        </section>
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Payout details (required)
          </h2>
          {profile.paymentInfoPending ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Missing payout details. Please add your payout method and at least one contact method.
              If no payout account is available now, keep your email or WhatsApp updated and admin will
              contact you for manual settlement.
            </p>
          ) : !profile.payoutVerifiedAt ? (
            <p className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              Payout details submitted. Waiting for admin confirmation before payout processing.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Payout details confirmed by admin. Keep them up to date for future settlements.
            </p>
          )}
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
            <button
              type="submit"
              className="md:col-span-2 inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
            >
              Save payout details
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Apply / re-apply
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
          <input
            name="contactEmail"
            type="email"
            defaultValue={profile?.payoutEmail ?? session?.user?.email?.trim() ?? ""}
            placeholder="Settlement contact email (optional)"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input
            name="contactWhatsapp"
            defaultValue={profile?.payoutWhatsapp ?? ""}
            placeholder="Settlement WhatsApp (optional)"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
          >
            Submit application
          </button>
        </form>
      </section>

      {latestApplication ? (
        <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
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

      {commissionLedgers.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Attributed orders (settlement ledger)
          </h2>
          <p className="mt-2 text-xs text-muted">
            Read-only view. Order status and settlement status can only be updated by admin.
          </p>
          <div className="mt-3 space-y-2 text-sm text-ink/90">
            {commissionLedgers.map((l) => (
              <p key={l.id}>
                #{l.order.id.slice(-8)} · ${(l.order.totalCents / 100).toFixed(2)} · Order {l.order.status}
                {" · "}Settlement {l.status}
                {l.order.affiliateAttribution ? ` · ${l.order.affiliateAttribution}` : ""}
                {l.paidAt ? ` · Paid ${l.paidAt.toLocaleDateString()}` : ""}
                {" · "}
                {l.order.createdAt.toLocaleDateString()}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

