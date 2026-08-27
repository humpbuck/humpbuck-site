import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SiteAnnouncementBarAsync } from "@/components/site/site-announcement-bar-async";
import { SiteAnnouncementRootStyle } from "@/components/site/site-announcement-root-style";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteDisplayCurrencyShell } from "@/components/site/site-display-currency-shell";
import { SiteClientEnhancements } from "@/components/site/site-client-enhancements";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  getFixedStorefrontCategories,
  shopSeriesHref,
} from "@/lib/product-categories";
import { fixedStorefrontCategoryNavLinks } from "@/lib/product-category-shared";
import {
  getWatchCategoryBySlug,
  STOREFRONT_WATCH_CATEGORIES,
} from "@/lib/storefront-watch-categories";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tWatch = await getTranslations("WatchCollections");

  let shopCategoryLinks: {
    href: string;
    label: string;
    imageUrl?: string | null;
  }[] = [];
  try {
    const categories = await getFixedStorefrontCategories();
    shopCategoryLinks = categories.map((c) => {
      const def = getWatchCategoryBySlug(c.slug);
      const label = def
        ? tWatch(`${def.messageKey}.name`)
        : c.name;
      return {
        href: shopSeriesHref(c.slug),
        label,
        imageUrl: c.imageUrl,
      };
    });
  } catch {
    shopCategoryLinks = STOREFRONT_WATCH_CATEGORIES.map((c) => ({
      href: c.path,
      label: tWatch(`${c.messageKey}.name`),
    }));
  }

  if (shopCategoryLinks.length === 0) {
    shopCategoryLinks = fixedStorefrontCategoryNavLinks().map((link) => {
      const def = STOREFRONT_WATCH_CATEGORIES.find((c) => c.path === link.href);
      return {
        ...link,
        label: def ? tWatch(`${def.messageKey}.name`) : link.label,
      };
    });
  }

  return (
    <SiteDisplayCurrencyShell>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SiteClientEnhancements />
      </Suspense>
      <SiteAnnouncementRootStyle />
      <Suspense fallback={null}>
        <SiteAnnouncementBarAsync />
      </Suspense>
      <SiteHeader shopCategoryLinks={shopCategoryLinks} />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[calc(72px+var(--site-announcement-h,0px))] md:pt-[calc(80px+var(--site-announcement-h,0px))]">
        {children}
      </main>
      <Suspense fallback={null}>
        <SiteFooter shopCategoryLinks={shopCategoryLinks} />
      </Suspense>
    </SiteDisplayCurrencyShell>
  );
}
