import { NextResponse } from "next/server";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { recordMarketingOptInFromSubscribe } from "@/lib/email-marketing-preference";
import { sendSubscribeSuccessEmail } from "@/lib/subscribe-success-email";
import { parseSubscribeMagicRequest } from "@/lib/subscribe-magic-link";

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/**
 * One-click newsletter opt-in from shipment / marketing emails (signed link).
 * GET /api/subscribe/magic?e=…&exp=…&s=…
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = parseSubscribeMagicRequest(url.searchParams);
  const origin = appOrigin();

  if (!parsed) {
    return NextResponse.redirect(
      new URL("/newsletter/confirmed?r=invalid", origin),
    );
  }

  const result = await addEmailToBrevoNewsletter(parsed.email);
  if (!result.ok) {
    const q = new URLSearchParams({ r: "error" });
    if (result.error.includes("not configured")) q.set("r", "not_configured");
    return NextResponse.redirect(new URL(`/newsletter/confirmed?${q}`, origin));
  }

  try {
    await recordMarketingOptInFromSubscribe(parsed.email);
  } catch {
    /* local DB best-effort */
  }

  const nowIso = new Date().toISOString();
  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.subscribe,
    sourceEmail: parsed.email,
    dedupeKey: `subscribe:magic:${parsed.email}`,
    payload: {
      email: parsed.email,
      eventType: "magic_subscriber",
      message: `Subscriber (Magic Link) | ${parsed.email} subscribed via one-tap email link. Synced to Brevo (Website newsletter).`,
      createdAt: nowIso,
    },
  }).catch(() => null);

  await sendTransactionalEmail({
    to: notifyTo,
    subject: "New subscribe request",
    htmlContent: `
      <p>Hello,</p>
      <p>A new newsletter subscribe request was received via one-tap email link.</p>
      <ul>
        <li><strong>Email:</strong> ${parsed.email}</li>
        <li><strong>Source:</strong> subscribe magic link</li>
        <li><strong>Time:</strong> ${nowIso}</li>
      </ul>
    `,
    textContent:
      `New subscribe request\n` +
      `Email: ${parsed.email}\n` +
      `Source: subscribe magic link\n` +
      `Time: ${nowIso}`,
  }).catch(() => null);

  await sendSubscribeSuccessEmail(parsed.email).catch(() => null);

  const q = new URLSearchParams({ r: "ok" });
  if (result.already) q.set("r", "already");
  return NextResponse.redirect(new URL(`/newsletter/confirmed?${q}`, origin));
}
