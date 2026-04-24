import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const generic = NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, you will receive reset instructions shortly.",
  });

  try {
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = String(body.email || "")
      .toLowerCase()
      .trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return generic;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    /** No user → same generic response (do not reveal whether email exists). */
    if (!user) {
      return generic;
    }

    /**
     * Send a reset link for both normal accounts and placeholder rows without
     * passwordHash (e.g. script-created user). Reset API sets passwordHash on submit.
     */

    const token = randomBytes(TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRY_MS);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "http://localhost:3000";

    const resetUrl = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f1114;">
  <p>We received a request to set or reset your HUMPBUCK password.</p>
  <p>
    <a href="${resetUrl}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #0f1114; color: #f4f2ed; text-decoration: none; border-radius: 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
      Reset password
    </a>
  </p>
  <p style="font-size: 13px; color: #6b6f76;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
  <p style="font-size: 12px; color: #6b6f76; word-break: break-all;">${resetUrl}</p>
</body>
</html>
`.trim();

  const text = `Set or reset your HUMPBUCK password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`;

    const sent = await sendTransactionalEmail({
      to: email,
      subject: "Reset your HUMPBUCK password",
      htmlContent: html,
      textContent: text,
    });

    if (!sent.ok) {
      await prisma.passwordResetToken.deleteMany({ where: { token } });
      console.error("[forgot-password] Brevo:", sent.error);
      return NextResponse.json(
        {
          error:
            "Email could not be sent. Set BREVO_SENDER_EMAIL to a verified sender in Brevo, and check BREVO_API_KEY.",
          detail: sent.error,
        },
        { status: 503 },
      );
    }

    return generic;
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json(
      {
        error:
          "Request failed. If this persists, run database migrations (npx prisma migrate dev) and verify Brevo env vars.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
