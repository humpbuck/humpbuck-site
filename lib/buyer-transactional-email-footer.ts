import {
  getOrCreateUnsubscribeToken,
  isMarketingOptOut,
} from "@/lib/email-marketing-preference";
import { buildSubscribeMagicUrl } from "@/lib/subscribe-magic-link";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function repeatCouponCode(): string | null {
  const c = process.env.REPEAT_PURCHASE_COUPON_CODE?.trim();
  return c || null;
}

function repeatCouponNote(): string | null {
  const n = process.env.REPEAT_PURCHASE_COUPON_NOTE?.trim();
  return n || null;
}

function waDisplay(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY?.trim() || WHATSAPP_DISPLAY
  );
}

/**
 * NEED HELP?, STAY IN THE LOOP (if not opted out), and transactional footer —
 * same pattern as the “order shipped” buyer email.
 */
export async function buildBuyerTransactionalEmailEngagementBlocks(opts: {
  buyerEmail: string;
  baseUrl: string;
  brand: string;
  ink: string;
  muted: string;
  /** One line, plain text — will be escaped (e.g. order reference). */
  footerContextLine: string;
  /** Optional WhatsApp pre-filled message. */
  whatsappPrefill?: string;
}): Promise<{ rowsHtml: string; textAppend: string }> {
  const support = publicSupportEmail();
  const prefill =
    opts.whatsappPrefill?.trim() ||
    "Hi HUMPBUCK — I have a question about my order.";
  const waUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(prefill)}`;
  const waLabel = waDisplay();

  const unsubToken = await getOrCreateUnsubscribeToken(opts.buyerEmail);
  const unsubUrl = `${opts.baseUrl}/unsubscribe?t=${encodeURIComponent(unsubToken)}`;
  const marketingOut = await isMarketingOptOut(opts.buyerEmail);
  const coupon = repeatCouponCode();
  const couponNote = repeatCouponNote();

  let oneClickSubscribeUrl: string;
  try {
    oneClickSubscribeUrl = buildSubscribeMagicUrl(opts.buyerEmail, opts.baseUrl);
  } catch {
    oneClickSubscribeUrl = `${opts.baseUrl}/#newsletter`;
  }
  const newsletterFallbackUrl = `${opts.baseUrl}/#newsletter`;

  const helpRow = `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#ffffff;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">NEED HELP?</p>
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:${opts.ink};">
              Reply anytime or email <a href="mailto:${escapeHtml(support)}" style="color:${opts.brand} !important;font-size:14px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(support)}</a>.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#25D366" style="border-radius:999px;background-color:#25D366;padding:12px 22px;mso-padding-alt:12px 22px;">
                <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:14px;font-weight:600;text-decoration:none;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Message us on WhatsApp</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${opts.muted};">WhatsApp: <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="color:${opts.brand} !important;font-size:12px;font-weight:600;font-family:inherit;text-decoration:none !important;">${escapeHtml(waLabel)}</a></p>
          </td></tr>
        </table>
      </td></tr>`;

  const marketingRow = !marketingOut
    ? `<tr><td style="padding:0 24px 20px 24px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;background:#faf9f7;border:1px solid #ece9e4;">
          <tr><td style="padding:18px 18px;">
            <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#8a8680;">STAY IN THE LOOP</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:${opts.ink};">
              Want restock alerts and product drops? One tap subscribes <strong>${escapeHtml(opts.buyerEmail)}</strong> — no typing. Or use the form on our site anytime.
            </p>
            <table cellspacing="0" cellpadding="0"><tr>
              <td align="center" bgcolor="#14120f" style="border-radius:999px;background-color:#14120f;padding:13px 24px;mso-padding-alt:13px 24px;">
                <a href="${escapeHtml(oneClickSubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#ffffff !important;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;line-height:1.35;">
                  <span style="color:#ffffff !important;text-decoration:none;">Subscribe this email (one tap)</span>
                </a>
              </td>
            </tr></table>
            <p style="margin:12px 0 0 0;font-size:12px;color:${opts.muted};">
              <a href="${escapeHtml(newsletterFallbackUrl)}" style="color:${opts.brand};font-weight:600;text-decoration:none;">Open homepage newsletter form</a>
            </p>
            ${
              coupon
                ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;color:${opts.ink};">
              <span style="font-weight:600;">Thank-you code for your next order:</span>
              <span style="font-family:ui-monospace,monospace;font-weight:700;color:${opts.brand};"> ${escapeHtml(coupon)}</span>
              ${couponNote ? `<br/><span style="color:${opts.muted};font-size:13px;">${escapeHtml(couponNote)}</span>` : ""}
            </p>`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>`
    : `<tr><td style="padding:0 24px 16px 24px;">
        <p style="margin:0;font-size:13px;color:${opts.muted};">You're opted out of promotional emails from HUMPBUCK. You'll still receive important order updates like this one.</p>
      </td></tr>`;

  const footerRow = `<tr><td style="padding:16px 24px 24px 24px;border-top:1px solid #ece9e4;">
        <p style="margin:0;font-size:11px;line-height:1.55;color:#a8a49e;text-align:center;">
          ${escapeHtml(opts.footerContextLine)}
          ${
            !marketingOut
              ? `<br/><span style="color:${opts.muted};">If this subscription is not relevant for you, you can unsubscribe anytime.</span>`
              : ""
          }
        </p>
        ${
          !marketingOut
            ? `<table cellspacing="0" cellpadding="0" align="center" style="margin-top:10px;"><tr>
          <td align="center" bgcolor="#f5f4f1" style="border-radius:999px;border:1px solid #d9d6d0;background-color:#f5f4f1;padding:8px 16px;mso-padding-alt:8px 16px;">
            <a href="${escapeHtml(unsubUrl)}" style="display:inline-block;color:${opts.ink} !important;font-size:12px;font-weight:600;text-decoration:none;line-height:1.3;">
              <span style="color:${opts.ink} !important;text-decoration:none;">Unsubscribe</span>
            </a>
          </td>
        </tr></table>`
            : ""
        }
      </td></tr>`;

  const textParts: string[] = [
    "",
    `Support: ${support}`,
    `WhatsApp: ${waLabel} — ${waUrl}`,
  ];
  if (!marketingOut) {
    textParts.push(
      "",
      `One-tap subscribe (this email): ${oneClickSubscribeUrl}`,
      `Homepage form: ${newsletterFallbackUrl}`,
    );
    if (coupon) {
      textParts.push(
        couponNote
          ? `Next-order code: ${coupon} (${couponNote})`
          : `Next-order code: ${coupon}`,
      );
    }
    textParts.push(
      "",
      "If this subscription is not relevant for you, you can unsubscribe anytime:",
      `Unsubscribe: ${unsubUrl}`,
    );
  } else {
    textParts.push(
      "",
      "You've opted out of promotional emails (order updates will still be sent).",
    );
  }

  return {
    rowsHtml: helpRow + marketingRow + footerRow,
    textAppend: textParts.join("\n"),
  };
}
