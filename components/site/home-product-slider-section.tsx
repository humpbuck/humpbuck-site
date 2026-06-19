import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HomeRecommendedProductsSlider } from "@/components/site/home-recommended-products-slider";
import { HomeProductsEmptyState } from "@/components/site/home-products-empty-state";
import type { Product } from "@/lib/catalog";

export async function HomeProductSliderSection({
  headingId,
  kicker,
  title,
  viewAllHref,
  viewAllLabel,
  products,
  cardImages,
  cardHoverImages,
  cartSource,
}: {
  headingId: string;
  kicker?: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  products: Product[];
  cardImages: (string | undefined)[];
  cardHoverImages: (string | undefined)[];
  cartSource: string;
}) {
  const t = await getTranslations("Home");

  return (
    <section
      className="relative overflow-hidden border-b border-line bg-paper"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgb(0 0 0 / 0.04), transparent 42%), radial-gradient(circle at 88% 100%, rgb(0 0 0 / 0.03), transparent 38%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          {kicker ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {kicker}
            </p>
          ) : null}
          <h2
            id={headingId}
            className={`font-serif text-3xl tracking-tight sm:text-4xl${kicker ? " mt-3" : ""}`}
          >
            {title}
          </h2>
          <Link
            href={viewAllHref}
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/75 underline-offset-8 transition hover:text-ink hover:underline"
          >
            {viewAllLabel}
            <ArrowRight size={15} strokeWidth={2} aria-hidden />
          </Link>
        </div>

        {products.length > 0 ? (
          <HomeRecommendedProductsSlider
            products={products}
            cardImages={cardImages}
            cardHoverImages={cardHoverImages}
            cartSource={cartSource}
            prevLabel={t("recommendedSliderPrev")}
            nextLabel={t("recommendedSliderNext")}
            scrollLabel={t("recommendedSliderScroll")}
          />
        ) : (
          <HomeProductsEmptyState />
        )}
      </div>
    </section>
  );
}
