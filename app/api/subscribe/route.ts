import { NextResponse } from "next/server";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { recordMarketingOptInFromSubscribe } from "@/lib/email-marketing-preference";
import { sendSubscribeSuccessEmail } from "@/lib/subscribe-success-email";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const result = await addEmailToBrevoNewsletter(email);
  if (!result.ok) {
    const status =
      result.error.includes("not configured") ||
      result.error.includes("Invalid newsletter")
        ? 503
        : 502;
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status },
    );
  }

  try {
    await recordMarketingOptInFromSubscribe(email);
  } catch {
    // Local preference is best-effort; Brevo subscription already succeeded.
  }
  await sendSubscribeSuccessEmail(email).catch(() => null);

  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.subscribe,
    sourceEmail: email,
    payload: {
      email,
      createdAt: new Date().toISOString(),
    },
  });
  await sendTransactionalEmail({
    to: notifyTo,
    subject: "New subscribe request",
    htmlContent: `
      <p>Hello,</p>
      <p>A new newsletter subscribe request was received.</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Time:</strong> ${new Date().toISOString()}</li>
      </ul>
    `,
    textContent: `New subscribe request\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
  });

  return NextResponse.json({
    ok: true,
    ...(result.already ? { already: true } : {}),
  });
}
