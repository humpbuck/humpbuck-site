import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

type Focus = "total" | "auto" | "pending" | "blacklisted";

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
  redirect(adminPath(`/affiliate/stats?focus=${encodeURIComponent(focus || "total")}`));
}

export default async function AffiliateStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  await assertAdmin();
  const sp = await searchParams;
  const focusRaw = String(sp.focus ?? "").trim();
  const focus: Focus =
    focusRaw === "auto" || focusRaw === "pending" || focusRaw === "blacklisted" ? focusRaw : "total";

  const [profiles, pendingApps, tiers] = await Promise.all([
    prisma.affiliateProfile.findMany({
      include: {
        user: true,
        tier: true,
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
  ]);

  const blacklistedProfiles = profiles.filter((p) => p.blacklist);
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
            <div key={p.id} className="rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm">
              <p className="font-medium text-ink">{p.user.displayName || p.user.name || p.user.email || p.user.id}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>Status: {p.status}</span>
                <span>PID: {p.pid ?? "-"}</span>
                <span>Current level: {p.tier?.name ?? "-"}</span>
              </div>
              <form action={updateAffiliateTierAction} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="profileId" value={p.id} />
                <input type="hidden" name="focus" value={focus} />
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
                <button
                  type="submit"
                  className="rounded-lg bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition hover:bg-ink/90"
                >
                  Save level
                </button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
