import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";

export function HomeMovementSpotlight({
  productHref,
  imageAlt,
  baseImage,
  productCutout = false,
  kicker,
  title,
  cta,
}: {
  productHref: string;
  imageAlt: string;
  baseImage: string;
  productCutout?: boolean;
  kicker: string;
  title: string;
  cta: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[min(92vw,22rem)] flex-col items-center gap-[clamp(1.25rem,4svh,2rem)] md:w-full md:max-w-none md:flex-row md:justify-center md:gap-14 lg:gap-20">
      <div className="flex w-full max-w-[min(82vw,40svh,22rem)] shrink-0 flex-col items-center md:mx-0 md:max-w-[280px] lg:max-w-[320px]">
        <Link
          href={productHref}
          className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 transition duration-300 hover:border-white/25 hover:bg-white/10 md:rounded-xl"
        >
          <StorefrontImage
            src={baseImage}
            alt={imageAlt}
            fill
            sizes="(max-width:768px) 352px, 320px"
            className={
              productCutout
                ? "object-contain object-center p-2 transition duration-700 group-hover:scale-[1.03] sm:p-3 md:p-4"
                : "object-cover object-center transition duration-700 group-hover:scale-[1.03]"
            }
          />
        </Link>
      </div>

      <div className="flex w-full max-w-[min(92vw,22rem)] flex-col items-center rounded-2xl border border-white/15 bg-white/5 px-6 py-5 text-center sm:px-7 sm:py-6 md:min-w-0 md:max-w-xs md:w-fit md:flex-none md:items-start md:px-6 md:py-5 md:text-left">
        <p className="text-[clamp(0.625rem,2.8vw,0.6875rem)] font-semibold uppercase tracking-[0.14em] text-white/88 md:text-[10px] md:tracking-[0.2em]">
          {kicker}
        </p>
        <h2 className="mt-2 font-serif text-[clamp(1.375rem,6.5vw,1.875rem)] leading-snug tracking-tight text-white md:mt-2 md:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
        <Link
          href={productHref}
          className="mt-3.5 inline-flex items-center gap-2 text-[clamp(0.6875rem,3vw,0.75rem)] font-semibold uppercase tracking-[0.12em] text-white/88 underline-offset-8 transition hover:text-white hover:underline md:mt-4 md:gap-2 md:text-[11px] md:tracking-[0.14em]"
        >
          {cta}
          <ArrowRight className="h-4 w-4 md:h-[15px] md:w-[15px]" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
