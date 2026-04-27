import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_INBOX_CATEGORY,
  adminInboxCategoryLabel,
  syncSystemInboxMessages,
} from "@/lib/admin-inbox";
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

async function markCategoryReadAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const category = String(formData.get("category") ?? "").trim();
  const now = new Date();
  if (!category) goMessages("Missing message category.");

  if (category === "all" || category === ADMIN_INBOX_CATEGORY.order) {
    await prisma.adminInboxMessage
      .updateMany({
        where: { category: ADMIN_INBOX_CATEGORY.order, status: "pending" },
        data: { status: "handled", handledAt: now },
      })
      .catch(() => null);
  }
  if (category === "all" || category === ADMIN_INBOX_CATEGORY.affiliates) {
    await prisma.affiliateCouponRequest
      .updateMany({
        where: { status: "pending" },
        data: { status: "handled", handledAt: now },
      })
      .catch(() => null);
  }
  if (category === "all" || category === ADMIN_INBOX_CATEGORY.subscribe) {
    await prisma.adminInboxMessage
      .updateMany({
        where: { status: "pending", category: ADMIN_INBOX_CATEGORY.subscribe },
        data: { status: "handled", handledAt: now },
      })
      .catch(() => null);
  }
  if (category === "all" || category === ADMIN_INBOX_CATEGORY.emailMockupRequest) {
    await prisma.adminInboxMessage
      .updateMany({
        where: { status: "pending", category: ADMIN_INBOX_CATEGORY.emailMockupRequest },
        data: { status: "handled", handledAt: now },
      })
      .catch(() => null);
  }

  revalidatePath(adminPath("/messages"));
  revalidatePath(adminPath("/orders"));
  revalidatePath(adminPath("/affiliate"));
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

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await assertAdmin();
  await syncSystemInboxMessages();
  const sp = (await searchParams) ?? {};
  const errorRaw = sp.error;
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const categoryRaw = sp.category;
  const selectedCategoryInput = Array.isArray(categoryRaw) ? categoryRaw[0] : (categoryRaw ?? "all");
  const selectedCategory =
    selectedCategoryInput === ADMIN_INBOX_CATEGORY.dispute
      ? ADMIN_INBOX_CATEGORY.order
      : selectedCategoryInput;
  const [
    pendingOrderCount,
    pendingAffiliateCount,
    pendingSubscribeCount,
    pendingMockupRequestCount,
    pendingAffiliateRequests,
    handledAffiliateRequests,
    pendingInboxMessages,
    handledInboxMessages,
  ] = await Promise.all([
    prisma.adminInboxMessage
      .count({
        where: {
          status: "pending",
          category: ADMIN_INBOX_CATEGORY.order,
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
        where: { category: ADMIN_INBOX_CATEGORY.subscribe, status: "pending" },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: { category: ADMIN_INBOX_CATEGORY.emailMockupRequest, status: "pending" },
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
        where: {
          status: "pending",
          category: { not: ADMIN_INBOX_CATEGORY.dispute },
          ...(selectedCategory === "all" ? {} : { category: selectedCategory }),
        },
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
    pendingAffiliateCount +
    pendingSubscribeCount +
    pendingMockupRequestCount;
  const showAffiliateRows =
    selectedCategory === "all" || selectedCategory === ADMIN_INBOX_CATEGORY.affiliates;
  const visiblePendingCount =
    (showAffiliateRows ? pendingAffiliateRequests.length : 0) + pendingInboxMessages.length;
  const cardClass = (count: number) =>
    `rounded-xl border px-3 py-2 text-sm transition ${
      count > 0
        ? "border-line bg-paper/70 hover:border-ink/20"
        : "border-line/70 bg-paper/35 text-muted hover:border-line/80"
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl tracking-tight">Message inbox</h1>
            <p className="mt-2 text-sm text-muted">Pending message summary for operations follow-up.</p>
          </div>
          <form action={markCategoryReadAction}>
            <input type="hidden" name="category" value="all" />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              Mark all as read
            </button>
          </form>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={adminPath("/messages?category=order")} className={cardClass(pendingOrderCount)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Orders</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingOrderCount}</p>
          </Link>
          <Link href={adminPath("/affiliate?couponRequests=1")} className={cardClass(pendingAffiliateCount)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Affiliates</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingAffiliateCount}</p>
          </Link>
          <Link href={adminPath("/messages?category=subscribe")} className={cardClass(pendingSubscribeCount)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Subscribe</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingSubscribeCount}</p>
          </Link>
          <Link
            href={adminPath("/messages?category=email_mockup_request")}
            className={cardClass(pendingMockupRequestCount)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Email mockup request
            </p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingMockupRequestCount}</p>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Pending messages
        </h2>
        {selectedCategory !== "all" ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <p>
              Showing filtered category:{" "}
              <span className="font-semibold text-ink">{adminInboxCategoryLabel(selectedCategory)}</span>
            </p>
            <form action={markCategoryReadAction}>
              <input type="hidden" name="category" value={selectedCategory} />
              <button
                type="submit"
                className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink transition hover:border-ink/20"
              >
                Mark this category as read
              </button>
            </form>
            <Link className="underline underline-offset-2 hover:text-ink" href={adminPath("/messages")}>
              Clear filter
            </Link>
          </div>
        ) : null}
        {totalPendingCount === 0 ? (
          <p className="mt-3 text-sm text-muted">No pending messages.</p>
        ) : visiblePendingCount === 0 ? (
          <p className="mt-3 text-sm text-muted">No pending messages in this category.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {showAffiliateRows
              ? pendingAffiliateRequests.map((req) => {
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
            })
              : null}
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
                        {adminInboxCategoryLabel(msg.category)}
                      </span>{" "}
                      <span className="font-medium">{payload.email || msg.sourceEmail || "-"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {msg.createdAt.toLocaleString()}
                    </p>
                  </div>
                  {msg.category === ADMIN_INBOX_CATEGORY.order && payload.itemName ? (
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1">
                      {payload.itemImage ? (
                        <Image
                          src={payload.itemImage}
                          alt={payload.itemName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-paper" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-ink">
                          {(payload.email || msg.sourceEmail || "Customer")}{" "}
                          {payload.eventType === "cancelled" ? "cancelled" : "paid"} {payload.itemName}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {payload.itemVariant || "Default"} · Qty {payload.itemQty || "1"}
                        </p>
                      </div>
                    </div>
                  ) : null}
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
                      {adminInboxCategoryLabel(msg.category)}
                    </span>{" "}
                    <span className="font-medium">{payload.email || msg.sourceEmail || "-"}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {payload.company ? `Company: ${payload.company} · ` : ""}
                    {payload.itemName ? `Item: ${payload.itemName} · ` : ""}
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
