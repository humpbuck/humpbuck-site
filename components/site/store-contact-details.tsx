import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { HUMPBUCK_STORE_ADDRESS } from "@/lib/about-location";
import { supportMailtoHref, SUPPORT_EMAIL } from "@/lib/support-email";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { getTranslations } from "next-intl/server";

const DETAIL_ICON = "mt-0.5 shrink-0 text-muted/80";

type Props = {
  className?: string;
  /** Smaller type for footer; default matches About contact block. */
  variant?: "default" | "compact";
};

export async function StoreContactDetails({
  className = "",
  variant = "default",
}: Props) {
  const t = await getTranslations("AboutPage");
  const compact = variant === "compact";
  const textClass = compact
    ? "text-[12px] leading-relaxed text-muted"
    : "text-sm leading-relaxed text-muted";
  const labelClass = compact
    ? "text-[9px] font-semibold uppercase tracking-[0.14em] text-muted"
    : "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";
  const iconSize = compact ? 16 : 18;

  return (
    <address className={`not-italic ${className}`.trim()}>
      <dl
        className={
          compact
            ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
            : "space-y-4"
        }
      >
        <div className={`flex gap-3 ${textClass}`}>
          <MapPin size={iconSize} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
          <div className="min-w-0">
            <dt className={labelClass}>{t("addressLabel")}</dt>
            <dd className="mt-1 text-ink">{HUMPBUCK_STORE_ADDRESS}</dd>
          </div>
        </div>
        <div className={`flex gap-3 ${textClass}`}>
          <Phone size={iconSize} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
          <div>
            <dt className={labelClass}>{t("telLabel")}</dt>
            <dd className="mt-1">
              <a
                href="tel:+8618928160416"
                className="tabular-nums text-ink underline-offset-2 transition hover:text-digital-dim hover:underline"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </dd>
          </div>
        </div>
        <div className={`flex gap-3 ${textClass}`}>
          <Mail size={iconSize} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
          <div>
            <dt className={labelClass}>{t("emailLabel")}</dt>
            <dd className="mt-1">
              <a
                href={supportMailtoHref(t("mailSubject"))}
                className="break-words text-ink underline-offset-2 transition hover:text-digital-dim hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </dd>
          </div>
        </div>
        <div className={`flex gap-3 ${textClass}`}>
          <Clock size={iconSize} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
          <div>
            <dt className={labelClass}>{t("businessHoursLabel")}</dt>
            <dd className="mt-1 space-y-1 text-ink">
              <p>{t("businessHoursWeekdays")}</p>
              <p className="text-muted">{t("businessHoursSunday")}</p>
              <p className={compact ? "text-[11px] text-muted" : "text-xs text-muted"}>
                {t("businessHoursTimezone")}
              </p>
            </dd>
          </div>
        </div>
      </dl>
    </address>
  );
}
