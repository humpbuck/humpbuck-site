import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import {
  getSeriesBySlug,
  seriesList,
  type SeriesSlug,
} from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardR2GalleryImage } from "@/lib/r2-card-image";
import { normalizeSiteLanguage } from "@/lib/site-i18n";

const slugOk = (s: string | undefined): s is SeriesSlug =>
  s === "digitemp" || s === "tonneau" || s === "rd-astral";

export const metadata: Metadata = {
  title: "Shop — DIGI-TEMP & full catalog",
  description:
    "Browse the HUMPBUCK catalog: DIGI-TEMP ana-digi watches, RM-TONNEAU barrel cases, and RD-ASTRAL — filter by collection.",
  alternates: {
    canonical: "/shop",
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  const { series: seriesParam } = await searchParams;
  const lang = normalizeSiteLanguage((await cookies()).get("site_lang")?.value);
  const copy =
    lang === "es"
      ? {
          badge: "Catalogo",
          title: "Tienda — DIGI-TEMP y catalogo completo",
          byCollection: "Explora por coleccion:",
          all: "Todo",
          showing: "Mostrando",
          item: "articulo",
          items: "articulos",
          empty: "Aun no hay resultados aqui.",
          clearFilter: "Quitar filtro",
          viewAll: "Ver todos los productos",
        }
      : {
          badge: "Catalog",
          title: "Shop — DIGI-TEMP & full catalog",
          byCollection: "Browse by collection:",
          all: "All",
          showing: "Showing",
          item: "item",
          items: "items",
          empty: "Nothing here yet.",
          clearFilter: "Clear filter",
          viewAll: "View all products",
        };
  const active = slugOk(seriesParam) ? seriesParam : null;
  const all = await getMergedCatalogProducts();
  const list = active
    ? all.filter((p) => p.seriesSlug === active)
    : all;

  const cardImages = await Promise.all(
    list.map((p) => getShopCardR2GalleryImage(p.slug)),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {copy.badge}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-3 text-muted">
          {copy.byCollection} <strong className="font-medium text-ink/90">DIGI-TEMP</strong>{" "}
          (ana-digi flagship), <strong className="font-medium text-ink/90">RM-TONNEAU</strong>{" "}
          (tonneau quartz), and RD-ASTRAL. Filters sync to the URL for sharing.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <FilterPill href="/shop" active={active === null} label={copy.all} />
        {seriesList.map((s) => (
          <FilterPill
            key={s.slug}
            href={`/shop?series=${s.slug}`}
            active={active === s.slug}
            label={s.name}
          />
        ))}
      </div>

      {active != null && (
        <p className="mt-6 text-sm text-muted">
          {copy.showing}{" "}
          <span className="font-semibold text-ink">
            {getSeriesBySlug(active)?.name}
          </span>{" "}
          ({list.length} {list.length === 1 ? copy.item : copy.items})
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {list.map((p, i) => (
          <ProductCard
            key={p.slug}
            product={p}
            cardImageUrl={cardImages[i] ?? undefined}
            imagePriority={i < 2}
          />
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          {copy.empty}{" "}
          <Link href="/shop" className="underline underline-offset-4">
            {copy.clearFilter}
          </Link>
        </p>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-[color:var(--color-line)] bg-white/60 text-ink/75 hover:border-ink/15 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
