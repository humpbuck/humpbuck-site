import { MessageCircle } from "lucide-react";
import { AboutContactForm } from "@/components/site/about-contact-form";
import { AboutContactMap } from "@/components/site/about-contact-map";
import { StoreContactDetails } from "@/components/site/store-contact-details";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { getTranslations } from "next-intl/server";

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
          <StoreContactDetails />

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
