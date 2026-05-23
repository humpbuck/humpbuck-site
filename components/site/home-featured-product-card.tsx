import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { formatPrice } from "@/lib/catalog";

export type HomeFeaturedCardTheme = "digital" | "luxe" | "mixed";

const themeStyles: Record<
  HomeFeaturedCardTheme,
  {
    card: string;
    gradient: string;
    cta: string;
    focusOutline: string;
    headerTitle: string;
  }
> = {
  digital: {
    card: "border-white/10 bg-[#070a10] shadow-glow-digital",
    gradient: "from-[#070a10] via-transparent to-transparent",
    cta: "bg-cyan-400/90 text-[#06252d] group-hover:bg-cyan-300",
    focusOutline: "focus-visible:outline-cyan-400/80",
    headerTitle: "text-cyan-200/90",
  },
  luxe: {
    card: "border-white/10 bg-[#141210] shadow-card",
    gradient: "from-[#141210] via-black/25 to-transparent",
    cta: "bg-[color:var(--color-luxe)]/95 text-[#1a1306] group-hover:bg-[color:var(--color-luxe)]",
    focusOutline: "focus-visible:outline-[color:var(--color-luxe)]/80",
    headerTitle: "text-[color:var(--color-luxe)]",
  },
  mixed: {
    card: "border-white/10 bg-[#1a1224] shadow-card",
    gradient: "from-[#1a1224] via-violet-950/35 to-transparent",
    cta: "bg-violet-400/90 text-[#1a0a2e] group-hover:bg-violet-300",
    focusOutline: "focus-visible:outline-violet-400/80",
    headerTitle: "text-violet-200/90",
  },
};

export function HomeFeaturedProductCard({
  href,
  imageSrc,
  imageAlt,
  badge,
  seriesShopLabel,
  name,
  price,
  compareAtPrice,
  ctaLabel,
  theme = "digital",
  imagePriority = false,
}: {
  href: string;
  imageSrc: string;
  imageAlt: string;
  badge: string;
  /** Top-left kicker under series name, e.g. “Shop the series”. */
  seriesShopLabel: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  ctaLabel: string;
  theme?: HomeFeaturedCardTheme;
  imagePriority?: boolean;
}) {
  const s = themeStyles[theme];

  return (
    <Link
      href={href}
      className={`group relative block aspect-square overflow-hidden rounded-[24px] border transition outline-offset-4 focus-visible:outline-2 sm:rounded-[28px] ${s.card} ${s.focusOutline}`}
    >
      <StorefrontImage
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={imagePriority}
        fetchPriority={imagePriority ? "high" : undefined}
        quality={72}
        className="object-cover object-center opacity-95 transition group-hover:opacity-100"
        sizes="(max-width:1023px) 92vw, 50vw"
      />
      <div className={`absolute inset-0 bg-linear-to-t ${s.gradient} opacity-55`} />
      <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[70%]">
        <div
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${s.headerTitle}`}
        >
          {badge}
        </div>
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {seriesShopLabel}
        </div>
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">{badge}</div>
            <div className="mt-1 truncate font-serif text-lg text-white">{name}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-semibold tabular-nums text-white">{formatPrice(price)}</div>
            {compareAtPrice != null && (
              <div className="text-[12px] text-white/55 line-through tabular-nums">
                {formatPrice(compareAtPrice)}
              </div>
            )}
          </div>
        </div>
        <span
          className={`mt-4 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition ${s.cta}`}
        >
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}
