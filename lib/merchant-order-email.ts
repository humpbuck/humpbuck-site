import type { Order } from "@prisma/client";
import {
  formatAddressLines,
  orderDisplayId,
  parseShippingRecord,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { formatPrice, getProductBySlug } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";

const DEFAULT_MERCHANT_EMAIL = "humpbuck@outlook.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function absoluteImageUrl(href: string): string {
  const base = publicBaseUrl();
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

function buildPlainText(order: Order, lines: ReturnType<typeof parseOrderItemsJson>): string {
  const oid = orderDisplayId(order.id);
  const rows = lines
    .map(
      (l) =>
        `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty} — ${formatPrice(l.lineTotalCents / 100)}`,
    )
    .join("\n");
  const ship = parseShippingRecord(order.shippingJson);
  const addr = formatAddressLines(ship);
  return [
    `New paid order #${oid}`,
    `Customer email: ${order.email}`,
    `Total: ${formatPrice(order.totalCents / 100)}`,
    `Payment: ${paymentProviderLabel(order.provider)}`,
    "",
    "Items:",
    rows,
    "",
    addr.length ? `Shipping:\n${addr.join("\n")}` : "No shipping address on file.",
  ].join("\n");
}

function buildHtml(order: Order, lines: ReturnType<typeof parseOrderItemsJson>): string {
  const oid = orderDisplayId(order.id);
  const placed = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const ship = parseShippingRecord(order.shippingJson);
  const addrLines = formatAddressLines(ship);
  const base = publicBaseUrl();

  const lineRows = lines
    .map((l) => {
      const product = getProductBySlug(l.slug);
      const img = product?.image
        ? `<img src="${escapeHtml(absoluteImageUrl(product.image))}" alt="" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;" />`
        : "";
      const title = escapeHtml(l.name);
      const varLabel = l.variantLabel
        ? `<br/><span style="color:#555;font-size:13px;">${escapeHtml(l.variantLabel)}</span>`
        : "";
      return `<tr>
        <td style="padding:12px 8px;vertical-align:top;border-bottom:1px solid #eee;">${img}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;">${title}${varLabel}<br/><span style="color:#888;font-size:12px;">SKU ${escapeHtml(l.slug.toUpperCase())}</span></td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">${l.qty}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${formatPrice(l.lineTotalCents / 100)}</td>
      </tr>`;
    })
    .join("");

  const addrHtml =
    addrLines.length > 0
      ? addrLines.map((l) => `<p style="margin:0 0 4px 0;">${escapeHtml(l)}</p>`).join("")
      : `<p style="color:#666;margin:0;">No structured shipping address (email-only checkout).</p>`;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f6f5f0;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f5f0;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e6e0;">
      <tr><td style="padding:24px 28px 8px 28px;">
        <p style="margin:0;font-size:14px;color:#5b4dcb;font-weight:600;letter-spacing:0.08em;">HUMPBUCK</p>
        <h1 style="margin:12px 0 8px 0;font-size:22px;color:#111;">Payment received — Order #${escapeHtml(oid)}</h1>
        <p style="margin:0;font-size:15px;color:#444;line-height:1.5;">
          <strong>${escapeHtml(order.email)}</strong> has completed payment. Fulfill when ready.
        </p>
      </td></tr>
      <tr><td style="padding:8px 28px 0 28px;">
        <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Order #${escapeHtml(oid)} · ${escapeHtml(placed)}</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="border-bottom:2px solid #ddd;">
              <th align="left" style="padding:8px;">&nbsp;</th>
              <th align="left" style="padding:8px;">Product</th>
              <th align="center" style="padding:8px;">Qty</th>
              <th align="right" style="padding:8px;">Total</th>
            </tr>
          </thead>
          <tbody>${lineRows}</tbody>
        </table>
      </td></tr>
      <tr><td style="padding:16px 28px;">
        <table width="100%" style="font-size:15px;">
          <tr><td align="right" style="padding:4px 0;"><strong>Order total</strong></td><td align="right" width="120" style="padding:4px 0;"><strong>${formatPrice(order.totalCents / 100)}</strong></td></tr>
          <tr><td align="right" style="padding:4px 0;color:#666;">Payment</td><td align="right" style="padding:4px 0;">${escapeHtml(paymentProviderLabel(order.provider))}</td></tr>
          <tr><td align="right" style="padding:4px 0;color:#666;">Traffic source</td><td align="right" style="padding:4px 0;">${escapeHtml(trafficSourceLabel(order.trafficSource))}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 28px 24px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0"><tr>
          <td width="50%" valign="top" style="padding-right:12px;">
            <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;">SHIPPING</p>
            ${addrHtml}
          </td>
          <td width="50%" valign="top" style="padding-left:12px;">
            <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;">CONTACT</p>
            <p style="margin:0;"><a href="mailto:${escapeHtml(order.email)}" style="color:#1a56a8;">${escapeHtml(order.email)}</a></p>
            ${ship?.phone ? `<p style="margin:8px 0 0 0;"><a href="tel:${escapeHtml(ship.phone.replace(/\s/g, ""))}" style="color:#1a56a8;">${escapeHtml(ship.phone)}</a></p>` : ""}
          </td>
        </tr></table>
        <p style="margin:20px 0 0 0;font-size:12px;color:#999;">Open admin: <a href="${escapeHtml(base)}/admin/orders/${escapeHtml(order.id)}" style="color:#1a56a8;">${escapeHtml(base)}/admin/orders/${escapeHtml(order.id)}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/**
 * Sends merchant notification for a paid order (Brevo). Idempotent via merchantNotifySentAt.
 */
export async function notifyMerchantOrderPaid(orderId: string): Promise<void> {
  const to =
    process.env.MERCHANT_NOTIFY_EMAIL?.trim() || DEFAULT_MERCHANT_EMAIL;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "paid") return;
  if (order.merchantNotifySentAt) return;

  const lines = parseOrderItemsJson(order.itemsJson);
  const html = buildHtml(order, lines);
  const text = buildPlainText(order, lines);
  const subject = `New paid order #${orderDisplayId(order.id)} · HUMPBUCK`;

  const result = await sendTransactionalEmail({
    to,
    subject,
    htmlContent: html,
    textContent: text,
  });

  if (result.ok) {
    await prisma.order.update({
      where: { id: orderId },
      data: { merchantNotifySentAt: new Date() },
    });
  } else {
    console.error("[merchant-order-email]", result.error);
  }
}
