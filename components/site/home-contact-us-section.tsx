import { getTranslations } from "next-intl/server";
import { AboutContactForm } from "@/components/site/about-contact-form";

/** Homepage Contact Us — same form as the floating email button. */
export async function HomeContactUsSection() {
  const [t, tForm] = await Promise.all([
    getTranslations("AboutPage"),
    getTranslations("ContactForm"),
  ]);

  return (
    <section
      className="border-b border-line bg-paper"
      aria-labelledby="home-contact-us-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-white/70 p-7 shadow-(--shadow-card) sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("contactKicker")}
              </p>
              <h2
                id="home-contact-us-heading"
                className="mt-3 font-serif text-2xl text-ink sm:text-3xl"
              >
                {t("contactTitle")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {tForm("intro")}
              </p>
            </div>
            <AboutContactForm instance="home" />
          </div>
        </div>
      </div>
    </section>
  );
}
