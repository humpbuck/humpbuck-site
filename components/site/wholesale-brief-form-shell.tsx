"use client";

import dynamic from "next/dynamic";

const WholesaleBriefForm = dynamic(
  () =>
    import("@/components/site/WholesaleBriefForm").then((m) => m.WholesaleBriefForm),
  {
    ssr: false,
    loading: () => (
      <div
        className="mt-6 min-h-[280px] animate-pulse rounded-2xl bg-ink/[0.04]"
        aria-hidden
      />
    ),
  },
);

export function WholesaleBriefFormShell({ siteKey }: { siteKey: string }) {
  return <WholesaleBriefForm siteKey={siteKey} />;
}