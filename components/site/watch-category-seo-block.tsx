import { HomeCertaintyFaqItem } from "@/components/site/home-certainty-faq-item";
import { HomeFaqAnswerBody } from "@/components/site/home-faq-answer-body";
import type { WatchCollectionLocalizedCopy } from "@/lib/watch-collection-copy";

export function WatchCategorySeoBlock({
  copy,
}: {
  copy: WatchCollectionLocalizedCopy;
}) {
  const sections = [
    ...(copy.seoHeading
      ? [
          {
            heading: copy.seoHeading,
            paragraphs: copy.seoParagraphs,
          },
        ]
      : copy.seoParagraphs.length > 0
        ? [{ heading: null as string | null, paragraphs: copy.seoParagraphs }]
        : []),
    ...(copy.whyHeading
      ? [
          {
            heading: copy.whyHeading as string | null,
            paragraphs: copy.whyParagraphs,
          },
        ]
      : []),
  ];

  if (sections.length === 0 && copy.faqs.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-3xl border-t border-line pt-12 sm:mt-20 sm:pt-14">
      <div className="space-y-10">
        {sections.map((section, i) => (
          <div key={section.heading ?? `seo-${i}`} className="space-y-4">
            {section.heading ? (
              <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
                {section.heading}
              </h2>
            ) : null}
            {section.paragraphs.map((p) => (
              <p
                key={p.slice(0, 48)}
                className="text-sm leading-relaxed text-muted sm:text-[15px]"
              >
                {p}
              </p>
            ))}
          </div>
        ))}

        {copy.faqs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
              {copy.faqHeading}
            </h2>
            <div className="space-y-3">
              {copy.faqs.map((faq) => (
                <HomeCertaintyFaqItem key={faq.question} title={faq.question}>
                  <HomeFaqAnswerBody text={faq.answer} />
                </HomeCertaintyFaqItem>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
