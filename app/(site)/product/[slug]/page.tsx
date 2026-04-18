import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import {
  formatPrice,
  getProductBySlug,
  getAllProducts,
  getSeriesBySlug,
} from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductImageCarousel } from "@/components/site/ProductImageCarousel";
import { ProductCartSection } from "@/components/site/ProductCartSection";

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const series = getSeriesBySlug(product.seriesSlug);
  const related = getAllProducts()
    .filter((p) => p.slug !== product.slug && p.seriesSlug === product.seriesSlug)
    .slice(0, 3);

  const theme =
    series?.theme === "digital"
      ? "from-cyan-500/15 to-transparent"
      : series?.theme === "luxe"
        ? "from-[color:var(--color-luxe)]/15 to-transparent"
        : "from-violet-500/10 to-transparent";

  const gallerySlides = product.galleryImages ?? product.images;

  return (
    <div>
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <ProductImageCarousel
              alt={product.name}
              images={gallerySlides}
              themeGlowClass={theme}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {product.categoryLabel}
            </div>
            {series && (
              <Link
                href={`/series/${series.slug}`}
                className="mt-2 inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/65 hover:text-ink hover:underline"
              >
                {series.name}
              </Link>
            )}
            <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {product.shortDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <div className="text-3xl font-semibold tabular-nums">
                {formatPrice(product.price)}
              </div>
              {product.compareAtPrice != null && (
                <div className="text-lg text-muted line-through tabular-nums">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
              <div className="text-sm text-muted">
                {product.inStock ? "In stock" : "Out of stock"}
              </div>
            </div>

            <ProductCartSection
              slug={product.slug}
              name={product.name}
              inStock={product.inStock}
              variantOptions={product.variantOptions}
            />

            <div className="mt-10 space-y-3">
              {product.highlights.map((h) => (
                <div key={h} className="flex gap-3 text-sm text-ink/85">
                  <Check
                    className="mt-0.5 shrink-0 text-digital-dim"
                    size={18}
                    strokeWidth={2}
                  />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-6">
              <h2 className="font-serif text-xl">Details</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {product.description}
              </p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.specs.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-xl border border-[color:var(--color-line)] bg-paper px-4 py-3"
                  >
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-[12px] text-muted">
              <Link href="/shipping" className="underline-offset-4 hover:underline">
                Shipping & tax
              </Link>
              <span className="text-[color:var(--color-line)]">·</span>
              <Link href="/refund" className="underline-offset-4 hover:underline">
                Refunds
              </Link>
            </div>
          </div>
        </div>

        {product.detailImages != null && product.detailImages.length > 0 && (
          <section className="mt-16 border-t border-[color:var(--color-line)] pt-14">
            <h2 className="font-serif text-2xl tracking-tight">Closer look</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Detail photography and specifications for {product.name}.
            </p>
            <div className="mt-10 flex flex-col gap-6">
              {product.detailImages.map((src, i) => (
                <div
                  key={src}
                  className="relative overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-paper shadow-sm"
                >
                  <Image
                    src={src}
                    alt={`${product.name} — detail ${i + 1}`}
                    width={1200}
                    height={1600}
                    className="h-auto w-full object-cover"
                    sizes="(max-width:1024px) 100vw, 896px"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t border-[color:var(--color-line)] bg-paper py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-serif text-2xl">You may also like</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
