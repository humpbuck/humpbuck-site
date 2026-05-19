"use client";

import dynamic from "next/dynamic";
import { usePathname } from "@/i18n/navigation";

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

/** Remount the form per route so Turnstile never reuses a torn-down widget host. */
export function WholesaleBriefFormShell({ siteKey }: { siteKey: string }) {
  const pathname = usePathname();
  return <WholesaleBriefForm key={pathname} siteKey={siteKey} />;
}
