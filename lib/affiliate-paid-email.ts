import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { getProductBySlug, getCartLineImage } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_E164 } from "@/lib/whatsapp";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function abs(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = emailPublicBaseUrl();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function sendAffiliatePaidSummaryEmail(input: {
  to: string;
  affiliateName: string;
  affiliateLoginUrl: string;
  ledgers: Array<{
    orderId: string;
    commissionCents: number;
    paidAt: Date | null;
    payoutBatchId?: string | null;
    payoutTxnRef?: string | null;
    paidNote?: string | null;
    itemsJson: string;
  }>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.ledgers.length) return { ok: false, error: "No paid ledgers to notify." };
  const base = emailPublicBaseUrl();
  const waUrl = `https://wa.me/${WHATSAPP_E164}`;
  const supportEmail = publicSupportEmail();
  const orderRows = input.ledgers
    .map((l) => {
      const lines = parseOrderItemsJson(l.itemsJson);
      const itemCards = lines
        .map((line) => {
          const p = getProductBySlug(line.slug);
          const imgSrc = p ? getCartLineImage(p, line.variantId) : "";
          const img = imgSrc
            ? `<img src="${esc(abs(imgSrc))}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #ece9e4;background:#f7f6f3;" />`
            : `<div style="width:56px;height:56px;border-radius:8px;background:#ece9e4;border:1px solid #e0ddd6;"></div>`;
          const productUrl = `${base}/product/${encodeURIComponent(line.slug)}`;
          return `<tr>
            <td style="padding:8px;vertical-align:top;">${img}</td>
            <td style="padding:8px;vertical-align:top;">
              <a href="${esc(productUrl)}" style="color:#5b4dcb;text-decoration:none;font-weight:600;">${esc(line.name)}</a>
              ${line.variantLabel ? `<br/><span style="font-size:12px;color:#666;">${esc(line.variantLabel)}</span>` : ""}
            </td>
            <td style="padding:8px;vertical-align:top;text-align:center;color:#666;">x${line.qty}</td>
          </tr>`;
        })
        .join("");
      return `<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece9e4;border-radius:12px;overflow:hidden;margin:0 0 14px 0;background:#fff;">
        <tr><td style="padding:12px 14px;background:#faf9f7;border-bottom:1px solid #ece9e4;">
          <p style="margin:0;font-size:14px;color:#14120f;font-weight:700;">Order #${esc(l.orderId.slice(-8))}</p>
          <p style="margin:6px 0 0 0;font-size:12px;color:#5c5a57;">
            Commission paid: ${money(l.commissionCents)}
            ${l.paidAt ? ` · ${esc(l.paidAt.toLocaleDateString())}` : ""}
            ${l.payoutBatchId ? ` · Batch ${esc(l.payoutBatchId)}` : ""}
            ${l.payoutTxnRef ? ` · Ref ${esc(l.payoutTxnRef)}` : ""}
          </p>
          ${l.paidNote ? `<p style="margin:6px 0 0 0;font-size:12px;color:#5c5a57;">Note: ${esc(l.paidNote)}</p>` : ""}
        </td></tr>
        ${itemCards}
      </table>`;
    })
    .join("");

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ebe8e2;font-family:Arial,sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e0ddd6;border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#5b4dcb 0%,#4338a8 100%);padding:22px 24px;color:#fff;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;font-weight:700;">HUMPBUCK</p>
        <p style="margin:8px 0 0 0;font-size:22px;font-weight:700;">Commission paid notice</p>
      </td></tr>
      <tr><td style="padding:18px 24px;">
        <p style="margin:0 0 10px 0;font-size:14px;color:#14120f;">Hi ${esc(input.affiliateName || "Affiliate")}, we have marked the following commissions as paid.</p>
        ${orderRows}
        <p style="margin:10px 0 0 0;">
          <a href="${esc(input.affiliateLoginUrl)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#14120f;color:#fff;text-decoration:none;font-size:13px;font-weight:600;">Log in to affiliate center</a>
        </p>
        <p style="margin:14px 0 0 0;font-size:13px;color:#5c5a57;line-height:1.5;">
          Need help? Contact us by email <a href="mailto:${esc(supportEmail)}" style="color:#5b4dcb;text-decoration:none;">${esc(supportEmail)}</a>
          or WhatsApp <a href="${esc(waUrl)}" style="color:#5b4dcb;text-decoration:none;">${esc(WHATSAPP_DISPLAY)}</a>.
        </p>
      </td></tr>
    </table>
  </body></html>`;

  const text = [
    "HUMPBUCK commission paid notice",
    "",
    `Hi ${input.affiliateName || "Affiliate"},`,
    "We have marked these orders as paid commissions:",
    ...input.ledgers.map((l) => `- #${l.orderId.slice(-8)}: ${money(l.commissionCents)}`),
    "",
    `Affiliate center: ${input.affiliateLoginUrl}`,
    `Contact: ${supportEmail} | WhatsApp ${WHATSAPP_DISPLAY}`,
  ].join("\n");

  return sendTransactionalEmail({
    to: input.to,
    subject: `Commission paid update · ${input.ledgers.length} order(s)`,
    htmlContent: html,
    textContent: text,
  });
}
