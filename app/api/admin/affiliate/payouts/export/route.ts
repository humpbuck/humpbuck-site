import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { stripEmbeddedWhatsAppFromPayoutAccount } from "@/lib/affiliate-payout-account";
import { prisma } from "@/lib/prisma";

const DEFAULT_HOLD_DAYS = 30;

export async function GET(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const holdDaysRaw = Number(url.searchParams.get("holdDays") ?? DEFAULT_HOLD_DAYS);
  const holdDays = Number.isFinite(holdDaysRaw) && holdDaysRaw > 0
    ? Math.floor(holdDaysRaw)
    : DEFAULT_HOLD_DAYS;
  const affiliateId = String(url.searchParams.get("affiliateId") ?? "").trim();
  const orderStatus = String(url.searchParams.get("orderStatus") ?? "").trim();
  const onlyVerifiedPayout = String(url.searchParams.get("onlyVerifiedPayout") ?? "") === "1";
  const modeRaw = String(url.searchParams.get("mode") ?? "eligible")
    .trim()
    .toLowerCase();
  const mode = modeRaw === "paid" || modeRaw === "all" ? modeRaw : "eligible";

  const eligibleBefore = new Date(
    Date.now() - holdDays * 24 * 60 * 60 * 1000,
  );

  const where =
    mode === "paid"
      ? {
          status: "paid" as const,
          paidAt: { not: null as Date | null },
        }
      : mode === "all"
        ? {}
        : {
            status: "eligible" as const,
            eligibleAt: { lte: eligibleBefore },
            paidAt: null,
            reversedAt: null,
          };

  const ledgers = await prisma.affiliateCommissionLedger.findMany({
    where: {
      ...where,
      ...(affiliateId ? { affiliateId } : {}),
      ...(orderStatus ? { order: { status: orderStatus } } : {}),
      ...(onlyVerifiedPayout ? { affiliate: { payoutVerifiedAt: { not: null } } } : {}),
    },
    include: {
      affiliate: {
        include: {
          user: { select: { email: true, displayName: true } },
          tier: true,
        },
      },
      order: {
        select: {
          id: true,
          totalCents: true,
          status: true,
          affiliateAttribution: true,
          deliveredAt: true,
        },
      },
    },
    orderBy: { eligibleAt: "asc" },
  });
  const rows: string[][] = [
    [
      "orderId",
      "affiliateId",
      "affiliatePid",
      "affiliateName",
      "affiliateEmail",
      "payoutEmail",
      "whatsapp",
      "payoutMethod",
      "payoutAccount",
      "payoutVerifiedAt",
      "tierName",
      "commissionType",
      "commissionValue",
      "orderTotalUsd",
      "orderStatus",
      "commissionUsd",
      "commissionStatus",
      "eligibleAt",
      "paidAt",
      "payoutBatchId",
      "payoutTxnRef",
      "paidNote",
      "paidEmailSentAt",
      "attribution",
      "deliveredAt",
    ],
  ];

  for (const l of ledgers) {
    const orderTotalUsd = l.orderTotalCents / 100;
    const commissionUsd = l.commissionCents / 100;
    rows.push([
      l.orderId,
      l.affiliateId,
      l.affiliate?.pid ?? "",
      l.affiliate?.user.displayName || "",
      l.affiliate?.user.email || "",
      l.affiliate?.payoutEmail || "",
      l.affiliate?.whatsapp || "",
      l.affiliate?.payoutMethod || "",
      stripEmbeddedWhatsAppFromPayoutAccount(l.affiliate?.payoutAccount ?? "") || "",
      l.affiliate?.payoutVerifiedAt ? l.affiliate.payoutVerifiedAt.toISOString() : "",
      l.affiliate?.tier?.name ?? "",
      l.commissionType,
      l.commissionValue.toFixed(2),
      orderTotalUsd.toFixed(2),
      l.order.status,
      commissionUsd.toFixed(2),
      l.status,
      l.eligibleAt.toISOString(),
      l.paidAt ? l.paidAt.toISOString() : "",
      l.payoutBatchId ?? "",
      l.payoutTxnRef ?? "",
      l.paidNote ?? "",
      l.paidEmailSentAt ? l.paidEmailSentAt.toISOString() : "",
      l.order.affiliateAttribution ?? "",
      l.order.deliveredAt ? l.order.deliveredAt.toISOString() : "",
    ]);
  }

  const csv = rows
    .map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
        .join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="affiliate-payouts-${mode}-${holdDays}d.csv"`,
      "cache-control": "no-store",
    },
  });
}

