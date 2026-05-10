import type { Order } from "@prisma/client";
import { buyerOrderAddressFieldRows } from "@/lib/account-buyer-order";
import { buildBuyerTransactionalEmailEngagementBlocks } from "@/lib/buyer-transactional-email-footer";
import { prisma } from "@/lib/prisma";
import {
  orderDisplayCode,
  parseShippingRecord,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { getProductBySlug } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { publicSupportEmail } from "@/lib/support-contact";
import { SITE_LOCALE } from "@/lib/site-locale";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { adminPath } from "@/lib/admin-path";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

const DEFAULT_MERCHANT_EMAIL = "humpbuck@outlook.com";

function formatUsdEmail(amount: number): string {
  return new Intl.NumberFormat(SITE_LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteImageUrl(href: string): string {
  const base = emailPublicBaseUrl();
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

type BuyerAddrRow = ReturnType<typeof buyerOrderAddressFieldRows>[number];

function emailAddressFieldTableCard(
  heading: string,
  rows: BuyerAddrRow[],
  emptyMessage: string,
  linkColor: string,
): string {
  if (!rows.length) {
    return `<table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
      <tr><td style="padding:14px 14px;">
        <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">${escapeHtml(heading)}</p>
        <p style="margin:0;font-size:14px;color:#8a8680;">${escapeHtml(emptyMessage)}</p>
      </td></tr>
    </table>`;
  }

  const rowHtml = rows
    .map((r, i) => {
      const isLast = i === rows.length - 1;
      const b = isLast ? "" : "border-bottom:1px solid #ece9e4;";
      const content = r.href
        ? `<a href="${escapeHtml(r.href)}" style="color:${linkColor};font-weight:600;text-decoration:none;">${escapeHtml(r.value)}</a>`
        : escapeHtml(r.value);
      return `<tr>
        <td style="padding:10px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;vertical-align:top;${b}width:38%;">${escapeHtml(r.label.toUpperCase())}</td>
        <td style="padding:10px 12px;font-size:14px;color:#2d2a26;vertical-align:top;${b}">${content}</td>
      </tr>`;
    })
    .join("");

  return `<table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
    <tr><td style="padding:14px 14px 12px 14px;">
      <p style="margin:0 0 12px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">${escapeHtml(heading)}</p>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #ece9e4;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f3f2ef;">
            <th align="left" style="padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8a8680;border-bottom:1px solid #ece9e4;">Field name</th>
            <th align="left" style="padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8a8680;border-bottom:1px solid #ece9e4;">Content</th>
          </tr>
        </thead>
        <tbody>${rowHtml}</tbody>
      </table>
    </td></tr>
  </table>`;
}

function addressRowsPlain(rows: BuyerAddrRow[], empty: string): string {
  if (!rows.length) return empty;
  return rows.map((r) => `${r.label.toUpperCase()}: ${r.value}`).join("\n");
}

export async function buildOrderCancelledEmailPayload(
  order: Order,
  lines: Awaited<ReturnType<typeof parseOrderItemsJson>>,
  audience: "buyer" | "merchant",
): Promise<{ subject: string; htmlContent: string; textContent: string }> {
  const oid = orderDisplayCode(order);
  const placed = new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const cancelledAt = new Date(order.updatedAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const base = emailPublicBaseUrl();
  const support = publicSupportEmail();
  const brand = "#5b4dcb";
  const ink = "#14120f";
  const muted = "#5c5a57";

  const bill = parseShippingRecord(order.billingJson ?? order.shippingJson);
  const ship = parseShippingRecord(order.shippingJson);
  const billRows = buyerOrderAddressFieldRows(bill, order.email);
  const shipRows = buyerOrderAddressFieldRows(ship, order.email);
  const billAddrHtml = emailAddressFieldTableCard(
    "BILLING ADDRESS",
    billRows,
    "No billing address on file.",
    brand,
  );
  const shipAddrHtml = emailAddressFieldTableCard(
    "SHIPPING ADDRESS",
    shipRows,
    "No shipping address on file.",
    brand,
  );

  const lineRows = lines
    .map((l) => {
      const product = getProductBySlug(l.slug);
      const img = product?.image
        ? `<img src="${escapeHtml(absoluteImageUrl(product.image))}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #ece9e4;background:#f7f6f3;" />`
        : `<div style="width:64px;height:64px;border-radius:10px;background:#ece9e4;border:1px solid #e0ddd6;"></div>`;
      const title = escapeHtml(l.name);
      const varLabel = l.variantLabel
        ? `<br/><span style="color:#555;font-size:13px;">${escapeHtml(l.variantLabel)}</span>`
        : "";
      return `<tr>
        <td style="padding:12px 8px 12px 12px;vertical-align:top;border-bottom:1px solid #ece9e4;">${img}</td>
        <td style="padding:12px 8px;vertical-align:top;border-bottom:1px solid #ece9e4;color:#14120f;">${title}${varLabel}<br/><span style="color:#8a8680;font-size:12px;">SKU ${escapeHtml(l.slug.toUpperCase())}</span></td>
        <td style="padding:12px 8px;vertical-align:middle;border-bottom:1px solid #ece9e4;text-align:center;font-weight:600;color:#5c5a57;">${l.qty}</td>
        <td style="padding:12px 12px 12px 8px;vertical-align:middle;border-bottom:1px solid #ece9e4;text-align:right;white-space:nowrap;font-weight:600;color:#14120f;font-variant-numeric:tabular-nums;">${formatUsdEmail(l.lineTotalCents / 100)}</td>
      </tr>`;
    })
    .join("");

  const orderNotesHtml = order.orderNotes?.trim()
    ? `<tr><td style="padding:0 24px 16px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#faf9ff;border:1px solid #e8e4ff;border-left:4px solid #5b4dcb;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#5b4dcb;">ORDER NOTES</p>
            <p style="margin:0;font-size:14px;color:#2d2a26;line-height:1.55;white-space:pre-wrap;">${escapeHtml(order.orderNotes.trim())}</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const isBuyer = audience === "buyer";
  const headerTitle = isBuyer ? "Your order was cancelled" : "Order cancelled by buyer";
  const introHtml = isBuyer
    ? `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          You cancelled order <strong>#${escapeHtml(oid)}</strong> from your account before it shipped.
        </p>
        <p style="margin:0;padding:10px 14px;background:#f7f6f3;border-radius:10px;font-size:13px;color:${muted};">
          <span style="color:${ink};font-weight:600;">Placed</span>
          <span style="color:#b0aca5;"> · </span>
          ${escapeHtml(placed)}
          <span style="color:#b0aca5;"> · </span>
          <span style="color:${ink};font-weight:600;">Cancelled</span>
          <span style="color:#b0aca5;"> · </span>
          ${escapeHtml(cancelledAt)}
        </p>`
    : `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          <a href="mailto:${escapeHtml(order.email)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(order.email)}</a>
          <span style="color:${muted};"> cancelled order <strong>#${escapeHtml(oid)}</strong> from their account before shipment.</span>
        </p>
        <p style="margin:0;padding:10px 14px;background:#f7f6f3;border-radius:10px;font-size:13px;color:${muted};">
          <span style="color:${ink};font-weight:600;">Placed</span>
          <span style="color:#b0aca5;"> · </span>
          ${escapeHtml(placed)}
          <span style="color:#b0aca5;"> · </span>
          <span style="color:${ink};font-weight:600;">Cancelled</span>
          <span style="color:#b0aca5;"> · </span>
          ${escapeHtml(cancelledAt)}
        </p>`;

  const refundHtml = isBuyer
    ? `<tr><td style="padding:0 24px 16px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#fffaf5;border:1px solid #ffe8d9;border-left:4px solid #d97706;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#b45309;">REFUNDS</p>
            <p style="margin:0;font-size:14px;color:#2d2a26;line-height:1.55;">
              Refunds are reviewed by our team first, usually within 1–2 business days. Once approved, your payment will be refunded to your original payment method — thank you for your patience. If you need urgent help, use the options below.
            </p>
            <p class="hb-refund-contact-line" style="margin:12px 0 0 0;font-size:14px;line-height:1.5;">
              <a href="mailto:${escapeHtml(support)}" class="hb-refund-mailto" style="display:inline-block;color:${brand} !important;font-size:14px;font-weight:600;font-family:Arial,Helvetica,sans-serif;text-decoration:underline !important;text-underline-offset:2px;">
                <font color="${brand}" face="Arial, Helvetica, sans-serif" style="font-size:14px;font-weight:600;text-decoration:underline !important;">${escapeHtml(support)}</font>
              </a>
            </p>
            <p class="hb-refund-contact-line" style="margin:8px 0 0 0;font-size:14px;line-height:1.5;">
              <a href="${escapeHtml(WHATSAPP_URL)}" target="_blank" rel="noopener noreferrer" class="hb-refund-wa-link" style="color:${brand} !important;font-size:14px;font-weight:600;font-family:Arial,Helvetica,sans-serif;text-decoration:none !important;border-bottom:none !important;">
                <span style="color:${brand} !important;font-weight:600;text-decoration:none !important;">WhatsApp ${escapeHtml(WHATSAPP_DISPLAY)}</span>
              </a>
            </p>
          </td></tr>
        </table>
      </td></tr>`
    : `<tr><td style="padding:0 24px 16px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#fffaf5;border:1px solid #ffe8d9;border-left:4px solid #d97706;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#b45309;">REFUNDS</p>
            <p style="margin:0;font-size:14px;color:#2d2a26;line-height:1.55;">
              Process any refund in your payment dashboard (Stripe / PayPal). The buyer may contact
              <a href="mailto:${escapeHtml(support)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(support)}</a>
              or
              <a href="${escapeHtml(WHATSAPP_URL)}" style="color:${brand};font-weight:600;text-decoration:none;">WhatsApp ${escapeHtml(WHATSAPP_DISPLAY)}</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>`;

  const ctaUrl = isBuyer
    ? `${base}/account/orders`
    : `${base}${adminPath(`/orders/${order.id}`)}`;
  const ctaLabel = isBuyer ? "View order history" : "Open order in admin";

  let buyerEngagementRows = "";
  let buyerTextEngagement = "";
  if (isBuyer) {
    const engagement = await buildBuyerTransactionalEmailEngagementBlocks({
      buyerEmail: order.email.trim(),
      baseUrl: base,
      brand,
      ink,
      muted,
      footerContextLine: `This message confirms cancellation for order #${oid}.`,
      whatsappPrefill: `Hi HUMPBUCK — order #${oid} question.`,
    });
    buyerEngagementRows = engagement.rowsHtml;
    buyerTextEngagement = engagement.textAppend;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style type="text/css">
  .hb-refund-mailto,
  .hb-refund-mailto font {
    color: ${brand} !important;
    text-decoration: underline !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  .hb-refund-wa-link,
  .hb-refund-wa-link span {
    color: ${brand} !important;
    text-decoration: none !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    font-family: Arial, Helvetica, sans-serif !important;
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ebe8e2;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ebe8e2;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ddd6;box-shadow:0 4px 24px rgba(20,18,15,0.06);">
      <tr><td bgcolor="#5b4dcb" style="background:linear-gradient(135deg,#5b4dcb 0%,#4338a8 100%);padding:22px 24px 20px 24px;">
        <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.85);">HUMPBUCK</p>
        <p style="margin:0;font-size:20px;font-weight:700;line-height:1.25;color:#ffffff;">${headerTitle}</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.92);">Order <span style="font-weight:600;">#${escapeHtml(oid)}</span></p>
      </td></tr>
      <tr><td style="padding:22px 24px 8px 24px;">
        ${introHtml}
      </td></tr>
      ${refundHtml}
      <tr><td style="padding:8px 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">ORDER DETAILS</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;border:1px solid #ece9e4;border-radius:12px;overflow:hidden;">
          <thead>
            <tr style="background:#faf9f7;">
              <th align="left" style="padding:10px 8px 10px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:76px;">&nbsp;</th>
              <th align="left" style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;">Product</th>
              <th align="center" style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:44px;">Qty</th>
              <th align="right" style="padding:10px 12px 10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:88px;">Total</th>
            </tr>
          </thead>
          <tbody>${lineRows}</tbody>
        </table>
      </td></tr>
      ${orderNotesHtml}
      <tr><td style="padding:8px 24px 8px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:linear-gradient(180deg,#faf9ff 0%,#f5f3ff 100%);border:1px solid #e8e4ff;">
          <tr><td style="padding:16px 18px;">
            <table width="100%" style="font-size:14px;color:${ink};">
              <tr>
                <td align="left" style="padding:0 0 8px 0;font-weight:600;">Order total</td>
                <td align="right" style="padding:0 0 8px 0;font-size:20px;font-weight:700;color:${brand};font-variant-numeric:tabular-nums;">${formatUsdEmail(order.totalCents / 100)}</td>
              </tr>
              <tr>
                <td align="left" style="padding:6px 0 0 0;color:${muted};font-size:13px;">Payment</td>
                <td align="right" style="padding:6px 0 0 0;font-size:13px;font-weight:600;">${escapeHtml(paymentProviderLabel(order.provider))}</td>
              </tr>
              <tr>
                <td align="left" style="padding:6px 0 0 0;color:${muted};font-size:13px;">Traffic</td>
                <td align="right" style="padding:6px 0 0 0;font-size:13px;">${escapeHtml(trafficSourceLabel(order.trafficSource))}</td>
              </tr>
              <tr>
                <td align="left" style="padding:6px 0 0 0;color:${muted};font-size:13px;">Status</td>
                <td align="right" style="padding:6px 0 0 0;font-size:13px;font-weight:600;">Cancelled</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 24px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top" style="padding:0 0 18px 0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
                <tr><td style="padding:14px 14px 12px 14px;">
                  <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">BILLING</p>
                  ${billAddrHtml}
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td valign="top" style="padding:0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
                <tr><td style="padding:14px 14px 12px 14px;">
                  <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">SHIPPING</p>
                  ${shipAddrHtml}
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
          <tr><td align="center">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 28px;background:${brand};color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">${ctaLabel}</a>
          </td></tr>
        </table>
      </td></tr>
      ${buyerEngagementRows}
    </table>
    <p style="margin:20px 0 0 0;font-size:11px;color:#9a9590;text-align:center;max-width:600px;">HUMPBUCK · ${escapeHtml(base.replace(/^https?:\/\//, ""))}</p>
  </td></tr>
</table>
</body></html>`;

  const textRows = lines
    .map(
      (l) =>
        `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty} — ${formatUsdEmail(l.lineTotalCents / 100)}`,
    )
    .join("\n");

  const textCommon = [
    `Placed: ${placed} · Cancelled: ${cancelledAt}`,
    `Total: ${formatUsdEmail(order.totalCents / 100)}`,
    `Payment: ${paymentProviderLabel(order.provider)}`,
    "",
    "Items:",
    textRows,
    order.orderNotes?.trim() ? `\nOrder notes:\n${order.orderNotes.trim()}` : "",
    "",
    "Billing address:",
    addressRowsPlain(billRows, "No billing address on file."),
    "",
    "Shipping address:",
    addressRowsPlain(shipRows, "No shipping address on file."),
    "",
    isBuyer
      ? `Refunds: reviewed by our team first, usually within 1–2 business days. Once approved, payment is refunded to your original payment method — thank you for your patience. If you need urgent help, use the options below.
${support}
WhatsApp ${WHATSAPP_DISPLAY}: ${WHATSAPP_URL}`
      : `Refunds: process in Stripe / PayPal dashboard. Buyer may contact ${support} or WhatsApp ${WHATSAPP_DISPLAY} (${WHATSAPP_URL}).`,
    "",
    `CTA: ${ctaUrl}`,
  ].join("\n");

  const textContent = isBuyer
    ? [`Order #${oid} was cancelled from your account.`, "", textCommon, buyerTextEngagement].join("\n")
    : [
        `Buyer ${order.email} cancelled order #${oid}.`,
        "",
        textCommon,
      ].join("\n");

  const subject = isBuyer
    ? `Order #${oid} cancelled · HUMPBUCK`
    : `Order #${oid} cancelled by buyer · HUMPBUCK`;

  return { subject, htmlContent, textContent };
}

export async function sendOrderCancelledNotifications(orderId: string): Promise<{
  merchantOk: boolean;
  buyerOk: boolean;
  merchantError?: string;
  buyerError?: string;
}> {
  const merchantTo =
    process.env.MERCHANT_NOTIFY_EMAIL?.trim() || DEFAULT_MERCHANT_EMAIL;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "cancelled") {
    return {
      merchantOk: false,
      buyerOk: false,
      merchantError: "Order not found or not cancelled.",
      buyerError: "Order not found or not cancelled.",
    };
  }

  const lines = await parseOrderItemsJson(order.itemsJson);
  const merchantPayload = await buildOrderCancelledEmailPayload(
    order,
    lines,
    "merchant",
  );
  const buyerPayload = await buildOrderCancelledEmailPayload(
    order,
    lines,
    "buyer",
  );

  const m = await sendTransactionalEmail({
    to: merchantTo,
    subject: merchantPayload.subject,
    htmlContent: merchantPayload.htmlContent,
    textContent: merchantPayload.textContent,
  });

  const b = await sendTransactionalEmail({
    to: order.email.trim(),
    subject: buyerPayload.subject,
    htmlContent: buyerPayload.htmlContent,
    textContent: buyerPayload.textContent,
  });

  return {
    merchantOk: m.ok,
    buyerOk: b.ok,
    merchantError: m.ok ? undefined : m.error,
    buyerError: b.ok ? undefined : b.error,
  };
}
