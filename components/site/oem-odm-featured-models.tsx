import { StorefrontImage } from "@/components/site/storefront-image";
import { Link } from "@/i18n/navigation";
import type { OemOdmFeaturedModel } from "@/lib/oem-odm-featured-slugs";
import { getTranslations } from "next-intl/server";

export async function OemOdmFeaturedModels({
  models,
}: {
  models: OemOdmFeaturedModel[];
}) {
  const t = await getTranslations("OemOdmPage");

  if (models.length === 0) return null;

  return (
    <div className="mt-14 lg:mt-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("featuredModelsKicker")}
        </p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-ink sm:text-3xl">
          {t("featuredModelsHeading")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {t("featuredModelsIntro")}
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {models.map((model) => (
          <li key={model.slug}>
            <Link
              href={`/product/${model.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-(--shadow-card) transition hover:border-luxe/40"
            >
              <div className="relative aspect-square bg-paper/50">
                <StorefrontImage
                  src={model.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <p className="px-3 py-3 text-center text-sm font-semibold text-ink">
                {model.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-sm text-muted">
        <a
          href="#oem-odm-get-started"
          className="font-semibold text-ink underline-offset-2 transition hover:text-digital-dim hover:underline"
        >
          {t("featuredModelsMoreCta")}
        </a>
      </p>
    </div>
  );
}
