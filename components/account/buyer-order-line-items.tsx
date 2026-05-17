import { Link } from "@/i18n/navigation";
import { OrderLineProductImage } from "@/components/account/order-line-product-image";
import { formatPrice } from "@/lib/catalog";
import type { ValidatedLine } from "@/lib/order-lines";
import { orderStatusAllowsReview } from "@/lib/review-eligibility";

type Props = {
  lines: ValidatedLine[];
  /** Order history cards: smaller thumbs; avoid nested links inside outer order `<Link>`. */
  compact?: boolean;
  /** When true, product name links to `/product/[slug]` (use on order detail only). */
  linkToProduct?: boolean;
  className?: string;
  /** Copy for review row (storefront i18n). */
  lineItemLabels?: {
    reviewSubmitted: string;
    writeReview: string;
  };
  /** When set with a paid order, eligible lines show “Write review”. */
  reviewContext?: {
    orderId: string;
    orderStatus: string;
    reviewedProductSlugs: string[];
  };
};

export function BuyerOrderLineItems({
  lines,
  compact = false,
  linkToProduct,
  className = "",
  lineItemLabels,
  reviewContext,
}: Props) {
  const resolvedLink = linkToProduct ?? !compact;
  const reviewSubmitted = lineItemLabels?.reviewSubmitted ?? "Review submitted";
  const writeReview = lineItemLabels?.writeReview ?? "Write review";
  const imgBox = compact
    ? "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-[color:var(--color-line)]"
    : "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-[color:var(--color-line)]";
  const sizes = compact ? "48px" : "64px";

  return (
    <ul className={`space-y-3 text-sm text-ink/90 ${className}`}>
      {lines.map((line, li) => {
        const imgSrc = line.variantImage ?? undefined;
        const alt =
          line.variantLabel != null && line.variantLabel !== ""
            ? `${line.name} — ${line.variantLabel}`
            : line.name;

        const title = (
          <>
            {line.name}
            {line.variantLabel ? ` — ${line.variantLabel}` : ""} × {line.qty}
          </>
        );

        return (
          <li
            key={`${line.slug}-${li}`}
            className="flex flex-wrap items-start justify-between gap-2 border-b border-line/60 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className={imgBox}>
                {imgSrc ? (
                  <OrderLineProductImage
                    src={imgSrc}
                    alt={alt}
                    fallbackLabel={line.name}
                    sizes={sizes}
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-center text-[8px] font-bold uppercase leading-tight text-zinc-500">
                    {line.slug
                      .replace(/[^a-z0-9]+/gi, " ")
                      .trim()
                      .split(/\s+/)
                      .map((s) => s[0] ?? "")
                      .join("")
                      .toUpperCase()
                      .slice(0, 3) || "—"}
                  </div>
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                {resolvedLink ? (
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {title}
                  </Link>
                ) : (
                  <span>{title}</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="tabular-nums text-muted">
                {formatPrice(line.lineTotalCents / 100)}
              </span>
              {reviewContext &&
              orderStatusAllowsReview(reviewContext.orderStatus) ? (
                reviewContext.reviewedProductSlugs.includes(line.slug) ? (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {reviewSubmitted}
                  </span>
                ) : (
                  <Link
                    href={`/account/orders/${reviewContext.orderId}/review/${line.slug}`}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                  >
                    {writeReview}
                  </Link>
                )
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
