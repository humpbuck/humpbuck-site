import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccountSession } from "@/lib/account-server";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import {
  isMarketingOptOut,
  recordMarketingOptInFromSubscribe,
  recordMarketingOptOutByEmail,
} from "@/lib/email-marketing-preference";

function goSubscribe(status: string, error?: string): never {
  if (error) {
    redirect(`/account/subscribe?status=${encodeURIComponent(status)}&error=${encodeURIComponent(error)}`);
  }
  redirect(`/account/subscribe?status=${encodeURIComponent(status)}`);
}

async function subscribeAction() {
  "use server";
  const session = await requireAccountSession();
  const email = String(session.user?.email ?? "").trim().toLowerCase();
  if (!email) {
    goSubscribe("error", "No account email found.");
  }

  const result = await addEmailToBrevoNewsletter(email);
  if (!result.ok) {
    goSubscribe("error", result.error || "Failed to subscribe.");
  }

  await recordMarketingOptInFromSubscribe(email);
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.subscribe,
    sourceEmail: email,
    dedupeKey: `subscribe:account:${email}`,
    payload: {
      email,
      eventType: "registered_subscriber",
      message: `Subscriber (Registered) | ${email} enabled subscription preference. Synced to Brevo (Customers).`,
      createdAt: new Date().toISOString(),
    },
  });
  revalidatePath("/account/subscribe");
  goSubscribe(result.already ? "already" : "subscribed");
}

async function unsubscribeAction() {
  "use server";
  const session = await requireAccountSession();
  const email = String(session.user?.email ?? "").trim().toLowerCase();
  if (!email) {
    goSubscribe("error", "No account email found.");
  }

  await recordMarketingOptOutByEmail(email);
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.subscribe,
    sourceEmail: email,
    dedupeKey: `unsubscribe:account:${email}`,
    payload: {
      email,
      eventType: "unsubscribed",
      message: "Unsubscribed | User left subscription list; marketing delivery has been stopped.",
      createdAt: new Date().toISOString(),
    },
  });

  const supportFrom = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await sendTransactionalEmail({
    to: email,
    subject: "Unsubscribe successful",
    htmlContent: `
      <p>Hello,</p>
      <p>You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.</p>
      <p>If you want to subscribe again later, you can do it from your account page.</p>
      <p>Support: ${supportFrom}</p>
    `,
    textContent:
      `Unsubscribe successful\n` +
      `You have successfully unsubscribed from HUMPBUCK promotional and newsletter emails.\n` +
      `You can subscribe again from your account page.\n` +
      `Support: ${supportFrom}`,
  });
  await sendTransactionalEmail({
    to: notifyTo,
    subject: "Subscriber unsubscribed",
    htmlContent: `
      <p>Hello,</p>
      <p>A subscriber has unsubscribed from account settings.</p>
      <ul><li><strong>Email:</strong> ${email}</li></ul>
    `,
    textContent: `Subscriber unsubscribed\nEmail: ${email}\nSource: account settings`,
  });

  revalidatePath("/account/subscribe");
  goSubscribe("unsubscribed");
}

export default async function AccountSubscribePage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const session = await requireAccountSession();
  const sp = (await searchParams) ?? {};
  const status = String(sp.status ?? "").trim();
  const error = String(sp.error ?? "").trim();
  const email = String(session.user?.email ?? "").trim().toLowerCase();
  const optedOut = email ? await isMarketingOptOut(email) : true;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Subscribe</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Email subscription</h1>
      <p className="mt-2 text-sm text-muted">
        Manage newsletter and product update subscription using your account email.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Account email</p>
        <p className="mt-2 text-sm text-ink">{email || "-"}</p>
        <p className="mt-3 text-sm text-muted">
          Current status:{" "}
          <span className="font-medium text-ink">{optedOut ? "Unsubscribed" : "Subscribed"}</span>
        </p>
        {status === "subscribed" ? (
          <p className="mt-3 text-sm text-emerald-700">Subscribed successfully.</p>
        ) : null}
        {status === "already" ? (
          <p className="mt-3 text-sm text-ink/80">This email is already subscribed.</p>
        ) : null}
        {status === "unsubscribed" ? (
          <p className="mt-3 text-sm text-ink/80">Unsubscribed successfully.</p>
        ) : null}
        {status === "error" && error ? (
          <p className="mt-3 text-sm text-rose-700">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={subscribeAction}>
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
            >
              Subscribe
            </button>
          </form>
          <form action={unsubscribeAction}>
            <button
              type="submit"
              className="rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              Unsubscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
