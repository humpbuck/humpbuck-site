import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { getOrCreateUnsubscribeToken } from "@/lib/email-marketing-preference";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { publicSupportEmail } from "@/lib/support-contact";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendSubscribeSuccessEmail(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return;
  const token = await getOrCreateUnsubscribeToken(email);
  const baseUrl = emailPublicBaseUrl();
  const unsubscribeUrl = `${baseUrl}/unsubscribe?t=${encodeURIComponent(token)}`;
  const support = publicSupportEmail();

  await sendTransactionalEmail({
    to: email,
    subject: "Subscription successful",
    htmlContent: `
      <p>Hello,</p>
      <p>Your subscription is active. You will receive HUMPBUCK product updates and newsletter emails.</p>
      <p style="margin-top:14px;">If this subscription is not relevant for you, you can unsubscribe anytime.</p>
      <table cellspacing="0" cellpadding="0" style="margin-top:10px;"><tr>
        <td align="center" bgcolor="#f5f4f1" style="border-radius:999px;border:1px solid #d9d6d0;background-color:#f5f4f1;padding:8px 16px;mso-padding-alt:8px 16px;">
          <a href="${esc(unsubscribeUrl)}" style="display:inline-block;color:#14120f !important;font-size:12px;font-weight:600;text-decoration:none;line-height:1.3;">
            <span style="color:#14120f !important;text-decoration:none;">Unsubscribe</span>
          </a>
        </td>
      </tr></table>
      <p style="margin-top:14px;color:#666;">Support: ${esc(support)}</p>
    `,
    textContent:
      `Subscription successful\n` +
      `Your subscription is active. You will receive HUMPBUCK product updates and newsletter emails.\n\n` +
      `If this subscription is not relevant for you, you can unsubscribe anytime.\n` +
      `Unsubscribe: ${unsubscribeUrl}\n\n` +
      `Support: ${support}`,
  });
}
