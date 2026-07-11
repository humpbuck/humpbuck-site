import { getLocale, getTranslations } from "next-intl/server";
import { HomeCertaintyFaqItem } from "@/components/site/home-certainty-faq-item";
import { HomeFaqAnswerBody } from "@/components/site/home-faq-answer-body";
import { HomeCertaintySidebar } from "@/components/site/home-certainty-sidebar";
import { resolveHomeCmsText } from "@/lib/site-home-cms-locale";
import { resolveHomeFaqItems } from "@/lib/site-home-content";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

const deferredSectionStyle = {
  contentVisibility: "auto",
  containIntrinsicSize: "760px",
} as const;

export async function HomeCustomerCertaintySection() {
  const [locale, t, content] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getSiteHomeContent(),
  ]);

  const heading =
    resolveHomeCmsText(locale, content.certaintyHeading, t("certaintyTitle"));
  const faqItems = resolveHomeFaqItems(
    content,
    [
    {
      question: t("certaintyCurrencyTitle"),
      answer: t("certaintyCurrencyBody"),
    },
    {
      question: t("certaintyShippingTitle"),
      answer: t("certaintyShippingBody"),
    },
    {
      question: t("certaintyPaymentsTitle"),
      answer: t("certaintyPaymentsBody"),
    },
    {
      question: t("certaintyOrderTitle"),
      answer: t("certaintyOrderBody"),
    },
  ],
    locale,
  );

  return (
    <section
      className="border-b border-line bg-paper py-14 sm:py-16 md:py-20"
      style={deferredSectionStyle}
      aria-labelledby="home-certainty-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-14 xl:gap-20">
          <HomeCertaintySidebar
            kicker={t("certaintyKicker")}
            heading={heading}
            lead=""
            supportPrompt={t("certaintySupportPrompt")}
            supportCta={t("certaintySupportCta")}
          />

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <HomeCertaintyFaqItem key={`faq-${index}`} title={item.question}>
                <HomeFaqAnswerBody text={item.answer} />
              </HomeCertaintyFaqItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
