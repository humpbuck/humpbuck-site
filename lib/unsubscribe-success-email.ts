import { buildSubscribeMagicUrl } from "@/lib/subscribe-magic-link";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { publicSupportEmail } from "@/lib/support-contact";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendUnsubscribeSuccessEmail(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return;

  const siteUrl = emailPublicBaseUrl();
  const support = publicSupportEmail();
  let oneTapSubscribe = `${siteUrl}/#newsletter`;
  try {
    oneTapSubscribe = buildSubscribeMagicUrl(email, siteUrl);
  } catch {
    // fallback keeps the user on homepage newsletter form
  }

  await sendTransactionalEmail({
    to: email,
    subject: "Unsubscribe successful",
    htmlContent: `
      <p>Hello,</p>
      <p>You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.</p>
      <p>If you want to subscribe again later, you can return to our website.</p>
      <p><a href="${esc(siteUrl)}" style="color:#0f172a;font-weight:600;">https://www.humpbuck.com</a></p>
      <table cellspacing="0" cellpadding="0" style="margin-top:12px;"><tr>
        <td align="center" bgcolor="#14120f" style="border-radius:999px;background-color:#14120f;padding:10px 18px;mso-padding-alt:10px 18px;">
          <a href="${esc(oneTapSubscribe)}" style="display:inline-block;color:#ffffff !important;font-size:12px;font-weight:600;text-decoration:none;line-height:1.3;">
            <span style="color:#ffffff !important;text-decoration:none;">Subscribe again</span>
          </a>
        </td>
      </tr></table>
      <p style="margin-top:14px;color:#666;">Support: ${esc(support)}</p>
    `,
    textContent:
      `Unsubscribe successful\n` +
      `You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.\n\n` +
      `You can subscribe again from the official website:\n` +
      `https://www.humpbuck.com\n\n` +
      `One-tap subscribe link:\n` +
      `${oneTapSubscribe}\n\n` +
      `Support: ${support}`,
  });
}
