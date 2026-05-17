import { redirectWithLocale } from "@/lib/storefront-redirect";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import { requireAccountSession } from "@/lib/account-server";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import { sendSubscribeSuccessEmail } from "@/lib/subscribe-success-email";
import { sendUnsubscribeSuccessEmail } from "@/lib/unsubscribe-success-email";
import {
  isMarketingSubscribed,
  recordMarketingOptInFromSubscribe,
} from "@/lib/email-marketing-preference";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

async function goSubscribeWithEmail(
  email: string,
  status: string,
  error?: string,
): Promise<never> {
  const params = new URLSearchParams();
  if (email.trim()) params.set("email", email.trim().toLowerCase());
  if (status.trim()) params.set("status", status.trim());
  if (error) {
    params.set("error", error);
  }
  const q = params.toString();
  return redirectWithLocale(q ? `/account/subscribe?${q}` : "/account/subscribe");
}

function normalizeInputEmail(raw: FormDataEntryValue | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function subscribeAction(formData: FormData) {
  "use server";
  await requireAccountSession();
  const email = normalizeInputEmail(formData.get("email"));
  if (!email || !isValidEmail(email)) {
    return goSubscribeWithEmail(email, "");
  }

  const result = await addEmailToBrevoNewsletter(email);
  if (!result.ok) {
    return goSubscribeWithEmail(email, "");
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
  await sendSubscribeSuccessEmail(email).catch(() => null);
  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await sendTransactionalEmail({
    to: notifyTo,
    subject: "New subscribe request",
    htmlContent: `
      <p>Hello,</p>
      <p>A new newsletter subscribe request was received from account settings.</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Time:</strong> ${new Date().toISOString()}</li>
      </ul>
    `,
    textContent:
      `New subscribe request\n` +
      `Email: ${email}\n` +
      `Source: account settings\n` +
      `Time: ${new Date().toISOString()}`,
  }).catch(() => null);
  revalidateStorefrontPath("/account/subscribe");
  return goSubscribeWithEmail(email, result.already ? "already" : "subscribed");
}

async function unsubscribeAction(formData: FormData) {
  "use server";
  await requireAccountSession();
  const email = normalizeInputEmail(formData.get("email"));
  if (!email || !isValidEmail(email)) {
    return goSubscribeWithEmail(email, "");
  }
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

  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await sendUnsubscribeSuccessEmail(email);
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

  revalidateStorefrontPath("/account/subscribe");
  return goSubscribeWithEmail(email, "unsubscribed");
}

export default async function AccountSubscribePage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string; email?: string }>;
}) {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("AccountSubscribe");

  const session = await requireAccountSession();
  const sp = (await searchParams) ?? {};
  const status = String(sp.status ?? "").trim();
  const accountEmail = String(session.user?.email ?? "").trim().toLowerCase();
  const editableEmail = String(sp.email ?? "").trim().toLowerCase();
  const currentEmail = editableEmail || accountEmail;
  const subscribed = currentEmail ? await isMarketingSubscribed(currentEmail) : false;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t("kicker")}</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("intro")}
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("emailLabel")}</p>
        <form action={subscribeAction} className="mt-2">
          <input
            name="email"
            type="email"
            defaultValue={currentEmail}
            placeholder={accountEmail || t("emailPlaceholder")}
            className="w-full max-w-md rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          <input type="hidden" name="actionSource" value="account-subscribe" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
            >
              {t("subscribe")}
            </button>
            <button
              type="submit"
              formAction={unsubscribeAction}
              className="rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              {t("unsubscribe")}
            </button>
          </div>
        </form>
        <p className="mt-3 text-sm text-muted">
          {t("statusPrefix")}{" "}
          <span className="font-medium text-ink">{subscribed ? t("statusSubscribed") : t("statusUnsubscribed")}</span>
        </p>
        {status === "already" ? (
          <p className="mt-3 text-sm text-ink/80">{t("alreadyMessage")}</p>
        ) : null}
        {status === "subscribed" ? (
          <p className="mt-3 text-sm text-emerald-800/90">{t("subscribedSuccess")}</p>
        ) : null}
        {status === "unsubscribed" ? (
          <p className="mt-3 text-sm text-ink/80">{t("unsubscribedSuccess")}</p>
        ) : null}
      </div>
    </div>
  );
}
