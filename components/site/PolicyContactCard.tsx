import { getTranslations } from "next-intl/server";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

type PolicyContactCardProps = {
  /** Which intro line to show under the title. */
  variant?: "default" | "privacy" | "refund";
};

export async function PolicyContactCard({ variant = "default" }: PolicyContactCardProps) {
  const t = await getTranslations("PolicyContact");
  const introKey =
    variant === "privacy" ? "introPrivacy" : variant === "refund" ? "introRefund" : "introDefault";

  return (
    <section className="rounded-2xl border border-line bg-white/50 px-5 py-6 sm:px-6">
      <h2 className="font-serif text-xl tracking-tight text-ink">{t("title")}</h2>
      <p className="mt-4 text-ink/85">{t(introKey)}</p>
      <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-[1.65] text-ink/85 marker:text-ink/40">
        <li>
          <strong>{t("emailLabel")}</strong>{" "}
          <a href="mailto:support@humpbuck.com" className={linkContact}>
            support@humpbuck.com
          </a>
        </li>
        <li>
          <strong>{t("whatsappLabel")}</strong>{" "}
          <a
            href={WHATSAPP_URL}
            className={linkContact}
            target="_blank"
            rel="noopener noreferrer"
          >
            {WHATSAPP_DISPLAY}
          </a>
        </li>
        <li>
          <strong>{t("supportHoursLabel")}</strong> {t("support247")}
        </li>
      </ul>
    </section>
  );
}
