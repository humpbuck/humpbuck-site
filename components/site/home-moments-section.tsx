import { getTranslations } from "next-intl/server";
import { StorefrontImage } from "@/components/site/storefront-image";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";
import { resolveMomentsCardImageUrls } from "@/lib/site-home-content";

type MomentsCard = {
  title: string;
  description: string;
  desktopSrc: string;
  mobileSrc: string;
};

function MomentsDesktopCard({ card }: { card: MomentsCard }) {
  return (
    <article className="relative aspect-video overflow-hidden rounded-2xl bg-[#1a1a1a]">
      {card.desktopSrc ? (
        <StorefrontImage
          src={card.desktopSrc}
          alt={card.title}
          fill
          sizes="(max-width: 1024px) 50vw, 640px"
          className="object-cover object-center"
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-linear-to-t from-[#080808]/90 via-[#080808]/55 to-transparent px-6 pb-6 pt-16 text-center sm:px-8 sm:pb-8 sm:pt-20">
        <h3 className="font-serif text-xl tracking-tight text-white sm:text-2xl">
          {card.title}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/82 sm:text-[0.9375rem]">
          {card.description}
        </p>
      </div>
    </article>
  );
}

function MomentsMobileCard({ card }: { card: MomentsCard }) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="relative aspect-4/5 bg-[#f3f1ec]">
        {card.mobileSrc ? (
          <StorefrontImage
            src={card.mobileSrc}
            alt={card.title}
            fill
            sizes="50vw"
            className="object-cover object-center"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-3 py-4 text-center sm:px-4 sm:py-5">
        <h3 className="font-serif text-[0.9375rem] leading-snug tracking-tight text-ink sm:text-base">
          {card.title}
        </h3>
        <p className="mt-2 text-[11px] leading-relaxed text-muted sm:text-xs">
          {card.description}
        </p>
      </div>
    </article>
  );
}

export async function HomeMomentsSection() {
  const [t, content] = await Promise.all([
    getTranslations("Home"),
    getSiteHomeContent(),
  ]);

  const card1Images = resolveMomentsCardImageUrls(
    content.momentsCard1DesktopImageUrl,
    content.momentsCard1MobileImageUrl,
  );
  const card2Images = resolveMomentsCardImageUrls(
    content.momentsCard2DesktopImageUrl,
    content.momentsCard2MobileImageUrl,
  );

  const cards: MomentsCard[] = [
    {
      title: content.momentsCard1Title || t("momentsCard1Title"),
      description:
        content.momentsCard1Description || t("momentsCard1Description"),
      desktopSrc: card1Images.desktop,
      mobileSrc: card1Images.mobile,
    },
    {
      title: content.momentsCard2Title || t("momentsCard2Title"),
      description:
        content.momentsCard2Description || t("momentsCard2Description"),
      desktopSrc: card2Images.desktop,
      mobileSrc: card2Images.mobile,
    },
  ];

  const heading = content.momentsHeading || t("momentsHeading");
  const lead = content.momentsLead || t("momentsLead");

  return (
    <section
      className="border-b border-line bg-paper"
      aria-labelledby="home-moments-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="home-moments-heading"
            className="font-serif text-3xl tracking-tight text-ink sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            {lead}
          </p>
        </div>

        <div className="mt-10 hidden gap-5 md:mt-12 md:grid md:grid-cols-2 md:gap-6">
          {cards.map((card) => (
            <MomentsDesktopCard key={card.title} card={card} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
          {cards.map((card) => (
            <MomentsMobileCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
