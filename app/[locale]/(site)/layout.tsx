import { Suspense } from "react";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SiteAnnouncementBarAsync } from "@/components/site/site-announcement-bar-async";
import { SiteAnnouncementRootStyle } from "@/components/site/site-announcement-root-style";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteDisplayCurrencyShell } from "@/components/site/site-display-currency-shell";
import { SiteClientEnhancements } from "@/components/site/site-client-enhancements";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  getAllProductCategories,
  shopHrefForCategorySlug,
} from "@/lib/product-categories";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let shopCategoryLinks: { href: string; label: string }[] = [];
  try {
    const categories = await getAllProductCategories();
    shopCategoryLinks = categories.map((c) => ({
      href: shopHrefForCategorySlug(c.slug),
      label: c.name,
    }));
  } catch {
    shopCategoryLinks = [];
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
