import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { StorefrontImage } from "@/components/site/storefront-image";
import { HomeMovementSpotlight } from "@/components/site/home-movement-spotlight";
import { getProductMovement } from "@/lib/catalog";
import { flagshipCategoryBackgroundWebpUrl, mechanicalHeroWebpUrl } from "@/lib/r2";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardImages } from "@/lib/r2-card-image";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { resolveSpotlightBackgroundUrls } from "@/lib/site-home-content";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

export async function HomeMovementCategories() {
  const locale = await getLocale();
  const [t, messages, content] = await Promise.all([
    getTranslations("Home"),
    getMessages(),
    getSiteHomeContent(),
  ]);
  const { desktop: desktopBackground, mobile: mobileBackground } =
    resolveSpotlightBackgroundUrls(content, flagshipCategoryBackgroundWebpUrl());

  const all = await getMergedCatalogProducts();
  const raw =
    all.find((p) => p.homeSpotlight) ??
    all.find((p) => getProductMovement(p) === "mechanical");
  const product = raw ? applyStorefrontProductLocale(raw, locale, messages) : null;
  const { cover } = product
    ? await getShopCardImages(
        product.slug,
        product.image,
        product.galleryImages ?? product.images,
      )
    : { cover: null };
  const productCutout = content.spotlightProductImageUrl.trim();
  const productHref = product ? `/product/${product.slug}` : "/product?movement=mechanical";
  const productImage =
    productCutout || cover || product?.image || mechanicalHeroWebpUrl();

  /** Match `HomeHero` mobile viewport height (85% svh minus header). */
  const spotlightMobileMinH =
    "min-h-[calc((100svh-var(--site-announcement-h,0px)-72px)*0.85)]";

  return (
    <section
      className={`relative flex w-full flex-col overflow-hidden border-b border-line ${spotlightMobileMinH} md:min-h-0 md:aspect-[4/1]`}
      aria-labelledby="home-movement-categories-heading"
    >
      <div className="pointer-events-none absolute inset-0 md:hidden" aria-hidden>
        <StorefrontImage
          src={mobileBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <StorefrontImage
          src={desktopBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <h2 id="home-movement-categories-heading" className="sr-only">
        {t("categoryHeading")}
      </h2>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:absolute md:inset-0 md:flex md:items-center md:py-0 lg:py-0">
        <div className="w-full md:mx-auto">
          <HomeMovementSpotlight
            productHref={productHref}
            productName={product?.name ?? t("categoryMechanicalTitle")}
            imageAlt={product?.name ?? t("categoryMechanicalImageAlt")}
            baseImage={productImage}
            productCutout={Boolean(productCutout)}
            kicker={t("categoryMechanicalKicker")}
            title={product?.name ?? t("categoryMechanicalTitle")}
            cta={t("heroViewProduct")}
            variantOptions={product?.variantOptions ?? []}
          />
        </div>
      </div>
    </section>
  );
}
