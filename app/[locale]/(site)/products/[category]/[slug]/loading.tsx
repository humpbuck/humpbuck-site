import {
  ProductPdpMainFallback,
  ProductPdpRelatedFallback,
  ProductPdpReviewsFallback,
} from "@/components/site/route-section-fallbacks";

/** Instant feedback on product-card click while the PDP RSC payload streams. */
export default function ProductLoading() {
  return (
    <div>
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/[0.08]" aria-hidden />
        <ProductPdpMainFallback />
        <ProductPdpReviewsFallback />
      </div>
      <ProductPdpRelatedFallback />
    </div>
  );
}
