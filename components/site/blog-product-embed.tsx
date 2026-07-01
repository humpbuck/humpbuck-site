import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { formatPrice, getProductBySlug } from "@/lib/catalog";

export async function BlogProductEmbed({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug.trim());
  if (!product) return null;

  const t = await getTranslations("BlogArticle");
  const imageSrc =
    product.galleryImages?.find((url) => url.trim())?.trim() ||
    product.images.find((url) => url.trim())?.trim() ||
    product.image.trim();
  if (!imageSrc) return null;

  const href = `/product/${product.slug}`;

  return (
    <aside className="my-2 overflow-hidden rounded-2xl border border-line bg-white/60 p-3 sm:p-5">
      <div className="flex flex-row items-center gap-3 sm:gap-4">
        <Link
          href={href}
          className="relative aspect-square w-[128px] shrink-0 overflow-hidden rounded-xl bg-ink/[0.04] ring-1 ring-line/80 sm:w-[168px]"
        >
          <StorefrontImage
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 128px, 168px"
            className="object-cover object-center"
          />
        </Link>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-[10px] sm:tracking-[0.16em]">
            {product.categoryLabel}
          </p>
          <Link
            href={href}
            className="mt-0.5 block font-serif text-base leading-snug text-ink hover:opacity-90 sm:mt-1 sm:text-xl"
          >
            {product.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-2 sm:gap-x-3">
            <span className="text-sm font-semibold tabular-nums text-ink sm:text-base">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice != null ? (
              <span className="text-xs text-muted line-through tabular-nums sm:text-sm">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
          <Link
            href={href}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 sm:mt-2.5 sm:px-3.5 sm:py-2 sm:text-[11px]"
          >
            {t("viewProduct")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
