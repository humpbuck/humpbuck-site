import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { StorefrontImage } from "@/components/site/storefront-image";
import { HomeMovementSpotlight } from "@/components/site/home-movement-spotlight";
import { flagshipCategoryBackgroundWebpUrl } from "@/lib/r2";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardImages } from "@/lib/r2-card-image";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";

/** Homepage spotlight — single catalog product (not a movement category link). */
const HOME_SPOTLIGHT_PRODUCT_SLUG = "9253";

export async function HomeMovementCategories() {
  const locale = await getLocale();
  const t = await getTranslations("Home");
  const messages = await getMessages();
  const sectionBackground = flagshipCategoryBackgroundWebpUrl();

  const raw = (await getMergedCatalogProducts()).find(
    (p) => p.slug === HOME_SPOTLIGHT_PRODUCT_SLUG,
  );
  const product = raw ? applyStorefrontProductLocale(raw, locale, messages) : null;
  const { cover } = product
    ? await getShopCardImages(
        product.slug,
        product.image,
        product.galleryImages ?? product.images,
      )
    : { cover: null };
  const productHref = product ? `/product/${product.slug}` : "/product?movement=mechanical";
  const productImage = cover ?? product?.image;
  if (!productImage) return null;

  return (
    <section
      className="relative overflow-hidden border-b border-line"
      aria-labelledby="home-movement-categories-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <StorefrontImage
          src={sectionBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-paper/82" />
      </div>

      <h2 id="home-movement-categories-heading" className="sr-only">
        {t("categoryHeading")}
      </h2>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-9 lg:py-11">
        <HomeMovementSpotlight
          productHref={productHref}
          productName={product?.name ?? t("categoryMechanicalTitle")}
          imageAlt={product?.name ?? t("categoryMechanicalImageAlt")}
          baseImage={productImage}
          kicker={t("categoryMechanicalKicker")}
          title={product?.name ?? t("categoryMechanicalTitle")}
          cta={t("heroViewProduct")}
          variantOptions={product?.variantOptions ?? []}
        />
      </div>
    </section>
  );
}
