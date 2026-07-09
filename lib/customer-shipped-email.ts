import type { Order } from "@prisma/client";
import {
  customerNameFromEmail,
  formatAddressLines,
  formatPhoneInternational,
  orderDisplayCode,
  parseShippingRecord,
  parseStructuredShipping,
  paymentProviderLabel,
} from "@/lib/admin/order-ui";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import {
  getOrCreateUnsubscribeToken,
  isMarketingOptOut,
} from "@/lib/email-marketing-preference";
import {
  buildEmailOrderLineItemRowsHtml,
  EMAIL_ORDER_LINE_ITEMS_TABLE_HEAD,
} from "@/lib/email-line-thumbnail";
import { orderItemsFromOrder } from "@/lib/order-item-display";
import { prisma } from "@/lib/prisma";
import { buildSubscribeMagicUrl } from "@/lib/subscribe-magic-link";
import { trackingUrlForCarrier } from "@/lib/tracking-url";
import { SITE_LOCALE } from "@/lib/site-locale";
import { adminPath } from "@/lib/admin-path";
import { WHATSAPP_DISPLAY, WHATSAPP_E164 } from "@/lib/whatsapp";

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

function supportEmail(): string {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "support@humpbuck.com"
  );
}

function whatsappE164(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_E164?.trim() ||
    process.env.WHATSAPP_E164?.trim();
  if (raw) return raw.replace(/^\+/, "");
  return WHATSAPP_E164;
}

function whatsappDisplayNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY?.trim() || WHATSAPP_DISPLAY;
}

function repeatCouponCode(): string | null {
  const c = process.env.REPEAT_PURCHASE_COUPON_CODE?.trim();
  return c || null;
}

function repeatCouponNote(): string | null {
  const n = process.env.REPEAT_PURCHASE_COUPON_NOTE?.trim();
  return n || null;
}

/**
 * Billing or shipping field table (same layout as admin order page), email-safe HTML.
 * @param whenNoLines — shown when JSON is empty / unparseable (per address role).
 */
export function buildAddressFieldTableHtml(opts: {
  email: string;
  addressJson: string | null;
  whenNoLines: "Same as billing / on file." | "Same as shipping / on file.";
}): string {
  const raw = parseShippingRecord(opts.addressJson);
  const structured = parseStructuredShipping(raw);

  if (!structured) {
    const lines = formatAddressLines(raw);
    if (lines.length === 0) {
      return `<p style="color:#8a8680;margin:0;font-size:14px;">${escapeHtml(opts.whenNoLines)}</p>`;
    }
    return lines
      .map(
        (l) =>
          `<p style="margin:0 0 5px 0;font-size:14px;line-height:1.45;color:#2d2a26;">${escapeHtml(l)}</p>`,
      )
      .join("");
  }

  const phoneIntl = formatPhoneInternational(raw?.phone, raw?.country);
  const phoneDisplay = phoneIntl?.display ?? "Not provided";

  const row = (label: string, value: string, isEmail = false) => {
    const v = escapeHtml(value);
    const content = isEmail
      ? `<a href="mailto:${escapeHtml(opts.email)}" style="color:#5b4dcb;font-weight:500;text-decoration:none;">${v}</a>`
      : `<span style="color:#14120f;">${v}</span>`;
    return `<tr>
      <td style="padding:10px 12px 10px 0;vertical-align:top;border-bottom:1px solid #ece9e4;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#8a8680;width:38%;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #ece9e4;font-size:14px;line-height:1.45;">${content}</td>
    </tr>`;
  };

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
    ${row("Name", structured.name)}
    ${row("Company", structured.company)}
    ${row("Street address", structured.streetAddress)}
    ${row("City", structured.city)}
    ${row("State (full name)", structured.stateFullName)}
    ${row("ZIP code", structured.zip)}
    ${row("Country", structured.country)}
    ${structured.showTaxId ? row(structured.taxIdLabel, structured.taxId) : ""}
    ${row("Phone number", phoneDisplay)}
    ${row("Email", opts.email, true)}
  </table>`;
}

function buildAddressFieldTablePlainText(opts: {
  email: string;
  addressJson: string | null;
  whenNoLines: string;
}): string {
  const raw = parseShippingRecord(opts.addressJson);
  const structured = parseStructuredShipping(raw);
  if (!structured) {
    const lines = formatAddressLines(raw);
    return lines.length ? lines.join("\n") : opts.whenNoLines;
  }
  const phoneIntl = formatPhoneInternational(raw?.phone, raw?.country);
  const phoneDisplay = phoneIntl?.display ?? "Not provided";
  return [
    `Name: ${structured.name}`,
    `Company: ${structured.company}`,
    `Street address: ${structured.streetAddress}`,
    `City: ${structured.city}`,
    `State (full name): ${structured.stateFullName}`,
    `ZIP code: ${structured.zip}`,
    `Country: ${structured.country}`,
    ...(structured.showTaxId
      ? [`${structured.taxIdLabel}: ${structured.taxId}`]
      : []),
    `Phone: ${phoneDisplay}`,
    `Email: ${opts.email}`,
  ].join("\n");
}

/** SHIP TO block: field table like admin order page (email-safe HTML). */
export function buildShipToHtml(order: {
  email: string;
  shippingJson: string | null;
}): string {
  return buildAddressFieldTableHtml({
    email: order.email,
    addressJson: order.shippingJson,
    whenNoLines: "Same as billing / on file.",
  });
}

/** BILL TO — uses billing JSON, falls back to shipping when billing is absent. */
export function buildBillToHtml(order: {
  email: string;
  billingJson: string | null;
  shippingJson: string | null;
}): string {
  return buildAddressFieldTableHtml({
    email: order.email,
    addressJson: order.billingJson ?? order.shippingJson,
    whenNoLines: "Same as shipping / on file.",
  });
}

function buildShipToPlainText(order: {
  email: string;
  shippingJson: string | null;
}): string {
  return buildAddressFieldTablePlainText({
    email: order.email,
    addressJson: order.shippingJson,
    whenNoLines: "(same as billing / on file)",
  });
}

function buildBillToPlainText(order: {
  email: string;
  billingJson: string | null;
  shippingJson: string | null;
}): string {
  return buildAddressFieldTablePlainText({
    email: order.email,
    addressJson: order.billingJson ?? order.shippingJson,
    whenNoLines: "(same as shipping / on file)",
  });
}

async function buildOrderLineItemRowsHtml(
  lines: Awaited<ReturnType<typeof orderItemsFromOrder>>,
): Promise<string> {
  return buildEmailOrderLineItemRowsHtml(lines);
}

export type ShippingAddressChangeEmailAudience = "buyer" | "merchant";

/**
 * Buyer or merchant notification when shipping address changes (no carrier/tracking block).
 * Same layout as post-purchase / shipped emails; English dates via SITE_LOCALE.
 */
export async function buildShippingAddressChangeEmailPayload(
  order: Order,
  oldShipping: Record<string, string> | null,
  newShipping: Record<string, string>,
  audience: ShippingAddressChangeEmailAudience,
  merchantBuyerEmail?: string,
): Promise<{
  subject: string;
  htmlContent: string;
  textContent: string;
}> {
  const isBuyer = audience === "buyer";
  const merchantCustomerEmail = merchantBuyerEmail?.trim() ?? "";
  if (!isBuyer && !merchantCustomerEmail) {
    throw new Error(
      "merchantBuyerEmail is required for merchant shipping-change emails",
    );
  }

  const lines = orderItemsFromOrder(order);
  const oid = orderDisplayCode(order);
  const placed = new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const base = emailPublicBaseUrl();
  const name = customerNameFromEmail(order.email);
  const brand = "#5b4dcb";
  const ink = "#14120f";
  const muted = "#5c5a57";
  const support = supportEmail();
  const wa = whatsappE164();
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi HUMPBUCK — order #${oid} shipping address question.`)}`;
  const waDisplay = whatsappDisplayNumber();

  let marketingBlock = "";
  let unsubUrl = "";
  let marketingOut = true;
  let oneClickSubscribeUrl = `${base}/#newsletter`;
  if (isBuyer) {
    const unsubToken = await getOrCreateUnsubscribeToken(order.email);
    unsubUrl = `${base}/unsubscribe?t=${encodeURIComponent(unsubToken)}`;
    marketingOut = await isMarketingOptOut(order.email);
    const coupon = repeatCouponCode();
    const couponNote = repeatCouponNote();
    try {
      oneClickSubscribeUrl = buildSubscribeMagicUrl(order.email, base);
    } catch {
      oneClickSubscribeUrl = `${base}/#newsletter`;
    }
    const newsletterFallbackUrl = `${base}/#newsletter`;

    marketingBlock = !marketingOut
      ? `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#faf9f7;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">STAY IN THE LOOP</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:${ink};">
              Want restock alerts and product drops? One tap subscribes <strong>${escapeHtml(order.email)}</strong> — no typing. Or use the form on our site anytime.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#14120f" style="border-radius:999px;background-color:#14120f;padding:13px 24px;mso-padding-alt:13px 24px;">
                <a href="${escapeHtml(oneClickSubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Subscribe this email (one tap)</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${muted};">
              <a href="${escapeHtml(newsletterFallbackUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">Open homepage newsletter form</a>
            </p>
            ${
              coupon
                ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;color:${ink};">
              <span style="font-weight:600;">Thank-you code for your next order:</span>
              <span style="font-family:ui-monospace,monospace;font-weight:700;color:${brand};"> ${escapeHtml(coupon)}</span>
              ${couponNote ? `<br/><span style="color:${muted};font-size:13px;">${escapeHtml(couponNote)}</span>` : ""}
            </p>`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>`
      : `<tr><td style="padding:0 24px 16px 24px;">
        <p style="margin:0;font-size:13px;color:${muted};">You're opted out of promotional emails from HUMPBUCK. You'll still receive important order updates like this one.</p>
      </td></tr>`;
  }

  const lineRows = await buildOrderLineItemRowsHtml(lines);

  const newShipHtml = buildShipToHtml({
    email: order.email,
    shippingJson: JSON.stringify(newShipping),
  });
  const prevShipHtml = oldShipping
    ? buildShipToHtml({
        email: order.email,
        shippingJson: JSON.stringify(oldShipping),
      })
    : `<p style="color:#8a8680;margin:0;font-size:14px;">—</p>`;

  const orderUrl = `${base}/account/orders/${encodeURIComponent(order.id)}`;
  const adminUrl = `${base}${adminPath(`/orders/${order.id}`)}`;

  const headerTitle = isBuyer
    ? "Address updated successfully"
    : "Buyer updated shipping address";
  const introHtml = isBuyer
    ? `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          Your <strong>shipping address</strong> for this order has been updated. While your order <strong>has not shipped yet</strong>, you can change the delivery address from your account. After it ships, the address can no longer be edited here.
        </p>
        <p style="margin:0;padding:10px 14px;background:#f7f6f3;border-radius:10px;font-size:13px;color:${muted};">
          <a href="${escapeHtml(orderUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">View this order</a>
        </p>`
    : `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          <a href="mailto:${escapeHtml(merchantCustomerEmail)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(merchantCustomerEmail)}</a>
          <span style="color:${muted};"> updated the shipping address for this order. Review the line items and the new ship-to below before fulfillment.</span>
        </p>
        <p style="margin:0;padding:10px 14px;background:#f7f6f3;border-radius:10px;font-size:13px;color:${muted};">
          <a href="${escapeHtml(adminUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">Open order in admin</a>
        </p>`;

  const securityBlockHtml = isBuyer
    ? `<tr><td style="padding:0 24px 16px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#fffaf5;border:1px solid #ffe8d9;border-left:4px solid #d97706;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#b45309;">DID YOU MAKE THIS CHANGE?</p>
            <p style="margin:0;font-size:14px;color:#2d2a26;line-height:1.55;">If you did not update your shipping address, email <a href="mailto:${escapeHtml(support)}" style="color:${brand};font-weight:600;text-decoration:none;">${escapeHtml(support)}</a> right away.</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const helpBlockHtml = isBuyer
    ? `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#ffffff;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">NEED HELP?</p>
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:${ink};">
              Reply anytime or email <a href="mailto:${escapeHtml(support)}" style="color:${brand} !important;font-size:14px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(support)}</a>.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#25D366" style="border-radius:999px;background-color:#25D366;padding:12px 22px;mso-padding-alt:12px 22px;">
                <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Message us on WhatsApp</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${muted};">WhatsApp: <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="color:${brand} !important;font-size:12px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(waDisplay)}</a></p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const footerHtml = isBuyer
    ? `This message confirms a <strong>shipping address update</strong> for order #${escapeHtml(oid)}. It is not a shipment notification.
          ${!marketingOut ? `<br/><a href="${escapeHtml(unsubUrl)}" style="color:${muted};">Unsubscribe from promotional &amp; newsletter emails</a>` : ""}`
    : `Operational notice: the buyer updated the <strong>shipping address</strong> on order #${escapeHtml(oid)}. This is not a shipment confirmation.`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
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
      <tr><td style="padding:8px 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">ORDER DETAILS</p>
        <p style="margin:0 0 12px 0;font-size:13px;color:${muted};">Placed ${escapeHtml(placed)} · ${escapeHtml(paymentProviderLabel(order.provider))}</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;border:1px solid #ece9e4;border-radius:12px;overflow:hidden;">
          ${EMAIL_ORDER_LINE_ITEMS_TABLE_HEAD}
          <tbody>${lineRows}</tbody>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 8px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:linear-gradient(180deg,#faf9ff 0%,#f5f3ff 100%);border:1px solid #e8e4ff;">
          <tr><td style="padding:16px 18px;">
            <table width="100%" style="font-size:14px;color:${ink};">
              <tr>
                <td align="left" style="padding:0 0 8px 0;font-weight:600;">Order total</td>
                <td align="right" style="padding:0 0 8px 0;font-size:20px;font-weight:700;color:${brand};font-variant-numeric:tabular-nums;">${formatUsdEmail(order.totalCents / 100)}</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">SHIP TO</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
          <tr><td style="padding:14px 14px 12px 14px;">${newShipHtml}</td></tr>
        </table>
        <p style="margin:16px 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">PREVIOUS SHIP TO (FOR YOUR RECORDS)</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
          <tr><td style="padding:14px 14px 12px 14px;">${prevShipHtml}</td></tr>
        </table>
      </td></tr>
      ${securityBlockHtml}
      ${helpBlockHtml}
      ${marketingBlock}
      <tr><td style="padding:16px 24px 24px 24px;border-top:1px solid #ece9e4;">
        <p style="margin:0;font-size:11px;line-height:1.55;color:#a8a49e;text-align:center;">
          ${footerHtml}
        </p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:11px;color:#9a9590;text-align:center;max-width:600px;">HUMPBUCK · ${escapeHtml(base.replace(/^https?:\/\//, ""))}</p>
  </td></tr>
</table>
</body></html>`;

  const textLines = lines
    .map(
      (l) =>
        `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty} — ${formatUsdEmail(l.lineTotalCents / 100)}`,
    )
    .join("\n");

  const sharedDetailLines = [
    `Placed: ${placed}`,
    `Total: ${formatUsdEmail(order.totalCents / 100)}`,
    `Payment: ${paymentProviderLabel(order.provider)}`,
    "",
    "Items:",
    textLines,
    "",
    "New ship to:",
    buildShipToPlainText({ email: order.email, shippingJson: JSON.stringify(newShipping) }),
    "",
    "Previous ship to:",
    oldShipping
      ? buildShipToPlainText({
          email: order.email,
          shippingJson: JSON.stringify(oldShipping),
        })
      : "—",
  ];

  const textContent = isBuyer
    ? [
        `Hi ${name},`,
        "",
        `Your shipping address for HUMPBUCK order #${oid} was updated.`,
        "This email is not a shipment notification — your order has not shipped yet.",
        "",
        `View order: ${orderUrl}`,
        "",
        ...sharedDetailLines,
        "",
        `Support: ${support}`,
        `WhatsApp: ${waDisplay} — ${waUrl}`,
        "",
        `If you did not update your address: ${support}`,
        "",
        !marketingOut
          ? [
              `One-tap subscribe: ${oneClickSubscribeUrl}`,
              `Unsubscribe from promotional: ${unsubUrl}`,
            ].join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `Buyer updated shipping address for order #${oid}.`,
        "",
        `Customer: ${merchantCustomerEmail}`,
        "This is not a shipment confirmation — review before fulfillment.",
        "",
        `Admin: ${adminUrl}`,
        "",
        ...sharedDetailLines,
      ].join("\n");

  const subject = isBuyer
    ? `Order #${oid} — shipping address updated · HUMPBUCK`
    : `Order #${oid} — buyer updated shipping address · HUMPBUCK`;

  return { subject, htmlContent, textContent };
}

export async function buildBuyerAddressUpdatedEmailPayload(
  order: Order,
  oldShipping: Record<string, string> | null,
  newShipping: Record<string, string>,
): Promise<{
  subject: string;
  htmlContent: string;
  textContent: string;
}> {
  return buildShippingAddressChangeEmailPayload(
    order,
    oldShipping,
    newShipping,
    "buyer",
  );
}

export async function buildCustomerShippedEmailPayload(order: Order): Promise<{
  subject: string;
  htmlContent: string;
  textContent: string;
}> {
  const lines = orderItemsFromOrder(order);
  const oid = orderDisplayCode(order);
  const placed = new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const carrier = order.carrier?.trim() || "";
  const tracking = order.trackingNumber?.trim() || "";
  const track = trackingUrlForCarrier(carrier || "Courier", tracking);
  const base = emailPublicBaseUrl();
  const unsubToken = await getOrCreateUnsubscribeToken(order.email);
  const unsubUrl = `${base}/unsubscribe?t=${encodeURIComponent(unsubToken)}`;
  const marketingOut = await isMarketingOptOut(order.email);
  const name = customerNameFromEmail(order.email);
  const brand = "#5b4dcb";
  const ink = "#14120f";
  const muted = "#5c5a57";
  const support = supportEmail();
  const wa = whatsappE164();
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi HUMPBUCK — order #${oid} shipping question.`)}`;
  const waDisplay = whatsappDisplayNumber();
  const coupon = repeatCouponCode();
  const couponNote = repeatCouponNote();
  let oneClickSubscribeUrl: string;
  try {
    oneClickSubscribeUrl = buildSubscribeMagicUrl(order.email, base);
  } catch {
    oneClickSubscribeUrl = `${base}/#newsletter`;
  }
  const newsletterFallbackUrl = `${base}/#newsletter`;

  const lineRows = await buildOrderLineItemRowsHtml(lines);

  const billAddrHtml = buildBillToHtml(order);
  const shipAddrHtml = buildShipToHtml(order);

  const marketingBlock = !marketingOut
    ? `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#faf9f7;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">STAY IN THE LOOP</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:${ink};">
              Want restock alerts and product drops? One tap subscribes <strong>${escapeHtml(order.email)}</strong> — no typing. Or use the form on our site anytime.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#14120f" style="border-radius:999px;background-color:#14120f;padding:13px 24px;mso-padding-alt:13px 24px;">
                <a href="${escapeHtml(oneClickSubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Subscribe this email (one tap)</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${muted};">
              <a href="${escapeHtml(newsletterFallbackUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">Open homepage newsletter form</a>
            </p>
            ${
              coupon
                ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;color:${ink};">
              <span style="font-weight:600;">Thank-you code for your next order:</span>
              <span style="font-family:ui-monospace,monospace;font-weight:700;color:${brand};"> ${escapeHtml(coupon)}</span>
              ${couponNote ? `<br/><span style="color:${muted};font-size:13px;">${escapeHtml(couponNote)}</span>` : ""}
            </p>`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>`
    : `<tr><td style="padding:0 24px 16px 24px;">
        <p style="margin:0;font-size:13px;color:${muted};">You're opted out of promotional emails from HUMPBUCK. You'll still receive important order updates like this one.</p>
      </td></tr>`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ebe8e2;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ebe8e2;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ddd6;box-shadow:0 4px 24px rgba(20,18,15,0.06);">
      <tr><td bgcolor="#5b4dcb" style="background:linear-gradient(135deg,#5b4dcb 0%,#4338a8 100%);padding:22px 24px 20px 24px;">
        <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.85);">HUMPBUCK</p>
        <p style="margin:0;font-size:20px;font-weight:700;line-height:1.25;color:#ffffff;">Your order has shipped</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.92);">Order <span style="font-weight:600;">#${escapeHtml(oid)}</span></p>
      </td></tr>
      <tr><td style="padding:22px 24px 8px 24px;">
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:${ink};">
          Your package is on the way. Use the button below to track delivery. Carrier scans can take up to 24 hours to appear.
        </p>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;border-radius:12px;background:#f7f6f3;border:1px solid #ece9e4;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">SHIPMENT</p>
            <p style="margin:0;font-size:14px;color:${ink};"><strong>${escapeHtml(carrier)}</strong></p>
            <p style="margin:8px 0 0 0;font-size:14px;font-family:ui-monospace,monospace;color:${ink};">${escapeHtml(tracking)}</p>
            <table cellspacing="0" cellpadding="0" style="margin-top:14px;"><tr>
              <td align="center" bgcolor="#5b4dcb" style="border-radius:999px;background-color:#5b4dcb;padding:12px 24px;mso-padding-alt:12px 24px;">
                <a href="${escapeHtml(track.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Track your package (${escapeHtml(track.label)})</span>
                </a>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">ORDER DETAILS</p>
        <p style="margin:0 0 12px 0;font-size:13px;color:${muted};">Placed ${escapeHtml(placed)} · ${escapeHtml(paymentProviderLabel(order.provider))}</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;border:1px solid #ece9e4;border-radius:12px;overflow:hidden;">
          ${EMAIL_ORDER_LINE_ITEMS_TABLE_HEAD}
          <tbody>${lineRows}</tbody>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 8px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:linear-gradient(180deg,#faf9ff 0%,#f5f3ff 100%);border:1px solid #e8e4ff;">
          <tr><td style="padding:16px 18px;">
            <table width="100%" style="font-size:14px;color:${ink};">
              <tr>
                <td align="left" style="padding:0 0 8px 0;font-weight:600;">Order total</td>
                <td align="right" style="padding:0 0 8px 0;font-size:20px;font-weight:700;color:${brand};font-variant-numeric:tabular-nums;">${formatUsdEmail(order.totalCents / 100)}</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 8px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">BILL TO</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
          <tr><td style="padding:14px 14px 12px 14px;">${billAddrHtml}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 16px 24px;">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">SHIP TO</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border-radius:12px;border:1px solid #ece9e4;">
          <tr><td style="padding:14px 14px 12px 14px;">${shipAddrHtml}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#ffffff;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">NEED HELP?</p>
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:${ink};">
              Reply anytime or email <a href="mailto:${escapeHtml(support)}" style="color:${brand} !important;font-size:14px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(support)}</a>.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#25D366" style="border-radius:999px;background-color:#25D366;padding:12px 22px;mso-padding-alt:12px 22px;">
                <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Message us on WhatsApp</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${muted};">WhatsApp: <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="color:${brand} !important;font-size:12px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(waDisplay)}</a></p>
          </td></tr>
        </table>
      </td></tr>
      ${marketingBlock}
      <tr><td style="padding:16px 24px 24px 24px;border-top:1px solid #ece9e4;">
        <p style="margin:0;font-size:11px;line-height:1.55;color:#a8a49e;text-align:center;">
          This message confirms shipment for order #${escapeHtml(oid)}.
          ${!marketingOut ? `<br/><a href="${escapeHtml(unsubUrl)}" style="color:${muted};">Unsubscribe from promotional &amp; newsletter emails</a>` : ""}
        </p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:11px;color:#9a9590;text-align:center;max-width:600px;">HUMPBUCK · ${escapeHtml(base.replace(/^https?:\/\//, ""))}</p>
  </td></tr>
</table>
</body></html>`;

  const textLines = lines
    .map(
      (l) =>
        `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty} — ${formatUsdEmail(l.lineTotalCents / 100)}`,
    )
    .join("\n");

  const textContent = [
    `Hi ${name},`,
    "",
    `Your HUMPBUCK order #${oid} has shipped.`,
    "",
    `Carrier: ${carrier}`,
    `Tracking: ${tracking}`,
    `Track: ${track.url}`,
    "",
    `Placed: ${placed}`,
    `Total: ${formatUsdEmail(order.totalCents / 100)}`,
    `Payment: ${paymentProviderLabel(order.provider)}`,
    "",
    "Items:",
    textLines,
    "",
    `Bill to:\n${buildBillToPlainText(order)}`,
    "",
    `Ship to:\n${buildShipToPlainText(order)}`,
    "",
    `Support: ${support}`,
    `WhatsApp: ${waDisplay} — ${waUrl}`,
    "",
    !marketingOut
      ? [
          `One-tap subscribe (this email): ${oneClickSubscribeUrl}`,
          `Homepage form: ${newsletterFallbackUrl}`,
          coupon ? `Next-order code: ${coupon}${couponNote ? ` (${couponNote})` : ""}` : "",
          "",
          `Unsubscribe from promotional emails: ${unsubUrl}`,
        ]
          .filter(Boolean)
          .join("\n")
      : "You've opted out of promotional emails (order updates will still be sent).",
    "",
    `Order reference: ${order.id}`,
  ].join("\n");

  const subject = `Your HUMPBUCK order #${oid} has shipped`;

  return { subject, htmlContent, textContent };
}

export type ShipmentNotifyOutcome =
  | { sent: true }
  | {
      sent: false;
      reason:
        | "not_found"
        | "status_not_shipped"
        | "missing_carrier_or_tracking"
        | "already_sent"
        | "brevo_failed"
        | "build_failed";
      detail?: string;
    };

/** Works even when the generated Prisma client is missing `customerShippedEmailSentAt` on `Order`. */
async function orderAlreadyHadShippedEmail(orderId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ customerShippedEmailSentAt: unknown }>>`
    SELECT "customerShippedEmailSentAt" FROM "Order" WHERE "id" = ${orderId}
  `;
  return rows[0]?.customerShippedEmailSentAt != null;
}

async function markOrderCustomerShippedEmailSent(orderId: string): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "Order"
    SET "customerShippedEmailSentAt" = ${now}, "updatedAt" = ${now}
    WHERE "id" = ${orderId}
  `;
}

/**
 * Sends buyer shipment notification (Brevo). Idempotent via customerShippedEmailSentAt.
 * Pass `orderAfterUpdate` from the same request as `prisma.order.update` so gates use the row you just wrote.
 */
export async function notifyCustomerOrderShipped(
  orderId: string,
  orderAfterUpdate?: Order | null,
): Promise<ShipmentNotifyOutcome> {
  const order =
    orderAfterUpdate ??
    (await prisma.order.findUnique({ where: { id: orderId } }));
  if (!order) return { sent: false, reason: "not_found" };
  if (order.status !== "shipped") {
    return { sent: false, reason: "status_not_shipped" };
  }
  if (!order.carrier?.trim() || !order.trackingNumber?.trim()) {
    return { sent: false, reason: "missing_carrier_or_tracking" };
  }
  if (await orderAlreadyHadShippedEmail(orderId)) {
    return { sent: false, reason: "already_sent" };
  }

  let subject: string;
  let htmlContent: string;
  let textContent: string;
  try {
    const payload = await buildCustomerShippedEmailPayload(order);
    subject = payload.subject;
    htmlContent = payload.htmlContent;
    textContent = payload.textContent;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[customer-shipped-email] build_failed", e);
    return { sent: false, reason: "build_failed", detail: msg };
  }

  const result = await sendTransactionalEmail({
    to: order.email,
    subject,
    htmlContent,
    textContent,
  });

  if (result.ok) {
    await markOrderCustomerShippedEmailSent(orderId);
    return { sent: true };
  }

  console.error("[customer-shipped-email]", result.error);
  return {
    sent: false,
    reason: "brevo_failed",
    detail: result.error,
  };
}
