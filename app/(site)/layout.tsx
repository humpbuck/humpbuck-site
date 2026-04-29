import { Suspense } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteClientEnhancements } from "@/components/site/site-client-enhancements";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteLanguageProvider } from "@/components/site/site-language";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteLanguageProvider>
      <Suspense fallback={null}>
        <SiteClientEnhancements />
      </Suspense>
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pt-[72px] md:pt-[80px]">
        {children}
      </main>
      <SiteFooter />
    </SiteLanguageProvider>
  );
}
