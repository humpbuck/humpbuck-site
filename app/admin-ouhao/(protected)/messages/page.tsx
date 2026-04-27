import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function goMessages(error?: string): never {
  if (!error) redirect(adminPath("/messages"));
  redirect(`${adminPath("/messages")}?error=${encodeURIComponent(error)}`);
}

async function markCouponRequestHandledAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) goMessages("Missing request id.");
  await prisma.affiliateCouponRequest.update({
    where: { id: requestId },
    data: {
      status: "handled",
      handledAt: new Date(),
    },
  });
  revalidatePath(adminPath("/messages"));
  revalidatePath(adminPath("/affiliate"));
  redirect(adminPath("/messages"));
}

async function markInboxMessageHandledAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) goMessages("Missing message id.");
  await prisma.adminInboxMessage.update({
    where: { id: messageId },
    data: {
      status: "handled",
      handledAt: new Date(),
    },
  });
  revalidatePath(adminPath("/messages"));
  redirect(adminPath("/messages"));
}

function parsePayload(payloadJson: string): Record<string, string> {
  try {
    const obj = JSON.parse(payloadJson) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
    );
  } catch {
    return {};
  }
}

function categoryLabel(category: string): string {
  if (category === "subscribe") return "Subscribe";
  if (category === "email_mockup_request") return "Email mockup request";
  return category;
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await assertAdmin();
  const sp = (await searchParams) ?? {};
  const errorRaw = sp.error;
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const [
    pendingOrderCount,
    pendingDisputeCount,
    pendingAffiliateCount,
    pendingSubscribeCount,
    pendingMockupRequestCount,
    pendingAffiliateRequests,
    handledAffiliateRequests,
    pendingInboxMessages,
    handledInboxMessages,
  ] = await Promise.all([
    prisma.order
      .count({
        where: {
          deletedAt: null,
          status: { in: ["paid", "processing"] },
        },
      })
      .catch(() => 0),
    prisma.order
      .count({
        where: {
          deletedAt: null,
          refundReason: { not: null },
          refundedAt: null,
        },
      })
      .catch(() => 0),
    prisma.affiliateCouponRequest
      .count({
        where: { status: "pending" },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: { category: "subscribe", status: "pending" },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: { category: "email_mockup_request", status: "pending" },
      })
      .catch(() => 0),
    prisma.affiliateCouponRequest
      .findMany({
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
        take: 50,
      })
      .catch(() => []),
    prisma.affiliateCouponRequest
      .findMany({
        where: { status: { not: "pending" } },
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
        orderBy: [{ handledAt: "desc" }, { requestedAt: "desc" }],
        take: 100,
      })
      .catch(() => []),
    prisma.adminInboxMessage
      .findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.adminInboxMessage
      .findMany({
        where: { status: { not: "pending" } },
        orderBy: [{ handledAt: "desc" }, { createdAt: "desc" }],
        take: 200,
      })
      .catch(() => []),
  ]);
  const totalPendingCount =
    pendingOrderCount +
    pendingDisputeCount +
    pendingAffiliateCount +
    pendingSubscribeCount +
    pendingMockupRequestCount;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h1 className="font-serif text-3xl tracking-tight">Message inbox</h1>
        <p className="mt-2 text-sm text-muted">Pending message summary for operations follow-up.</p>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Orders</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingOrderCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              After-sales disputes
            </p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingDisputeCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Affiliates</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingAffiliateCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Subscribe</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingSubscribeCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Email mockup request
            </p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingMockupRequestCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Pending messages
        </h2>
        {totalPendingCount === 0 ? (
          <p className="mt-3 text-sm text-muted">没有待处理的消息</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pendingAffiliateRequests.map((req) => {
              const name =
                [req.user.firstName?.trim(), req.user.lastName?.trim()].filter(Boolean).join(" ").trim() ||
                req.user.displayName?.trim() ||
                req.user.email?.trim() ||
                "-";
              return (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm text-ink/90"
                >
                  <div>
                    <p>
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                        Affiliates
                      </span>{" "}
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
            {pendingInboxMessages.map((msg) => {
              const payload = parsePayload(msg.payloadJson);
              return (
                <div
                  key={msg.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper/70 px-3 py-2 text-sm text-ink/90"
                >
                  <div>
                    <p>
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                        {categoryLabel(msg.category)}
                      </span>{" "}
                      <span className="font-medium">{payload.email || msg.sourceEmail || "-"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {payload.company ? `Company: ${payload.company} · ` : ""}
                      {msg.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <form action={markInboxMessageHandledAction}>
                    <input type="hidden" name="messageId" value={msg.id} />
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

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Handled message history
        </h2>
        {handledAffiliateRequests.length === 0 && handledInboxMessages.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No handled messages yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {handledAffiliateRequests.map((req) => {
              const name =
                [req.user.firstName?.trim(), req.user.lastName?.trim()].filter(Boolean).join(" ").trim() ||
                req.user.displayName?.trim() ||
                req.user.email?.trim() ||
                "-";
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-line bg-paper/60 px-3 py-2 text-sm text-ink/85"
                >
                  <p>
                    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                      Affiliates
                    </span>{" "}
                    <span className="font-medium">{name}</span> · PID{" "}
                    <span className="font-medium">{req.affiliate?.pid ?? "-"}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {req.user.email ?? "-"} · Requested {req.requestedAt.toLocaleString()} · Handled{" "}
                    {(req.handledAt ?? req.updatedAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
            {handledInboxMessages.map((msg) => {
              const payload = parsePayload(msg.payloadJson);
              return (
                <div
                  key={msg.id}
                  className="rounded-xl border border-line bg-paper/60 px-3 py-2 text-sm text-ink/85"
                >
                  <p>
                    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                      {categoryLabel(msg.category)}
                    </span>{" "}
                    <span className="font-medium">{payload.email || msg.sourceEmail || "-"}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {payload.company ? `Company: ${payload.company} · ` : ""}
                    Received {msg.createdAt.toLocaleString()} · Handled{" "}
                    {(msg.handledAt ?? msg.updatedAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
