"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

export function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString() ?? "";
    trackVisitorEvent(
      {
        type: "page_view",
        path: `${pathname}${query ? `?${query}` : ""}`,
        meta: { pagePath: pathname },
      },
      { dedupeKey: `page_view:${pathname}${query ? `?${query}` : ""}` },
    );
  }, [pathname, searchParams]);

  return null;
}
