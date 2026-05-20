"use client";

import { useEffect } from "react";
import { runWhenIdle } from "@/lib/defer-non-critical";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

export function TrackProductView({ slug }: { slug: string }) {
  useEffect(() => {
    runWhenIdle(() => {
      trackVisitorEvent(
        {
          type: "product_view",
          productSlug: slug,
        },
        { dedupeKey: `product_view:${slug}` },
      );
    });
  }, [slug]);

  return null;
}
