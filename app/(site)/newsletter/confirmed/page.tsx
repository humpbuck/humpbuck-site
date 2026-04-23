import Link from "next/link";

export const metadata = {
  title: "Newsletter · HUMPBUCK",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;

  let title = "You’re subscribed";
  let body =
    "Thanks — you’ll get short updates on restocks and drops. You can unsubscribe anytime from future emails.";

  if (r === "invalid") {
    title = "Link not valid";
    body =
      "This subscribe link has expired or was changed. Use the form on our homepage or the link from a newer email.";
  } else if (r === "error" || r === "not_configured") {
    title = "Couldn’t complete signup";
    body =
      "Our mailing list isn’t available right now. Please try the Subscribe box on the homepage later, or email support.";
  } else if (r === "already") {
    title = "Already on the list";
    body = "This email was already subscribed — you’re all set.";
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
      <p className="mt-6 text-muted">{body}</p>
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
