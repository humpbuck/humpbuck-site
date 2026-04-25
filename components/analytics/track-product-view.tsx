"use client";

import { useEffect } from "react";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

export function TrackProductView({ slug }: { slug: string }) {
  useEffect(() => {
    trackVisitorEvent(
      {
        type: "product_view",
        productSlug: slug,
      },
      { dedupeKey: `product_view:${slug}` },
    );
  }, [slug]);

  return null;
}
