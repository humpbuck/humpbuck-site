import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { optOutByToken } from "@/lib/email-marketing-preference";

export const metadata = {
  title: "Email preferences · HUMPBUCK",
  robots: { index: false, follow: false },
};

async function confirmUnsubscribeAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirect("/unsubscribe?r=missing");
  }
  const result = await optOutByToken(token);
  if (!result.ok) {
    redirect("/unsubscribe?r=invalid");
  }

  if (!result.already) {
    const supportFrom = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
    const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
    await createAdminInboxMessage({
      category: ADMIN_INBOX_CATEGORY.subscribe,
      sourceEmail: result.email,
      dedupeKey: `unsubscribe:${result.email}`,
      payload: {
        email: result.email,
        eventType: "unsubscribed",
        message:
          "Unsubscribed | User left subscription list; marketing delivery has been stopped.",
        createdAt: new Date().toISOString(),
      },
    });
    await sendTransactionalEmail({
      to: result.email,
      subject: "Unsubscribe successful",
      htmlContent: `
        <p>Hello,</p>
        <p>You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.</p>
        <p>If you want to subscribe again later, you can do it from our website.</p>
        <p>Support: ${supportFrom}</p>
      `,
      textContent:
        `Unsubscribe successful\n` +
        `You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.\n` +
        `If you want to subscribe again later, you can do it from our website.\n` +
        `Support: ${supportFrom}`,
    });
    await sendTransactionalEmail({
      to: notifyTo,
      subject: "Subscriber unsubscribed",
      htmlContent: `
        <p>Hello,</p>
        <p>A subscriber has unsubscribed.</p>
        <ul>
          <li><strong>Email:</strong> ${result.email}</li>
          <li><strong>Source:</strong> ${supportFrom}</li>
        </ul>
      `,
      textContent: `Subscriber unsubscribed\nEmail: ${result.email}\nSource: ${supportFrom}`,
    });
  }

  redirect(`/unsubscribe?r=${result.already ? "already" : "done"}&e=${encodeURIComponent(result.email)}`);
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; r?: string; e?: string }>;
}) {
  const { t, r, e } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const resultFlag = typeof r === "string" ? r : "";
  const emailFromResult = typeof e === "string" ? e : "";

  let state: "missing" | "invalid" | "confirm" | "done" | "already" = "missing";
  let emailHint = emailFromResult;
  if (resultFlag === "invalid") state = "invalid";
  else if (resultFlag === "done") state = "done";
  else if (resultFlag === "already") state = "already";
  else if (resultFlag === "missing") state = "missing";
  else if (token) state = "confirm";

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl tracking-tight">Email preferences</h1>

      {state === "missing" ? (
        <p className="mt-6 text-muted">
          This page is used from the unsubscribe link in our emails. If you
          pasted the URL manually, make sure the full link including{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">?t=…</code>{" "}
          is included.
        </p>
      ) : null}

      {state === "confirm" ? (
        <div className="mt-6 space-y-4">
          <p className="text-muted">
            Confirm unsubscribe from HUMPBUCK promotional and newsletter emails?
          </p>
          <form action={confirmUnsubscribeAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl border border-line bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              Confirm unsubscribe
            </button>
          </form>
        </div>
      ) : null}

      {state === "invalid" ? (
        <p className="mt-6 text-muted">
          This unsubscribe link is invalid or expired. If you still receive
          unwanted messages, email{" "}
          <a
            className="font-medium text-ink underline underline-offset-2"
            href="mailto:support@humpbuck.com"
          >
            support@humpbuck.com
          </a>
          .
        </p>
      ) : null}

      {state === "done" ? (
        <p className="mt-6 text-muted">
          You&apos;re unsubscribed from promotional and newsletter emails
          {emailHint ? (
            <>
              {" "}
              for <span className="text-ink">{emailHint}</span>
            </>
          ) : null}
          . You&apos;ll still receive important transactional messages about
          orders you place.
        </p>
      ) : null}

      {state === "already" ? (
        <p className="mt-6 text-muted">
          You were already unsubscribed from promotional emails
          {emailHint ? (
            <>
              {" "}
              for <span className="text-ink">{emailHint}</span>
            </>
          ) : null}
          .
        </p>
      ) : null}

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
