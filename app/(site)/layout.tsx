import { Suspense } from "react";
import { GoogleAnalyticsPageviews } from "@/components/analytics/google-analytics-pageviews";
import { SiteAnalyticsConsent } from "@/components/analytics/site-analytics-consent";
import { AttributionCapture } from "@/components/attribution-capture";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ScrollToTopButton } from "@/components/site/ScrollToTopButton";
import { WhatsAppFloatingButton } from "@/components/site/WhatsAppFloatingButton";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteAnalyticsConsent />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageviews />
      </Suspense>
      <Suspense fallback={null}>
        <AttributionCapture />
      </Suspense>
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[72px] md:pt-[80px]">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloatingButton />
      <ScrollToTopButton />
    </>
  );
}
