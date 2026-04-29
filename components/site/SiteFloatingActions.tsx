"use client";

import dynamic from "next/dynamic";

const WhatsAppFloatingButton = dynamic(
  () =>
    import("@/components/site/WhatsAppFloatingButton").then(
      (m) => m.WhatsAppFloatingButton,
    ),
  { ssr: false },
);

const ScrollToTopButton = dynamic(
  () =>
    import("@/components/site/ScrollToTopButton").then(
      (m) => m.ScrollToTopButton,
    ),
  { ssr: false },
);

const LanguageFloatingSelector = dynamic(
  () =>
    import("@/components/site/LanguageFloatingSelector").then(
      (m) => m.LanguageFloatingSelector,
    ),
  { ssr: false },
);

export function SiteFloatingActions() {
  return (
    <>
      <LanguageFloatingSelector />
      <WhatsAppFloatingButton />
      <ScrollToTopButton />
    </>
  );
}
