const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

const DEFAULT_INTRO =
  "For any questions regarding shipping rates, delivery times, or technical support, please reach out to our team:";

type PolicyContactCardProps = {
  /** Override the line below “Contact us”. Defaults to the standard shipping/support blurb. */
  intro?: string;
};

export function PolicyContactCard({ intro }: PolicyContactCardProps) {
  return (
    <section className="rounded-2xl border border-[color:var(--color-line)] bg-white/50 px-5 py-6 sm:px-6">
      <h2 className="font-serif text-xl tracking-tight text-ink">Contact us</h2>
      <p className="mt-4 text-ink/85">{intro ?? DEFAULT_INTRO}</p>
      <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-[1.65] text-ink/85 marker:text-ink/40">
        <li>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@humpbuck.com" className={linkContact}>
            support@humpbuck.com
          </a>
        </li>
        <li>
          <strong>WhatsApp:</strong>{" "}
          <a
            href="https://wa.me/8618928160416"
            className={linkContact}
            target="_blank"
            rel="noopener noreferrer"
          >
            +86 189 2816 0416
          </a>
        </li>
        <li>
          <strong>Customer support:</strong> Available 24/7
        </li>
      </ul>
    </section>
  );
}
