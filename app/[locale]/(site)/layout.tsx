import { Suspense } from "react";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteClientEnhancements } from "@/components/site/site-client-enhancements";
import { SiteHeader } from "@/components/site/SiteHeader";
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SiteClientEnhancements />
      </Suspense>
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[72px] md:pt-[80px]">
        {children}
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </>
  );
}
