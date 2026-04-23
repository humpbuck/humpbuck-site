import Link from "next/link";
import { optOutByToken } from "@/lib/email-marketing-preference";

export const metadata = {
  title: "Email preferences · HUMPBUCK",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  let state: "missing" | "invalid" | "done" | "already" = "missing";
  let emailHint = "";

  if (token) {
    const result = await optOutByToken(token);
    if (!result.ok) {
      state = "invalid";
    } else {
      emailHint = result.email;
      state = result.already ? "already" : "done";
    }
  }

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
