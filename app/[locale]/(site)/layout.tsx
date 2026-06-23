import { Suspense } from "react";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SiteAnnouncementBar } from "@/components/site/site-announcement-bar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteDisplayCurrencyShell } from "@/components/site/site-display-currency-shell";
import { SiteClientEnhancements } from "@/components/site/site-client-enhancements";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteAnnouncement } from "@/lib/site-announcement-queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = await getSiteAnnouncement();

  return (
    <SiteDisplayCurrencyShell>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SiteClientEnhancements />
      </Suspense>
      <SiteAnnouncementBar {...announcement} />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[calc(72px+var(--site-announcement-h,0px))] md:pt-[calc(80px+var(--site-announcement-h,0px))]">
        {children}
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </SiteDisplayCurrencyShell>
  );
}
