import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";

export async function ProductCard({
  product,
  imagePriority = false,
  optimizeR2Image = false,
  imageQuality = 60,
  /** When set (e.g. R2-resolved), overrides `product.image` for cards. */
  cardImageUrl,
}: {
  product: Product;
  /** First viewport row(s) of grids — LCP + avoid lazy for above-the-fold. */
  imagePriority?: boolean;
  /**
   * Keep false by default because some R2 WebP objects can intermittently fail through
   * `/_next/image` in certain flows; allow selective opt-in for performance testing pages.
   */
  optimizeR2Image?: boolean;
  imageQuality?: number;
  cardImageUrl?: string;
}) {
  const t = await getTranslations("Product");
  const imgSrc = cardImageUrl?.trim() || product.image;
  const r2Unopt = isR2PublicObjectUrl(imgSrc) && !optimizeR2Image;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <div className="absolute left-3 top-3 z-10 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper">
          {t("sale")}
        </div>
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          priority={imagePriority}
          fetchPriority={imagePriority ? "high" : undefined}
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          quality={imageQuality}
          unoptimized={r2Unopt}
          className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {product.categoryLabel}
        </div>
        <div className="mt-2 font-serif text-base leading-snug text-ink">
          {product.name}
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-base font-semibold tabular-nums">
              {formatPrice(product.price)}
            </div>
            {product.compareAtPrice != null && (
              <div className="text-[12px] text-muted line-through tabular-nums">
                {formatPrice(product.compareAtPrice)}
              </div>
            )}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70 underline-offset-4 group-hover:underline">
            {t("view")}
          </span>
        </div>
      </div>
    </Link>
  );
}
