import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ReadActionButton } from "@/components/admin/read-action-button";
import { ResilientImage } from "@/components/admin/resilient-image";
import {
  ADMIN_INBOX_CATEGORY,
  adminInboxCategoryLabel,
  syncSystemInboxMessages,
} from "@/lib/admin-inbox";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { getCartLineImage, getProductBySlug } from "@/lib/catalog";
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
  if (category && category !== "all") {
    redirect(adminPath(`/messages?category=${encodeURIComponent(category)}`));
  }
  redirect(adminPath("/messages"));
}

function parsePayload(payloadJson: string): Record<string, unknown> {
  try {
    const obj = JSON.parse(payloadJson) as Record<string, unknown>;
    return obj ?? {};
  } catch {
    return {};
  }
}

function asText(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseItemsPreview(payload: Record<string, unknown>): Array<{
  name: string;
  variant: string;
  variantId: string;
  slug: string;
  qty: number;
  image: string;
}> {
  const raw = asText(payload.itemsPreviewJson, "");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({
      name: asText(x.name, "Order item"),
      variant: asText(x.variant, "Default"),
      variantId: asText(x.variantId, ""),
      slug: asText(x.slug, ""),
      qty: asNumber(x.qty, 1),
      image: asText(x.image, ""),
    }));
  } catch {
    return [];
  }
}

function getOrderItemImageSources(
  item: { image: string; slug: string; variantId: string },
  payload: Record<string, unknown>,
): string[] {
  const product = getProductBySlug(item.slug || asText(payload.itemSlug, ""));
  const r2Line = product ? getCartLineImage(product, item.variantId || asText(payload.itemVariantId, "")) : "";
  return [r2Line, item.image, product?.image ?? "", asText(payload.itemImage, "")];
}

function messagePrimaryText(input: {
  category: string;
  payload: Record<string, unknown>;
  sourceEmail: string | null;
}): string {
  const { category, payload, sourceEmail } = input;
  const email = asText(payload.email, sourceEmail ?? "Unknown user");
  if (category === ADMIN_INBOX_CATEGORY.order) {
    const eventType = asText(payload.eventType) === "cancelled" ? "cancelled" : "paid";
    const itemCount = Math.max(1, asNumber(payload.itemCount, 1));
    const itemWord = itemCount === 1 ? "item" : "items";
    return `${email} ${eventType} an order (${itemCount} ${itemWord}).`;
  }
  if (category === ADMIN_INBOX_CATEGORY.subscribe) {
    return (
      asText(payload.message) ||
      `New Subscriber | ${email} subscribed to your mailing list. Synced to Brevo (Website newsletter).`
    );
  }
  if (category === ADMIN_INBOX_CATEGORY.emailMockupRequest) {
    const companyName = asText(payload.company);
    const company = companyName ? ` for ${companyName}` : "";
    return asText(payload.message) || `${email} submitted an email mockup request${company}.`;
  }
  return asText(payload.message) || `${email} sent a new message.`;
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
  const normalizedCategory =
    selectedCategoryInput === ADMIN_INBOX_CATEGORY.dispute
      ? ADMIN_INBOX_CATEGORY.order
      : selectedCategoryInput;
  const allowedCategories = new Set<string>([
    "all",
    ADMIN_INBOX_CATEGORY.order,
    ADMIN_INBOX_CATEGORY.affiliates,
    ADMIN_INBOX_CATEGORY.subscribe,
    ADMIN_INBOX_CATEGORY.emailMockupRequest,
  ]);
  const selectedCategory = allowedCategories.has(normalizedCategory) ? normalizedCategory : "all";
  const [
    pendingOrderCount,
    pendingAffiliateCount,
    pendingSubscribeCount,
    pendingMockupRequestCount,
    allAffiliateRequests,
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
        where:
          selectedCategory === "all" || selectedCategory === ADMIN_INBOX_CATEGORY.affiliates
            ? undefined
            : { status: "__none__" },
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
    prisma.adminInboxMessage.findMany({
      where: {
        status: { not: "pending" },
        category: { not: ADMIN_INBOX_CATEGORY.dispute },
        ...(selectedCategory === "all" ? {} : { category: selectedCategory }),
      },
      orderBy: [{ handledAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    }).catch(() => []),
  ]);
  const totalPendingCount =
    pendingOrderCount +
    pendingAffiliateCount +
    pendingSubscribeCount +
    pendingMockupRequestCount;
  const showAffiliateRows = selectedCategory === "all" || selectedCategory === ADMIN_INBOX_CATEGORY.affiliates;
  const allMessages = [
    ...pendingInboxMessages,
    ...handledInboxMessages,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const visibleRows = allMessages.length + (showAffiliateRows ? allAffiliateRequests.length : 0);
  const cardClass = (count: number, categoryKey: string) =>
    `rounded-xl border px-3 py-2 text-sm transition ${
      selectedCategory === categoryKey ? "border-ink bg-white shadow-sm ring-1 ring-ink/20 " : ""
    }${
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
        </div>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={adminPath("/messages?category=order")}
            className={cardClass(pendingOrderCount, ADMIN_INBOX_CATEGORY.order)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Orders</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingOrderCount}</p>
          </Link>
          <Link
            href={adminPath("/messages?category=affiliates")}
            className={cardClass(pendingAffiliateCount, ADMIN_INBOX_CATEGORY.affiliates)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Affiliates</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingAffiliateCount}</p>
          </Link>
          <Link
            href={adminPath("/messages?category=subscribe")}
            className={cardClass(pendingSubscribeCount, ADMIN_INBOX_CATEGORY.subscribe)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Subscribe</p>
            <p className="mt-1 text-xl font-semibold text-ink">{pendingSubscribeCount}</p>
          </Link>
          <Link
            href={adminPath("/messages?category=email_mockup_request")}
            className={cardClass(pendingMockupRequestCount, ADMIN_INBOX_CATEGORY.emailMockupRequest)}
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
          Messages
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: ADMIN_INBOX_CATEGORY.order, label: "Orders" },
              { key: ADMIN_INBOX_CATEGORY.affiliates, label: "Affiliates" },
              { key: ADMIN_INBOX_CATEGORY.subscribe, label: "Subscribe" },
              { key: ADMIN_INBOX_CATEGORY.emailMockupRequest, label: "Email mockup request" },
            ].map((item) => (
              <Link
                key={item.key}
                href={item.key === "all" ? adminPath("/messages") : adminPath(`/messages?category=${item.key}`)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition ${
                  selectedCategory === item.key
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink/20"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <form action={markCategoryReadAction}>
            <input type="hidden" name="category" value={selectedCategory === "all" ? "all" : selectedCategory} />
            <ReadActionButton
              idleLabel={selectedCategory === "all" ? "Mark all as read" : "Mark this category as read"}
              pendingLabel={selectedCategory === "all" ? "Marking all..." : "Marking category..."}
            />
          </form>
        </div>
        {selectedCategory !== "all" ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <p>
              Showing category: <span className="font-semibold text-ink">{adminInboxCategoryLabel(selectedCategory)}</span>
            </p>
          </div>
        ) : null}
        {totalPendingCount === 0 && visibleRows === 0 ? (
          <p className="mt-3 text-sm text-muted">No pending messages.</p>
        ) : visibleRows === 0 ? (
          <p className="mt-3 text-sm text-muted">No messages in this category.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {showAffiliateRows
              ? allAffiliateRequests.map((req) => {
              const name =
                [req.user.firstName?.trim(), req.user.lastName?.trim()].filter(Boolean).join(" ").trim() ||
                req.user.displayName?.trim() ||
                req.user.email?.trim() ||
                "-";
              const isRead = req.status !== "pending";
              return (
                <div
                  key={req.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                    isRead ? "border-line/70 bg-paper/40 text-ink/65" : "border-line bg-paper/70 text-ink/90"
                  }`}
                >
                  <div>
                    <p>
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                        Affiliates
                      </span>{" "}
                      <details className="inline-block max-w-[680px] align-middle open:[&_summary]:overflow-visible open:[&_summary]:whitespace-normal open:[&_summary]:text-clip">
                        <summary className="max-w-[680px] cursor-pointer list-none truncate font-medium text-ink/90 [&::-webkit-details-marker]:hidden">
                          Coupon Request | {name} requested a dedicated coupon code.
                        </summary>
                      </details>
                    </p>
                    <p className="text-xs text-muted">
                      {req.user.email ?? "-"} · PID {req.affiliate?.pid ?? "-"} · {req.requestedAt.toLocaleString()}
                    </p>
                  </div>
                  {isRead ? (
                    <span className="rounded-xl border border-line/80 bg-paper px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      Read
                    </span>
                  ) : (
                    <form action={markCouponRequestHandledAction}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                      >
                        Mark as read
                      </button>
                    </form>
                  )}
                </div>
              );
            })
              : null}
            {allMessages.map((msg) => {
              const payload = parsePayload(msg.payloadJson);
              const isRead = msg.status !== "pending";
              const itemPreviews = parseItemsPreview(payload);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                    isRead ? "border-line/70 bg-paper/40 text-ink/65" : "border-line bg-paper/70 text-ink/90"
                  }`}
                >
                  <div>
                    <p>
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                        {adminInboxCategoryLabel(msg.category)}
                      </span>{" "}
                      <details className="inline-block max-w-[680px] align-middle open:[&_summary]:overflow-visible open:[&_summary]:whitespace-normal open:[&_summary]:text-clip">
                        <summary className="max-w-[680px] cursor-pointer list-none truncate font-medium text-ink/90 [&::-webkit-details-marker]:hidden">
                          {messagePrimaryText({
                            category: msg.category,
                            payload,
                            sourceEmail: msg.sourceEmail,
                          })}
                        </summary>
                      </details>
                    </p>
                    <p className="text-xs text-muted">
                      {msg.createdAt.toLocaleString()}
                      {asText(payload.company) ? ` · Company: ${asText(payload.company)}` : ""}
                      {asText(payload.targetRegion) ? ` · Region: ${asText(payload.targetRegion)}` : ""}
                      {asText(payload.estimatedQty) ? ` · Qty: ${asText(payload.estimatedQty)}` : ""}
                    </p>
                  </div>
                  {msg.category === ADMIN_INBOX_CATEGORY.order &&
                  (itemPreviews.length > 0 || asText(payload.itemName)) ? (
                    <div className="space-y-1 rounded-lg border border-line bg-white px-2 py-1">
                      {(itemPreviews.length > 0
                        ? itemPreviews
                        : [
                            {
                              name: asText(payload.itemName, "Order item"),
                              variant: asText(payload.itemVariant, "Default"),
                              variantId: asText(payload.itemVariantId, ""),
                              slug: asText(payload.itemSlug, ""),
                              qty: asNumber(payload.itemQty, 1),
                              image: asText(payload.itemImage, ""),
                            },
                          ]
                      ).map((item, idx) => (
                        <div key={`${msg.id}-${idx}`} className="flex items-center gap-2">
                          <ResilientImage
                            sources={getOrderItemImageSources(item, payload)}
                            alt={item.name}
                            className="h-9 w-9 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-ink">{item.name}</p>
                            <p className="truncate text-[11px] text-muted">
                              {item.variant || "Default"} · Qty {item.qty || 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {isRead ? (
                    <span className="rounded-xl border border-line/80 bg-paper px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      Read
                    </span>
                  ) : (
                    <form action={markInboxMessageHandledAction}>
                      <input type="hidden" name="messageId" value={msg.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
                      >
                        Mark as read
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
