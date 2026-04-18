import { AttributionCapture } from "@/components/attribution-capture";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ScrollToTopButton } from "@/components/site/ScrollToTopButton";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AttributionCapture />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[72px] md:pt-[80px]">
        {children}
      </main>
      <SiteFooter />
      <ScrollToTopButton />
    </>
  );
}
