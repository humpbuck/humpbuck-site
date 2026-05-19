"use client";

import dynamic from "next/dynamic";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";

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

/**
 * Defer wholesale form mount until after route transition so closing the contact
 * modal (body scroll lock, dynamic chunks) cannot race Turnstile initialization.
 */
export function WholesaleBriefFormShell({ siteKey }: { siteKey: string }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!ready) {
    return (
      <div
        className="mt-6 min-h-[280px] animate-pulse rounded-2xl bg-ink/[0.04]"
        aria-hidden
      />
    );
  }

  return <WholesaleBriefForm key={pathname} siteKey={siteKey} />;
}
