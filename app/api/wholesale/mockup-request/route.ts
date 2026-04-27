import { NextResponse } from "next/server";
import { ADMIN_INBOX_CATEGORY, createAdminInboxMessage } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const company = text(body.company);
  const targetRegion = text(body.targetRegion);
  const estimatedQty = text(body.estimatedQty);
  const notes = text(body.notes);
  const email = text(body.email).toLowerCase();

  if (!company) {
    return NextResponse.json({ error: "Company / project name is required." }, { status: 400 });
  }
  if (!notes) {
    return NextResponse.json({ error: "Please add brief notes for your request." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.emailMockupRequest,
    sourceEmail: email,
    payload: {
      company,
      targetRegion,
      estimatedQty,
      notes,
      email,
      createdAt: nowIso,
    },
  });

  const mail = await sendTransactionalEmail({
    to: notifyTo,
    subject: "New Email mockup request",
    htmlContent: `
      <p>Hello,</p>
      <p>A new EMAIL MOCKUP REQUEST was submitted.</p>
      <ul>
        <li><strong>Company / project name:</strong> ${escapeHtml(company)}</li>
        <li><strong>Target region:</strong> ${escapeHtml(targetRegion || "-")}</li>
        <li><strong>Estimated qty:</strong> ${escapeHtml(estimatedQty || "-")}</li>
        <li><strong>Email:</strong> ${escapeHtml(email)}</li>
        <li><strong>Submitted at:</strong> ${escapeHtml(nowIso)}</li>
      </ul>
      <p><strong>Notes</strong></p>
      <p>${escapeHtml(notes).replaceAll("\n", "<br/>")}</p>
    `,
    textContent:
      `New EMAIL MOCKUP REQUEST\n` +
      `Company / project name: ${company}\n` +
      `Target region: ${targetRegion || "-"}\n` +
      `Estimated qty: ${estimatedQty || "-"}\n` +
      `Email: ${email}\n` +
      `Submitted at: ${nowIso}\n\n` +
      `Notes:\n${notes}`,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: "Failed to send notification email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
