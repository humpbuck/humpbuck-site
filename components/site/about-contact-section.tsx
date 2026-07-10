import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { AboutContactForm } from "@/components/site/about-contact-form";
import { AboutContactMap } from "@/components/site/about-contact-map";
import { HUMPBUCK_STORE_ADDRESS } from "@/lib/about-location";
import { supportMailtoHref, SUPPORT_EMAIL } from "@/lib/support-email";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { getTranslations } from "next-intl/server";

const DETAIL_ICON =
  "mt-0.5 shrink-0 text-muted/80";

export async function AboutContactSection() {
  const [t, tForm] = await Promise.all([
    getTranslations("AboutPage"),
    getTranslations("ContactForm"),
  ]);

  return (
    <section
      className="mt-10 rounded-3xl border border-line bg-white/70 p-7 shadow-(--shadow-card) sm:mt-12 sm:p-8"
      aria-labelledby="about-contact-heading"
    >
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("contactKicker")}
        </p>
        <h2
          id="about-contact-heading"
          className="mt-3 font-serif text-2xl text-ink sm:text-3xl"
        >
          {t("contactTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{tForm("intro")}</p>
      </div>

      <div className="mt-8 max-w-2xl">
        <AboutContactForm />
      </div>

      <div className="mt-10 grid gap-8 border-t border-line pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10 xl:gap-12">
        <AboutContactMap />

        <div className="space-y-6">
          <address className="not-italic">
            <dl className="space-y-4 text-sm leading-relaxed text-muted">
              <div className="flex gap-3">
                <MapPin size={18} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("addressLabel")}
                  </dt>
                  <dd className="mt-1 text-ink">{HUMPBUCK_STORE_ADDRESS}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={18} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("telLabel")}
                  </dt>
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
              <div className="flex gap-3">
                <Mail size={18} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("emailLabel")}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={supportMailtoHref(t("mailSubject"))}
                      className="text-ink underline-offset-2 transition hover:text-digital-dim hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={18} strokeWidth={1.75} className={DETAIL_ICON} aria-hidden />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("businessHoursLabel")}
                  </dt>
                  <dd className="mt-1 space-y-1 text-ink">
                    <p>{t("businessHoursWeekdays")}</p>
                    <p className="text-muted">{t("businessHoursSunday")}</p>
                    <p className="text-xs text-muted">{t("businessHoursTimezone")}</p>
                  </dd>
                </div>
              </div>
            </dl>
          </address>

          <div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-luxe px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-luxe/90"
              aria-label={`${t("whatsappButton")} ${WHATSAPP_DISPLAY}`}
            >
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden />
              {t("whatsappButton")}
            </a>
            <p className="mt-4 text-xs leading-relaxed text-muted">{t("contactTrustNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
