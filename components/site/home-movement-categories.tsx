import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { mechanicalHeroWebpUrl, flagshipCategoryBackgroundWebpUrl } from "@/lib/r2";

function CategoryImage({
  href,
  imageSrc,
  imageAlt,
  imagePriority = false,
}: {
  href: string;
  imageSrc: string;
  imageAlt: string;
  imagePriority?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative mx-auto block aspect-square w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-line/70 bg-[#080808] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-line hover:shadow-md md:mx-0 md:max-w-[280px] lg:max-w-[320px]"
    >
      <StorefrontImage
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={imagePriority}
        sizes="(max-width:768px) 240px, 320px"
        className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
      />
    </Link>
  );
}

function CategoryCopy({
  href,
  kicker,
  title,
  cta,
}: {
  href: string;
  kicker: string;
  title: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center text-center md:min-w-0 md:max-w-xs md:flex-none md:items-start md:text-left">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/90 md:text-[10px] md:tracking-[0.2em]">
        {kicker}
      </p>
      <h2 className="mt-1.5 font-serif text-lg leading-snug tracking-tight md:mt-2 md:text-2xl lg:text-[1.75rem]">
        {title}
      </h2>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/75 underline-offset-8 transition hover:text-ink hover:underline md:mt-4 md:gap-2 md:text-[11px] md:tracking-[0.14em]"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

export async function HomeMovementCategories() {
  const t = await getTranslations("Home");
  const mechanicalImage = mechanicalHeroWebpUrl();
  const sectionBackground = flagshipCategoryBackgroundWebpUrl();

  return (
    <section
      className="relative overflow-hidden border-b border-line"
      aria-labelledby="home-movement-categories-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <StorefrontImage
          src={sectionBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-paper/82" />
      </div>

      <h2 id="home-movement-categories-heading" className="sr-only">
        {t("categoryHeading")}
      </h2>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-9 lg:py-11">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5 md:max-w-none md:flex-row md:justify-center md:gap-14 lg:gap-20">
          <CategoryImage
            href="/shop?movement=mechanical"
            imageSrc={mechanicalImage}
            imageAlt={t("categoryMechanicalImageAlt")}
            imagePriority
          />
          <CategoryCopy
            href="/shop?movement=mechanical"
            kicker={t("categoryMechanicalKicker")}
            title={t("categoryMechanicalTitle")}
            cta={t("categoryMechanicalCta")}
          />
        </div>
      </div>
    </section>
  );
}
