import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirectWithLocale } from "@/lib/storefront-redirect";
import { createAdminInboxMessage, ADMIN_INBOX_CATEGORY } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { optOutByToken } from "@/lib/email-marketing-preference";
import { sendUnsubscribeSuccessEmail } from "@/lib/unsubscribe-success-email";
import { publicSupportEmail } from "@/lib/support-contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "UnsubscribeFlow" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

async function confirmUnsubscribeAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return redirectWithLocale("/unsubscribe?r=missing");
  }
  const result = await optOutByToken(token);
  if (!result.ok) {
    return redirectWithLocale("/unsubscribe?r=invalid");
  }

  const { email, already } = result;

  if (!already) {
    const supportFrom = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
    const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
    await createAdminInboxMessage({
      category: ADMIN_INBOX_CATEGORY.subscribe,
      sourceEmail: email,
      dedupeKey: `unsubscribe:${email}`,
      payload: {
        email,
        eventType: "unsubscribed",
        message:
          "Unsubscribed | User left subscription list; marketing delivery has been stopped.",
        createdAt: new Date().toISOString(),
      },
    });
    await sendUnsubscribeSuccessEmail(email);
    await sendTransactionalEmail({
      to: notifyTo,
      subject: "Subscriber unsubscribed",
      htmlContent: `
        <p>Hello,</p>
        <p>A subscriber has unsubscribed.</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Source:</strong> ${supportFrom}</li>
        </ul>
      `,
      textContent: `Subscriber unsubscribed\nEmail: ${email}\nSource: ${supportFrom}`,
    });
  }

  return redirectWithLocale(
    `/unsubscribe?r=${already ? "already" : "done"}&e=${encodeURIComponent(email)}`,
  );
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string; r?: string; e?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UnsubscribeFlow");
  const supportMail = publicSupportEmail();

  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const resultFlag = typeof sp.r === "string" ? sp.r : "";
  const emailFromResult = typeof sp.e === "string" ? sp.e : "";

  let state: "missing" | "invalid" | "confirm" | "done" | "already" = "missing";
  const emailHint = emailFromResult;
  if (resultFlag === "invalid") state = "invalid";
  else if (resultFlag === "done") state = "done";
  else if (resultFlag === "already") state = "already";
  else if (resultFlag === "missing") state = "missing";
  else if (token) state = "confirm";

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl tracking-tight">{t("pageTitle")}</h1>

      {state === "missing" ? (
        <p className="mt-6 text-muted">{t("missingBody")}</p>
      ) : null}

      {state === "confirm" ? (
        <div className="mt-6 space-y-4">
          <p className="text-muted">{t("confirmPrompt")}</p>
          <form action={confirmUnsubscribeAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl border border-line bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
            >
              {t("confirmButton")}
            </button>
          </form>
        </div>
      ) : null}

      {state === "invalid" ? (
        <p className="mt-6 text-muted">
          {t("invalidBefore")}{" "}
          <a
            className="font-medium text-ink underline underline-offset-2"
            href={`mailto:${supportMail}`}
          >
            {supportMail}
          </a>
          {t("invalidAfter")}
        </p>
      ) : null}

      {state === "done" ? (
        <p className="mt-6 text-muted">
          {emailHint ? t("doneWithEmail", { email: emailHint }) : t("doneNoEmail")}
        </p>
      ) : null}

      {state === "already" ? (
        <p className="mt-6 text-muted">
          {emailHint ? t("alreadyWithEmail", { email: emailHint }) : t("alreadyNoEmail")}
        </p>
      ) : null}

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
