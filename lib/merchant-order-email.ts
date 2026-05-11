import type { Order } from "@prisma/client";
import {
  formatAddressLines,
  formatPhoneInternational,
  orderDisplayCode,
  parseShippingRecord,
  parseStructuredShipping,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";
import { buildShippingAddressChangeEmailPayload } from "@/lib/customer-shipped-email";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { getProductBySlug } from "@/lib/catalog";
import { getR2VariantLineImageUrl } from "@/lib/r2-line-image";
import { orderItemsFromOrder } from "@/lib/order-item-display";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { prisma } from "@/lib/prisma";
import { SITE_LOCALE } from "@/lib/site-locale";
import { adminPath } from "@/lib/admin-path";

const DEFAULT_MERCHANT_EMAIL = "humpbuck@outlook.com";

/** USD for transactional email (avoid de-DE rounding quirks in formatPrice). */
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

/**
 * “Field name | Content” table (same data model as admin order page), email-safe.
 */
function emailAddressFieldsTable(
  orderEmail: string,
  raw: Record<string, string> | null,
  sectionLabel: "BILLING" | "SHIPPING",
  brand: string,
  ink: string,
): string {
  const structured = parseStructuredShipping(raw);
  if (!structured) {
    const lines = formatAddressLines(raw);
    if (!lines.length) {
      return `<p style="color:#8a8680;margin:0;font-size:14px;">No ${sectionLabel === "BILLING" ? "billing" : "shipping"} address on file.</p>`;
    }
    return lines
      .map(
        (l) =>
          `<p style="margin:0 0 5px 0;font-size:14px;line-height:1.45;color:${ink};">${escapeHtml(l)}</p>`,
      )
      .join("");
  }

  const phoneHint = structured.country || raw?.country;
  const phoneIntl = formatPhoneInternational(raw?.phone, phoneHint);
  const em = orderEmail.trim();

  const cell = (value: string) =>
    escapeHtml(value).replace(/\n/g, "<br/>");

  const valPhone =
    phoneIntl != null
      ? `<a href="${escapeHtml(phoneIntl.telHref)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(phoneIntl.display)}</a>`
      : `<span style="color:#8a8680;">Not provided</span>`;

  const valEmail = `<a href="mailto:${escapeHtml(em)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(em)}</a>`;

  const row = (fieldLabel: string, inner: string) =>
    `<tr>
      <td style="padding:10px 12px;vertical-align:top;border-bottom:1px solid #ece9e4;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a8680;width:40%;">${fieldLabel}</td>
      <td style="padding:10px 12px;vertical-align:top;border-bottom:1px solid #ece9e4;font-size:14px;line-height:1.45;color:${ink};">${inner}</td>
    </tr>`;

  const thead = `<thead>
    <tr style="background:#faf9f7;">
      <th align="left" style="padding:10px 12px;font-size:11px;font-weight:600;color:#14120f;border-bottom:1px solid #ece9e4;">Field name</th>
      <th align="left" style="padding:10px 12px;font-size:11px;font-weight:600;color:#14120f;border-bottom:1px solid #ece9e4;">Content</th>
    </tr>
  </thead>`;

  const tbody = `<tbody>
    ${row("Name", cell(structured.name))}
    ${row("Company", cell(structured.company))}
    ${row("Street address", cell(structured.streetAddress))}
    ${row("City", cell(structured.city))}
    ${row("State (full name)", cell(structured.stateFullName))}
    ${row("ZIP code", cell(structured.zip))}
    ${row("Country", cell(structured.country))}
    ${row("Phone number", valPhone)}
    ${row("Email", valEmail)}
  </tbody>`;

  return `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;border:1px solid #ece9e4;border-radius:10px;overflow:hidden;">
  ${thead}
  ${tbody}
</table>`;
}

function absoluteImageUrl(href: string): string {
  const base = emailPublicBaseUrl();
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

async function buildPlainText(order: Order, lines: Awaited<ReturnType<typeof orderItemsFromOrder>>): Promise<string> {
  const oid = orderDisplayCode(order);
  const rows = lines
    .map(
      (l) =>
        `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty} — ${formatUsdEmail(l.lineTotalCents / 100)}`,
    )
    .join("\n");
  const bill = parseShippingRecord(
    order.billingJson ?? order.shippingJson,
  );
  const ship = parseShippingRecord(order.shippingJson);
  const billLines = formatAddressLines(bill);
  const shipLines = formatAddressLines(ship);
  const parts = [
    `New paid order #${oid}`,
    `Customer email: ${order.email}`,
    `Total: ${formatUsdEmail(order.totalCents / 100)}`,
    `Payment: ${paymentProviderLabel(order.provider)}`,
    "",
    "Items:",
    rows,
    "",
    billLines.length
      ? `Billing:\n${billLines.join("\n")}`
      : "No billing address on file.",
    "",
    shipLines.length
      ? `Shipping:\n${shipLines.join("\n")}`
      : "No shipping address on file.",
  ];
  if (order.orderNotes?.trim()) {
    parts.push("", "Order notes:", order.orderNotes.trim());
  }
  return parts.join("\n");
}

async function buildHtml(order: Order, lines: Awaited<ReturnType<typeof parseOrderItemsJson>>): Promise<string> {
  const oid = orderDisplayCode(order);
  const placed = new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const bill = parseShippingRecord(
    order.billingJson ?? order.shippingJson,
  );
  const ship = parseShippingRecord(order.shippingJson);
  const base = emailPublicBaseUrl();
  const brand = "#5b4dcb";
  const ink = "#14120f";
  const muted = "#5c5a57";

  const billAddrHtml = emailAddressFieldsTable(
    order.email,
    bill,
    "BILLING",
    brand,
    ink,
  );
  const shipAddrHtml = emailAddressFieldsTable(
    order.email,
    ship,
    "SHIPPING",
    brand,
    ink,
  );

  const lineRows = lines
    .map((l) => {
      const product = getProductBySlug(l.slug);
      const imgSrc = l.variantImage || getR2VariantLineImageUrl(l.slug, l.variantId) || product?.image || "";
      const img = imgSrc
        ? `<img src="${escapeHtml(absoluteImageUrl(imgSrc))}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #ece9e4;background:#f7f6f3;" />`
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
    ? `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#faf9ff;border:1px solid #e8e4ff;border-left:4px solid #5b4dcb;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#5b4dcb;">ORDER NOTES</p>
            <p style="margin:0;font-size:14px;color:#2d2a26;line-height:1.55;white-space:pre-wrap;">${escapeHtml(order.orderNotes.trim())}</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ebe8e2;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ebe8e2;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <tr><td align="center">
    <!--[if mso]><table width="600" align="center"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ddd6;box-shadow:0 4px 24px rgba(20,18,15,0.06);">
      <tr><td bgcolor="#5b4dcb" style="background:linear-gradient(135deg,#5b4dcb 0%,#4338a8 100%);padding:22px 24px 20px 24px;">
        <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.85);">HUMPBUCK</p>
        <p style="margin:0;font-size:20px;font-weight:700;line-height:1.25;color:#ffffff;">Payment received</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.92);">Order <span style="font-weight:600;">#${escapeHtml(oid)}</span></p>
      </td></tr>
      <tr><td style="padding:22px 24px 8px 24px;">
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          <a href="mailto:${escapeHtml(order.email)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(order.email)}</a>
          <span style="color:${muted};"> has paid. Ship when ready.</span>
        </p>
        <p style="margin:0;padding:10px 14px;background:#f7f6f3;border-radius:10px;font-size:13px;color:${muted};">
          <span style="color:${ink};font-weight:600;">${escapeHtml(oid)}</span>
          <span style="color:#b0aca5;"> · </span>
          ${escapeHtml(placed)}
        </p>
      </td></tr>
      <tr><td style="padding:0 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">LINE ITEMS</p>
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
      <tr><td style="padding:16px 24px 8px 24px;">
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
            <a href="${escapeHtml(`${base}${adminPath(`/orders/${order.id}`)}`)}" style="display:inline-block;padding:12px 28px;background:${brand};color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">Open order in admin</a>
          </td></tr>
          <tr><td align="center" style="padding-top:12px;">
            <p style="margin:0;font-size:11px;color:#a8a49e;word-break:break-all;">${escapeHtml(`${base}${adminPath(`/orders/${order.id}`)}`)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
    <p style="margin:20px 0 0 0;font-size:11px;color:#9a9590;text-align:center;max-width:600px;">You are receiving this because new orders notify this inbox.</p>
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

  const lines = orderItemsFromOrder(order);
  const html = await buildHtml(order, lines);
  const text = await buildPlainText(order, lines);
  const subject = `New paid order #${orderDisplayCode(order)} · HUMPBUCK`;

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

/**
 * Buyer updated shipping on a paid/processing order (account center).
 * The API skips calling this when the address body is unchanged from the stored record.
 */
export async function notifyMerchantBuyerUpdatedShippingAddress(params: {
  orderId: string;
  buyerEmail: string;
  oldShipping: Record<string, string> | null;
  newShipping: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const to =
    process.env.MERCHANT_NOTIFY_EMAIL?.trim() || DEFAULT_MERCHANT_EMAIL;

  const order = await prisma.order.findFirst({
    where: { id: params.orderId },
  });
  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  let payload: Awaited<ReturnType<typeof buildShippingAddressChangeEmailPayload>>;
  try {
    payload = await buildShippingAddressChangeEmailPayload(
      order,
      params.oldShipping,
      params.newShipping,
      "merchant",
      params.buyerEmail,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  return sendTransactionalEmail({
    to,
    subject: payload.subject,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent,
  });
}

/**
 * Confirmation to the buyer after they change shipping in My Account.
 * Uses the same layout as the “order shipped” email (no carrier/tracking block).
 */
export async function notifyBuyerShippingAddressUpdated(params: {
  orderId: string;
  buyerEmail: string;
  oldShipping: Record<string, string> | null;
  newShipping: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = params.buyerEmail?.trim().toLowerCase();
  if (!to) {
    return { ok: false, error: "No buyer email on file." };
  }

  const order = await prisma.order.findFirst({
    where: { id: params.orderId },
  });
  if (!order) {
    return { ok: false, error: "Order not found." };
  }
  if (order.email.trim().toLowerCase() !== to) {
    return { ok: false, error: "Buyer email does not match order." };
  }
  if (order.status === "shipped" || order.trackingNumber?.trim()) {
    return {
      ok: false,
      error: "Order already shipped; buyer address confirmation skipped.",
    };
  }

  let payload: Awaited<ReturnType<typeof buildShippingAddressChangeEmailPayload>>;
  try {
    payload = await buildShippingAddressChangeEmailPayload(
      order,
      params.oldShipping,
      params.newShipping,
      "buyer",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  return sendTransactionalEmail({
    to,
    subject: payload.subject,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent,
  });
}
